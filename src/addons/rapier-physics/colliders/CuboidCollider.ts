import { IFeaturable } from "@vladkrutenyuk/three-kvy-core";
import { Collider } from "../Collider";

export class CuboidCollider extends Collider {
	/**
	 * @default 0.5
	 */
	hx!: number;
	/**
	 * @default 0.5
	 */
	hy!: number;
	/**
	 * @default 0.5
	 */
	hz!: number;

	constructor(object: IFeaturable, props: [hx: number, hy: number, hz: number]) {
		const [hx, hy, hz] = props ?? defaultValues;
		super(object, [colType, hx, hy, hz]);
		this.hx = hx;
		this.hy = hy;
		this.hz = hz;
	}

	protected useCtx(ctx: typeof this.ctx): () => void {
		this._params = [colType, this.hx, this.hx, this.hz];
		return super.useCtx(ctx);
	}
}

const colType = "cuboid";
const defaultValues = [0.5, 0.5, 0.5];
