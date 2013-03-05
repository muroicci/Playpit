
var TO_RADIAN = Math.PI / 180;
var TO_THETA = 180 / Math.PI;
var container;
var group;
var scene, camera, renderer;
var stat, trackball;
var boxSize = 10;
var grid = 12;
var boxGeometry, boxShape;
var boxNum = -0;
var world;

$(function() {

	if (!Detector.webgl) Detector.addGetWebGLMessage();

	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x669BF8, 10, 1000);

	//camera
	camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
	camera.position.set(0, 100, 400)
	scene.add(camera);

	cameraTarget = new THREE.Object3D();
	cameraTarget.position.y = 80;

	//renderer
	renderer = new THREE.WebGLRenderer({

	});
	renderer.autoClear = false;
	renderer.setSize(width, height);
	renderer.setClearColor( scene.fog.color, 1.0 );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFShadowMap;
	document.body.appendChild(renderer.domElement);

	//light
	var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
	mainLight.position.set(0, 800, 200);
	mainLight.lookAt(scene.position)
	scene.add(mainLight);

	var spotLight = new THREE.SpotLight(0xfffffff, 0.6, 0);
	spotLight.position.set( -300, 300, 300 );
	spotLight.lookAt(scene.position)
	spotLight.castShadow = true;
	spotLight.shadowCameraNear = 10;
	spotLight.shadowCameraFar = camera.far;
	spotLight.shadowCameraFov = 50;
	spotLight.shadowBias = 0.0001;
	spotLight.shadowDarkness = 0.3;
	spotLight.shadowMapWidth = 2048;
	spotLight.shadowMapHeight = 2048;
	scene.add(spotLight);

	var ambient = new THREE.AmbientLight(0x222222);
	scene.add(ambient);

	var sublight = new THREE.DirectionalLight(0xffffff, 0.55);
	sublight.position.set(0, -100, 0);
	sublight.castShadow = false;
	sublight.rotation.x = -Math.PI;
	scene.add(sublight);

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	container.appendChild(stats.domElement);

	//trackball
	trackball = new THREE.TrackballControls(camera, renderer.domElement);
	trackball.zoomSpeed = 0.5;
	trackball.minDistance = 200;
	trackball.maxDistance = 600;

	createScene();
	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);
	window.addEventListener('click', createBoxes, false);

	animate();

});



//load and parsing data: modified from Saqoosha's code "http://saqoo.sh/a/labs/perfume/2/"


function mouseMove(ev) {
	mousex = ev.clientX - window.innerWidth / 2;
	mousey = ev.clientY - window.innerHeight / 2;
}

function resize() {
	var stageWidth = window.innerWidth;
	var stageHeight = window.innerHeight;
	camera.aspect = stageWidth / stageHeight;
	renderer.setSize(stageWidth, stageHeight)
	camera.updateProjectionMatrix();
}

function createScene() {

	//world
	world = new CANNON.World();
	world.gravity.set(0,-60,0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;
 	world.quatNormalizeFast = true;
    world.quatNormalizeSkip = 8;
    world.defaultContactMaterial.contactEquationStiffness = 80000000;
    world.defaultContactMaterial.contactEquationRegularizationTime = 8;
	world.defaultContactMaterial.friction = 1;
	world.defaultContactMaterial.restitution = 0.4;

	//ground
	var floorGeometry = new THREE.PlaneGeometry(10000, 10000,1,1);
	var floor = new THREE.Mesh(floorGeometry, new THREE.MeshLambertMaterial({
		color:0x669BF8
	}
	));
	floor.rotation.x = -Math.PI/2
	floor.castShadow = true;
	floor.receiveShadow = true;
	scene.add(floor);
	var floorShape = new CANNON.Plane();
	var floorBody = new CANNON.RigidBody( 0, floorShape);
	floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),- Math.PI/2);

	world.add(floorBody);


	//cubes
	group = new THREE.Object3D();
	scene.add(group);
	boxGeometry = new THREE.CubeGeometry(boxSize,boxSize,boxSize, 1,1,1);
	boxShape = new CANNON.Box(new CANNON.Vec3(boxSize*0.5,boxSize*0.5,boxSize*0.5));


	//postprocessing
	//Vignette
	var effectVignette = new THREE.ShaderPass( THREE.VignetteShader );
	effectVignette.uniforms['offset'].value = 0.80;
	effectVignette.uniforms['darkness'].value=1.50;
	effectVignette.renderToScreen = true;

	//bloom
	var effectBloom = new THREE.BloomPass( 0.20 );
	
	//FXAA	
	var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
	//bleach
	var effectBleach = new THREE.ShaderPass( THREE.BleachBypassShader );

	var renderTargetParameter = {
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.LinearFilter, 
		format: THREE.RGBFormat, 
		stencilBuffer: false
	};
	var renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameter);

	var renderModel = new THREE.RenderPass( scene, camera );	
	composerScene = new THREE.EffectComposer( renderer, renderTarget );
	composerScene.addPass( renderModel );
	// composerScene.addPass( effectBloom );
	composerScene.addPass( effectBleach );
	composerScene.addPass( effectFXAA );
	composerScene.addPass( effectVignette );


	//gui
	gui = new DAT.GUI();
	// gui.add(world.defaultContactMaterial, "contactEquationStiffness", 0, 80000000, 100000);
	// gui.add(world.defaultContactMaterial, "contactEquationRegularizationTime", 0, 10, 1);
	gui.add(world.defaultContactMaterial, "friction", 0, 1, 0.01);
	gui.add(world.defaultContactMaterial, "restitution", 0, 1, 0.01);
	gui.add(this, "boxNum").listen();
	createBoxes();

}


function createBoxes(){

	for(var i=0; i<grid*grid; i++){
		if(Math.random()>0.5){

		var col = new THREE.Color();
		col.setRGB(Math.random(),Math.random(),Math.random());
		var mat = new THREE.MeshLambertMaterial({color:col});
		var mesh = new THREE.Mesh(boxGeometry, mat);
		mesh.useQuaternion = true;
		group.add(mesh);

		//physics
		var boxBody = new CANNON.RigidBody(100, boxShape );
		var vec = new CANNON.Vec3(
			i%grid*(boxSize+0.01), 
			Math.floor(i/grid)*(boxSize+0.01), 
			0);
		vec.x -= grid*boxSize/2;
		vec.y+=300;
		boxBody.position = vec;
		mesh.position = boxBody.position;
		mesh.quaternion = boxBody.quaternion;

		world.add(boxBody);

		boxNum++;
		if(boxNum > grid*grid*3){
			group.remove(group.children[0]);
			world.remove(world.bodies[1]);
		}
	}
		}

}


function animate() {

	setTimeout(function(){
		requestAnimationFrame(animate);
	}, 1000/60)

	trackball.update();
	//camera
	camera.lookAt(cameraTarget.position)

	if(!world.paused) {
		world.step(1/60);
	}

	render();
	stats.update();
}


function render() {
	// renderer.clear(false, true, false);
	// renderer.render(scene, camera);
	composerScene.render();
}
