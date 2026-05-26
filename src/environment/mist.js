import * as THREE from "three";

const MIST_COUNT = 300;
const MIST_AREA_SIZE = 106;
const MIST_LAYER_COUNT = 5;
const MIST_LAYER_HEIGHTS = [0.08, 0.24, 0.48, 0.72, 0.96];
const MIST_LAYER_SCALES = [1.0, 0.82, 0.64, 0.48, 0.32];
const TERRAIN_HALF_SIZE = 50;
const PERIMETER_INNER_RADIUS = 42;
const PERIMETER_OUTER_RADIUS = 82;
const PERIMETER_DENSITY = 0.72;

function randomPerimeterPosition() {
	const angle = Math.random() * Math.PI * 2;
	const radius = THREE.MathUtils.lerp(
		PERIMETER_INNER_RADIUS,
		PERIMETER_OUTER_RADIUS,
		Math.random(),
	);

	return {
		x: Math.cos(angle) * radius,
		z: Math.sin(angle) * radius,
	};
}

function randomInnerPosition() {
	const limit = TERRAIN_HALF_SIZE * 0.7;

	return {
		x: (Math.random() - 0.5) * limit * 2,
		z: (Math.random() - 0.5) * limit * 2,
	};
}

function createMistTexture() {
	const size = 512;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Unable to create mist texture canvas context");
	}

	context.clearRect(0, 0, size, size);
	context.filter = "blur(22px)";

	const softBlobs = [
		{ x: 0.36, y: 0.54, rx: 0.24, ry: 0.12, alpha: 0.52 },
		{ x: 0.5, y: 0.46, rx: 0.3, ry: 0.16, alpha: 0.66 },
		{ x: 0.66, y: 0.54, rx: 0.22, ry: 0.12, alpha: 0.5 },
		{ x: 0.46, y: 0.63, rx: 0.38, ry: 0.16, alpha: 0.42 },
		{ x: 0.58, y: 0.38, rx: 0.16, ry: 0.09, alpha: 0.34 },
	];

	for (const blob of softBlobs) {
		const gradient = context.createRadialGradient(
			blob.x * size,
			blob.y * size,
			size * 0.02,
			blob.x * size,
			blob.y * size,
			size * Math.max(blob.rx, blob.ry),
		);

		gradient.addColorStop(0, `rgba(255,255,255,${blob.alpha})`);
		gradient.addColorStop(0.6, `rgba(255,255,255,${blob.alpha * 0.5})`);
		gradient.addColorStop(1, "rgba(255,255,255,0)");

		context.fillStyle = gradient;
		context.beginPath();
		context.ellipse(
			blob.x * size,
			blob.y * size,
			blob.rx * size,
			blob.ry * size,
			0,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	context.filter = "none";

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;

	return texture;
}

export function createMist() {
	const mistTexture = createMistTexture();
	const sharedMaterial = new THREE.MeshBasicMaterial({
		map: mistTexture,
		color: 0xf6fbff,
		transparent: true,
		depthWrite: false,
		opacity: 0.24,
		fog: true,
	});

	const group = new THREE.Group();
	const meshes = [];

	for (let index = 0; index < MIST_COUNT; index += 1) {
		const layerIndex = index % MIST_LAYER_COUNT;
		const layerHeight = MIST_LAYER_HEIGHTS[layerIndex];
		const baseScale = MIST_LAYER_SCALES[layerIndex];
		const isPerimeterFog = Math.random() < PERIMETER_DENSITY;
		const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sharedMaterial);

		const position = isPerimeterFog
			? randomPerimeterPosition()
			: randomInnerPosition();
		const x = THREE.MathUtils.clamp(
			position.x,
			-MIST_AREA_SIZE * 0.5,
			MIST_AREA_SIZE * 0.5,
		);
		const z = THREE.MathUtils.clamp(
			position.z,
			-MIST_AREA_SIZE * 0.5,
			MIST_AREA_SIZE * 0.5,
		);
		const width =
			THREE.MathUtils.lerp(8.0, isPerimeterFog ? 22.0 : 16.0, Math.random()) *
			baseScale;
		const height =
			THREE.MathUtils.lerp(5.5, isPerimeterFog ? 13.0 : 11.0, Math.random()) *
			baseScale;

		plane.position.set(x, layerHeight, z);
		plane.rotation.x = -Math.PI / 2;
		plane.scale.set(width, height, 1);
		plane.renderOrder = 10 + index;
		plane.userData = {
			basePosition: plane.position.clone(),
			isPerimeterFog,
			baseOpacity: THREE.MathUtils.lerp(
				isPerimeterFog ? 0.2 : 0.1,
				isPerimeterFog ? 0.34 : 0.22,
				Math.random(),
			),
			opacityAmplitude: THREE.MathUtils.lerp(0.01, 0.03, Math.random()),
			opacitySpeed: THREE.MathUtils.lerp(0.05, 0.18, Math.random()),
			opacityPhase: Math.random() * Math.PI * 2,
			driftSpeed: THREE.MathUtils.lerp(0.002, 0.01, Math.random()),
			driftPhase: Math.random() * Math.PI * 2,
			driftRadius: THREE.MathUtils.lerp(
				isPerimeterFog ? 0.08 : 0.12,
				isPerimeterFog ? 0.6 : 0.9,
				Math.random(),
			),
			heightPulse: THREE.MathUtils.lerp(0.005, 0.02, Math.random()),
		};
		plane.onBeforeRender = () => {
			const state = plane.userData;
			const minOpacity = state.isPerimeterFog ? 0.1 : 0.06;
			const maxOpacity = state.isPerimeterFog ? 0.36 : 0.26;
			sharedMaterial.opacity = THREE.MathUtils.clamp(
				state.baseOpacity +
					Math.sin(state.time * state.opacitySpeed + state.opacityPhase) *
						state.opacityAmplitude,
				minOpacity,
				maxOpacity,
			);
		};

		meshes.push(plane);
		group.add(plane);
	}

	return {
		group,
		meshes,
		material: sharedMaterial,
	};
}

export function updateMist(mist, elapsedSeconds) {
	if (!mist) return;

	for (const plane of mist.meshes) {
		const state = plane.userData;
		const drift = elapsedSeconds * state.driftSpeed + state.driftPhase;
		state.time = elapsedSeconds;

		plane.position.x =
			state.basePosition.x + Math.cos(drift) * state.driftRadius;
		plane.position.z =
			state.basePosition.z + Math.sin(drift * 0.9) * state.driftRadius;
		plane.position.y =
			state.basePosition.y + Math.sin(drift * 0.7) * state.heightPulse;
	}
}
