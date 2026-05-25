import * as THREE from "three";

export const DEFAULT_CAMERA_SETTINGS = {
	fov: 60,
	near: 0.1,
	far: 200,
	position: { x: 10, y: 8, z: 14 },
};

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

export function updateCameraFollow(camera, player) {
	if (!player) return;

	// Camera bám theo nhân vật trên cả trục X và Z
	// Offset: Cao hơn nhân vật 6 đơn vị (Y) và cách về phía sau 10 đơn vị (Z)
	const target = new THREE.Vector3(
		player.position.x,
		player.position.y + 5,
		player.position.z + 12,
	);

	// Nội suy mượt mà camera tới vị trí mục tiêu
	camera.position.lerp(target, 0.08);

	// Camera nhìn trực tiếp vào nhân vật (khoảng ngang thân thỏ)
	const lookTarget = new THREE.Vector3(
		player.position.x,
		player.position.y + 0.5,
		player.position.z,
	);
	camera.lookAt(lookTarget);
}
