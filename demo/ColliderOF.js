import Kvy4 from "./lib.js";
import { RapierPhysics } from "./RapierPhysics.js";
import { RigidbodyOF } from "./RigidbodyOF.js";
import * as THREE from "three";

export class ColliderOF extends Kvy4.Object3DFeature {
    /** @type {RapierPhysics["RAPIER_API"]} */
    desc;
	constructor(props) {
		super(props);
	}

	/** @param {Kvy4.GameContext} ctx */
	useCtx(ctx) {
		/** @type {RapierPhysics} */
		const rapier = ctx.modules.rapier;
		const world = rapier.world;
		const RAPIER = rapier.RAPIER_API;
		if (!RAPIER || !world) {
			console.error("RAPIER not found, world not created");
			return;
		}
        
        //TODO make it props
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);

		const rbF = this.featurabiliy.getFeature(RigidbodyOF);
		const rb = rbF?.rb ?? undefined;
		if (!rb) {
			const pos = new THREE.Vector3();
			const quat = new THREE.Quaternion();
			this.object.getWorldPosition(pos);
			this.object.getWorldQuaternion(quat);
			colliderDesc.setTranslation(pos.x, pos.y, pos.z).setRotation(quat);
		}

		const collider = world.createCollider(
			RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5),
			rb
		);
		this.collider = collider;
		return () => {
			world.removeCollider(collider);
			this.collider = null;
		};
	}

	// /** @param {Kvy4.GameContext} ctx */
	// onBeforeRender(ctx) {
	//     const pos = this.object.position;
	//     const quat = this.object.quaternion;
	//     this.collider?.setRotation(quat.x, quat.y, quat.z, quat.w);
	//     this.collider?.setTranslation(pos.x, pos.y, pos.z);
	// }
}
