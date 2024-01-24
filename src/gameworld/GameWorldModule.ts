import GameWorld, { GameWorldModulesRecord } from "./GameWorld"

export default abstract class GameWorldModule {
	private _isInited = false
	public get isInited() {
		return this._isInited
	}
	private _isDestroyed = false
	public get isDestroyed() {
		return this._isDestroyed
	}

	init<TModules extends GameWorldModulesRecord>(world: GameWorld<TModules>) {
		if (this._isInited) return
		this._isInited = true
		this.onInit(world)
		world.addEventListener("destroy", this.onDestroy.bind(this))
	}
	protected abstract onInit<TModules extends GameWorldModulesRecord>(
		world: GameWorld<TModules>
	): void

	protected abstract onDestroy<TModules extends GameWorldModulesRecord>(event: {
		world: GameWorld<TModules>
	}): void
}
