
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

> An `llms.txt` file is included in the package — a comprehensive guide for LLMs and AI coding agents covering all APIs, lifecycle, patterns, and addons.

## What does it look like?
### Quick Example: Coin Collector Mini-Game

WASD movement, spinning coins, pickup detection, and a simple score system — showcasing custom modules, multiple features per object, cross-feature communication, and fixed-tick logic.
```javascript
import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";

// --- Setup ---

const renderer = new THREE.WebGPURenderer({ antialias: true });
const ctx = KVY.CoreContext.create({
    renderer,
    camera: new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100),
    scene: new THREE.Scene(),
    clock: new THREE.Clock(),
    modules: {}
});

renderer.init().then(() => {
    ctx.three.mount(document.querySelector("#canvas-container"));
    ctx.run();
});

// --- Modules ---

class InputModule extends KVY.CoreContextModule {
    keys = {};

    useCtx() {
        const onDown = (e) => { this.keys[e.code] = true; };
        const onUp = (e) => { this.keys[e.code] = false; };
        window.addEventListener("keydown", onDown);
        window.addEventListener("keyup", onUp);
        return () => {
            window.removeEventListener("keydown", onDown);
            window.removeEventListener("keyup", onUp);
        };
    }

    pressed(code) {
        return !!this.keys[code];
    }
}

class FixedTickModule extends KVY.CoreContextModule {
    step = 1 / 60;
    _accumulator = 0;

    onBeforeRender(ctx) {
        this._accumulator += ctx.deltaTime;
        while (this._accumulator >= this.step) {
            this._accumulator -= this.step;
            this.emit("fixedtick", this.step);
        }
    }
}

ctx.assignModules({
    input: new InputModule(),
    fixedTick: new FixedTickModule(),
});

// --- Features ---

class PlayerMovement extends KVY.Object3DFeature {
    speed = 5;
    score = 0;

    onBeforeRender(ctx) {
        const { input } = ctx.modules;
        const dt = ctx.deltaTime;
        const dir = new THREE.Vector3();

        if (input.pressed("KeyW")) dir.z -= 1;
        if (input.pressed("KeyS")) dir.z += 1;
        if (input.pressed("KeyA")) dir.x -= 1;
        if (input.pressed("KeyD")) dir.x += 1;

        if (dir.length() > 0) {
            dir.normalize();
            this.object.position.addScaledVector(dir, this.speed * dt);
        }
    }

    addScore() {
        this.score += 1;
        console.log("%c Score: " + this.score, "color: gold; font-weight: bold;");
    }
}

class CoinSpin extends KVY.Object3DFeature {
    onBeforeRender(ctx) {
        this.object.rotateY(ctx.deltaTime * 3);
    }
}

class CoinPickup extends KVY.Object3DFeature {
    _playerFeature = null;

    useCtx(ctx) {
        // Find PlayerMovement feature on any object in the scene
        ctx.root.traverse((child) => {
            const found = KVY.getFeature(child, PlayerMovement);
            if (found) this._playerFeature = found;
        });

        // Subscribe to fixed tick for consistent pickup detection
        const onFixedTick = () => this._checkPickup();
        ctx.modules.fixedTick.on("fixedtick", onFixedTick);
        return () => ctx.modules.fixedTick.off("fixedtick", onFixedTick);
    }

    _checkPickup() {
        if (!this._playerFeature) return;

        const dist = this.object.position.distanceTo(this._playerFeature.object.position);
        if (dist < 1) {
            this._playerFeature.addScore();
            this.object.removeFromParent();
            KVY.clear(this.object);
        }
    }
}

// --- Build Scene ---

const player = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.MeshNormalMaterial()
);
ctx.root.add(player);
KVY.addFeature(player, PlayerMovement);

for (let i = 0; i < 6; i++) {
    const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    coin.position.set(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
    );
    coin.rotateX(Math.PI / 2);
    ctx.root.add(coin);

    KVY.addFeature(coin, CoinSpin);
    KVY.addFeature(coin, CoinPickup);
}

ctx.root.add(new THREE.AmbientLight(0xffffff, 0.5));
ctx.root.add(new THREE.DirectionalLight(0xffffff, 1));
ctx.three.camera.position.set(0, 10, 10);
ctx.three.camera.lookAt(0, 0, 0);
```