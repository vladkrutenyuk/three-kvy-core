import { IFeaturable } from "@vladkrutenyuk/three-kvy-core";
import { Collider } from "../Collider";

export class BallCollider extends Collider {
	/**
	 * @default 0.5
	 */
	radius!: number;

	constructor(object: IFeaturable, props: [radius: number]) {
		const [radius] = props ?? defaultValues;
		super(object, [colType, radius]);
		this.radius = radius;
	}

	protected useCtx(ctx: typeof this.ctx): () => void {
		this._params = [colType, this.radius];
		return super.useCtx(ctx);
	}
}

const colType = "ball";
const defaultValues = [0.5];
