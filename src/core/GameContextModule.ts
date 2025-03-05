import { EventEmitter } from "eventemitter3";
import { Evnt } from "./Events";
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
	 * Indicates whether the module has been initialized in {@link GameContext}.
	 */
	public get isInited() {
		return this._isInited;
	}
	/**
	 * Indicates whether the module has been destroyed.
	 */
	public get isDestroyed() {
		return this._isDestroyed;
	}

	private _isInited = false;
	private _isDestroyed = false;

	/**
	 * @private
	 * Initializes the module within the provided {@link GameContext}.
	 * Calls `onInit`, then `useCtx`, and upon context destruction, calls `onDestroy`.
	 *
	 * @template TModules The type of module record in {@link GameContext}.
	 * @param ctx The game context to which the module is added.
	 */
	_init_<TModules extends GameContextModulesRecord>(ctx: GameContext<TModules>) {
		if (this._isInited) return;
		this._isInited = true;
		const cleanup = this.useCtx(ctx);
		ctx.once(
			Evnt.Dstr,
			() => {
				this._isDestroyed = true;
				cleanup && cleanup();
			},
			ctx
		);
	}

	/**
	 * Optionally integrates the module with {@link GameContext} and may return a cleanup function.
	 * Called after `onInit`.
	 *
	 * @template TModules The type of module record in {@link GameContext}.
	 * @param ctx The game context to which the module is added.
	 * @returns A function to detach the module or `undefined` if no cleanup is needed.
	 */
	protected useCtx<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): undefined | (() => void) | void {
		return;
	}
}
