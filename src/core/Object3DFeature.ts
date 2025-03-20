import { EventEmitter } from "eventemitter3";
import { Evnt } from "./Events";
import { CoreContext, ModulesRecord } from "./CoreContext";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { defineProps, readOnly } from "../utils/define-props";

/**
 * Base class for features that can be attached to an {@link IFeaturable} object.
 * Features extend {@link EventEmitter} and interact with {@link CoreContext}.
 *
 * @template TModules - Type of the game context modules.
 * @template TEventTypes - Type of events this feature emits.
 */
export abstract class Object3DFeature<
	TModules extends ModulesRecord = {},
	TEventTypes extends EventEmitter.ValidEventTypes = string | symbol
> extends EventEmitter<TEventTypes> {
	/**
	 * Logging function for debugging purposes.
	 * @param {Object3DFeature} target - The feature instance.
	 * @param {string} msg - The log message.
	 */
	static log: (target: Object3DFeature, msg: string) => void = () => {};

	public readonly isObject3DFeature: true;

	/** Unique numerical ID of the feature instance. */
	public readonly id: number;

	/** The object this feature is attached to. */
	public readonly object: IFeaturable<TModules>;

	/** Unique identifier (UUID) of the feature instance. */
	public uuid: string;

	/** Getter for the current game context, or `null` if not attached. */
	public get ctx() {
		return this._ctx;
	}

	private _ftblty: Object3DFeaturability<TModules>;
	private _ctx: CoreContext<TModules> | null = null;

	/**
	 * @param {IFeaturable<TModules>} object - The object that this feature is attached to.
	 */
	constructor(object: IFeaturable) {
		super();
		this._ftblty = Object3DFeaturability.extract(
			object
		) as Object3DFeaturability<TModules>;
		defineProps(this, {
			id: readOnly(_featureId++),
			isObject3DFeature: readOnly(true),
			object: readOnly(object),
		});
		this.uuid = Object3DFeature.generateUUID();

		this._ftblty.on(Evnt.AttCtx, this.ftbltyAttachedToCtxHandler, this);
		this._ftblty.on(Evnt.DetCtx, this.ftbltyDetachedFromCtxHandler, this);

		// this.on(Evnt.AttCtx, this._onAttach, this);
		// this.on(Evnt.DetCtx, this._onDetach, this);
		// this.on(Evnt.Dstr, this._onDestroy, this);
		this._log("init");
	}

	/**
	 * Initializes the feature. Called internally after instantiation.
	 * @private
	 */
	init() {
		this._ftblty.ctx && this.attachCtx(this._ftblty.ctx);
	}

	/** Destroys the feature, detaching it from the context and cleaning up listeners. */
	destroy() {
		this.detachCtx();
		this._ftblty.off(Evnt.AttCtx, this.ftbltyAttachedToCtxHandler, this);
		this._ftblty.off(Evnt.DetCtx, this.ftbltyDetachedFromCtxHandler, this);
		const destroyed = this._ftblty.destroyFeature(this);
		if (destroyed) {
			this._log("destroyed");
			(this as IPrivateEvent).emit(Evnt.Dstr);
			this.onDestroy();
		}
	}

	private ftbltyAttachedToCtxHandler(ctx: CoreContext<TModules>) {
		this._log("obj attached to ctx");
		this.attachCtx(ctx);
	}
	private ftbltyDetachedFromCtxHandler(_ctx: CoreContext<TModules>) {
		this._log("obj detached from ctx");
		this.detachCtx();
	}

	private _useCtxReturn: ReturnType<typeof this.useCtx>;

	private attachCtx = (ctx: CoreContext<TModules>) => {
		// this._log("attachCtx()");
		if (this._ctx) {
			if (this._ctx === ctx) return;
			// this._log("attachCtx: has ctx");
			this.detachCtx();
		}
		this._ctx = ctx;

		this._log("ctx attached");
		(this as IPrivateEvent).emit(Evnt.AttCtx, ctx);

		// this._log("attachCtx() done");
		this._log("useCtx");
		this._useCtxReturn = this.useCtx(ctx);
		this.initCtxEventMethods(ctx);
	};
	private detachCtx = () => {
		// this._log("detachCtx()");
		if (!this._ctx) return;
		const ctx = this._ctx;
		this._ctx = null;

		(this as IPrivateEvent).emit(Evnt.DetCtx, ctx);

		// this._log("detachCtx() done!");
		this._log("ctx detached");
		if (this._useCtxReturn) {
			this._log("useCtx cleanup");
			this._useCtxReturn();
			this._useCtxReturn = undefined;
		}
	};

	/**
	 * Called when the feature is attached to a {@link CoreContext}.
	 * Returns a cleanup function that is called on detach, similar to `useEffect()` in React.
	 *
	 * @param {CoreContext<TModules>} ctx - The game context the feature is attached to.
	 * @returns {undefined | (() => void) | void} A cleanup function, or `undefined` if no cleanup is needed.
	 * @override
	 */
	protected useCtx(ctx: CoreContext<TModules>): undefined | (() => void) | void {
		return;
	}

	/**
	 * Called when the feature is destroyed.
	 * @override
	 */
	protected onDestroy() {}

	/**
	 * Called before rendering.
	 * @param {CoreContext<TModules>} ctx - The game context.
	 * @override
	 */
	onBeforeRender(ctx: CoreContext<TModules>) {}
	/**
	 * Called after rendering.
	 * @param {CoreContext<TModules>} ctx - The game context.
	 * @override
	 */
	onAfterRender(ctx: CoreContext<TModules>) {}
	/**
	 * Called when the game context renderer resizes.
	 * @param {CoreContext<TModules>} ctx - The game context.
	 * @override
	 */
	onResize(ctx: CoreContext<TModules>) {}
	/**
	 * Called when the feature is mounted.
	 * @param {CoreContext<TModules>} ctx - The game context.
	 * @override
	 */
	onMount(ctx: CoreContext<TModules>) {}
	/**
	 * Called when the game loop starts.
	 * @param {CoreContext<TModules>} ctx - The game context.
	 * @override
	 */
	onUnmount(ctx: CoreContext<TModules>) {}
	/**
	 * Called when the game loop starts.
	 * @param {CoreContext<TModules>} ctx - The game context.
	 * @override
	 */
	onLoopRun(ctx: CoreContext<TModules>) {}
	/**
	 * Called when the game loop stops.
	 * @param {CoreContext<TModules>} ctx - The game context.
	 * @override
	 */
	onLoopStop(ctx: CoreContext<TModules>) {}

	// Debug Logs

	private _log(msg: string) {
		Object3DFeature.log(this as unknown as Object3DFeature, msg);
		// console.log(`F-${this.object.id} ${this.constructor.name}-${this.id}`, ...args);
	}

	private initCtxEventMethods(ctx: CoreContext<TModules>) {
		const p = Object3DFeature.prototype;
		if (this.onAfterRender !== p.onAfterRender) {
			this.iehm(ctx.three, "renderafter", "onAfterRender");
		}
		if (this.onBeforeRender !== p.onBeforeRender) {
			this.iehm(ctx.three, "renderbefore", "onBeforeRender");
		}
		if (this.onMount !== p.onMount) {
			this.iehm(ctx.three, "mount", "onMount");
		}
		if (this.onResize !== p.onResize) {
			this.iehm(ctx.three, "unmount", "onUnmount");
		}
		if (this.onLoopRun !== p.onLoopRun) {
			this.iehm(ctx, "looprun", "onLoopRun");
		}
		if (this.onLoopStop !== p.onLoopStop) {
			this.iehm(ctx, "loopstop", "onLoopStop");
		}
	}

	/**
	 * initEventHandlerMethod (iehm)
	 */
	private iehm<TTarget extends EventEmitter, TMethod extends keyof this>(
		target: TTarget,
		type: Parameters<TTarget["on"]>[0],
		handlerMethodName: TMethod
	) {
		let listener: (() => void) | null = null;

		const subscribe = (ctx: CoreContext) => {
			listener = function () {
				this[handlerMethodName](ctx);
			};
			target.on(type, listener, this);
		};

		const unsubscribe = () => {
			if (!listener) return;
			target.off(type, listener, this);
		};

		(this as IPrivateEvent).on(Evnt.AttCtx, subscribe);
		(this as IPrivateEvent).on(Evnt.DetCtx, unsubscribe);

		this._ctx && subscribe(this._ctx);
	}

	static generateUUID = () => {
		try {
			return crypto.randomUUID();
		} catch {
			return `${Math.random()}-${Date.now()}`;
		}
	};
}

let _featureId = 0;

interface IPrivateEvent
	extends EventEmitter<{
		[Evnt.AttCtx]: [ctx: CoreContext];
		[Evnt.DetCtx]: [ctx: CoreContext];
		[Evnt.Dstr]: [];
	}> {}
