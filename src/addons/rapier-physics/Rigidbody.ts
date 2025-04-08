import type * as RAPIER from "@dimforge/rapier3d-compat";
import { IFeaturable, Object3DFeature, utils } from "@vladkrutenyuk/three-kvy-core";
import * as THREE from "three";
import { ModulesWithRapierPhysics } from "./RapierPhysics";

/**
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/addons/Rigidbody.ts | Source}
 */
export class Rigidbody extends Object3DFeature<ModulesWithRapierPhysics> {
	readonly isRigidbody = true;

	get rb() {
		return utils.assertDefined(this._rb, "rb");
	}
	protected _rb?: RAPIER.RigidBody;

	constructor(object: IFeaturable) {
		super(object);
		utils.props.defineProps(this, { isRigidbody: utils.props.readOnly(true) });
	}

	getObjWorldPos() {
		this.object.getWorldPosition(_v);
		return _v;
	}
	getObjWorldQuat() {
		this.object.getWorldQuaternion(_qt1);
		return _qt1;
	}

	syncObjectToBody() {
		const rb = this._rb;
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
		parent.getWorldQuaternion(parentWorldQuat);

		_qt3.copy(parentWorldQuat).invert().multiply(rbWorldQuat);

		obj.setRotationFromQuaternion(_qt3);
	}

	syncBodyToObjectKinematically() {
		const rb = this._rb;
		if (!rb) return;
		const obj = this.object;
		obj.getWorldPosition(_v);
		obj.getWorldQuaternion(_qt1);
		rb.setNextKinematicTranslation(_v);
		rb.setNextKinematicRotation(_qt1);
	}

	setBodyToObject() {
		const rb = this._rb;
		if (!rb) return;
		const obj = this.object;
		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		obj.getWorldPosition(pos);
		obj.getWorldQuaternion(quat);
		rb.setTranslation(pos, true);
		rb.setRotation(quat, true);
	}
}

const _v = new THREE.Vector3();
const _qt1 = new THREE.Quaternion();
const _qt2 = new THREE.Quaternion();
const _qt3 = new THREE.Quaternion();
