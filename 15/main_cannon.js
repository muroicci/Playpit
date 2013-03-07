
var TO_RADIAN = Math.PI / 180;
var TO_THETA = 180 / Math.PI;
var container;
var cubes = [];
var bodies = [];
var scene, camera, renderer;
var stat, trackball;
var boxSize = 7;
var grid = 7;
var boxGeometry, boxShape;
var world;

var cubeData = [];

var img_url = [
	"images/mario_jump.png",
	"images/megaman.png",
	"images/invader.png",
	"images/mushroom.png"
];
var loadCompNum = 0;

$(function() {

	if (!Detector.webgl) Detector.addGetWebGLMessage();
	loadImage(0);

});

function init(){
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
	var mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
	mainLight.position.set(-0, 400, 200);
	mainLight.lookAt(scene.position);
	mainLight.castShadow = true;
	mainLight.shadowCameraNear = 10;
	mainLight.shadowCameraFar = camera.far;
	mainLight.shadowCameraFov = 60;
	// mainLight.shadowBias = 0.0001;
	mainLight.shadowDarkness = 0.2;
	mainLight.shadowMapWidth = 1024;
	mainLight.shadowMapHeight = 1024;
	scene.add(mainLight);

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

}


function loadImage(n){
	var img = document.createElement('img');
	img.addEventListener('load', loadComplete, false);
	img.src = img_url[n];
}

function loadComplete (evt) {
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext("2d");
	var w = canvas.width = evt.target.width;
	var h = canvas.height = evt.target.height;
	ctx.drawImage(evt.target, 0, 0);
	var data = ctx.getImageData(0, 0, w, h).data;
	var arr = [];
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			var n=x*4+y*w*4;
			var obj = {
				r:data[n],
				g:data[n+1],
				b:data[n+2],
				a:data[n+3]
			}
			arr.push(obj)
		}
	}
	cubeData.push({w:w, h:h, data:arr});
	loadCompNum++;
	if(loadCompNum>=img_url.length){
		init();
	}else{
		loadImage(loadCompNum);
	}
}


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
	world.gravity.set(0,-100,0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 3;
 	world.quatNormalizeFast = true;
    world.quatNormalizeSkip = 4;
    world.defaultContactMaterial.contactEquationStiffness = 10000000;
    world.defaultContactMaterial.contactEquationRegularizationTime = 1;
	world.defaultContactMaterial.friction = 0.5;
	world.defaultContactMaterial.restitution = 0.8;

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
	gui.add(bodies, "length").listen();
	createBoxes();

}


function createBoxes(){

	var rnd = Math.floor(cubeData.length*Math.random());
	var cubeInfo = cubeData[rnd];
	var w = cubeInfo.w, h = cubeInfo.h;

	// for(var i=0; i<grid*grid; i++){
	for(var i=0; i<cubeInfo.data.length; i++){
		var info = cubeInfo.data[i];
		if(info.a>0){
			var col = new THREE.Color();
			col.setRGB(info.r/255, info.g/255, info.b/255);
			// col.setRGB(Math.random(),Math.random(),Math.random());
			var mat = new THREE.MeshLambertMaterial({color:col});
			var mesh = new THREE.Mesh(boxGeometry, mat);
			mesh.useQuaternion = true;
			mesh.castShadow = mesh.receiveShadow = true;
			scene.add(mesh);
			cubes.push(mesh);

			//physics
			var boxBody = new CANNON.RigidBody(1000, boxShape );
			var vec = new CANNON.Vec3(
				i%w*(boxSize+0.001), 
				-Math.floor(i/w)*(boxSize+0.001), 
				0);
			vec.x -= w*boxSize/2;
			vec.y+=500;
			boxBody.position = vec;
			bodies.push(boxBody);
			world.add(boxBody);

			// if(bodies.length > grid*grid*2){
			// 	scene.remove(cubes[0]);
			// 	world.remove(bodies[0]);
			// 	cubes.splice(0,1);
			// 	bodies.splice(0,1);
			// }
		}
	}
}


function animate() {

	setTimeout(function(){
		requestAnimationFrame(animate);
	}, 1000/60);

	trackball.update();
	//camera
	camera.lookAt(cameraTarget.position)
	//world
	if(!world.paused) {
		world.step(1/60);
	}
	//cubes
	var i=0;
	while(bodies[i]){
	// for (var i = 0, l=bodies.length; i < l; i++) {
		var body = bodies[i], cube = cubes[i];
		// if(i==0) console.log(body.position.norm())
		if(body.position.norm()>200 && body.position.y<100){
			// console.log(cubes.splice(i,1));
			scene.remove(cube);
			world.remove(body);
			cubes.splice(i,1);
			bodies.splice(i,1);

		}else{
			body.position.copy(cube.position);
			body.quaternion.copy(cube.quaternion);
			i++;
		}
	};


	render();
	stats.update();
}


function render() {
	// renderer.clear(false, true, false);
	// renderer.render(scene, camera);
	composerScene.render();
}
