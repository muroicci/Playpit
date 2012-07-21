'use strict'


Physijs.scripts.worker = '/common/js/physics/physijs_worker.js';
Physijs.scripts.ammo = '/common/js/physics/ammo.js';

var initScene, render, renderer, scene, camera, box;
	
	initScene = function() {
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );
		
		scene = new Physijs.Scene;
		
		camera = new THREE.PerspectiveCamera(
			35,
			window.innerWidth / window.innerHeight,
			1,
			1000
		);
		camera.position.set( 60, 50, 60 );
		camera.lookAt( scene.position );
		scene.add( camera );
		
		// Box
		box = new Physijs.BoxMesh(
			new THREE.CubeGeometry( 5, 5, 5 ),
			new THREE.MeshBasicMaterial({ color: 0x888888 })
		);
		scene.add( box );
		
		requestAnimationFrame( render );
	};
	
	render = function() {
		scene.simulate(); // run physics
		renderer.render( scene, camera); // render the scene
		requestAnimationFrame( render );
	};
	
	window.onload = initScene;


// // 'use strict';
// Physijs.scripts.worker = '/common/js/physics/physijs_worker.js';
// Physijs.scripts.ammo = '/common/js/physics/ammo.js';

// var gui;

// var container;
// var camera;
// var cameraTarget;
// var light;
// var scene;
// var renderer;
// var group;
// var mousex =0, mousey=0;

// var world, bp;
// var phys_bodies =[];
// var phys_visuals =[];

// var SHADOW_MAP_WIDTH = 1024*2;
// var SHADOW_MAP_HEIGHT = 1024*2;

// var effect;
// var numBlobs = 60;
// var sphereR = 10//Math.random()*6+3;

// var stats;
// var composer;

// var groundMat;
// var phySpehreMat;
// var phyContactMat;

// var showBall = true;
// var showBlob = true;

// var blobAlpha = 0.9;
// var sphereMaterial = new THREE.MeshPhongMaterial( { 
// 	color: 0x000000, 
// 	specular: 0xffffff, 
// 	blendingMode:THREE.AdditiveBlending,
// 	shininess: 255
// } );
// var sphereGeometry = new THREE.SphereGeometry(sphereR,8,8);

// var areaRange = 200;
// var sphereMass = 1;

// var cameraDistance = 1000;

// var	effectController = {
// 		isolation: 270,
// 		resolution: 25,
// 		subtract: 50,
// 		strength: 5.0
// 	}


// $(document).ready(function(){
// 	init();
// })

// function init(){

// 	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	
// 	//container
// 	container = document.createElement('div');
// 	document.body.appendChild(container);

// 	var width = window.innerWidth;
// 	var height = window.innerHeight;

// 	//scene
// 	// scene     = new THREE.Scene();
// 	scene = new Physijs.Scene();
// 	// scene.fog = new THREE.Fog( 0xffffff, cameraDistance, 1000);

// 	//group
// 	group = new THREE.Object3D();
// 	scene.add( group );

// 	//camera
// 	camera = new THREE.PerspectiveCamera( 40, width/height, 100, 10000 );
// 	camera.position.x = 0;
// 	camera.position.y = 400;
// 	camera.position.z = -400;
// 	camera.matrixAutoUpdate = false;

// 	cameraTarget = new THREE.Object3D();
// 	cameraTarget.position.y = 60;

// 	scene.add(cameraTarget);
// 	scene.add(camera);

// 	//renderer
// 	renderer = new THREE.WebGLRenderer(  );
// 	renderer.setSize( width, height );
// 	renderer.shadowMapEnabled = true;
// 	renderer.shadowMapSoft = true;
// 	renderer.shadowMapBias = 0.0039;
// 	renderer.shadowMapDarkness = 0.2;
// 	renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
// 	renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
// 	document.body.appendChild ( renderer.domElement );

// 	renderer.gammaInput = true;
// 	renderer.gammaOutput = true;
// 	renderer.physicallyBasedShading = true;

// 	//composer
// 	// renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
// 	// renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, renderTargetParameters );
// 	// effectFXAA = new THREE.ShaderPass( THREE.ShaderExtras['fxaa'] );

// 	// hblur = new THREE.ShaderPass( THREE.ShaderExtras[ "horizontalTiltShift" ] );
// 	// vblur = new THREE.ShaderPass( THREE.ShaderExtras[ "verticalTiltShift" ] );

// 	// var bluriness = 8;
// 	// hblur.uniforms['h'].value = bluriness/width;
// 	// vblur.uniforms['v'].value = bluriness/height;
// 	// hblur.uniforms['r'].value = vblur.uniforms['r'].value = 0.5;

// 	// effectFXAA.uniforms['resolution'].value.set(1/width, 1/height);

// 	// composer = new THREE.EffectComposer( renderer, renderTarget );
// 	// var renderModel = new THREE.RenderPass( scene, camera );
// 	// composer.addPass( renderModel );
// 	// composer.addPass( effectFXAA );
// 	// composer.addPass( hblur );
// 	// composer.addPass( vblur );


// 	//event
// 	document.addEventListener('mousemove', mouseMove);
// 	window.addEventListener('resize', resize, false);
// 	document.addEventListener('click', createDrop)

// 	createScene();
// 	// createDrop();
// 	animate();

// }



// function mouseMove(ev){
// 	mousex = ev.clientX - window.innerWidth/2;
// 	mousey = ev.clientY - window.innerHeight/2;
// }


// function resize(){
// 	var stageWidth  = window.innerWidth;
// 	var stageHeight = window.innerHeight;
// 	camera.aspect   = stageWidth/stageHeight;
// 	camera.updateProjectionMatrix();
// 	renderer.setSize(stageWidth, stageHeight)
// }

// function createScene(){

// 	//light
//  	light = new THREE.DirectionalLight(0x333333);
// 	light.position.set(100.0,100.0,100);
// 	light.castShadow = true;
// 	scene.add(light);

// 	ambient = new THREE.AmbientLight(0x333333);
// 	scene.add(ambient);

// 	//ground
// 	var geometry         = new THREE.PlaneGeometry(10000,10000);
// 	var planeMaterial    = new THREE.MeshPhongMaterial( { color: 0xcccccc, specular: 0x111111, shininess: 0, perPixel: true } );
// 	var ground           = new THREE.Mesh( geometry, planeMaterial );
// 	ground.receiveShadow = true;
// 	ground.rotation.x = -Math.PI/2;
// 	group.add( ground );
	

// 	for (var i = 0; i < numBlobs; i++) {

// 		var blob = createBlob();

// 		//start position
// 		blob.position.set(sphereR*(Math.random()*2-1), i*sphereR*2+300, sphereR*(Math.random()*2-1));

// 		phys_visuals.push(blob);

// 		if(showBall) group.add( blob );

// 	}

// 	//Marching Cubes
// 	var blobMaterial = new THREE.MeshPhongMaterial({
// 			color:0xffff00,
// 			specular:0xffffff,
// 			shininess:255,
// 			perPixel:true,
// 			opacity:blobAlpha
// 		})

// 	effect = new THREE.MarchingCubes( effectController.resolution, blobMaterial );
// 	effect.castShadow = true;
// 	effect.receiveShadow = true;
// 	effect.isolation = effectController.isolation;
// 	effect.position.set(0,2*areaRange,0);
// 	effect.scale.set(2*areaRange,2*areaRange,2*areaRange);
// 	scene.add(effect);

// 	setupGui();

// }


// function createBlob(){
// 	var sphereMesh = new Physijs.SphereMesh(sphereGeometry, sphereMaterial);
// 	sphereMesh.castShadow = true;
// 	sphereMesh.receiveShadow = true;
// 	sphereMesh.useQuaternion = true;
// 	return sphereMesh;
// }





// function createDrop(){


// 	//add balls
// 	for( var j=0; j<20; j++){

// 		var blob = createBlob();

// 		//start position
// 		blob.position.set(sphereR*(Math.random()*2-1), j*sphereR*4+300, sphereR*(Math.random()*2-1));

// 		phys_visuals.push(blob);

// 		if(showBall) group.add( blob );

// 	}

// 	if(phys_visuals.length>120){
// 		for(var i=0; i<20; i++){
// 			group.remove(phys_visuals[i]);
// 			phys_visuals.splice(i,1);
// 		}
// 	}


// }

// function animate(){
// 	requestAnimationFrame(animate);
// 	scene.simulate();
// 	update();
// 	render();
// }

// function updateCubes(){

// 	effect.reset();

// 	if (effectController.isolation!=effect.isolation) {
// 		effect.isolation = effectController.isolation;
// 	};

// 	if(effect.resolution!=effectController.resolution){
// 		effect.init (effectController.resolution);
// 	}

// 	var subtract = effectController.subtract;
// 	var numBlobs = phys_visuals.length;
// 	var strength = effectController.strength / ( ( Math.sqrt( numBlobs ) - 1 ) / 4 + 1 );

// 	var l = phys_visuals.length - 1;
// 	for (var i = l; i >= 0; i--) {
// 		var pos = phys_visuals[i].position;
// 		effect.addBall(pos.x/400+0.5, (pos.y+0)/400, pos.z/400+0.5, strength, subtract);
// 	}
// 	effect.addPlaneY( 2, effectController.subtract);


// }


// var cr = 0;

// function update(){


// 	//camera
// 	cr += mousex*0.000025;
// 	camera.position.y += ( -mousey/2 + 150 - camera.position.y)*0.02;
// 	camera.position.x = cameraDistance*Math.cos(cr);
// 	camera.position.z = cameraDistance*Math.sin(cr);
// 	camera.lookAt(cameraTarget.position);
// 	camera.updateMatrix();
	

// 	if(showBlob) {updateCubes()} else {effect.reset();}


// 	//find outbound balls
// 	var i= 0;
// 	var range = 2*areaRange;
// 	for (var i = phys_visuals.length - 1; i >= 0; i--) {
// 		var p = phys_visuals[i].position;
// 		if( p.x>range || p.x<-range || p.z>range || p.z<-range ){
// 			group.remove(phys_visuals[i]);
// 			phys_visuals.splice(i,1);
// 		}
// 	};


// }

// var clock = new THREE.Clock();

// function render(){
// 	renderer.clear();
// 	renderer.render( scene, camera );
// 	// var delta = clock.getDelta();
// 	// composer.render(delta);
// 	stats.update();
// }


// function setupGui(){

// 	//stats
// 	stats = new Stats();
// 	stats.domElement.style.position = 'absolute';
// 	container.appendChild(stats.domElement);

// 	//gui
// 	gui = new dat.GUI();

// 	gui.add(effectController, "isolation", 1, 1000, 1);
// 	gui.add(effectController, "resolution", 1, 50, 1);
// 	gui.add(effectController, "subtract", 1, 100, 1);
// 	gui.add(effectController, "strength", 1, 10, 0.1);

// 	gui.add( this, 'showBlob', showBlob).onChange(function(value){
// 	});

// 	gui.add( this, 'showBall', showBall).onChange(function(value){
// 		for(var e in phys_visuals){
// 			if(value){
// 				group.add(phys_visuals[e]);
// 			}else{
// 				group.remove(phys_visuals[e]);
// 			}
// 		}

// 	});

// 	gui.add( this, 'blobAlpha', 0, 1).onChange(function(value){
// 		effect.material.opacity = value;
// 	})

// 	gui.add(this, 'cameraDistance', 100, 2000)

// 	gui.add( phys_visuals, 'length').listen();

// }





