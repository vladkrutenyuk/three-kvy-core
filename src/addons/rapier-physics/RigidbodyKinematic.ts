import { IFeaturable, utils } from "@vladkrutenyuk/three-kvy-core";
import { RapierPhysics } from "./RapierPhysics.js";
import { Rigidbody } from "./Rigidbody.js";
const { defineProps, readOnly } = utils.props;

export const SyncMode = Object.freeze({
	None: 0,
	Obj2Body: 2,
	Body2Obj: 4,
});

export type SyncModeValue = (typeof SyncMode)[keyof typeof SyncMode];

/**
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/addons/RigidbodyKinematic.ts | Source}
 */
export class RigidbodyKinematic extends Rigidbody {
	readonly isRigidbodyKinematic = true;

	private _syncMode: SyncModeValue = 0;

	constructor(object: IFeaturable, props?: { syncMode?: SyncModeValue }) {
		super(object);
		defineProps(this, { isRigidbodyKinematic: readOnly(true) });
		this.setSyncMode(props?.syncMode || 0);
	}

	protected useCtx(ctx: typeof this.ctx) {
		console.log("RigidbodyKinematic useCtx");
		const rapier = RapierPhysics.findInCtx(ctx);
		if (!rapier) throw new Error("'RapierPhysics' is not found in context");
		const world = rapier.world;
		const RAPIER = rapier.api;

		const pos = this.getObjWorldPos();
		const quat = this.getObjWorldQuat();
		const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
			.setTranslation(pos.x, pos.y, pos.z)
			.setRotation(quat);

		const rb = world.createRigidBody(rbDesc);
		this._rb = rb;

		return () => {
			world.removeRigidBody(rb);
			this._rb = undefined;
		};
	}

	getSyncMode() {
		return this._syncMode;
	}

	setSyncMode(mode: 0 | 2 | 4) {
		this._syncMode = mode;
		return this;
	}

	onBeforeRender() {
		switch (this._syncMode) {
			case 2:
				this.syncObjectToBody();
				break;
			case 4:
				this.syncBodyToObjectKinematically();
				break;
		}
	}
}
