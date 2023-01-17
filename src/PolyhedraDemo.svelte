<script>
/*
	Adapted from: "tutorials by example", by Lee Stemkoski, July 2013
 */

	import { onMount } from 'svelte'

	let ALL_LENGTHS = []
	let BACKGROUND_COLOR = 0x0f0011
	BACKGROUND_COLOR = 0xffffff

	let container, scene, camera, renderer, controls
	let mesh, faces, interior
	let parameters, polyhedronMesh, gui, categoryFolders, inited, canvas

	onMount( e => {
		init()
		animate()
	})

	let numbers = {
		length: 30,
		radius: 1,
		opacity: 0.75,
		rotate: 0.1
	}

	let steps = {
		length: 1,
		radius: 0.1,
		opacity: 0.05
	}


	let booleans = {
		material: true,
		points: true,
		faces: false
	}

	let config = {
		radial_segments: 24,
		height_segments: 1
	}

	let SHAPES = {}

	let CURRENT = { ...POLYHEDRA.Tetrahedron, key: 'Tetrahedron' }

	let timeout
	$: ((_booleans,_numbers) => {
		if (!inited) return
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout( reset, 100 )
	})( booleans, numbers )

	function init() {

		scene = new THREE.Scene()

		const width = canvas.offsetWidth
		const height = canvas.offsetHeight
		let VIEW_ANGLE = 45, ASPECT = width / height, NEAR = 0.1, FAR = 20000

		camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR)
		scene.add(camera)
		camera.position.set(0,150,400)
		camera.lookAt(scene.position)  

		renderer = Detector.webgl ? new THREE.WebGLRenderer( {antialias:true} ) : new THREE.CanvasRenderer() 
		renderer.setSize(width, height)
		container = document.getElementById( 'threejs' )
		container.appendChild( renderer.domElement )

		THREEx.WindowResize(renderer, camera)

		controls = new THREE.TrackballControls( camera, renderer.domElement )
		controls.noPan = true

		let light = new THREE.PointLight(0xffffff)
		light.position = camera.position
		scene.add(light)

		let skyBoxGeometry = new THREE.CubeGeometry( 8000, 8000, 8000 )
		let skyBoxMaterial = new THREE.MeshBasicMaterial( { color: BACKGROUND_COLOR, side: THREE.BackSide } )
		let skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial )
		scene.add(skyBox)
		
		parameters = { transparent: false }
		polyhedronMesh = new THREE.Object3D() 
		scene.add(polyhedronMesh)

		SHAPES = {}

		for (let key in POLYHEDRA) {
			let category = POLYHEDRA?.[key]?.category?.[0]
			if ( POLYHEDRA[key].hasOwnProperty("category") ) {
				if (!SHAPES[category]) SHAPES[category] = {}
			}
			
			SHAPES[category][key] = { ...POLYHEDRA[key], key: key }
		}
		inited = true
		reset()
	}

	function reset() {
		displayPolyhedron( CURRENT )
	}

	function onPolyhedraSelect( polyhedra ) {

		CURRENT = polyhedra
		reset()
	}


	function displayPolyhedron(data) {
		const r = polyhedronMesh.rotation.y
		scene.remove(polyhedronMesh)
		polyhedronMesh = polyhedronDataToMesh(data)
		polyhedronMesh.rotation.y = r
		scene.add(polyhedronMesh)
	}

	function polyhedronDataToMesh(data) {
		let polyhedron = new THREE.Object3D()
		
		// convert vertex data to THREE.js vectors

		let vertex = [] 
		for (let i = 0; i < data.vertex.length; i++)
			vertex.push( new THREE.Vector3( data.vertex[i][0], data.vertex[i][1], data.vertex[i][2] ).multiplyScalar(100) )



		if (true) {
			
			// convert face data to a single (triangulated) geometry
			let faceMaterial = new THREE.MeshBasicMaterial( { 
				color: 0xffffff, 
				vertexColors: THREE.FaceColors, 
				side: THREE.FrontSide, 
				transparent: true, 
				opacity: numbers.opacity
			} )
			let faceColors = 
			{
					3: new THREE.Color( 0xff6600 ),
					4: new THREE.Color( 0x00cc00 ),
					5: new THREE.Color( 0x0000cc ),
					6: new THREE.Color( 0xcccc00 ),
					7: new THREE.Color( 0x999999 ),
					8: new THREE.Color( 0x990099 ),
					9: new THREE.Color( 0xcc0000 ),
					10: new THREE.Color( 0x6666ff )
			}

			let geometry = new THREE.Geometry()
			geometry.vertices = vertex

			let rigidGeo = new THREE.Geometry()
			rigidGeo.vertices = vertex
			let faceIndex = 0
			for (let faceNum = 0; faceNum < data.face.length; faceNum++) {

					const face = data.face[faceNum]
					const visible = face.length > 3

					for (let i = 0; i < face.length - 2; i++) {
						geometry.faces[faceIndex] = new THREE.Face3( face[0], face[i+1], face[i+2] )
						geometry.faces[faceIndex].color = faceColors[face.length]

						rigidGeo.faces[faceIndex] = new THREE.Face3( face[0], face[i+1], face[i+2] )

						faceIndex++
					}
			}
			console.log(faceIndex, vertex.length)
			
			let interiorMaterial = new THREE.MeshBasicMaterial( { 
				color: 0xffffff, 
				vertexColors: THREE.FaceColors, 
				side: THREE.BackSide 
			} )
			
			geometry.computeFaceNormals()
			geometry.computeVertexNormals()

			faces = new THREE.Mesh(geometry, faceMaterial)
			interior = new THREE.Mesh(geometry, interiorMaterial)

			faces.scale.multiplyScalar(1.01)
			interior.scale.multiplyScalar(0.99)

			

			if (booleans.faces) {
				polyhedron.add( faces )
			}

			
		}

		if (true ) {

			const WIREFRAME = false
			ALL_LENGTHS = []


			let edgeMaterial = new THREE.MeshLambertMaterial( {
					color: 0xFFFFFF,
					map: booleans.material ? new THREE.ImageUtils.loadTexture( "/stemkoski/Three.js/images/rock-512.jpg") : null,
					opacity: 1
			} )
			let edgeAmalgam = new THREE.Geometry()
			for (let i = 0; i < data.edge.length; i++)
			{
				let index0 = data.edge[i][0]
				let index1 = data.edge[i][1]
				let eMesh = cylinderMesh( vertex[index0], vertex[index1], edgeMaterial )
				THREE.GeometryUtils.merge( edgeAmalgam, eMesh )
			}
			let edgeMesh = new THREE.Mesh( edgeAmalgam, edgeMaterial )
			polyhedron.add( edgeMesh )
			

		}


		if (booleans.points) {

			let vertexGeometry = new THREE.SphereGeometry( strutRadius * 1, 32, 32 )
			let vertexSingleMesh = new THREE.Mesh( vertexGeometry )

			let vertexMaterial = new THREE.MeshLambertMaterial( { color: 0x00FFFF } )
			let vertexAmalgam = new THREE.Geometry()
			for (let i = 0; i < data.vertex.length; i++)
			{
				let vMesh = vertexSingleMesh.clone()
				vMesh.position = vertex[i]
				THREE.GeometryUtils.merge( vertexAmalgam, vMesh )
			}
			let vertexMesh = new THREE.Mesh( vertexAmalgam, vertexMaterial )
			polyhedron.add( vertexMesh )
		}



		return polyhedron
	}


	let strutLength, strutRadius

	function cylinderMesh(point1, point2, material) {

		let direction = new THREE.Vector3().subVectors(point2, point1)
		let arrow = new THREE.ArrowHelper(direction.clone().normalize(), point1)
		let rotation = new THREE.Vector3().setEulerFromQuaternion(arrow.quaternion)


		strutLength = parseInt( direction.length() )
		strutRadius = (strutLength/numbers.length) * numbers.radius

		strutLength -= strutRadius * 4


		if (ALL_LENGTHS.indexOf( strutLength ) == -1) ALL_LENGTHS.push( strutLength )

		let edgeGeometry = new THREE.CylinderGeometry( 
			strutRadius, 
			strutRadius, 
			strutLength, 
			config.radial_segments, 
			config.height_segments,
			false, // open
		)

		let edge = new THREE.Mesh(edgeGeometry, material) 
		edge.position = new THREE.Vector3().addVectors(point1, direction.multiplyScalar(0.5))
		edge.rotation = rotation

		return edge
	}

	function animate() {
		requestAnimationFrame( animate )
		renderer.render( scene, camera )
		// polyhedronMesh.rotation.x += numbers.rotate / 100
		polyhedronMesh.rotation.y += numbers.rotate / 100
		// polyhedronMesh.rotation.z += numbers.rotate / 100
		controls.update()
	}

	let hideInterface = false
	function onKeydown(e) {
		console.log(e, e.key)
		if (e.key == 'i') hideInterface = !hideInterface
	}

</script>

<svelte:window on:keydown={onKeydown} />

<div 
	style="background:white"
	class="flex row cgrow w100pc light9 bg fill">
	<div 
		class="grow rel overflow-hidden fill"
		style="height:100vh;width:100vw;"
		bind:this={canvas}
		id="threejs">
		<div 
			class="fixed b0 l0 column flex p0-5 cpb0-5"
			class:none={hideInterface}>
			<span class="bolder">
				<span class="f3">πολύεδρον</span>
			</span>
			<span>Experiments with Polyhedra</span>
			<span>BetterFactory, January 2023</span>
			<!-- <a href="mailto:autr.dev@gmail.com">Gilbert Sinnott</a> -->
		</div>
		<div class="fixed t0 l0 column flex p0-5 cpb0-5">
			<span class="bolder">
				<span class="f2">{CURRENT.name}</span>
			</span>
			<span>
				Struts:
				<span class="color green5">{CURRENT.edge.length}</span>
			</span>
			<span>
				Faces: 
				<span class="color green5">{CURRENT.face.length}</span>
			</span>
			<span>
				Connectors: 
				<span class="color green5">{CURRENT.vertex.length}</span>
			</span>

			{#each Object.entries(numbers) as [key,val]}

				<span>
					<span class="capitalize">{key}:</span>
					<input 
						type="number" 
						class="maxw4em purple5 color"
						step={steps[key]}
						bind:value={numbers[key]} />
				</span>

			{/each}


			{#each Object.entries(booleans) as [key,val]}

				<span>
					<span class="capitalize">{key}:</span>
					<span 
						class="border inline-block pointer w1em h1em rel t0-2 radius1em bg"
						on:click={ e => { booleans[key] = !booleans[key] }}
						class:purple5={booleans[key]} />
				</span>
			{/each}
		</div>
	</div>

	<aside
		class="cptb0-5 cplr0-5 dark6 color br overflow-auto h100vh maxw17em fixed t0 r0"
		class:none={hideInterface}>
		{#each Object.entries(SHAPES) as [category,shapes]}
			<div class="bold">
				{category}
			</div>
			{#each Object.entries(shapes) as [key,polyhedra]}
				<div 
					on:click={e => onPolyhedraSelect(polyhedra)}
					class="pointer"
					class:bolder={CURRENT.key == key}>
					{key}
				</div>
			{/each}
		{/each}
	</aside>

</div>
