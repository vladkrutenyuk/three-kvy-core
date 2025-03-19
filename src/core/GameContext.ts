import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";
import { Evnt } from "./Events";
import {
	GameContextModule,
	IGameContextModuleProtected,
	ReturnOfUseCtx,
} from "./GameContextModule";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { ThreeContext } from "./ThreeContext";
import { defineProps, readOnly } from "../utils/define-props";

export type ModulesRecord = Record<string, GameContextModule>;
export type ModulesRecordDefault = Record<
	string,
	GameContextModule & Record<string, any>
>;

/**
 * Represents the core game context, managing the rendering loop, scene, camera, and game modules.
 * It provides a structured environment for feature-based object management and game logic execution.
 */
export class GameContext<
	TModules extends ModulesRecord = ModulesRecordDefault
> extends EventEmitter<{
	["destroy"]: [];
	["looprun"]: [];
	["loopstop"]: [];
}> {
	/**
	 * Creates a new `GameContext` instance with a Three.js scene, renderer, camera, and optional modules.
	 * @param Three - The Three.js constructors needed for scene, renderer, camera, and clock.
	 * @param modules - Optional set of game context modules.
	 * @param props - Optional parameters for the WebGL renderer.
	 * @returns A new `GameContext` instance.
	 */
	static create<TModules extends ModulesRecord = ModulesRecordDefault>(
		Three: {
			Scene: typeof THREE.Scene;
			WebGLRenderer: typeof THREE.WebGLRenderer;
			PerspectiveCamera: typeof THREE.PerspectiveCamera;
			Raycaster: typeof THREE.Raycaster;
			Clock: typeof THREE.Clock;
		},
		modules?: Partial<TModules>,
		props?: THREE.WebGLRendererParameters
	) {
		const three = ThreeContext.create(Three, props);
		return new GameContext(three, three.scene, new Three.Clock(false), modules);
	}
	/** Identifier to mark this instance as a GameContext. */
	public readonly isGameContext: true;

	/**
	 * Instance of {@link ThreeContext}, handling Three.js rendering and scene management.\
	 * @type {ThreeContext}
	 */
	public readonly three: ThreeContext;

	/** Stores registered game context modules. */
	public readonly modules: TModules;

	/** Root object in the game scene hierarchy. */
	public get root() {
		return this._root;
	}

	/**
	 * Shortcut for `loop.uniforms.deltaTime.value`\
	 * The delta time value from the last frame.
	 */
	public get deltaTime() {
		return this._deltaTime;
	}

	/**
	 * Shortcut for `loop.uniforms.time.value`\
	 * The total elapsed time since the loop started.
	 */
	public get time() {
		return this._time;
	}

	/** Indicates whether the game context has been destroyed. */
	public get isDestroyed() {
		return this._isDestroyed;
	}

	/**
	 * Indicates whether the loop is currently running.
	 */
	public get isRunning() {
		return this._isRunning;
	}

	private readonly _root: IFeaturableRoot<TModules>;
	private readonly _clock: THREE.Clock;
	private _time: number = 0;
	private _deltaTime: number = 0;
	private _isDestroyed = false;
	private _isRunning = false;

	/**
	 * Initializes a new game context with a Three.js environment and optional modules.
	 * @param three - The Three.js context wrapper.
	 * @param root - The root object of the scene.
	 * @param clock - The clock used for frame timing.
	 * @param modules - Optional game modules.
	 */
	constructor(
		three: ThreeContext,
		root: THREE.Object3D,
		clock: THREE.Clock,
		modules?: Partial<TModules>
	) {
		super();
		this._clock = clock;
		defineProps(this, {
			isGameContext: readOnly(true),
			modules: readOnly({}),
			three: readOnly(three),
		});

		const _root = Object3DFeaturability.from<TModules>(root).setCtx(this)
			.object as IFeaturableRoot;
		_root.isRoot = true;
		this._root = _root;

		this.autoPauseOnBlur();

		modules && this.assignModules(modules);
	}

	run() {
		if (this._isRunning || this._isDestroyed) return;
		this._isRunning = true;
		this._clock.start();
		this.three.renderer.setAnimationLoop((time) => {
			//! its very important to getDelta() before getElapsedTime()
			this._deltaTime = this._clock.getDelta();
			this._time = this._clock.getElapsedTime();
			this.three.render();
		});
		this.emit("looprun");
	}

	stop() {
		this._isRunning = false;
		this._clock.stop();
		this.three.renderer.setAnimationLoop(null);
		this.emit("loopstop");
	}

	private _cleanups: Partial<Record<keyof TModules | string, ReturnOfUseCtx>> = {};

	/**
	 * Registers and initializes new or partial game context modules.
	 * @param modules - Partial set of game modules to add.
	 * @returns The current `GameContext` instance.
	 */
	assignModules(modules: Partial<TModules>) {
		for (const key in modules) {
			const m = modules[key];
			m && this.assignModule(key, m);
		}
		return this;
	}

	assignModule<TKey extends keyof TModules>(key: TKey, module: TModules[TKey]) {
		if (this.modules[key]) {
			console.warn(`Key [${key.toString()}] is already assinged in modules.`);
			return;
		}
		this.modules[key] = module;
		const cleanup = (module as typeof module & IGameContextModuleProtected).useCtx(
			this
		);
		this._cleanups[key] = cleanup;
	}

	removeModule(key: keyof TModules) {
		const cleanup = this._cleanups[key];
		delete this._cleanups[key];
		if (cleanup && typeof cleanup === "function") {
			cleanup();
		}
		delete this.modules[key];
	}

	/**
	 * Destroys this game context, stopping its loop and cleaning up resources.
	 */
	destroy(): this {
		if (this._isDestroyed) return this;
		this._isDestroyed = true;
		this.stop();
		this.three.destroy();
		this.emit("destroy");

		Object3DFeaturability.destroy(this._root, true);

		Object.values(this._cleanups).forEach((fn) => fn && fn());

		(["destroy", "looprun", "loopstop"] as const).forEach((x) =>
			this.removeAllListeners(x)
		);

		return this;
	}

	private _paused = false;
	private autoPauseOnBlur() {
		const three = this.three;
		const onWindowBlur = () => {
			if (!this._isRunning) {
				this._paused = true;
			}
			this.stop();
		};
		const onWindowFocus = () => {
			if (!this._paused) return;
			this.run();
		};
		const w = window;
		three.on("mount", () => {
			w.addEventListener("blur", onWindowBlur);
			w.addEventListener("focus", onWindowFocus);
		});
		three.on("unmount", () => {
			w.removeEventListener("blur", onWindowBlur);
			w.removeEventListener("focus", onWindowFocus);
		});
	}

	/**
	 * Generates a unique identifier for `Object3DFeature` instances.
	 * By default, it uses `crypto.randomUUID()`, but falls back to a custom method if unavailable.
	 * @example
	 * ```js
	 * GameContext.generateUUID = yourCustomUuidGenerationFn;
	 * ```
	 */
	static generateUUID = () => {
		try {
			return crypto.randomUUID();
		} catch {
			return `${Math.random()}-${Date.now()}`;
		}
	};
}

export interface IFeaturableRoot<TModules extends ModulesRecord = any>
	extends IFeaturable<TModules> {
	isRoot: true;
}
