import * as THREE from "three";
import { getGameOver } from "./gameState";

let player;
const keys = {};
let speed = 8; // Tốc độ di chuyển cố định cho chế độ đi cảnh

// --- BIẾN QUẢN LÝ HOẠT ẢNH ---
let playerMixer = null;
let playerActions = {};
let activeAction = null;

// Hàm chuyển đổi animation mượt mà (cross-fade)
function fadeToAnimation(clipName) {
  const targetAction = playerActions[clipName];
  if (!targetAction || targetAction === activeAction) return;

  if (activeAction) {
    activeAction.fadeOut(0.15);
  }
  targetAction.reset().fadeIn(0.15).play();
  activeAction = targetAction;
}

// Truyền thêm modelLoader vào hàm init
export function initPlayer(scene, modelLoader) {
  player = new THREE.Group();
  
  // Đặt vị trí xuất phát ở trung tâm bản đồ (Y = 0)
  player.position.set(0, 0, 0); 
  player.userData.type = "player";
  player.userData.prevPosition = new THREE.Vector3();

  scene.add(player);

  // --- TẢI MODEL THỎ VÀO TRONG GROUP PLAYER ---
  modelLoader.loadModel('/assets/models/characters/bunny_detective.glb', {
      position: [0, 0, 0], // Tọa độ tương đối so với Group
      scale: [1, 1, 1],
      rotation: [0, Math.PI, 0], // Xoay lưng về camera ban đầu
      onLoad: (model, gltf) => {
          console.log("🐰 ĐÃ TẢI THỎ DETECTIVE THÀNH CÔNG VÀO PLAYER CONTROLLER!");
          
          player.add(model);

          playerMixer = new THREE.AnimationMixer(model);
          const clips = gltf.animations;

          clips.forEach((clip) => {
              const action = playerMixer.clipAction(clip);
              playerActions[clip.name.toLowerCase()] = action; 
          });

          // Chạy animation Idle lúc bắt đầu
          const idleClipName = Object.keys(playerActions).find(name => name.includes('idle'));
          if (idleClipName) {
              activeAction = playerActions[idleClipName];
              activeAction.play();
          } else if (clips.length > 0) {
              activeAction = playerMixer.clipAction(clips[0]);
              activeAction.play();
          }
      },
      onError: (error) => console.error("🔥 LỖI TẢI THỎ DETECTIVE:", error)
  });

  // --- LẮNG NGHE BÀN PHÍM ---
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
  });
}

export function updatePlayer(delta) {
  if (!player || getGameOver()) return;

  // Lưu vị trí cũ đề phòng va chạm hoặc xử lý camera
  player.userData.prevPosition.copy(player.position);

  // --- XỬ LÝ DI CHUYỂN 4 HƯỚNG ---
  let dx = 0;
  let dz = 0;

  if (keys["w"] || keys["arrowup"]) {
    dz -= 1; // Đi lên (hướng Bắc / Z âm)
  }
  if (keys["s"] || keys["arrowdown"]) {
    dz += 1; // Đi xuống (hướng Nam / Z dương)
  }
  if (keys["a"] || keys["arrowleft"]) {
    dx -= 1; // Đi sang trái (hướng Tây / X âm)
  }
  if (keys["d"] || keys["arrowright"]) {
    dx += 1; // Đi sang phải (hướng Đông / X dương)
  }

  const isMoving = dx !== 0 || dz !== 0;

  if (isMoving) {
    // Chuẩn hóa vector di chuyển để di chuyển chéo không bị nhanh hơn
    const moveDir = new THREE.Vector3(dx, 0, dz).normalize();
    
    // Di chuyển nhân vật
    player.position.addScaledVector(moveDir, speed * delta);

    // Giới hạn trong bản đồ 100x100 (từ -48 đến 48 để tránh rơi khỏi rìa đất)
    const mapLimit = 48;
    player.position.x = THREE.MathUtils.clamp(player.position.x, -mapLimit, mapLimit);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -mapLimit, mapLimit);

    // --- XOAY NHÂN VẬT THEO HƯỚNG DI CHUYỂN (MƯỢT MÀ) ---
    // Do thỏ được tải xoay lưng về camera (Math.PI), ta cộng thêm Math.PI vào hướng di chuyển
    const targetAngle = Math.atan2(dx, dz) + Math.PI;
    
    let angleDiff = targetAngle - player.rotation.y;
    // Chuẩn hóa góc chênh lệch trong khoảng [-PI, PI] để xoay theo hướng ngắn nhất
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    player.rotation.y += angleDiff * 15 * delta;

    // --- CHUYỂN SANG HOẠT ẢNH CHẠY ---
    const runClipName = Object.keys(playerActions).find(name => name.includes('run') || name.includes('walk'));
    if (runClipName) {
      fadeToAnimation(runClipName);
    }
  } else {
    // --- CHUYỂN SANG HOẠT ẢNH ĐỨNG YÊN ---
    const idleClipName = Object.keys(playerActions).find(name => name.includes('idle'));
    if (idleClipName) {
      fadeToAnimation(idleClipName);
    }
  }

  // Khóa trục Y ở vị trí mặt đất (0)
  player.position.y = 0; 

  // Cập nhật AnimationMixer
  if (playerMixer) {
      playerMixer.update(delta);
  }
}

export function getPlayer() {
  return player;
}