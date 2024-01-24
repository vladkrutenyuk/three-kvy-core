import GameWorld from "../GameWorld"
import GameWorldModule from "../GameWorldModule"
import * as CANNON from "cannon-es"

export default class CannonPhysicsModule extends GameWorldModule {
	readonly world: CANNON.World
	readonly fixedStep: number
	readonly maxSubSteps: number

	constructor(props?: {options?: CANNON.WorldOptions, fixedStep?: number, maxSubSteps?: number}) {
		super()
		this.world = new CANNON.World(props?.options)
		this.fixedStep = props?.fixedStep ?? 1 / 30
		this.maxSubSteps = props?.maxSubSteps ?? 3
	}

	protected onInit<TModules extends Readonly<Record<string, GameWorldModule>>>(
		world: GameWorld<TModules>
	): void {
		world.three.addEventListener("beforeRender", this.onBeforeRender)
	}

	protected onDestroy<TModules extends Readonly<Record<string, GameWorldModule>>>(event: {
		world: GameWorld<TModules>
	}): void {
		event.world.three.removeEventListener("beforeRender", this.onBeforeRender)
		while (this.world.bodies.length > 0) {
			this.world.removeBody(this.world.bodies[0])
		}
		while (this.world.constraints.length > 0) {
			this.world.removeConstraint(this.world.constraints[0])
		}
	}

	private onBeforeRender = () => {
		this.world.fixedStep(this.fixedStep, this.maxSubSteps)
	}
}
