// ============================================================
// CẤU HÌNH DANH SÁCH 5 VẬT PHẨM CẦN TÌM (TUẦN TỰ)
//
// LUẬT CHƠI:
// - Vật phẩm xuất hiện TỪNG CÁI MỘT trên bản đồ.
// - Đầu game: người chơi nhận mảnh giấy gợi ý #1 → tìm vật phẩm #1.
// - Tìm được vật phẩm #1 → nhận mảnh giấy gợi ý #2 → vật phẩm #2 xuất hiện.
// - Tìm được vật phẩm #2 → nhận mảnh giấy gợi ý #3 → vật phẩm #3 xuất hiện.
// - ... tiếp tục cho đến khi tìm đủ 5 cái trong 5 phút → THẮNG.
// - Hết 5 phút mà chưa tìm đủ → THUA.
// ============================================================
const ITEMS = [
    {
        id: "item1",
        name: "Nấm Pha Lê (Crystal Mushroom)",
        // Gợi ý ĐỂ TÌM vật phẩm NÀY (sẽ được hiển thị trước khi vật phẩm #1 xuất hiện)
        hint: "Mảnh giấy ghi: 'Hãy tìm ở phía Tây Bắc khu rừng, gần một cụm nấm phát sáng lớn...'",
        position: { x: -30, y: 1.0, z: -25 },
        collected: false
    },
    {
        id: "item2",
        name: "Ấm Trà Vàng (Golden Teapot)",
        hint: "Mảnh giấy ghi: 'Hướng về phía Đông Bắc, tìm gần những tảng đá lớn...'",
        position: { x: 25, y: 1.0, z: -30 },
        collected: false
    },
    {
        id: "item3",
        name: "Bánh Xe Cổ (Ancient Wheel)",
        hint: "Mảnh giấy ghi: 'Đi về phía Tây Nam, nơi có những cây thông cao...'",
        position: { x: -20, y: 1.0, z: 20 },
        collected: false
    },
    {
        id: "item4",
        name: "Hộp Kho Báu (Treasure Chest)",
        hint: "Mảnh giấy ghi: 'Hướng về phía Đông, gần trung tâm rừng, ẩn sau cỏ rậm...'",
        position: { x: 18, y: 1.0, z: 8 },
        collected: false
    },
    {
        id: "item5",
        name: "Viên Ngọc Rừng (Forest Gem)",
        hint: "Mảnh giấy ghi: 'Vật phẩm cuối cùng nằm ở góc Đông Nam, trên một bệ đá...'",
        position: { x: 35, y: 1.0, z: 35 },
        collected: false
    }
];

let score = 0;
let isGameOver = false;
let isGameWon = false;
let timeRemaining = 300; // 5 phút = 300 giây
let currentItemIndex = 0; // Vật phẩm đang cần tìm (0 → 4)
let items = JSON.parse(JSON.stringify(ITEMS));

// --- Lấy vật phẩm hiện tại đang cần tìm ---
export function getCurrentItem() {
    if (currentItemIndex < items.length) {
        return items[currentItemIndex];
    }
    return null; // Đã tìm hết
}

// --- Lấy gợi ý cho vật phẩm hiện tại ---
export function getCurrentHint() {
    const item = getCurrentItem();
    return item ? item.hint : null;
}

// --- Lấy toàn bộ danh sách items (cho UI hiển thị tiến độ) ---
export function getItems() {
    return items;
}

export function getCollectedCount() {
    return currentItemIndex;
}

export function getTotalCount() {
    return items.length;
}

export function getTimeRemaining() {
    return timeRemaining;
}

// --- Đếm ngược thời gian ---
export function decrementTime(amount) {
    if (isGameOver || isGameWon) return;
    timeRemaining = Math.max(0, timeRemaining - amount);

    document.dispatchEvent(new CustomEvent("timeUpdated", {
        detail: { timeRemaining: Math.ceil(timeRemaining) }
    }));

    if (timeRemaining <= 0) {
        isGameOver = true;
        document.dispatchEvent(new CustomEvent("gameLost"));
        document.dispatchEvent(new CustomEvent("gameOver"));
    }
}

// --- Thu thập vật phẩm hiện tại ---
export function collectCurrentItem() {
    const item = getCurrentItem();
    if (!item || item.collected || isGameOver || isGameWon) return false;

    item.collected = true;
    score += 100;
    currentItemIndex++;

    const collectedCount = currentItemIndex;
    const nextItem = getCurrentItem(); // Vật phẩm tiếp theo (nếu có)

    // Phát sự kiện thu thập vật phẩm
    document.dispatchEvent(new CustomEvent("itemCollected", {
        detail: {
            item: item,
            collectedCount: collectedCount,
            totalCount: items.length,
            score: score,
            nextHint: nextItem ? nextItem.hint : null,
            isLastItem: !nextItem
        }
    }));

    // Kiểm tra điều kiện thắng
    if (collectedCount >= items.length) {
        isGameWon = true;
        document.dispatchEvent(new CustomEvent("gameWon", {
            detail: { score: score, timeUsed: 300 - timeRemaining }
        }));
        document.dispatchEvent(new CustomEvent("gameOver"));
    } else if (nextItem) {
        // Phát gợi ý cho vật phẩm tiếp theo (mảnh giấy mới)
        document.dispatchEvent(new CustomEvent("hintReceived", {
            detail: {
                hint: nextItem.hint,
                itemName: nextItem.name,
                itemNumber: collectedCount + 1
            }
        }));
    }

    return true;
}

// --- Hàm getGameOver: trả true khi thua HOẶC thắng (để dừng game loop) ---
export function getGameOver() {
    return isGameOver || isGameWon;
}

export function getGameWon() {
    return isGameWon;
}

export function addScore(value) {
    score += value;
}

export function getScore() {
    return score;
}

export function setGameOver(state) {
    isGameOver = state;
}

export function resetGame() {
    score = 0;
    isGameOver = false;
    isGameWon = false;
    timeRemaining = 300;
    currentItemIndex = 0;
    items = JSON.parse(JSON.stringify(ITEMS));
}