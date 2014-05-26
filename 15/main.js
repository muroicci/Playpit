
'use strict';
Physijs.scripts.worker = '/js/physics/physijs_worker.js';
// Physijs.scripts.ammo = '/js/physics/ammo.js';

if ( window.innerWidth === 0 ) { window.innerWidth = parent.innerWidth; window.innerHeight = parent.innerHeight; }


var TO_RADIAN = Math.PI / 180;
var TO_ANGLE = 180 / Math.PI;
var container;
var cubes = [];
var bodies = [];
var scene, camera, cameraTarget, renderer;
var stats, trackball, gui;
var boxSize = 5;
var boxGeometry, boxShape;
var composerScene;
var mousex=0, mousey=0;
var mainLight;

var cubeData = [];

var img_url = [
	"images/mario_jump.png",
	"images/megaman.png",
	"images/invader.png",
	"images/criboh.png",
	"images/link.png",
	"images/spelanker.png",
	"images/yoshi.png",
	"images/star.png",
	"images/mushroom.png"
];
var loadCompNum = 0;
var clickedNumbers = [];
var lastClickedTime;

var friction = 0.35;
var restutition = 0.55;

$(function() {

	if (!Detector.webgl) Detector.addGetWebGLMessage();

	for(var i=0; i<img_url.length; i++){
		clickedNumbers.push(i);
	}
	
	loadImage(0);

});

function init(){

	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	// scene = new THREE.Scene();
	scene = new Physijs.Scene;
	scene.setGravity(new THREE.Vector3(0,-150,0));
	scene.fog = new THREE.Fog(0x669BF8, 100, 1000);

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
	renderer.shadowMapCullFace = THREE.CullFaceBack;
	document.body.appendChild(renderer.domElement);

	//light
	mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
	mainLight.position.set(-110, 250, 200);
	mainLight.lookAt(scene.position);
	mainLight.castShadow = true;
	mainLight.shadowCameraNear = 10;
	mainLight.shadowCameraFar = 800;
	mainLight.shadowCameraLeft = -200;
	mainLight.shadowCameraRight = 200;
	mainLight.shadowCameraTop = 200;
	mainLight.shadowCameraBottom = -200;
	mainLight.shadowBias = 0.00005;
	mainLight.shadowDarkness = 0.5;
	mainLight.shadowMapWidth = 1024;
	mainLight.shadowMapHeight = 1024;
	// mainLight.shadowCameraVisible = true;
	scene.add(mainLight);

	var ambient = new THREE.AmbientLight(0x444444);
	scene.add(ambient);

	var sublight1 = new THREE.DirectionalLight(0xffffff, 0.88);
	sublight1.position.set(0, -100, 0);
	sublight1.lookAt(scene.position);
	scene.add(sublight1);

	var sublight2 = new THREE.DirectionalLight(0xffffff, 0.3);
	sublight2.position.set(100, 0, 0);
	sublight2.lookAt(scene.position);
	scene.add(sublight2);


	//stats
	// stats = new Stats();
	// stats.domElement.style.position = 'absolute';
	// container.appendChild(stats.domElement);

	//trackball
	// trackball = new THREE.TrackballControls(camera, renderer.domElement);
	// trackball.zoomSpeed = 0.5;
	// trackball.minDistance = 200;
	// trackball.maxDistance = 600;

	createScene();

	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);
	// window.addEventListener('click', createBoxes, false);

	//start
	var doCreateBoxes = function(){
		createBoxes();
		setTimeout(function(){
			doCreateBoxes();
		}, 7500);
	}

	doCreateBoxes();
	animate();


	//gui
	// gui = new DAT.GUI();
	// gui.add(cubes, "length").listen();
	// gui.add(mainLight.position, "x", -1000, 1000, 10);
	// gui.add(mainLight.position, "y", -1000, 1000, 10);
	// gui.add(mainLight.position, "z", -1000, 1000, 10);
	// gui.add(mainLight, "shadowBias", -0.001, 0.001, 0.0001);
	// gui.add(mainLight, "shadowCameraFov", -1000, 1000, 10);


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

	//postprocessing
	//Vignette
	var effectVignette = new THREE.ShaderPass( THREE.VignetteShader );
	effectVignette.uniforms['offset'].value = 0.80;
	effectVignette.uniforms['darkness'].value=1.20;
	effectVignette.renderToScreen = true;

	//bloom
	// var effectBloom = new THREE.BloomPass( 0.20 );
	
	//FXAA	
	var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
	//bleach
	// var effectBleach = new THREE.ShaderPass( THREE.BleachBypassShader );

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
	// composerScene.addPass( effectBleach );
	composerScene.addPass( effectFXAA );
	composerScene.addPass( effectVignette );

	//geometry 
	boxGeometry = new THREE.CubeGeometry(boxSize,boxSize,boxSize, 1,1,1);

	//ground

	var floorTexture1 = THREE.ImageUtils.loadTexture("images/floor.png");
	floorTexture1.wrapS = floorTexture1.wrapT = THREE.ReapeatWrapping;
	floorTexture1.repeat.set(10,2);

	var floorTexture2 = THREE.ImageUtils.loadTexture("images/floor.png");
	floorTexture2.wrapS = floorTexture2.wrapT = THREE.ReapeatWrapping;
	floorTexture2.repeat.set(10,10);

	var materials = [
		new THREE.MeshLambertMaterial({map:floorTexture1}), 
		new THREE.MeshLambertMaterial({map:floorTexture1}), 
		new THREE.MeshLambertMaterial({map:floorTexture2}), 
		new THREE.MeshLambertMaterial({map:floorTexture2}), 
		new THREE.MeshLambertMaterial({map:floorTexture1}), 
		new THREE.MeshLambertMaterial({map:floorTexture1})
	];

	var floorGeometry1 = new THREE.CubeGeometry(160, 32, 160, 1,1,1);

	var floorMaterial = Physijs.createMaterial(
			new THREE.MeshFaceMaterial(materials),
			friction, restutition
		)
	var floor1 = new Physijs.BoxMesh(floorGeometry1, floorMaterial, 0);
	floor1.castShadow = floor1.receiveShadow = true;

	scene.add(floor1);

	// var floorGeometry2 = new THREE.CubeGeometry(150, 200, 150);
	// var floorMaterial = Physijs.createMaterial(
	// 		new THREE.MeshLambertMaterial({	color:0xffffff }),
	// 		friction, restutition
	// 	)
	// var floor2 = new Physijs.BoxMesh(floorGeometry2, floorMaterial, 0);
	// floor2.receiveShadow = true;
	// floor2.position.y -=120;
	// scene.add(floor2);


}



function createBoxes(){

	var rnd = Math.floor(clickedNumbers.length*Math.random());
	var n = clickedNumbers.splice(rnd,1);
	if(clickedNumbers.length==0){
		for(var i=0; i<img_url.length; i++){
			clickedNumbers.push(i);
		}
	}

	var cubeInfo = cubeData[n];

	var w = cubeInfo.w, h = cubeInfo.h;
	for(var i=0; i<cubeInfo.data.length; i++){
		var info = cubeInfo.data[i];
		if(info.a>=128){
			var col = new THREE.Color();
			col.setRGB(info.r/255, info.g/255, info.b/255);
			var mat = Physijs.createMaterial(
				new THREE.MeshLambertMaterial({color:col, ambient:col, shading:THREE.FlatShading}),
				friction,
				restutition
			);
			var mesh = new Physijs.BoxMesh( boxGeometry, mat, 20 );
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.position.set(
				i%w*(boxSize+0.001), 
				-Math.floor(i/w)*(boxSize+0.001), 
				0);
			mesh.position.x -= w*boxSize/2;
			mesh.position.y+=500;

			scene.add(mesh);
			cubes.push(mesh);
		}
	}

}


function animate() {

	setTimeout(function(){
		requestAnimationFrame(animate);
	}, 1000/60);

	scene.simulate();
	// cubes
	var i=0;
	while(cubes[i]){
		var cube = cubes[i];
		if(cube.position.y<-150){
			// console.log(cubes.splice(i,1));
			scene.remove(cube);
			cubes.splice(i,1);

		}else{
			i++;
		}
	};

	//camera
	var tx = 400*Math.sin(mousex/10*TO_RADIAN);
	var tz = 400*Math.cos(mousex/10*TO_RADIAN);
	var ty = -(mousey-window.innerHeight/2)/5;
	var v = new THREE.Vector3(tx, ty+20, tz);
	v.sub(camera.position).multiplyScalar(0.05);
	camera.position.add( v );

	// trackball.update();
	//camera
	camera.lookAt(cameraTarget.position)

	mainLight.lookAt(scene.position);

	render();
	// stats.update();
}


function render() {
	// renderer.clear(false, true, false);
	// renderer.render(scene, camera);
	composerScene.render();
}
