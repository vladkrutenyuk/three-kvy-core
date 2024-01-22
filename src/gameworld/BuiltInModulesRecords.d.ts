//TODO difine different varians of built-in templates

import CannonPhysicsModule from './modules/CannonPhysicsModule'
import NebulaParticlesModule from './modules/NebulaParticlesModule'
import ThreePostProcessingModule from './modules/ThreePostProcessingModule'

export type CPHModule = {
	readonly cannon: CannonPhysicsModule
}
export type PPModule = {
	readonly postprocessing: ThreePostProcessingModule
}
export type NPModule = {
	readonly nebula: NebulaParticlesModule
}

export type AllModules = CPHModule & PPModule & NPModule