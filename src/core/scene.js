import * as THREE from "three";

export function createScene() {
	const scene = new THREE.Scene();

	scene.background = new THREE.Color(0xbfdcff);
	scene.fog = new THREE.Fog(0xbfdcff, 18, 95);

	return scene;
}
