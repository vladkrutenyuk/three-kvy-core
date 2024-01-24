import type { Body } from "cannon-es"
import * as CANNON from "cannon-es"
import {
	Box,
	Quaternion as CannonQuaternion,
	Vec3 as CannonVector3,
	ConvexPolyhedron,
	Cylinder,
	Heightfield,
	Shape,
	Sphere,
	Trimesh,
} from "cannon-es"
import {
	BoxGeometry,
	BufferGeometry,
	Color,
	CylinderGeometry,
	EdgesGeometry,
	Float32BufferAttribute,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	PlaneGeometry,
	Quaternion as ThreeQuaternion,
	Vector3 as ThreeVector3
} from "three"
import { DebugSphere, DebugSphereGeometry } from "./DebugSphere"

type ComplexShape = Shape & { geometryId?: number }
export type DebugOptions = {
	color?: string | number | Color
	scale?: number
	onInit?: (body: Body, mesh: Object3D, shape: Shape) => void
	onUpdate?: (body: Body, mesh: Object3D, shape: Shape) => void
}

const _tempVec0 = new CannonVector3()
const _tempVec1 = new CannonVector3()
const _tempVec2 = new CannonVector3()
const _tempQuat0 = new CannonQuaternion()
const _debugSphereGeometry = new DebugSphereGeometry(1)
const _boxGeometry = new BoxGeometry(1, 1, 1)
const _boxEdgesGeometry = new EdgesGeometry(_boxGeometry)
const _planeGeometry = new PlaneGeometry(10, 10, 10, 10)
// Move the planeGeometry forward a little bit to prevent z-fighting
_planeGeometry.translate(0, 0, 0.0001)

export default class CannonEsDebuggerPro {
	readonly material: MeshBasicMaterial
	readonly lineMaterial: LineBasicMaterial
	readonly world: CANNON.World
	readonly root: THREE.Object3D

	private readonly _options: DebugOptions = {
		color: 0x00ff00,
		scale: 1,
	}
	private readonly _meshes: Object3D[] = []

	constructor(root: THREE.Object3D, world: CANNON.World, options: DebugOptions = {}) {
		console.log("CreatingCannonDebugger... ")
		this._options = options
		this.world = world
		this.root = root
		const color = this._options.color ?? 0x00ff00
		this.material = new MeshBasicMaterial({
			color,
			wireframe: true,
		})
		this.lineMaterial = new LineBasicMaterial({ color })
	}

	private createMesh(shape: Shape): Object3D {
		let mesh: Object3D | null = null
		const { SPHERE, BOX, PLANE, CYLINDER, CONVEXPOLYHEDRON, TRIMESH, HEIGHTFIELD } =
			Shape.types

		const material = this.material
		switch (shape.type) {
			case SPHERE: {
				mesh = new DebugSphere(this.lineMaterial, _debugSphereGeometry)
				break
			}
			case BOX: {
				mesh = new LineSegments(_boxEdgesGeometry, this.lineMaterial)
				break
			}
			case PLANE: {
				mesh = new Mesh(_planeGeometry, material)
				break
			}
			case CYLINDER: {
				const geometry = new CylinderGeometry(
					(shape as Cylinder).radiusTop,
					(shape as Cylinder).radiusBottom,
					(shape as Cylinder).height,
					(shape as Cylinder).numSegments
				)
				mesh = new Mesh(geometry, material)
				;(shape as ComplexShape).geometryId = geometry.id
				break
			}
			case CONVEXPOLYHEDRON: {
				const geometry = createConvexPolyhedronGeometry(shape as ConvexPolyhedron)
				mesh = new Mesh(geometry, material)
				;(shape as ComplexShape).geometryId = geometry.id
				break
			}
			case TRIMESH: {
				const geometry = createTrimeshGeometry(shape as Trimesh)
				mesh = new Mesh(geometry, material)
				;(shape as ComplexShape).geometryId = geometry.id
				break
			}
			case HEIGHTFIELD: {
				const geometry = createHeightfieldGeometry(shape as Heightfield)
				mesh = new Mesh(geometry, material)
				;(shape as ComplexShape).geometryId = geometry.id
				break
			}
		}
		if (mesh) {
			this.root.add(mesh)
			return mesh
		}
		return new Object3D()
	}

	private scaleMesh(mesh: Object3D, shape: Shape | ComplexShape): void {
		const scale = this._options.scale ?? 1
		const { SPHERE, BOX, PLANE, CYLINDER, CONVEXPOLYHEDRON, TRIMESH, HEIGHTFIELD } =
			Shape.types
		switch (shape.type) {
			case SPHERE: {
				const { radius } = shape as Sphere
				mesh.scale.set(radius * scale, radius * scale, radius * scale)
				break
			}
			case BOX: {
				mesh.scale.copy((shape as Box).halfExtents as unknown as ThreeVector3)
				mesh.scale.multiplyScalar(2 * scale)
				break
			}
			case PLANE: {
				break
			}
			case CYLINDER: {
				mesh.scale.set(1 * scale, 1 * scale, 1 * scale)
				break
			}
			case CONVEXPOLYHEDRON: {
				mesh.scale.set(1 * scale, 1 * scale, 1 * scale)
				break
			}
			case TRIMESH: {
				mesh.scale
					.copy((shape as Trimesh).scale as unknown as ThreeVector3)
					.multiplyScalar(scale)
				break
			}
			case HEIGHTFIELD: {
				mesh.scale.set(1 * scale, 1 * scale, 1 * scale)
				break
			}
		}
	}

	private typeMatch(obj: Object3D, shape: Shape | ComplexShape): boolean {
		if (!obj) return false
		if (!isMesh(obj)) {
			return (
				(obj instanceof DebugSphere && shape.type === Shape.types.SPHERE) ||
				(obj instanceof LineSegments && shape.type === Shape.types.BOX)
			)
		}
		const { geometry } = obj
		return (
			(geometry instanceof PlaneGeometry && shape.type === Shape.types.PLANE) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === Shape.types.CYLINDER) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === Shape.types.CONVEXPOLYHEDRON) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === Shape.types.TRIMESH) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === Shape.types.HEIGHTFIELD)
		)
	}
	private updateMesh(index: number, shape: Shape | ComplexShape): boolean {
		let mesh = this._meshes[index]
		let didCreateNewMesh = false

		if (!this.typeMatch(mesh, shape)) {
			if (mesh) this.root.remove(mesh)
			this._meshes[index] = mesh = this.createMesh(shape)
			didCreateNewMesh = true
		}

		this.scaleMesh(mesh, shape)
		return didCreateNewMesh
	}

	update() {
		const shapeWorldPosition = _tempVec0
		const shapeWorldQuaternion = _tempQuat0

		let meshIndex = 0

		for (const body of this.world.bodies) {
			for (let i = 0; i !== body.shapes.length; i++) {
				const shape = body.shapes[i]
				const didCreateNewMesh = this.updateMesh(meshIndex, shape)
				const mesh = this._meshes[meshIndex]

				if (mesh) {
					// Get world position
					body.quaternion.vmult(body.shapeOffsets[i], shapeWorldPosition)
					body.position.vadd(shapeWorldPosition, shapeWorldPosition)

					// Get world quaternion
					body.quaternion.mult(body.shapeOrientations[i], shapeWorldQuaternion)

					// Copy to meshes
					mesh.position.copy(shapeWorldPosition as unknown as ThreeVector3)
					mesh.quaternion.copy(
						shapeWorldQuaternion as unknown as ThreeQuaternion
					)

					if (didCreateNewMesh && this._options.onInit)
						this._options.onInit(body, mesh, shape)
					if (!didCreateNewMesh && this._options.onUpdate)
						this._options.onUpdate(body, mesh, shape)
				}

				meshIndex++
			}
		}

		for (let i = meshIndex; i < this._meshes.length; i++) {
			const mesh = this._meshes[i]
			if (mesh) this.root.remove(mesh)
			//TODO dispose geometries
		}

		this._meshes.length = meshIndex
	}

	clear() {
		//TODO clear
	}

	destroy() {
		//TODO destroy
	}
}

function createTrimeshGeometry(shape: Trimesh): BufferGeometry {
	const geometry = new BufferGeometry()
	const positions = []
	const v0 = _tempVec0
	const v1 = _tempVec1
	const v2 = _tempVec2

	for (let i = 0; i < shape.indices.length / 3; i++) {
		shape.getTriangleVertices(i, v0, v1, v2)
		positions.push(v0.x, v0.y, v0.z)
		positions.push(v1.x, v1.y, v1.z)
		positions.push(v2.x, v2.y, v2.z)
	}

	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
	geometry.computeBoundingSphere()
	geometry.computeVertexNormals()
	return geometry
}

function createConvexPolyhedronGeometry(shape: ConvexPolyhedron): BufferGeometry {
	const geometry = new BufferGeometry()

	// Add vertices
	const positions = []
	for (let i = 0; i < shape.vertices.length; i++) {
		const vertex = shape.vertices[i]
		positions.push(vertex.x, vertex.y, vertex.z)
	}
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))

	// Add faces
	const indices = []
	for (let i = 0; i < shape.faces.length; i++) {
		const face = shape.faces[i]
		const a = face[0]
		for (let j = 1; j < face.length - 1; j++) {
			const b = face[j]
			const c = face[j + 1]
			indices.push(a, b, c)
		}
	}

	geometry.setIndex(indices)
	geometry.computeBoundingSphere()
	geometry.computeVertexNormals()
	return geometry
}

function createHeightfieldGeometry(shape: Heightfield): BufferGeometry {
	const geometry = new BufferGeometry()
	const s = shape.elementSize || 1 // assumes square heightfield, else i*x, j*y
	const positions = shape.data.flatMap((row, i) =>
		row.flatMap((z, j) => [i * s, j * s, z])
	)
	const indices = []

	for (let xi = 0; xi < shape.data.length - 1; xi++) {
		for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
			const stride = shape.data[xi].length
			const index = xi * stride + yi
			indices.push(index + 1, index + stride, index + stride + 1)
			indices.push(index + stride, index + 1, index)
		}
	}

	geometry.setIndex(indices)
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
	geometry.computeBoundingSphere()
	geometry.computeVertexNormals()
	return geometry
}

export function isMesh<
	TMat extends THREE.Material | THREE.Material[],
	TGeom extends THREE.BufferGeometry = THREE.BufferGeometry
>(obj: THREE.Object3D): obj is THREE.Mesh<TGeom, TMat> {
	return (obj as THREE.Mesh).isMesh || obj.type === "Mesh"
}
