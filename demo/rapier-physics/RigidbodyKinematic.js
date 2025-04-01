import KVY from "../lib.js";
import { Rigidbody } from "./Rigidbody.js";
import { RapierPhysics } from "./RapierPhysics.js";
import * as THREE from "three";

const { defineProps, readOnly } = KVY.utils.props;

export const SyncMode = Object.freeze({
	None: 0,
	Obj2Body: 2,
	Body2Obj: 4,
});

export class RigidbodyKinematic extends Rigidbody {
	/** @type {true} */
	isRigidbodyKinematic;

	/** @type {import("@dimforge/rapier3d-compat").RigidBody} */
	rb;

	_syncMode = 0;

	constructor(object, props) {
		super(object);
		defineProps(this, { isRigidbodyKinematic: readOnly(true) });
		this.setSyncMode(props.syncMode);
	}

	/** @param {KVY.CoreContext<{rapier:RapierPhysics}>} ctx  */
	useCtx(ctx) {
        console.log("RigidbodyKinematic useCtx");
		const error = RapierPhysics.validateCtx(ctx);
		if (error) throw error;

		const rapier = ctx.modules.rapier;
		const world = rapier.world;
		const RAPIER = rapier.api;

		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		this.object.getWorldPosition(pos);
		this.object.getWorldQuaternion(quat);
		const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
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

	getSyncMode() {
		return this._syncMode;
	}
	setSyncMode(mode) {
		this._syncMode = mode;
		return this;
	}

	onBeforeRender(ctx) {
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

const _v = new THREE.Vector3();
const _qt1 = new THREE.Quaternion();
const _qt2 = new THREE.Quaternion();
const _qt3 = new THREE.Quaternion();
