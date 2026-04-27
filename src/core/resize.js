export function setupResizeHandler(renderer, camera) {
	function onResize() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(width, height);
	}

	window.addEventListener("resize", onResize);

	return () => {
		window.removeEventListener("resize", onResize);
	};
}
