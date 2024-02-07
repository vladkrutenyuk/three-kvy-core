export {};

type ModulesRecord = Readonly<Record<string, any>>;

type isSubsetRecord<
	TSub extends Record<string, any>,
	TRecord extends Record<string, any>
> = {
	[K in keyof TSub]: K extends keyof TRecord
		? TSub[K] extends TRecord[K]
			? never
			: K
		: K;
}[keyof TSub];

// Условный тип для проверки совместимости модулей
type CompatibleFeature<
	TFeature extends Feature<TPart>,
	TPart extends ModulesRecord,
	TMain extends ModulesRecord
> = isSubsetRecord<TPart, TMain> extends never ? Feature<TPart> : never;

class GameObject<TModules extends ModulesRecord = {}> {
	addFeature<
		TFeature extends Feature<TFeatureModules>,
		TFeatureModules extends ModulesRecord = {}
	>(
		feature: new (gameObject: GameObject<TModules>) => CompatibleFeature<
			TFeature,
			TFeatureModules,
			TModules
		>
	): CompatibleFeature<TFeature, TFeatureModules, TModules> {
		const instance = new feature(this);
		return instance;
	}
}

abstract class Feature<TModules extends ModulesRecord = {}> {
	gameObject: GameObject<TModules>;
	constructor(gameObject: GameObject<any>) {
		this.gameObject = gameObject;
	}
}

// examples

class Feature0 extends Feature {}
class FeatureA extends Feature<{ a: string }> {}
class FeatureB extends Feature<{ b: number }> {}

// initialization
let go0 = new GameObject();
let goA = new GameObject<{ a: string }>();
let goAB = new GameObject<{ a: string; b: number }>();
let goABbad = new GameObject<{ a: string; b: string }>();

// works but bad return types
let ph1 = go0.addFeature(Feature0); // ОК
let s1 = go0.addFeature(FeatureA); // ОШИБКА
let pa1 = go0.addFeature(FeatureB); // ОШИБКА

let ph2 = goA.addFeature(FeatureA); // ОК
let s2 = goA.addFeature<Feature0>(Feature0); // ОК
let pa2 = goA.addFeature(FeatureB); // ОШИБКА

let ph3 = goAB.addFeature(FeatureA); // ОК
let s3 = goAB.addFeature(Feature0); // ОК
let pa3 = goAB.addFeature(FeatureB); // ОК

let ph4 = goABbad.addFeature(FeatureB); // ОШИБКА
