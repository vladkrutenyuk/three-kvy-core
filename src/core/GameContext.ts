import * as THREE from "three";
import { AnimationFrameLoop } from "./AnimationFrameLoop";
import { GameContextModule } from "./GameContextModule";
import { ThreeRendering, ThreeRenderingProps } from "./ThreeRendering";
import { IFeaturable, ObjectFeaturability } from "./ObjectFeaturablity";
import { DestroyableEvent, DestroyableEventMap } from "./DestroyableEvent";

export type GameContextModulesRecord = Readonly<Record<string, GameContextModule>>;

export type GameContextProps<TModules extends GameContextModulesRecord = {}> = {
	three?: ThreeRenderingProps;
	modules: TModules;
	autoRenderOnFrame?: boolean;
};

export class GameContext<
	TModules extends GameContextModulesRecord = {}
> extends THREE.EventDispatcher<DestroyableEventMap> {
	public readonly isGameContext = true;

	public readonly animationFrameLoop: AnimationFrameLoop;
	public readonly three: ThreeRendering;
	public readonly modules: TModules;
	public get isDestroyed() {
		return this._isDestroyed;
	}

	private readonly _root: IFeaturable<TModules>;
	private _isDestroyed = false;

	constructor(props: GameContextProps<TModules>) {
		super();
		this.three = new ThreeRendering(props?.three);
		this.animationFrameLoop = new AnimationFrameLoop();

		this.modules = props?.modules ?? {};
		for (const key in this.modules) {
			this.modules[key].init(this);
		}

		this._root = this.prepareRoot();

		if (props.autoRenderOnFrame) {
			this.animationFrameLoop.addEventListener("frame", this.onFrame.bind(this));
		}

		this.initFrameLoopPausingOnSwitchTab();
	}

	add: typeof this._root.add = (...args) => {
		return this._root.add(...args);
	};

	remove: typeof this._root.remove = (...args) => {
		return this._root.remove(...args);
	};

	getRoot(): ObjectFeaturability<TModules, THREE.Object3D> {
		return this._root.userData.featurability;
	}

	destroy() {
		this._isDestroyed = true;
		this.animationFrameLoop.stop();
		this.three.destroy();
		this.dispatchEvent(_events[DestroyableEvent.DESTROYED]);
	}

	private prepareRoot(): IFeaturable<TModules> {
		const root = ObjectFeaturability.new(THREE.Object3D) as IFeaturable<TModules>;
		root.name = "GameContext_root";
		this.three.scene.add(root);
		root.userData.featurability._setWorld(this);

		// protect from deletion
		root.addEventListener("removed", (event) => {
			if (this._isDestroyed) return;
			console.error("It is prohibited to remove GameContext's root.");
			this.three.scene.add(this._root);
			event.target.userData.featurability._setWorld(this);
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
