import * as THREE from "three";

export function updateCameraFollow(camera, player) {
  if (!player) return;

  // Keep camera centered on X axis (0) so player movement is visible
  const target = new THREE.Vector3(
    0,
    player.position.y + 6,
    player.position.z + 10
  );

  camera.position.lerp(target, 0.1);

  // Look slightly ahead on the center path
  const lookTarget = new THREE.Vector3(0, player.position.y, player.position.z);
  camera.lookAt(lookTarget);
}