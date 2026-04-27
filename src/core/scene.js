import * as THREE from "three";

export function createScene() {
	const scene = new THREE.Scene();

	scene.background = new THREE.Color(0xc9e6ff);
	scene.fog = new THREE.Fog(0xc9e6ff, 25, 120);

	return scene;
}
