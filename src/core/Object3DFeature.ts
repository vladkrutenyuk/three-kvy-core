import * as THREE from "three";
import { CtxAttachableEvent, CtxAttachableEventMap } from "./CtxAttachableEvent";
import { DestroyableEvent, DestroyableEventMap } from "./DestroyableEvent";
import {
	GameContext,
	GameContextModulesRecord
} from "./GameContext";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { ThreeContextEventMap } from "./ThreeContext";
import { EventCache } from "../addons/EventCache";

export type Object3DFeatureEventMap<
	TModules extends GameContextModulesRecord = {},
	TMap extends {} = {}
> = CtxAttachableEventMap<TModules> & DestroyableEventMap & TMap;

//TODO add first generic `TObj extends THREE.Object3D`
export type Object3DFeatureProps<
	TModules extends GameContextModulesRecord = {},
	TProps extends {} = {}
> = TProps & {
	object: IFeaturable<TModules>;
};

export abstract class Object3DFeature<
	TModules extends GameContextModulesRecord = {},
	TProps extends {} = {},
	TEventMap extends Object3DFeatureEventMap<TModules> = Object3DFeatureEventMap<TModules>
> extends THREE.EventDispatcher<Object3DFeatureEventMap<TModules> & TEventMap> {
	static log: (target: Object3DFeature, msg: string) => void = () => {};
	public readonly type: string;
	public readonly id: number;
	public uuid: string;
	public readonly object: IFeaturable<TModules>;
	public featurabiliy: Object3DFeaturability<TModules>;

	protected get ctx() {
		return this._ctx;
	}

	private _ctx: GameContext<TModules> | null = null;

	constructor(props: Object3DFeatureProps<TModules, TProps>) {
		super();
		this.type = this.constructor.name;
		this.object = props.object;
		this.featurabiliy = this.object.userData.featurability;
		this.id = _featureId++;
		this.uuid = GameContext.generateUUID();

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
	_init_() {
		this.featurabiliy.ctx && this.attachCtx(this.featurabiliy.ctx);
	}

	destroy() {
		this._log("destroy...");
		this.detachCtx();
		this.featurabiliy.removeEventListener(
			CtxAttachableEvent.ATTACHED_TO_CTX,
			this.objectAttachedToCtxHandler
		);
		this.featurabiliy.removeEventListener(
			CtxAttachableEvent.DETACHED_FROM_CTX,
			this.objectDetachedFromCtxHandler
		);
		this.featurabiliy.destroyFeature(this);

		this.dispatchEvent(cache.use("destroyed"));
	}

	// Attaching/Detaching private methods

	private objectAttachedToCtxHandler = (event: { ctx: GameContext<TModules> }) => {
		this._log("gameObjectAttachedToWorld");
		this.attachCtx(event.ctx);
	};
	private objectDetachedFromCtxHandler = (_: { ctx: GameContext<TModules> }) => {
		this._log("gameObjectDetachedFromWorld");
		this.detachCtx();
	};

	private attachCtx = (ctx: GameContext<TModules>) => {
		this._log("attachToWorld...");
		if (this._ctx) {
			if (this.ctx === ctx) return;
			this._log("attachToWorld has world");
			this.detachCtx();
		}
		this._ctx = ctx;

		this.dispatchEvent(cache.use("attachedtoctx")("ctx", ctx));

		this._log("attachToWorld done!");
	};
	private detachCtx = () => {
		this._log("detachFromWorld...");
		if (!this._ctx) return;
		const ctx = this._ctx;
		this._ctx = null;

		this.dispatchEvent(cache.use("detachedfromctx")("ctx", ctx));

		this._log("detachFromWorld done!");
	};

	// Event methods
	//TODO revise and check this !!!
	protected useEventHandlerMethod<
		TTarget extends THREE.EventDispatcher<any> = THREE.EventDispatcher<any>
	>(
		target: TTarget,
		type: Parameters<TTarget["dispatchEvent"]>[0]["type"],
		handlerMethodName: string
	) {
		let listener: (() => void) | null = null;

		const init = (ctx: GameContext<TModules>) => {
			listener = () => {
				this[handlerMethodName](ctx);
			};
			target.addEventListener(type, listener);
		};

		this.addEventListener(CtxAttachableEvent.ATTACHED_TO_CTX, (event) => {
			init(event.ctx);
		});
		this.addEventListener(CtxAttachableEvent.DETACHED_FROM_CTX, (event) => {
			listener && target.removeEventListener(type, listener);
		});

		this._ctx && init(this._ctx);
	}

	protected useThreeEventHandler(
		type: keyof ThreeContextEventMap,
		handlerMethodName: string
	) {
		let listener: (() => void) | null = null;

		const init = (ctx: GameContext<TModules>) => {
			listener = () => {
				this[handlerMethodName](ctx);
			};
			ctx.three.addEventListener(type, listener);
		};

		this.addEventListener(CtxAttachableEvent.ATTACHED_TO_CTX, (event) => {
			init(event.ctx);
		});
		this.addEventListener(CtxAttachableEvent.DETACHED_FROM_CTX, (event) => {
			listener && event.ctx.three.removeEventListener(type, listener);
		});

		this._ctx && init(this._ctx);
	}

	// Overridable Event Methods

	/**
	 * @param {GameContext} ctx
	 * It is called on **ctx attached**. Returned function is called on **ctx detaching**.
	 * Essentially similar to *useEffect()* from *react*, but ctx atttach/detach instead of component mount/unmount.
	 * @override
	 */
	protected useCtx(ctx: GameContext<TModules>): undefined | (() => void) | void {
		return;
	}

	/** It is called on **ctx attached**. @override */
	protected onAttach(ctx: GameContext<TModules>) {}

	/** It is called in **ctx detached**. @override */
	protected onDetach(ctx: GameContext<TModules>) {}

	/** It is called on this feature destroyed. @override */
	protected onDestroy() {}

	/**
	 * @param {GameContext<TModules>} ctx
	 */
	protected onBeforeRender(ctx: GameContext<TModules>) {}
	protected onAfterRender(ctx: GameContext<TModules>) {}
	protected onResize(ctx: GameContext<TModules>) {}

	// Debug Logs

	private _log(msg: string) {
		Object3DFeature.log(this as unknown as Object3DFeature, msg);
		// console.log(`F-${this.object.id} ${this.constructor.name}-${this.id}`, ...args);
	}
}

// type ExtractEventMap<T> = T extends THREE.EventDispatcher<infer U> ? U : never;
// function useThreeEventHandler<
// 	TTarget extends THREE.EventDispatcher<any> = THREE.EventDispatcher<any>
// >(target: TTarget, type: Parameters<TTarget["dispatchEvent"]>[0]["type"]) {
// 	let listener: (() => void) | null = null;

// 	const init = (ctx: GameContext) => {
// 		listener = () => {
// 			this[handlerMethodName](ctx);
// 		};
// 		ctx.three.addEventListener(type, listener);
// 	};

// 	this.addEventListener(CtxAttachableEvent.ATTACHED_TO_CTX, (event) => {
// 		init(event.ctx);
// 	});
// 	this.addEventListener(CtxAttachableEvent.DETACHED_FROM_CTX, (event) => {
// 		listener && event.ctx.three.removeEventListener(type, listener);
// 	});

// 	this._ctx && init(this._ctx);
// }
// const a = {} as any as ThreeContext;
// useThreeEventHandler(a, "camerachanged");

// const _eventMethods = {
// 	onBeforeRender: "beforeRender",
// 	onAfterRender: "afterRender",
// 	onResize: "resize",
// } as const;

// // const _event: {
// // 	[K in keyof Object3DFeatureEventMap<any>]: {
// // 		type: K;
// // 	} & Object3DFeatureEventMap<any>[K];
// // } = {
// // 	[CtxAttachableEvent.ATTACHED_TO_CTX]: {
// // 		type: CtxAttachableEvent.ATTACHED_TO_CTX,
// // 		ctx: {} as any,
// // 	},
// // 	[CtxAttachableEvent.DETACHED_FROM_CTX]: {
// // 		type: CtxAttachableEvent.DETACHED_FROM_CTX,
// // 		ctx: {} as any,
// // 	},s
// // 	[DestroyableEvent.DESTROYED]: { type: DestroyableEvent.DESTROYED },
// // };
const cache = new EventCache({
	[CtxAttachableEvent.ATTACHED_TO_CTX]: {
		ctx: null as any as GameContext<any>,
	},
	[CtxAttachableEvent.DETACHED_FROM_CTX]: {
		ctx: null as any as GameContext<any>,
	},
	[DestroyableEvent.DESTROYED]: {},
});

let _featureId = 0;
