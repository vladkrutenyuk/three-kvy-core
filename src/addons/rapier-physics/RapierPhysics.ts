import type * as RAPIER from "@dimforge/rapier3d-compat";
import { CoreContext, CoreContextModule, utils } from "@vladkrutenyuk/three-kvy-core";
import * as THREE from "three";
const { vecFromTuple } = utils;
const { defineProps, readOnly } = utils.props;

export type ModulesWithRapierPhysics = { rapier: RapierPhysics };
export type RapierJsModule = typeof import("@dimforge/rapier3d-compat");

/**
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/addons/RapierPhysics.ts | Source}
 */
export class RapierPhysics extends CoreContextModule<
	{ stepbefore: []; stepafter: [] },
	ModulesWithRapierPhysics
> {
	readonly isRapierPhysics!: true;
	readonly api!: RapierJsModule;
	readonly world!: RAPIER.World;
	readonly eventQueue!: RAPIER.EventQueue;

	/** @default "vary" */
	timeStep: RapierPhysicsOptions["timeStep"];

	private _steppingState = {
		accumulator: 0,
	};

	constructor(Rapier: RapierJsModule, options: Partial<RapierPhysicsOptions> = {}) {
		super();
		const { timeStep = "vary", gravity = [0, -9.81, 0] } = options;
		const world = new Rapier.World(vecFromTuple(gravity));

		this.timeStep = timeStep;

		console.log(`Rapier version: ${Rapier.version()}`);
		defineProps(this, {
			isRapierPhysics: readOnly(true),
			api: readOnly(Rapier),
			world: readOnly(world),
			eventQueue: readOnly(new Rapier.EventQueue(false)),
		});
	}

	protected useCtx(ctx: CoreContext) {
		const foundKey = ctx.findModuleKey<RapierPhysics>(_findModulePredic);
		if (foundKey) {
			if (ctx.modules[foundKey] !== this) {
				console.warn(
					`Instance of 'RapierPhysics' has already been assigned to this context by key '${foundKey}'`
				);
			}
		}
		const world = this.world;
		const three = ctx.three;

		const steppingState = this._steppingState;

		const update = () => {
			const timeStep = this.timeStep;
			const timeStepVariable = timeStep === "vary";

			const clampedDelta = Math.max(Math.min(0.1, ctx.deltaTime), 0);

			if (timeStepVariable) {
				this.stepWorld(clampedDelta);
			} else {
				steppingState.accumulator += clampedDelta;

				while (steppingState.accumulator >= timeStep) {
					//TODO interpolation

					this.stepWorld(timeStep);

					steppingState.accumulator -= timeStep;
				}
			}
		};

		three.on("renderbefore", update);

		return () => {
			three.off("renderbefore", update);
			world.free();
		};
	}

	private stepWorld = (delta: number) => {
		this.emit("stepbefore");
		this.world.timestep = delta;
		this.world.step();
		this.emit("stepafter");
	};

	static findInCtx(ctx: CoreContext): RapierPhysics | undefined {
		const rapier = ctx.modules.rapier;
		if (rapier && rapier instanceof RapierPhysics) return rapier;

		const m = ctx.findModule<RapierPhysics>(_findModulePredic);
		if (m) return m;
	}
}

const _findModulePredic = (m: CoreContextModule) => m instanceof RapierPhysics;

export interface RapierPhysicsOptions {
	/**
	 * Set the gravity of the physics world
	 * @defaultValue [0, -9.81, 0]
	 */
	gravity: THREE.Vector3Tuple;

	/**
	 * Amount of penetration the engine wont attempt to correct
	 * @defaultValue 0.001
	 */
	allowedLinearError: number;

	/**
	 * The number of solver iterations run by the constraints solver for calculating forces.
	 * The greater this value is, the most rigid and realistic the physics simulation will be.
	 * However a greater number of iterations is more computationally intensive.
	 *
	 * @defaultValue 4
	 */
	numSolverIterations: number;

	/**
	 * Number of addition friction resolution iteration run during the last solver sub-step.
	 * The greater this value is, the most realistic friction will be.
	 * However a greater number of iterations is more computationally intensive.
	 *
	 * @defaultValue 4
	 */
	numAdditionalFrictionIterations: number;

	/**
	 * Number of internal Project Gauss Seidel (PGS) iterations run at each solver iteration.
	 * Increasing this parameter will improve stability of the simulation. It will have a lesser effect than
	 * increasing `numSolverIterations` but is also less computationally expensive.
	 *
	 * @defaultValue 1
	 */
	numInternalPgsIterations: number;

	/**
	 * The maximal distance separating two objects that will generate predictive contacts
	 *
	 * @defaultValue 0.002
	 *
	 */
	predictionDistance: number;

	/**
	 * Minimum number of dynamic bodies in each active island
	 *
	 * @defaultValue 128
	 */
	minIslandSize: number;

	/**
	 * Maximum number of substeps performed by the solver
	 *
	 * @defaultValue 1
	 */
	maxCcdSubsteps: number;

	/**
	 * Directly affects the `erp` (Error Reduction Parameter) which is the proportion (0 to 1) of the positional error to be corrected at each time step.
	 * The higher this value is, the more the physics engine will try to correct errors.
	 *
	 * This prop is currently undocumented in the Rapier documentation.
	 *
	 * @see https://github.com/dimforge/rapier/pull/651 where this change was made to Rapier
	 * @defaultValue 30
	 */
	contactNaturalFrequency: number;

	/**
	 * The approximate size of most dynamic objects in the scene.
	 *
	 * This value is used internally to estimate some length-based tolerance.
	 * This value can be understood as the number of units-per-meter in your physical world compared to a human-sized world in meter.
	 *
	 * @defaultValue 1
	 */
	lengthUnit: number;

	/**
	 * Set the timestep for the simulation.
	 * Setting this to a number (eg. 1/60) will run the
	 * simulation at that framerate. Alternatively, you can set this to
	 * "vary", which will cause the simulation to always synchronize with
	 * the current frame delta times.
	 *
	 * @defaultValue 1/60
	 */
	timeStep: number | "vary";

	/**
	 * Pause the physics simulation
	 *
	 * @defaultValue false
	 */
	paused: boolean;

	/**
	 * Interpolate the world transform using the frame delta times.
	 * Has no effect if timeStep is set to "vary".
	 *
	 * @defaultValue true
	 **/
	interpolate: boolean;

	/**
	 * Enable debug rendering of the physics world.
	 * @defaultValue false
	 */
	debug: boolean;
}
