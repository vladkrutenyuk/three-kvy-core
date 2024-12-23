import type * as THREE from "three";
import { AnimationFrameLoop } from "./AnimationFrameLoop";
import { EventEmitter } from "eventemitter3";
import { Evnt } from "./Events";
import { GameContextModule } from "./GameContextModule";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { ThreeContext } from "./ThreeContext";

export type GameContextModulesRecord = Readonly<Record<string, GameContextModule>>;

export class GameContext<
	TModules extends GameContextModulesRecord = GameContextModulesRecord
> extends EventEmitter<GameContextEventTypes> {
	static create<TModules extends GameContextModulesRecord = {}>(
		THREE: typeof import("three"),
		modules?: TModules,
		props?: THREE.WebGLRendererParameters
	) {
		const scene = new THREE.Scene();
		const r = new THREE.WebGLRenderer(props);
		const c = new THREE.PerspectiveCamera();
		const three = new ThreeContext(r, c, scene);
		return new GameContext(three, scene, new THREE.Clock(false), modules);
	}
	public readonly isGameContext = true;

	public readonly loop: AnimationFrameLoop;
	public readonly three: ThreeContext;
	public readonly modules: TModules;
	public get root() {
		return this._root;
	}
	public get featurability() {
		return this._root.userData.featurability;
	}
	public get isDestroyed() {
		return this._isDestroyed;
	}

	public get uniforms() {
		return this.loop.uniforms;
	}
	public get deltaTime() {
		return this.uniforms.deltaTime.value;
	}
	public get time() {
		return this.uniforms.time.value;
	}

	private readonly _root: IFeaturable<TModules>;
	private _isDestroyed = false;

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

		this.modules = modules ?? ({} as TModules);
		for (const key in this.modules) {
			this.modules[key]._init_(this);
		}

		this._root = Object3DFeaturability.from<TModules>(root).setCtx(this).object;

		this.setupFrameLoopPausingOnSwitchTab();
	}

	mountAndRun(container: HTMLDivElement) {
		this.three.mount(container);
		this.loop.run();
	}

	add: IFeaturable<TModules>["add"] = (...args) => {
		return this._root.add(...args);
	};

	remove: IFeaturable<TModules>["remove"] = (...args) => {
		return this._root.remove(...args);
	};

	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;
		this.loop.stop();
		this.three.destroy();
		this.emit(Evnt.Destroy);
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
		three.on("mount", () => {
			window.addEventListener("focus", onWindowFocus);
			window.addEventListener("blur", onWindowBlur);
		});
		three.on("unmount", () => {
			window.removeEventListener("focus", onWindowFocus);
			window.removeEventListener("blur", onWindowBlur);
			loop.stop();
		});
	}

	/**
	 * Call {@link crypto.randomUUID crypto.randomUUID()}, but it works only in secure context.
	 * Define implementation you wish for {@link crypto.randomUUID crypto.randomUUID} manually if you are in unsecure context.
	 */
	static generateUUID = () => {
		return crypto.randomUUID();
	};
}

export type GameContextEventTypes = {
	[Evnt.Destroy]: [];
};
