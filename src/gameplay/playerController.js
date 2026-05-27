import * as THREE from "three";
import { getGameOver } from "./gameState";

// Player runtime state
let player;
const keys = {};
let speed = 8; // Tốc độ di chuyển cố định cho chế độ đi cảnh
export const MAP_LIMIT = 50;

// Animation state
let playerMixer = null;
let playerActions = {};
let activeAction = null;

// Pre-allocated vectors to avoid per-frame garbage collection
const _moveDir = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();

// Helpers
function fadeToAnimation(clipName) {
	const targetAction = playerActions[clipName];
	if (!targetAction || targetAction === activeAction) return;

	if (activeAction) {
		activeAction.fadeOut(0.15);
	}
	targetAction.reset().fadeIn(0.15).play();
	activeAction = targetAction;
}

// Public API
export function initPlayer(scene, modelLoader, listener) {
	player = new THREE.Group();
	scene.add(player);

	// Đặt vị trí xuất phát ở trung tâm bản đồ (Y = 0)
	player.position.set(0, 0, 0);
	player.userData.type = "player";
	player.userData.prevPosition = new THREE.Vector3();

	// --- TẢI MODEL THỎ VÀO TRONG GROUP PLAYER ---
	modelLoader.loadModel("/assets/models/characters/bunny_detective.glb", {
		position: [0, 0, 0], // Tọa độ tương đối so với Group
		scale: [1, 1, 1],
		rotation: [0, Math.PI, 0], // Xoay lưng về camera ban đầu
		onLoad: (model, gltf) => {
			console.log("🐰 ĐÃ TẢI THỎ DETECTIVE THÀNH CÔNG VÀO PLAYER CONTROLLER!");

			player.add(model);

			playerMixer = new THREE.AnimationMixer(model);
			const clips = gltf.animations;

			clips.forEach((clip) => {
				const action = playerMixer.clipAction(clip);
				playerActions[clip.name.toLowerCase()] = action;
			});

			// Chạy animation Idle lúc bắt đầu
			const idleClipName = Object.keys(playerActions).find((name) =>
				name.includes("idle"),
			);
			if (idleClipName) {
				activeAction = playerActions[idleClipName];
				activeAction.play();
			} else if (clips.length > 0) {
				activeAction = playerMixer.clipAction(clips[0]);
				activeAction.play();
			}
		},
		onError: (error) => console.error("🔥 LỖI TẢI THỎ DETECTIVE:", error),
	});
	// --- LẮNG NGHE BÀN PHÍM ---
	window.addEventListener("keydown", (e) => {
		const key = e.key.toLowerCase();
		keys[key] = true;
	});

	window.addEventListener("keyup", (e) => {
		const key = e.key.toLowerCase();
		keys[key] = false;
	});
}

export function updatePlayer(delta, camera) {
	if (!player || getGameOver()) return;

	// Lưu vị trí cũ đề phòng va chạm hoặc xử lý camera
	player.userData.prevPosition.copy(player.position);

	// --- XỬ LÝ DI CHUYỂN 4 HƯỚNG THEO CAMERA ---
	_moveDir.set(0, 0, 0);

	if (camera) {
		// Lấy hướng nhìn của camera
		camera.getWorldDirection(_camForward);
		_camForward.y = 0; // Chiếu lên mặt phẳng XZ
		_camForward.normalize();

		// Tính hướng ngang của camera
		_camRight.crossVectors(_camForward, camera.up).normalize();

		// W/S đi theo hướng nhìn của camera
		if (keys["w"] || keys["arrowup"]) {
			_moveDir.add(_camForward);
		}
		if (keys["s"] || keys["arrowdown"]) {
			_moveDir.sub(_camForward);
		}

		// A/D đi ngang theo góc camera
		if (keys["a"] || keys["arrowleft"]) {
			_moveDir.sub(_camRight);
		}
		if (keys["d"] || keys["arrowright"]) {
			_moveDir.add(_camRight);
		}
	} else {
		// Fallback: Di chuyển theo trục thế giới tuyệt đối nếu không truyền camera
		if (keys["w"] || keys["arrowup"]) _moveDir.z -= 1;
		if (keys["s"] || keys["arrowdown"]) _moveDir.z += 1;
		if (keys["a"] || keys["arrowleft"]) _moveDir.x -= 1;
		if (keys["d"] || keys["arrowright"]) _moveDir.x += 1;
	}

	const isMoving = _moveDir.lengthSq() > 0;

	if (isMoving) {
		_moveDir.normalize();

		// Di chuyển nhân vật
		player.position.addScaledVector(_moveDir, speed * delta);

		// Giới hạn trong bản đồ 100x100 (từ -48 đến 48 để tránh rơi khỏi rìa đất)
		player.position.x = THREE.MathUtils.clamp(
			player.position.x,
			-MAP_LIMIT,
			MAP_LIMIT,
		);
		player.position.z = THREE.MathUtils.clamp(
			player.position.z,
			-MAP_LIMIT,
			MAP_LIMIT,
		);

		// --- XOAY NHÂN VẬT THEO HƯỚNG DI CHUYỂN (MƯỢT MÀ) ---
		// Do thỏ được tải xoay lưng về camera (Math.PI), ta cộng thêm Math.PI vào hướng di chuyển
		const targetAngle = Math.atan2(_moveDir.x, _moveDir.z) + Math.PI;

		let angleDiff = targetAngle - player.rotation.y;
		// Chuẩn hóa góc chênh lệch trong khoảng [-PI, PI] để xoay theo hướng ngắn nhất
		angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
		player.rotation.y += angleDiff * 15 * delta;

		// --- CHUYỂN SANG HOẠT ẢNH CHẠY ---
		const runClipName = Object.keys(playerActions).find(
			(name) => name.includes("run") || name.includes("walk"),
		);
		if (runClipName) {
			fadeToAnimation(runClipName);
		}
		// Khóa trục Y ở vị trí mặt đất (0)
		player.position.y = 0;

		// Cập nhật AnimationMixer
		if (playerMixer) {
			playerMixer.update(delta);
		}
	}
}

export function getPlayer() {
	return player;
}

export function resetPlayer() {
	for (const key in keys) {
		keys[key] = false;
	}

	if (playerMixer) {
		const idleClipName = Object.keys(playerActions).find((name) =>
			name.includes("idle"),
		);
		if (idleClipName) {
			fadeToAnimation(idleClipName);
		}
	}
}
