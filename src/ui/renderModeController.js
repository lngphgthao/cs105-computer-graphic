const RENDER_MODES = ["solid", "lines", "points"];

export function createRenderModeController(onModeChange) {
	let mode = "solid";

	const panel = document.createElement("div");
	panel.className = "hud-panel";
	panel.innerHTML = `
    <h2>Nature Explorer Controls</h2>
    <p><strong>Render mode:</strong> <span data-mode>solid</span></p>
    <p><strong>Switch mode:</strong> 1 (Solid), 2 (Lines), 3 (Points)</p>
    <p><strong>Select object:</strong> F1-F6 or [ and ]</p>
    <p><strong>Transform:</strong> Arrows, PageUp/PageDown, R/F, +/-</p>
    <p><strong>Camera:</strong> I/K/J/L/U/O, N/M, ,/., Z/X</p>
    <div data-extra></div>
  `;

	document.body.appendChild(panel);

	const modeText = panel.querySelector("[data-mode]");
	const extraText = panel.querySelector("[data-extra]");

	function setMode(nextMode) {
		if (!RENDER_MODES.includes(nextMode)) {
			return;
		}

		mode = nextMode;
		modeText.textContent = mode;
		onModeChange(mode);
	}

	function setExtraInfo(lines) {
		extraText.innerHTML = lines.map((line) => `<p>${line}</p>`).join("");
	}

	function onKeyDown(event) {
		if (event.code === "Digit1") {
			setMode("solid");
		} else if (event.code === "Digit2") {
			setMode("lines");
		} else if (event.code === "Digit3") {
			setMode("points");
		}
	}

	window.addEventListener("keydown", onKeyDown);

	setMode("solid");

	return {
		setMode,
		setExtraInfo,
		getMode: () => mode,
		dispose: () => {
			window.removeEventListener("keydown", onKeyDown);
			panel.remove();
		},
	};
}
