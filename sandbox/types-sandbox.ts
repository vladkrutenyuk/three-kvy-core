import * as THREE from "three";

// implementation

abstract class GameWorldModule {}

type GameWorldModulesRecord = Readonly<Record<string, GameWorldModule>>;

// Условный тип для проверки совместимости модулей
type CompatibleFeature<TGameObjectModules extends GameWorldModulesRecord, TFeatureModules extends GameWorldModulesRecord> =
	TFeatureModules extends TGameObjectModules ? Feature<TFeatureModules> : never;

class GameObject<TModules extends GameWorldModulesRecord = {}> {
	_world: GameWorld<TModules> | null = null;
	_features: Feature<TModules>[] = [];
	constructor() {}

	// prettier-ignore
	addFeature<TFeature extends Feature<TModules, TProps>, TProps extends Record<string, any> = {}>(
        f: new (p: FeatureProps<TModules, TProps>) => TFeature, 
        props: TProps
    ): TFeature;

	// prettier-ignore
	addFeature<TFeature extends Feature<TModules, TProps>, TProps extends Record<string, any> = {}>(
		f: new (p: FeatureProps<TModules, {}>) => TFeature,
		props?: undefined
	): TFeature;

	// prettier-ignore
	addFeature<TFeature extends Feature<TModules, TProps>, TProps extends Record<string, any> = {}>(
		feature: new (p: FeatureProps<TModules>) => TFeature,
		props: unknown
	): TFeature {
		const instance = new feature(
			props !== undefined ? { gameObject: this, ...props } : { gameObject: this }
		);
		this._features.push(instance);
		return instance;
	}
}

class GameWorld<
	TModules extends GameWorldModulesRecord = {}
> extends GameObject<TModules> {
	readonly modules: TModules;
	constructor(modules: TModules) {
		super();
		this.modules = modules;
		this._world = this;
	}
}

type FeatureProps<
	TModules extends GameWorldModulesRecord = {},
	TProps extends Record<string, any> = {}
> = TProps & {
	gameObject: GameObject<TModules>;
};

abstract class Feature<
	TModules extends GameWorldModulesRecord = {},
	TProps extends Record<string, any> = {}
> {
	gameObject: GameObject<TModules>;
	constructor(props: FeatureProps<TModules, TProps>) {
		this.gameObject = props.gameObject;
	}
}

// TEST

// example module
class PhysicsModule extends GameWorldModule {}

// example feature variants

class SimpleFeature extends Feature<{}, {}> {}

class SimpleFeatureWithProps extends Feature<{}, { size: number }> {
	constructor(props: FeatureProps<{}, { size: number }>) {
		super(props);
	}
}

class PhysicalFeature extends Feature<{ physics: PhysicsModule }> {}

class PhysicalFeatureWithProps extends Feature<
	{ physics: PhysicsModule },
	{ force: number }
> {
	constructor(props: FeatureProps<{ physics: PhysicsModule }, { force: number }>) {
		super(props);
	}
}

// example initialization

const world = new GameWorld({ physics: new PhysicsModule() });

const go1 = new GameObject();
go1.addFeature(SimpleFeature);
go1.addFeature(SimpleFeatureWithProps, { size: 1 });
// go1.addFeature(PhysicalFeature)

const go2 = new GameObject<{ physics: PhysicsModule }>();
go2.addFeature(PhysicalFeature);
// go2.addFeature(SimpleFeature);

export {}