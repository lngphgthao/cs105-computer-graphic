import * as THREE from "three";

export function spawnCoins(scene, count = 5) {
  const coins = [];

  for (let i = 0; i < count; i++) {
    const coin = new THREE.Mesh(
      new THREE.SphereGeometry(0.4),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    );

    coin.position.set(
      (Math.random() - 0.5) * 10,
      0.5,
      -5 - i * 5
    );

    coin.userData.type = "coin";

    scene.add(coin);
    coins.push(coin);
  }

  return coins;
}

export function spawnObstacles(scene, count = 3) {
  const obstacles = [];

  for (let i = 0; i < count; i++) {
    const obs = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );

    obs.position.set(
      (Math.random() - 0.5) * 10,
      0.5,
      -10 - i * 10
    );

    obs.userData.type = "obstacle";

    scene.add(obs);
    obstacles.push(obs);
  }

  return obstacles;
}