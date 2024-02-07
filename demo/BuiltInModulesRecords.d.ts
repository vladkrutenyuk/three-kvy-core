//TODO difine different varians of built-in templates

import CannonPhysicsModule from "../examples/modules/CannonPhysicsModule";
import NebulaParticlesModule from "../examples/modules/NebulaParticlesModule";
import ThreePostProcessingModule from "../examples/modules/ThreePostProcessingModule";

export type CPHModule = {
	readonly cannon: CannonPhysicsModule;
};
export type PPModule = {
	readonly postprocessing: ThreePostProcessingModule;
};
export type NPModule = {
	readonly nebula: NebulaParticlesModule;
};

export type AllModules = CPHModule & PPModule & NPModule;
