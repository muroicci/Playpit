var container;
var camera;
var light;
var scene;
var renderer;
var group;
var mousex =0, mousey=0;

var projector = new THREE.Projector();

function init(){
	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new THREE.Scene();

	//group
	group = new THREE.Object3D();
	scene.addChild( group );

	//camera
	camera = new THREE.Camera( 40, width/height, 1, 1000 );
	camera.position.x = 0;
	camera.position.y = 100;
	camera.position.z = -100;
	camera.target = group;

	//light
	var light = new THREE.DirectionalLight( 0xffffff, 1.0 );
	light.position.set (0,1,0).normalize();
	scene.addLight(light);

	//renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	document.body.appendChild ( renderer.domElement );

	
	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);
	renderer.domElement.addEventListener('click', click, false);

	createObjects();

	animate();


}

var ground;

function createObjects(){

	//floor
	//ground
	var geometry = new THREE.PlaneGeometry(100,100);
	var planeMaterial = new THREE.MeshBasicMaterial( {color:0xeeeeee });
	ground = new THREE.Mesh( geometry, planeMaterial );
	ground.rotation.x = -Math.PI/2;
	group.addChild( ground );

}

function click(e){

	var mouse_x =   ((e.pageX-e.target.offsetParent.offsetLeft) / renderer.domElement.width)  * 2 - 1;
	var mouse_y = - ((e.pageY-e.target.offsetParent.offsetTop) / renderer.domElement.height) * 2 + 1;
	var vector = new THREE.Vector3( mouse_x, mouse_y, 0.5);
	projector.unprojectVector( vector, camera );
	var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize()); 
	var obj = ray.intersectObjects([ground]);

	//addsphere
	if(obj.length>0){
		var sphereGeometry = new THREE.SphereGeometry(6,8,8);
		var sphereMaterial = new THREE.MeshLambertMaterial({color:0xcccccc});
		var sphereMesh = new THREE.Mesh( sphereGeometry, sphereMaterial);
		sphereMesh.position.x = obj[0].point.x;
		sphereMesh.position.y = 3;
		sphereMesh.position.z = obj[0].point.z;
		group.addChild( sphereMesh );
	}


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
function animate(){
	requestAnimationFrame(animate);
	update();
	render();
}

var cr = 0;

function update(){

	//camera
	// camera.position.y += ( -mousey/5 + 100 - camera.position.y)*0.02;
	// cr += mousex*0.00005;
	// camera.position.x = 200*Math.cos(cr);
	// camera.position.z = 200*Math.sin(cr);


}

function render(){
	renderer.clear();
	renderer.render( scene, camera );
}



