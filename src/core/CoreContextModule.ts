import { EventEmitter } from "eventemitter3";
import { CoreContext, ModulesRecord } from "./CoreContext";

/**
 * Base class for modules used in {@link CoreContext}.
 * Allows adding custom logic and integrating it with the game context.
 *
 * @template TEventTypes Event types that the module can handle.
 *
 * @extends EventEmitter<TEventTypes>
 */
export abstract class CoreContextModule<
	TEventTypes extends EventEmitter.ValidEventTypes = string | symbol
> extends EventEmitter<TEventTypes> {
	/**
	 * Optionally integrates the module with {@link CoreContext} and may return a cleanup function.
	 * Called after `onInit`.
	 *
	 * @template TModules The type of module record in {@link CoreContext}.
	 * @param ctx The game context to which the module is added.
	 * @returns A function to detach the module or nothing if no cleanup is needed.
	 */
	protected useCtx<TModules extends ModulesRecord>(
		ctx: CoreContext<TModules>
	): ReturnOfUseCtx {
		return;
	}
}

export type ReturnOfUseCtx = undefined | (() => void) | void;

export interface ICoreContextModuleProtected {
	useCtx<TModules extends ModulesRecord>(
		ctx: CoreContext<TModules>
	): ReturnOfUseCtx
}