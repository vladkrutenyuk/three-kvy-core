import { EventEmitter } from "eventemitter3";
import { Evnt } from "./Events";
import { CoreContext, ModulesRecord, ModulesRecordDefault } from "./CoreContext";
import { IFeaturable, Object3DFeaturability } from "./Object3DFeaturablity";
import { defineProps, readOnly } from "../utils/define-props";
import { assertDefined } from "../utils/assert-defined";

/**
 * Base class for implementing reusable components (features) that can be added to any Three.js Object3D.\
 * Features get the context {@link CoreContext} when their object is added to ctx.root hierarchy, and lose it when removed, or forcibly on call.\
 * Handle the context attach and detach can be through overridable lyfecycle method {@link useCtx useCtx(ctx)} where context is providen as arguement.\
 * Built-in overridable lifecycle event methods like {@link onBeforeRender onBeforeRender(ctx)} etc.
 * Direct access to object {@link object this.object} the feature is attached to.
 * @see {@link https://three-kvy-core.vladkrutenyuk.ru/docs/api/object-3d-feature | Official Documentation}
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/core/Object3DFeature.ts | Source}
 */
export abstract class Object3DFeature<
	TModules extends ModulesRecord = ModulesRecordDefault,
	TEventTypes extends EventEmitter.ValidEventTypes = string | symbol
> extends EventEmitter<TEventTypes> {
	/** (readonly) Flag to mark that it is an instance of `isObject3DFeature`. */
	public readonly isObject3DFeature!: true;

	/** (readonly) Unique increment number for this feature instance. */
	public readonly id!: number;

	/** UUID of feature instance. This gets automatically assigned, so this shouldn't be edited. 
	 * Its generation way can be changed via overriding `Object3DFeature.generateUUID` static method.
	 */
	public uuid: string;

	/** (readonly) An instance of Three.js Object3D which this feature was added to. */
	public readonly object!: IFeaturable<TModules>;

	/**
	 * (readonly) Getter for the current attached `CoreContext`.
	 * @warning **Throws exception** if try to access before it is attached.
	 */
	public get ctx(): CoreContext<TModules> {
		return assertDefined(this._ctx, "ctx");
	}

	/** (readonly) Flag to check if this feature has attached `CoreContext`. */
	public get hasCtx(): boolean {
		return !!this._ctx
	}

	private _ftblty: Object3DFeaturability<TModules>;
	private _ctx: CoreContext<TModules> | null = null;

	/**
	 * @private Must be initiallized through the `addFeature` static factory method.
	 * @param {IFeaturable<TModules>} object - The object that this feature is going to be attached to.
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

		this._log("init");
	}

	/**
	 * Initializes the feature. Called internally after instantiation.
	 * @private
	 */
	init() {
		this._ftblty.ctx && this.attachCtx(this._ftblty.ctx);
	}

	/** Destroys this feature instance. */
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
	 * Overridable Lifecycle Method. Called when some `CoreContext` is attached to this feature. 
	 * The defined returned cleanup function (optional) is called when the context is detached from the feature.
	 * It is prohibitted to be called manually.
	 *
	 * @param {CoreContext<TModules>} ctx - An instance of `CoreContext` which is attached to this feature.
	 * @returns {undefined | (() => void) | void} A cleanup function, or `undefined` if no cleanup is needed.
	 * @override
	 * 
	 * @example
	 * ```
	 * useCtx(ctx) {
	 * 	const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
	 * 	this.object.add(mesh);
	 * 
	 * 	const listener = () => {
	 * 		// ...
	 * 	}
	 * 	const customTicker = ctx.modules.customTicker;
	 * 	customTicker.on("tick", listener);
	 * 
	 * 	return () => {
	 * 		this.object.remove(mesh);
	 * 		mesh.geometry.dispose();
	 * 		mesh.material.dispose();
	 * 
	 * 		customTicker.off("tick", listener);
	 * 	}
	 * }
	 * ```
	 */
	protected useCtx(ctx: CoreContext<TModules>): undefined | (() => void) | void {
		return;
	}

	/**
	 * When this feature `destroy()` is called.
	 * @override
	 */
	protected onDestroy() {}

	/**
	 * Before render is called. On each frame after loop run `ctx.run()` or `ctx.three.render()` is called manually.
	 * @param {CoreContext<TModules>} ctx - The current attached instance of `CoreContext`.
	 * @override
	 */
	onBeforeRender(ctx: CoreContext<TModules>) {}

	/**
	 * After render is called. On each frame after loop run `ctx.run()` or `ctx.three.render()` is called manually.
	 * @param {CoreContext<TModules>} ctx - The current attached instance of `CoreContext`.
	 * @override
	 */
	onAfterRender(ctx: CoreContext<TModules>) {}

	/**
	 * When container (where mounted) is resized.
	 * @param {CoreContext<TModules>} ctx - The current attached instance of `CoreContext`.
	 * @override
	 */
	onResize(ctx: CoreContext<TModules>) {}

	/**
	 * When `ctx.three.mount(container)` is called.
	 * @param {CoreContext<TModules>} ctx - The current attached instance of `CoreContext`.
	 * @override
	 */
	onMount(ctx: CoreContext<TModules>) {}

	/**
	 * When `ctx.three.unmount()` is called.
	 * @param {CoreContext<TModules>} ctx - The current attached instance of `CoreContext`.
	 * @override
	 */
	onUnmount(ctx: CoreContext<TModules>) {}

	/**
	 * When `ctx.run()` is called.
	 * @param {CoreContext<TModules>} ctx - The current attached instance of `CoreContext`.
	 * @override
	 */
	onLoopRun(ctx: CoreContext<TModules>) {}

	/**
	 * When `ctx.stop()` is called.
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
				//@ts-expect-error idi nah
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

	/**
	 * @returns Generates a unique identifier for [`Object3DFeature`](/docs/) instances.\
	 * By default, it uses [`crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), but in case of fall back, it returns `${Math.random()}-${Date.now()}`. 
	 * You can freely override this static method to any of your own generation, e.g:
	 * ```js
	 * CoreContext.generateUUID = () => nanoid(10)
	 * ```
	 */
	static generateUUID = () => {
		try {
			return crypto.randomUUID();
		} catch {
			return `${Math.random()}-${Date.now()}`;
		}
	};

	/**
	 * Static method for overriding to handle logs.
	 * @param {Object3DFeature} target - The feature instance.
	 * @param {string} msg - The log message.
	 */
	static log: (target: Object3DFeature, msg: string) => void = () => {};
}

let _featureId = 0;

interface IPrivateEvent
	extends EventEmitter<{
		[Evnt.AttCtx]: [ctx: CoreContext];
		[Evnt.DetCtx]: [ctx: CoreContext];
		[Evnt.Dstr]: [];
	}> {}
