import {
	CoreContext,
	CoreContextModule,
	ModulesRecordDefault,
	ReturnOfUseCtx,
	utils,
} from "@vladkrutenyuk/three-kvy-core";
const { defineProps, readOnly } = utils.props;

export class KeysInput extends CoreContextModule {
	readonly isKeysInput!: true;

	/** (readonly) Flag to check if `shift` key is pressed */
	get shift(): boolean {
		return this._shift;
	}
	/** (readonly) Flag to check if `alt` key is pressed */
	get alt(): boolean {
		return this._alt;
	}
	/** (readonly) Flag to check if `ctrl` key is pressed */
	get ctrl(): boolean {
		return this._ctrl;
	}
	/** (readonly) Flag to check if `meta` key is pressed */
	get meta(): boolean {
		return this._meta;
	}

	_shift: boolean = false;
	_alt: boolean = false;
	_ctrl: boolean = false;
	_meta: boolean = false;

	private readonly _keys = new Set<string>();

	constructor() {
		super();
		defineProps(this, { isKeysInput: readOnly(true) });
	}

	protected useCtx(ctx: CoreContext<ModulesRecordDefault>): ReturnOfUseCtx {
		const html = ctx.three.renderer.domElement;

		const on = html.addEventListener.bind(html);
		const off = html.removeEventListener.bind(html);

		on("blur", this.onBlur);
		on("keydown", this.onKeyDown);
		on("keyup", this.onKeyUp);

		return () => {
			off("blur", this.onBlur);
			off("keydown", this.onKeyDown);
			off("keyup", this.onKeyUp);
		};
	}

	/**
	 * Check if key is pressed now.
	 * @param {globalThis.KeyboardEvent["code"]} key - current pressed key in format of {@link https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code KeyboardEvent.code}. Example: `KeyW`, `KeyD`, `Digit2`, `Space`, etc.
	 */
	has = (key: globalThis.KeyboardEvent["code"]) => {
		return this._keys.has(key);
	};

	private onKeyDown = (event: globalThis.KeyboardEvent) => {
		this.updFnKeys(event);
		this._keys.add(event.code);
	};

	private onKeyUp = (event: globalThis.KeyboardEvent) => {
		this.updFnKeys(event);
		this._keys.delete(event.code);
	};

	private onBlur = () => {
		this.updFnKeys(null);
	};

	private updFnKeys(event: globalThis.KeyboardEvent | null) {
		this._shift = event?.shiftKey ?? false;
		this._alt = event?.altKey ?? false;
		this._ctrl = event?.ctrlKey ?? false;
		this._meta = event?.metaKey ?? false;
	}
}
