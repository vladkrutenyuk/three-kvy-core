# three-kvy-core

[![ERC-20](https://img.shields.io/badge/Donate-ERC--20-blue)](https://etherscan.io/address/0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e)
[![npm](https://img.shields.io/npm/v/@vladkrutenyuk/three-kvy-core)](https://www.npmjs.com/package/@vladkrutenyuk/three-kvy-core)
[![GitHub](https://img.shields.io/github/stars/vladkrutenyuk/three-kvy-core?style=social)](https://github.com/vladkrutenyuk/three-kvy-core)
[![Twitter](https://img.shields.io/twitter/follow/vladkrutenyuk
)](https://x.com/vladkrutenyuk)
[![unpkg](https://img.shields.io/badge/UMD-unpkg-black)](https://unpkg.com/@vladkrutenyuk/three-kvy-core/dist/umd/index.min.js)

The OOP way to work with [Three.js](https://www.npmjs.com/package/three). Feature classes are attached to Object3D within a module-customizable shared context which aggregates basic initializations and provides own game event loop.

Doesn't impose any restrictions on your existing Three.js logic. 
Fully compatible with any approach you already use. 
Framework agnostic. Zero boilerplate. Size is ~11 kB.


> The lib is designed in way not no include three.js as dependency.
It manipulates three.js entities but does not refer to them.



## Installation
```sh
npm i @vladkrutenyuk/three-kvy-core
```
Be sure you installed peer deps and threejs:
```sh
npm i eventemitter3 three
```
and use like that
```js
import * as KVY from "@vladkrutenyuk/three-kvy-core";
```
## What does it look like?
Create some modules.
```js
class ModuleExample extends KVY.GameContextModule {
    // Called when the feature is attached to ctx.
    // Returns a cleanup function that is called on detach, 
    // similar to `useEffect()` in React.
    useCtx(ctx) {
        // use attached ctx on its attach;
        ctx.three.renderer;

        return () => {
            // do cleanup on ctx detach
        }
    }
}
```

Create context with your modules and use your features easy.
```js
const ctx = KVY.GameContext.create(THREE, {
    moduleExample: new ModuleExample(),
});

ctx.three.mount(document.querySelector("#some-div-container"));
ctx.loop.run();
```

Create some object's features and use context and its modules inside of it.
```js
export class FeatureExample extends KVY.Object3DFeature {
    constructor(object, props) {
        super(object);
        this.speed = props.speed;
    }

    // use built-in event methods in override way

    useCtx(ctx) {
        // use attached ctx on its attach;
        ctx.three.scene;

        // use ctx modules;
        ctx.modules.moduleExample;

        return () => {
            // do cleanup on ctx detach
        }
    }

    onBeforeRender(ctx) {
        console.log('before render');

        // use attached ctx;
        const dt = ctx.deltaTime;
        // use object this feature is attached to
        const obj = this.object;

        obj.rotateY(dt * this.speed);
    }

    onLoopStop(ctx) {
        console.log('loop stopped');
    }

    onResize(ctx) {
        console.log('canvas resized');
    }
}
```
Make object *featurable*, add object to ctx, add *feature* to object.
```js
const [obj, objF] = KVY.from(new THREE.Object3D());

objF.addFeature(FeatureExample, { speed: 3 });
objF.addFeature(AnotherFeature, { name: "Vitalik" });

ctx.add(obj);
```

> Any order of initialization, feature additions, and attach/detach operations is acceptable

## Tutorials, examples
#### 1. Context Creation
`GameContext`

Easy shortcut :
```ts
const ctx = KVY.GameContext.create(THREE, {
    moduleA: new MyModuleA(), // ... extends KVY.GameContextModule
    moduleB: new MyModuleB(), // ... extends KVY.GameContextModule
})
```
OR raw manual way:
```ts
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera();
const scene = new THREE.Scene();

const three = new KVY.ThreeContext(renderer, camera, scene);

const root = new THREE.Group();
scene.add(root);
const clock = new THREE.Clock(false);

const ctx = new KVY.GameContext(three, root, clock, {
    moduleA: new MyModuleA(),
    moduleB: new MyModuleB(),
})

```
It can be usefull if you use some framework or lib which initializes threejs's entities by itself in special way.

#### 2. Mount and run
##### Vanilla
```html
<body>
    <div id="container" style="height:100%"></div>
</body>
```
```js
const container = document.querySelector("#container");
ctx.three.mount(container);
ctx.loop.run();
```
##### React
```jsx
const GameCtxRenderingComponent = () => {
    const ref = useRef(null);
    useEffect(() => {
        const container = ref.current;
        if (!container) return;

        ctx.three.mount(container);
        ctx.loop.run();

        return () => {
            ctx.three.unmount();
            ctx.loop.stop();
        }
    }, [])
    return <div ref={ref} style={{width:"400px",height:"228px"}} />
}
```

#### 3. Context Module Example
`GameContextModule`

```js
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class YourKeyInputModule extends KVY.GameContextModule {
    keys = new Set<string>();
    isKeyDown = (key) => this.keys.has(key);

    // GameContextModule's built-in method
    useCtx(ctx) {
        const onKeyDown = (e) => this.keys.add(e.code);
        const onKeyUp = (e) => this.keys.delete(e.code);

        const dom = ctx.three.renderer.domElement;
        dom.addEventListener("keydown", onKeyDown);
        dom.addEventListener("keyup", onKeyUp);

        return () => {
            dom.removeEventListener("keydown", onKeyDown);
            dom.removeEventListener("keyup", onKeyUp);
        }
    }
}
```

#### 4. Feature Example
`Object3DFeature`

```js
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class YourSimpleMovement extends KVY.Object3DFeature {
    speed = 10;

    constructor(object, props) {
        super(object);
        this.speed = props.speed;
    }

    // Object3DFeature's built-in method
    onBeforeRender(ctx) {
        const dp = this.speed * ctx.deltaTime;
        const pos = this.object.position;

        const key = ctx.modules.input.isKeyDown;

        if (key('KeyW')) pos.z -= dp;
        if (key('KeyS')) pos.z += dp;
        if (key('KeyD')) pos.x += dp;
        if (key('KeyA')) pos.x -= dp;
    }
}
```

#### 5. Feature and module usage example

```js
import * as THREE from "three";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import { YourKeyInputModule } from "./YourKeyInputModule.js"
import { YourSimpleMovement } from "./YourSimpleMovement.js"

const ctx = KVY.GameContext.create(THREE, { 
    input: new YourKeyInputModule()
});

const character = new THREE.Group();
const camera = ctx.three.camera;
character.add(camera);

const characterF = KVY.from(character); // -> Object3DFeaturability
const simpleMovement = characterF.addFeature(YourSimpleMovement, { speed: 6 });
```
`KVY.from` creates and attachs `Object3DFeaturability` to providen object and return instance of its *featurability*.
Use *featurability* to manage object's *features* `Object3DFeature`.


##### Get features

```js
const simpleMovement = characterF.getFeature(YourSimpleMovement);
const someOtherFeature = characterF.getFeatureBy((x) => x.isSmth);

const featuresList = characterF.features;
for (const feature of featuresList) {
    console.log(feature);
}
```
##### Destroy features

`destroy()` detachs *ctx* from *feature* and remove it from object's *featurability*.
```js
simpleMovement.destroy();
someOtherFeature.destroy();
```

#### 6. Featurability, Featurable Object
To be able to add *features* to object you need to make it *featurable*. Do it via factory methods `from()` or `wrap()`. It attachs *featurability* to object and makes it *featurable*. You can continue use such object as usually.

*featurability* is presented as `Object3DFeaturability` instance and stored in `obj.__kvy_ftblty__` field. It is defined as `enumerable: false`.

You are able to get object's *featurability* and to know if object is `featurable` via `extract()` static method. Or via `obj.isFeaturable` flag.

See examples:
```js
const obj1 = new THREE.Object3D();
KVY.extract(obj1); // -> null
obj1.isFeaturable // -> undefined

const obj2 = new THREE.Object3D();
const obj2F = KVY.from(obj2); // -> KVY.Object3DFeaturability
KVY.extract(obj2) // -> KVY.Object3DFeaturability
KVY.extract(obj2) === obj2F // -> true
obj2.isFeaturable // -> true
obj2 === obj2F.object // -> true

const obj3 = new THREE.Object3D();
const _obj3 = KVY.wrap(obj3) // -> THREE.Object3D, but its IFeaturable<THREE.Object3D> now
_obj3 === obj3 // -> true

const obj3F = KVY.extract(obj3) // -> KVY.Object3DFeaturability
obj3.isFeaturable // -> true
obj3F.destroy();
KVY.extract(obj3) // -> null
obj3.isFeaturable // -> undefined
```

##### Destroy
Object's *featurability* `destroy()` method invokes detach ctx for each features and remove everything about it from object.
```js
const obj3F = KVY.extract(obj3) // -> KVY.Object3DFeaturability
obj3.isFeaturable // -> true

obj3F.destroy();

KVY.extract(obj3) // -> null
obj3.isFeaturable // -> undefined
```


---

Additionally, any code can be easily adapted to the Object3DFeature style, making integration seamless and non-intrusive.

```js
class EasyOrbitControls extends KVY.Object3DFeature {
    constructor(object, props) {
        super(object);
        this.target = props.target;
        this.options = props.options;
    }

    // Object3DFeature's built-in method
    useCtx(ctx) {
        const three = ctx.three;
        const controls = new OrbitControls(three.camera, three.renderer.domElement);
        controls.options = this.options;
        controls.target = this.target;
        
        this.controls = controls;

        return () => {
            this.controls.dispose();
            this.controls = undefined;
        };
    }

    onBeforeRender(ctx) {
        this.controls.update();
    }
}
```
`pair` get-property returns tuple `[THREE.Object3D, KVY.Object3DFeaturability]` of object and its `featurability` to write more compact.
```js
// [THREE.Object3D, KVY.Object3DFeaturability]
const [obj, objF] = KVY.from(new Object3D()).pair;
ctx.add(obj); // ctx is KVY.GameContext

const target = new THREE.Object3D();
objF.addFeature(EasyOrbitControls, { target, options: {...}})

```
## Donate me 🥺🙏
🌐 ERC-20 wallet (USDC / USDT / ETH):
`0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e`
## Contact me 💃💅

- [Linkedin (/in/vladkrutenyuk)](https://www.linkedin.com/in/vladkrutenyuk/)

- [Instagram (@vladkrutenyuk)](https://instagram.com/vladkrutenyuk)

- [Twitter/X (@vladkrutenyuk)](https://x.com/vladkrutenyuk)

- [Telegram (@vladkrutenyuk)](https://t.me/vladkrutenyuk)

---

_meow :3_