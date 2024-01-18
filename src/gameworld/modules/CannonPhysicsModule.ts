import GameWorld from '../GameWorld'
import GameWorldModule from '../GameWorldModule'
import * as CANNON from 'cannon-es'

const _dt = 1 / 30
export default class CannonPhysicsModule extends GameWorldModule {
	readonly world: CANNON.World
	constructor(options?: CANNON.WorldOptions) {
		super()
		this.world = new CANNON.World(options)
	}

	onInit<TModules extends Readonly<Record<string, GameWorldModule>>>(
		world: GameWorld<TModules>
	): void {
		world.three.addEventListener('beforeRender', this.onBeforeRender)
		world.three.addEventListener('destroy', this.onDestroy)
	}

	private onBeforeRender = () => {
		this.world.fixedStep(_dt, 3)
	}

	private onDestroy = () => {
		while (this.world.bodies.length > 0) {
			this.world.removeBody(this.world.bodies[0])
		}
        while (this.world.constraints.length > 0) {
            this.world.removeConstraint(this.world.constraints[0]);
        }
	}
}
