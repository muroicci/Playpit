
var container;
var camera;
var cameraTarget;
var light;
var scene;
var renderer;
var group;
var mousex =0, mousey=0;

var world, bp;
var phys_bodies =[];
var phys_visuals =[];

var SHADOW_MAP_WIDTH = 1024*2;
var SHADOW_MAP_HEIGHT = 1024*2;

var effect;
// var isolation = 300;
// var resolution = 40;
var effectController;
var numBlobs = 60;

var stats;
var composer;


function init(){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	
	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene     = new THREE.Scene();
	scene.fog = new THREE.Fog( 0xffffff, 400, 1000);

	//group
	group = new THREE.Object3D();
	scene.add( group );

	//camera
	camera = new THREE.PerspectiveCamera( 40, width/height, 100, 10000 );
	camera.position.x = 0;
	camera.position.y = 400;
	camera.position.z = -400;

	cameraTarget = new THREE.Object3D();
	cameraTarget.position.y = 60;
	//camera.target = cameraTarget;

	scene.add(cameraTarget);
	scene.add(camera);

	//light
 	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(100.0,100.0,100);
	light.castShadow = true;
	scene.add(light);

	ambient = new THREE.AmbientLight(0x333333);
	scene.add(ambient);

	//renderer
	renderer = new THREE.WebGLRenderer( {clearColor:0xffffff, clearAlpha:1, alpha:false } );
	renderer.setSize( width, height );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapBias = 0.0039;
	renderer.shadowMapDarkness = 0.2;
	renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
	renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
	document.body.appendChild ( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.physicallyBasedShading = true;

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	container.appendChild(stats.domElement);

	//composer
	// renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
	// renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, renderTargetParameters );
	// effectFXAA = new THREE.ShaderPass( THREE.ShaderExtras['fxaa'] );

	// hblur = new THREE.ShaderPass( THREE.ShaderExtras[ "horizontalTiltShift" ] );
	// vblur = new THREE.ShaderPass( THREE.ShaderExtras[ "verticalTiltShift" ] );

	// var bluriness = 8;
	// hblur.uniforms['h'].value = bluriness/width;
	// vblur.uniforms['v'].value = bluriness/height;
	// hblur.uniforms['r'].value = vblur.uniforms['r'].value = 0.5;

	// effectFXAA.uniforms['resolution'].value.set(1/width, 1/height);

	// composer = new THREE.EffectComposer( renderer, renderTarget );
	// var renderModel = new THREE.RenderPass( scene, camera );
	// composer.addPass( renderModel );
	// composer.addPass( effectFXAA );
	// composer.addPass( hblur );
	// composer.addPass( vblur );


	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);
	document.addEventListener('click', createHeavyObj)

	createScene();
	createHeavyObj();
	animate();

}



function mouseMove(ev){
	mousex = ev.clientX - window.innerWidth/2;
	mousey = ev.clientY - window.innerHeight/2;
}

function resize(){
	var stageWidth  = window.innerWidth;
	var stageHeight = window.innerHeight;
	camera.aspect   = stageWidth/stageHeight;
	renderer.setSize(stageWidth, stageHeight)
//	camera.updateProjectionMatrix();
}

function createScene(){

	world                = new CANNON.World();
	world.gravity( new CANNON.Vec3(0,-250,0));
	bp                   = new CANNON.NaiveBroadphase();
	world.broadphase(bp);
	world.iterations(2);
	
	//ground
	var geometry         = new THREE.PlaneGeometry(10000,10000);
	var planeMaterial    = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 1, perPixel: true } );
	var ground           = new THREE.Mesh( geometry, planeMaterial );
	ground.receiveShadow = true;
	group.add( ground );
	
	var groundShape      = new CANNON.Plane( new CANNON.Vec3(0,1,0));
	var groundBody       = new CANNON.RigidBody( 0, groundShape );
	world.add(groundBody);
	
	// plane -x
	var planeShapeXmin   = new CANNON.Plane(new CANNON.Vec3(0,0,1));
	var planeXmin        = new CANNON.RigidBody(0, planeShapeXmin);
	planeXmin.setPosition(0,0,-50);
	world.add(planeXmin);
	
	// Plane +x
	var planeShapeXmax   = new CANNON.Plane(new CANNON.Vec3(0,0,-1));
	var planeXmax        = new CANNON.RigidBody(0, planeShapeXmax);
	planeXmax.setPosition(0,0,50);
	world.add(planeXmax);
	
	// Plane -z
	var planeShapeYmin   = new CANNON.Plane(new CANNON.Vec3(1,0,0));
	var planeYmin        = new CANNON.RigidBody(0, planeShapeYmin);
	planeYmin.setPosition(-50,0,0);
	world.add(planeYmin);
	
	// Plane +z
	var planeShapeYmax   = new CANNON.Plane(new CANNON.Vec3(-1,0,0));
	var planeYmax        = new CANNON.RigidBody(0, planeShapeYmax);
	planeYmax.setPosition(50,0,0);
	world.add(planeYmax);
	

	//sphere
//	var sphereMaterial = new THREE.MeshLambertMaterial({color:0xffffff});
	var sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 1, perPixel: true } );
	for (var i = 0; i < numBlobs; i++) {

		var sphereR = 2//Math.random()*6+3;
		var sphereGeometry = new THREE.SphereGeometry(sphereR,16,16);
		var sphereShape = new CANNON.Sphere(sphereR);

		var sphereMesh = new THREE.Mesh( sphereGeometry, sphereMaterial);
		sphereMesh.castShadow = true;
		sphereMesh.receiveShadow = true;
		//group.add( sphereMesh );
		sphereMesh.useQuaternion = true;

		//Physics
		var randX = (Math.random()*2-1)*10;
		var randZ = (Math.random()*2-1)*10;
		var sphereBody = new CANNON.RigidBody(0.25,sphereShape);

		//start position
		var pos = new CANNON.Vec3( 0, i*4+100, 0);
		sphereBody.setPosition(pos.x + randX, pos.y, pos.z+randZ);

		phys_bodies.push(sphereBody);
		phys_visuals.push(sphereMesh);  
		world.add(sphereBody);

	}

	setupGui();

	//Marching Cubes
	effect = new THREE.MarchingCubes( effectController.resolution, sphereMaterial );
	effect.castShadow = true;
	effect.receiveShadow = true;
	effect.isolation = effectController.isolation;
	effect.position.set(0,200,0);
	effect.scale.set(200,200,200);
	scene.add(effect);



}


function setupGui(){

	gui = new DAT.GUI();

	effectController = {
		isolation: 720,
		resolution: 32,
		subtract: 32,
		strength: 4.3
	}

	var is = gui.add(effectController, "isolation", 1, 1000, 1);
	var rs = gui.add(effectController, "resolution", 1, 100, 1);
	var sb = gui.add(effectController, "subtract", 1, 100, 1);
	var st = gui.add(effectController, "strength", 1, 10, 0.1);

}



// var compoundShape;
var heavyObjBodies =[];
var heavyObjMeshes = [];

function createHeavyObj(){

	if(heavyObjBodies.length>4){
		group.remove(heavyObjMeshes.shift());
		world.remove(heavyObjBodies.shift());
	}

	var r = 15+Math.random()*20;
	var sphereShape = new CANNON.Sphere(r);
	var heavyObjBody = new CANNON.RigidBody(50, sphereShape);
	heavyObjBody.setPosition(50*(2*Math.random()-1),r/2+600,50*(2*Math.random()-1))
	world.add(heavyObjBody);
	heavyObjBodies.push(heavyObjBody);

	//visual
	var sphereGeometry = new THREE.SphereGeometry( r, 16, 16);
	//var sphereMaterial = new THREE.MeshLambertMaterial({color:0xff8d28});
	var sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xff8d28, specular: 0x111111, shininess: 1, perPixel: true } );
	var heavyObjMesh = new THREE.Mesh( sphereGeometry, sphereMaterial );
	heavyObjMesh.castShadow = true;
	heavyObjMesh.receiveShadow = true;
	heavyObjMesh.useQuaternion = true;
	group.add(heavyObjMesh);
	heavyObjMeshes.push(heavyObjMesh);
}

function animate(){
	requestAnimationFrame(animate);
	update();
	render();
}

function updateCubes(){

	effect.reset();

	if (effectController.isolation!=effect.isolation) {
		effect.isolation = effectController.isolation;
	};

	if(effect.resolution!=effectController.resolution){
		effect.init (effectController.resolution);
	}

	var subtract = effectController.subtract;
	var strength = effectController.strength / ( ( Math.sqrt( numBlobs ) - 1 ) / 4 + 1 );
	var l = phys_bodies.length - 1;
	for (var i = l; i >= 0; i--) {
		var pos = phys_bodies[i].getPosition(phys_visuals[i].position);
		var ort = phys_bodies[i].getOrientation(phys_visuals[i].quaternion);
		effect.addBall(pos.x/200+0.5, (pos.y+0)/200, pos.z/200+0.5, strength, subtract);
		//effect.addBall(1., 10, 10, strength, subtract);
	}
	effect.addPlaneY( 2, effectController.subtract);

		// var l = phys_bodies.length - 1;
		// for (var i = l; i >= 0; i--) {
		// 	if(phys_bodies[i].getPosition().y<-300) phys_bodies[i].setPosition(0,300,0);
		// 	phys_bodies[i].getPosition(phys_visuals[i].position);
		// 	phys_bodies[i].getOrientation(phys_visuals[i].quaternion);
		// };

}


var cr = 0;

function update(){

	//camera
	cr += mousex*0.000025;
	camera.position.y += ( -mousey/5 + 100 - camera.position.y)*0.02;
	camera.position.x = 300*Math.cos(cr);
	camera.position.z = 300*Math.sin(cr);
	camera.lookAt(cameraTarget.position);
	
	//Physics
	if (!world.paused) {
		world.step(1.0/60.0);

		updateCubes();


		//heavyObj
		for (var i = heavyObjBodies.length - 1; i >= 0; i--) {
			heavyObjBodies[i].getPosition( heavyObjMeshes[i].position );
			heavyObjBodies[i].getOrientation( heavyObjMeshes[i].quaternion );
		};


	};

}

var clock = new THREE.Clock();

function render(){
	renderer.clear();
	renderer.render( scene, camera );
	// var delta = clock.getDelta();
	// composer.render(delta);
	stats.update();
}






