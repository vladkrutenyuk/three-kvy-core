import { isDisposable } from "../typeguards/is-disposable";
import { isMesh } from "../typeguards/is-mesh";

export function fullObjectDispose(obj: THREE.Object3D, deep?: boolean) {
	if (isMesh(obj)) {
		obj.geometry.dispose();
		if (obj.material) {
			if (Array.isArray(obj.material)) {
				for (let i = 0; i < obj.material.length; i++) {
					//TODO: dispose material maps
					obj.material[i].dispose();
				}
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
