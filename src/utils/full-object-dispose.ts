import { disposeCallback } from "./dispose-callback";
import { isDisposable } from "./types/is-disposable";
import { isMesh } from "./types/is-mesh";

export function fullObjectDispose(obj: THREE.Object3D, deep?: boolean) {
	if (isMesh(obj)) {
		obj.geometry.dispose();
		if (obj.material) {
			if (Array.isArray(obj.material)) {
				obj.material.forEach(disposeCallback);
			} else {
				obj.material.dispose();
			}
		}
	} else if (isDisposable(obj)) {
		obj.dispose();
	}
	if (deep && obj.children.length > 0) {
		for (let i = 0; i < obj.children.length; i++) {
			const child = obj.children[i];
			fullObjectDispose(child, true);
		}
	}
}
