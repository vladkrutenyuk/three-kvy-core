import * as THREE from "three";
import KVY from "../lib.js";
import { RapierPhysics } from "./RapierPhysics.js";

export class Collider extends KVY.Object3DFeature {
	/** @type {import("@dimforge/rapier3d-compat").ColliderDesc} */
	_params;

	/**
	 *
	 * @param {*} object
	 * @param {import("@dimforge/rapier3d-compat").ColliderDesc} props
	 */
	constructor(object, props) {
		super(object);
		this._params = props;
	}

	setter;
	/**
	 * 
	 * @param {(collider: import("@dimforge/rapier3d-compat").Collider) => any} setter 
	 */
	set(setter) {
		this.setter = setter;
		return this;
	}

	/** @param {KVY.CoreContext} ctx */
	useCtx(ctx) {
		console.log(`-> Collider ${this._params[0]} useCtx`);
		const error = RapierPhysics.validateCtx(ctx);
		if (error) throw new Error(error);
		
		/** @type {RapierPhysics} */
		const rapier = ctx.modules.rapier;
		const world = rapier.world;
		const RAPIER = rapier.api;
		if (!RAPIER || !world) {
			console.error("RAPIER not found, world not created");
			return;
		}

		// RAPIER.ColliderDesc.

		// const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		const [type,...args] = this._params;
		// const colliderArgs = this._params.args;
		const desc = RAPIER.ColliderDesc[type](...args);
		
		//TODO проверять что коллайдер heightfield или trimesh и запрещать их соединять с динам/кинемат rigidbody
		const rbF = KVY.getFeatureBy(this.object, (x) => x.isRigidbody);
		const rb = rbF?.rb ?? undefined;
		if (!rb) {
			const pos = new THREE.Vector3();
			const quat = new THREE.Quaternion();
			this.object.getWorldPosition(pos);
			this.object.getWorldQuaternion(quat);
			desc.setTranslation(pos.x, pos.y, pos.z).setRotation(quat);
		}

		const collider = world.createCollider(desc, rb);
		this.setter && this.setter(collider);
		this.collider = collider;
		return () => {
			world.removeCollider(collider);
			this.collider = null;
		};
	}
}
