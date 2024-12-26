import { EventEmitter } from "eventemitter3";
import { Evnt } from "./Events";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";

export type Object3DFeatureEventTypes<TModules extends GameContextModulesRecord = {}> = {
	[Evnt.AttachedCtx]: [ctx: GameContext<TModules>];
	[Evnt.DetachedCtx]: [ctx: GameContext<TModules>];
	[Evnt.Destroy]: [];
};

export abstract class Object3DFeature<
	TModules extends GameContextModulesRecord = {},
	TEventMap extends EventEmitter.ValidEventTypes = string | symbol
> extends EventEmitter<TEventMap | Object3DFeatureEventTypes<TModules>> {
	static log: (target: Object3DFeature, msg: string) => void = () => {};
	public readonly type: string;
	public readonly id: number;
	public uuid: string;
	public readonly object: IFeaturable<TModules>;
	public featurabiliy: Object3DFeaturability<TModules>;

	public get ctx() {
		return this._ctx;
	}

	private _ctx: GameContext<TModules> | null = null;

	constructor(object: IFeaturable) {
		super();
		this.type = this.constructor.name;
		this.object = object;
		this.featurabiliy = this.object.userData.featurability;
		this.id = _featureId++;
		this.uuid = GameContext.generateUUID();

		this.featurabiliy.on(Evnt.AttachedCtx, this.objectAttachedToCtxHandler, this);
		this.featurabiliy.on(Evnt.DetachedCtx, this.objectDetachedFromCtxHandler, this);

		this.on(Evnt.AttachedCtx, this._onAttach, this);
		this.on(Evnt.DetachedCtx, this._onDetach, this);
		this.on(Evnt.Destroy, this._onDestroy, this);
	}
	/** @private */
	_init_() {
		this.featurabiliy.ctx && this.attachCtx(this.featurabiliy.ctx);
	}

	private _useCtxReturn: ReturnType<typeof this.useCtx>;
	private _onAttach(ctx: GameContext<TModules>) {
		this.initCtxEventMethods(ctx);
		this.onCtxAttach(ctx);
		this._useCtxReturn = this.useCtx(ctx);
	}
	private _onDetach(ctx: GameContext<TModules>) {
		this.onCtxDetach(ctx);
		if (!this._useCtxReturn) return;
		this._useCtxReturn();
		this._useCtxReturn = undefined;
	}
	private _onDestroy() {
		this.onDestroy();
	}

	destroy() {
		this._log("destroy()");
		this.detachCtx();
		this.featurabiliy.off(Evnt.AttachedCtx, this.objectAttachedToCtxHandler, this);
		this.featurabiliy.off(Evnt.DetachedCtx, this.objectDetachedFromCtxHandler, this);
		this.featurabiliy.destroyFeature(this);

		this.emit(Evnt.Destroy);
	}

	private objectAttachedToCtxHandler(ctx: GameContext<TModules>) {
		this._log("gameObjectAttachedToWorld");
		this.attachCtx(ctx);
	}
	private objectDetachedFromCtxHandler(_ctx: GameContext<TModules>) {
		this._log("gameObjectDetachedFromWorld");
		this.detachCtx();
	}

	private attachCtx = (ctx: GameContext<TModules>) => {
		this._log("attachCtx()");
		if (this._ctx) {
			if (this._ctx === ctx) return;
			this._log("attachToWorld has world");
			this.detachCtx();
		}
		this._ctx = ctx;

		this.emit(Evnt.AttachedCtx, ctx);

		this._log("attachCtx() done");
	};
	private detachCtx = () => {
		this._log("detachFromWorld...");
		if (!this._ctx) return;
		const ctx = this._ctx;
		this._ctx = null;

		this.emit(Evnt.DetachedCtx, ctx);

		this._log("detachFromWorld done!");
	};

	/**
	 * @param {GameContext} ctx
	 * It is called on **ctx attached**. Returned function is called on **ctx detaching**.
	 * Essentially similar to *useEffect()* from *react*, but ctx atttach/detach instead of component mount/unmount.
	 * @override
	 */
	protected useCtx(ctx: GameContext<TModules>): undefined | (() => void) | void {
		return;
	}

	/**
	 * @param {GameContext} ctx
	 * @override
	 */
	protected onCtxAttach(ctx: GameContext<TModules>) {}

	/**
	 * @param {GameContext} ctx
	 * @override
	 */
	protected onCtxDetach(ctx: GameContext<TModules>) {}

	/**
	 * @override
	 */
	protected onDestroy() {}

	private initCtxEventMethods(ctx: GameContext<TModules>) {
		const p = Object3DFeature.prototype;
		if (this.onAfterRender !== p.onAfterRender) {
			this.initEventHandlerMethod(ctx.three, "renderafter", "onAfterRender");
		}
		if (this.onBeforeRender !== p.onBeforeRender) {
			this.initEventHandlerMethod(ctx.three, "renderbefore", "onBeforeRender");
		}
		if (this.onMount !== p.onMount) {
			this.initEventHandlerMethod(ctx.three, "mount", "onMount");
		}
		if (this.onResize !== p.onResize) {
			this.initEventHandlerMethod(ctx.three, "unmount", "onUnmount");
		}
		if (this.onLoopRun !== p.onLoopRun) {
			this.initEventHandlerMethod(ctx.loop, "run", "onLoopRun");
		}
		if (this.onLoopStop !== p.onLoopStop) {
			this.initEventHandlerMethod(ctx.loop, "stop", "onLoopStop");
		}
	}

	initEventHandlerMethod<TTarget extends EventEmitter, TMethod extends keyof this>(
		target: TTarget,
		type: Parameters<TTarget["on"]>[0],
		handlerMethodName: TMethod
	) {
		let listener: (() => void) | null = null;

		const subscribe = (ctx: GameContext<TModules>) => {
			listener = function () {
				this[handlerMethodName](ctx);
			};
			target.on(type, listener, this);
		};

		const unsubscribe = (ctx: GameContext<TModules>) => {
			if (!listener) return;
			target.off(type, listener, this);
		};

		this.on(Evnt.AttachedCtx, subscribe);
		this.on(Evnt.DetachedCtx, unsubscribe);

		this._ctx && subscribe(this._ctx);
	}

	/**
	 * @param {GameContext<TModules>} ctx
	 * @override
	 */
	onBeforeRender(ctx: GameContext<TModules>) {}
	/**
	 * @param {GameContext<TModules>} ctx
	 * @override
	 */
	onAfterRender(ctx: GameContext<TModules>) {}
	/**
	 * @param {GameContext<TModules>} ctx
	 * @override
	 */
	onResize(ctx: GameContext<TModules>) {}
	/**
	 * @param {GameContext<TModules>} ctx
	 * @override
	 */
	onMount(ctx: GameContext<TModules>) {}
	/**
	 * @param {GameContext<TModules>} ctx
	 * @override
	 */
	onUnmount(ctx: GameContext<TModules>) {}
	/**
	 * @param {GameContext<TModules>} ctx
	 * @override
	 */
	onLoopRun(ctx: GameContext<TModules>) {}
	/**
	 * @param {GameContext<TModules>} ctx
	 * @override
	 */
	onLoopStop(ctx: GameContext<TModules>) {}

	// Debug Logs

	private _log(msg: string) {
		Object3DFeature.log(this as unknown as Object3DFeature, msg);
		// console.log(`F-${this.object.id} ${this.constructor.name}-${this.id}`, ...args);
	}
}

let _featureId = 0;
