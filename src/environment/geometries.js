import * as THREE from "three";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";

function sampleGroundHeight(x, z) {
	return (
		Math.sin(x * 0.12) * Math.cos(z * 0.1) * 0.05 +
		Math.sin((x + z) * 0.07) * 0.03 +
		Math.cos(Math.sqrt(x * x + z * z) * 0.11) * 0.02
	);
}

function createRenderableObject(name, geometry, color, position) {
	const root = new THREE.Group();
	root.name = name;
	root.position.set(position.x, position.y, position.z);

	const solid = new THREE.Mesh(
		geometry,
		new THREE.MeshStandardMaterial({
			color,
			roughness: 0.72,
			metalness: 0.1,
		}),
	);
	solid.castShadow = true;
	solid.receiveShadow = true;

	const lineMaterial = new THREE.MeshBasicMaterial({
		color,
		wireframe: true,
	});
	const lines = new THREE.Mesh(geometry, lineMaterial);

	const points = new THREE.Points(
		geometry,
		new THREE.PointsMaterial({
			color,
			size: 0.08,
			sizeAttenuation: true,
		}),
	);

	root.add(solid, lines, points);

	root.userData.variants = {
		solid,
		lines,
		points,
	};

	return root;
}

export function createDemoObjects() {
	const objects = [];

	objects.push(
		createRenderableObject("cube", new THREE.BoxGeometry(2, 2, 2), 0xa66f47, {
			x: -9,
			y: 1,
			z: -3,
		}),
	);

	objects.push(
		createRenderableObject(
			"sphere",
			new THREE.SphereGeometry(1.35, 36, 24),
			0x5d8ed1,
			{ x: -5, y: 1.35, z: 2 },
		),
	);

	objects.push(
		createRenderableObject(
			"cone",
			new THREE.ConeGeometry(1.2, 2.4, 28),
			0x3f8740,
			{ x: -1, y: 1.2, z: -2 },
		),
	);

	objects.push(
		createRenderableObject(
			"cylinder",
			new THREE.CylinderGeometry(0.9, 0.9, 2.4, 28),
			0x7f5a3e,
			{ x: 3, y: 1.2, z: 2 },
		),
	);

	const torus = createRenderableObject(
		"torus_wheel",
		new THREE.TorusGeometry(1.2, 0.4, 18, 48),
		0x404040,
		{ x: 7, y: 1.2, z: -2 },
	);
	torus.rotation.x = Math.PI / 2;
	torus.userData.spinSpeed = 0.55;
	objects.push(torus);

	const teapot = createRenderableObject(
		"teapot",
		new TeapotGeometry(1.0, 10, true, true, true, false, true),
		0xc46f54,
		{ x: 11, y: 1.05, z: 2 },
	);
	teapot.userData.spinSpeed = 0.35;
	objects.push(teapot);

	return objects;
}

export function setObjectRenderMode(object, mode) {
	const { solid, lines, points } = object.userData.variants;

	solid.visible = mode === "solid";
	lines.visible = mode === "lines";
	points.visible = mode === "points";
}

export function createGround() {
	const grassTexture = new THREE.TextureLoader().load(
		"/assets/texture/grass-1.jpg",
	);
	grassTexture.colorSpace = THREE.SRGBColorSpace;
	grassTexture.wrapS = THREE.RepeatWrapping;
	grassTexture.wrapT = THREE.RepeatWrapping;
	grassTexture.repeat.set(10, 10);
	grassTexture.anisotropy = 16;

	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry(100, 100),
		new THREE.MeshStandardMaterial({
			map: grassTexture,
			color: 0x6d7d71,
			side: THREE.DoubleSide,
		}),
	);
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = 0;
	ground.receiveShadow = true;

	return ground;
}
