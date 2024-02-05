import * as THREE from "three";

export function isMesh<
	TMat extends THREE.Material | THREE.Material[],
	TGeom extends THREE.BufferGeometry = THREE.BufferGeometry
>(obj: THREE.Object3D): obj is THREE.Mesh<TGeom, TMat> {
	return (obj as THREE.Mesh).isMesh || obj.type === "Mesh";
}
