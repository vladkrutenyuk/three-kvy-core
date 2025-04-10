import type * as THREE from "three";

export function vecFromTuple(tuple: THREE.Vector2Tuple): THREE.Vector2;
export function vecFromTuple(tuple: THREE.Vector3Tuple): THREE.Vector3;
export function vecFromTuple(tuple: THREE.Vector4Tuple): THREE.Vector4;
export function vecFromTuple(
	tuple: THREE.Vector2Tuple | THREE.Vector3Tuple | THREE.Vector4Tuple
): THREE.Vector2Like | THREE.Vector3Like | THREE.Vector4Like {
	const [x, y, z, w] = tuple;
	return tuple.length === 2
		? { x, y }
		: tuple.length === 3
		? { x, y, z }
		: tuple.length === 4
		? { x, y, z, w }
		: (() => {
				throw new Error("Invalid tuple length");
		  })();
}
