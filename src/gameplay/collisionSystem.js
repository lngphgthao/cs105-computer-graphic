import { getGameOver, getCurrentItem, collectCurrentItem } from "./gameState";

const COLLECTION_DISTANCE = 2.0; // Khoảng cách nhặt vật phẩm (đơn vị Three.js)

export function checkCollision(player, coins, obstacles, scene) {
    if (!player || getGameOver()) return;

    // Chỉ kiểm tra vật phẩm hiện tại (tuần tự, không kiểm tra tất cả)
    const currentItem = getCurrentItem();
    if (!currentItem || currentItem.collected) return;

    // Khoảng cách 2D (X, Z) — bỏ qua trục Y vì vật phẩm lơ lửng
    const dx = player.position.x - currentItem.position.x;
    const dz = player.position.z - currentItem.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < COLLECTION_DISTANCE) {
        console.log(`🎉 THU THẬP THÀNH CÔNG: ${currentItem.name}!`);

        // Xóa mesh khỏi scene ngay lập tức (phản hồi trực quan nhanh)
        if (currentItem.mesh) {
            scene.remove(currentItem.mesh);
        }

        // Cập nhật trạng thái trong gameState (sẽ phát event + chuyển sang item tiếp theo)
        collectCurrentItem();
    }
}