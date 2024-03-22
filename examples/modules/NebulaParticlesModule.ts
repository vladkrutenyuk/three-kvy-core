import { GameContext, GameContextModule } from "@vladkrutenyuk/game-world";
import * as NEBULA from "three-nebula";
import * as THREE from "three";

export class NebulaParticlesModule extends GameContextModule {
	system!: NEBULA.System;
	spriteRenderer!: NEBULA.SpriteRenderer;

	protected onInit<TModules extends Readonly<Record<string, GameContextModule>>>(
		world: GameContext<TModules>
	): void {
		this.system = new NEBULA.System();
		this.spriteRenderer = new NEBULA.SpriteRenderer(
			world.three.scene,
			//@ts-ignore
			THREE
		);
		this.system.addRenderer(this.spriteRenderer);

		world.three.addEventListener("beforeRender", this.onBeforeRender);
	}

	protected onDestroy() {
		this.system.removeRenderer(this.spriteRenderer);
		this.system.destroy();
	}

	onBeforeRender = () => {
		this.system.update();
	};
}

// export {}
