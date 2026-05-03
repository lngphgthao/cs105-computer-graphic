import * as THREE from "three";

let player;
const keys = {};
const speed = 6;

export function initPlayer(scene) {
  player = new THREE.Group();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );

  player.add(mesh);
  player.position.set(0, 0.5, 5);

  // đánh dấu để debug tool không đụng vào
  player.userData.type = "player";

  scene.add(player);

  // input riêng (KHÔNG đụng hệ cũ)
  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

export function updatePlayer(delta) {
  if (!player) return;

  const dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;

  if (dir.length() > 0) {
    dir.normalize().multiplyScalar(speed * delta);
    player.position.add(dir);
  }
}

export function getPlayer() {
  return player;
}