import * as KVY from "../dist/esm/index.js";

export class RotateOF extends KVY.Object3DFeature {

    constructor(props) {
        super(props);
        console.log('new RotateOF');
    }

    /** @param {KVY.GameContext} ctx */
    useCtx(ctx) {
        console.log('useCtx');
        /** @type {THREE.Object3D}  */
        const object = this.object;
        const listener = ctx.three.addEventListener('beforeRender', () => {
            console.log('beforeRender');
            this.object.rotation.y += ctx.deltaTime * 10;
        })
        
        return () => {
            ctx.three.removeEventListener('beforeRender', listener)
        }
    }
}