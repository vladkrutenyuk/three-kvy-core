import * as THREE from 'three'
import Feature, { FeatureProps } from '../Feature'
import GameWorld from '../GameWorld'
import CannonEsDebugger from '../extensions/CannonEsDebugger'
import CannonPhysicsModule from '../modules/CannonPhysicsModule'
import { fullObjectDispose } from '../utils/full-object-dispose'

export default class CannonPhysicsDebuggerGof extends Feature<{
	cannon: CannonPhysicsModule
}> {
	// private _cannonDebugger?: ReturnType<typeof CreateCannonDebugger>
	private _cannonDebugger?: CannonEsDebugger
	private _root: THREE.Group

	constructor(
		props: FeatureProps<{
			cannon: CannonPhysicsModule
		}>
	) {
		super(props)
		this._root = new THREE.Group()
		this.gameObject.add(this._root)
	}

	protected onAttach(ctx: GameWorld<{ cannon: CannonPhysicsModule }>) {
		setTimeout(() => {
			this._cannonDebugger = new CannonEsDebugger(
				this._root,
				ctx.modules.cannon.world
			)
		})
		ctx.modules.cannon.world.addEventListener('postStep', this.update.bind(this))
	}

	protected onDetach(ctx: GameWorld<{ cannon: CannonPhysicsModule }>) {
		console.log('CANNNONNN onDetach')
		ctx.modules.cannon.world.removeEventListener('postStep', this.update)
		this._cannonDebugger = undefined
		this.gameObject.remove(this._root)
		fullObjectDispose(this._root)
	}

	private update() {
		this._cannonDebugger?.update()
	}
}
