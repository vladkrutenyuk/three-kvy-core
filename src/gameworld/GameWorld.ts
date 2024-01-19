import AnimationFrameLoop from './AnimationFrameLoop'
import GameObject from './GameObject'
import GameWorldModule from './GameWorldModule'
import ThreeRendering, { ThreeRenderingProps } from './ThreeRendering'

export type GameWorldModulesRecord = Readonly<Record<string, GameWorldModule>>

export default class GameWorld<
	TModules extends GameWorldModulesRecord = {}
> extends GameObject<TModules> {
	public readonly isGameWorld = true

	readonly animationFrameLoop: AnimationFrameLoop
	readonly three: ThreeRendering
	readonly modules: TModules

	protected readonly _world: GameWorld<TModules> = this

	constructor(props: { three?: ThreeRenderingProps; modules: TModules }) {
		super()
		this.animationFrameLoop = new AnimationFrameLoop()
		this.three = new ThreeRendering(props.three)
		this.modules = props.modules

		for (const key in this.modules) {
			this.modules[key].init(this)
		}

		this.animationFrameLoop.addEventListener('frame', this.onFrame)
        this.three.addEventListener('mount', this.onMount)
        this.three.addEventListener('unmount', this.onUnmount)
	}

    private onFrame = () => {
        this.three.render()
    }

    private onWindowFocus = () => {
        this.animationFrameLoop.run()
    }

    private onWindowBlur = () => {
        this.animationFrameLoop.stop()
    }

    private onMount = () => {
        window.addEventListener('focus', this.onWindowFocus)
        window.addEventListener('blur', this.onWindowBlur)
    }

    private onUnmount = () => {
        window.removeEventListener('focus', this.onWindowFocus)
        window.removeEventListener('blur', this.onWindowBlur)
    }

	removeFromParent(): this {
		console.error(`It's prohibited to use method 'removeFromParent' for GameWorld`)
		return this
	}

    destroy() {
        this.animationFrameLoop.stop()
        this.three.destroy()
    }
}
