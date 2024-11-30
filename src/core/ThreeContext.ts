import * as THREE from "three";
import { disposeObject3DFully } from "../utils/dispose-object3d";
import { EventCache, EventCacheMapInfer } from "../addons/EventCache";

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
		this.dispatchEvent(cache.use("renderbefore"));
		this._renderFn();
		this.dispatchEvent(cache.use("renderafter"));
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

		this.dispatchEvent(cache.use("mount")("root", root));
	}

	unmount() {
		if (!this._isMounted) return;
		this._isMounted = false;

		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		this.renderer.domElement.remove();

		this.dispatchEvent(cache.use("unmount"));
	}

	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;

		const noRender = () => {
			console.error("render try after ThreeContext destroyed.");
		};
		this._renderFn = noRender;
		this._srcRenderFn = noRender;

		this.unmount();
		this.clearScene(true);
		this.renderer.dispose();

		this.dispatchEvent(cache.use("destroy"));
	}

	private clearScene(dispose?: boolean) {
		const children = [...this.scene.children];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			this.scene.remove(child);
			dispose && disposeObject3DFully(child, true);
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

		this.dispatchEvent(cache.use("resize")("width", width)("height", height));
	};

	private cameraChanged = () => {
		const camera = this._camera;
		const root = this._root;
		if (root) {
			camera.aspect = root.offsetWidth / root.offsetHeight;
		}
		camera.updateProjectionMatrix();
		this.dispatchEvent(cache.use("camerachanged"));
	};
}

const cache = new EventCache({
	renderbefore: {},
	renderafter: {},
	mount: { root: null as unknown as HTMLDivElement },
	unmount: {},
	destroy: {},
	resize: { width: 100, height: 100 },
	camerachanged: {},
});

export type ThreeContextEventMap = EventCacheMapInfer<typeof cache>;
