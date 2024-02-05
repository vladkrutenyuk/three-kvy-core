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
// export function traverseInterruptible(
//     target: THREE.Object3D,
// 	callback: (child: THREE.Object3D) => boolean
// ) {
// 	if(!callback(target)) return

// 	const children = target.children

// 	for (let i = 0, l = children.length; i < l; i++) {
//         traverseInterruptible
// 		children[i].traverseInterruptible(callback)
// 	}
// }
