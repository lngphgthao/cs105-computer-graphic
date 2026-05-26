import * as THREE from "three";

export const DEFAULT_CAMERA_SETTINGS = {
	fov: 60,
	near: 0.1,
	far: 200,
	position: { x: 10, y: 8, z: 14 },
};

// Pre-allocate vector — tránh tạo mới mỗi frame
const _targetPos = new THREE.Vector3();

// =====================================================
// Camera orbit state (tọa độ cầu quanh nhân vật)
// =====================================================
let azimuth = 0; // Góc ngang (rad) — xoay quanh trục Y
let polar = Math.PI / 3; // Góc dọc (rad) — từ đỉnh đầu xuống, PI/3 ≈ 60°
let radius = 14; // Khoảng cách camera đến nhân vật

// Cấu hình
const MOUSE_SENSITIVITY = 0.003;
const ZOOM_SPEED = 1.0;
const MIN_RADIUS = 4;
const MAX_RADIUS = 30;
const MIN_POLAR = 0.2; // Không cho nhìn thẳng đứng từ trên xuống
const MAX_POLAR = Math.PI / 2 - 0.05; // Không cho camera chui xuống dưới đất

let isLocked = false;

export function createCamera(settings = {}) {
	const merged = {
		...DEFAULT_CAMERA_SETTINGS,
		...settings,
		position: {
			...DEFAULT_CAMERA_SETTINGS.position,
			...(settings.position ?? {}),
		},
	};

	const camera = new THREE.PerspectiveCamera(
		merged.fov,
		window.innerWidth / window.innerHeight,
		merged.near,
		merged.far,
	);

	camera.position.set(merged.position.x, merged.position.y, merged.position.z);
	camera.lookAt(0, 2, 0);

	return camera;
}

export function updateCameraProjection(camera, updates = {}) {
	if (typeof updates.fov === "number") {
		camera.fov = THREE.MathUtils.clamp(updates.fov, 20, 100);
	}

	if (typeof updates.near === "number") {
		camera.near = Math.max(0.01, updates.near);
	}

	if (typeof updates.far === "number") {
		camera.far = Math.max(camera.near + 1, updates.far);
	}

	camera.updateProjectionMatrix();
}

export function moveCamera(camera, delta) {
	camera.position.x += delta.x ?? 0;
	camera.position.y += delta.y ?? 0;
	camera.position.z += delta.z ?? 0;
}

// =====================================================
// CẬP NHẬT MỖI FRAME: Camera bám theo nhân vật
// =====================================================
export function updateCameraFollow(camera, player, delta) {
	if (!player) return;

	// Điểm camera nhìn vào: hơi cao hơn chân nhân vật (ngang thân)
	_targetPos.set(player.position.x, player.position.y + 1.5, player.position.z);

	// Tính vị trí camera từ tọa độ cầu (Spherical → Cartesian)
	// Camera đặt ở offset cố định quanh nhân vật, KHÔNG dùng lerp
	// → tránh hiện tượng lag/trôi gây xoay vòng nhân vật
	camera.position.set(
		_targetPos.x + radius * Math.sin(polar) * Math.sin(azimuth),
		_targetPos.y + radius * Math.cos(polar),
		_targetPos.z + radius * Math.sin(polar) * Math.cos(azimuth),
	);

	// Camera luôn nhìn thẳng vào nhân vật
	camera.lookAt(_targetPos);
}

// =====================================================
// CAMERA CONTROLS: Pointer Lock orbit quanh nhân vật
// =====================================================
export function initCameraControls(camera, canvas) {
	// Click vào canvas → khóa chuột (Pointer Lock)
	canvas.addEventListener("click", () => {
		if (!isLocked) {
			const promise = canvas.requestPointerLock();
			if (promise) {
				promise.catch(e => console.warn("Pointer lock blocked (often due to browser cooldown after Esc):", e));
			}
		}
	});

	// Theo dõi trạng thái Pointer Lock
	document.addEventListener("pointerlockchange", () => {
		isLocked = document.pointerLockElement === canvas;
	});

	// Di chuyển chuột → xoay camera quanh nhân vật
	document.addEventListener("mousemove", (e) => {
		if (!isLocked) return;

		azimuth -= e.movementX * MOUSE_SENSITIVITY;
		polar = THREE.MathUtils.clamp(
			polar - e.movementY * MOUSE_SENSITIVITY,
			MIN_POLAR,
			MAX_POLAR,
		);
	});

	// Cuộn chuột → zoom vào/ra
	canvas.addEventListener(
		"wheel",
		(e) => {
			radius = THREE.MathUtils.clamp(
				radius + (e.deltaY > 0 ? ZOOM_SPEED : -ZOOM_SPEED),
				MIN_RADIUS,
				MAX_RADIUS,
			);
			e.preventDefault();
		},
		{ passive: false },
	);
}

// Hàm xoay camera tự động (dành cho Intro Screen)
export function autoRotateCamera(deltaSeconds) {
	// Xoay từ từ theo thời gian (giảm từ 0.3 xuống 0.08 để có góc nhìn chậm rãi, điện ảnh)
	azimuth -= 0.08 * deltaSeconds;
}
