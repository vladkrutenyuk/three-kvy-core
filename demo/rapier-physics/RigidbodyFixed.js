import KVY from "../lib.js";
import { Rigidbody } from "./Rigidbody.js";
import { RapierPhysics } from "./RapierPhysics.js";
import * as THREE from "three";

const { defineProps, readOnly } = KVY.utils.props;

export class RigidbodyFixed extends Rigidbody {
	/** @type {true} */
	isRigidbodyFixed;

	constructor(object) {
		super(object);
		defineProps(this, { isRigidbodyFixed: readOnly(true) });
	}

	/** @param {KVY.CoreContext<{rapier: RapierPhysics}>} ctx */
	useCtx(ctx) {
		const error = RapierPhysics.validateCtx(ctx);
		if (error) throw error;

		const rapier = ctx.modules.rapier;

		const world = rapier.world;
		const RAPIER = rapier.api;

		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		this.object.getWorldPosition(pos);
		this.object.getWorldQuaternion(quat);
		const rbDesc = RAPIER.RigidBodyDesc.fixed()
			.setTranslation(pos.x, pos.y, pos.z)
			.setRotation(quat);

		const rb = world.createRigidBody(rbDesc);
		this.rb = rb;

        // this.syncBodyToObject();

		return () => {
			world.removeRigidBody(rb);
			this.rb = null;
		};
	}

}
