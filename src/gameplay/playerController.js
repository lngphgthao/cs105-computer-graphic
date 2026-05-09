import * as THREE from "three";
import { getGameOver } from "./gameState";

let player;
const keys = {};
let baseSpeed = 10;
let speed = baseSpeed;

const lanes = [-2, 0, 2];
let currentLane = 1; // Start in center lane
let timeAlive = 0;

export function initPlayer(scene) {
  player = new THREE.Group();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );

  player.add(mesh);
  player.position.set(0, 0.5, 5);

  player.userData.type = "player";
  player.userData.prevPosition = new THREE.Vector3();

  scene.add(player);

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (!keys[key] && !getGameOver()) {
      if ((key === "a" || key === "arrowleft") && currentLane > 0) {
        currentLane--;
      } else if ((key === "d" || key === "arrowright") && currentLane < 2) {
        currentLane++;
      }
    }
    keys[key] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

export function updatePlayer(delta) {
  if (!player || getGameOver()) return;

  timeAlive += delta;
  speed = baseSpeed + timeAlive * 0.2; // Difficulty scaling: speed increases over time

  // lưu vị trí cũ
  player.userData.prevPosition.copy(player.position);

  // Auto-run movement (forward is negative Z)
  player.position.z -= speed * delta;

  // Smooth lane transition
  const targetX = lanes[currentLane];
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 10 * delta);

  // khóa trục Y
  player.position.y = 0.5;
}

export function getPlayer() {
  return player;
}