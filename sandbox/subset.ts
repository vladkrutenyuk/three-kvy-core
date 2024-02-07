export {};

type isPart<TPart extends Record<string, any>, TMain extends Record<string, any>> = {
	[K in keyof TPart]: K extends keyof TMain
		? TPart[K] extends TMain[K]
			? never
			: K
		: K;
}[keyof TPart] extends never
	? TPart
	: never;

// Test cases

// A is a subset of B, so the result is never.
type Test1 = isPart<{ a: string }, { a: string; b: number }>; // never

// A has an extra key 'c' not present in B, so the result is 'c'.
type Test2 = isPart<{ a: string; c: boolean }, { a: string; b: number }>; // 'c'

// A has a key 'b', but its type is different from B, so the result is 'b'.
type Test3 = isPart<{ a: string; b: string }, { a: string; b: number }>; // 'b'

// A is an empty object, so it is a subset of any object (B).
type Test4 = isPart<{}, { a: string; b: number }>; // never

// A has extra keys 'c' and 'd' not present in B, so the result is 'c' | 'd'.
type Test5 = isPart<{ a: string; c: boolean; d: boolean }, { a: string; b: number }>; // 'c' | 'd'

type ModulesRecord = Readonly<Record<string, any>>;

abstract class Feature<TModules extends ModulesRecord> {}

class GameObject<TModules extends ModulesRecord> {
	addFeature<
		TFeature extends Feature<isPart<TFeatureModules, TModules>>,
		TFeatureModules extends ModulesRecord
	>(feature: new () => TFeature) {
		return new feature();
	}
}

abstract class Child<TGeneric extends Readonly<Record<string, any>>> {}

class Parent<TParentGeneric extends Readonly<Record<string, any>>> {
	// addChild<
	// 	TChild extends Child<TChildGeneric>,
	// 	TChildGeneric extends isPart<Child>
	// >(child: new () => TChild) {
	// 	return 
	// }
}

class ChildAString extends Child<{ readonly a: string }> {}
type ChildAStringType = Child<{ readonly a: string }> 
type ChildAStringType_ = typeof ChildAString

type ExtractChildGeneric<T extends Child<any>> = T extends Child<infer U> ? U : never;

type ChildAStringGeneric = ExtractChildGeneric<ChildAString>
type ChildAStringTypeGeneric = ExtractChildGeneric<ChildAStringType>

const p0 = new Parent<{ a: string; b: number }>();

// p0.addChild(ChildAString);
