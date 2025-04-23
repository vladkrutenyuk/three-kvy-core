import { IFeaturable } from "@vladkrutenyuk/three-kvy-core";
import { Collider } from "../Collider";
import type * as THREE from "three";

export class ConvexMeshCollider extends Collider {
	constructor(object: IFeaturable) {
		const props = [colType] as any;
		super(object, props);
	}

	protected useCtx(ctx: typeof this.ctx): () => void {
		const mesh = this.object;
		if (!isMesh(mesh)) {
			console.error("TrimeshCollider can be applied only for Mesh");
			return () => {};
		}
		this._params = createConvexColliderFromMesh(mesh);
		return super.useCtx(ctx);
	}
}

const colType = "convexHull";

function isMesh(obj: unknown): obj is THREE.Mesh {
	return (obj as THREE.Mesh).isMesh;
}

export function createConvexColliderFromMesh(mesh: THREE.Mesh): ["convexHull", points: Float32Array] {
	const geometry = mesh.geometry.clone();

	// Применим мировую трансформацию к геометрии
	geometry.applyMatrix4(mesh.matrixWorld);

	// Получаем позиционные вершины
	const positionAttr = geometry.getAttribute("position");
	if (!positionAttr) {
		throw new Error("Mesh geometry has no position attribute");
	}

	const float32Points = new Float32Array(positionAttr.count * 3);
	for (let i = 0; i < positionAttr.count; i++) {
		float32Points[i * 3 + 0] = positionAttr.getX(i);
		float32Points[i * 3 + 1] = positionAttr.getY(i);
		float32Points[i * 3 + 2] = positionAttr.getZ(i);
	}

	return [colType, float32Points];
}
