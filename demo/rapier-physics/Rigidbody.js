import * as THREE from "three";
import KVY from "../lib.js";
const { defineProps, readOnly } = KVY.utils.props;

export class Rigidbody extends KVY.Object3DFeature {
	/** @type {true} */
	isRigidbody;

	/** @type {import("@dimforge/rapier3d-compat").RigidBody} */
	rb;

	constructor(object) {
		super(object);
		defineProps(this, { isRigidbody: readOnly(true) });
	}

	syncObjectToBody() {
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
		parent.getWorldQuaternion(parentWorldQuat);

		_qt3.copy(parentWorldQuat).invert().multiply(rbWorldQuat);

		obj.setRotationFromQuaternion(_qt3);
	}

	syncBodyToObjectKinematically() {
		const rb = this.rb;
		if (!rb) return;
		const obj = this.object;
		obj.getWorldPosition(_v);
		obj.getWorldQuaternion(_qt1);
		rb.setNextKinematicTranslation(_v);
		rb.setNextKinematicRotation(_qt1);
	}

	setBodyToObject() {
		const rb = this.rb;
		if (!rb) return;
		const obj = this.object;
		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		obj.getWorldPosition(pos);
		obj.getWorldQuaternion(quat);
		rb.setTranslation(pos.x, pos.y, pos.z);
		rb.setRotation(quat);
	}

	_qt1 = new THREE.Quaternion();
}

const _v = new THREE.Vector3();
const _qt1 = new THREE.Quaternion();
const _qt2 = new THREE.Quaternion();
const _qt3 = new THREE.Quaternion();
