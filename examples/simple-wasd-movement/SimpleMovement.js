import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class SimpleMovement extends KVY.Object3DFeature {
	speed = 10;

	constructor(object, props) {
		super(object);
		this.speed = props.speed;
	}

	onBeforeRender(ctx) {
		const offset = this.speed * ctx.deltaTime;
		const pos = this.object.position;

		const key = ctx.modules.input.isKeyDown;

		if (key("KeyW")) pos.z -= offset;
		if (key("KeyS")) pos.z += offset;
		if (key("KeyD")) pos.x += offset;
		if (key("KeyA")) pos.x -= offset;
	}
}
