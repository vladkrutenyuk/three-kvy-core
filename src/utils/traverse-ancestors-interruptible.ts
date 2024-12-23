import type * as THREE from "three";

/**
 * Traverses the ancestors of a given THREE.Object3D target and applies a callback function to each ancestor.
 * The traversal is interruptible based on the return value of the callback function.
 *
 * @param {THREE.Object3D} target - The starting THREE.Object3D whose ancestors will be traversed.
 * @param {(ancestor: THREE.Object3D) => boolean} callback - A function that is called with each ancestor. If the callback returns true, the traversal continues; if false, the traversal stops.
 */
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