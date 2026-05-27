import "./gameUI.css";
import { getPlayer } from "../gameplay/playerController";
import { setPaused } from "../gameplay/gameState";

export function initGameUI({
	renderer,
	scene,
	backgroundMusic,
	introMusic,
	winMusic,
	loseMusic,
	ambientLight,
	sunlight,
	onStartGame,
	onPauseGame,
	onResumeGame,
	onQuitGame,
}) {
	let isMuted = false;
	let preMuteVolume = 0.2;
	let activeHint =
		"Hãy tìm ở phía Tây Bắc khu rừng, gần một cụm nấm phát sáng lớn...";
	let activeItemName = "Nấm Pha Lê (Crystal Mushroom)";
	let activeItemNumber = 1;

	// Create root element for UI
	const root = document.createElement("div");
	root.id = "game-ui-root";
	root.className = "game-ui-container";
	document.body.appendChild(root);

	// Generate HTML structure dynamically
	root.innerHTML = `
    <!-- HUD Layer -->
    <div class="game-hud" id="game-hud">
      <!-- Progress (Left) -->
      <div class="hud-tile hud-progress-container">
        <div class="hud-progress-label">
          <span>Tiến Độ</span>
          <span id="hud-progress-text">0 / 5</span>
        </div>
        <div class="hud-progress-bar-bg">
          <div class="hud-progress-fill" id="hud-progress-fill" style="width: 0%;"></div>
        </div>
      </div>

      <!-- Timer (Center) -->
      <div class="hud-tile hud-timer-container">
        <div class="hud-timer-label">Thời Gian</div>
        <div class="hud-timer-value" id="hud-timer-value">05:00</div>
      </div>

      <!-- Quick Actions (Right) -->
      <div class="hud-actions">
        <button class="hud-action-btn" id="btn-hud-help">Trợ Giúp</button>
        <button class="hud-action-btn" id="btn-hud-hint">Gợi Ý</button>
        <button class="hud-action-btn" id="btn-hud-settings">Cài Đặt</button>
      </div>
    </div>

    <!-- On-screen Controls Help Card (Top-Right, below HUD actions) -->
    <div class="hud-help-card hidden" id="hud-help-card">
      <div class="board-screw screw-tl" style="width: 6px; height: 6px; border-width: 1.5px; top: 4px; left: 4px;"></div>
      <div class="board-screw screw-tr" style="width: 6px; height: 6px; border-width: 1.5px; top: 4px; right: 4px;"></div>
      <div class="board-screw screw-bl" style="width: 6px; height: 6px; border-width: 1.5px; bottom: 4px; left: 4px;"></div>
      <div class="board-screw screw-br" style="width: 6px; height: 6px; border-width: 1.5px; bottom: 4px; right: 4px;"></div>
      <div class="hud-help-title">ĐIỀU KHIỂN</div>
      <div class="hud-help-row">
        <span class="hud-help-key">W, A, S, D</span>
        <span class="hud-help-desc">Di chuyển thỏ</span>
      </div>
      <div class="hud-help-row">
        <span class="hud-help-key">Di chuột</span>
        <span class="hud-help-desc">Xoay camera</span>
      </div>
      <div class="hud-help-row">
        <span class="hud-help-key">Phím Esc</span>
        <span class="hud-help-desc">Tạm dừng game</span>
      </div>
    </div>

    <!-- Backdrop for Settings Drawer -->
    <div class="drawer-backdrop" id="settings-backdrop"></div>

    <!-- Settings Drawer (Right Side slide-in) -->
    <div class="settings-drawer" id="settings-drawer">
      <div class="board-screw screw-tl"></div>
      <div class="board-screw screw-bl"></div>
      <div class="board-screw screw-br"></div>
      
      <!-- Top-right 'X' Close Button -->
      <button class="drawer-x-btn" id="btn-settings-close">&times;</button>

      <div class="drawer-header">Cài Đặt</div>

      <div class="setting-row">
        <div class="setting-label-container">
          <span class="setting-label">Âm Lượng Nhạc</span>
          <button class="setting-toggle-btn" id="btn-mute-toggle">Bật</button>
        </div>
        <input type="range" min="0" max="1" step="0.01" value="0.2" class="setting-slider" id="slider-volume">
      </div>

      <div class="setting-row">
        <div class="setting-label-container">
          <span class="setting-label">Sáng Môi Trường</span>
        </div>
        <input type="range" min="0" max="2" step="0.01" value="0.35" class="setting-slider" id="slider-ambient">
      </div>

      <div class="setting-row">
        <div class="setting-label-container">
          <span class="setting-label">Sáng Mặt Trời</span>
        </div>
        <input type="range" min="0" max="3" step="0.01" value="1.25" class="setting-slider" id="slider-sun">
      </div>
    </div>

    <!-- Loading Screen (Always Active Initially) -->
    <div class="game-overlay active" id="loading-overlay">
      <div class="loading-text" id="loading-text">Đang tải tài nguyên... 0%</div>
      <div class="loading-bar-container">
        <div class="loading-bar-fill" id="loading-bar-fill"></div>
      </div>
    </div>

    <!-- Intro Menu (Phase 1 Complete) -->
    <div class="game-overlay" id="modal-intro-overlay">
      <div class="intro-title-container">
         <div class="intro-logo-img-container">
            <img class="intro-logo-image" src="/assets/texture/Logo-game.png" alt="Nature Explorer Logo" />
         </div>
         <button class="game-btn-3d btn-green" id="btn-intro-play" style="margin-top: 10px; font-size: 24px; padding: 15px 40px;">PLAY</button>
      </div>
    </div>

    <!-- Story Modal (Appears after loading) -->
    <div class="game-overlay" id="modal-story-overlay">
      <div class="mahogany-board mahogany-board-wide">
        <div class="board-screw screw-tl"></div>
        <div class="board-screw screw-tr"></div>
        <div class="board-screw screw-bl"></div>
        <div class="board-screw screw-br"></div>
        
        <div class="wax-badge">Khám Phá</div>
        <h1 class="board-title">TRUYỀN THUYẾT KHU RỪNG</h1>
        
        <div class="modal-split-layout">
          <div class="modal-text-col">
            <div class="parchment-card">
              <div class="story-scroll">
                <p><strong>TRUYỀN THUYẾT VỀ KHU RỪNG ĐOM ĐÓM</strong></p>
                <p>Từ thuở xa xưa, Khu Rừng Kỳ Bí vốn là nơi trú ngụ yên bình của muôn loài dưới sự bảo hộ của <strong>Cây Đại Thụ Vĩnh Hằng</strong>. Nhờ nguồn năng lượng nhiệm màu phát ra từ <strong>5 Bảo Vật Thượng Cổ</strong>, khu rừng luôn ngập tràn ánh sáng đom đóm rực rỡ.</p>
                <p>Thế nhưng, vào một đêm trăng khuyết, một <strong>Lời Nguyền Hắc Ám</strong> bí ẩn đã trỗi dậy, phong ấn toàn bộ nguồn sáng và gieo rắc sự hỗn loạn. Cây Đại Thụ đang dần héo úa, và nếu không được hóa giải, khu rừng sẽ bị nuốt chửng bởi bóng đêm vĩnh hằng sau đúng <strong>5 phút</strong>.</p>
                <p>Với tư cách là <strong>Thỏ Thám Tử (Bunny Detective)</strong> — nhà điều tra tài ba nhất vương quốc, bạn đã nhận lời ủy thác từ muôn loài. Hãy lần theo các tấm gợi ý bằng gỗ cổ xưa rải rác trong rừng để tìm lại đủ 5 bảo vật bị thất lạc:</p>
                <p style="margin-left: 10px; font-style: italic;">
                  1. <strong>Nấm Pha Lê</strong> lấp lánh sắc hồng.<br>
                  2. <strong>Ấm Trà Vàng</strong> của vị tiên rừng.<br>
                  3. <strong>Bánh Xe Cổ</strong> huyền thoại phong trần.<br>
                  4. <strong>Hộp Kho Báu</strong> chôn giấu ngàn năm.<br>
                  5. <strong>Viên Ngọc Rừng</strong> kết tinh năng lượng.
                </p>
                <p>Hãy nhanh lên! Số phận của vương quốc xanh nằm trong tay bạn!</p>
              </div>
            </div>
          </div>
          <div class="modal-image-col">
            <div class="css-forest-scene">
              <div class="forest-moon"></div>
              <div class="forest-tree tree-1"></div>
              <div class="forest-tree tree-2"></div>
              <div class="forest-tree tree-3"></div>
              <div class="forest-tree tree-4"></div>
              <div class="forest-tree tree-5"></div>
              <div class="forest-ground"></div>
              <div class="forest-firefly ff-1"></div>
              <div class="forest-firefly ff-2"></div>
              <div class="forest-firefly ff-3"></div>
              <div class="forest-firefly ff-4"></div>
              <div class="forest-firefly ff-5"></div>
              <div class="forest-firefly ff-6"></div>
              <div class="forest-firefly ff-7"></div>
              <div class="forest-mushroom mush-1"></div>
              <div class="forest-mushroom mush-2"></div>
              <div class="forest-mushroom mush-3"></div>
              <div class="forest-caption">Khu Rừng Kỳ Bí</div>
            </div>
          </div>
        </div>

        <button class="game-btn-3d btn-green" id="btn-story-start">Bắt Đầu</button>
      </div>
    </div>

    <!-- Hint Modal (Popup on request) -->
    <div class="game-overlay" id="modal-hint-overlay">
      <div class="mahogany-board mahogany-board-wide">
        <div class="board-screw screw-tl"></div>
        <div class="board-screw screw-tr"></div>
        <div class="board-screw screw-bl"></div>
        <div class="board-screw screw-br"></div>

        <div class="wax-badge">Manh Mối</div>
        <h1 class="board-title" id="hint-title">Vật Phẩm #1</h1>

        <div class="modal-split-layout">
          <div class="modal-image-col">
            <div class="css-item-scene" id="hint-item-scene">
              <div class="item-glow"></div>
              <div class="item-icon" id="hint-item-icon"></div>
              <div class="item-particles">
                <div class="item-particle p-1"></div>
                <div class="item-particle p-2"></div>
                <div class="item-particle p-3"></div>
                <div class="item-particle p-4"></div>
                <div class="item-particle p-5"></div>
              </div>
            </div>
          </div>
          <div class="modal-text-col">
            <div class="parchment-card">
              <p id="hint-subtitle" style="font-weight: bold; margin-bottom: 8px; color: #8b4a1a;">
                Đang tìm kiếm: Nấm Pha Lê (Crystal Mushroom)
              </p>
              <p id="hint-text" style="font-style: italic; margin-bottom: 12px;">
                "Hãy tìm ở phía Tây Bắc khu rừng, gần một cụm nấm phát sáng lớn..."
              </p>
              <div class="hint-meaning-section">
                <div class="hint-meaning-label">Ý Nghĩa Bảo Vật</div>
                <p id="hint-meaning" class="hint-meaning-text">
                  Nấm Pha Lê chứa nguồn năng lượng phát quang cổ đại. Khi được đặt về đúng vị trí trên Cây Đại Thụ, nó sẽ thắp lại ánh sáng đom đóm đầu tiên cho khu rừng.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button class="game-btn-3d btn-green" id="btn-hint-close">Đã Hiểu</button>
      </div>
    </div>

    <!-- Game Won Modal -->
    <div class="game-overlay" id="modal-won-overlay">
      <div class="mahogany-board">
        <div class="board-screw screw-tl"></div>
        <div class="board-screw screw-tr"></div>
        <div class="board-screw screw-bl"></div>
        <div class="board-screw screw-br"></div>

        <div class="wax-badge">Chiến Thắng</div>
        <h1 class="board-title">KỲ TÍCH!</h1>

        <div class="parchment-card">
          <p>Tuyệt vời! Bạn đã xuất sắc tìm kiếm đủ cả 5 bảo vật cổ linh thiêng của khu rừng!</p>
          <p>Lời nguyền cổ xưa đã chính thức bị phá giải, mang lại sự bình yên vĩnh cửu cho thế giới tự nhiên kỳ bí.</p>
          
          <div class="stats-container">
            <div class="stat-item">
              <span class="stat-label">Điểm Số</span>
              <span class="stat-value" id="won-score">500</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Thời Gian Dùng</span>
              <span class="stat-value" id="won-time">02:30</span>
            </div>
          </div>
        </div>

        <button class="game-btn-3d btn-green" id="btn-won-replay">Chơi Lại</button>
      </div>
    </div>

    <!-- Game Lost Modal -->
    <div class="game-overlay" id="modal-lost-overlay">
      <div class="mahogany-board">
        <div class="board-screw screw-tl"></div>
        <div class="board-screw screw-tr"></div>
        <div class="board-screw screw-bl"></div>
        <div class="board-screw screw-br"></div>

        <div class="wax-badge">Thất Bại</div>
        <h1 class="board-title">HẾT GIỜ!</h1>

        <div class="parchment-card">
          <p>Thời gian 5 phút đã kết thúc...</p>
          <p>Sương mù đen tối đã bao phủ hoàn toàn khu rừng kỳ bí, và 5 bảo vật đã bị phong ấn vĩnh viễn dưới lòng đất sâu.</p>
          <p>Đừng nản lòng, hãy thử sức lại một lần nữa để giải cứu thế giới tự nhiên!</p>
        </div>

        <button class="game-btn-3d btn-red" id="btn-lost-retry">Thử Lại</button>
      </div>
    </div>

    <!-- Pause Modal -->
    <div class="game-overlay" id="modal-pause-overlay">
      <div class="mahogany-board">
        <div class="board-screw screw-tl"></div>
        <div class="board-screw screw-tr"></div>
        <div class="board-screw screw-bl"></div>
        <div class="board-screw screw-br"></div>

        <div class="wax-badge">Tạm Dừng</div>
        <h1 class="board-title">PAUSED</h1>

        <div class="parchment-card">
          <p>Trò chơi đang được tạm dừng.</p>
          <p>Nhân vật và thời gian đã dừng lại. Chớp mắt một cái rồi vào chơi tiếp nhé!</p>
        </div>

        <div style="display: flex; gap: 16px; justify-content: center; margin-top: 20px;">
          <button class="game-btn-3d btn-green" id="btn-pause-resume">Tiếp Tục</button>
          <button class="game-btn-3d btn-red" id="btn-pause-quit">Thoát Game</button>
        </div>
      </div>
    </div>

    <!-- Compass UI -->
    <div id="hud-compass-container">
      <div id="hud-compass-disc">
        <div class="compass-marker compass-n">N</div>
        <div class="compass-marker compass-e">E</div>
        <div class="compass-marker compass-s">S</div>
        <div class="compass-marker compass-w">W</div>
      </div>
      <div class="compass-center"></div>
      <div class="compass-needle-fixed"></div>
    </div>
  `;

	// Bind DOM Elements
	const modalIntroOverlay = root.querySelector("#modal-intro-overlay");
	const modalStoryOverlay = root.querySelector("#modal-story-overlay");
	const modalHintOverlay = root.querySelector("#modal-hint-overlay");
	const modalWonOverlay = root.querySelector("#modal-won-overlay");
	const modalLostOverlay = root.querySelector("#modal-lost-overlay");
	const modalPauseOverlay = root.querySelector("#modal-pause-overlay");
	const loadingOverlay = root.querySelector("#loading-overlay");

	const btnStoryStart = root.querySelector("#btn-story-start");
	const btnIntroPlay = root.querySelector("#btn-intro-play");
	const btnHintClose = root.querySelector("#btn-hint-close");
	const btnWonReplay = root.querySelector("#btn-won-replay");
	const btnLostRetry = root.querySelector("#btn-lost-retry");
	const btnPauseResume = root.querySelector("#btn-pause-resume");
	const btnPauseQuit = root.querySelector("#btn-pause-quit");

	const loadingText = root.querySelector("#loading-text");
	const loadingBarFill = root.querySelector("#loading-bar-fill");
	const compassDisc = root.querySelector("#hud-compass-disc");

	const btnHudHelp = root.querySelector("#btn-hud-help");
	const hudHelpCard = root.querySelector("#hud-help-card");
	const btnHudHint = root.querySelector("#btn-hud-hint");
	const btnHudSettings = root.querySelector("#btn-hud-settings");

	const settingsDrawer = root.querySelector("#settings-drawer");
	const settingsBackdrop = root.querySelector("#settings-backdrop");
	const btnSettingsClose = root.querySelector("#btn-settings-close");

	const sliderVolume = root.querySelector("#slider-volume");
	const btnMuteToggle = root.querySelector("#btn-mute-toggle");

	const sliderAmbient = root.querySelector("#slider-ambient");
	const sliderSun = root.querySelector("#slider-sun");

	const hudProgressText = root.querySelector("#hud-progress-text");
	const hudProgressFill = root.querySelector("#hud-progress-fill");
	const hudTimerValue = root.querySelector("#hud-timer-value");

	const hintTitle = root.querySelector("#hint-title");
	const hintSubtitle = root.querySelector("#hint-subtitle");
	const hintText = root.querySelector("#hint-text");
	const hintMeaning = root.querySelector("#hint-meaning");
	const hintItemScene = root.querySelector("#hint-item-scene");
	const hintItemIcon = root.querySelector("#hint-item-icon");

	let activeMeaning = "";

	const wonScore = root.querySelector("#won-score");
	const wonTime = root.querySelector("#won-time");

	// Item CSS art color/shape configurations
	const ITEM_VISUALS = {
		1: {
			cssClass: "item-mushroom",
			color: "#ff69b4",
			glow: "rgba(255,105,180,0.4)",
		},
		2: {
			cssClass: "item-teapot",
			color: "#ffd700",
			glow: "rgba(255,215,0,0.4)",
		},
		3: {
			cssClass: "item-wheel",
			color: "#cd853f",
			glow: "rgba(205,133,63,0.4)",
		},
		4: {
			cssClass: "item-chest",
			color: "#daa520",
			glow: "rgba(218,165,32,0.4)",
		},
		5: { cssClass: "item-gem", color: "#50c878", glow: "rgba(80,200,120,0.4)" },
	};

	function updateHintVisual(itemNumber) {
		const visual = ITEM_VISUALS[itemNumber] || ITEM_VISUALS[1];
		// Reset classes
		hintItemIcon.className = "item-icon " + visual.cssClass;
		hintItemScene.style.background = `radial-gradient(ellipse at center, ${visual.glow} 0%, rgba(20,15,10,0.95) 70%)`;
	}

	// ==========================================
	// HELPER FUNCTIONS
	// ==========================================

	function formatTime(totalSeconds) {
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}

	function updateVolume(vol) {
		const updateAudio = (audioObj) => {
			if (audioObj) {
				try {
					audioObj.setVolume(vol);
				} catch (err) {}
			}
		};
		updateAudio(backgroundMusic);
		updateAudio(introMusic);
		updateAudio(winMusic);
		updateAudio(loseMusic);
	}

	// ==========================================
	// EVENT LISTENERS: AUDIO & LIGHTING CONTROLS
	// ==========================================

	// Music Volume
	sliderVolume.addEventListener("input", (e) => {
		const vol = parseFloat(e.target.value);
		preMuteVolume = vol;

		if (vol === 0) {
			isMuted = true;
			btnMuteToggle.textContent = "Tắt";
			btnMuteToggle.style.background = "#ebdcc5";
		} else {
			isMuted = false;
			btnMuteToggle.textContent = "Bật";
			btnMuteToggle.style.background = "#fbf0db";
		}

		updateVolume(vol);
	});

	// Mute toggle
	btnMuteToggle.addEventListener("click", () => {
		isMuted = !isMuted;
		if (isMuted) {
			preMuteVolume = parseFloat(sliderVolume.value) || 0.2;
			sliderVolume.value = 0;
			btnMuteToggle.textContent = "Tắt";
			btnMuteToggle.style.background = "#ebdcc5";
			updateVolume(0);
		} else {
			sliderVolume.value = preMuteVolume;
			btnMuteToggle.textContent = "Bật";
			btnMuteToggle.style.background = "#fbf0db";
			updateVolume(preMuteVolume);
		}
	});

	// Footstep audio removed; no UI control.

	// Ambient Light
	sliderAmbient.addEventListener("input", (e) => {
		const v = parseFloat(e.target.value);
		if (ambientLight) ambientLight.intensity = v;
	});

	// Sun Light
	sliderSun.addEventListener("input", (e) => {
		const v = parseFloat(e.target.value);
		if (sunlight) sunlight.intensity = v;
	});

	// ==========================================
	// DRAWER EVENTS
	// ==========================================

	function openDrawer() {
		settingsDrawer.classList.add("active");
		settingsBackdrop.classList.add("active");
		if (onPauseGame) onPauseGame();
	}

	function closeDrawer() {
		settingsDrawer.classList.remove("active");
		settingsBackdrop.classList.remove("active");
		if (onResumeGame) onResumeGame();
	}

	btnHudSettings.addEventListener("click", openDrawer);
	btnSettingsClose.addEventListener("click", closeDrawer);
	settingsBackdrop.addEventListener("click", closeDrawer);

	// ==========================================
	// GAMEPLAY OVERLAYS / MODALS EVENTS
	// ==========================================

	// Play intro music on very first click anywhere on the document
	const playIntroOnInteraction = () => {
		if (
			introMusic &&
			!introMusic.isPlaying &&
			modalIntroOverlay.classList.contains("active")
		) {
			try {
				if (introMusic.context && introMusic.context.state === "suspended")
					introMusic.context.resume();
				introMusic.play();
			} catch (err) {}
		}
		document.removeEventListener("click", playIntroOnInteraction);
	};
	document.addEventListener("click", playIntroOnInteraction);

	// Intro Play button -> Trigger Phase 2 loading
	btnIntroPlay.addEventListener("click", () => {
		modalIntroOverlay.classList.remove("active");
		loadingOverlay.classList.add("active");
		loadingText.textContent = "Đang kiến tạo thế giới 3D... 0%";
		loadingBarFill.style.width = "0%";

		// Play intro music now that user has interacted
		if (introMusic) {
			try {
				if (introMusic.context && introMusic.context.state === "suspended")
					introMusic.context.resume();
				if (!introMusic.isPlaying) introMusic.play();
			} catch (err) {
				console.warn("Intro music autoplay blocked:", err);
			}
		}

		document.dispatchEvent(new CustomEvent("startPhase2Loading"));
	});

	// Start story button -> Start Game
	btnStoryStart.addEventListener("click", () => {
		modalStoryOverlay.classList.remove("active");

		// NOTE: Removed requestPointerLock here to prevent race condition with the first hint popup.
		// Pointer lock will be requested when the user clicks 'Đã Hiểu' on the hint modal.

		// Stop intro music and start background music
		if (introMusic && introMusic.isPlaying) introMusic.stop();
		if (backgroundMusic) {
			try {
				if (
					backgroundMusic.context &&
					backgroundMusic.context.state === "suspended"
				) {
					backgroundMusic.context.resume();
				}
				if (backgroundMusic.buffer && !backgroundMusic.isPlaying) {
					backgroundMusic.play();
				}
			} catch (err) {
				console.warn("Background music autoplay was blocked/failed:", err);
			}
		}
		if (onStartGame) {
			onStartGame();
		}
	});

	// Help button toggles the on-screen controls help card
	btnHudHelp.addEventListener("click", () => {
		hudHelpCard.classList.toggle("hidden");
	});

	// Hint button triggers modal
	btnHudHint.addEventListener("click", () => {
		hintTitle.textContent = `Vật Phẩm #${activeItemNumber}`;
		hintSubtitle.textContent = `Đang tìm kiếm: ${activeItemName}`;
		hintText.textContent = `"${activeHint}"`;
		hintMeaning.textContent = activeMeaning;
		updateHintVisual(activeItemNumber);
		modalHintOverlay.classList.add("active");
		if (onPauseGame) onPauseGame();
	});

	btnHintClose.addEventListener("click", () => {
		modalHintOverlay.classList.remove("active");
		if (onResumeGame) onResumeGame();

		// Auto-lock mouse when returning to game
		if (renderer && renderer.domElement) {
			renderer.domElement
				.requestPointerLock()
				.catch((e) => console.warn("Pointer lock blocked:", e));
		}
	});

	// Replay & Retry buttons reload the page (safest restart logic)
	btnWonReplay.addEventListener("click", () => {
		window.location.reload();
	});

	btnLostRetry.addEventListener("click", () => {
		window.location.reload();
	});

	btnPauseResume.addEventListener("click", () => {
		setPaused(false);
		if (renderer && renderer.domElement) {
			renderer.domElement
				.requestPointerLock()
				.catch((e) => console.warn("Pointer lock blocked:", e));
		}
	});

	btnPauseQuit.addEventListener("click", () => {
		// Stop all gameplay music
		if (backgroundMusic && backgroundMusic.isPlaying) backgroundMusic.stop();
		if (introMusic && !introMusic.isPlaying) {
			try {
				introMusic.play();
			} catch (e) {}
		}

		// Exit pointer lock if active
		if (document.pointerLockElement) {
			document.exitPointerLock();
		}

		// Hide pause modal and other overlays
		modalPauseOverlay.classList.remove("active");
		modalStoryOverlay.classList.remove("active");
		modalHintOverlay.classList.remove("active");
		hudHelpCard.classList.add("hidden");
		modalWonOverlay.classList.remove("active");
		modalLostOverlay.classList.remove("active");
		loadingOverlay.classList.remove("active");

		// Reset HUD visual state
		hudProgressText.textContent = "0 / 5";
		hudProgressFill.style.width = "0%";
		hudTimerValue.textContent = "05:00";
		hudTimerValue.className = "hud-timer-value";

		// Show Intro Screen
		modalIntroOverlay.classList.add("active");

		// Call quit callback to reset gameplay logic and position
		if (onQuitGame) {
			onQuitGame();
		}
	});

	// ==========================================
	// CUSTOM DOCUMENT EVENTS (INTEGRATING WITH GAMEPLAY EVENTS)
	// ==========================================

	// 1. Time Updated
	document.addEventListener("timeUpdated", (e) => {
		const timeRemaining = e.detail.timeRemaining;
		hudTimerValue.textContent = formatTime(timeRemaining);

		// Apply color code styling based on urgency
		if (timeRemaining > 120) {
			hudTimerValue.className = "hud-timer-value";
		} else if (timeRemaining > 60) {
			hudTimerValue.className = "hud-timer-value warning";
		} else {
			hudTimerValue.className = "hud-timer-value danger";
		}
	});

	// 2. Hint Received (next item hint ready)
	document.addEventListener("hintReceived", (e) => {
		activeHint = e.detail.hint;
		activeItemName = e.detail.itemName;
		activeItemNumber = e.detail.itemNumber;
		activeMeaning = e.detail.meaning || "";

		// Automatically popup hint on new item to keep player guided
		hintTitle.textContent = `Vật Phẩm #${activeItemNumber}`;
		hintSubtitle.textContent = `Đang tìm kiếm: ${activeItemName}`;
		hintText.textContent = `"${activeHint}"`;
		hintMeaning.textContent = activeMeaning;
		updateHintVisual(activeItemNumber);
		modalHintOverlay.classList.add("active");

		// Exit pointer lock so player can use the mouse to close the popup
		if (document.pointerLockElement) {
			document.exitPointerLock();
		}

		if (onPauseGame) onPauseGame();
	});

	// 3. Item Collected
	document.addEventListener("itemCollected", (e) => {
		const { collectedCount, totalCount } = e.detail;

		// Update progress HUD
		hudProgressText.textContent = `${collectedCount} / ${totalCount}`;
		const pct = (collectedCount / totalCount) * 100;
		hudProgressFill.style.width = `${pct}%`;
	});

	// 4. Game Won
	document.addEventListener("gameWon", (e) => {
		const { score, timeUsed } = e.detail;
		wonScore.textContent = score;
		wonTime.textContent = formatTime(Math.round(timeUsed));
		modalWonOverlay.classList.add("active");

		if (backgroundMusic && backgroundMusic.isPlaying) backgroundMusic.stop();
		if (winMusic) {
			try {
				winMusic.play();
			} catch (e) {}
		}

		// Footstep audio removed

		// Exit pointer lock
		if (document.pointerLockElement) {
			document.exitPointerLock();
		}

		if (onPauseGame) onPauseGame();
	});

	// 5. Game Lost
	document.addEventListener("gameLost", () => {
		modalLostOverlay.classList.add("active");

		if (backgroundMusic && backgroundMusic.isPlaying) backgroundMusic.stop();
		if (loseMusic) {
			try {
				loseMusic.play();
			} catch (e) {}
		}

		// Footstep audio removed

		// Exit pointer lock
		if (document.pointerLockElement) {
			document.exitPointerLock();
		}

		if (onPauseGame) onPauseGame();
	});

	// 6. Game Paused / Resumed
	document.addEventListener("gamePaused", () => {
		modalPauseOverlay.classList.add("active");

		// Exit pointer lock
		if (document.pointerLockElement) {
			document.exitPointerLock();
		}

		if (onPauseGame) onPauseGame();
	});

	document.addEventListener("gameResumed", () => {
		modalPauseOverlay.classList.remove("active");
		if (onResumeGame) onResumeGame();
	});

	// 7. Loading Progress
	document.addEventListener("loadingProgress", (e) => {
		const pct = Math.floor(e.detail.percent);
		loadingBarFill.style.width = `${pct}%`;
		loadingText.textContent = `Đang tải tài nguyên... ${pct}%`;
	});

	document.addEventListener("loadingComplete", (e) => {
		loadingOverlay.classList.remove("active");
		if (e.detail && e.detail.phase === 1) {
			modalIntroOverlay.classList.add("active");
		} else {
			modalStoryOverlay.classList.add("active");
		}
	});

	// 8. Compass Rotation
	document.addEventListener("cameraRotated", (e) => {
		if (compassDisc) {
			const angle = e.detail.angle;
			compassDisc.style.transform = `rotate(${angle}deg)`;

			// Giữ cho các chữ N, E, S, W luôn đứng thẳng
			const markers = compassDisc.querySelectorAll(".compass-marker");
			markers.forEach((marker) => {
				if (
					marker.classList.contains("compass-n") ||
					marker.classList.contains("compass-s")
				) {
					marker.style.transform = `translateX(-50%) rotate(${-angle}deg)`;
				} else if (
					marker.classList.contains("compass-e") ||
					marker.classList.contains("compass-w")
				) {
					marker.style.transform = `translateY(-50%) rotate(${-angle}deg)`;
				}
			});
		}
	});
}
