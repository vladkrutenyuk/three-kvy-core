import { CannonEsDebuggerPro } from "@vladkrutenyuk/cannon-es-debugger-pro";
import * as THREE from "three";
import { GameWorld, Feature, FeatureProps } from "@vladkrutenyuk/game-world";
import { CannonPhysicsModule } from "../modules/CannonPhysicsModule";

export class CannonPhysicsDebuggerGof extends Feature<{
	cannon: CannonPhysicsModule;
}> {
	private _cannonDebugger: CannonEsDebuggerPro | null = null;
	private _root: THREE.Group;

	constructor(
		props: FeatureProps<{
			cannon: CannonPhysicsModule;
		}>
	) {
		super(props);
		this._root = new THREE.Group();
		this.gameObject.add(this._root);
	}

	protected onAttach(ctx: GameWorld<{ cannon: CannonPhysicsModule }>) {
		this._cannonDebugger = new CannonEsDebuggerPro(
			this._root,
			ctx.modules.cannon.world
		);
		ctx.modules.cannon.world.addEventListener("postStep", this.update.bind(this));
	}

	protected onDetach(ctx: GameWorld<{ cannon: CannonPhysicsModule }>) {
		ctx.modules.cannon.world.removeEventListener("postStep", this.update);
		this._cannonDebugger?.destroy();
		this._cannonDebugger = null;
		this.gameObject.remove(this._root);
	}

	private update() {
		this._cannonDebugger?.update();
	}
}
