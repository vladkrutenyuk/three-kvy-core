import type * as RAPIER from "@dimforge/rapier3d-compat";
import { CoreContext, CoreContextModule, utils } from "@vladkrutenyuk/three-kvy-core";
import * as THREE from "three";
import { RapierDebugRenderer } from "./RapierDebugRenderer.js";
const { defineProps, readOnly } = utils.props;

const g = { x: 0.0, y: -9.81, z: 0.0 };

export type ModulesWithRapierPhysics = { rapier: RapierPhysics };
export type RapierJsModule = typeof import("@dimforge/rapier3d-compat");

/**
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/addons/RapierPhysics.ts | Source}
 */
export class RapierPhysics extends CoreContextModule<
	// { step: [] },
	string,
	ModulesWithRapierPhysics
> {
	readonly isRapierPhysics!: true;
	readonly api!: RapierJsModule;
	readonly world!: RAPIER.World;

	// /** @default 1 / 60 */
	// fixedStep = 1 / 60;

	// /** @default 5 */
	// maxSubSteps = 5;

	get debugEnabled() {
		return this._debugEnabled;
	}
	set debugEnabled(value: boolean) {
		this._debugEnabled = value;
		const debug = this._debug;
		if (debug) {
			debug.enabled = value;
		}
	}
	private _debugEnabled = false;

	private _debug?: RapierDebugRenderer;

	constructor(Rapier: RapierJsModule) {
		super();
		console.log(`Rapier version: ${Rapier.version()}`)
		defineProps(this, {
			isRapierPhysics: readOnly(true),
			api: readOnly(Rapier),
			world: readOnly(new Rapier.World(g)),
		});
	}

	protected useCtx(ctx: CoreContext) {
		const foundKey = ctx.findModuleKey<RapierPhysics>(_findModulePredic);
		if (foundKey) {
			if (ctx.modules[foundKey] !== this) {
				console.warn(`Instance of 'RapierPhysics' has already been assigned to this context by key '${foundKey}'`)
			}
		}
		const world = this.world;
		const three = ctx.three;
		const debugRenderer = new RapierDebugRenderer(three.scene, world);
		debugRenderer.enabled = this._debugEnabled;

		// const fixedStep = this.fixedStep;

		// let accumulator = 0;

		const update = () => {
			// accumulator += ctx.deltaTime;

			// let substeps = 0;

			// while (accumulator >= fixedStep && substeps < this.maxSubSteps) {
			// 	world.timestep = fixedStep;
			// 	world.step();
			// 	this.emit("step");
			// 	accumulator -= fixedStep;
			// 	substeps++;
			// }
			world.timestep = ctx.deltaTime;
			world.step();
			this.emit("step");
			
			debugRenderer.draw();
		};

		this._debug = debugRenderer;

		three.on("renderbefore", update);

		return () => {
			debugRenderer;
			this._debug = undefined;
			three.off("renderbefore", update);
		};
	}

	static validateCtx(ctx: CoreContext<{ rapier: RapierPhysics }>) {
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

	static findInCtx(ctx: CoreContext): RapierPhysics | undefined {
		const rapier = ctx.modules.rapier;
		if (rapier && rapier instanceof RapierPhysics) return rapier;

		const m = ctx.findModule<RapierPhysics>(_findModulePredic);
		if (m) return m;	
	}

	static syncObjectToRigidbody(rb: RAPIER.RigidBody, obj: THREE.Object3D) {
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

const _findModulePredic = (m: CoreContextModule) => m instanceof RapierPhysics;