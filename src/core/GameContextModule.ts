import { DestroyableEvent } from "./DestroyableEvent";
import { GameContext, GameContextModulesRecord } from "./GameContext";

export abstract class GameContextModule {
	public get isInited() {
		return this._isInited;
	}
	public get isDestroyed() {
		return this._isDestroyed;
	}

	private _isInited = false;
	private _isDestroyed = false;

	init<TModules extends GameContextModulesRecord>(ctx: GameContext<TModules>) {
		if (this._isInited) return;
		this._isInited = true;
		let reverse: ReturnType<typeof this.useEffect>;
		reverse = this.useEffect(ctx);
		this.onInit(ctx);
		ctx.addEventListener(DestroyableEvent.DESTROYED, (event) => {
			reverse && reverse();
			this.onDestroy(event.target);
		});
	}

	protected useEffect<TModules extends GameContextModulesRecord>(
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
