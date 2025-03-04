import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";
import { AnimationFrameLoop } from "./AnimationFrameLoop";
import { Evnt } from "./Events";
import { GameContextModule } from "./GameContextModule";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { ThreeContext } from "./ThreeContext";

export type GameContextModulesRecord = Record<string, GameContextModule>;

/**
 * Represents the core game context, managing the rendering loop, scene, camera, and game modules.
 * It provides a structured environment for feature-based object management and game logic execution.
 */
export class GameContext<
	TModules extends GameContextModulesRecord = GameContextModulesRecord
> extends EventEmitter<{
	[Evnt.Dstr]: [];
}> {
	/**
	 * Creates a new `GameContext` instance with a Three.js scene, renderer, camera, and optional modules.
	 * @param Three - The Three.js constructors needed for scene, renderer, camera, and clock.
	 * @param modules - Optional set of game context modules.
	 * @param props - Optional parameters for the WebGL renderer.
	 * @returns A new `GameContext` instance.
	 */
	static create<TModules extends GameContextModulesRecord = {}>(
		Three: {
			Scene: typeof THREE.Scene;
			WebGLRenderer: typeof THREE.WebGLRenderer;
			PerspectiveCamera: typeof THREE.PerspectiveCamera;
			Clock: typeof THREE.Clock;
		},
		modules?: TModules,
		props?: THREE.WebGLRendererParameters
	) {
		const scene = new Three.Scene();
		const r = new Three.WebGLRenderer(props);
		const c = new Three.PerspectiveCamera();
		const three = new ThreeContext(r, c, scene);
		return new GameContext(three, scene, new Three.Clock(false), modules);
	}
	/** Identifier to mark this instance as a GameContext. */
	public readonly isGameContext = true;

	/**
	 * Instance of {@link AnimationFrameLoop}, managing the animation frame updates.
	 * Calls {@link ThreeContext.render} on each frame to update the scene.
	 */
	public readonly loop: AnimationFrameLoop;
	/**
	 * Instance of {@link ThreeContext}, handling Three.js rendering and scene management.
	 * Used by {@link AnimationFrameLoop} to render the scene on each frame.
	 */
	public readonly three: ThreeContext;
	/** Stores registered game context modules. */
	public readonly modules: TModules;
	/** Root object in the game scene hierarchy. */
	public get root() {
		return this._root;
	}
	/** Provides access to feature-based object management. */

	/** Indicates whether the game context has been destroyed. */
	public get isDestroyed() {
		return this._isDestroyed;
	}
	/** Provides access to the animation loop's shader uniforms. */
	public get uniforms() {
		return this.loop.uniforms;
	}
	/** The delta time value from the last frame. */
	public get deltaTime() {
		return this.uniforms.deltaTime.value;
	}
	/** The total elapsed time since the loop started. */
	public get time() {
		return this.uniforms.time.value;
	}

	private readonly _root: IFeaturable<TModules>;
	private _isDestroyed = false;

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
		modules?: TModules
	) {
		super();
		this.three = three;
		this.loop = new AnimationFrameLoop(clock, () => {
			this.three.render();
		});

		//@ts-expect-error pisda
		this.modules = {};
		modules && this.setModules(modules);
		this._root = Object3DFeaturability.from<TModules>(root).setCtx(this).object;

		this.setupFrameLoopPausingOnSwitchTab();
	}

	/**
	 * Registers and initializes new or partial game context modules.
	 * @param modules - Partial set of game modules to add.
	 * @returns The current `GameContext` instance.
	 */
	setModules(modules: Partial<TModules>) {
		for (const key in modules) {
			const m = modules[key];
			if (!m) continue;
			this.modules[key] = m;
			m._init_(this);
		}
		return this;
	}

	/**
	 * Mounts the game renderer to the provided HTML container and starts the animation loop.
	 * @param container - The target HTML container element.
	 */
	mountAndRun(container: HTMLDivElement) {
		this.three.mount(container);
		this.loop.run();
	}

	/**
	 * Adds an object or feature to this game context root.
	 */
	add: IFeaturable<TModules>["add"] = (...args) => {
		return this._root.add(...args);
	};

	/**
	 * Removes an object or feature from this game context root.
	 */
	remove: IFeaturable<TModules>["remove"] = (...args) => {
		return this._root.remove(...args);
	};

	/**
	 * Destroys this game context, stopping its loop and cleaning up resources.
	 */
	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;
		this.loop.stop();
		this.three.destroy();
		this.emit(Evnt.Dstr);
	}

	private setupFrameLoopPausingOnSwitchTab() {
		const loop = this.loop;
		const three = this.three;
		const onWindowFocus = () => {
			// console.log("onWindowFocus");
			loop.run();
		};
		const onWindowBlur = () => {
			// console.log("onWindowBlur");
			loop.stop();
		};
		const w = window;
		three.on("mount", () => {
			w.addEventListener("focus", onWindowFocus);
			w.addEventListener("blur", onWindowBlur);
		});
		three.on("unmount", () => {
			w.removeEventListener("focus", onWindowFocus);
			w.removeEventListener("blur", onWindowBlur);
			loop.stop();
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
