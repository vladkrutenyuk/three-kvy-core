import { EventEmitter } from "eventemitter3";
import { GameContext, GameContextModulesRecord } from "./GameContext";

/**
 * Base class for modules used in {@link GameContext}.
 * Allows adding custom logic and integrating it with the game context.
 *
 * @template TEventTypes Event types that the module can handle.
 *
 * @extends EventEmitter<TEventTypes>
 */
export abstract class GameContextModule<
	TEventTypes extends EventEmitter.ValidEventTypes = string | symbol
> extends EventEmitter<TEventTypes> {
	/**
	 * Optionally integrates the module with {@link GameContext} and may return a cleanup function.
	 * Called after `onInit`.
	 *
	 * @template TModules The type of module record in {@link GameContext}.
	 * @param ctx The game context to which the module is added.
	 * @returns A function to detach the module or nothing if no cleanup is needed.
	 */
	protected useCtx<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): ReturnOfUseCtx {
		return;
	}
}

export type ReturnOfUseCtx = undefined | (() => void) | void;

export interface IGameContextModuleProtected {
	useCtx<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): ReturnOfUseCtx
}