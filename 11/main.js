
'use strict';
Physijs.scripts.worker = '/js/physics/physijs_worker.js';
Physijs.scripts.ammo = '/js/physics/ammo.js';

var container;
var camera;
var cameraTarget;
var light;
var scene;
var renderer;
var group;
var mousex =0, mousey=0;

var world, bp;
var balls = [];

var SHADOW_MAP_WIDTH = 2048;
var SHADOW_MAP_HEIGHT = 2048;

var maxHeavyObjNum = 4;
var heavyObjs = [];
var heavyObjMaterial;

function init(){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	
	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new Physijs.Scene;
	// scene = new THREE.Scene();
	scene.setGravity( new THREE.Vector3(0, -150, 0) );
	scene.fog = new THREE.Fog( 0xeeeeee, 1, 1000);

	//group
	group = new THREE.Object3D();
	scene.add( group );

	//camera
	camera = new THREE.PerspectiveCamera( 40, width/height, 1, 1000 );
	camera.position.x = 0;
	camera.position.y = 200;
	camera.position.z = -400;
	scene.add(camera);

	cameraTarget = new THREE.Object3D();
	cameraTarget.position.y = 30;
	//camera.target = cameraTarget;


	//renderer
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.autoClear = false;
	renderer.setSize( width, height );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapDarkness = 0.10;
	renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
	renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
	renderer.setClearColor(0xeeeeee, 1.0);
	document.body.appendChild ( renderer.domElement );

	
	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);
	document.addEventListener('click', createHeavyObj)

	createScene();
	animate();

}

function mouseMove(ev){
	mousex = ev.clientX - window.innerWidth/2;
	mousey = ev.clientY - window.innerHeight/2;
}

function resize(){
	var stageWidth = window.innerWidth;
	var stageHeight = window.innerHeight;
	camera.aspect =  stageWidth/stageHeight;
	renderer.setSize(stageWidth, stageHeight)
	camera.updateProjectionMatrix();
}

function createScene(){


	//light
    var ambient = new THREE.AmbientLight( 0x333333);
    scene.add( ambient );

	var light = new THREE.SpotLight( 0xffffff, 0.9);
	light.castShadow = true;
	light.position.set (0,600,0);
	scene.add(light);

	// ground
	var ground = new Physijs.PlaneMesh(
		new THREE.PlaneGeometry(10000, 10000),
		Physijs.createMaterial(
			new THREE.MeshBasicMaterial( {color:0xbbbbbb }),
			// 0.35, 0.55
			0.8, 0.4
		),
		0
	);
	ground.castShadow = true;
	ground.receiveShadow = true;
	ground.rotation.x = -Math.PI/2;
	scene.add(ground);

	//walls
	var wallGeometry = new THREE.PlaneGeometry(100, 1000);
	// var wallMaterial = new THREE.MeshBasicMaterial({opacity:0.2, transparent:true});
	var wallMaterial = Physijs.createMaterial(
		new THREE.MeshBasicMaterial({opacity:0.0, transparent:true}),
		0.8, 0.4
	);

	//plane -x 
	var planeShapeXmin = new Physijs.PlaneMesh( wallGeometry, wallMaterial, 0 );
	planeShapeXmin.position.x = -50;
	planeShapeXmin.rotation.y = Math.PI/2;
	scene.add(planeShapeXmin);

	//plane +x 
	var planeShapeXmax = new Physijs.PlaneMesh( wallGeometry, wallMaterial, 0 );
	planeShapeXmax.position.x = 50;
	planeShapeXmax.rotation.y = -Math.PI/2;
	scene.add(planeShapeXmax);

	//plane -z
	var planeShapeZmin = new Physijs.PlaneMesh( wallGeometry, wallMaterial, 0 );
	planeShapeZmin.position.z = -50;
	planeShapeZmin.rotation.y = 0;
	scene.add(planeShapeZmin);

	//plane +z
	var planeShapeZmax = new Physijs.PlaneMesh( wallGeometry, wallMaterial, 0 );
	planeShapeZmax.position.z = 50;
	planeShapeZmax.rotation.y = -Math.PI;
	scene.add(planeShapeZmax);


	// sphere
	// var sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0xdddddd, ambient: 0xdddddd, shininess: 0, perPixel: true } );
	var sphereMaterial = Physijs.createMaterial(
		new THREE.MeshPhongMaterial( { color: 0xcccccc, specular: 0xffffff, ambient: 0x333333, shininess:0 } ),
		0.8, 0.4
	);
	for (var i = 0; i < 120; i++) {

		var sphereScale = Math.random()*6+3;
		var sphereGeometry = new THREE.SphereGeometry(sphereScale,16,16);
		var sphereMesh = new Physijs.SphereMesh( sphereGeometry, sphereMaterial );
		sphereMesh.castShadow = true;
		sphereMesh.receiveShadow = true;
		sphereMesh.position.set((Math.random()*2-1)*10, i*4+300, (Math.random()*2-1)*10);
		scene.add( sphereMesh );


		balls.push(sphereMesh);

	}


}

/*
function createScene(){

	world = new CANNON.World();
	world.gravity.set(0,-250,0);
	world.broadphase = new CANNON.NaiveBroadphase();;
	world.solver.iterations = 10;

	//light
    var ambient = new THREE.AmbientLight( 0x333333);
    scene.add( ambient );

	var light = new THREE.SpotLight( 0xffffff, 0.9);
	light.castShadow = true;
	light.position.set (0,600,0);
	scene.add(light);

	
	//ground
	var groundMaterial = new CANNON.Material();
	var geometry = new THREE.PlaneGeometry(10000,10000);
	var planeMaterial = new THREE.MeshBasicMaterial( {color:0xbbbbbb });
	var ground = new THREE.Mesh( geometry, planeMaterial );
	ground.castShadow = true;
	ground.receiveShadow = true;
	ground.rotation.x = -Math.PI/2;
	group.add( ground );

	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.RigidBody( 0, groundShape, groundMaterial );
	groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),- Math.PI/2)
	world.add(groundBody);

	// plane -x
    var planeShapeXmin = new CANNON.Plane();
    var planeXmin = new CANNON.RigidBody(0, planeShapeXmin);
    planeXmin.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),  Math.PI/2);
    planeXmin.position.x = -50;
    world.add(planeXmin);

    // Plane +x
    var planeShapeXmax = new CANNON.Plane();
    var planeXmax = new CANNON.RigidBody(0, planeShapeXmax);
    planeXmax.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), - Math.PI/2);
    planeXmax.position.x = 50;
    world.add(planeXmax);

    // Plane -z
    var planeShapeYmin = new CANNON.Plane();
    var planeYmin = new CANNON.RigidBody(0, planeShapeYmin);
    planeYmin.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), 0);
    planeYmin.position.z = -50;
    world.add(planeYmin);

    // Plane +z
    var planeShapeYmax = new CANNON.Plane();
    var planeYmax = new CANNON.RigidBody(0, planeShapeYmax);
    planeYmax.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), - Math.PI);
    // planeYmax.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), -2*Math.PI);
    planeYmax.position.z = 50;
    world.add(planeYmax);

    //cannon material for bouncing
    var mat = new CANNON.Material();

	//sphere
	var sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0xdddddd, ambient: 0xdddddd, shininess: 0, perPixel: true } );
	for (var i = 0; i < 120; i++) {

		var sphereR = Math.random()*6+3;
		var sphereGeometry = new THREE.SphereGeometry(sphereR,16,16);
		var sphereShape = new CANNON.Sphere(sphereR);

		var sphereMesh = new THREE.Mesh( sphereGeometry, sphereMaterial);
		sphereMesh.castShadow = true;
		sphereMesh.receiveShadow = true;
		group.add( sphereMesh );


		//Physics
		var randX = (Math.random()*2-1)*10;
		var randZ = (Math.random()*2-1)*10;
		var sphereBody = new CANNON.RigidBody(sphereR*0.1, sphereShape, mat);

		//start position
		var pos = new CANNON.Vec3( 0, i*4+100, 0);
		sphereBody.position.set(pos.x + randX, pos.y+200, pos.z+randZ);
		sphereMesh.position = sphereBody.position;
		// sphereMesh.rotation = sphereBody.rotation;

		balls.push({mesh:sphereMesh, body:sphereBody});
		world.add(sphereBody);

	}

	//contact material
	heavyObjMaterial = new CANNON.Material();
	var mat_ground1 = new CANNON.ContactMaterial(groundMaterial, mat, 0.0, 0.7);
	var mat_ground2 = new CANNON.ContactMaterial(groundMaterial, heavyObjMaterial, 0.0, 0.7);
	var mat_ball = new CANNON.ContactMaterial(mat, mat, 0.0, 0.7);
	var mat_heavyBall1 = new CANNON.ContactMaterial(heavyObjMaterial, heavyObjMaterial, 0.0, 0.6);
	var mat_heavyBall2 = new CANNON.ContactMaterial(mat, heavyObjMaterial, 0.0, 0.6);
	world.addContactMaterial(mat_ground1);
	world.addContactMaterial(mat_ground2);
	world.addContactMaterial(mat_ball);
	world.addContactMaterial(mat_heavyBall1);
	world.addContactMaterial(mat_heavyBall2);

	createHeavyObj("A");

}
*/


function removeBall(id){

	var update = function(){
		heavyObjs[id].mesh.scale.x = obj.scale;
		heavyObjs[id].mesh.scale.y = obj.scale;
		heavyObjs[id].mesh.scale.z = obj.scale;
		// heavyObjs[id].body.radius = obj.scale;
	}

	var complete = function(){
		scene.remove(heavyObjs[id].mesh);
		// world.remove(heavyObjs[id].body);
		scene.remove(heavyObjs[id].light);
		heavyObjs.splice(id,1);
	}

	var obj = {scale:1};
	var tObj = {scale:0}
	var tween = new TWEEN.Tween(obj).to(tObj, 200).onUpdate(update).onComplete(complete);
	tween.start();
	
}


function createHeavyObj(){
	if(heavyObjs.length>maxHeavyObjNum){
		removeBall(0);
	}

	var r = 10+Math.random()*20;
	var sphereGeometry = new THREE.SphereGeometry( r, 16, 16);
	var sphereMaterial = Physijs.createMaterial(
		new THREE.MeshPhongMaterial( { color: 0xff8d28, specular: 0xffffff, ambient: 0xff5a16, shininess: 250, perPixel: true } ),
		0.35, 0.55
	)
	var heavyObjMesh = new Physijs.SphereMesh( sphereGeometry, sphereMaterial, 1000*1000 );
	heavyObjMesh.position.set(50*(2*Math.random()-1), r/2+400,50*(2*Math.random()-1));
	heavyObjMesh.castShadow = true;
	heavyObjMesh.receiveShadow = true;
	scene.add(heavyObjMesh);

	//light
	var light = new THREE.PointLight( 0xff8d28, 1, r+50 );
	light.position = heavyObjMesh.position;
	scene.add(light);

	heavyObjs.push({mesh:heavyObjMesh, radius:r, light:light});

}
/*
function createHeavyObj(chr){

	if(heavyObjs.length>maxHeavyObjNum){
		removeBall(0);
	}

	var r = 10+Math.random()*20;
	var sphereShape = new CANNON.Sphere(r);
	var heavyObjBody = new CANNON.RigidBody(r*0.75, sphereShape, heavyObjMaterial);
	heavyObjBody.position
	world.add(heavyObjBody);

	//visual
	var sphereGeometry = new THREE.SphereGeometry( r, 16, 16);
	var sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xff8d28, specular: 0xffffff, ambient: 0xff5a16, shininess: 250, perPixel: true } );
	var heavyObjMesh = new THREE.Mesh( sphereGeometry, sphereMaterial );
	heavyObjMesh.position = heavyObjBody.position;
	heavyObjMesh.castShadow = true;
	heavyObjMesh.receiveShadow = true;
	group.add(heavyObjMesh);

	//light
	var light = new THREE.PointLight( 0xff8d28, 1, r+50 );
	light.position = heavyObjMesh.position;
	scene.add(light);


	heavyObjs.push({mesh:heavyObjMesh, body:heavyObjBody, radius:r, light:light});

}
*/


function animate(){
	setTimeout(function(){
		requestAnimationFrame(animate);
	}, 1000/60);
	update();
	render();
}

var cr = 0;

var count = 200;

function update(){

	//camera
	cr -= mousex*0.000025;
	camera.position.y += ( -mousey/5 + 100 - camera.position.y)*0.02;
	camera.position.x = 200*Math.cos(cr);
	camera.position.z = 200*Math.sin(cr);
	camera.lookAt(cameraTarget.position)

	//Physics
	scene.simulate();

	TWEEN.update();

	
	//Physics
	// if (!world.paused) {
	// 	world.step(1.0/60.0);
		// var l = balls.length - 1;
		// for (var i = l; i >= 0; i--) {
		// 	if(balls[i].body.position.y<-300) balls[i].body.position.set(0,300,0);
		// 	// balls[i].body.getPosition(balls[i].mesh.position);
		// 	// balls[i].body.getOrientation(balls[i].mesh.quaternion);
		// 	// balls[i].mesh.position = balls[i].body.position;
		// };

		// //heavyObj
		// for (var i = heavyObjs.length - 1; i >= 0; i--) {
		// 	// heavyObjs[i].body.getPosition( heavyObjs[i].mesh.position );
		// 	// heavyObjs[i].body.getOrientation( heavyObjs[i].mesh.quaternion );
		// 	// heavyObjs[i].light.position = heavyObjs[i].mesh.position;
		// };


	// };

}

function render(){
	renderer.clear();
	renderer.render( scene, camera );
}




