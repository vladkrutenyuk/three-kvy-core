export {};

type ModulesRecord = Record<string, any>;

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
	TPart extends ModulesRecord,
	TMain extends ModulesRecord
> = isSubsetRecord<TPart, TMain> extends never ? Feature<TPart> : never;

type CompatibleModules<
	TFeatureModules extends ModulesRecord,
	TGameObjectModules extends ModulesRecord
> = isSubsetRecord<TFeatureModules, TGameObjectModules> extends never
	? TFeatureModules
	: never;

class GameObject<TModules extends ModulesRecord = {}> {
	addFeature<
		TFeature extends CompatibleFeature<TFeatureModules, TModules>,
		TFeatureModules extends ModulesRecord = {}
	>(
		feature: new (
			gameObject: GameObject<CompatibleModules<TFeatureModules, TModules>>
		) => TFeature
	): TFeature {
		const instance = new feature(this);
		return instance as TFeature;
	}
}

abstract class Feature<TModules extends ModulesRecord = {}> {
	gameObject: GameObject<TModules>;
	constructor(gameObject: GameObject<TModules>) {
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
let s2 = goA.addFeature(Feature0); // ОК
let pa2 = goA.addFeature(FeatureB); // ОШИБКА

let ph3 = goAB.addFeature(FeatureA); // ОК
let s3 = goAB.addFeature(Feature0); // ОК
let pa3 = goAB.addFeature(FeatureB); // ОК

let ph4 = goABbad.addFeature(FeatureB); // ОШИБКА
