import * as THREE from "three";
import { AnimationFrameLoop } from "./AnimationFrameLoop";
import { DestroyableEvent, DestroyableEventMap } from "./DestroyableEvent";
import { GameContextModule } from "./GameContextModule";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { ThreeContext } from "./ThreeContext";

// type ThreeObject = {
// 	WebGLRenderer: typeof THREE.WebGLRenderer
// }

export type GameContextModulesRecord = Readonly<Record<string, GameContextModule>>;

export class GameContext<
	TModules extends GameContextModulesRecord = GameContextModulesRecord
> extends THREE.EventDispatcher<DestroyableEventMap> {
	static create<TModules extends GameContextModulesRecord = {}>(
		THREE: typeof import("three"),
		modules?: TModules,
		props?: THREE.WebGLRendererParameters,
	) {
		const scene = new THREE.Scene();
		const r = new THREE.WebGLRenderer(props);
		const c = new THREE.PerspectiveCamera();
		const three = new ThreeContext(r, c, scene);
		return new GameContext(three, scene, modules);
	}
	public readonly isGameContext = true;

	public readonly animationFrameLoop: AnimationFrameLoop;
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

	public get deltaTime() {
		return this.animationFrameLoop.uniforms.deltaTime.value;
	}
	public get time() {
		return this.animationFrameLoop.uniforms.time.value;
	}

	private readonly _root: IFeaturable<TModules>;
	private _isDestroyed = false;

	constructor(three: ThreeContext, root: THREE.Object3D, modules?: TModules) {
		super();
		this.three = three;
		this.animationFrameLoop = new AnimationFrameLoop();

		this.modules = modules ?? ({} as TModules);
		for (const key in this.modules) {
			this.modules[key].init(this);
		}

		const _root = Object3DFeaturability.wrap<typeof root, TModules>(root);
		this._root = _root;
		_root.userData.featurability.setCtx(this);

		this.animationFrameLoop.addEventListener("frame", () => {
			this.three.render();
		});

		this.initFrameLoopPausingOnSwitchTab();
	}

	mountAndRun(container: HTMLDivElement) {
		this.three.mount(container);
		this.animationFrameLoop.run();
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
		this.animationFrameLoop.stop();
		this.three.destroy();
		this.dispatchEvent(_events[DestroyableEvent.DESTROYED]);
	}

	private initFrameLoopPausingOnSwitchTab() {
		const loop = this.animationFrameLoop;
		const three = this.three;
		const onWindowFocus = () => {
			// console.log("onWindowFocus");
			loop.run();
		};
		const onWindowBlur = () => {
			// console.log("onWindowBlur");
			loop.stop();
		};
		three.addEventListener("mount", () => {
			window.addEventListener("focus", onWindowFocus);
			window.addEventListener("blur", onWindowBlur);
		});
		three.addEventListener("unmount", () => {
			window.removeEventListener("focus", onWindowFocus);
			window.removeEventListener("blur", onWindowBlur);
			loop.stop();
		});
	}
}

const _events = {
	[DestroyableEvent.DESTROYED]: {
		type: DestroyableEvent.DESTROYED,
	},
};
