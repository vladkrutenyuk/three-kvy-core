import { GameWorld, Feature, FeatureProps } from "@vladkrutenyuk/game-world";
import * as THREE from "three";

export default class TestGof extends Feature<{}> {
	mesh: THREE.Mesh;
	constructor(props: FeatureProps<{}>) {
		super(props);
		this.initEventMethod("onBeforeRender");
		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(),
			new THREE.MeshNormalMaterial()
		);
		this.mesh.scale.setScalar(4);
		this.gameObject.add(this.mesh);
	}

	protected onDestroy() {
		this.gameObject.remove(this.mesh);
	}

	protected onBeforeRender(ctx: GameWorld<{}>): void {
		this.mesh.rotateY(ctx.animationFrameLoop.globalUniforms.deltaTime.value);
	}
}
