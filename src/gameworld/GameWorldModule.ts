import GameWorld, { GameWorldModulesRecord } from './GameWorld'

export default abstract class GameWorldModule {
	private _isInited = false
	public get isInited() {
		return this._isInited
	}

	init<TModules extends GameWorldModulesRecord>(world: GameWorld<TModules>) {
		if(this._isInited) return
		this._isInited = true
		this.onInit(world)
	}
	abstract onInit<TModules extends GameWorldModulesRecord>(
		world: GameWorld<TModules>
	): void
}
