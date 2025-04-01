import * as THREE from "three";
import KVY from "../lib.js";

export class RapierDebugRenderer {
    /** @type {THREE.LineSegments} */
    mesh;
    /** @type {import("@dimforge/rapier3d-compat").World} */
    world;
    enabled = true;

    constructor(scene, world) {
        this.world = world;
        this.mesh = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true })
        );
        this.mesh.frustumCulled = false;
        scene.add(this.mesh);
    }

    update() {
        const mesh = this.mesh;
        const world = this.world;
        if (this.enabled) {
            const { vertices, colors } = world.debugRender();
            mesh.geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(vertices, 3)
            );
            mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
            mesh.visible = true;
        } else {
            mesh.visible = false;
        }
    }
}