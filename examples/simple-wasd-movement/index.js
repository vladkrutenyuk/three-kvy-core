import * as THREE from "three";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import { PlayerGraphics } from "./PlayerGraphics.js";
import { InputKeyModule } from "./InputKeyModule.js";
import { CameraFollow } from "./CameraFollow.js";
import { SimpleMovement } from "./SimpleMovement.js";

const ctx = KVY.GameContext.create(THREE, {
    input: new InputKeyModule()
}, {
    antialias: true
});

// scene graphics
const scene = ctx.three.scene;
const bgColor = 0x202020;
scene.background = new THREE.Color(bgColor);
scene.fog = new THREE.Fog(bgColor, 8, 30);

const grid = new THREE.GridHelper(100, 100);
scene.add(grid);

// player
const player = new THREE.Group();
ctx.root.add(player);

// добавляем фичи
KVY.addFeature(player, SimpleMovement, { speed: 6 });
KVY.addFeature(player, CameraFollow, { offset: new THREE.Vector3(0, 4, 5), lookAtHeight: 1.5 });
KVY.addFeature(player, PlayerGraphics);

// запускаемся
ctx.three.mount(document.querySelector("#canvas-container"));
ctx.run();