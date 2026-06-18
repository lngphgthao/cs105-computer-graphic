import * as THREE from "three";

// ==========================================
// THIẾT LẬP KÍCH THƯỚC BẢN ĐỒ (MAP BOUNDARIES)
// ==========================================
// Mặt đất là 100x100 (từ -50 đến +50).
// Chừa một viền nhỏ để asset lớn không bị tràn ra ngoài rìa plane.
const GROUND_HALF_SIZE = 50;
const EDGE_BUFFER = 2;
const MAX_BOUND = GROUND_HALF_SIZE - EDGE_BUFFER; // Giới hạn an toàn: -48 đến +48
const MAP_LIMIT = MAX_BOUND * 2; // = 96 (Dùng để nhân với Math.random)
const GRASS_LIMIT = MAX_BOUND; // Cỏ cũng không được mọc vượt quá 48

// ==========================================
// SEED CONFIGURATION
// ==========================================
const BASE_MAP_SEED = 12345;

const SEEDS = {
	trees: BASE_MAP_SEED + 3,
	mushroomTrees: BASE_MAP_SEED + 1,
	pineTrees: BASE_MAP_SEED + 6,
	glowingMushrooms: BASE_MAP_SEED + 4,
	mushroomsType1: BASE_MAP_SEED + 5,
	mushroomsType2: BASE_MAP_SEED + 6,
	rocks: BASE_MAP_SEED + 7,
	grassType1: BASE_MAP_SEED + 8,
	grassType2: BASE_MAP_SEED + 9,
};

// ==========================================
// ISOLATED PRNG FACTORY - Creates deterministic random generators
// ==========================================
/**
 * Creates a closure-based PRNG (Pseudo-Random Number Generator)
 * @param {number} seed - Initial seed value (must be a 32-bit integer)
 * @returns {function} Random function that returns [0, 1)
 */
function createRandomGenerator(seed) {
	let currentSeed = seed >>> 0; // Ensure 32-bit unsigned integer

	return function random() {
		currentSeed = (currentSeed * 9301 + 49297) % 233280;
		return currentSeed / 233280; // Returns [0, 1)
	};
}

// ==========================================
// SHARED POSITION TRACKING FOR PROXIMITY-BASED GRASS SPAWNING
// ==========================================
const spawnedPositions = {
	trees: [],
	mushroom_trees: [],
	rocks: [],
};

// Timers and spawned mesh trackers so we can cancel/remove on reset
const _delayedTimers = [];
const _spawnedGrassMeshes = [];

export function clearDelayedEnvironmentTasks(scene) {
	// Clear any pending timers
	for (const t of _delayedTimers) {
		clearTimeout(t);
	}
	_delayedTimers.length = 0;

	// Remove any grass meshes we added
	for (const m of _spawnedGrassMeshes) {
		if (m && m.parent === scene) {
			scene.remove(m);
		}
	}
	_spawnedGrassMeshes.length = 0;

	// Reset spawned positions tracking to avoid further proximity placements
	spawnedPositions.trees.length = 0;
	spawnedPositions.mushroom_trees.length = 0;
	spawnedPositions.rocks.length = 0;
}

export function buildEnvironment(scene, modelLoader, obstacles) {
	loadTrees(scene, modelLoader);
	loadMushroomTrees(scene, modelLoader);
	loadPineTrees(scene, modelLoader);
	loadMushrooms(scene, modelLoader);
	loadMushrooms_type1(scene, modelLoader);
	// loadMushrooms_type2(scene, modelLoader);
	loadRocks(scene, modelLoader, obstacles);
	// Load grass AFTER trees/rocks so positions are available
	// (Asynchronous callbacks mean grass will use whatever positions are loaded by then)
	loadGrassType1(scene, modelLoader);
	loadGrassType2(scene, modelLoader);
	// GỌI HÀM BẦU TRỜI NGAY TẠI ĐÂY
	// loadSkyDome(scene, modelLoader);
}

/**
 * Random cluster sampler (legacy, kept for reference)
 */
function createGrassSampler(clusterCount, spread) {
	const clusters = Array.from({ length: clusterCount }, () => ({
		x: (Math.random() - 0.5) * (GRASS_LIMIT * 1.5),
		z: (Math.random() - 0.5) * (GRASS_LIMIT * 1.5),
		radius: spread * (0.7 + Math.random() * 0.6),
	}));

	return () => {
		const cluster = clusters[Math.floor(Math.random() * clusters.length)];
		const angle = Math.random() * Math.PI * 2;
		const distance = Math.sqrt(Math.random()) * cluster.radius;

		return {
			x: THREE.MathUtils.clamp(
				cluster.x + Math.cos(angle) * distance,
				-GRASS_LIMIT,
				GRASS_LIMIT,
			),
			z: THREE.MathUtils.clamp(
				cluster.z + Math.sin(angle) * distance,
				-GRASS_LIMIT,
				GRASS_LIMIT,
			),
		};
	};
}

/**
 * Proximity-based grass sampler with density falloff
 * Spawns grass densely around tree/rock bases, thinning out with distance
 *
 * @param {Object} positions - Reference to spawnedPositions object
 * @param {function} randomFn - Isolated PRNG function for deterministic behavior
 * @param {number} densityRadius - Radius where grass density is high (default 12)
 * @param {number} maxRadius - Maximum radius from object center (default 22)
 */
function createProximityGrassSampler(
	positions,
	randomFn,
	densityRadius = 12,
	maxRadius = 22,
) {
	return () => {
		// Combine all object positions
		let allPositions = [
			...positions.trees,
			...positions.mushroom_trees,
			...positions.rocks,
		];

		// Fallback to random placement if no objects spawned yet
		if (allPositions.length === 0) {
			return {
				x: (randomFn() - 0.5) * (GRASS_LIMIT * 2),
				z: (randomFn() - 0.5) * (GRASS_LIMIT * 2),
			};
		}

		// ⭐ DETERMINISTIC ARRAY SORTING: Sort by x then z
		// This neutralizes the asynchronous push order from different loaders
		allPositions = allPositions.sort((a, b) => {
			return a.x - b.x || a.z - b.z;
		});

		// Pick a random tree/rock as the cluster center from sorted array
		const center = allPositions[Math.floor(randomFn() * allPositions.length)];

		// Generate position with density falloff
		// Closer to center = more likely to have grass
		// Further away = exponentially less likely
		let distance;
		let attemptCount = 0;
		const maxAttempts = 10;

		do {
			distance = Math.sqrt(randomFn()) * maxRadius;
			const densityFalloff = Math.exp(-Math.pow(distance / densityRadius, 2));

			if (randomFn() < densityFalloff) {
				break; // Generated a valid position
			}

			attemptCount++;
		} while (attemptCount < maxAttempts);

		const angle = randomFn() * Math.PI * 2;

		return {
			x: THREE.MathUtils.clamp(
				center.x + Math.cos(angle) * distance,
				-GRASS_LIMIT,
				GRASS_LIMIT,
			),
			z: THREE.MathUtils.clamp(
				center.z + Math.sin(angle) * distance,
				-GRASS_LIMIT,
				GRASS_LIMIT,
			),
		};
	};
}

/**
 * Edge-focused sampler for filling sparse map borders.
 * Places points in an outer ring band near MAX_BOUND.
 */
function createEdgeGrassSampler(randomFn, innerRatio = 0.8) {
	const innerBound = MAX_BOUND * innerRatio;

	return () => {
		const useXBand = randomFn() < 0.5;
		const edgeSign = randomFn() < 0.5 ? -1 : 1;

		if (useXBand) {
			const x = edgeSign * (innerBound + randomFn() * (MAX_BOUND - innerBound));
			const z = (randomFn() - 0.5) * (MAX_BOUND * 2);
			return { x, z };
		}

		const x = (randomFn() - 0.5) * (MAX_BOUND * 2);
		const z = edgeSign * (innerBound + randomFn() * (MAX_BOUND - innerBound));
		return { x, z };
	};
}

// ==========================================
// 0. TẢI TIỂU CẢNH INTRO (DIORAMA)
// ==========================================
export function buildIntroDiorama(scene, modelLoader) {
	// Chỉ tải 1-2 cây và vài cục đá để làm background intro
	modelLoader.loadModel(
		"/assets/models/trees/stylized_nature_pack_vol-1__3d_tree.glb",
		{
			position: [5, 0, -5],
			scale: [1, 1, 1],
			rotation: [0, Math.random() * Math.PI, 0],
			autoAdd: false,
			onLoad: (model) => {
				const tree = model.clone();
				tree.scale.set(1.5, 1.5, 1.5);
				scene.add(tree);
			},
		},
	);

	modelLoader.loadModel(
		"/assets/models/mushroom/stylized_glowing_mushrooms.glb",
		{
			position: [-4, 0, 3],
			scale: [1, 1, 1],
			rotation: [0, Math.random() * Math.PI, 0],
			autoAdd: false,
			onLoad: (model) => {
				const mushroom = model.clone();
				mushroom.scale.set(1.2, 1.2, 1.2);
				mushroom.traverse((child) => {
					if (child.isMesh && child.material) {
						child.material.emissive = new THREE.Color(0x00ffff);
						child.material.emissiveIntensity = 0.8;
					}
				});
				scene.add(mushroom);
			},
		},
	);
}

// ==========================================
// 1. TẢI CÂY
// ==========================================
function loadTrees(scene, modelLoader) {
	modelLoader.loadModel(
		"/assets/models/trees/stylized_nature_pack_vol-1__3d_tree.glb",
		{
			position: [0, -100, 0],
			scale: [1, 1, 1],
			rotation: [0, 0, 0],
			onLoad: (model) => {
				console.log("✅ ĐÃ TẢI FILE GLB! Bắt đầu ép size...");

				// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
				const random = createRandomGenerator(SEEDS.trees);

				const box = new THREE.Box3().setFromObject(model);
				const size = new THREE.Vector3();
				box.getSize(size);
				console.log(`📏 Chiều cao thật của cây gốc: ${size.y.toFixed(2)}`);

				const targetHeight = 18.0;
				const actualHeight = size.y > 0 ? size.y : 1;
				const baseScale = targetHeight / actualHeight;

				const treeCount = 8;

				for (let i = 0; i < treeCount; i++) {
					const treeClone = model.clone();

					const randomX = (random() - 0.5) * MAP_LIMIT;
					const randomZ = (random() - 0.5) * MAP_LIMIT;
					if (Math.abs(randomX) < 4) continue;

					treeClone.position.set(randomX, 0, randomZ);

					// Track this tree's position for proximity grass spawning
					spawnedPositions.trees.push({
						x: randomX,
						z: randomZ,
					});

					const variation = 0.8 + random() * 0.6;
					const finalScale = baseScale * variation;

					treeClone.scale.set(finalScale, finalScale, finalScale);
					treeClone.rotation.set(0, random() * Math.PI * 2, 0);

					scene.add(treeClone);

					if (i === 0) {
						const helper = new THREE.BoxHelper(treeClone, 0xffff00);
						// scene.add(helper);
						console.log(
							`📍 Cây số 1 (viền vàng) đã được ép về chiều cao: ${(targetHeight * variation).toFixed(2)}`,
						);
					}
				}
			},
			onError: (error) => {
				console.error(
					"🔥 LỖI MẠNG: Không tìm thấy file GLB. Hãy check lại đường dẫn!",
					error,
				);
			},
		},
	);
}

// ==========================================
// 1.1 TẢI CÂY NẤM
// ==========================================
function loadMushroomTrees(scene, modelLoader) {
	modelLoader.loadModel("/assets/models/trees/mushroom__tree.glb", {
		position: [0, -100, 0],
		scale: [1, 1, 1],
		rotation: [0, 0, 0],
		onLoad: (model) => {
			console.log("✅ ĐÃ TẢI FILE GLB! Bắt đầu ép size...");

			// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
			const random = createRandomGenerator(SEEDS.mushroomTrees);

			const box = new THREE.Box3().setFromObject(model);
			const size = new THREE.Vector3();
			box.getSize(size);
			console.log(`📏 Chiều cao thật của cây gốc: ${size.y.toFixed(2)}`);

			const targetHeight = 10.0;
			const actualHeight = size.y > 0 ? size.y : 1;
			const baseScale = targetHeight / actualHeight;

			const treeCount = 20;

			for (let i = 0; i < treeCount; i++) {
				const treeClone = model.clone();

				const randomX = (random() - 0.5) * MAP_LIMIT;
				const randomZ = (random() - 0.5) * MAP_LIMIT;
				if (Math.abs(randomX) < 4) continue;

				treeClone.position.set(randomX, 0, randomZ);

				// Track this mushroom tree's position for proximity grass spawning
				spawnedPositions.mushroom_trees.push({
					x: randomX,
					z: randomZ,
				});

				const variation = 0.8 + random() * 0.6;
				const finalScale = baseScale * variation;

				treeClone.scale.set(finalScale, finalScale, finalScale);
				treeClone.rotation.set(0, random() * Math.PI * 2, 0);

				scene.add(treeClone);

				if (i === 0) {
					const helper = new THREE.BoxHelper(treeClone, 0xffff00);
					// scene.add(helper);
					console.log(
						`📍 Cây nấm đã được ép về chiều cao: ${(targetHeight * variation).toFixed(2)}`,
					);
				}
			}
		},
		onError: (error) => {
			console.error(
				"🔥 LỖI MẠNG: Không tìm thấy file GLB. Hãy check lại đường dẫn!",
				error,
			);
		},
	});
}

// ==========================================
// 1.2 TẢI CÂY THÔNG
// ==========================================
function loadPineTrees(scene, modelLoader) {
	modelLoader.loadModel(
		"/assets/models/trees/pine_tree__low_poly_stylized_tree.glb",
		{
			position: [0, -100, 0],
			scale: [1, 1, 1],
			rotation: [0, 0, 0],
			onLoad: (model) => {
				console.log("✅ ĐÃ TẢI FILE GLB! Bắt đầu ép size...");

				// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
				const random = createRandomGenerator(SEEDS.pineTrees);

				const box = new THREE.Box3().setFromObject(model);
				const size = new THREE.Vector3();
				box.getSize(size);
				console.log(`📏 Chiều cao thật của cây gốc: ${size.y.toFixed(2)}`);

				const targetHeight = 15.0;
				const actualHeight = size.y > 0 ? size.y : 1;
				const baseScale = targetHeight / actualHeight;

				const treeCount = 15;

				for (let i = 0; i < treeCount; i++) {
					const treeClone = model.clone();

					const randomX = (random() - 0.5) * MAP_LIMIT;
					const randomZ = (random() - 0.5) * MAP_LIMIT;
					if (Math.abs(randomX) < 4) continue;

					treeClone.position.set(randomX, 0, randomZ);

					// Track this pine tree's position for proximity grass spawning
					spawnedPositions.trees.push({
						x: randomX,
						z: randomZ,
					});

					const variation = 0.8 + random() * 0.6;
					const finalScale = baseScale * variation;

					treeClone.scale.set(finalScale, finalScale, finalScale);
					treeClone.rotation.set(0, random() * Math.PI * 2, 0);

					scene.add(treeClone);

					if (i === 0) {
						const helper = new THREE.BoxHelper(treeClone, 0xffff00);
						// scene.add(helper);
						console.log(
							`📍 Cây nấm đã được ép về chiều cao: ${(targetHeight * variation).toFixed(2)}`,
						);
					}
				}
			},
			onError: (error) => {
				console.error(
					"🔥 LỖI MẠNG: Không tìm thấy file GLB. Hãy check lại đường dẫn!",
					error,
				);
			},
		},
	);
}

// ==========================================
// 2. TẢI NẤM PHÁT SÁNG
// ==========================================
function loadMushrooms(scene, modelLoader) {
	modelLoader.loadModel(
		"/assets/models/mushroom/stylized_glowing_mushrooms.glb",
		{
			position: [0, -100, 0],
			scale: [1, 1, 1],
			rotation: [0, 0, 0],
			onLoad: (model) => {
				console.log("🍄 ĐÃ TẢI NẤM! Bắt đầu rải rác khắp rừng...");

				// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
				const random = createRandomGenerator(SEEDS.glowingMushrooms);

				const box = new THREE.Box3().setFromObject(model);
				const size = new THREE.Vector3();
				box.getSize(size);

				const targetHeight = 1.5;
				const actualHeight = size.y > 0 ? size.y : 1;
				const baseScale = targetHeight / actualHeight;

				const mushroomCount = 100;

				for (let i = 0; i < mushroomCount; i++) {
					const mushroomClone = model.clone();

					const randomX = (random() - 0.5) * MAP_LIMIT;
					const randomZ = (random() - 0.5) * MAP_LIMIT;

					if (Math.abs(randomX) < 4) continue;

					mushroomClone.position.set(randomX, 0, randomZ);

					const variation = 0.5 + random();
					const finalScale = baseScale * variation;

					mushroomClone.scale.set(finalScale, finalScale, finalScale);
					mushroomClone.rotation.set(0, random() * Math.PI * 2, 0);

					mushroomClone.traverse((child) => {
						if (child.isMesh && child.material) {
							child.material.emissive = new THREE.Color(0x00ffff);
							child.material.emissiveIntensity = 0.8;
						}
					});

					scene.add(mushroomClone);
				}
			},
			onError: (error) => {
				console.error("🔥 LỖI TẢI NẤM: Hãy kiểm tra lại đường dẫn!", error);
			},
		},
	);
}

// ==========================================
// 2.1 TẢI NẤM PHÁT SÁNG
// ==========================================
function loadMushrooms_type1(scene, modelLoader) {
	modelLoader.loadModel("/assets/models/mushroom/mushrooms.glb", {
		position: [0, -100, 0],
		scale: [1, 1, 1],
		rotation: [0, 0, 0],
		onLoad: (model) => {
			console.log("🍄 ĐÃ TẢI NẤM! Bắt đầu rải rác khắp rừng...");

			// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
			const random = createRandomGenerator(SEEDS.mushroomsType1);

			const box = new THREE.Box3().setFromObject(model);
			const size = new THREE.Vector3();
			box.getSize(size);

			const targetHeight = 1.5;
			const actualHeight = size.y > 0 ? size.y : 1;
			const baseScale = targetHeight / actualHeight;

			const mushroomCount = 100;

			for (let i = 0; i < mushroomCount; i++) {
				const mushroomClone = model.clone();

				const randomX = (random() - 0.5) * MAP_LIMIT;
				const randomZ = (random() - 0.5) * MAP_LIMIT;

				if (Math.abs(randomX) < 4) continue;

				mushroomClone.position.set(randomX, 0, randomZ);

				const variation = 0.5 + random();
				const finalScale = baseScale * variation;

				mushroomClone.scale.set(finalScale, finalScale, finalScale);
				mushroomClone.rotation.set(0, random() * Math.PI * 2, 0);

				// mushroomClone.traverse((child) => {
				//     if (child.isMesh && child.material) {
				//         child.material.emissive = new THREE.Color(0x00ffff);
				//         child.material.emissiveIntensity = 0.8;
				//     }
				// });

				scene.add(mushroomClone);
			}
		},
		onError: (error) => {
			console.error("🔥 LỖI TẢI NẤM: Hãy kiểm tra lại đường dẫn!", error);
		},
	});
}

// ==========================================
// 2.2 TẢI NẤM PHÁT SÁNG CỐ ĐỊNH, NHỎ, BÁM ĐẤT
// ==========================================
function loadMushrooms_type2(scene, modelLoader) {
	modelLoader.loadModel(
		"/assets/models/mushroom/magical_mushroom_magenta.glb",
		{
			position: [0, -100, 0], // Vị trí tạm của model gốc
			scale: [1, 1, 1],
			rotation: [0, 0, 0],
			onLoad: (model) => {
				// console.log("✅ Tải Magenta Mushrooms cố định");

				// ⭐ CỐ ĐỊNH HẠT GIỐNG ĐỘC LẬP cho loại nấm này (giả sử BASE_MAP_SEED đã khai báo ngoài)
				// Nếu chưa khai báo ngoài, bạn hãy thay bằng createRandomGenerator(12345 + 6);
				const random = createRandomGenerator(SEEDS.mushroomsType2);

				// ⚡⚡ FIX LỖI KHỔNG LỒ (FIX GIANT SIZE BUG) ⚡⚡
				// Cực kỳ quan trọng: Ép Three.js cập nhật toàn bộ ma trận thế giới trước khi đo kích thước.
				model.updateMatrixWorld(true);

				const box = new THREE.Box3().setFromObject(model);
				const size = new THREE.Vector3();
				box.getSize(size);

				// ⭐ THIẾT LẬP KÍCH THƯỚC NHỎ (Ví dụ nấm này nhỏ thôi, cao khoảng 1 mét rưỡi)
				const targetHeight = 0.2;

				// Tránh lỗi chia cho số quá nhỏ (vd 0.0001) bằng cách đặt giới hạn đáy
				const actualHeight = size.y > 0.01 ? size.y : 1;
				const baseScale = targetHeight / actualHeight;

				// ⭐ Thiết lập số lượng nấm cố định
				const treeCount = 10;

				for (let i = 0; i < treeCount; i++) {
					const treeClone = model.clone();

					// ⭐ Cố định toạ độ XZ - Dùng MAP_LIMIT hiện tại
					const randomX = (random() - 0.5) * MAP_LIMIT;
					const randomZ = (random() - 0.5) * MAP_LIMIT;

					// Giữ constraint: Không sinh sản trong đường đi ở giữa
					if (Math.abs(randomX) < 4) continue;

					// ⚡⚡ FIX LỖI MỌC XUYÊN ĐẤT (FIX GROUND POSITION BUG) ⚡⚡
					// Cách tốt nhất để đặt model khít xuống đất Y=0 mà không lo lỗi origin:
					// Chúng ta đo tọa độ Y thấp nhất của model gốc (nhân với scale) và trừ vị trí Y đó.
					const yMin = box.min.y * baseScale;

					// Ta đặt vị trí X và Z cố định, vị trí Y trừ đi phần đáy yMin.
					// Điều này sẽ ép đáy cây nấm nằm khít ở toạ độ Y=0 (Mặt đất).
					// Ta chừa lại một khoảng cực nhỏ (0.01) để model không bị nhấp nháy trên mặt cỏ.
					treeClone.position.set(randomX, -yMin + 0.01, randomZ);

					// ⭐ Cố định Scale variation (nhỏ thôi, không khổng lồ)
					const variation = 0.8 + random() * 0.6;
					const finalScale = baseScale * variation;
					treeClone.scale.set(finalScale, finalScale, finalScale);

					// ⭐ Cố định Rotation ngẫu nhiên
					treeClone.rotation.set(0, random() * Math.PI * 2, 0);

					// ⭐ Cố định visual phát sáng
					treeClone.traverse((child) => {
						if (child.isMesh && child.material) {
							child.material.emissive = new THREE.Color(0xffc0cb);
							child.material.emissiveIntensity = 0.8;
						}
					});

					scene.add(treeClone);

					if (i === 0) {
						// console.log(`📍 Cây nấm số 1 đã được rải tại Y=${(-yMin + 0.01).toFixed(3)}`);
					}
				}
			},
			onError: (error) =>
				console.error("🔥 Lỗi tải Magenta Mushrooms GLB:", error),
		},
	);
}

// ==========================================
// 3. TẢI CỎ LOẠI 1
// ==========================================
function loadGrassType1(scene, modelLoader) {
	modelLoader.loadModel("/assets/models/grass/grass.glb", {
		position: [0, -100, 0],
		scale: [1, 1, 1],
		rotation: [0, 0, 0],
		onLoad: (model) => {
			console.log(
				"🌿 ĐÃ TẢI CỎ LOẠI 1! Đang phủ xanh mặt đất quanh cây và đá...",
			);

			// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
			const random = createRandomGenerator(SEEDS.grassType1);

			const box = new THREE.Box3().setFromObject(model);
			const size = new THREE.Vector3();
			box.getSize(size);

			const targetHeight = 1.8;
			const actualHeight = size.y > 0 ? size.y : 1;
			const baseScale = targetHeight / actualHeight;
			const grassCount = 900;

			const _t = setTimeout(() => {
				// ⭐ Create proximity sampler with isolated PRNG
				const pickPlacement = createProximityGrassSampler(
					spawnedPositions,
					random,
					12,
					22,
				);
				const pickEdgePlacement = createEdgeGrassSampler(random, 0.81);
				for (let i = 0; i < grassCount; i++) {
					const grassClone = model.clone();
					const useEdgePlacement = random() < 0.4;
					const { x, z } = useEdgePlacement
						? pickEdgePlacement()
						: pickPlacement();

					// 1. Chừa đường đi ở giữa cho nhân vật
					if (Math.max(Math.abs(x), Math.abs(z)) < 1.5) continue;

					// 2. ⚡ BỨC TƯỜNG TÀNG HÌNH: Loại bỏ ngay những bụi cỏ mọc tràn ra ngoài mép bản đồ
					if (Math.abs(x) > MAX_BOUND || Math.abs(z) > MAX_BOUND) continue;

					grassClone.position.set(x, 0.015, z);

					const variation = 0.7 + random() * 0.6;
					const finalScale = baseScale * variation;

					grassClone.scale.set(
						finalScale * (0.92 + random() * 0.25),
						finalScale * (0.92 + random() * 0.18),
						finalScale * (0.92 + random() * 0.25),
					);
					grassClone.rotation.set(
						(random() - 0.5) * 0.1,
						random() * Math.PI * 2,
						(random() - 0.5) * 0.1,
					);

					grassClone.traverse((child) => {
						if (child.isMesh) {
							child.castShadow = false;
							child.receiveShadow = true;
						}
					});

					scene.add(grassClone);
					_spawnedGrassMeshes.push(grassClone);
				}
				console.log("🌿 ĐÃ RẢI XONG CỎ LOẠI 1!");
			}, 2500);
			_delayedTimers.push(_t);
		},
		onError: (error) => console.error("🔥 LỖI TẢI CỎ 1:", error),
	});
}

// ==========================================
// 4. TẢI CỎ LOẠI 2
// ==========================================
function loadGrassType2(scene, modelLoader) {
	modelLoader.loadModel("/assets/models/grass/single_grass.glb", {
		position: [0, -100, 0],
		scale: [1, 1, 1],
		rotation: [0, 0, 0],
		onLoad: (model) => {
			console.log("🌱 ĐÃ TẢI CỎ LOẠI 2! Rải xen kẽ quanh cây và đá...");

			// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
			const random = createRandomGenerator(SEEDS.grassType2);

			const box = new THREE.Box3().setFromObject(model);
			const size = new THREE.Vector3();
			box.getSize(size);

			const targetHeight = 0.8;
			const actualHeight = size.y > 0 ? size.y : 1;
			const baseScale = targetHeight / actualHeight;
			const grassCount = 700;

			const _t = setTimeout(() => {
				// ⭐ Create proximity sampler with isolated PRNG
				const pickPlacement = createProximityGrassSampler(
					spawnedPositions,
					random,
					10,
					20,
				);
				const pickEdgePlacement = createEdgeGrassSampler(random, 0.81);
				for (let i = 0; i < grassCount; i++) {
					const grassClone = model.clone();
					const useEdgePlacement = random() < 0.4;
					const { x, z } = useEdgePlacement
						? pickEdgePlacement()
						: pickPlacement();

					// 1. Chừa đường đi ở giữa cho nhân vật
					if (Math.max(Math.abs(x), Math.abs(z)) < 1.5) continue;

					// 2. ⚡ BỨC TƯỜNG TÀNG HÌNH: Loại bỏ cỏ tràn mép
					if (Math.abs(x) > MAX_BOUND || Math.abs(z) > MAX_BOUND) continue;

					grassClone.position.set(x, 0.01, z);

					const variation = 0.7 + random() * 0.6;
					const finalScale = baseScale * variation;

					grassClone.scale.set(
						finalScale * 2.0 * (0.9 + random() * 0.22),
						finalScale * (0.92 + random() * 0.16),
						finalScale * 2.0 * (0.9 + random() * 0.22),
					);
					grassClone.rotation.set(
						(random() - 0.5) * 0.08,
						random() * Math.PI * 2,
						(random() - 0.5) * 0.08,
					);

					grassClone.traverse((child) => {
						if (child.isMesh) {
							child.castShadow = false;
							child.receiveShadow = true;

							if (child.material) {
								child.material.transparent = false;
								child.material.alphaTest = 0.5;
								if (child.material.map) {
									child.material.map.anisotropy = 16;
								}
							}
						}
					});

					scene.add(grassClone);
					_spawnedGrassMeshes.push(grassClone);
				}
				console.log("🌱 ĐÃ RẢI XONG CỎ LOẠI 2!");
			}, 3000); // Cho cỏ loại 2 chờ 3 giây
			_delayedTimers.push(_t);
		},
		onError: (error) => console.error("🔥 LỖI TẢI CỎ 2:", error),
	});
}

// ==========================================
// 5. TẢI ĐÁ
// ==========================================
function loadRocks(scene, modelLoader, obstacles) {
	modelLoader.loadModel("/assets/models/rock/stylized_rock_for_game.glb", {
		position: [0, -100, 0],
		scale: [1, 1, 1],
		rotation: [0, 0, 0],
		onLoad: (model) => {
			console.log("🪨 ĐÃ TẢI ĐÁ! Đang bố trí cảnh quan...");

			// ⭐ LOCAL PRNG INSTANCE: Create isolated random generator for this loader
			const random = createRandomGenerator(SEEDS.rocks);

			const box = new THREE.Box3().setFromObject(model);
			const size = new THREE.Vector3();
			box.getSize(size);

			const targetHeight = 2.0;
			const actualHeight = size.y > 0 ? size.y : 1;
			const baseScale = targetHeight / actualHeight;

			const rockCount = 50;

			for (let i = 0; i < rockCount; i++) {
				const rockClone = model.clone();

				const randomX = (random() - 0.5) * MAP_LIMIT;
				const randomZ = (random() - 0.5) * MAP_LIMIT;

				if (Math.abs(randomX) < 4) continue;

				rockClone.position.set(randomX, -0.8, randomZ);

				// Track this rock's position for proximity grass spawning
				spawnedPositions.rocks.push({
					x: randomX,
					z: randomZ,
				});

				const variation = 0.5 + random() * 1.5;

				const scaleX = baseScale * variation * (0.8 + random() * 0.5);
				const scaleY = baseScale * variation;
				const scaleZ = baseScale * variation * (0.8 + random() * 0.5);

				rockClone.scale.set(scaleX, scaleY, scaleZ);

				rockClone.rotation.set(0, random() * Math.PI * 2, 0);

				rockClone.traverse((child) => {
					if (child.isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;
					}
				});

				scene.add(rockClone);

				if (obstacles) {
					// Đợi updateMatrixWorld để world position của từng child mesh chính xác
					rockClone.updateMatrixWorld(true);

					// Traverse từng child Mesh (mỗi cục đá nhỏ trong model)
					// thay vì tính 1 Box3 bao trọn cả group → tránh block khoảng trống giữa các cục
					rockClone.traverse((child) => {
						if (!child.isMesh) return;

						const childBox = new THREE.Box3().setFromObject(child);
						const childCenter = new THREE.Vector3();
						childBox.getCenter(childCenter);
						const childSize = new THREE.Vector3();
						childBox.getSize(childSize);

						// Bán kính sphere = nửa chiều nhỏ nhất XZ × 0.75
						// (đủ khít phần thân rắn, bỏ qua rìa nhọn nhô ra)
						const minXZ = Math.min(childSize.x, childSize.z);
						const radius = minXZ * 0.75 * 0.5;

						if (radius > 0.1) {
							// Bỏ qua mesh quá nhỏ (lá, decoration...)
							obstacles.push({
								type: "sphere",
								center: new THREE.Vector2(childCenter.x, childCenter.z),
								radius: radius,
							});
						}
					});
				}
			}
		},
		onError: (error) => console.error("🔥 LỖI TẢI ĐÁ:", error),
	});
}

export function loadSkyDome(scene, modelLoader) {
	modelLoader.loadModel("/assets/texture/night_sky.glb", {
		position: [0, 0, 0],
		scale: [1, 1, 1],
		rotation: [0, 0, 0],
		onLoad: (model) => {
			console.log("🌌 ĐÃ TẢI SKYDOME 3D!");

			const box = new THREE.Box3().setFromObject(model);
			const size = new THREE.Vector3();
			box.getSize(size);

			// Ép bầu trời to lên khổng lồ (bán kính 150)
			const targetHeight = 150.0;
			const actualHeight = size.y > 0 ? size.y : 1;
			const baseScale = targetHeight / actualHeight;

			model.scale.set(baseScale, baseScale, baseScale);
			model.name = "SkyDome";
			model.userData.isSkyDome = true;
			model.userData.baseY = 0;

			model.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = false;
					child.receiveShadow = false;
					if (child.material) child.material.fog = false;
				}
			});

			scene.add(model);
			scene.userData.skyDome = model;
		},
		onError: (error) => console.error("🔥 LỖI TẢI BẦU TRỜI GLB:", error),
	});
}
