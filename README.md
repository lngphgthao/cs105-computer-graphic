# Nature Explorer

Nature Explorer là một môi trường tương tác 3D dành cho đồ án môn Computer
Graphics. Người chơi khám phá một thế giới lấy cảm hứng từ khu rừng, tương tác
với các vật thể, và thu thập các món đồ. Dự án được thiết kế để luyện tập các
khái niệm đồ họa cốt lõi như biến đổi hình học, camera và phép chiếu, ánh sáng,
chế độ hiển thị, và tải mô hình 3D.

## 1. Giới thiệu dự án

- Bối cảnh môn học: bài tập/đồ án môn Computer Graphics.
- Mục tiêu dự án: xây dựng một scene Three.js có cấu trúc rõ ràng, có thể phát
  triển thành một trò chơi khám phá hoàn chỉnh.
- Trọng tâm hiện tại:
  - Nền tảng scene và camera
  - Ánh sáng và bóng đổ
  - Thử nghiệm các chế độ hiển thị (solid, wireframe, points)
  - Kết hợp các hình học cơ bản
  - Tạo pipeline tải mô hình ngoài (.glb)

## 2. Hướng dẫn cài đặt

### Clone repository

```bash
git clone https://github.com/lngphgthao/cs105-computer-graphic.git
cd cs105-computer-graphic
```

### Cài đặt dependencies

```bash
npm install
```

### Chạy development server

```bash
npm run dev
```

Sau đó mở đường dẫn Vite hiển thị trong terminal (thường là
http://localhost:5173).

## 3. Cấu trúc dự án

```text
.
├── assets/
│   └── models/                     # các file .glb và mô hình ngoài
├── src/
│   ├── core/
│   │   ├── camera.js               # camera phối cảnh + cập nhật thông số chiếu
│   │   ├── lighting.js             # ánh sáng ambient + directional và bóng đổ
│   │   ├── renderer.js             # WebGL renderer và cấu hình shadow map
│   │   ├── resize.js               # xử lý thay đổi kích thước màn hình
│   │   └── scene.js                # khởi tạo scene (background, fog)
│   ├── environment/
│   │   └── geometries.js           # mặt đất + vật thể cơ bản + các biến thể hiển thị
│   ├── gameplay/
│   │   ├── modelLoader.js          # khung tải GLB qua GLTFLoader
│   │   └── transformController.js  # điều khiển biến đổi bằng bàn phím
│   ├── ui/
│   │   └── renderModeController.js # chuyển chế độ + HUD
│   ├── main.js                     # ghép nối app + vòng lặp render
│   └── styles.css                  # style cơ bản + style HUD
├── index.html
├── package.json
└── README.md
```

Phân chia trách nhiệm thư mục:

- `src/core`: thiết lập mức engine (scene, renderer, camera, lighting).
- `src/environment`: dựng thế giới và các đối tượng hình học cho bối cảnh
  rừng/game.
- `src/gameplay`: các hệ thống phục vụ gameplay (di chuyển, tương tác, tải dữ
  liệu).
- `src/ui`: giao diện và các lớp phủ điều khiển/debug.
- `assets`: mô hình, texture và tài nguyên ngoài.

## 4. Phân công nhiệm vụ nhóm

| Tên thành viên | MSSV | Github | Nhiệm vụ, vai trò                                                                                                                    |
| -------------- | ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Thành viên A   | -    | -      | Graphics Core: Hệ thống camera (FOV, near/far, điều khiển camera); ánh sáng và bóng đổ; pipeline render và vòng lặp animation        |
| Thành viên B   | -    | -      | Environment & Assets: Dựng địa hình và bố cục khu rừng; tích hợp mô hình và texture; tinh chỉnh material để tăng chất lượng hình ảnh |
| Thành viên C   | -    | -      | Gameplay Logic: Hệ thống di chuyển người chơi; va chạm và thu thập vật phẩm; luật tiến trình trò chơi (điểm số/mục tiêu)             |
| Thành viên D   | -    | -      | Interaction & UI: Ánh xạ input và key bindings; HUD/menu/thông báo phản hồi; gợi ý tương tác và hoàn thiện trải nghiệm               |

## 5. Quy trình phát triển

### Chiến lược nhánh

- Tạo nhánh theo từng thành viên để dễ phân công và theo dõi tiến độ.
- Ví dụ:
  - `<ten-thanh-vien-a>/graphics-core`
  - `<ten-thanh-vien-b>/environment-assets`
  - `<ten-thanh-vien-c>/gameplay-logic`
  - `<ten-thanh-vien-d>/interaction-ui`

### Pull request

- Tạo PR từ nhánh feature vào nhánh main.
- Yêu cầu ít nhất một thành viên khác review trước khi merge.
- Giữ phạm vi PR gọn, chỉ tập trung vào một tính năng hoặc một lỗi.
- Mô tả rõ ràng feature hoặc những thay đổi đã thực hiện và lý do (nếu cần).

### Quy ước commit message

Sử dụng tiền tố commit ngắn gọn, thống nhất:

- `feat:` tính năng mới
- `fix:` sửa lỗi
- `refactor:` dọn code bên trong nhưng không đổi hành vi
- `docs:` cập nhật README hoặc tài liệu
- `style:` chỉ thay đổi định dạng

Ví dụ commit message:

- `feat: add directional sunlight with shadow camera bounds`
- `feat: add render mode toggle for solid lines and points`
- `fix: clamp camera near plane to avoid invalid projection`

## 6. Các tính năng đã triển khai (ban đầu)

- Thiết lập scene với fog và không khí giống khu rừng.
- Hệ thống camera phối cảnh với FOV, near và far có thể điều chỉnh.
- Hệ thống ánh sáng:
  - Ambient light
  - Directional sunlight
  - Cấu hình shadow map
- Các hình học cơ bản:
  - Box
  - Sphere
  - Cone
  - Cylinder
  - Torus (hình bánh xe)
- Chế độ hiển thị:
  - Solid
  - Lines (wireframe)
  - Points
- Khung điều khiển biến đổi bằng bàn phím (translate/rotate/scale đối tượng được
  chọn).
- Cấu trúc tải GLB với `GLTFLoader` sẵn sàng cho mô hình ngoài.

## Các phím điều khiển tham khảo

- Chế độ hiển thị:
  - `1` = Solid
  - `2` = Lines
  - `3` = Points
- Chọn đối tượng:
  - `F1` đến `F6`
  - `[` và `]` để chuyển qua lại
- Biến đổi đối tượng được chọn:
  - Di chuyển: phím mũi tên + PageUp/PageDown
  - Xoay trục Y: `R` / `F`
  - Phóng to/thu nhỏ: `+` / `-`
- Điều chỉnh camera:
  - Di chuyển: `I` `K` `J` `L` `U` `O`
  - Near: `N` / `M`
  - Far: `,` / `.`
  - FOV: `Z` / `X`

## Các bước phát triển tiếp theo được đề xuất

1. Thêm bộ điều khiển người chơi và vùng va chạm.
2. Thay các hình học cơ bản bằng asset GLB cho cây, đá, vật phẩm.
3. Thêm hệ thống thu thập vật phẩm và bảng mục tiêu trên màn hình.
4. Thêm chu kỳ ngày/đêm và hiệu ứng môi trường.
