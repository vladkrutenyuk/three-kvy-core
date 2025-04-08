import { IFeaturable, utils } from "@vladkrutenyuk/three-kvy-core";
import { RapierPhysics } from "./RapierPhysics.js";
import { Rigidbody } from "./Rigidbody.js";

const { defineProps, readOnly } = utils.props;

/**
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/addons/RigidbodyDynamic.ts | Source}
 */
export class RigidbodyDynamic extends Rigidbody {
	readonly isRigidbodyDynamic = true;

	constructor(object: IFeaturable) {
		super(object);
		defineProps(this, { isRigidbodyDynamic: readOnly(true) });
	}

	protected useCtx(ctx: typeof this.ctx) {
		const rapier = RapierPhysics.findInCtx(ctx);
		if (!rapier) throw new Error("'RapierPhysics' is not found in context");

		const world = rapier.world;
		const RAPIER = rapier.api;

		const pos = this.getObjWorldPos();
		const quat = this.getObjWorldQuat();
		const rbDesc = RAPIER.RigidBodyDesc.dynamic()
			.setTranslation(pos.x, pos.y, pos.z)
			.setRotation(quat);

		const rb = world.createRigidBody(rbDesc);
		this._rb = rb;

		return () => {
			world.removeRigidBody(rb);
			this._rb = undefined;
		};
	}

	onBeforeRender() {
		this.syncObjectToBody();
	}
}