import * as THREE from "three";
import { EventCache, EventCacheMapInfer } from "../addons/EventCache";

export class AnimationFrameLoop extends THREE.EventDispatcher<AnimationFrameLoopEventMap> {
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

		this.dispatchEvent(cache.use("run"));
		this.animate();
		console.log("run");
	}

	stop() {
		if (!this._isRunning) return;
		console.log("stop");
		this._isRunning = false;
		this._clock.stop();

		this._animationFrameToken !== null &&
			cancelAnimationFrame(this._animationFrameToken);
		this._animationFrameToken = null;
		this.dispatchEvent(cache.use("stop"));
	}

	private animate = () => {
		this.uniforms.deltaTime.value = this._clock.getDelta();
		this.uniforms.time.value = this._clock.getElapsedTime();
		this._animationFrameToken = requestAnimationFrame(this.animate);
		// this.dispatchEvent(_frameEvent);
		this.onFrame();
	};
}

const cache = new EventCache({
	run: {},
	stop: {},
});
export type AnimationFrameLoopEventMap = EventCacheMapInfer<typeof cache>;
