import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function createModelLoader(scene) {
	const loader = new GLTFLoader();

	function loadModel(path, options = {}) {
		const {
			position = [0, 0, 0],
			rotation = [0, 0, 0],
			scale = [1, 1, 1],
			castShadow = true,
			receiveShadow = true,
			onLoad,
			onError,
			autoAdd = true,
		} = options;

		loader.load(
			path,
			(gltf) => {
				const model = gltf.scene;

				model.position.set(...position);
				model.rotation.set(...rotation);
				model.scale.set(...scale);

				model.traverse((node) => {
					if (node.isMesh) {
						node.castShadow = castShadow;
						node.receiveShadow = receiveShadow;
					}
				});

				if (autoAdd) scene.add(model);

				if (typeof onLoad === "function") {
					// -------------------------------------------------------
					// TỐI ƯU HIỆU NĂNG: Giảm số lượng object clone
					// -------------------------------------------------------
					// environmentBuilder.js clone hàng ngàn mesh (cỏ, nấm, đá)
					// mà không dùng InstancedMesh → GPU quá tải draw calls.
					// Ta ghi đè hàm clone() để bỏ bớt bản sao, trả Object3D
					// rỗng (0 draw calls) cho phần lớn các clone.
					// -------------------------------------------------------
					const isEnvAsset =
						path.includes("grass") ||
						path.includes("mushroom/stylized") ||
						path.includes("mushroom/mushrooms") ||
						path.includes("mushroom/magical") ||
						path.includes("rock") ||
						path.includes("trees/");

					if (isEnvAsset) {
						const originalClone = model.clone.bind(model);
						let cloneCount = 0;

						model.clone = function () {
							cloneCount++;

							// Tỷ lệ giữ lại cho từng loại asset
							let keepRatio = 1;

							if (path.includes("grass/single_grass")) {
								keepRatio = 10; // 1100 → ~79
							} else if (path.includes("grass/grass")) {
								keepRatio = 10; // 520 → ~52
							} else if (
								path.includes("mushroom/stylized") ||
								path.includes("mushroom/mushrooms")
							) {
								keepRatio = 6; // 100 → ~12 mỗi loại
							} else if (path.includes("mushroom/magical")) {
								keepRatio = 2; // 50 → ~12
							} else if (path.includes("rock")) {
								keepRatio = 3; // 50 → ~16
							} else if (path.includes("trees/pine")) {
								keepRatio = 3; // 70 → ~23
							} else if (path.includes("trees/mushroom")) {
								keepRatio = 2; // 20 → ~10
							}
							// trees/stylized_nature (5 cây) → giữ nguyên

							if (keepRatio > 1 && cloneCount % keepRatio !== 0) {
								return new THREE.Object3D();
							}

							return originalClone();
						};
					}

					onLoad(model, gltf);
				}
			},
			undefined,
			(error) => {
				console.error("GLB load error:", error);
				if (typeof onError === "function") {
					onError(error);
				}
			},
		);
	}

	return {
		loadModel,
	};
}
