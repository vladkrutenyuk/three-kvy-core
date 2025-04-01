
# three-kvy-core

[![npm](https://img.shields.io/npm/v/@vladkrutenyuk/three-kvy-core)](https://www.npmjs.com/package/@vladkrutenyuk/three-kvy-core)
[![minzip](https://badgen.net/bundlephobia/minzip/@vladkrutenyuk/three-kvy-core)](https://bundlephobia.com/package/@vladkrutenyuk/three-kvy-core)
[![GitHub](https://img.shields.io/github/stars/vladkrutenyuk/three-kvy-core?style=social)](https://github.com/vladkrutenyuk/three-kvy-core)
[![Twitter](https://img.shields.io/twitter/follow/vladkrutenyuk
)](https://x.com/vladkrutenyuk)
[![ETH](https://img.shields.io/badge/ETH-black)](https://etherscan.io/address/0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e)
[![TRON](https://img.shields.io/badge/TRX-black)](https://tronscan.org/#/address/TPKRxSrpwPhwfVrrR8qpjZ2knpB4zWopFo)

## **A powerful [Three.js](https://threejs.org/) extension to create scalable 3D apps of any-complexity.**

This is lightweight component-oriented library, enabling an elegant lifecycle management system and basic initializations. Empower Three.js objects by reusable features within seamless context propagation with pluggable modules. The OOP-driven.

> This library is designed in way not no include three.js as dependency.  
> It manipulates three.js entities but does not refer to them.

Doesn't impose any restrictions on your existing Three.js logic. Compatible with any approach you already use.

- Framework agnostic
- Extensible & plugin architecture
- Provides scalable development
- Events based
- Typescript support
- Lightweight. (3.5kb minzipped)

## Installation

```sh
npm i three eventemitter3 @vladkrutenyuk/three-kvy-core 
```

## Documentation, tutorials, examples

Visit [three-kvy-core.vladkrutenyuk.ru](https://three-kvy-core.vladkrutenyuk.ru)

## What does it look like?

```js
import * as THREE from "three";
import * as KVY from "@vladkrutenyuk/three-kvy-core";

const ctx = KVY.CoreContext.create(THREE, {}, { renderer: { antialias: true } });

ctx.three.mount(document.querySelector("#canvas-container"));
ctx.run();

class CustomTickModule extends KVY.CoreContextModule {
    useCtx(ctx) {
        const interval = setInterval(() => {
            this.emit("customtick");
        }, 2000);

        return () => clearInterval(interval);
    }
}

ctx.assignModules({ tick: new CustomTickModule() });

class SpinningToFro extends KVY.Object3DFeature {
    speed = 1;

    useCtx(ctx) {
        const onTick = () => {
            this.speed *= -1;
        };
        
        ctx.modules.tick.on("customtick", onTick);

        return () => ctx.modules.tick.off("customtick", onTick);
    }

    onBeforeRender(ctx) {
        const angle = this.speed * ctx.deltaTime;
        this.object.rotateX(angle);
        this.object.rotateY(angle);
    }
}

const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial() );
ctx.root.add(cube);

KVY.addFeature(cube, SpinningToFro);

ctx.three.camera.position.z = 5;
```