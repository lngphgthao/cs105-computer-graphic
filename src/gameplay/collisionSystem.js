import { getGameOver, getCurrentItem, collectCurrentItem } from "./gameState";

const COLLECTION_DISTANCE = 2.0; // Khoảng cách nhặt vật phẩm (đơn vị Three.js)
const COLLECTION_DISTANCE_SQ = COLLECTION_DISTANCE * COLLECTION_DISTANCE; // Dùng bình phương để tránh sqrt

export function checkCollision(player, coins, obstacles, scene) {
    if (!player || getGameOver()) return;

    // Chỉ kiểm tra vật phẩm hiện tại (tuần tự, không kiểm tra tất cả)
    const currentItem = getCurrentItem();
    if (!currentItem || currentItem.collected) return;

    // Khoảng cách 2D (X, Z) — bỏ qua trục Y vì vật phẩm lơ lửng
    // Dùng bình phương khoảng cách để tránh gọi Math.sqrt mỗi frame
    const dx = player.position.x - currentItem.position.x;
    const dz = player.position.z - currentItem.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < COLLECTION_DISTANCE_SQ) {
        console.log(`🎉 THU THẬP THÀNH CÔNG: ${currentItem.name}!`);

        // Xóa mesh khỏi scene ngay lập tức (phản hồi trực quan nhanh)
        if (currentItem.mesh) {
            scene.remove(currentItem.mesh);
        }

        // Cập nhật trạng thái trong gameState (sẽ phát event + chuyển sang item tiếp theo)
        collectCurrentItem();
    }
}