import EventEmitter from "eventemitter3";
import { Evnt } from "./Events";
import { GameContext, GameContextModulesRecord } from "./GameContext";

export abstract class GameContextModule<
	TEventTypes extends EventEmitter.ValidEventTypes = string | symbol
> extends EventEmitter<TEventTypes> {
	public get isInited() {
		return this._isInited;
	}
	public get isDestroyed() {
		return this._isDestroyed;
	}

	private _isInited = false;
	private _isDestroyed = false;

	_init_<TModules extends GameContextModulesRecord>(ctx: GameContext<TModules>) {
		if (this._isInited) return;
		this._isInited = true;
		this.onInit(ctx);
		const reverse = this.useCtx(ctx);
		ctx.once(
			Evnt.Destroy,
			() => {
				reverse && reverse();
				this.onDestroy(ctx);
			},
			ctx
		);
	}

	/**
	 * @param ctx {GameContext}
	 * @returns
	 */
	protected useCtx<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): undefined | (() => void) | void {
		return;
	}

	protected abstract onInit<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): void;

	protected abstract onDestroy<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): void;
}
