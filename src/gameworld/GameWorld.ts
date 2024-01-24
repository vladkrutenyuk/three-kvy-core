import AnimationFrameLoop from "./AnimationFrameLoop"
import GameObject from "./GameObject"
import GameWorldModule from "./GameWorldModule"
import ThreeRendering, { ThreeRenderingProps } from "./ThreeRendering"

export type GameWorldModulesRecord = Readonly<Record<string, GameWorldModule>>

export type GameWorldEventMap<TModules extends GameWorldModulesRecord = {}> = {
	destroy: { world: GameWorld<TModules> }
}

export default class GameWorld<
	TModules extends GameWorldModulesRecord = {}
> extends GameObject<TModules, GameWorldEventMap> {
	readonly isGameWorld = true

	readonly animationFrameLoop: AnimationFrameLoop
	readonly three: ThreeRendering
	readonly modules: TModules

	protected readonly _world: GameWorld<TModules> = this

	constructor(props: { three?: ThreeRenderingProps; modules: TModules }) {
		super()
		this.three = new ThreeRendering(props.three)
		this.animationFrameLoop = new AnimationFrameLoop()
		this.animationFrameLoop.addEventListener("frame", this.onFrame.bind(this))

		this.three.scene.userData.gameWorldId = this.id
		this.three.scene.add(this)

		this.modules = props.modules
		for (const key in this.modules) {
			this.modules[key].init(this)
		}

		this.initFrameLoopPausingOnSwitchTab()
	}

	private onFrame() {
		this.three.render()
	}

	private initFrameLoopPausingOnSwitchTab = () => {
		const onWindowFocus = () => {
			console.log("onWindowFocus")
			this.animationFrameLoop.run()
		}
		const onWindowBlur = () => {
			console.log("onWindowBlur")
			this.animationFrameLoop.stop()
		}
		this.three.addEventListener("mount", () => {
			window.addEventListener("focus", onWindowFocus)
			window.addEventListener("blur", onWindowBlur)
		})
		this.three.addEventListener("unmount", () => {
			window.removeEventListener("focus", onWindowFocus)
			window.removeEventListener("blur", onWindowBlur)
		})
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
