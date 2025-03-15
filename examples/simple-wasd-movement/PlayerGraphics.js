import * as KVY from "@vladkrutenyuk/three-kvy-core";
import * as THREE from "three";

export class PlayerGraphics extends KVY.Object3DFeature {
	constructor(object) {
		super(object);
		const capsule = new THREE.Mesh(
			new THREE.CapsuleGeometry(0.5),
			new THREE.MeshNormalMaterial()
		);
		capsule.position.y = 1;

		const axes = new THREE.AxesHelper(3);
		axes.position.y = 0.1;

		this.components = [capsule, axes];
		this.object.add(...this.components);
	}

	onDestroy() {
		for (const component of this.components) {
			component.removeFromParent();
			component.geometry.dispose();
			component.material.dispose();
		}
	}
}
