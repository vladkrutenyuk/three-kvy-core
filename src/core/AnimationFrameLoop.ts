import * as THREE from "three";

export class AnimationFrameLoop extends THREE.EventDispatcher<{
	frame: {};
	run: {};
	stop: {};
}> {
	public readonly uniforms = {
		deltaTime: {
			value: 0,
		},
		time: {
			value: 0,
		},
	};
	public get isRunning() {
		return this._isRunning;
	}

	private _isRunning = false;
	private _animationFrameToken: number | null = null;
	private _clock = new THREE.Clock(false);

	constructor() {
		super();
	}

	run() {
		if (this._isRunning) return;
		this._isRunning = true;
		this._clock.start();

		this.dispatchEvent(_runEvent);
		this.animate();
	}

	stop() {
		if (!this._isRunning) return;
		this._isRunning = false;
		this._clock.stop();

		this._animationFrameToken !== null &&
			cancelAnimationFrame(this._animationFrameToken);
		this._animationFrameToken = null;
		this.dispatchEvent(_stopEvent);
	}

	private animate = () => {
		this.uniforms.deltaTime.value = this._clock.getDelta();
		this.uniforms.time.value = this._clock.getElapsedTime();
		this._animationFrameToken = requestAnimationFrame(this.animate);
		this.dispatchEvent(_frameEvent);
	};
}

const _runEvent = { type: "run" } as const;
const _stopEvent = { type: "stop" } as const;
const _frameEvent = { type: "frame" } as const;
