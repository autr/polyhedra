<script>
	import * as BB from 'babylonjs'
	import { onMount } from 'svelte'
	import * as CANNON from 'cannon-es'
	// import { AmmoJSPlugin } from '@babylonjs/core/Physics/Plugins/ammoJSPlugin'
	import Ammo from 'ammojs-typed'
	import earcut from 'earcut'

	let engine, physics, canvas, scene, camera, light

	let ground, sphereA, sphereB, axes

	let meshPolygons = []

	let inventory = {
		magnets: [],
		magneticPolygons: [],
		meshPolygons: [],
		strutJoints: [],
		crisscrossJoints: []
	}


	let params = {
		demo: {
			particlesCount: 0, //100,
			polygonsCount: 1,
			maxSides: 8,
			showAxes: false

		},
		misc: {
			updateJoints: false,
			debugger: true
		},
		scenePhysics: {
			gravity: 50,
			ground: true
		},
		magnetImpulse: {
			amount: 200,
			invert: false
		},
		sphereSize: {
			diameter: 5,
			segments: 32
		},
		magnetPhysics: {
			mass: 10,
			friction: 0,
			restitution: -10,
			linearDamping: 0.95,
			angularDamping: 0.95,
		},
		strutJoints: {
			rigid: true,
			length: 30,
			diameter: 1,
			physics: {
				mass: 0,
				restitution: 0,
				friction: 0,
				linearDamping: 0,
				angularDamping: 0,
			}

		},
		crisscrossJoints: {
			enabled: false,
			rigid: false,
			length: 50,
			diameter: 0.5,
			physics: {
				mass: 0,
				restitution: 0,
				friction: 0
			}
		}
	}

	onMount( async e => {
		await init()
	})

	function createPoint( x, y, z ) {
		return BB.Vector3( x, y, z )
	}

	function createGround() {

		const size = params.strutJoints.length * 5
		const _ground = BB.MeshBuilder.CreateGround( 'ground', {
			width: size, 
			height: size,
			sideOrientation: BB.Mesh.DOUBLESIDE
		}, scene)

		_ground.physicsImpostor = new BB.PhysicsImpostor( _ground,
			BB.PhysicsImpostor.BoxImpostor,
			{
				mass: 0,
				restitution: 0.9
			},
			scene)
		_ground.position.y -= size/2
		return ground
	}

	function random(min, max) {
		return Math.random() * (max - min) + min;
	}

	async function init() {

		window.CANNON = CANNON
		const ammo = await Ammo()
		
		console.log(Ammo)

		engine = new BABYLON.AmmoJSPlugin( true, ammo )


		// new BABYLON.Engine( canvas, true, {preserveDrawingBuffer: true, 
		// 	stencil: true
		// })

		physics = new BABYLON.CannonJSPlugin()
		physics.setTimeStep(0)
		scene = new BB.Scene(engine)

		let gravity = BB.Vector3.Zero()
		gravity.y -= params.scenePhysics.gravity
		scene.enablePhysics( gravity, physics )

		camera = new BB.ArcRotateCamera( 'camera1',
			0, 0, 10, 
			new BB.Vector3(0, 0, params.strutJoints.length * -5), 
			scene)

		camera.setTarget(BB.Vector3.Zero())
		camera.attachControl(canvas, true)

		light = new BB.HemisphericLight( 'light', 
			new BB.Vector3(0, 1, 0), 
			scene)

		light.intensity = 0.7

		const { demo, scenePhysics } = params
		createRandomParticles( demo.particlesCount )
		createRandomMagneticPolygons( demo.polygonsCount )

		if (scenePhysics.ground) {
			createGround()
		}

		scene.onBeforePhysicsObservable.add ( runMagnetImpulses )
		engine.runRenderLoop( runRenderLoop )

		if (params.demo.showAxes) {
			axes = new BABYLON.AxesViewer(scene, 5)
		}

		if (params.misc.debugger) scene.debugLayer.show()

		// scene.collisionsEnabled = false
		// camera.checkCollisions = false

		window.requestAnimationFrame( e => {

			physics.setTimeStep(1/60)
		})

		window.physics = physics

	}

	function onKeydown(e) {
		if (e.key == ' ') {
			createRandomMagneticPolygon()
		}
	}

	function createRandomMagneticPolygon() {

		const sides = parseInt( random( 3, params.demo.maxSides ) )
		const min = params.strutJoints.length 
		const max = min * -1
		const x = random( min, max )
		const y = random( min, max )
		const z = random( min, max )
		const position = new BB.Vector3( x, y, z)
		const rotation = new BB.Vector3( x, y, z)
		const parentNode = createMagneticPolygon( sides, position, rotation )

		// parentNode.position.x = x
		// parentNode.position.y = y
		// parentNode.position.z = z

		// parentNode.rotation.x = x
		// parentNode.rotation.y = y
		// parentNode.rotation.z = z

		// parentNode.computeWorldMatrix(true)
	}

	function createRandomMagneticPolygons( amount ) {
		for (let i = 0; i < amount; i++) createRandomMagneticPolygon()
	} 

	function runRenderLoop() {
		scene.render()
	}

	function createPolygonMesh( vertexes ) {

		const name = 'poly' + inventory.meshPolygons.length
		let poly = new BB.PolygonMeshBuilder( name, vertexes, scene, earcut )
		poly = poly.build( null, 1 )
		return poly
	}

	function createMagneticPolygon( sides, position, rotation ) {

		const { strutJoints } = params
		const { length } = strutJoints
		if (!sides) sides = 3
		let x = length/-2
		let y = length/-2
		const z = 0
		const angle = 2 * Math.PI / sides 

		let magnets = []
		let struts = []
		let vertexes = []
		let crisscross = []

		const parentNode = new BABYLON.TransformNode( 'magneticPoly' + inventory.magneticPolygons.length )

		const filterGroup = inventory.magneticPolygons.length + 1

		for (let i = 0; i < sides; i++ ) {

			x = x + ( length * Math.cos(i * angle) )
			y = y + ( length * Math.sin(i * angle) )


			vertexes.push( new BB.Vector2(x,y) )
		}

		for ( const vert of vertexes ) {

			magnets.push( createMagnet( 
				vert.x + position.x,
				vert.y + position.y,
				z + position.z, 
				filterGroup, 
				parentNode 
			))
		}


		for (let i = 0; i < magnets.length; i++ ) {

			const p1 = i == 0 ? magnets[magnets.length-1] : magnets[i-1]
			const p2 = magnets[i]

			struts.push( createCylinderJoint( 
				p1, 
				p2, 
				'strutJoints', 
				filterGroup, 
				p1
			))
		}

		/* do CRISSCROSSING */

		if (params.crisscrossJoints.enabled) {
			for (let i = 0; i < magnets.length; i++) {
				for (let ii = 0; ii < magnets.length; ii++) {
					let prev = ii-1
					let next = ii+1
					if (prev < 0) prev = magnets.length - 1
					if (next >= magnets.length) next = 0
					if (i != prev && i != next && ii != i ) {

						const found = crisscross.find( joint => {
							return (( joint.p1 == i ) && ( joint.p2 == ii)) || (( joint.p2 == i ) && ( joint.p1 == ii)) 
						})

						if (!found) {
							crisscross.push( createCylinderJoint(
								magnets[i],
								magnets[ii],
								'crisscrossJoints',
								filterGroup,
								magnets[i]
							))
						}
					}
				}
			}
		}

		inventory.magneticPolygons.push( {
			magnets,
			struts,
			vertexes,
			crisscross,
			parentNode
		})

		return parentNode

	}

	function createMagnet( x, y, z, filterGroup, parent ) {

		const { sphereSize, magnetPhysics } = params

		const name = 'sphere' + (inventory.magnets.length + 1)
		const magnet = BB.MeshBuilder.CreateSphere( name, sphereSize, 
			scene)

		magnet.position.x = x
		magnet.position.y = y
		magnet.position.z = z

		magnet.physicsImpostor = new BB.PhysicsImpostor( 
			magnet,
			BB.PhysicsImpostor.SphereImpostor, 
			magnetPhysics,
			scene)

		if (magnetPhysics.linearDamping > 0) magnet.physicsImpostor.physicsBody.linearDamping = magnetPhysics.linearDamping
		if (magnetPhysics.angularDamping > 0) magnet.physicsImpostor.physicsBody.angularDamping = magnetPhysics.angularDamping

		if (parent) magnet.setParent( parent )
		inventory.magnets.push( magnet )
		return magnet
	}

	function createCylinderJoint( p1, p2, type, filterGroup, parent ) {

		let { jointType, rigid, length, diameter, physics } = params[type]


		/* create JOINT between p1 and p2 */

		const joint = new BB.PhysicsJoint(
			rigid ? BB.PhysicsJoint.LockJoint : BB.PhysicsJoint.DistanceJoint,
			{
				maxDistance: length
			})

		p1.physicsImpostor.addJoint(p2.physicsImpostor, joint)
		p2.physicsImpostor.addJoint(p1.physicsImpostor, joint)

		inventory[type].push( joint ) 


		/* create CYLINDER between p1 and p2 */

		const name = 'cylinder' + inventory[type].length


		joint.cylinder = BB.MeshBuilder.CreateCylinder( name, {
			height: length,
			diameterTop: diameter,
			diameterBottom: diameter
		}, scene)


		joint.cylinder.updatePosition = e => {
			joint.cylinder.p1 = p1
			joint.cylinder.p2 = p2
			joint.cylinder.position.x = p1.position.x
			joint.cylinder.position.y = p1.position.y
			joint.cylinder.position.z = p1.position.z
			joint.cylinder.lookAt( p2.position.clone(), 0, BB.Tools.ToRadians(90) )
			joint.cylinder.translate( new BB.Vector3(0,0,0), 10, BB.Space.LOCAL )
			joint.cylinder.translate(BABYLON.Axis.Y, length/2, BABYLON.Space.LOCAL)
		}


		joint.cylinder.updatePosition()

		if (parent) {
			joint.cylinder.setParent( parent )

		}


		/* add PHYSICS to CYLINDER */

		// joint.cylinder.physicsImpostor = new BB.PhysicsImpostor( 
		// 	joint.cylinder,
		// 	BB.PhysicsImpostor.BoxImpostor, 
		// 	physics,
		// 	scene)

		// // joint.cylinder.physicsImpostor.physicsBody.collisionFilterGroup = filterGroup
		// joint.cylinder.physicsImpostor.physicsBody.collisionFilterMask = filterGroup

		// console.log(filterGroup)

		/* show AXES on straws */

		if (params.demo.showAxes) {
			const ax = new BABYLON.AxesViewer(scene, 5)
			ax.xAxis.parent = joint.cylinder
			ax.yAxis.parent = joint.cylinder
			ax.zAxis.parent = joint.cylinder
		}


		return joint
	}

	function createRandomParticles( amount ) {

		for (let i = 0; i < amount; i++) {
			const spacing = params.strutJoints.length * 2
			const min = spacing * -1
			const max = spacing
			const x = random(min, max)
			const y = random(min, max)
			const z = random(min, max)
			createMagnet( x,y,z )
		}

	}


	function runMagnetImpulses() {

		const { amount, invert } = params.magnetImpulse
		if (amount > 0) {
			for ( const m1 of inventory.magnets ) {
				for ( const m2 of inventory.magnets ) {
					if (m2 === m1) continue

					/* grokked from:
					https://playground.babylonjs.com/#XFT6UU#8
					*/

					const distance = BB.Vector3.DistanceSquared(m1.position, m2.position)
					const charge = 1 / distance * amount
					const force = charge * (invert ? 1 : -1)
					const vector = m1.position.subtract(m2.position).normalize().scale(force)
					m1.applyImpulse(vector, m1.getAbsolutePosition())
				}
			}
		}

		if (!params.misc.updateJoints) return

		// REMOVE?

		for (const joint of [ ...inventory.strutJoints, ...inventory.crisscrossJoints ] ) {
			joint.cylinder.updatePosition()
		}
	}

	const onResizeWindow = e => engine.resize()


</script>
<svelte:window on:resize={onResizeWindow} on:keydown={onKeydown} />
<canvas 
style="z-index:-1"
	class="border w100pc h100pc fill"
	bind:this={canvas} />