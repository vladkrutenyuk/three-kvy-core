abstract class GameWorldModule {}

type GameWorldModulesRecord = Readonly<Record<string, GameWorldModule>>;

// Условный тип для проверки совместимости модулей
type CompatibleFeature<
	TGameObjectModules extends GameWorldModulesRecord,
	TFeatureModules extends GameWorldModulesRecord
> = keyof TFeatureModules extends keyof TGameObjectModules
	? Feature<TFeatureModules>
	: never;

type isPart<
	TFeature extends Feature<TPart>,
	TPart extends GameWorldModulesRecord,
	TMain extends GameWorldModulesRecord,
> = {
	[K in keyof TPart]: K extends keyof TMain
		? TPart[K] extends TMain[K]
			? never
			: K
		: K;
}[keyof TPart] extends never
	? Feature<TPart>
	: never;

type _CompatibleFeature<
	TGameObjectModules extends GameWorldModulesRecord,
	TFeature
> = TFeature extends Feature<infer U>
	? U extends GameWorldModulesRecord
		? IsSubset<U, TGameObjectModules> extends true
			? TFeature
			: never
		: never
	: never;

type IsSubset1<A extends Record<string, any>, B extends Record<string, any>> = {
	[K in keyof A]: K extends keyof B ? (A[K] extends B[K] ? never : K) : K;
}[keyof A];

type isSubsetWrapper<
	A extends Record<string, any>,
	B extends Record<string, any>
> = IsSubset1<A, B> extends never ? A : never;

type IsSubset<T, U> = {
	[K in keyof T]: K extends keyof U ? (T[K] extends U[K] ? true : false) : false;
}[keyof T] extends true
	? true
	: false;

class GameObject<TModules extends GameWorldModulesRecord = {}> {
	addFeature<
		TFeature extends Feature<TFeatureModules>,
		TFeatureModules extends GameWorldModulesRecord = {}
	>(
		feature: new (p: FeatureProps) => isPart<TFeature, TFeatureModules, TModules>
	): isPart<TFeature, TFeatureModules, TModules> {
		const instance = new feature({ gameObject: this });
		return instance;
	}

	_addFeature<
		TFeature extends Feature<isSubsetWrapper<TFeatureModules, TModules>>,
		TFeatureModules extends GameWorldModulesRecord
	>(feature: new (p: FeatureProps) => TFeature): TFeature {
		return new feature({ gameObject: this });
	}
}

function isNever<T>(value: T): value is never {
	return !value;
}

type FeatureProps = {
	gameObject: GameObject<any>;
};

abstract class Feature<TModules extends GameWorldModulesRecord = {}> {
	gameObject: GameObject<TModules>;
	constructor(props: FeatureProps) {
		this.gameObject = props.gameObject;
	}
}

// examples

class PhysicsModule extends GameWorldModule {}
class ParticleModule extends GameWorldModule {}

class SimpleFeature extends Feature {}
class PhysicalFeature extends Feature<{ physics: PhysicsModule }> {}
class ParticlesFeature extends Feature<{ particles: ParticleModule }> {}

// initialization
let go1 = new GameObject();
let go2 = new GameObject<{ physics: PhysicsModule }>();
let go3 = new GameObject<{ physics: PhysicsModule; particles: ParticleModule }>();
let go4 = new GameObject<{ physics: string; particles: ParticleModule }>();

// works but bad return types
let ph1 = go1.addFeature(SimpleFeature); // ОК
// let s1 = go1.addFeature(PhysicalFeature); // ОК ОШИБКА
// let pa1 = go1.addFeature(ParticlesFeature); // ОК ОШИБКА

let ph2 = go2.addFeature(PhysicalFeature); // ОК
let s2 = go2.addFeature<SimpleFeature>(SimpleFeature); // ОК
// let pa2 = go2.addFeature(ParticlesFeature); // ОК ОШИБКА

let ph3 = go3.addFeature(PhysicalFeature); // ОК
let s3 = go3.addFeature(SimpleFeature); // ОК
let pa3 = go3.addFeature(ParticlesFeature); // ОК

// let ph4 = go4.addFeature(PhysicalFeature); // не ок - должна быть ошибка

// works but no error on return never
let _ph1 = go1._addFeature(SimpleFeature); // ОК
let _s1 = go1._addFeature(PhysicalFeature); // ОК ОШИБКА
let _pa1 = go1._addFeature(ParticlesFeature); // ОК ОШИБКАт

let _ph2 = go2._addFeature(PhysicalFeature); // ОК
let _s2 = go2._addFeature(SimpleFeature); // ОК
let _pa2 = go2._addFeature(ParticlesFeature); // ОК ОШИБКА

let _ph3 = go3._addFeature(PhysicalFeature); // ОК
let _s3 = go3._addFeature(SimpleFeature); // ОК
let _pa3 = go3._addFeature(ParticlesFeature); // ОК

let _ph4 = go4._addFeature(PhysicalFeature); // ОК

// let _ph1 = go1._addFeature<{}, SimpleFeature>(SimpleFeature); // SimpleFeature
// let _s1 = go1._addFeature<{ physics: PhysicsModule }, PhysicalFeature>(PhysicalFeature); // never
// let _pa1 = go1._addFeature<{ particles: ParticleModule }, ParticlesFeature>(
// 	ParticlesFeature
// ); // never

// let _ph2 = go2._addFeature<{ physics: PhysicsModule }, PhysicalFeature>(PhysicalFeature); // PhysicalFeature
// let _s2 = go2._addFeature<{}, SimpleFeature>(SimpleFeature); // SimpleFeature
// let _pa2 = go2._addFeature<{ particles: ParticleModule }, ParticlesFeature>(
// 	ParticlesFeature
// ); // never

// let _ph3 = go3._addFeature<{ physics: PhysicsModule }, PhysicalFeature>(PhysicalFeature); // PhysicalFeature
// let _s3 = go3._addFeature(SimpleFeature); // never
// let _pa3 = go3._addFeature<{ particles: ParticleModule }, ParticlesFeature>(
// 	ParticlesFeature
// ); // ParticlesFeature

export {};
