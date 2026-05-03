import * as THREE from "three";
import { initPlayer, updatePlayer } from "./gameplay/playerController";
import { getPlayer } from "./gameplay/playerController";
import { spawnCoins, spawnObstacles } from "./gameplay/spawnSystem";
import { checkCollision } from "./gameplay/collisionSystem";
import { updateCameraFollow } from "./gameplay/cameraSystem";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createScene } from "./core/scene";
import { createRenderer } from "./core/renderer";
import {
	createCamera,
	moveCamera,
	updateCameraProjection,
} from "./core/camera";
import { setupLighting } from "./core/lighting";
import { setupResizeHandler } from "./core/resize";
import {
	createGround,
	createDemoObjects,
	setObjectRenderMode,
} from "./environment/geometries";
import { createTransformController } from "./gameplay/transformController";
import { createModelLoader } from "./gameplay/modelLoader";
import { createRenderModeController } from "./ui/renderModeController";
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
	far: 220,
	position: { x: 12, y: 10, z: 16 },
});

setupLighting(scene);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.target.set(0, 2, 0);

const ground = createGround();
scene.add(ground);

const demoObjects = createDemoObjects();
for (const object of demoObjects) {
	scene.add(object);
}

initPlayer(scene);

const coins = spawnCoins(scene, 5);
const obstacles = spawnObstacles(scene, 3);


const transformController = createTransformController(demoObjects);

function applyRenderMode(mode) {
	for (const object of demoObjects) {
		setObjectRenderMode(object, mode);
	}
}

const renderModeController = createRenderModeController(applyRenderMode);

const modelLoader = createModelLoader(scene);
window.natureExplorer = {
	loadModel: modelLoader.loadModel,
};

function updateHudInfo() {
	const selectedName = transformController.getSelectedName();
	renderModeController.setExtraInfo([
		`Selected object: ${selectedName}`,
		`Camera position: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`,
		`Camera projection: fov=${camera.fov.toFixed(1)}, near=${camera.near.toFixed(2)}, far=${camera.far.toFixed(1)}`,
	]);
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
	const handledByTransform = transformController.handleKeyboard(event);

	if (handledByCamera || handledByTransform) {
		updateHudInfo();
	}
});

setupResizeHandler(renderer, camera);
updateHudInfo();

let previousTime = performance.now();

function animate(now) {
	const deltaSeconds = (now - previousTime) / 1000;
	previousTime = now;
	
	updatePlayer(deltaSeconds);
	const player = getPlayer();

	checkCollision(player, coins, obstacles, scene);
	updateCameraFollow(camera, player);


	for (const object of demoObjects) {
		if (object.userData.spinSpeed) {
			object.rotation.y += object.userData.spinSpeed * deltaSeconds;
		}
	}

	// controls.update();
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
