import * as THREE from 'three'

export default class AnimationFrameLoop extends THREE.EventDispatcher<{
	frame: {}
	run: {}
	stop: {}
}> {
	private _isRunning = false
	public get isRunning() {
		return this._isRunning
	}
	private _animationFrameToken: number | null = null

	private _clock = new THREE.Clock(false)

	public readonly globalUniforms = {
		deltaTime: {
			value: 0
		},
		time: {
			value: 0
		}
	}

	public run() {
		if (this._isRunning) return
		this._isRunning = true
		this._clock.start()

		this.dispatchEvent(_runEvent)
		this.animate()
	}

	public stop() {
		if (!this._isRunning) return
		this._isRunning = false
		this._clock.stop()

		this._animationFrameToken !== null &&
			cancelAnimationFrame(this._animationFrameToken)
		this._animationFrameToken = null
		this.dispatchEvent(_stopEvent)
	}

	private animate = () => {
		this.globalUniforms.deltaTime.value = this._clock.getDelta()
		this.globalUniforms.time.value = this._clock.getElapsedTime()
		this._animationFrameToken = requestAnimationFrame(this.animate)
		this.dispatchEvent(_frameEvent)
	}
}

const _runEvent = { type: 'run' } as const
const _stopEvent = { type: 'stop' } as const
const _frameEvent = { type: 'frame' } as const
