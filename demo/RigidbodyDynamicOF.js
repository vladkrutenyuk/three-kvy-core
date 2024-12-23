import Kvy4 from "./lib.js";
import { RapierPhysics } from "./RapierPhysics.js";
import { RigidbodyOF } from "./RigidbodyOF.js";
import * as THREE from "three";

export class RigidbodyDynamicOF extends RigidbodyOF {
	constructor(props) {
		super(props);
	}

	useCtx(ctx) {
		/** @type {RapierPhysics} */
		const rapier = ctx.modules.rapier;
		const world = rapier.world;
		const RAPIER = rapier.RAPIER_API;
		if (!RAPIER || !world) {
			console.error("RAPIER not found, world not created");
			return;
		}
		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		this.object.getWorldPosition(pos);
		this.object.getWorldQuaternion(quat);
		const rbDesc = RAPIER.RigidBodyDesc.dynamic()
			.setTranslation(pos.x, pos.y, pos.z)
			.setRotation(quat);

		const rb = world.createRigidBody(rbDesc);
		this.rb = rb;

		return () => {
			world.removeRigidBody(rb);
			this.rb = null;
		};
	}

	onBeforeRender(ctx) {
		const rb = this.rb;
		if (!rb || rb.isSleeping()) return;
		const obj = this.object;

		const parent = obj.parent;
		if (!parent) return;

        // sync pos
		_v.copy(rb.translation());
		parent.worldToLocal(_v);
		obj.position.copy(_v);

        // sync rot
		const rbWorldQuat = _qt1;
		rbWorldQuat.copy(rb.rotation());

        const parentWorldQuat = _qt2;
        parent.getWorldQuaternion(parentWorldQuat)

        _qt3.copy(parentWorldQuat).invert().multiply(rbWorldQuat);
        
		obj.setRotationFromQuaternion(_qt3)
	}
}

const _v = new THREE.Vector3();
const _qt1 = new THREE.Quaternion();
const _qt2 = new THREE.Quaternion();
const _qt3 = new THREE.Quaternion();
