
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

var SHADOW_MAP_WIDTH = 1024;
var SHADOW_MAP_HEIGHT = 1024;


function init(){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	
	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0xffffff, 1, 1000);

	//group
	group = new THREE.Object3D();
	scene.addChild( group );

	//camera
	camera = new THREE.Camera( 40, width/height, 1, 1000 );
	camera.position.x = 0;
	camera.position.y = 400;
	camera.position.z = -400;

	cameraTarget = new THREE.Object3D();
	cameraTarget.position.y = 30;
	camera.target = cameraTarget;

	//light
    var ambient = new THREE.AmbientLight( 0x333333 );
    scene.addLight( ambient );

	var light = new THREE.SpotLight( 0xffffff, 1);
	light.shadowCameraVisible = true;
	light.castShadow = true;
	light.position.set (0,1000,0);
	scene.addLight(light);

	//renderer
	renderer = new THREE.WebGLRenderer();
	renderer.autoClear = false;
	renderer.setSize( width, height );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapBias = 0.0039;
	renderer.shadowMapDarkness = 0.2;
	renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
	renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
	renderer.setClearColorHex(0xffffff, 1.0);
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

	world = new CANNON.World();
	world.gravity( new CANNON.Vec3(0,-250,0));
	bp = new CANNON.NaiveBroadphase();
	world.broadphase(bp);
	world.iterations(2);
	
	//ground
	var geometry = new THREE.PlaneGeometry(10000,10000);
	var planeMaterial = new THREE.MeshBasicMaterial( {color:0xeeeeee });
	var ground = new THREE.Mesh( geometry, planeMaterial );
	//ground.castShadow = true;
	ground.receiveShadow = true;
	ground.rotation.x = -Math.PI/2;
	group.addChild( ground );

	var groundShape = new CANNON.Plane( new CANNON.Vec3(0,1,0));
	var groundBody = new CANNON.RigidBody( 0, groundShape );
	world.add(groundBody);

	// plane -x
    var planeShapeXmin = new CANNON.Plane(new CANNON.Vec3(0,0,1));
    var planeXmin = new CANNON.RigidBody(0, planeShapeXmin);
    planeXmin.setPosition(0,0,-50);
    world.add(planeXmin);

    // Plane +x
    var planeShapeXmax = new CANNON.Plane(new CANNON.Vec3(0,0,-1));
    var planeXmax = new CANNON.RigidBody(0, planeShapeXmax);
    planeXmax.setPosition(0,0,50);
    world.add(planeXmax);

    // Plane -z
    var planeShapeYmin = new CANNON.Plane(new CANNON.Vec3(1,0,0));
    var planeYmin = new CANNON.RigidBody(0, planeShapeYmin);
    planeYmin.setPosition(-50,0,0);
    world.add(planeYmin);

    // Plane +z
    var planeShapeYmax = new CANNON.Plane(new CANNON.Vec3(-1,0,0));
    var planeYmax = new CANNON.RigidBody(0, planeShapeYmax);
    planeYmax.setPosition(50,0,0);
    world.add(planeYmax);


	//sphere
	var sphereMaterial = new THREE.MeshLambertMaterial({color:0xffffff});
	for (var i = 0; i < 150; i++) {

		var sphereR = Math.random()*6+3;
		var sphereGeometry = new THREE.SphereGeometry(sphereR,8,6);
		var sphereShape = new CANNON.Sphere(sphereR);

		var sphereMesh = new THREE.Mesh( sphereGeometry, sphereMaterial);
		sphereMesh.castShadow = true;
		sphereMesh.receiveShadow = true;
		group.addChild( sphereMesh );
		sphereMesh.useQuaternion = true;

		//Physics
		var randX = (Math.random()*2-1)*10;
		var randZ = (Math.random()*2-1)*10;
		var sphereBody = new CANNON.RigidBody(0.45,sphereShape);

		//start position
		var pos = new CANNON.Vec3( 0, i*4+100, 0);
		sphereBody.setPosition(pos.x + randX, pos.y, pos.z+randZ);

		phys_bodies.push(sphereBody);
		phys_visuals.push(sphereMesh);  
		world.add(sphereBody);

	}

	createHeavyObj("A");



}


var compoundShape;
var heavyObjBody;
var heavyObjMesh;

function createHeavyObj(chr){

	group.removeChild(heavyObjMesh);
	world.remove(heavyObjBody);

	var r = 20+Math.random()*10;
	compoundShape = new CANNON.Compound();
	var sphereShape = new CANNON.Sphere(r);
	compoundShape.addChild(sphereShape, new CANNON.Vec3(0,0,0));
	heavyObjBody = new CANNON.RigidBody(100, compoundShape);
	heavyObjBody.setPosition(50*(2*Math.random()-1),r/2+600,50*(2*Math.random()-1))
	world.add(heavyObjBody);

	//visual
	var sphereGeometry = new THREE.SphereGeometry( r, 16, 16);
	var sphereMaterial = new THREE.MeshLambertMaterial({color:0xff8d28});
	heavyObjMesh = new THREE.Mesh( sphereGeometry, sphereMaterial );
	heavyObjMesh.castShadow = true;
	heavyObjMesh.receiveShadow = true;
	heavyObjMesh.useQuaternion = true;
	group.addChild(heavyObjMesh);
}



function animate(){
	requestAnimationFrame(animate);
	update();
	render();
}

var cr = 0;

function update(){

	//camera
	cr += mousex*0.00005;
	camera.position.y += ( -mousey/5 + 100 - camera.position.y)*0.02;
	camera.position.x = 200*Math.cos(cr);
	camera.position.z = 200*Math.sin(cr);
	camera.lookAt(heavyObjMesh.position)

	
	//Physics
	if (!world.paused) {
		world.step(1.0/60.0);
		var l = phys_bodies.length - 1;
		for (var i = l; i >= 0; i--) {
			if(phys_bodies[i].getPosition().y<-300) phys_bodies[i].setPosition(0,300,0);
			phys_bodies[i].getPosition(phys_visuals[i].position);
			phys_bodies[i].getOrientation(phys_visuals[i].quaternion);
		};

		//heavyObj
		heavyObjBody.getPosition( heavyObjMesh.position );
		heavyObjBody.getOrientation( heavyObjMesh.quaternion );


	};

}

function render(){
	renderer.clear();
	renderer.render( scene, camera );
}




