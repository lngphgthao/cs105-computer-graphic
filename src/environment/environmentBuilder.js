import * as THREE from "three";

export function buildEnvironment(scene, modelLoader, obstacles) {
    loadTrees(scene, modelLoader);
    loadMushroomTrees(scene, modelLoader);
    // loadPineTrees(scene, modelLoader);
    loadMushrooms(scene, modelLoader);
    loadMushrooms_type1(scene, modelLoader);
    // loadMushrooms_type2(scene, modelLoader);
    loadGrassType1(scene, modelLoader);
    loadGrassType2(scene, modelLoader);
    loadRocks(scene, modelLoader, obstacles);
    // GỌI HÀM BẦU TRỜI NGAY TẠI ĐÂY
    loadSkyDome(scene, modelLoader);
}

// ==========================================
// 1. TẢI CÂY
// ==========================================
function loadTrees(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/trees/stylized_nature_pack_vol-1__3d_tree.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("✅ ĐÃ TẢI FILE GLB! Bắt đầu ép size...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            console.log(`📏 Chiều cao thật của cây gốc: ${size.y.toFixed(2)}`);

            const targetHeight = 18.0;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const treeCount = 5;

            for (let i = 0; i < treeCount; i++) {
                const treeClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;
                if (Math.abs(randomX) < 4) continue;

                treeClone.position.set(randomX, 0, randomZ);

                const variation = 0.8 + (Math.random() * 0.6);
                const finalScale = baseScale * variation;

                treeClone.scale.set(finalScale, finalScale, finalScale);
                treeClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                scene.add(treeClone);

                if (i === 0) {
                    const helper = new THREE.BoxHelper(treeClone, 0xffff00);
                    scene.add(helper);
                    console.log(`📍 Cây số 1 (viền vàng) đã được ép về chiều cao: ${(targetHeight * variation).toFixed(2)}`);
                }
            }
        },
        onError: (error) => {
            console.error("🔥 LỖI MẠNG: Không tìm thấy file GLB. Hãy check lại đường dẫn!", error);
        }
    });
}


// ==========================================
// 1.1 TẢI CÂY NẤM
// ==========================================
function loadMushroomTrees(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/trees/mushroom__tree.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("✅ ĐÃ TẢI FILE GLB! Bắt đầu ép size...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            console.log(`📏 Chiều cao thật của cây gốc: ${size.y.toFixed(2)}`);

            const targetHeight = 10.0;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const treeCount = 20;

            for (let i = 0; i < treeCount; i++) {
                const treeClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;
                if (Math.abs(randomX) < 4) continue;

                treeClone.position.set(randomX, 0, randomZ);

                const variation = 0.8 + (Math.random() * 0.6);
                const finalScale = baseScale * variation;

                treeClone.scale.set(finalScale, finalScale, finalScale);
                treeClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                scene.add(treeClone);

                if (i === 0) {
                    const helper = new THREE.BoxHelper(treeClone, 0xffff00);
                    scene.add(helper);
                    console.log(`📍 Cây nấm đã được ép về chiều cao: ${(targetHeight * variation).toFixed(2)}`);
                }
            }
        },
        onError: (error) => {
            console.error("🔥 LỖI MẠNG: Không tìm thấy file GLB. Hãy check lại đường dẫn!", error);
        }
    });
}


// ==========================================
// 1.2 TẢI CÂY THÔNG
// ==========================================
function loadPineTrees(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/trees/pine_tree__low_poly_stylized_tree.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("✅ ĐÃ TẢI FILE GLB! Bắt đầu ép size...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            console.log(`📏 Chiều cao thật của cây gốc: ${size.y.toFixed(2)}`);

            const targetHeight = 15.0;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const treeCount = 70;

            for (let i = 0; i < treeCount; i++) {
                const treeClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;
                if (Math.abs(randomX) < 4) continue;

                treeClone.position.set(randomX, 0, randomZ);

                const variation = 0.8 + (Math.random() * 0.6);
                const finalScale = baseScale * variation;

                treeClone.scale.set(finalScale, finalScale, finalScale);
                treeClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                scene.add(treeClone);

                if (i === 0) {
                    const helper = new THREE.BoxHelper(treeClone, 0xffff00);
                    scene.add(helper);
                    console.log(`📍 Cây nấm đã được ép về chiều cao: ${(targetHeight * variation).toFixed(2)}`);
                }
            }
        },
        onError: (error) => {
            console.error("🔥 LỖI MẠNG: Không tìm thấy file GLB. Hãy check lại đường dẫn!", error);
        }
    });
}

// ==========================================
// 2. TẢI NẤM PHÁT SÁNG
// ==========================================
function loadMushrooms(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/mushroom/stylized_glowing_mushrooms.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("🍄 ĐÃ TẢI NẤM! Bắt đầu rải rác khắp rừng...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);

            const targetHeight = 1.5;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const mushroomCount = 100;

            for (let i = 0; i < mushroomCount; i++) {
                const mushroomClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;

                if (Math.abs(randomX) < 4) continue;

                mushroomClone.position.set(randomX, 0, randomZ);

                const variation = 0.5 + Math.random();
                const finalScale = baseScale * variation;

                mushroomClone.scale.set(finalScale, finalScale, finalScale);
                mushroomClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                mushroomClone.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.emissive = new THREE.Color(0x00ffff);
                        child.material.emissiveIntensity = 0.8;
                    }
                });

                scene.add(mushroomClone);
            }
        },
        onError: (error) => {
            console.error("🔥 LỖI TẢI NẤM: Hãy kiểm tra lại đường dẫn!", error);
        }
    });
}

// ==========================================
// 2.1 TẢI NẤM PHÁT SÁNG
// ==========================================
function loadMushrooms_type1(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/mushroom/mushrooms.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("🍄 ĐÃ TẢI NẤM! Bắt đầu rải rác khắp rừng...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);

            const targetHeight = 1.5;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const mushroomCount = 100;

            for (let i = 0; i < mushroomCount; i++) {
                const mushroomClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;

                if (Math.abs(randomX) < 4) continue;

                mushroomClone.position.set(randomX, 0, randomZ);

                const variation = 0.5 + Math.random();
                const finalScale = baseScale * variation;

                mushroomClone.scale.set(finalScale, finalScale, finalScale);
                mushroomClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                // mushroomClone.traverse((child) => {
                //     if (child.isMesh && child.material) {
                //         child.material.emissive = new THREE.Color(0x00ffff); 
                //         child.material.emissiveIntensity = 0.8; 
                //     }
                // });

                scene.add(mushroomClone);
            }
        },
        onError: (error) => {
            console.error("🔥 LỖI TẢI NẤM: Hãy kiểm tra lại đường dẫn!", error);
        }
    });
}

// ==========================================
// 2.2 TẢI NẤM PHÁT SÁNG
// ==========================================
function loadMushrooms_type2(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/mushroom/magical_mushroom_magenta.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("✅ ĐÃ TẢI FILE GLB! Bắt đầu ép size...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            console.log(`📏 Chiều cao thật của cây gốc: ${size.y.toFixed(2)}`);

            const targetHeight = 2.0;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const treeCount = 50;

            for (let i = 0; i < treeCount; i++) {
                const treeClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;
                if (Math.abs(randomX) < 4) continue;

                treeClone.position.set(randomX, 1, randomZ);

                const variation = 0.8 + (Math.random() * 0.6);
                const finalScale = baseScale * variation;

                treeClone.scale.set(finalScale, finalScale, finalScale);
                treeClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                treeClone.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.emissive = new THREE.Color(0xffc0cb);
                        child.material.emissiveIntensity = 0.8;
                    }
                });

                scene.add(treeClone);

                if (i === 0) {
                    const helper = new THREE.BoxHelper(treeClone, 0xffff00);
                    scene.add(helper);
                    console.log(`📍 Cây nấm đã được ép về chiều cao: ${(targetHeight * variation).toFixed(2)}`);
                }
            }
        },
        onError: (error) => {
            console.error("🔥 LỖI MẠNG: Không tìm thấy file GLB. Hãy check lại đường dẫn!", error);
        }
    });
}

// ==========================================
// 3. TẢI CỎ LOẠI 1
// ==========================================
function loadGrassType1(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/grass/grass.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("🌿 ĐÃ TẢI CỎ LOẠI 1! Đang phủ xanh mặt đất...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);

            const targetHeight = 1.8;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const grassCount = 500;

            for (let i = 0; i < grassCount; i++) {
                const grassClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;
                if (Math.abs(randomX) < 4) continue;

                grassClone.position.set(randomX, 0, randomZ);

                const variation = 0.7 + (Math.random() * 0.6);
                const finalScale = baseScale * variation;

                grassClone.scale.set(finalScale, finalScale, finalScale);
                grassClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                grassClone.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = false;
                        child.receiveShadow = true;
                    }
                });

                scene.add(grassClone);
            }
        },
        onError: (error) => console.error("🔥 LỖI TẢI CỎ 1:", error)
    });
}

// ==========================================
// 4. TẢI CỎ LOẠI 2
// ==========================================
function loadGrassType2(scene, modelLoader) {
    modelLoader.loadModel('/assets/models/grass/single_grass.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("🌱 ĐÃ TẢI CỎ LOẠI 2! Rải xen kẽ...");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);

            const targetHeight = 0.8;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const grassCount = 1000;

            for (let i = 0; i < grassCount; i++) {
                const grassClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;
                if (Math.abs(randomX) < 4) continue;

                grassClone.position.set(randomX, 0, randomZ);

                const variation = 0.7 + (Math.random() * 0.6);
                const finalScale = baseScale * variation;

                grassClone.scale.set(finalScale * 2.0, finalScale, finalScale * 2.0);
                grassClone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                grassClone.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = false;
                        child.receiveShadow = true;

                        if (child.material) {
                            child.material.transparent = false;
                            child.material.alphaTest = 0.5;
                            if (child.material.map) {
                                child.material.map.anisotropy = 16;
                            }
                        }
                    }
                });

                scene.add(grassClone);
            }
        },
        onError: (error) => console.error("🔥 LỖI TẢI CỎ 2:", error)
    });
}

// ==========================================
// 5. TẢI ĐÁ
// ==========================================
function loadRocks(scene, modelLoader, obstacles) {
    modelLoader.loadModel('/assets/models/rock/stylized_rock_for_game.glb', {
        position: [0, -100, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("🪨 ĐÃ TẢI ĐÁ! Đang bố trí cảnh quan...");
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);

            const targetHeight = 2.0;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            const rockCount = 50;

            for (let i = 0; i < rockCount; i++) {
                const rockClone = model.clone();

                const randomX = (Math.random() - 0.5) * 120;
                const randomZ = (Math.random() - 0.5) * 120;

                if (Math.abs(randomX) < 4) continue;

                rockClone.position.set(randomX, -0.8, randomZ);

                const variation = 0.5 + (Math.random() * 1.5);

                const scaleX = baseScale * variation * (0.8 + Math.random() * 0.5);
                const scaleY = baseScale * variation;
                const scaleZ = baseScale * variation * (0.8 + Math.random() * 0.5);

                rockClone.scale.set(scaleX, scaleY, scaleZ);

                rockClone.rotation.set(
                    0,
                    Math.random() * Math.PI * 2,
                    0
                );

                rockClone.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(rockClone);

                if (obstacles) {
                    rockClone.updateMatrixWorld(true);
                    const rockBox = new THREE.Box3().setFromObject(rockClone);

                    // Dùng sphere collider thay vì AABB box
                    // Lấy chiều nhỏ nhất trên mặt phẳng XZ để bán kính sphere luôn nằm gọn trong đá
                    const rockCenter = new THREE.Vector3();
                    rockBox.getCenter(rockCenter);
                    const rockSize = new THREE.Vector3();
                    rockBox.getSize(rockSize);

                    // Bán kính = nửa chiều nhỏ nhất (XZ) × hệ số co (0.4) để vừa khít phần rắn của đá
                    const minXZ = Math.min(rockSize.x, rockSize.z);
                    const radius = minXZ * 0.4;

                    obstacles.push({
                        type: 'sphere',
                        center: new THREE.Vector2(rockCenter.x, rockCenter.z),
                        radius: radius
                    });
                }
            }
        },
        onError: (error) => console.error("🔥 LỖI TẢI ĐÁ:", error)
    });
}

function loadSkyDome(scene, modelLoader) {
    modelLoader.loadModel('/assets/texture/night_sky.glb', {
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        onLoad: (model) => {
            console.log("🌌 ĐÃ TẢI SKYDOME 3D!");

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);

            // Ép bầu trời to lên khổng lồ (bán kính 150)
            const targetHeight = 150.0;
            const actualHeight = size.y > 0 ? size.y : 1;
            const baseScale = targetHeight / actualHeight;

            model.scale.set(baseScale, baseScale, baseScale);

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                    if (child.material) child.material.fog = false;
                }
            });

            scene.add(model);
        },
        onError: (error) => console.error("🔥 LỖI TẢI BẦU TRỜI GLB:", error)
    });
};