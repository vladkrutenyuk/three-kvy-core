# three-kvy-core

[![ERC-20](https://img.shields.io/badge/Donate-ERC--20-black)](https://etherscan.io/address/0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e)
[![minzip](https://badgen.net/bundlephobia/minzip/@vladkrutenyuk/three-kvy-core)](https://bundlephobia.com/package/@vladkrutenyuk/three-kvy-core)
[![npm](https://img.shields.io/npm/v/@vladkrutenyuk/three-kvy-core)](https://www.npmjs.com/package/@vladkrutenyuk/three-kvy-core)
[![GitHub](https://img.shields.io/github/stars/vladkrutenyuk/three-kvy-core?style=social)](https://github.com/vladkrutenyuk/three-kvy-core)
[![Twitter](https://img.shields.io/twitter/follow/vladkrutenyuk
)](https://x.com/vladkrutenyuk)

**Supercharge for your [Three.js](https://www.npmjs.com/package/three) workflow.**  
Everything you need to create any-complexity 3D apps with Three.js.

A powerful component-oriented lib, enabling an elegant lifecycle management system and basic initializations. Empower Three.js objects by reusable features within seamless context propagation with pluggable modules. The OOP-driven.

✅  Doesn't impose any restrictions on your existing Three.js logic.  
🔄 Fully compatible with any approach you already use.  
🌐 Framework agnostic.  
⚡ Zero boilerplate.  
📘 Written on Typescript.  
📦 Bundle size is ~12 kB.  


> 🧐 The lib is designed in way not no include three.js as dependency.  
> It manipulates three.js entities but does not refer to them.

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

---

> [!NOTE]  
> :point_right: Throughout this documentation, the following terms denote:  
> _context_ → `KVY.GameContext`  
> _module_ → `KVY.GameContextModule`  
> _feature_ → `KVY.Object3DFeature`  
> _object_ → `THREE.Object3D`  

# Quick start guide

## 1. Create *context* with *modules*

```js
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import * as THREE from "three";

const ctx = KVY.GameContext.create(THREE, {
    moduleExample: new ModuleExample(),
}, {
    antialias : true
});

// mount ctx's three.js renderer canvas
ctx.three.mount(document.querySelector("#some-div-container"));
// run ctx's game loop
ctx.loop.run();
```

## 2. Use *features* for three.js objects
Use the static method `addFeature` that adds a feature to a `THREE.Object3D` instance using a feature class (not an instance) extended from `Object3DFeature`, with optional props for its constructor.
```js
const obj = new THREE.Object3D();
ctx.root.add(obj);

const feature = KVY.addFeature(obj, FeatureExample, { speed: 3 });

KVY.addFeature(obj, AnotherFeature, { name: "Vitalik" });

KVY.addFeature(obj, FeatureWithoutProps);
```

> [!IMPORTANT]  
> :warning: **This is a very important!**
>
> **For features to work, their objects must be in the context hierarchy `ctx.root`**.  
>
>See [Context Propagation](#5-context-propagation).

And here is example how to get or destroy features.
```js
const featureExample = KVY.getFeature(obj, FeatureExample);
const someOtherFeature = KVY.getFeatureBy(obj, (x) => x.isSmth);

KVY.getFeatures(obj)?.forEach((feature) => {
    console.log(feature);
})

featureExample.destroy();
KVY.destroyFeature(someOtherFeature);
```

## 3. Writing `GameContextModule`
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

## 4. Writing `Object3DFeature`
```js
export class FeatureExample extends KVY.Object3DFeature {
    constructor(object, props) {
        super(object);
        this.speed = props.speed;
    }

    // use built-in event methods in override way

    useCtx(ctx) {
        // use attached ctx on its attach;
        ctx.deltaTime;
        ctx.three.scene;
        ctx.three.camera;

        // use ctx modules you defined;
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

# Core Concepts

> :point_right: Here, `ctx` denote an instance of `KVY.GameContext`.

## 1. GameContext

The primary central entity (like "hub") that orchestrates the Three.js environment, animation loop, and module system. It enables an elegant lifecycle management system and handles essential initializations

It is propagated through all features of objects within the hierarchy of its root (`ctx.root`).

General entities:  
`ctx.root` is `THREE.Object3D` that serves as the entry point for context propagation (see [Context Propagation](#5-context-propagation)).  
`ctx.three` is `KVY.ThreeContext` to manage the core three.js rendering setup.  
`ctx.loop` is `KVY.AnimationFrameLoop` to manage the `requestAnimationFrame` loop.  

## 2. GameContextModule
Base class for extending GameContext functionality through pluggable modules. Modules are initialized with context, can provide services to features, and manage their own lifecycle through `useCtx` pattern. Enables clean separation of concerns while maintaining full access to context capabilities.

## 3. Object3DFeature
Base class for implementing reusable components (features) that can be attached to any Three.js object. Context is automatically propagated to features when their object is added to `ctx.root` hierarchy, and lose it when removed.  
Provides:  
    - Context and its modules access through overridable `useCtx` and `onCtxAttach/onCtxDetach` methods.  
    - Built-in overridable lifecycle methods: `onBeforeRender`, `onAfterRender`, `onLoopRun/onLoopStop`, `onResize`, `onMount/onUnmount`.  
    - Direct access to object `this.object` the feature is attached to.  

## 4. The `useCtx` Pattern
Both `Object3DFeature` and `GameContextModule` implement the powerful `useCtx` pattern, where you are able to:
- Automatically sets up resources when context is attached
- Returns a cleanup function that's automatically called on detachment
- Ensures proper resource management with minimal boilerplate.

Method is overridable and called when the feature is attached to context.
Returns a cleanup function that is called on detach, similar to `useEffect()` in React.

## 5. Context Propagation

> :warning: **This is a very important!**

1. For *features* to work, their objects must be in the *context* hierarchy `ctx.root`.
    - The `ctx.root` is a `THREE.Object3D` that serves as the entry point for *context* propagation. 
    - Any object added to `ctx.root` or its descendants will receive the *context*.
    - By default `ctx.root` is `THREE.Scene` (`ctx.root` === `ctx.three.scene`) if `root` was not providen on `ctx` creation. See [Alternative raw way to create GameContext](#1-alternative-raw-way-to-create-gamecontext).
2. Context attachment to object's features occurs:
    - An object with features (or its parent hierarchy) has added to `ctx.root`
    - A feature has added to an object that's already in the `ctx.root` hierarchy
3. Context detachment from object's features occurs:
    - An object or its parent hierarchy has removed from `ctx.root`.
    - A Feature destroy method has called.
4. Order doesn't matter.
    - Features can be added before or after including objects in the hierarchy.

Here's how it works in practice:
```js
// Direct child
const obj = new THREE.Object3D();
KVY.addFeature(obj, SomeFeature);
ctx.root.add(obj); // ctx has attached to "obj" features here!
```
```js
// Or deeper in hierarchy
const parent = new THREE.Group();
const child = new THREE.Object3D();
KVY.addFeature(child, SomeFeature);
parent.add(child);
ctx.root.add(parent); // ctx has attached to "child" features here!
```
```js
// Or another order
const parent = new THREE.Group();
ctx.root.add(parent); 

const child = new THREE.Object3D();
parent.add(child);

KVY.addFeature(child, SomeFeature); // ctx has attached to "child" features here!
```

## 6. Features management. Factory
### Add features
Use the static method `addFeature` that adds a feature to a `THREE.Object3D` instance using a feature class (not an instance) extended from `Object3DFeature`, with optional props for its constructor.
```js
const obj = new THREE.Object3D();

const feature = KVY.addFeature(obj, FeatureExample, { speed: 3 });

ctx.root.add(obj);

KVY.addFeature(obj, AnotherFeature, { name: "Vitalik" });

KVY.addFeature(obj, FeatureWithoutProps);
```

### Get features
Use static methods `getFeature` to find feature by its class, `getFeatureBy` to find by custom predicate, or `getFeatures` to get all features attached to an object.

```js
const simpleMovement = KVY.getFeature(obj, YourSimpleMovement);
const someOtherFeature = KVY.getFeatureBy(obj, (x) => x.isSmth);

KVY.getFeatures(obj)?.forEach((feature) => {
    console.log(feature);
})

```
### Destroy features
Use `destroyFeature` static method or feature instance's `destroy` method to detach feature from object and clean up its resources.
```js
const feature = KVY.addFeature(obj, FeatureExample);

KVY.destroyFeature(obj, feature);
// or
feature.destroy();
```

### Clear
Use `clear` static method to destroy and detach all features from the given object, cleaning up any associated resources and removing the featurability aspect from the object.
```js
KVY.clear(obj);
```
# Guides and Examples
## 1. Alternative raw way to create `GameContext`
It can be usefull if you use some framework or lib which initializes threejs's entities by itself in special way.

```ts
const renderer = new THREE.WebGLRenderer({ antialias : true });
const camera = new THREE.PerspectiveCamera();
const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();

const three = new KVY.ThreeContext(renderer, camera, scene, raycaster);

const root = new THREE.Group();
scene.add(root);
const clock = new THREE.Clock(false);

const ctx = new KVY.GameContext(three, root, clock, {
    moduleA: new MyModuleA(),
    moduleB: new MyModuleB(),
})
```

## 2. Work with `ThreeContext`
`KVY.GameContext` has it: `ctx.three`.
```js
const three = new KVY.ThreeContext.create(THREE, { antialias : true });
```
```js
// access basic three.js entities
three.renderer;
three.camera;
three.scene;
three.raycaster;

// mount/unmount renderer canvas
// Emits `mount` and `unmount` events.
three.mount(document.querySelector("#three-canvas-container"));
three.unmount();

three.container;

// Renders the scene using the current render function
// Emits `renderbefore` and `renderafter` events.
three.render();

three.on("camerachanged", (camera) => {
    console.log("new camera was set", camera);
})
// Set camera. Emits `camerachanged`.
three.camera = new THREE.PerspectiveCamera(); // > "new camera was set"

// set custom render implementation
function myCustomRender() { ... }
three.overrideRenderFn(myCustomRender)

// back original source render
three.resetRenderFn();

// It disposes renderer, unmounts canvas, prevents further rendering.
// Emits a `destroy` event.
three.destory();
```

## 3. Integration with React

```jsx
const ThreeKvyCore = ({ ctx }) => {
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
    }, [ctx]);

    return <div ref={ref} style={{width:"100%",height:"100%"}} />;
}
```
```jsx
const ctx = KVY.GameContext.create(THREE, { ... })

const App = () => {
    return (
        <AnyYourLayout>
            <ThreeKvyCore ctx={ctx} />
        </AnyYourLayout>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <App />
);
```

## 4. Simple Movement Example
`InputKeyModule.js`
```js
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class InputKeyModule extends KVY.GameContextModule {
    keys = new Set();
    isKeyDown = (key) => this.keys.has(key);

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
`SimpleMovement.js`

```js
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class SimpleMovement extends KVY.Object3DFeature {
    speed = 10;

    constructor(object, props) {
        super(object);
        this.speed = props.speed;
    }

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

Put it together!
```js
import * as THREE from "three";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import { InputKeyModule } from "./InputKeyModule.js"
import { SimpleMovement } from "./SimpleMovement.js"

const ctx = KVY.GameContext.create(THREE, { 
    input: new InputKeyModule()
});

const character = new THREE.Group();
ctx.root.add(character);

const camera = ctx.three.camera;
character.add(camera);

KVY.addFeature(character, SimpleMovement, { speed: 6 });
```

## 5. EasyOrbitControls. Adaptation example

Additionally, any code can be easily adapted to the Object3DFeature style, making integration seamless and non-intrusive.

`EasyOrbitControls.js`
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
const obj = new THREE.Object3D();
ctx.root.add(obj);

const target = new THREE.Object3D();
KVY.addFeature(obj, EasyOrbitControls, { target, options: { ... } });
```

## 6. Set modules after initialization
This flexibility allows you to dynamically register modules as needed even after initialization.
```js
const ctx = KVY.GameContext.create(THREE, { 
    moduleA: new ModuleA(),
    moduleB: new ModuleB()
});

ctx.setModules({
    moduleC: new ModuleC(),
    moduleD: new ModuleD(),
})

ctx.modules.moduleA;
ctx.modules.moduleB;
ctx.modules.moduleD;
ctx.modules.moduleC;
```

# Donate me 🥺🙏
🌐 ERC-20 wallet (USDC / USDT / ETH):
`0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e`
# Contact me 💃💅

- [Linkedin (/in/vladkrutenyuk)](https://www.linkedin.com/in/vladkrutenyuk/)

- [Instagram (@vladkrutenyuk)](https://instagram.com/vladkrutenyuk)

- [Twitter/X (@vladkrutenyuk)](https://x.com/vladkrutenyuk)
- [Twitter/X (@kvyverse)](https://x.com/kvyverse)

- [Telegram (@vladkrutenyuk)](https://t.me/vladkrutenyuk)

---

_meow :3_