// game modules

class GameModule {
	constructor() {}
}

type ModulesRecord = Record<string, GameModule>

// game world

class GameWorld<TModules extends ModulesRecord = {}> {
	modules: TModules
	constructor(modules: TModules) {
		this.modules = modules
	}

	add(gameObject: GameObject<TModules>) {
		gameObject
	}

	create(): GameObject<TModules> {
		const go = new GameObject<TModules>()
		this.add(go)
		return go
	}
}

// game object

class GameObject<TModules extends ModulesRecord = {}> {
	features: Feature<TModules>[] = []

	//TODO add feature with props (2 arg)
	//TODO add feature with no props (1 arg)
	// addFeature<TFeature>() {}
}

// game object feature

type FeatureProps<
	TModules extends ModulesRecord = {},
	TProps extends Record<string, any> = {}
> = {
	gameObject: GameObject<TModules>
} & TProps

class Feature<
	TModules extends ModulesRecord = {},
	TProps extends Record<string, any> = {}
> {
	readonly gameObject: GameObject<TModules>
	constructor(props: FeatureProps<TModules, TProps>) {
		this.gameObject = props.gameObject
	}
}

// test

class PhysicsModule extends GameModule {}
class ParticlesModule extends GameModule {}
class PostProcessingModule extends GameModule {}

type PhModRecord = { physics: PhysicsModule }
class FeatureWithPhysics extends Feature<PhModRecord> {
	constructor(props: FeatureProps) {
		super(props)
	}
}
class JustFeature extends Feature {
	constructor(props: FeatureProps) {
		super(props)
	}
}

const gameWorld = new GameWorld({
	physics: new PhysicsModule(),
	particles: new ParticlesModule(),
} as const)

const gameObject = new GameObject()
// gameObject.addFeat(JustFeature, {})
// gameObject.addFeat(FeatureWithPhysics, {})

gameWorld.add(gameObject)
