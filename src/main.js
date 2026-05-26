import * as THREE from "three";
import {
	createCamera,
	moveCamera,
	updateCameraProjection,
	initCameraControls,
	updateCameraFollow,
} from "./core";
import {
	createScene,
	createRenderer,
	setupLighting,
	setupResizeHandler,
} from "./core";

import { initPlayer, updatePlayer } from "./gameplay/playerController";
import { getPlayer } from "./gameplay/playerController";
import { MAP_LIMIT } from "./gameplay/playerController";
import { updateSpawning } from "./gameplay/spawnSystem";
import { checkCollision } from "./gameplay/collisionSystem";
import { addScore, getScore, getGameOver } from "./gameplay/gameState";
import { createTransformController } from "./gameplay/transformController";
import { createModelLoader } from "./gameplay/modelLoader";

import { buildEnvironment } from "./environment/environmentBuilder";
import { createGround, setObjectRenderMode } from "./environment/geometries";
import { createMist, updateMist } from "./environment/mist";

import "./styles.css";

const app = document.getElementById("app");
if (!app) {
	throw new Error("Missing #app container in index.html");
}

const scene = createScene();
const renderer = createRenderer(app);
const camera = createCamera({
	fov: 62,
	near: 0.1,
	far: 100,
	position: { x: 12, y: 10, z: 16 },
});

// Khởi tạo OrbitControls để cho phép dùng chuột xoay góc nhìn
initCameraControls(camera, renderer.domElement);
// Audio listener for music / positional sounds
const listener = new THREE.AudioListener();
camera.add(listener);

// Background music (non-positional)
const audioLoader = new THREE.AudioLoader();
const backgroundMusic = new THREE.Audio(listener);
audioLoader.load(
	"/assets/audio/ocean-bloom-jungle.mp3",
	(buffer) => {
		backgroundMusic.setBuffer(buffer);
		backgroundMusic.setLoop(true);
		backgroundMusic.setVolume(0.2);
		try {
			backgroundMusic.play();
		} catch (e) {
			/* autoplay may be blocked */
		}
	},
	undefined,
	(err) =>
		console.warn(
			"No background music found at /assets/audio/background_music.mp3",
			err,
		),
);

let musicEnabled = true;
window.addEventListener("keydown", (e) => {
	if (e.code === "KeyB") {
		musicEnabled = !musicEnabled;
		if (musicEnabled) {
			if (backgroundMusic.buffer && !backgroundMusic.isPlaying)
				backgroundMusic.play();
		} else {
			if (backgroundMusic.isPlaying) backgroundMusic.pause();
		}
	}
});
// Setup lighting and keep references so we can adjust them at runtime
const { ambientLight, sunlight } = setupLighting(scene);

// Khởi tạo mặt đất
const terrain = createGround();
scene.add(terrain);

const mist = createMist();
scene.add(mist.group);

const coins = [];
const obstacles = [];
const EDGE_WARNING_DISTANCE = 7;

function createBoundaryCue(mapLimit) {
	const group = new THREE.Group();
	const stripThickness = 2;
	const stripLength = mapLimit * 2 + stripThickness * 2;
	const material = new THREE.MeshBasicMaterial({
		color: 0xdff6ff,
		transparent: true,
		opacity: 0.08,
		depthWrite: false,
		side: THREE.DoubleSide,
		fog: true,
	});

	const north = new THREE.Mesh(
		new THREE.PlaneGeometry(stripLength, stripThickness),
		material,
	);
	north.rotation.x = -Math.PI / 2;
	north.position.set(0, 0.04, -mapLimit);

	const south = north.clone();
	south.position.z = mapLimit;

	const east = new THREE.Mesh(
		new THREE.PlaneGeometry(stripThickness, stripLength),
		material,
	);
	east.rotation.x = -Math.PI / 2;
	east.position.set(mapLimit, 0.04, 0);

	const west = east.clone();
	west.position.x = -mapLimit;

	group.add(north, south, east, west);

	return { group, material };
}

function createBoundaryWarning() {
	const warning = document.createElement("div");
	warning.textContent = "Map boundary reached";
	warning.style.position = "absolute";
	warning.style.left = "50%";
	warning.style.bottom = "28px";
	warning.style.transform = "translateX(-50%)";
	warning.style.padding = "8px 12px";
	warning.style.background = "rgba(11, 26, 33, 0.62)";
	warning.style.border = "1px solid rgba(200, 235, 255, 0.55)";
	warning.style.borderRadius = "999px";
	warning.style.color = "#e6f7ff";
	warning.style.fontFamily = "sans-serif";
	warning.style.fontSize = "13px";
	warning.style.letterSpacing = "0.3px";
	warning.style.zIndex = "9999";
	warning.style.opacity = "0";
	warning.style.transition = "opacity 140ms ease";
	warning.style.pointerEvents = "none";

	app.appendChild(warning);
	return warning;
}

// 1. KHỞI TẠO MODEL LOADER (CHỈ 1 LẦN DUY NHẤT Ở ĐÂY)
const modelLoader = createModelLoader(scene);
const boundaryCue = createBoundaryCue(MAP_LIMIT);
scene.add(boundaryCue.group);
const boundaryWarning = createBoundaryWarning();

// 2. TRUYỀN VÀO PLAYER CONTROLLER ĐỂ TẢI THỎ (đưa listener để thêm âm thanh bước chân)
initPlayer(scene, modelLoader, listener);

// Expose ra window để debug (nếu cần)
window.natureExplorer = {
	loadModel: modelLoader.loadModel,
};

// 2. Chèn dòng này vào để tự động xây dựng toàn bộ khu rừng!
buildEnvironment(scene, modelLoader, obstacles);

// ------- Simple UI controls for lighting and audio -------
function createControlsPanel() {
	const panel = document.createElement("div");
	panel.style.position = "absolute";
	panel.style.right = "12px";
	panel.style.top = "12px";
	panel.style.background = "rgba(0,0,0,0.45)";
	panel.style.color = "#fff";
	panel.style.padding = "8px";
	panel.style.borderRadius = "6px";
	panel.style.fontFamily = "sans-serif";
	panel.style.fontSize = "13px";
	panel.style.zIndex = "9999";

	function makeRow(labelText, min, max, step, initial) {
		const row = document.createElement("div");
		row.style.marginBottom = "6px";

		const label = document.createElement("div");
		label.textContent = labelText;
		label.style.marginBottom = "4px";

		const input = document.createElement("input");
		input.type = "range";
		input.min = String(min);
		input.max = String(max);
		input.step = String(step);
		input.value = String(initial);
		input.style.width = "160px";

		row.appendChild(label);
		row.appendChild(input);
		return { row, input };
	}

	const ambientRow = makeRow(
		"Ambient Light",
		0,
		2,
		0.01,
		ambientLight?.intensity ?? 0.35,
	);
	const sunRow = makeRow("Sun Light", 0, 3, 0.01, sunlight?.intensity ?? 1.25);
	const bgVolRow = makeRow(
		"Music Volume",
		0,
		1,
		0.01,
		backgroundMusic?.getVolume ? backgroundMusic.getVolume() : 0.2,
	);
	const stepVolRow = makeRow("Footstep Vol", 0, 1, 0.01, 0.7);

	panel.appendChild(ambientRow.row);
	panel.appendChild(sunRow.row);
	panel.appendChild(bgVolRow.row);
	panel.appendChild(stepVolRow.row);

	app.appendChild(panel);

	// Wire up events
	ambientRow.input.addEventListener("input", (e) => {
		const v = parseFloat(e.target.value);
		if (ambientLight) ambientLight.intensity = v;
	});

	sunRow.input.addEventListener("input", (e) => {
		const v = parseFloat(e.target.value);
		if (sunlight) sunlight.intensity = v;
	});

	bgVolRow.input.addEventListener("input", (e) => {
		const v = parseFloat(e.target.value);
		try {
			backgroundMusic.setVolume(v);
		} catch (err) {}
	});

	stepVolRow.input.addEventListener("input", (e) => {
		const v = parseFloat(e.target.value);
		const player = getPlayer();
		if (player && player.userData && player.userData.footstep) {
			try {
				player.userData.footstep.setVolume(v);
			} catch (err) {}
		} else {
			// store desired default for later when footstep exists
			player && (player.userData._desiredFootstepVol = v);
		}
	});

	return { panel, controls: { ambientRow, sunRow, bgVolRow, stepVolRow } };
}

const ui = createControlsPanel();

function updateHudInfo() {
	// const selectedName = transformController.getSelectedName();
	// renderModeController.setExtraInfo([
	// 	`Score: ${Math.floor(getScore())}`,
	// 	getGameOver() ? "GAME OVER" : "Playing",
	// 	`Selected object: ${selectedName}`,
	// 	`Camera position: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`,
	// 	`Camera projection: fov=${camera.fov.toFixed(1)}, near=${camera.near.toFixed(2)}, far=${camera.far.toFixed(1)}`,
	// ]);
}

function handleCameraKeyboard(event) {
	const cameraMoveStep = 0.6;
	let changed = false;

	switch (event.code) {
		case "KeyJ":
			moveCamera(camera, { x: -cameraMoveStep });
			changed = true;
			break;
		case "KeyL":
			moveCamera(camera, { x: cameraMoveStep });
			changed = true;
			break;
		case "KeyI":
			moveCamera(camera, { z: -cameraMoveStep });
			changed = true;
			break;
		case "KeyK":
			moveCamera(camera, { z: cameraMoveStep });
			changed = true;
			break;
		case "KeyU":
			moveCamera(camera, { y: cameraMoveStep });
			changed = true;
			break;
		case "KeyO":
			moveCamera(camera, { y: -cameraMoveStep });
			changed = true;
			break;
		case "KeyN":
			updateCameraProjection(camera, { near: camera.near - 0.05 });
			changed = true;
			break;
		case "KeyM":
			updateCameraProjection(camera, { near: camera.near + 0.05 });
			changed = true;
			break;
		case "Comma":
			updateCameraProjection(camera, { far: camera.far - 5 });
			changed = true;
			break;
		case "Period":
			updateCameraProjection(camera, { far: camera.far + 5 });
			changed = true;
			break;
		case "KeyZ":
			updateCameraProjection(camera, { fov: camera.fov - 1 });
			changed = true;
			break;
		case "KeyX":
			updateCameraProjection(camera, { fov: camera.fov + 1 });
			changed = true;
			break;
		default:
			break;
	}

	if (changed) {
		updateHudInfo();
	}

	return changed;
}

window.addEventListener("keydown", (event) => {
	const handledByCamera = handleCameraKeyboard(event);
	const handledByTransform =
		typeof transformController !== "undefined"
			? transformController.handleKeyboard(event)
			: false;

	if (handledByCamera || handledByTransform) {
		updateHudInfo();
	}
});

setupResizeHandler(renderer, camera);
updateHudInfo();

let previousTime = performance.now();
let elapsedTime = 0;

function animate(now) {
	const deltaSeconds = (now - previousTime) / 1000;
	previousTime = now;
	elapsedTime += deltaSeconds;

	if (!getGameOver()) {
		addScore(deltaSeconds * 5);
		updateHudInfo();
	}

	updatePlayer(deltaSeconds, camera);
	const player = getPlayer();
	updateMist(mist, elapsedTime);

	if (player) {
		const edgeDistance =
			MAP_LIMIT -
			Math.max(Math.abs(player.position.x), Math.abs(player.position.z));
		const clampedDistance = Math.max(edgeDistance, 0);
		const warningStrength = THREE.MathUtils.clamp(
			(EDGE_WARNING_DISTANCE - clampedDistance) / EDGE_WARNING_DISTANCE,
			0,
			1,
		);
		const pulse = (Math.sin(elapsedTime * 3.2) * 0.5 + 0.5) * warningStrength;
		boundaryCue.material.opacity = 0.07 + warningStrength * 0.18 + pulse * 0.08;
		boundaryWarning.style.opacity = warningStrength > 0.03 ? "1" : "0";
	}

	const skyDome = scene.userData.skyDome;
	if (skyDome) {
		skyDome.position.set(
			camera.position.x,
			skyDome.userData.baseY ?? 0,
			camera.position.z,
		);
	}

	updateSpawning(scene, player.position.z, coins, obstacles, deltaSeconds);
	checkCollision(player, coins, obstacles, scene);
	updateCameraFollow(camera, player, deltaSeconds);

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
