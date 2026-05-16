import * as THREE from "three";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";

function createRenderableObject(name, geometry, color, position) {
	const root = new THREE.Group();
	root.name = name;
	root.position.set(position.x, position.y, position.z);

	const solid = new THREE.Mesh(
		geometry,
		new THREE.MeshStandardMaterial({
			color,
			roughness: 0.72,
			metalness: 0.1,
		}),
	);
	solid.castShadow = true;
	solid.receiveShadow = true;

	const lineMaterial = new THREE.MeshBasicMaterial({
		color,
		wireframe: true,
	});
	const lines = new THREE.Mesh(geometry, lineMaterial);

	const points = new THREE.Points(
		geometry,
		new THREE.PointsMaterial({
			color,
			size: 0.08,
			sizeAttenuation: true,
		}),
	);

	root.add(solid, lines, points);

	root.userData.variants = {
		solid,
		lines,
		points,
	};

	return root;
}

// export function createGround() {
// 	const ground = new THREE.Mesh(
// 		new THREE.PlaneGeometry(180, 180),
// 		new THREE.MeshStandardMaterial({
// 			color: 0x507c4c,
// 			roughness: 0.95,
// 			metalness: 0.0,
// 		}),
// // 	);

// 	ground.rotation.x = -Math.PI / 2;
// 	ground.position.y = 0;
// 	ground.receiveShadow = true;

// 	return ground;
// }

export function createDemoObjects() {
	const objects = [];

	objects.push(
		createRenderableObject("cube", new THREE.BoxGeometry(2, 2, 2), 0xa66f47, {
			x: -9,
			y: 1,
			z: -3,
		}),
	);

	objects.push(
		createRenderableObject(
			"sphere",
			new THREE.SphereGeometry(1.35, 36, 24),
			0x5d8ed1,
			{ x: -5, y: 1.35, z: 2 },
		),
	);

	objects.push(
		createRenderableObject(
			"cone",
			new THREE.ConeGeometry(1.2, 2.4, 28),
			0x3f8740,
			{ x: -1, y: 1.2, z: -2 },
		),
	);

	objects.push(
		createRenderableObject(
			"cylinder",
			new THREE.CylinderGeometry(0.9, 0.9, 2.4, 28),
			0x7f5a3e,
			{ x: 3, y: 1.2, z: 2 },
		),
	);

	const torus = createRenderableObject(
		"torus_wheel",
		new THREE.TorusGeometry(1.2, 0.4, 18, 48),
		0x404040,
		{ x: 7, y: 1.2, z: -2 },
	);
	torus.rotation.x = Math.PI / 2;
	torus.userData.spinSpeed = 0.55;
	objects.push(torus);

	const teapot = createRenderableObject(
		"teapot",
		new TeapotGeometry(1.0, 10, true, true, true, false, true),
		0xc46f54,
		{ x: 11, y: 1.05, z: 2 },
	);
	teapot.userData.spinSpeed = 0.35;
	objects.push(teapot);

	return objects;
}

export function setObjectRenderMode(object, mode) {
	const { solid, lines, points } = object.userData.variants;

	solid.visible = mode === "solid";
	lines.visible = mode === "lines";
	points.visible = mode === "points";
}

export function createGround() {
    // 1. Tải texture cỏ
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('/assets/texture/grass.jpg');
    
    // 2. Cấu hình lặp (repeat) cho texture
    // WrapS và WrapT cho phép texture lặp lại trên trục U và V
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    // Lặp lại texture 20 lần theo mỗi chiều (bạn có thể tinh chỉnh số này)
    // Cấu hình lặp (repeat) cho texture
    grassTexture.repeat.set(10, 10); // Hoặc số bạn thấy vừa mắt

    // THÊM DÒNG NÀY: Bật lọc dị hướng (Anisotropic Filtering)
    // Giá trị 8 hoặc 16 sẽ cho chất lượng rất tốt (16 là mức tối đa của hầu hết GPU)
    grassTexture.anisotropy = 16;

    // 3. Khởi tạo Plane lớn làm mặt đất
    // Kích thước 100x100
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    
    // 4. Tạo material sử dụng texture vừa load
    // Dùng MeshStandardMaterial để có thể tương tác với ánh sáng và bóng đổ
    const planeMaterial = new THREE.MeshStandardMaterial({ 
        map: grassTexture,
        side: THREE.FrontSide // Hoặc THREE.DoubleSide nếu cần nhìn từ dưới lên
    });

    // 5. Kết hợp geometry và material thành Mesh
    const ground = new THREE.Mesh(planeGeometry, planeMaterial);

    // 6. Xoay mặt phẳng nằm ngang
    // Mặc định Plane đứng thẳng, ta xoay -90 độ (-Math.PI / 2) theo trục X để nó nằm ngang
    ground.rotation.x = -Math.PI / 2;

    // 7. Cho phép mặt đất nhận bóng đổ từ các vật thể khác (quan trọng cho môi trường rừng)
    ground.receiveShadow = true;

    return ground;
}

// export function createSky() {
//     // 1. Tải texture bầu trời
//     const textureLoader = new THREE.TextureLoader();
//     // Thay đường dẫn này bằng đường dẫn file ảnh 360 của bạn
//     const skyTexture = textureLoader.load('/assets/textures/night_sky.glb'); 
    
//     // Tăng chất lượng ảnh bầu trời
//     skyTexture.colorSpace = THREE.SRGBColorSpace; 

//     // 2. Tạo một quả cầu khổng lồ (Bán kính 500, chia làm 60 lưới ngang, 40 lưới dọc cho mượt)
//     const skyGeometry = new THREE.SphereGeometry(50, 60, 40);

//     // 3. Tạo Material
//     // Dùng MeshBasicMaterial thay vì Standard vì bầu trời tự nó phát sáng, không cần đèn chiếu vào
//     const skyMaterial = new THREE.MeshBasicMaterial({
//         map: skyTexture,
//         // QUAN TRỌNG NHẤT: Bầu trời phải được nhìn từ bên TRONG quả cầu ra, nên ta đảo mặt hiển thị lại
//         side: THREE.BackSide, 
//         fog: false // Bầu trời không bị ảnh hưởng bởi sương mù của cảnh vật
//     });

//     // 4. Kết hợp lại thành Mesh
//     const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    
//     // Đặt tên để dễ quản lý sau này (nếu cần tìm kiếm)
//     sky.name = "SkySphere";

//     return sky;
// }