import * as THREE from "three";
import { getGameOver } from "./gameState";

const lanes = [-2, 0, 2];
const SPAWN_DISTANCE = 60; // How far ahead to spawn
const DESPAWN_DISTANCE = 15; // How far behind to despawn

let nextSpawnZ = -10;
let timeAlive = 0;

export function updateSpawning(scene, playerZ, coins, obstacles, delta) {
  if (getGameOver()) return;

  timeAlive += delta;

  // Difficulty scaling for spawn density: decrease spawn interval or distance between rows
  // Base distance between rows is 8, decreases slightly over time to a minimum of 4
  const rowDistance = Math.max(4, 8 - timeAlive * 0.05);

  while (playerZ - SPAWN_DISTANCE < nextSpawnZ) {
    spawnRow(scene, nextSpawnZ, coins, obstacles);
    nextSpawnZ -= rowDistance;
  }

  // Remove old objects and animate coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    coin.rotation.y += delta * 3; // Coin rotation animation

    if (coin.position.z > playerZ + DESPAWN_DISTANCE) {
      scene.remove(coin);
      coins.splice(i, 1);
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (obs.position.z > playerZ + DESPAWN_DISTANCE) {
      scene.remove(obs);
      obstacles.splice(i, 1);
    }
  }
}

function spawnRow(scene, z, coins, obstacles) {
  const availableLanes = [...lanes];

  // As time goes on, obstacle probability increases
  const obsProb = Math.min(0.7, 0.4 + timeAlive * 0.005);

  if (Math.random() < obsProb) {
    const laneIndex = Math.floor(Math.random() * availableLanes.length);
    const obsX = availableLanes.splice(laneIndex, 1)[0];
    const obs = spawnSingleObstacle(scene, obsX, z);
    obstacles.push(obs);

    // Sometimes spawn 2 obstacles in a row at higher difficulties
    if (timeAlive > 30 && Math.random() < 0.3) {
      const laneIndex2 = Math.floor(Math.random() * availableLanes.length);
      const obsX2 = availableLanes.splice(laneIndex2, 1)[0];
      const obs2 = spawnSingleObstacle(scene, obsX2, z);
      obstacles.push(obs2);
    }
  }

  // Spawn coins in remaining empty lanes
  if (Math.random() < 0.5) {
    availableLanes.forEach(laneX => {
      if (Math.random() < 0.6) {
        const coin = spawnSingleCoin(scene, laneX, z);
        coins.push(coin);
      }
    });
  }
}

function spawnSingleCoin(scene, x, z) {
  const coin = new THREE.Mesh(
    new THREE.SphereGeometry(0.4),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  coin.position.set(x, 0.5, z);
  coin.userData.type = "coin";
  coin.userData.value = 10;
  scene.add(coin);
  return coin;
}

function spawnSingleObstacle(scene, x, z) {
  const obs = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  obs.position.set(x, 0.5, z);
  obs.userData.type = "obstacle";
  scene.add(obs);
  return obs;
}