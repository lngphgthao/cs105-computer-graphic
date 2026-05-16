// import * as THREE from "three";
// import { getGameOver } from "./gameState";

// let player;
// const keys = {};
// let baseSpeed = 10;
// let speed = baseSpeed;

// const lanes = [-2, 0, 2];
// let currentLane = 1; // Start in center lane
// let timeAlive = 0;

// export function initPlayer(scene) {
//   player = new THREE.Group();

//   const mesh = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshStandardMaterial({ color: 0x00ff00 })
//   );

//   player.add(mesh);
//   player.position.set(0, 0.5, 5);

//   player.userData.type = "player";
//   player.userData.prevPosition = new THREE.Vector3();

//   scene.add(player);

//   window.addEventListener("keydown", (e) => {
//     const key = e.key.toLowerCase();
//     if (!keys[key] && !getGameOver()) {
//       if ((key === "a" || key === "arrowleft") && currentLane > 0) {
//         currentLane--;
//       } else if ((key === "d" || key === "arrowright") && currentLane < 2) {
//         currentLane++;
//       }
//     }
//     keys[key] = true;
//   });

//   window.addEventListener("keyup", (e) => {
//     keys[e.key.toLowerCase()] = false;
//   });
// }

// export function updatePlayer(delta) {
//   if (!player || getGameOver()) return;

//   timeAlive += delta;
//   speed = baseSpeed + timeAlive * 0.2; // Difficulty scaling: speed increases over time

//   // lưu vị trí cũ
//   player.userData.prevPosition.copy(player.position);

//   // Auto-run movement (forward is negative Z)
//   player.position.z -= speed * delta;

//   // Smooth lane transition
//   const targetX = lanes[currentLane];
//   player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 10 * delta);

//   // khóa trục Y
//   player.position.y = 0.5;
// }

// export function getPlayer() {
//   return player;
// }

import * as THREE from "three";
import { getGameOver } from "./gameState";

let player;
const keys = {};
let baseSpeed = 10;
let speed = baseSpeed;

const lanes = [-2, 0, 2];
let currentLane = 1; // Start in center lane
let timeAlive = 0;

// --- BIẾN QUẢN LÝ HOẠT ẢNH ---
let playerMixer = null;
let playerActions = {};
let activeAction = null;

// Truyền thêm modelLoader vào hàm init
export function initPlayer(scene, modelLoader) {
  player = new THREE.Group();
  
  // Đặt vị trí xuất phát (Y = 0 để chân chạm đất)
  player.position.set(0, 0, 5); 
  player.userData.type = "player";
  player.userData.prevPosition = new THREE.Vector3();

  scene.add(player);

  // --- TẢI MODEL THỎ VÀO TRONG GROUP PLAYER ---
  modelLoader.loadModel('/assets/models/characters/bunny_detective.glb', {
      position: [0, 0, 0], // Tọa độ tương đối so với Group
      scale: [1, 1, 1],
      rotation: [0, Math.PI, 0], // Xoay lưng về camera
      onLoad: (model, gltf) => {
          console.log("🐰 ĐÃ TẢI THỎ DETECTIVE THÀNH CÔNG VÀO PLAYER CONTROLLER!");
          
          // Gắn model thỏ vào Group điều khiển
          player.add(model);

          // Cài đặt AnimationMixer
          playerMixer = new THREE.AnimationMixer(model);
          const clips = gltf.animations;

          clips.forEach((clip) => {
              const action = playerMixer.clipAction(clip);
              playerActions[clip.name.toLowerCase()] = action; 
          });

          // Tự động tìm và chạy animation Run/Walk hoặc Idle
          const runClipName = Object.keys(playerActions).find(name => name.includes('run') || name.includes('walk'));
          const idleClipName = Object.keys(playerActions).find(name => name.includes('idle'));
          const targetAnimation = runClipName || idleClipName;

          if (targetAnimation) {
              activeAction = playerActions[targetAnimation];
              activeAction.play();
          } else if (clips.length > 0) {
              activeAction = playerMixer.clipAction(clips[0]);
              activeAction.play();
          }
      },
      onError: (error) => console.error("🔥 LỖI TẢI THỎ:", error)
  });

  // --- LẮNG NGHE BÀN PHÍM ---
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (!keys[key] && !getGameOver()) {
      if ((key === "a" || key === "arrowleft") && currentLane > 0) {
        currentLane--;
      } else if ((key === "d" || key === "arrowright") && currentLane < 2) {
        currentLane++;
      }
    }
    keys[key] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

export function updatePlayer(delta) {
  if (!player || getGameOver()) return;

  timeAlive += delta;
  speed = baseSpeed + timeAlive * 0.2; // Tăng dần độ khó

  // Lưu vị trí cũ
  player.userData.prevPosition.copy(player.position);

  // Tự động chạy tới trước
  player.position.z -= speed * delta;

  // Chuyển làn mượt mà
  const targetX = lanes[currentLane];
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 10 * delta);

  // Khóa trục Y (Chân chạm đất)
  player.position.y = 0; 

  // --- CẬP NHẬT HOẠT ẢNH LIÊN TỤC ---
  if (playerMixer) {
      playerMixer.update(delta);
  }
}

export function getPlayer() {
  return player;
}