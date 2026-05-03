export function checkCollision(player, coins, obstacles, scene) {
  if (!player) return;

  // coin
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    const dist = player.position.distanceTo(coin.position);

    if (dist < 1) {
      console.log("Collected coin!");

      scene.remove(coin);
      coins.splice(i, 1);
    }
  }

  // obstacle
  for (const obs of obstacles) {
    const dist = player.position.distanceTo(obs.position);

    if (dist < 1) {
      console.log("Hit obstacle!");
    }
  }
}