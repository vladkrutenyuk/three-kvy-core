import * as THREE from 'three'

export function isScene(obj: THREE.Object3D): obj is THREE.Scene {
	return (obj as THREE.Scene).isScene || obj.type === 'Scene'
}