# three-kvy-core

[![ERC-20](https://img.shields.io/badge/Donate-ERC--20-blue)](https://etherscan.io/address/0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e)
[![npm](https://img.shields.io/npm/v/@vladkrutenyuk/three-kvy-core)](https://www.npmjs.com/package/@vladkrutenyuk/three-kvy-core)
[![GitHub](https://img.shields.io/github/stars/vladkrutenyuk/three-kvy-core?style=social)](https://github.com/vladkrutenyuk/three-kvy-core)
[![Twitter](https://img.shields.io/twitter/follow/vladkrutenyuk
)](https://x.com/vladkrutenyuk)
[![unpkg](https://img.shields.io/badge/UMD-unpkg-black)](https://unpkg.com/@vladkrutenyuk/three-kvy-core/dist/umd/index.min.js)

The OOP-driven way to work with [Three.js](https://www.npmjs.com/package/three). Feature classes are attached to Object3D within a module-customizable shared context which aggregates basic initializations and provides own game event loop.

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
Create some *modules*.
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

Create *context* with your *modules*.
```js
const ctx = KVY.GameContext.create(THREE, {
    moduleExample: new ModuleExample(),
});

ctx.three.mount(document.querySelector("#some-div-container"));
ctx.loop.run();
```

Create some object's *features* and use *context* and its *modules* inside of it.
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
Add *feature* to object via static method.
```js
KVY.addFeature(obj, FeatureExample, { speed: 3 });

ctx.add(obj);

KVY.addFeature(obj, AnotherFeature, { name: "Vitalik" });
```

> Any order of initialization is acceptable. Add object to *ctx* first or add *feature* to object first - no matter;

## Tutorials, examples
### 1. Context Creation
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

### 2. Mount and run
#### Vanilla
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
#### React
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

### 3. Context Module Example
`GameContextModule`

```js
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class YourKeyInputModule extends KVY.GameContextModule {
    keys = new Set();
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

### 4. Feature Example
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

### 5. Feature and module usage example

```js
import * as THREE from "three";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import { YourKeyInputModule } from "./YourKeyInputModule.js"
import { YourSimpleMovement } from "./YourSimpleMovement.js"

const ctx = KVY.GameContext.create(THREE, { 
    input: new YourKeyInputModule()
});

const obj = new THREE.Group();
ctx.add(obj);

const camera = ctx.three.camera;
obj.add(camera);

const simpleMovement = KVY.addFeature(obj, YourSimpleMovement, { speed: 6 });
```

#### Get features

```js
const simpleMovement = KVY.getFeature(obj, YourSimpleMovement);
const someOtherFeature = KVY.getFeatureBy(obj, (x) => x.isSmth);

KVY.getFeatures(obj)?.forEach((feature) => {
    console.log(feature);
})

```
#### Destroy features

`destroy()` detachs *ctx* from *feature* and remove it from object.
```js
KVY.destroyFeature(obj, simpleMovement);
// or
KVY.getFeature(obj, YourSimpleMovement)?.destroy();
```

Detachs and destroys all attached to object *features*. Clear its hidden internal things to manage them.
#### Clear
```js
KVY.clear(obj);
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

```js
const anyHeirarchy = new THREE.Object3D();
ctx.add(anyHeirarchy); // ctx is KVY.GameContext

const obj = new THREE.Object3D();
anyHeirarchy.add(obj);

const target = new THREE.Object3D();
KVY.addFeature(obj, EasyOrbitControls, { target, options: {...}});

```
## Donate me 🥺🙏
🌐 ERC-20 wallet (USDC / USDT / ETH):
`0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e`
## Contact me 💃💅

- [Linkedin (/in/vladkrutenyuk)](https://www.linkedin.com/in/vladkrutenyuk/)

- [Instagram (@vladkrutenyuk)](https://instagram.com/vladkrutenyuk)

- [Twitter/X (@vladkrutenyuk)](https://x.com/vladkrutenyuk)
- [Twitter/X (@kvyverse)](https://x.com/kvyverse)

- [Telegram (@vladkrutenyuk)](https://t.me/vladkrutenyuk)

---

_meow :3_