import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";

export type AnimationFrameLoopEventTypes = {
	/** Emitted when the loop starts running. */
	run: [];
	/** Emitted when the loop stops. */

	stop: [];
};

/**
 * A utility for running a continuous {@link requestAnimationFrame} loop.
 * Calls the provided `onFrame` callback on every animation frame, allowing updates per frame.
 * Also tracks delta time and elapsed time using a `THREE.Clock`, making it useful for animations, physics, and time-dependent logic.
 */
export class AnimationFrameLoop extends EventEmitter<AnimationFrameLoopEventTypes> {
	/**
	 * Shader uniforms containing delta time and elapsed time values.
	 */
	public readonly uniforms = {
		deltaTime: {
			/** The time difference (in seconds) between the current and previous frame. */
			value: 0,
		},
		time: {
			/** The total elapsed time (in seconds) since the loop started. */
			value: 0,
		},
	};

	/**
	 * Indicates whether the loop is currently running.
	 */
	public get isRunning() {
		return this._isRunning;
	}

	private _isRunning = false;
	private _token: number | null = null;
	private _clock: THREE.Clock;

	private onFrame: () => void;

	/**
	 * Creates an instance of the animation frame loop.
	 * @param clock - The clock instance used to track time.
	 * @param onFrame - The callback function to execute on each animation frame.
	 */
	constructor(clock: THREE.Clock, onFrame: () => void) {
		super();
		this._clock = clock;
		this.onFrame = onFrame;
	}

	/**
	 * Starts the animation frame loop if it is not already running.
	 * Emits the "run" event upon starting.
	 */
	run() {
		if (this._isRunning) return;
		this._isRunning = true;
		this._clock.start();

		this.emit("run");
		this.animate();
		console.log("run");
	}

	/**
	 * Stops the animation frame loop if it is running.
	 * Emits the "stop" event upon stopping.
	 */
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
