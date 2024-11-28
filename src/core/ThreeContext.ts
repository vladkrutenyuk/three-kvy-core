import * as THREE from "three";
import { fullObjectDispose } from "../utils/three/full-object-dispose";

export type ThreeContextEventMap = {
	beforeRender: {};
	afterRender: {};
	mount: {
		root: HTMLDivElement;
	};
	unmount: {};
	destroy: {};
	resize: {
		width: number;
		height: number;
	};
	camerachanged: {};
};

export class ThreeContext extends THREE.EventDispatcher<ThreeContextEventMap> {
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
		this.dispatchEvent(_event.beforeRender);
		this._renderFn();
		this.dispatchEvent(_event.afterRender);
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
		this._root.append(canvas);
		this._resizeObserver = new ResizeObserver(this.resizeHandler);
		this._resizeObserver.observe(this._root);
		this.resizeHandler();

		
		canvas.tabIndex = 0;
		canvas.style.touchAction = "none";
		canvas.focus();

		_event.mount.root = root;
		this.dispatchEvent(_event.mount);
	}

	unmount() {
		if (!this._isMounted) return;
		this._isMounted = false;

		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		this.renderer.domElement.remove();

		this.dispatchEvent(_event.unmount);
	}

	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;

		const noRender = () => {
			console.error("render try after ThreeContext destroyed.")
		}
		this._renderFn = noRender;
		this._srcRenderFn = noRender;

		this.unmount();
		this.clearScene(true);
		this.renderer.dispose();

		this.dispatchEvent(_event.destroy);
	}

	private clearScene(dispose?: boolean) {
		const children = [...this.scene.children];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			this.scene.remove(child);
			dispose && fullObjectDispose(child, true);
		}
	}

	private resizeHandler = () => {
		if (!this._root) return;

		const width = this._root.offsetWidth;
		const height = this._root.offsetHeight;

		const camera = this._camera;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);

		_event.resize.width = width;
		_event.resize.height = height;
		this.dispatchEvent(_event.resize);
	};

	private cameraChanged = () => {
		const camera = this._camera;
		const root = this._root;
		if (root) {
			camera.aspect = root.offsetWidth / root.offsetHeight;
		}
		camera.updateProjectionMatrix();
		this.dispatchEvent(_event.camerachanged);
	};
}

const _event: {
	[K in keyof ThreeContextEventMap]: { type: K } & ThreeContextEventMap[K];
} = {
	beforeRender: { type: "beforeRender" },
	afterRender: { type: "afterRender" },
	mount: { type: "mount", root: null as unknown as HTMLDivElement },
	unmount: { type: "unmount" },
	destroy: { type: "destroy" },
	resize: { type: "resize", width: 100, height: 100 },
	camerachanged: { type: "camerachanged" },
};