import * as THREE from "three";

let player;
const keys = {};
const speed = 6;

const previousPosition = new THREE.Vector3();
const direction = new THREE.Vector3();

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
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

export function updatePlayer(delta) {
  if (!player) return;

  // lưu vị trí cũ
  player.userData.prevPosition.copy(player.position);

  direction.set(0, 0, 0);

  if (keys["w"]) direction.z -= 1;
  if (keys["s"]) direction.z += 1;
  if (keys["a"]) direction.x -= 1;
  if (keys["d"]) direction.x += 1;

  if (direction.lengthSq() > 0) {
    direction.normalize().multiplyScalar(speed * delta);
    player.position.add(direction);
  }

  // khóa trục Y
  player.position.y = 0.5;
}

export function getPlayer() {
  return player;
}