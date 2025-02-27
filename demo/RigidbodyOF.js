import KVY from "./lib.js";

export class RigidbodyOF extends KVY.Object3DFeature {
    /** @type {true} */
    isRigidbodyOF;

	/** @type {import("@dimforge/rapier3d-compat").RigidBody} */
	rb;

	constructor(object) {
		super(object);
		Object.defineProperty(this, "isRigidbodyOF", {
			value: true,
			writable: false,
			configurable: false,
		});
	}
}
