import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function createModelLoader(scene) {
	const loader = new GLTFLoader();

	function loadModel(path, options = {}) {
		const {
			position = [0, 0, 0],
			rotation = [0, 0, 0],
			scale = [1, 1, 1],
			castShadow = true,
			receiveShadow = true,
			onLoad,
			onError,
		} = options;

		loader.load(
			path,
			(gltf) => {
				const model = gltf.scene;

				model.position.set(...position);
				model.rotation.set(...rotation);
				model.scale.set(...scale);

				model.traverse((node) => {
					if (node.isMesh) {
						node.castShadow = castShadow;
						node.receiveShadow = receiveShadow;
					}
				});

				scene.add(model);

				if (typeof onLoad === "function") {
					onLoad(model, gltf);
				}
			},
			undefined,
			(error) => {
				console.error("GLB load error:", error);
				if (typeof onError === "function") {
					onError(error);
				}
			},
		);
	}

	return {
		loadModel,
	};
}
