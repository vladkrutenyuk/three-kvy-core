import type * as THREE from "three";

export function disposeMaterialFully(material: THREE.Material): void

/**
 * 
 * @param obj THREE.Object3D
 * @param recursively Boolean. Default is `false`.
 */
export function disposeObject3DFully(obj: THREE.Object3D, recursively?: boolean): void