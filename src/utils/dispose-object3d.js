const has = Object.prototype.hasOwnProperty;
export function disposeMaterialFully(material) {
	material.dispose();

	for (const key in material) {
		if (!has.call(material, key)) continue;
		const prop = material[key];
		if (!prop || !prop.isTexture) continue;

		const texture = prop;
		texture.dispose();
	}
}

/**
 * Disposes of a THREE.Object3D instance and its resources.
 *
 * @param {THREE.Object3D} obj - The object to dispose of.
 * @param {boolean} [recursively=false] - Whether to dispose of the object's children recursively.
 */
export function disposeObject3DFully(obj, recursively = false) {
	if (obj.isMesh) {
		const mesh = obj;
		mesh.geometry.dispose();
	}
	if (obj.material) {
		const material = obj.material;

		if (Array.isArray(material)) {
			material.forEach(disposeMaterialFully);
		} else {
			disposeMaterialFully(material);
		}
	}

	if (has.call(obj, "dispose") && typeof obj["dispose"] === "function") {
		obj.dispose();
	}

	if (recursively) {
		for (let i = 0; i < obj.children.length; i++) {
			const child = obj.children[i];
			disposeObject3DFully(child, true);
		}
	}
}

/**
 * Disposes everything on scene and clear scene.
 *
 * @param {THREE.Scene} scene
 */
export function disposeScene(scene) {
	const children = [...scene.children];
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		child.removeFromParent();
		disposeObject3DFully(child, true);
	}
}
