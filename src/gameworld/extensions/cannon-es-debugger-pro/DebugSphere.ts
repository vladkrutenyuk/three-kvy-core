import * as THREE from "three"

export class DebugSphereGeometry extends THREE.BufferGeometry {
    constructor(radius = 1, segments = 64) {
        super()
		const points = []
		for (let i = 0; i <= segments; i++) {
			const theta = (i / segments) * Math.PI * 2
			points.push(
				new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0)
			)
		}

		this.setFromPoints(points)
    }
}
export class DebugSphere extends THREE.Object3D {
	readonly geometry: DebugSphereGeometry
	readonly material: THREE.LineBasicMaterial

	constructor(material: THREE.LineBasicMaterial, geometry: DebugSphereGeometry) {
		super()
		// const segments = Math.ceil((2 * Math.PI * radius) / segmentLength)
		// const geometry = new DebugSphereGeometry(radius, segments)

		const circle1 = new THREE.LineLoop(geometry, material)

		const circle2 = new THREE.LineLoop(geometry, material)
		circle2.rotateX(Math.PI * 0.5)

		const circle3 = new THREE.LineLoop(geometry, material)
		circle3.rotateX(Math.PI * 0.5)
		circle3.rotateY(Math.PI * 0.5)

		this.add(circle1, circle2, circle3)

		this.geometry = geometry
		this.material = material
	}
}
