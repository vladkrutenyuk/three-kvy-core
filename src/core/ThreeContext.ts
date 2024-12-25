import { EventEmitter } from "eventemitter3";
import type * as THREE from "three";
import { disposeObject3DFully } from "../utils/dispose-object3d";

export class ThreeContext extends EventEmitter<ThreeContextEventMap, ThreeContext> {
	public readonly renderer: THREE.WebGLRenderer;
	public readonly scene: THREE.Scene;

	public get camera() {
		return this._camera;
	}
	public set camera(value: THREE.PerspectiveCamera) {
		this._camera = value;
		this.cameraChanged();
	}

	public get root() {
		return this._root;
	}
	public get isMounted() {
		return this._isMounted;
	}
	public get isDestroyed() {
		return this._isDestroyed;
	}

	private _camera: THREE.PerspectiveCamera;
	private _root: HTMLDivElement | null = null;
	private _resizeObserver: ResizeObserver | null = null;
	private _isMounted = false;
	private _isDestroyed = false;

	private _srcRenderFn = () => {
		this.renderer.render(this.scene, this._camera);
	};
	private _renderFn = this._srcRenderFn;

	constructor(
		renderer: THREE.WebGLRenderer,
		camera: THREE.PerspectiveCamera,
		scene: THREE.Scene
	) {
		super();

		this.renderer = renderer;
		this.scene = scene;
		this._camera = camera;
		this._renderFn = this._srcRenderFn;
	}

	render() {
		this.emit(ev.RenderBefore);
		this._renderFn();
		this.emit(ev.RenderAfter);
	}

	overrideRenderFn(fn: () => void) {
		this._renderFn = fn;
	}

	resetRenderFn() {
		this._renderFn = this._srcRenderFn;
	}

	mount(root: HTMLDivElement) {
		if (this._isMounted) return;
		this._isMounted = true;

		const canvas = this.renderer.domElement;

		this._root = root;
		root.append(canvas);
		this._resizeObserver = new ResizeObserver(this.resizeHandler);
		this._resizeObserver.observe(root);
		this.resizeHandler();

		canvas.tabIndex = 0;
		canvas.style.touchAction = "none";
		canvas.focus();

		this.emit(ev.Mount, root);
	}

	unmount() {
		if (!this._isMounted) return;
		this._isMounted = false;

		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		this.renderer.domElement.remove();

		this.emit(ev.Unmount);
	}

	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;

		const noRender = () => {
			console.error("render is called after ThreeContext is destroyed.");
		};
		this._renderFn = noRender;
		this._srcRenderFn = noRender;

		this.unmount();
		// this.clearScene(true);
		this.renderer.dispose();

		this.emit(ev.Destroy);
	}

	clearScene(dispose?: boolean) {
		const children = [...this.scene.children];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			this.scene.remove(child);
			dispose && disposeObject3DFully(child, true);
		}
	}

	private _rendererSetSizeTimeout: number | null = null;
	private resizeHandler = () => {
		const root = this._root;
		if (!root) return;

		const width = root.offsetWidth;
		const height = root.offsetHeight;

		const camera = this._camera;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		const timeout = this._rendererSetSizeTimeout;
		if (timeout) {
			window.clearTimeout(timeout);
		}
		this._rendererSetSizeTimeout = window.setTimeout(
			() => this.renderer.setSize(width, height),
			5
		);

		this.emit(ev.Resize, width, height);
	};

	private cameraChanged() {
		const camera = this._camera;
		const root = this._root;
		if (root) {
			camera.aspect = root.offsetWidth / root.offsetHeight;
		}
		camera.updateProjectionMatrix();
		this.emit(ev.CameraChanged, camera);
	}
}

const ev = Object.freeze({
	RenderBefore: "renderbefore",
	RenderAfter: "renderafter",
	Mount: "mount",
	Unmount: "unmount",
	Destroy: "destroy",
	CameraChanged: "camerachanged",
	Resize: "resize",
});
export type ThreeContextEventMap = {
	[ev.RenderBefore]: [];
	[ev.RenderAfter]: [];
	[ev.Mount]: [root: HTMLDivElement];
	[ev.Unmount]: [];
	[ev.Destroy]: [];
	[ev.Resize]: [width: number, height: number];
	[ev.CameraChanged]: [camera: THREE.PerspectiveCamera];
};
