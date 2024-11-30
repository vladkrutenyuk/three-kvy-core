import * as THREE from "three";

export function traverseAncestorsInterruptible(
	target: THREE.Object3D,
	callback: (ancestor: THREE.Object3D) => boolean
) {
	const parent = target.parent;

	if (parent !== null) {
		if (callback(parent)) {
			traverseAncestorsInterruptible(parent, callback);
		}
	}
}