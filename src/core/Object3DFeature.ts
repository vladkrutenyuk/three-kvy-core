import { EventEmitter } from "eventemitter3";
import { Evnt } from "./Events";
import { GameContext, GameContextModulesRecord } from "./GameContext";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { extract } from "./factory";

export type Object3DFeatureEventTypes<TModules extends GameContextModulesRecord = {}> = {
	[Evnt.AttCtx]: [ctx: GameContext<TModules>];
	[Evnt.DetCtx]: [ctx: GameContext<TModules>];
	[Evnt.Dstr]: [];
};

/**
 * Base class for features that can be attached to an {@link IFeaturable} object.
 * Features extend {@link EventEmitter} and interact with {@link GameContext}.
 *
 * @template TModules - Type of the game context modules.
 * @template TEventMap - Type of events this feature emits.
 */
export abstract class Object3DFeature<
	TModules extends GameContextModulesRecord = {},
	TEventMap extends EventEmitter.ValidEventTypes = string | symbol
> extends EventEmitter<TEventMap | Object3DFeatureEventTypes<TModules>> {
	/**
	 * Logging function for debugging purposes.
	 * @param {Object3DFeature} target - The feature instance.
	 * @param {string} msg - The log message.
	 */
	static log: (target: Object3DFeature, msg: string) => void = () => {};
	public readonly type: string;
	/** Unique numerical ID of the feature instance. */
	public readonly id: number;
	/** Unique identifier (UUID) of the feature instance. */
	public uuid: string;
	/** The object this feature is attached to. */
	public readonly object: IFeaturable<TModules>;
	/** The featurability instance managing this feature. */
	public featurabiliy: Object3DFeaturability<TModules>;

	/** Getter for the current game context, or `null` if not attached. */
	public get ctx() {
		return this._ctx;
	}

	private _ctx: GameContext<TModules> | null = null;

	/**
	 * Creates an instance of an object feature.
	 *
	 * @param {IFeaturable<TModules>} object - The object that this feature is attached to.
	 */
	constructor(object: IFeaturable) {
		super();
		this.type = this.constructor.name;
		this.object = object;
		this.featurabiliy = extract(object) as Object3DFeaturability<TModules>;
		this.id = _featureId++;
		this.uuid = GameContext.generateUUID();

		this.featurabiliy.on(Evnt.AttCtx, this.objectAttachedToCtxHandler, this);
		this.featurabiliy.on(Evnt.DetCtx, this.objectDetachedFromCtxHandler, this);

		this.on(Evnt.AttCtx, this._onAttach, this);
		this.on(Evnt.DetCtx, this._onDetach, this);
		this.on(Evnt.Dstr, this._onDestroy, this);
	}

	/**
	 * Initializes the feature.
	 * Called internally after instantiation.
	 * @private
	 */
	_init_() {
		this.featurabiliy.ctx && this.attachCtx(this.featurabiliy.ctx);
	}

	/** Destroys the feature, detaching it from the context and cleaning up listeners. */
	destroy() {
		this._log("destroy()");
		this.detachCtx();
		this.featurabiliy.off(Evnt.AttCtx, this.objectAttachedToCtxHandler, this);
		this.featurabiliy.off(Evnt.DetCtx, this.objectDetachedFromCtxHandler, this);
		this.featurabiliy.destroyFeature(this);

		this.emit(Evnt.Dstr);
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

		this.emit(Evnt.AttCtx, ctx);

		this._log("attachCtx() done");
	};
	private detachCtx = () => {
		this._log("detachFromWorld...");
		if (!this._ctx) return;
		const ctx = this._ctx;
		this._ctx = null;

		this.emit(Evnt.DetCtx, ctx);

		this._log("detachFromWorld done!");
	};

	/**
	 * Called when the feature is attached to a {@link GameContext}.
	 * Returns a cleanup function that is called on detach, similar to `useEffect()` in React.
	 *
	 * @param {GameContext<TModules>} ctx - The game context the feature is attached to.
	 * @returns {undefined | (() => void) | void} A cleanup function, or `undefined` if no cleanup is needed.
	 * @override
	 */
	protected useCtx(ctx: GameContext<TModules>): undefined | (() => void) | void {
		return;
	}

	/**
	 * Called when the feature is attached to a game context.
	 * @param {GameContext<TModules>} ctx - The game context.
	 * @override
	 */
	protected onCtxAttach(ctx: GameContext<TModules>) {}

	/**
	 * Called when the feature is detached from a game context {@link GameContext}.
	 * @param {GameContext<TModules>} ctx - The game context {@link GameContext}.
	 * @override
	 */
	protected onCtxDetach(ctx: GameContext<TModules>) {}

	/**
	 * Called when the feature is destroyed.
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

		this.on(Evnt.AttCtx, subscribe);
		this.on(Evnt.DetCtx, unsubscribe);

		this._ctx && subscribe(this._ctx);
	}

	/**
	 * Called before rendering.
	 * @param {GameContext<TModules>} ctx - The game context.
	 * @override
	 */
	onBeforeRender(ctx: GameContext<TModules>) {}
	/**
	 * Called after rendering.
	 * @param {GameContext<TModules>} ctx - The game context.
	 * @override
	 */
	onAfterRender(ctx: GameContext<TModules>) {}
	/**
	 * Called when the game context renderer resizes.
	 * @param {GameContext<TModules>} ctx - The game context.
	 * @override
	 */
	onResize(ctx: GameContext<TModules>) {}
	/**
	 * Called when the feature is mounted.
	 * @param {GameContext<TModules>} ctx - The game context.
	 * @override
	 */
	onMount(ctx: GameContext<TModules>) {}
	/**
	 * Called when the game loop starts.
	 * @param {GameContext<TModules>} ctx - The game context.
	 * @override
	 */
	onUnmount(ctx: GameContext<TModules>) {}
	/**
	 * Called when the game loop starts.
	 * @param {GameContext<TModules>} ctx - The game context.
	 * @override
	 */
	onLoopRun(ctx: GameContext<TModules>) {}
	/**
	 * Called when the game loop stops.
	 * @param {GameContext<TModules>} ctx - The game context.
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
