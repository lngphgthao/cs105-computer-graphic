export function updateCameraFollow(camera, player) {
  if (!player) return;

  const target = {
    x: player.position.x,
    y: player.position.y + 6,
    z: player.position.z + 10,
  };

  camera.position.lerp(target, 0.1);
  camera.lookAt(player.position);
}