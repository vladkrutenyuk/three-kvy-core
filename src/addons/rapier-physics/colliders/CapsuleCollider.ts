import { IFeaturable } from "@vladkrutenyuk/three-kvy-core";
import { Collider } from "../Collider";

export class CapsuleCollider extends Collider {
	/**
	 * @default 0.5
	 */
	halfHeight!: number;
	/**
	 * @default 0.5
	 */
	radius!: number;

	constructor(object: IFeaturable, props: [radius: number, halfHeight: number]) {
		const [radius, halfHeight] = props ?? defaultValues;
		super(object, [colType, radius, halfHeight]);
		this.radius = radius;
		this.halfHeight = halfHeight;
	}

	protected useCtx(ctx: typeof this.ctx): () => void {
		this._params = [colType, this.radius, this.halfHeight];
		return super.useCtx(ctx);
	}
}

const colType = "capsule";
const defaultValues = [0.5, 0.5];
