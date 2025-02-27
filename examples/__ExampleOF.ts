import { GameContextModulesRecord, GameContext } from "../src/core/GameContext";
import { GameContextModule } from "../src/core/GameContextModule";
import { IFeaturable, Object3DFeaturability } from "../src/core/Object3DFeaturablity";
import { Object3DFeature } from "../src/core/Object3DFeature";
import * as THREE from "three";

class GameM extends GameContextModule {
	protected onInit<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): void {}
	protected onDestroy<TModules extends GameContextModulesRecord>(
		ctx: GameContext<TModules>
	): void {}
}

class ExampleNoPropsOF extends Object3DFeature<{ gameM: GameM }> {
	public start(time: number) {
		console.log("start", time);
	}

	constructor(object: IFeaturable<any>) {
		super(object);
	}
}
class ExampleWithPropsOF extends Object3DFeature<
	{ gameM: GameM; jopa: GameM },
	{ start: [time: number] }
> {
	constructor(object: IFeaturable, props: { popa: number }) {
		super(object);
	}
	public start(time: number) {
		console.log("start", time);
	}
}


const f = Object3DFeaturability.from<{ gameM: GameM }>(new THREE.Group());

const res1 = f.addFeature(ExampleWithPropsOF, { popa: 1 }); // OK
const res2 = f.addFeature(ExampleWithPropsOF, { popa: 1, over: 228 }, () => {}); // Object literal may only specify known properties, and 'over' does not exist in type '{ popa: number; }'
const res3 = f.addFeature(ExampleWithPropsOF, {}); // Argument of type '{}' is not assignable to parameter of type '{ popa: number; }'. Property 'popa' is missing in type '{}' but required in type '{ popa: number; }'
const res4 = f.addFeature(ExampleWithPropsOF); // should be ERROR

const a1 = f.addFeature(ExampleNoPropsOF, { asd: 1 }); //Error: Object literal may only specify known properties, and 'asd' does not exist in type '{ object: IFeaturable<{ gameM: GameM; }>; }'
const a2 = f.addFeature(ExampleNoPropsOF, undefined, (f) => {
    const b = f
}); //Error: Argument of type 'undefined' is not assignable to parameter of type '{ object: IFeaturable<{ gameM: GameM; }>; }'
const a3 = f.addFeature(ExampleNoPropsOF, {}); //Error: Argument of type '{}' is not assignable to parameter of type '{ object: IFeaturable<{ gameM: GameM; }>; }'.Property 'object' is missing in type '{}' but required in type '{ object: IFeaturable<{ gameM: GameM; }>; }'.ts(2345)
const a4 = f.addFeature(ExampleNoPropsOF); //Error: Argument of type '{}' is not assignable to parameter of type '{ object: IFeaturable<{ gameM: GameM; }>; }'.Property 'object' is missing in type '{}' but required in type '{ object: IFeaturable<{ gameM: GameM; }>; }'.ts(2345)