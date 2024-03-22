import * as THREE from "three";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { IFeaturable, ObjectFeaturability } from "./ObjectFeaturablity";
import { CtxAttachableEvent, CtxAttachableEventMap } from "./CtxAttachableEvent";
import { DestroyableEvent, DestroyableEventMap } from "./DestroyableEvent";

export type FeatureEventMap<
	TModules extends GameContextModulesRecord = {},
	TMap extends {} = {}
> = CtxAttachableEventMap<TModules> & DestroyableEventMap & TMap;

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

	protected get ctx() {
		return this._ctx;
	}

	private _ctx: GameContext<TModules> | null = null;

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

		let reverse: ReturnType<typeof this.useCtx>;
		this.addEventListener(CtxAttachableEvent.ATTACHED_TO_CTX, ({ ctx }) => {
			this.onAttach(ctx);
			reverse = this.useCtx(ctx);
		});
		this.addEventListener(CtxAttachableEvent.DETACHED_FROM_CTX, ({ ctx }) => {
			this.onDetach(ctx);
			if (reverse) {
				reverse();
				reverse = undefined;
			}
		});
		this.addEventListener(DestroyableEvent.DESTROYED, () => {
			this.onDestroy();
		});
	}

	/** @warning It is prohibited to call this method manually by yourself! */
	_init() {
		this.featurabiliy.world && this.attachToWorld(this.featurabiliy.world);
	}

	destroy() {
		this._log("remove...");
		this.detachFromWorld();
		this.featurabiliy.removeEventListener(
			CtxAttachableEvent.ATTACHED_TO_CTX,
			this.objectAttachedToCtxHandler
		);
		this.featurabiliy.removeEventListener(
			CtxAttachableEvent.DETACHED_FROM_CTX,
			this.objectDetachedFromCtxHandler
		);
		this.featurabiliy.destroyFeature(this);

		this.dispatchEvent(_event[DestroyableEvent.DESTROYED]);
	}

	// Overridable Event Methods

	/**
	 * It is called on **ctx attached**. Returned function is called on **ctx detaching**.
	 * Essentially similar to *useEffect()* from *react*, but ctx atttach/detach instead of component mount/unmount.
	 * @override
	 */
	protected useCtx(_ctx: GameContext<TModules>): undefined | (() => void) | void {
		return;
	}

	/** It is called on **ctx attached**. @override */
	protected onAttach(_ctx: GameContext<TModules>) {}

	/** It is called in **ctx detached**. @override */
	protected onDetach(_ctx: GameContext<TModules>) {}

	/** It is called on this feature destroyed. @override */
	protected onDestroy() {}

	// Attaching/Detaching private methods

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
		if (this._ctx) {
			if (this.ctx === world) return;
			this._log("attachToWorld has world");
			this.detachFromWorld();
		}
		this._ctx = world;

		_event[CtxAttachableEvent.ATTACHED_TO_CTX].ctx = this._ctx;
		this.dispatchEvent(_event[CtxAttachableEvent.ATTACHED_TO_CTX]);

		this._log("attachToWorld done!");
	};
	private detachFromWorld = () => {
		this._log("detachFromWorld...");
		if (!this._ctx) return;
		const ctx = this._ctx;
		this._ctx = null;

		_event[CtxAttachableEvent.DETACHED_FROM_CTX].ctx = ctx;
		this.dispatchEvent(_event[CtxAttachableEvent.DETACHED_FROM_CTX]);

		this._log("detachFromWorld done!");
	};

	// Event methods

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
			listener &&
				event.ctx.three.removeEventListener(_eventMethods[name], listener);
		});

		this._ctx && init(this._ctx);
	}
	protected onBeforeRender(_ctx: GameContext<TModules>) {}
	protected onAfterRender(_ctx: GameContext<TModules>) {}
	protected onResize(_ctx: GameContext<TModules>) {}

	// Debug Logs

	private _log(...args: any[]) {
		console.log(`F-${this.object.id} ${this.constructor.name}-${this.id}`, ...args);
	}
}

const _eventMethods = {
	onBeforeRender: "beforeRender",
	onAfterRender: "afterRender",
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
