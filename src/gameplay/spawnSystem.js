import * as THREE from "three";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";
import { getGameOver, getCurrentItem, getCollectedCount, decrementTime } from "./gameState";

let initialized = false;
let currentItemMesh = null;  // Mesh đang hiển thị trên scene
let currentSpawnedId = null; // ID của item đang hiển thị
let timeAccumulator = 0;

// ============================================================
// HÀM CHÍNH: Gọi mỗi frame từ main.js
// ============================================================
export function updateSpawning(scene, playerZ, coins, obstacles, delta) {
    // Xóa các mảng cũ từ game chạy vô tận (coins, obstacles không dùng nữa)
    // Chỉ xóa 1 lần duy nhất thay vì mỗi frame
    if (!initialized && (coins.length > 0 || obstacles.length > 0)) {
        coins.splice(0, coins.length);
        obstacles.splice(0, obstacles.length);
    }

    // Nếu game đã kết thúc (thắng hoặc thua), dọn dẹp mesh còn lại và dừng
    if (getGameOver()) {
        if (currentItemMesh) {
            scene.remove(currentItemMesh);
            currentItemMesh = null;
            currentSpawnedId = null;
        }
        return;
    }

    // Đếm ngược thời gian
    decrementTime(delta);

    // Lần gọi đầu tiên: phát gợi ý cho vật phẩm #1 và event bắt đầu game
    if (!initialized) {
        initialized = true;
        const firstItem = getCurrentItem();
        if (firstItem) {
            document.dispatchEvent(new CustomEvent("hintReceived", {
                detail: {
                    hint: firstItem.hint,
                    itemName: firstItem.name,
                    itemNumber: 1
                }
            }));
            document.dispatchEvent(new CustomEvent("gameStarted", {
                detail: { firstHint: firstItem.hint }
            }));
        }
    }

    // Kiểm tra xem cần spawn item nào
    const currentItem = getCurrentItem();

    if (currentItem && !currentItem.collected && currentSpawnedId !== currentItem.id) {
        // Xóa mesh vật phẩm cũ (nếu đang hiển thị vật phẩm trước đó)
        if (currentItemMesh) {
            scene.remove(currentItemMesh);
            currentItemMesh = null;
        }

        // Tạo và hiển thị vật phẩm mới
        currentItemMesh = createItemMesh(currentItem);
        currentItem.mesh = currentItemMesh;
        scene.add(currentItemMesh);
        currentSpawnedId = currentItem.id;

        console.log(`🌟 VẬT PHẨM #${getCollectedCount() + 1} XUẤT HIỆN: ${currentItem.name} tại (${currentItem.position.x}, ${currentItem.position.z})`);
    }

    // Animate vật phẩm hiện tại (xoay, lơ lửng)
    timeAccumulator += delta;
    if (currentItemMesh) {
        animateItem(currentItemMesh, delta);
    }
}

// ============================================================
// TẠO MESH CHO TỪNG LOẠI VẬT PHẨM
// ============================================================
function createItemMesh(item) {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.position.x, item.position.y, item.position.z);
    itemGroup.name = item.id;
    itemGroup.userData = {
        itemId: item.id,
        baseY: item.position.y,
        spinSpeed: 1.5
    };

    let coreMesh;
    let color;

    switch (item.id) {
        case "item1": { // Nấm Pha Lê - Hồng
            color = 0xff69b4;
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.25, 0.8, 12),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
            );
            stem.position.y = -0.2;
            const cap = new THREE.Mesh(
                new THREE.ConeGeometry(0.6, 0.5, 12),
                new THREE.MeshStandardMaterial({
                    color, emissive: color, emissiveIntensity: 1.0, roughness: 0.2
                })
            );
            cap.position.y = 0.3;
            coreMesh = new THREE.Group();
            coreMesh.add(stem, cap);
            break;
        }
        case "item2": { // Ấm Trà Vàng
            color = 0xffd700;
            coreMesh = new THREE.Mesh(
                new TeapotGeometry(0.5, 6),
                new THREE.MeshStandardMaterial({
                    color, metalness: 0.9, roughness: 0.1,
                    emissive: 0x443300, emissiveIntensity: 0.5
                })
            );
            break;
        }
        case "item3": { // Bánh Xe Cổ - Xanh ngọc
            color = 0x00ffff;
            coreMesh = new THREE.Mesh(
                new THREE.TorusGeometry(0.45, 0.15, 12, 36),
                new THREE.MeshStandardMaterial({
                    color: 0xddffff, metalness: 1.0, roughness: 0.1,
                    emissive: 0x005555, emissiveIntensity: 0.8
                })
            );
            coreMesh.rotation.x = Math.PI / 2;
            break;
        }
        case "item4": { // Hộp Kho Báu - Xanh lục bảo
            color = 0x32cd32;
            coreMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.7, 0.7),
                new THREE.MeshStandardMaterial({
                    color, emissive: color, emissiveIntensity: 0.8,
                    roughness: 0.3, metalness: 0.5
                })
            );
            break;
        }
        case "item5":
        default: { // Viên Ngọc Rừng - Xanh dương
            color = 0x00bfff;
            coreMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.45, 24, 24),
                new THREE.MeshStandardMaterial({
                    color, transparent: true, opacity: 0.85,
                    emissive: color, emissiveIntensity: 1.2,
                    roughness: 0.05, metalness: 0.9
                })
            );
            break;
        }
    }

    coreMesh.name = "core";
    coreMesh.castShadow = true;
    itemGroup.add(coreMesh);

    // Ánh sáng PointLight (KHÔNG bật castShadow để giữ hiệu năng)
    const light = new THREE.PointLight(color, 2.0, 8);
    light.position.set(0, 0.5, 0);
    itemGroup.add(light);

    // Vòng tròn hiệu ứng dưới đất
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.6, 0.75, 24),
        new THREE.MeshBasicMaterial({
            color, side: THREE.DoubleSide,
            transparent: true, opacity: 0.4
        })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -item.position.y + 0.02;
    ring.name = "ring";
    itemGroup.add(ring);

    return itemGroup;
}

// ============================================================
// HIỆU ỨNG ĐỘNG: Xoay, lơ lửng, vòng tròn co giãn
// ============================================================
function animateItem(group, delta) {
    const core = group.getObjectByName("core");
    if (core) {
        core.rotation.y += group.userData.spinSpeed * delta;
    }

    // Bay lên xuống theo hàm sin
    const newY = group.userData.baseY + Math.sin(timeAccumulator * 2.0) * 0.2;
    group.position.y = newY;

    // Vòng tròn co giãn
    const ring = group.getObjectByName("ring");
    if (ring) {
        const s = 1.0 + Math.sin(timeAccumulator * 3.0) * 0.12;
        ring.scale.set(s, s, 1.0);
        ring.material.opacity = 0.3 + Math.sin(timeAccumulator * 3.0) * 0.15;
    }
}

// Hàm dọn dẹp khi reset game
export function resetSpawnedItems(scene) {
    if (currentItemMesh) {
        scene.remove(currentItemMesh);
        currentItemMesh = null;
    }
    currentSpawnedId = null;
    initialized = false;
    timeAccumulator = 0;
}