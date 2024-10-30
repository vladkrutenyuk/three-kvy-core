import * as THREE from "three";
import { AnimationFrameLoop } from "./AnimationFrameLoop";
import { DestroyableEvent, DestroyableEventMap } from "./DestroyableEvent";
import { GameContextModule } from "./GameContextModule";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { ThreeContext, ThreeContextProps } from "./ThreeContext";

export interface GlobalGameContextModules {}
export type GameContextModulesRecord = Readonly<Record<string, GameContextModule>> &
	GlobalGameContextModules;

export type GameContextProps<
	TModules extends GameContextModulesRecord = GameContextModulesRecord
> = {
	three?: ThreeContextProps;
	modules: TModules;
	autoRenderOnFrame?: boolean;
};

export class GameContext<
	TModules extends GameContextModulesRecord = GameContextModulesRecord
> extends THREE.EventDispatcher<DestroyableEventMap> {
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
		return this.animationFrameLoop.globalUniforms.deltaTime.value;
	}
	public get time() {
		return this.animationFrameLoop.globalUniforms.time.value;
	}

	private readonly _root: IFeaturable<TModules>;
	private _isDestroyed = false;

	constructor(props: GameContextProps<TModules>) {
		super();
		this.three = new ThreeContext(props?.three);
		this.animationFrameLoop = new AnimationFrameLoop();

		this.modules = props?.modules ?? {};
		for (const key in this.modules) {
			this.modules[key].init(this);
		}

		this._root = this.prepareRoot();

		if (props.autoRenderOnFrame !== false) {
			this.animationFrameLoop.addEventListener("frame", this.onFrame.bind(this));
		}

		this.initFrameLoopPausingOnSwitchTab();
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

	private prepareRoot(): IFeaturable<TModules> {
		const root = Object3DFeaturability.new(THREE.Object3D) as IFeaturable<TModules>;
		root.name = "GameContext_root";
		this.three.scene.add(root);
		root.userData.featurability._setWorld(this);

		// protect from deletion
		root.addEventListener("removed", (event) => {
			if (this._isDestroyed) return;
			console.error("It is prohibited to remove GameContext's root.");
			const target = event.target;
			this.three.scene.add(target);
			target.userData.featurability._setWorld(this);
		});

		return root;
	}

	private onFrame() {
		this.three.render();
	}

	private initFrameLoopPausingOnSwitchTab() {
		const onWindowFocus = () => {
			// console.log("onWindowFocus");
			this.animationFrameLoop.run();
		};
		const onWindowBlur = () => {
			// console.log("onWindowBlur");
			this.animationFrameLoop.stop();
		};
		this.three.addEventListener("mount", () => {
			window.addEventListener("focus", onWindowFocus);
			window.addEventListener("blur", onWindowBlur);
		});
		this.three.addEventListener("unmount", () => {
			window.removeEventListener("focus", onWindowFocus);
			window.removeEventListener("blur", onWindowBlur);
		});
	}
}

const _events = {
	[DestroyableEvent.DESTROYED]: {
		type: DestroyableEvent.DESTROYED,
	},
};
