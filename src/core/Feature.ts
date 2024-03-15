import * as THREE from "three";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { IFeaturable, ObjectFeaturability } from "./ObjectFeaturablity";
import { CtxAttachableEvent, CtxAttachableEventMap } from "./CtxAttachableEvent";
import { DestroyableEvent, DestroyableEventMap } from "./DestroyableEvent";

export type FeatureEventMap<TModules extends GameContextModulesRecord = {}, TMap extends {} = {} > =
	CtxAttachableEventMap<TModules> & DestroyableEventMap & TMap

export type FeatureProps<
	TModules extends GameContextModulesRecord = {},
	TProps extends {} = {}
> = TProps & {
	object: IFeaturable<TModules>;
};

export abstract class Feature<
	TModules extends GameContextModulesRecord = {},
	TProps extends {} = {},
	TEventMap extends FeatureEventMap<TModules> = FeatureEventMap<TModules>
> extends THREE.EventDispatcher<FeatureEventMap<TModules> & TEventMap> {
	public readonly type: string;
	public readonly id: number;
	public uuid: string;
	public readonly object: IFeaturable<TModules>;
	public featurabiliy: ObjectFeaturability<TModules>;

	protected get world() {
		return this._world;
	}

	private _world: GameContext<TModules> | null = null;

	constructor(props: FeatureProps<TModules, TProps>) {
		super();
		this.type = this.constructor.name;
		this.object = props.object;
		this.featurabiliy = this.object.userData.featurability;
		this.id = _featureId++;
		this.uuid = THREE.MathUtils.generateUUID();

		this.featurabiliy.addEventListener(
			CtxAttachableEvent.ATTACHED_TO_CTX,
			this.objectAttachedToCtxHandler
		);
		this.featurabiliy.addEventListener(
			CtxAttachableEvent.DETACHED_FROM_CTX,
			this.objectDetachedFromCtxHandler
		);

		let reverse: ReturnType<typeof this.useAttachedCtx>;
		this.addEventListener(CtxAttachableEvent.ATTACHED_TO_CTX, ({ ctx }) => {
			this.onAttach(ctx);
			reverse = this.useAttachedCtx(ctx);
		});
		this.addEventListener(CtxAttachableEvent.DETACHED_FROM_CTX, ({ ctx }) => {
			this.onDetach(ctx);
			if (reverse) {
				reverse();
				reverse = undefined;
			}
		});
		this.addEventListener("destroy", () => {
			this.onDestroy();
		});
	}

	/** It is prohibited to call this method manually by yourself! */
	init() {
		this.featurabiliy.world && this.attachToWorld(this.featurabiliy.world);
	}

	destroy() {
		this._log("remove...");
		this.featurabiliy.removeEventListener(
			CtxAttachableEvent.ATTACHED_TO_CTX,
			this.objectAttachedToCtxHandler
		);
		this.featurabiliy.removeEventListener(
			CtxAttachableEvent.DETACHED_FROM_CTX,
			this.objectDetachedFromCtxHandler
		);
		this.detachFromWorld();
		this.featurabiliy.destroyFeature(this);

		//TODO: fix type error
		//@ts-ignore
		this.dispatchEvent(_event.destroy);
	}

	protected useAttachedCtx(_: GameContext<TModules>): undefined | (() => void) | void {
		return;
	}
	protected onAttach(_: GameContext<TModules>) {}
	protected onDetach(_: GameContext<TModules>) {}
	protected onDestroy() {}

	private objectAttachedToCtxHandler = (event: { ctx: GameContext<TModules> }) => {
		this._log("gameObjectAttachedToWorld");
		this.attachToWorld(event.ctx);
	};
	private objectDetachedFromCtxHandler = (_: { ctx: GameContext<TModules> }) => {
		this._log("gameObjectDetachedFromWorld");
		this.detachFromWorld();
	};

	private attachToWorld = (world: GameContext<TModules>) => {
		this._log("attachToWorld...");
		if (this._world) {
			if (this.world === world) return;
			this._log("attachToWorld has world");
			this.detachFromWorld();
		}
		this._world = world;

		_event[CtxAttachableEvent.ATTACHED_TO_CTX].ctx = this._world;
		this._log("attachToWorld done!");
		this.dispatchEvent(_event[CtxAttachableEvent.ATTACHED_TO_CTX]);
	};
	private detachFromWorld = () => {
		this._log("detachFromWorld...");
		if (!this._world) return;
		const world = this._world;
		this._world = null;

		_event[CtxAttachableEvent.DETACHED_FROM_CTX].ctx = world;
		this._log("detachFromWorld done!");

		this.dispatchEvent(_event[DestroyableEvent.DESTROYED]);
	};

	protected initEventMethod(name: keyof typeof _eventMethods) {
		let listener: (() => void) | null = null;

		const init = (world: GameContext<TModules>) => {
			let listener = () => {
				this[name](world);
			};
			world.three.addEventListener(_eventMethods[name], listener);
		};

		this.addEventListener(CtxAttachableEvent.ATTACHED_TO_CTX, (event) => {
			init(event.ctx);
		});
		this.addEventListener(CtxAttachableEvent.DETACHED_FROM_CTX, (event) => {
			listener && event.ctx.three.removeEventListener("beforeRender", listener);
		});

		this._world && init(this._world);
	}
	protected onBeforeRender(_: GameContext<TModules>) {}
	protected onAfterRender(_: GameContext<TModules>) {}
	protected onUnmount(_: GameContext<TModules>) {}
	protected onMount(_: GameContext<TModules>) {}
	protected onResize(_: GameContext<TModules>) {}

	private _log(...args: any[]) {
		console.log(
			`F-${this.object.id} ${this.constructor.name}-${this.id}`,
			...args
		);
	}
}

const _eventMethods = {
	onBeforeRender: "beforeRender",
	onAfterRender: "afterRender",
	onUnmount: "unmount",
	onMount: "mount",
	onResize: "resize",
} as const;

const _event: {
	[K in keyof FeatureEventMap<any>]: { type: K } & FeatureEventMap<any>[K];
} = {
	[CtxAttachableEvent.ATTACHED_TO_CTX]: {
		type: CtxAttachableEvent.ATTACHED_TO_CTX,
		ctx: {} as any,
	},
	[CtxAttachableEvent.DETACHED_FROM_CTX]: {
		type: CtxAttachableEvent.DETACHED_FROM_CTX,
		ctx: {} as any,
	},
	[DestroyableEvent.DESTROYED]: { type: DestroyableEvent.DESTROYED },
};

let _featureId = 0;