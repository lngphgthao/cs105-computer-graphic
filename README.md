# Nature Explorer

Nature Explorer là một game khám phá 3D được xây dựng bằng Three.js cho môn
Computer Graphics (CS105). Người chơi sẽ điều khiển thỏ thám tử, khám phá khu
rừng, lần theo gợi ý, thu thập 5 bảo vật và hoàn thành thử thách trong giới hạn
thời gian.

## Thông tin môn học

- **Môn học:** Đồ họa máy tính (Computer Graphics)
- **Mã học phần:** CS105
- **Mã lớp:** CS105.Q21
- **Học kì:** HK2 (2025 - 2026)
- **GVHD**: ThS. Cáp Phạm Đình Thăng

## Giới thiệu dự án

Dự án hiện tại đã hoàn thiện một vòng chơi cơ bản gồm:

- Màn hình intro, phần cốt truyện, hệ thống gợi ý.
- Điều khiển người chơi bằng bàn phím, camera bám theo nhân vật.
- Hệ thống spawn vật phẩm theo đúng thứ tự.
- Va chạm với vật phẩm và vật cản.
- Âm thanh nền, hiệu ứng nhặt đồ, nhạc thắng/thua.
- Môi trường rừng được dựng bằng model, ground, mist và ánh sáng.

## Hướng dẫn cài đặt

### 1. Chuẩn bị môi trường

- Cài đặt **Node.js** phiên bản 18 trở lên.
- Đảm bảo máy có sẵn **npm** đi kèm với Node.js.

### 2. Clone repository

```bash
git clone https://github.com/lngphgthao/cs105-computer-graphic.git
cd cs105-computer-graphic
```

### 3. Cài đặt dependencies

```bash
npm install
```

### 4. Chạy source code ở chế độ development

```bash
npm run dev
```

Sau đó mở đường dẫn Vite hiển thị trong terminal, thường là
http://localhost:5173.

### 5. Build và kiểm tra bản chạy

Để build source code thành bản tĩnh:

```bash
npm run build
```

Nếu muốn kiểm tra bản build sau khi hoàn tất, chạy:

```bash
npm run preview
```

Rồi mở đường dẫn Vite hiển thị trong terminal để xem bản build đã chạy đúng.

## Phân công thành viên

| Tên thành viên      | MSSV     | Github                                                     | Nhiệm vụ, vai trò                                                        |
| ------------------- | -------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Lê Ngọc Phương Thảo | 23521467 | [@lngphgthao](https://github.com/lngphgthao)               | Graphics Core: Camera, ánh sáng, renderer, resize, vòng lặp render       |
| Đinh Hoàng Phúc     | 23521193 | [@DinhHoangPhuc3010](https://github.com/DinhHoangPhuc3010) | Environment & Assets: Dựng rừng, ground, mist, vị trí model, texture     |
| Mai Lê Bá Vương     | 23521821 | [@bavuong2005](https://github.com/bavuong2005)             | Gameplay Logic: Người chơi, collision, spawn, game state, audio          |
| Trần Thị Cẩm Tú     | 23521704 | [@TuTTC](https://github.com/TuTTC)                         | Interaction & UI: HUD, modal, settings, luồng gợi ý, phản hồi người dùng |

## Điều khiển

- **Di chuyển:** `W` `A` `S` `D` hoặc các phím mũi tên
- **Camera:** kéo chuột / cuộn chuột để xoay và zoom
- **Tạm dừng:** `Esc`
- **Bật/tắt nhạc:** `B`

## Tính năng chính

- Menu intro, luồng tải game, story modal và hint modal.
- Nhiệm vụ thu thập bảo vật theo thứ tự, có đồng hồ đếm ngược và tính điểm.
- Nhân vật có animation và âm thanh bước chân.
- Spawn vật phẩm động và xử lý va chạm.
- Cảnh rừng với lighting, mist, ground và model nhập ngoài.
- Giao diện hiển thị tiến độ, thời gian, cài đặt và trạng thái game.

## Cấu trúc repo

```text
.
├── index.html
├── package.json
├── README.md
├── assets/
│   ├── audio/
│   ├── models/
│   └── texture/
└── src/
    ├── main.js
    ├── styles.css
    ├── core/
    ├── environment/
    ├── gameplay/
    └── ui/
```

## Phân chia module

- `src/core`: scene, renderer, camera, lighting, resize handling.
- `src/environment`: địa hình, fog, vị trí vật thể và ghép cảnh rừng.
- `src/gameplay`: di chuyển người chơi, trạng thái vật phẩm, spawn, va chạm, âm
  thanh và tải model.
- `src/ui`: overlay, HUD, settings drawer, hint modal và menu flow.
- `assets`: audio, texture và các model GLB sử dụng trong game.
