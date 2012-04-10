
var container;
var camera;
var light;
var scene;
var renderer;

var world, bp;
var phys_bodies =[];
var phys_visuals =[];


function init(){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	
	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new THREE.Scene();

	//camera
	camera = new THREE.Camera( 40, width/height, 1, 1000 );
	camera.position.x = 0;
	camera.position.y = -40;
	camera.position.z = 40;

	//light
	var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
	light.position.set (1,-1,1).normalize();
	scene.addLight(light);

	//renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	document.body.appendChild ( renderer.domElement );
	
	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);

	createScene();
	animate();
}

function mouseMove(){

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
	world.gravity( new CANNON.Vec3(0,0,-50));
	bp = new CANNON.NaiveBroadphase();
	world.broadphase(bp);
	world.iterations(2);
	
	//ground
	var geometry = new THREE.PlaneGeometry(20,20);
	var planeMaterial = new THREE.MeshBasicMaterial( {color:0xeeeeee });
	var ground = new THREE.Mesh( geometry, planeMaterial );
	scene.addChild( ground );

	var groundShape = new CANNON.Plane( new CANNON.Vec3(0,0,1));
	var groundBody = new CANNON.RigidBody( 0, groundShape );
	world.add(groundBody);

// plane -x
    var planeShapeXmin = new CANNON.Plane(new CANNON.Vec3(0,1,0));
    var planeXmin = new CANNON.RigidBody(0, planeShapeXmin);
    planeXmin.setPosition(0,-10,0);
    world.add(planeXmin);

    // Plane +x
    var planeShapeXmax = new CANNON.Plane(new CANNON.Vec3(0,-1,0));
    var planeXmax = new CANNON.RigidBody(0, planeShapeXmax);
    planeXmax.setPosition(0,10,0);
    world.add(planeXmax);

    // Plane -y
    var planeShapeYmin = new CANNON.Plane(new CANNON.Vec3(1,0,0));
    var planeYmin = new CANNON.RigidBody(0, planeShapeYmin);
    planeYmin.setPosition(-10,0,0);
    world.add(planeYmin);

    // Plane +y
    var planeShapeYmax = new CANNON.Plane(new CANNON.Vec3(-1,0,0));
    var planeYmax = new CANNON.RigidBody(0, planeShapeYmax);
    planeYmax.setPosition(10,0,0);
    world.add(planeYmax);



	//sphere
	var sphereR = 1;
	var sphereGeometry = new THREE.SphereGeometry(sphereR,8,8);
	var sphereShape = new CANNON.Sphere(sphereR);
	for (var i = 0; i < 200; i++) {

		var sphereMaterial = new THREE.MeshLambertMaterial({color:0xcccccc});
		var sphereMesh = new THREE.Mesh( sphereGeometry, sphereMaterial);
		scene.addChild( sphereMesh );
		sphereMesh.useQuaternion = true;

		//Physics
		var randX = (Math.random()*2-1)*10;
		var randY = (Math.random()*2-1)*10;
		var sphereBody = new CANNON.RigidBody(1,sphereShape);

		//start position
		var pos = new CANNON.Vec3( 0,0,i*4+4);
		sphereBody.setPosition(pos.x + randX, pos.y+randY, pos.z);

		phys_bodies.push(sphereBody);
		phys_visuals.push(sphereMesh);
		world.add(sphereBody);

	}

}

function animate(){
	requestAnimationFrame(animate);
	update();
	render();
}

function update(){

	//Physics
	if (!world.paused) {
		world.step(1.0/60.0);
		var l = phys_bodies.length - 1;
		for (var i = l; i >= 0; i--) {
			phys_bodies[i].getPosition(phys_visuals[i].position);
			phys_bodies[i].getOrientation(phys_visuals[i].quaternion);
		};
	};

}

function render(){
	camera.lookAt(scene.position);
	renderer.clear();
	renderer.render( scene, camera );
}




