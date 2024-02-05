import { GameWorld, GameWorldModule } from "@vladkrutenyuk/game-world";
import * as NEBULA from "three-nebula";
import * as THREE from "three";

export default class NebulaParticlesModule extends GameWorldModule {
	system!: NEBULA.System;
	spriteRenderer!: NEBULA.SpriteRenderer;

	protected onInit<TModules extends Readonly<Record<string, GameWorldModule>>>(
		world: GameWorld<TModules>
	): void {
		this.system = new NEBULA.System();
		this.spriteRenderer = new NEBULA.SpriteRenderer(
			world.three.scene,
			//@ts-ignore
			THREE
		);
		this.system.addRenderer(this.spriteRenderer);

		world.three.addEventListener("beforeRender", this.onBeforeRender);
		world.three.addEventListener("destroy", this.onDestroy);
	}

	protected onDestroy() {
		this.system.removeRenderer(this.spriteRenderer);
		this.system.destroy();
	}

	onBeforeRender = () => {
		this.system.update();
	};
}
