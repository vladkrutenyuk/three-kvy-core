import { IFeaturable } from "@vladkrutenyuk/three-kvy-core";
import { Collider } from "../Collider";
import type * as THREE from "three";

export class TrimeshCollider extends Collider {
	constructor(object: IFeaturable) {
		const props = [colType] as any;
		super(object, props);
	}

	protected useCtx(ctx: typeof this.ctx): () => void {
		const mesh = this.object;
		if (!isMesh(mesh)) {
			console.error("TrimeshCollider can be applied only for Mesh")
			return () => {};
		}
		this._params = createTrimeshColliderArgsFromMesh(mesh);
		return super.useCtx(ctx);
	}
}

const colType = "trimesh";

function isMesh(obj: unknown): obj is THREE.Mesh {
	return (obj as THREE.Mesh).isMesh;
}

export function createTrimeshColliderArgsFromMesh(mesh: THREE.Mesh) {
	const geometry = mesh.geometry.clone();

	// Применим мировую трансформацию
	geometry.applyMatrix4(mesh.matrixWorld);

	const positionAttr = geometry.getAttribute("position");
	const indexAttr = geometry.index;

	if (!positionAttr || !indexAttr) {
		throw new Error(
			"Geometry must have position and index attributes to create trimesh"
		);
	}

	// Вершины
	const vertices = new Float32Array(positionAttr.count * 3);
	for (let i = 0; i < positionAttr.count; i++) {
		vertices[i * 3 + 0] = positionAttr.getX(i);
		vertices[i * 3 + 1] = positionAttr.getY(i);
		vertices[i * 3 + 2] = positionAttr.getZ(i);
	}

	const indices = new Uint32Array(indexAttr.array); // даже если уже Uint16Array, норм — скопирует

	// Создаём тримеш-коллайдер
	return [colType, vertices, indices] as [
		"trimesh",
		vertices: Float32Array<ArrayBufferLike>,
		indices: Uint32Array<ArrayBufferLike>
	];
}
