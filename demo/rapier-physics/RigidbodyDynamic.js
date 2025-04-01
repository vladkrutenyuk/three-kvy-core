import KVY from "../lib.js";
import { RapierPhysics } from "./RapierPhysics.js";
import { Rigidbody } from "./Rigidbody.js";
import * as THREE from "three";
const { defineProps, readOnly } = KVY.utils.props;

export class RigidbodyDynamic extends Rigidbody {
	/** @type {true} */
	isRigidbodyDynamic;

	constructor(object) {
		super(object);
		defineProps(this, { isRigidbodyDynamic: readOnly(true) });
	}

	useCtx(ctx) {
		const error = RapierPhysics.validateCtx(ctx);

		/** @type {RapierPhysics} */
		const rapier = ctx.modules.rapier;
		const world = rapier.world;
		const RAPIER = rapier.api;
		
		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		this.object.getWorldPosition(pos);
		this.object.getWorldQuaternion(quat);
		const rbDesc = RAPIER.RigidBodyDesc.dynamic()
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

	onBeforeRender(ctx) {
		this.syncObjectToBody();
	}
}

const _v = new THREE.Vector3();
const _qt1 = new THREE.Quaternion();
const _qt2 = new THREE.Quaternion();
const _qt3 = new THREE.Quaternion();
