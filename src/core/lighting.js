import * as THREE from "three";

export function setupLighting(scene) {
	const ambientLight = new THREE.AmbientLight(0xb6d9ff, 0.35);
	scene.add(ambientLight);

	const sunlight = new THREE.DirectionalLight(0xffc0cb, 1.25);
	sunlight.position.set(20, 32, 10);
	sunlight.castShadow = true;

	sunlight.shadow.mapSize.width = 2048;
	sunlight.shadow.mapSize.height = 2048;

	sunlight.shadow.camera.near = 1;
	sunlight.shadow.camera.far = 120;
	sunlight.shadow.camera.left = -45;
	sunlight.shadow.camera.right = 45;
	sunlight.shadow.camera.top = 45;
	sunlight.shadow.camera.bottom = -45;
	sunlight.shadow.bias = -0.00012;

    // // 2. Sương mù (Fog) để che viền bản đồ và tạo cảm giác huyền bí
    // // Màu sương mù nên trùng với màu background của scene
    scene.fog = new THREE.Fog(0x2a1b3d, 10, 70); 
    // scene.background = new THREE.Color(0x2a1b3d);

	scene.add(sunlight);
	scene.add(sunlight.target);

	return { ambientLight, sunlight };
}
