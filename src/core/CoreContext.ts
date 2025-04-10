import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";
import { defineProps, readOnly } from "../utils/define-props";
import { removeArrayItem } from "../utils/remove-array-item";
import {
	CoreContextModule,
	ICoreContextModuleProtected,
	ReturnOfUseCtx,
} from "./CoreContextModule";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { ThreeContext, ThreeContextParams } from "./ThreeContext";

export type ModulesRecord = Record<string, CoreContextModule>;
export type ModulesRecordDefault = Record<
	string,
	CoreContextModule & Record<string, any>
>;

/**
 * The primary central entity, acting as a main hub, that orchestrates the Three.js environment, animation loop, and module system.\
 * Propagates through features `Object3DFeature` which are added to Three.js `Object3D`.\
 * Provides an elegant lifecycle management system and handles fundametal initializations.
 * @see {@link https://three-kvy-core.vladkrutenyuk.ru/docs/api/core-context | Official Documentation}
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/core/CoreContext.ts | Source}
 */
export class CoreContext<
	TModules extends ModulesRecord = ModulesRecordDefault
> extends EventEmitter<{
	destroy: [];
	looprun: [];
	loopstop: [];
}> {
	/**
	 * Initialization shortcut. Creates and returns a new {@link CoreContext} instance.
	 * @param {typeof import("three")} Three - Object containing Three.js class constructors `WebGLRenderer`, `Scene`, `PerspectiveCamera`, `Clock`, `Raycaster`. In short, just use imported [`THREE`](https://threejs.org/docs/manual/en/introduction/Installation.html) Three.js module.
	 * @param {TModules} modules - (optional) Custom dictionary of any your modules {@link CoreContextModules}.
	 * @param {ThreeContextParams} params - (optional) Object paramateres
	 * @example
	 * ```js
	 *	import * as THREE from "three";
	 *	import * as KVY from "@vladkrutenyuk/three-kvy-core";
	 *
	 *	const modules = {
	 *		moduleA: new MyModuleA(),
	 *		moduleB: new MyModuleB(),
	 *	};
	 *	const ctx = KVY.CoreContext.create(THREE, modules, { renderer: { antialias: true } });
	 *	```
	 * @returns {CoreContext}
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
		params?: ThreeContextParams
	) {
		const three = ThreeContext.create(Three, params);
		return new CoreContext(three, three.scene, modules);
	}
	/** (readonly) Flag to mark that it is an instance of {@link CoreContext}. */
	public readonly isCoreContext!: true;

	/** (readonly) Instance of {@link ThreeContext}. Utility to manage Three.js setup. */
	public readonly three!: ThreeContext;

	/** (readonly) Dictionary of assinged modules.
	 * @type { { [key:string]: CoreContextModule } }
	 */
	public readonly modules!: TModules;

	/**
	 * (readonly) Instance of Three.js `Object3D` that plays the role of entry point for a given context propagation.\
	 * By default, it's Three.js `Scene` instance given in `ThreeContext` of this (`this.root === this.three.scene`).\
	 * You can specify any other `root` if you initialize the context through constructor.
	 * @type {THREE.Object3D}
	 * */
	public get root() {
		return this._root;
	}

	/** (readonly) The seconds passed since the last frame. */
	public get deltaTime() {
		return this._deltaTime;
	}

	/** (readonly) The seconds passed since the context loop started - by {@link run run()}. */
	public get time() {
		return this._time;
	}

	/** (readonly) Flag to check if this instance is destroyed.  */
	public get isDestroyed() {
		return this._isDestroyed;
	}

	/** (readonly) Flag to check if this instance loop is running. */
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
	 * This creates a new {@link CoreContext} instance.
	 * @param three - An instance of {@link ThreeContext}. Utility to manage Three.js setup.
	 * @param {THREE.Object3D} root - (optional) An instance of Three.js `Object3D`. The entry point for context propagation. If root is not providen then Three.js `Scene` from the given {@link ThreeContext} will be taken as root.
	 * @param {TModules} modules - (optional) Custom dictionary of any your modules {@link CoreContextModules}.
	 */
	constructor(three: ThreeContext, root?: THREE.Object3D, modules?: Partial<TModules>) {
		super();
		this._clock = three.clock;
		defineProps(this, {
			isCoreContext: readOnly(true),
			modules: readOnly({}),
			three: readOnly(three),
		});

		const _root = Object3DFeaturability.from<TModules>(root ?? three.scene).setCtx(
			this
		).object as IFeaturableRoot;
		_root.isRoot = true;
		this._root = _root;

		modules && this.assignModules(modules);
	}

	/** Run animation loop and Three.js rendering. Stoppable as many times as you need by `stop()`. */
	run() {
		if (this._isRunning || this._isDestroyed) return;
		this._isRunning = true;
		this._clock.start();
		this.three.renderer.setAnimationLoop(() => {
			// its very important to getDelta() before getElapsedTime()
			this._deltaTime = this._clock.getDelta();
			this._time = this._clock.getElapsedTime();
			this.three.render();
		});
		this.emit("looprun");
	}

	/** Stop animation loop and Three.js rendering. Resumable as many times as you need by `run()`. */
	stop() {
		this._isRunning = false;
		this._clock.stop();
		this.three.renderer.setAnimationLoop(null);
		this.emit("loopstop");
	}

	private _cleanups: Partial<Record<keyof TModules | string, ReturnOfUseCtx>> = {};

	/**
	 * Assigns the given dictionary of modules to this instance.
	 * It will be merged with the existing dictionary of modules.
	 *
	 * @remarks Note that if the given dictionary contains a key for which a module is already assigned,
	 * it will be skipped, and a warning message will be fired.
	 *
	 * @param {{ [key: string]: CoreContextModule }} modules - Dictionary of module instances to assign to this context.
	 */
	assignModules(modules: Partial<TModules>) {
		for (const key in modules) {
			const m = modules[key];
			m && this.assignModule(key, m);
		}
		return this;
	}

	/**
	 * Assign module by key to this instance.
	 * It will be added to the existing dictionary of modules by the given key.
	 *
	 * @remarks Note that if the given key is already assigned, it will be skipped, and a warning message will be fired.
	 * @param {string} key - The key by which to assign the module to the context in the dictionary.
	 * @param {CoreContextModule} module - An instance of `CoreContextModule` implementation.
	 */
	assignModule<TKey extends keyof TModules>(key: TKey, module: TModules[TKey]): this {
		if (this.modules[key]) {
			console.warn(`Key [${key.toString()}] is already assinged in modules.`);
			return this;
		}
		const sameClassModuleKey = this.findModuleKey(
			(m) => m.constructor === module.constructor
		);
		if (sameClassModuleKey) {
			console.warn(
				`A module with the same class as the one under key '${key.toString()}' is already assigned to key '${sameClassModuleKey}'.`
			);
		}
		this.modules[key] = module;
		const m = module as unknown as ICoreContextModuleProtected;
		m._ctx = this;
		const cleanup = m.useCtx<TModules>(this);
		this._cleanups[key] = cleanup;

		this._modulesArray.push(module);
		return this;
	}

	/**
	 * Remove a module by key that was specified when it was assigned.
	 * @param {string} key - key by which a module was assigned.
	 */
	removeModule(key: keyof TModules): this {
		const cleanup = this._cleanups[key];
		delete this._cleanups[key];
		if (cleanup && typeof cleanup === "function") {
			cleanup();
		}
		const m = this.modules[key] as unknown as ICoreContextModuleProtected;
		m._ctx = undefined;
		delete this.modules[key];

		removeArrayItem(this._modulesArray, this.modules[key]);

		return this;
	}

	private _modulesArray: CoreContextModule[] = [];

	/**
	 * Finds a module in this context using a predicate function. Returns the first matching instance of `CoreContextModule` if found, otherwise `undefined`.
	 * @param {(m: CoreContextModule) => boolean} predicate - A predicate function that receives a module instance as an argument and returns a boolean indicating whether the module matches.
	 * @returns {CoreContextModule | undefined}
	 */
	findModule<TModule extends CoreContextModule = CoreContextModule>(
		predicate: (m: TModule) => boolean
	): TModule | undefined {
		return (this._modulesArray as TModule[]).find(predicate);
	}

	/**
	 * Finds the key of a module in this context using a predicate function.
	 * Returns the key of the first matching instance of `CoreContextModule` if found, otherwise `undefined`.
	 * @param {(m: TModule) => boolean} predicate - A predicate function that receives a module instance and returns `true` if it matches the search criteria.
	 * @returns {string | undefined}
	 */
	findModuleKey<TModule extends CoreContextModule = CoreContextModule>(
		predicate: (m: TModule) => boolean
	): string | undefined {
		for (const key in this.modules) {
			const m = this.modules[key];
			if (predicate(m as unknown as TModule)) return key;
		}
	}

	/**
	 * Destroy this instance.
	 * - Sets {@link isDestroyed} to `true` permanently.
	 * - Stops its animation loop permanently.
	 * - Destroys its {@link three three}: {@link ThreeContext} permanently.
	 * - Fires the `"destroy"` event.
	 * - Cleans up {@link root} from the assigned logic when it was designated as `root` in the given CoreContext.
	 * - Removes all assigned {@link modules}.
	 * - Removes all listeners from its events.
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
}

export interface IFeaturableRoot<TModules extends ModulesRecord = any>
	extends IFeaturable<TModules> {
	isRoot: true;
}
