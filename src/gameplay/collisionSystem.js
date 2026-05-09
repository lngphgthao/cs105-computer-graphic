const PLAYER_RADIUS = 0.5;
const COIN_RADIUS = 0.4;
const OBSTACLE_RADIUS = 0.5;

let lastHitTime = 0;

export function checkCollision(player, coins, obstacles, scene) {
  if (!player || !player.userData.prevPosition) return;

  const prev = player.userData.prevPosition;

  // coin
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    const dist = player.position.distanceTo(coin.position);

    if (dist < PLAYER_RADIUS + COIN_RADIUS) {
      document.dispatchEvent(
        new CustomEvent("coinCollected", {
          detail: { value: coin.userData.value || 1 }
        })
      );

      scene.remove(coin);
      coins.splice(i, 1);
    }
  }

  // obstacle
  for (const obs of obstacles) {
    const dist = player.position.distanceTo(obs.position);

    if (dist < PLAYER_RADIUS + OBSTACLE_RADIUS + 0.1) {
      const now = performance.now();

      if (now - lastHitTime > 500) {
        document.dispatchEvent(new CustomEvent("hitObstacle"));
        lastHitTime = now;
      }

      player.position.copy(prev);
      break;
    }
  }
}