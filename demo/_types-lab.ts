import RAPIER from "@dimforge/rapier3d-compat";
import { addFeature } from "../src";
import { ModulesRecord, CoreContext } from "../src/core/CoreContext";
import { CoreContextModule, ReturnOfUseCtx } from "../src/core/CoreContextModule";
import { IFeaturable, Object3DFeaturability } from "../src/core/Object3DFeaturablity";
import { Object3DFeature } from "../src/core/Object3DFeature";
import * as THREE from "three";

type ColliderParams =
	| [type: "cuboid", hx: number, hy: number, hz: number]
	| [type: "capsule", halfHeight: number, radius: number];

class GameM extends CoreContextModule {
	protected useCtx<TModules extends ModulesRecord>(
		ctx: CoreContext<TModules>
	): ReturnOfUseCtx {}
}

class ExampleNoPropsOF extends Object3DFeature<{ gameM: GameM }, string> {
	constructor(object) {
		super(object);

		this.object.isObject3D;
	}

	public start(time: number) {
		console.log("start", time);
	}
}
class ExampleWithPropsOF extends Object3DFeature<
	{ gameM: GameM; jopa: GameM },
	{ start: [time: number] }
> {
	constructor(object, props: { popa: number }) {
		super(object);
		this.object.isGroup;
	}
	public start(time: number) {
		console.log("start", time);
	}
}

const g = new THREE.Group();
const dr = new THREE.PointLight();
const f = Object3DFeaturability.from<{ gameM: GameM }>(g);
const _a1 = addFeature(dr, ExampleNoPropsOF); // OK

const res1 = addFeature(g, ExampleWithPropsOF, { popa: 1 }); // OK
const res2 = addFeature(g, ExampleWithPropsOF, { popa: 1, over: 228 }, () => {}); // Object literal may only specify known properties, and 'over' does not exist in type '{ popa: number; }'
const res3 = addFeature(g, ExampleWithPropsOF, {}); // Argument of type '{}' is not assignable to parameter of type '{ popa: number; }'. Property 'popa' is missing in type '{}' but required in type '{ popa: number; }'
const res4 = addFeature(g, ExampleWithPropsOF); // should be ERROR

const a1 = addFeature(g, ExampleNoPropsOF, { asd: 1 }); //Error: Object literal may only specify known properties, and 'asd' does not exist in type '{ object: IFeaturable<{ gameM: GameM; }>; }'
const a2 = addFeature(g, ExampleNoPropsOF, undefined, (f) => {
	const b = f;
}); //Error: Argument of type 'undefined' is not assignable to parameter of type '{ object: IFeaturable<{ gameM: GameM; }>; }'
const a3 = addFeature(g, ExampleNoPropsOF, {}); //Error: Argument of type '{}' is not assignable to parameter of type '{ object: IFeaturable<{ gameM: GameM; }>; }'.Property 'object' is missing in type '{}' but required in type '{ object: IFeaturable<{ gameM: GameM; }>; }'.ts(2345)
const a4 = addFeature(g, ExampleNoPropsOF); //Error: Argument of type '{}' is not assignable to parameter of type '{ object: IFeaturable<{ gameM: GameM; }>; }'.Property 'object' is missing in type '{}' but required in type '{ object: IFeaturable<{ gameM: GameM; }>; }'.ts(2345)
