import * as THREE from "three";

export function isDisposable<TObject extends THREE.Object3D>(
	obj: TObject
): obj is TObject & { dispose: () => void } {
	return Object.prototype.hasOwnProperty.call(obj, "dispose");
}
