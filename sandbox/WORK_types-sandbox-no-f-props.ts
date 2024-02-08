export {};
import * as THREE from "three";
type RoRecStr<TValue = any> = Readonly<Record<string, TValue>>;
type ModulesRecord = Readonly<Record<string, any>>;

type isSubsetRecord<
	TSub extends Record<TKey, TValue>,
	TRecord extends Record<TKey, TValue>,
	TKey extends string | number | symbol = string,
	TValue = any
> = {
	[K in keyof TSub]: K extends keyof TRecord
		? TSub[K] extends TRecord[K]
			? never
			: K
		: K;
}[keyof TSub];

// Условный тип для проверки совместимости модулей
type CompatibleFeature<
	TFeatureModules extends ModulesRecord,
	TGameObjectModules extends ModulesRecord
> = isSubsetRecord<TFeatureModules, TGameObjectModules> extends never
	? Feature<TFeatureModules>
	: never;

type CompatibleModules<
	TSubModules extends ModulesRecord,
	TModules extends ModulesRecord
> = isSubsetRecord<TSubModules, TModules> extends never ? TSubModules : never;

class GameObject<TModules extends ModulesRecord = {}> {
	features: Feature[] = []
	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends ModulesRecord = {},
		TProps extends ModulesRecord = {}
	>(
		feature: new (
			p: FeatureProps<CompatibleModules<TFeatureModules, TModules>, TProps>
		) => TFeature,
		props: TProps
	): TFeature;

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends ModulesRecord = {}
	>(
		feature: new (
			p: FeatureProps<CompatibleModules<TFeatureModules, TModules>>
		) => TFeature,
		props?: undefined
	): TFeature;

	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends ModulesRecord = {}
	>(
		feature: new (
			p: FeatureProps<CompatibleModules<TFeatureModules, TModules>>
		) => TFeature,
		props: unknown
	): TFeature 
	{
		const instance = new feature(
			props ? { ...props, gameObject: this } : { gameObject: this }
		);
		this.features.push(instance)
		return instance;
	}
}

type FeatureProps<
	TModules extends ModulesRecord,
	TProps extends ModulesRecord = {}
> = TProps & {
	gameObject: GameObject<TModules>;
};

abstract class Feature<
	TModules extends ModulesRecord = {},
	TProps extends ModulesRecord = {}
> extends THREE.EventDispatcher {
	gameObject: GameObject<TModules>;
	constructor(props: FeatureProps<TModules, TProps>) {
		super()
		this.gameObject = props.gameObject;
	}
}

// examples

class Feature0 extends Feature<{}> {}
class FeatureA extends Feature<{ a: string }> {}
class FeatureB extends Feature<{ b: number }> {}

class FeatureBProps extends Feature<{ b: number }> {
	constructor(props: FeatureProps<{ b: number }, { name: string }>) {
		super(props);
	}
}

// initialization
let go0 = new GameObject();
let goA = new GameObject<{ a: string }>();
let goAB = new GameObject<{ a: string; b: number }>();
let goABbad = new GameObject<{ a: string; b: string }>();

// works but bad return types
let ph1 = go0.addFeature(Feature0); // ОК
let s1 = go0.addFeature(FeatureA); // ERROR
let pa1 = go0.addFeature(FeatureB); // ERROR

let ph2 = goA.addFeature(FeatureA); // ОК
let s2 = goA.addFeature(Feature0); // ОК
let pa2 = goA.addFeature(FeatureB); // ERROR

let ph3 = goAB.addFeature(FeatureA); // ОК
let s3 = goAB.addFeature(Feature0); // ОК
let pa3 = goAB.addFeature(FeatureB); // ОК

let ph4 = goABbad.addFeature(FeatureB); // ERROR

// props
let _1 = goAB.addFeature(FeatureBProps, { name: "asdasd" }); // ОК
let _111 = go0.addFeature(FeatureBProps, { name: "asdasd" }); // ERROR
let _1111 = goA.addFeature(FeatureBProps, { name: "asdasd" }); // ERROR
let _11 = goAB.addFeature(FeatureBProps); // ERROR
let _2 = goA.addFeature(FeatureBProps); // ERROR
let _3 = goAB.addFeature(FeatureBProps); // ERROR
