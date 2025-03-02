import * as THREE from "three";
import KVY from "./lib.js";
import { RapierPhysics } from "./RapierPhysics.js";

export class ColliderOF extends KVY.Object3DFeature {
	/** @type {RapierPhysics["RAPIER_API"]} */
	desc;

	/** @param {KVY.GameContext} ctx */
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

		const rbF = KVY.getFeatureBy(this.object, (x) => x.isRigidbodyOF);
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
}
