import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";

export type AnimationFrameLoopEventTypes = {
	run: [];
	stop: [];
};

export class AnimationFrameLoop extends EventEmitter<AnimationFrameLoopEventTypes> {
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
	private _token: number | null = null;
	private _clock: THREE.Clock;

	private onFrame: () => void;

	constructor(clock: THREE.Clock, onFrame: () => void) {
		super();
		this._clock = clock;
		this.onFrame = onFrame;
	}

	run() {
		if (this._isRunning) return;
		this._isRunning = true;
		this._clock.start();

		this.emit("run");
		this.animate();
		console.log("run");
	}

	stop() {
		if (!this._isRunning) return;
		console.log("stop");
		this._isRunning = false;
		this._clock.stop();

		this._token !== null && cancelAnimationFrame(this._token);
		this._token = null;
		this.emit("stop");
	}

	private animate = () => {
		this.uniforms.deltaTime.value = this._clock.getDelta();
		this.uniforms.time.value = this._clock.getElapsedTime();
		this._token = requestAnimationFrame(this.animate);
		this.onFrame();
	};
}
