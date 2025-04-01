import * as THREE from "three";
import KVY from "../lib.js";
import { RapierDebugRenderer } from "./RapierDebugRenderer.js";

const g = { x: 0.0, y: -9.81, z: 0.0 };

export class RapierPhysics extends KVY.CoreContextModule {
	debugRenderer;

	/** @type {typeof import("@dimforge/rapier3d-compat")} */
	api = null;

	/** @type {import("@dimforge/rapier3d-compat").World} */
	world = null;

	/**
	 * @param {typeof import("@dimforge/rapier3d-compat")} Rapier
	 */
	constructor(Rapier) {
		super();
		const RAPIER = Rapier;
		this.api = RAPIER;
		this.world = new RAPIER.World(g);
	}

	/**
	 * @param {KVY.CoreContext} ctx
	 */
	useCtx(ctx) {
		const world = this.world;
		if (!world) {
			console.error("RAPIER not found, world not created");
			return;
		}
		const scene = ctx.three.scene;
		const debugRenderer = new RapierDebugRenderer(scene, world);

		const update = () => {
			world.timestep = Math.min(ctx.deltaTime, 0.01);
			world.step();
			this.emit("step", ctx);
			debugRenderer.update();
		};

		this.debugRenderer = debugRenderer;

		ctx.three.on("renderbefore", update);

		return () => {
			ctx.three.off("renderbefore", update);
		};
	}

	/**
	 * @param {KVY.CoreContext} ctx
	 */
	static validateCtx(ctx) {
		/** @type {RapierPhysics | undefined} */
		const rapier = ctx.modules.rapier;
		if (!rapier) {
			return "RapierPhysics module is undefined in attached context";
		}

		const world = rapier.world;
		const RAPIER = rapier.api;
		if (!RAPIER || !world) {
			return "RAPIER not found, world not created";
		}
		return null;
	}

	// Логика для синхронизации объекта с rigidbody
	static syncObjectToRigidbody(rb, obj) {
		if (!rb || rb.isSleeping()) return;

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
}


const _v = new THREE.Vector3();
const _qt1 = new THREE.Quaternion();
const _qt2 = new THREE.Quaternion();
const _qt3 = new THREE.Quaternion();
