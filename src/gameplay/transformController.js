export function createTransformController(objects) {
	const state = {
		selectedIndex: 0,
		translationStep: 0.35,
		rotationStep: 0.12,
		scaleStep: 0.08,
	};

	function clampSelection(index) {
		if (objects.length === 0) {
			return 0;
		}

		return Math.max(0, Math.min(index, objects.length - 1));
	}

	function setSelectedIndex(index) {
		state.selectedIndex = clampSelection(index);
		refreshHighlight();
	}

	function getSelectedObject() {
		return objects[state.selectedIndex];
	}

	function getSelectedName() {
		return getSelectedObject()?.name ?? "none";
	}

	function refreshHighlight() {
		for (let i = 0; i < objects.length; i += 1) {
			const object = objects[i];
			const solid = object.userData.variants.solid;
			const selected = i === state.selectedIndex;

			if (solid?.material?.emissive) {
				solid.material.emissive.setHex(selected ? 0x222222 : 0x000000);
			}
		}
	}

	function handleKeyboard(event) {
		const activeTag = document.activeElement?.tagName;
		if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
			return false;
		}

		if (event.code.startsWith("F")) {
			const number = Number(event.code.replace("F", ""));
			if (number >= 1 && number <= objects.length) {
				setSelectedIndex(number - 1);
				return true;
			}
		}

		const object = getSelectedObject();
		if (!object) {
			return false;
		}

		switch (event.code) {
			case "ArrowLeft":
				object.position.x -= state.translationStep;
				return true;
			case "ArrowRight":
				object.position.x += state.translationStep;
				return true;
			case "ArrowUp":
				object.position.z -= state.translationStep;
				return true;
			case "ArrowDown":
				object.position.z += state.translationStep;
				return true;
			case "PageUp":
				object.position.y += state.translationStep;
				return true;
			case "PageDown":
				object.position.y -= state.translationStep;
				return true;
			case "KeyR":
				object.rotation.y += state.rotationStep;
				return true;
			case "KeyF":
				object.rotation.y -= state.rotationStep;
				return true;
			case "Equal":
			case "NumpadAdd":
				object.scale.multiplyScalar(1 + state.scaleStep);
				return true;
			case "Minus":
			case "NumpadSubtract":
				object.scale.multiplyScalar(1 - state.scaleStep);
				return true;
			case "BracketLeft":
				setSelectedIndex(state.selectedIndex - 1);
				return true;
			case "BracketRight":
				setSelectedIndex(state.selectedIndex + 1);
				return true;
			default:
				return false;
		}
	}

	refreshHighlight();

	return {
		setSelectedIndex,
		getSelectedName,
		handleKeyboard,
	};
}
