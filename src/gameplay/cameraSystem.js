import * as THREE from "three";

export function updateCameraFollow(camera, player) {
  if (!player) return;

  // Camera bám theo nhân vật trên cả trục X và Z
  // Offset: Cao hơn nhân vật 6 đơn vị (Y) và cách về phía sau 10 đơn vị (Z)
  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 6,
    player.position.z + 10
  );

  // Nội suy mượt mà camera tới vị trí mục tiêu
  camera.position.lerp(target, 0.08);

  // Camera nhìn trực tiếp vào nhân vật (khoảng ngang thân thỏ)
  const lookTarget = new THREE.Vector3(
    player.position.x,
    player.position.y + 0.5,
    player.position.z
  );
  camera.lookAt(lookTarget);
}