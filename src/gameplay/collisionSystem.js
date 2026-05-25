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

    // Xử lý va chạm với các vật cản (đá) — dùng sphere collider
    if (obstacles && obstacles.length > 0) {
        const playerRadius = 0.35;
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];

            if (obs.type === 'sphere' && obs.center) {
                // Kiểm tra khoảng cách 2D (XZ) giữa player và tâm đá
                const dx = player.position.x - obs.center.x;
                const dz = player.position.z - obs.center.y; // Vector2: y = z
                const distSq = dx * dx + dz * dz;
                const minDist = obs.radius + playerRadius;

                if (distSq < minDist * minDist) {
                    // Va chạm! Đẩy nhân vật ra khỏi đá theo hướng ngược lại
                    const dist = Math.sqrt(distSq);
                    if (dist > 0.001) {
                        // Đẩy ra ngoài vừa đủ để thoát khỏi vùng va chạm
                        const pushX = (dx / dist) * (minDist - dist);
                        const pushZ = (dz / dist) * (minDist - dist);
                        player.position.x += pushX;
                        player.position.z += pushZ;
                    } else {
                        // Trùng vị trí → fallback về vị trí cũ
                        if (player.userData.prevPosition) {
                            player.position.copy(player.userData.prevPosition);
                        }
                    }
                }
            }
        }
    }
}