import 'three'
declare module 'three' {
	// interface EventDispatcher {
	// 	once(): void // Ваш новый метод
	// 	clear(): void // Ваш новый метод
	// }

	interface Object3D {
		traverseAncestorsInterruptible(
			callback: (ancestor: Object3D) => boolean
		): void
		traverseInterruptible(callback: (ancestor: Object3D) => boolean): void
	}
}

import * as THREE from 'three'
THREE.Object3D.prototype.traverseAncestorsInterruptible = function (
	callback: (ancestor: THREE.Object3D) => boolean
) {
	const parent = this.parent

	if (parent !== null) {
		if (callback(parent)) {
			parent.traverseAncestors(callback)
		}
	}
}
THREE.Object3D.prototype.traverseInterruptible = function (
	callback: (child: THREE.Object3D) => boolean
) {
	if(!callback(this)) return

	const children = this.children

	for (let i = 0, l = children.length; i < l; i++) {
		children[i].traverse(callback)
	}
}
