import * as THREE from "three";
import "./styles.css";

// Core
import {
	createCamera,
	createScene,
	createRenderer,
	initCameraControls,
	moveCamera,
	updateCameraProjection,
	updateCameraFollow,
	autoRotateCamera,
	setupLighting,
	setupResizeHandler,
} from "./core";

// Gameplay
import {
	getPlayer,
	initPlayer,
	resetPlayer,
	updatePlayer,
	MAP_LIMIT,
} from "./gameplay/playerController";

import {
	addScore,
	getGameOver,
	getPaused,
	resetGame,
	togglePause,
} from "./gameplay/gameState";

import {
	checkCollision,
	updateSpawning,
	resetSpawnedItems,
	createModelLoader,
	playCollectSound,
} from "./gameplay";

// UI
import { initGameUI } from "./ui";

// Environment
import {
	buildEnvironment,
	buildIntroDiorama,
	loadSkyDome,
	createGround,
	setObjectRenderMode,
	createMist,
	updateMist,
	clearDelayedEnvironmentTasks,
} from "./environment";

const app = document.getElementById("app");
if (!app) {
	throw new Error("Missing #app container in index.html");
}

let loadingPhase = 1;

THREE.DefaultLoadingManager.onProgress = function (
	url,
	itemsLoaded,
	itemsTotal,
) {
	const percent = (itemsLoaded / itemsTotal) * 100;
	document.dispatchEvent(
		new CustomEvent("loadingProgress", {
			detail: { percent, phase: loadingPhase },
		}),
	);
};

THREE.DefaultLoadingManager.onLoad = function () {
	// Add a small delay to ensure loading screen is visible at 100%
	setTimeout(() => {
		document.dispatchEvent(
			new CustomEvent("loadingComplete", { detail: { phase: loadingPhase } }),
		);
	}, 500);
};

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

// Lắng nghe sự kiện nhặt bảo vật để phát nhạc hiệu
document.addEventListener("itemCollected", () => {
	playCollectSound(listener);
});

// Background and event music (non-positional)
const audioLoader = new THREE.AudioLoader();
const backgroundMusic = new THREE.Audio(listener);
const introMusic = new THREE.Audio(listener);
const winMusic = new THREE.Audio(listener);
const loseMusic = new THREE.Audio(listener);

// Load intro music early
audioLoader.load(
	"/assets/audio/intro.mp3",
	(buffer) => {
		introMusic.setBuffer(buffer);
		introMusic.setLoop(true);
		introMusic.setVolume(0.2);
	},
	undefined,
	(err) => console.warn("No intro music found, user will add it later", err),
);

audioLoader.load(
	"/assets/audio/win.mp3",
	(buffer) => {
		winMusic.setBuffer(buffer);
		winMusic.setLoop(false);
		winMusic.setVolume(0.4);
	},
	undefined,
	(err) => console.warn("No win music found, user will add it later", err),
);

audioLoader.load(
	"/assets/audio/lose.mp3",
	(buffer) => {
		loseMusic.setBuffer(buffer);
		loseMusic.setLoop(false);
		loseMusic.setVolume(0.4);
	},
	undefined,
	(err) => console.warn("No lose music found, user will add it later", err),
);

let phase2Started = false;

// Phase 2 event: triggered from gameUI.js when user clicks PLAY
document.addEventListener("startPhase2Loading", () => {
	if (phase2Started) {
		// Environment is already loaded, transition directly to gameplay story
		document.dispatchEvent(
			new CustomEvent("loadingComplete", { detail: { phase: 2 } }),
		);
		return;
	}
	phase2Started = true;
	loadingPhase = 2;

	// Load the rest of the 3D environment
	buildEnvironment(scene, modelLoader, obstacles);

	// Load heavy background music in Phase 2
	audioLoader.load(
		"/assets/audio/ocean-bloom-jungle.mp3",
		(buffer) => {
			backgroundMusic.setBuffer(buffer);
			backgroundMusic.setLoop(true);
			backgroundMusic.setVolume(0.2);
			try {
				if (musicEnabled) backgroundMusic.play();
			} catch (e) {
				/* autoplay may be blocked */
			}
		},
		undefined,
		(err) => console.warn("No background music found", err),
	);
});

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

// PHASE 1: CHỈ TẢI SKYDOME VÀ BỐ CỤC INTRO
loadSkyDome(scene, modelLoader);
buildIntroDiorama(scene, modelLoader);
let isGameActive = false;

initGameUI({
	renderer,
	scene,
	backgroundMusic,
	introMusic,
	winMusic,
	loseMusic,
	ambientLight,
	sunlight,
	onStartGame: () => {
		isGameActive = true;
	},
	onPauseGame: () => {
		isGameActive = false;
	},
	onResumeGame: () => {
		isGameActive = true;
	},
	onQuitGame: () => {
		isGameActive = false;
		resetGame();
		resetSpawnedItems(scene);
		// Clear any pending delayed environment tasks (grass timers, spawned grass meshes)
		try {
			clearDelayedEnvironmentTasks(scene);
		} catch (e) {
			console.warn("Failed to clear delayed environment tasks:", e);
		}
		resetPlayer();
	},
});

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

	return changed;
}

// Keydown capture blocker to prevent character movement before game starts
window.addEventListener(
	"keydown",
	(e) => {
		if (!isGameActive) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	true,
); // Capture phase!

window.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && isGameActive) {
		togglePause();
	}

	handleCameraKeyboard(event);
});

setupResizeHandler(renderer, camera);

let previousTime = performance.now();
let elapsedTime = 0;

function animate(now) {
	const deltaSeconds = (now - previousTime) / 1000;
	previousTime = now;
	elapsedTime += deltaSeconds;

	if (isGameActive && !getPaused()) {
		if (!getGameOver()) {
			addScore(deltaSeconds * 5);
		}

		updatePlayer(deltaSeconds, camera);
		const player = getPlayer();

		updateSpawning(scene, player.position.z, coins, obstacles, deltaSeconds);
		checkCollision(player, coins, obstacles, scene);
		updateCameraFollow(camera, player, deltaSeconds);

		// Calculate compass angle (rotate compass opposite to camera look direction)
		const dir = new THREE.Vector3();
		camera.getWorldDirection(dir);
		// Compass disc rotation: Math.atan2(-x, -z)
		const angle = Math.atan2(-dir.x, -dir.z) * (180 / Math.PI);
		document.dispatchEvent(
			new CustomEvent("cameraRotated", { detail: { angle } }),
		);
	} else if (!isGameActive) {
		// Just keep the camera updated to follow the player before game starts
		const player = getPlayer();
		if (player) {
			autoRotateCamera(deltaSeconds);
			updateCameraFollow(camera, player, deltaSeconds);
		}
	}

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
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
