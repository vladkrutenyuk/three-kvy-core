import { EventEmitter } from "eventemitter3";
import { assertDefined } from "../utils/assert-defined";
import { CoreContext, ModulesRecord, ModulesRecordDefault } from "./CoreContext";
import { defineProps, readOnly } from "../utils/define-props";

/**
 * Base class, acting as a pluggable module, for extending {@link CoreContext} functionality.\
 * It enables clean separation of concerns while maintaining full access to context capabilities.\
 * Modules are assigned to context {@link CoreContext}, can provide services to features {@link Object3DFeature}, and manage their own 
 * lifecycle through the {@link useCtx useCtx(ctx)} pattern.
 * @see {@link https://three-kvy-core.vladkrutenyuk.ru/docs/api/core-context-module | Official Documentation}
 * @see {@link https://github.com/vladkrutenyuk/three-kvy-core/blob/main/src/core/CoreContextModule.ts | Source}
 */
export abstract class CoreContextModule<
	TEventTypes extends EventEmitter.ValidEventTypes = string | symbol,
	TModules extends ModulesRecord = ModulesRecordDefault
> extends EventEmitter<TEventTypes> {
	/** Read-only flag to mark that it is an instance of {@link CoreContextModule}.*/
	readonly isCoreContextModule!: true

	/** 
	 * (readonly) Getter for the instance of {@link CoreContext} this is assigned to.
	 * @warning **Throws exception** if try to access before assign.
	 */
	get ctx(): CoreContext<TModules> {
		return assertDefined(this._ctx, "ctx");
	}
	/** (readonly) Flag to check if this instance has been assigned to some {@link CoreContext}. */
	get hasCtx() {
		return !!this._ctx
	}
	
	private _ctx?: CoreContext<TModules>;

	constructor(){
		super();
		defineProps(this, {
			isCoreContextModule: readOnly(true)
		})
	}

	/**
	 * Overridable Lifecycle Method. Called when the module is assigned to a {@link CoreContext}. \
	 * The returned cleanup function (optional) is called when the module is removed from the context.\
	 * Also cleanup is called if context is destroyed.\
	 * Calling the method manually is prohibited.
	 * @param {CoreContext} ctx - An instance of {@link CoreContext} to which this module was assigned.
	 * @returns {Function | undefined}
	 */
	protected useCtx(ctx: CoreContext<TModules>): ReturnOfUseCtx {
		return;
	}
}

export type ReturnOfUseCtx = undefined | (() => void) | void;

export interface ICoreContextModuleProtected {
	_ctx?: CoreContext<ModulesRecordDefault>
	useCtx<TModules extends ModulesRecord>(ctx: CoreContext<TModules>): ReturnOfUseCtx;
}
