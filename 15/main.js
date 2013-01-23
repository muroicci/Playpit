var container;
var camera;
var cameraTarget;
var mainLight, spotLight;
var scene;
var renderer;
var group;
var mousex = 0,
	mousey = 0;
var trackball;

var material;

var metaball;
var metaballFieldSize = 100;

var	metaballController = {
		isolation: 356,
		resolution: 40,
		subtract: 18,
		strength: 4.5
	}


var motions = [];

var audio;

var frameBufferSize, bufferSize, signal, peak;
var fft;
var context;
var source;
var audioProcessor;
var gainNode;
var currentvalue = [];
var maxvalue = [];

var channels = [];
var root;
var startTime, currentFrame=0, numFrames, secsPerFrames;
var nodes = [];
var spotLightColors = [0x00fffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff7800];

var includes = ["Spine", "Spine1", "Spine2", "Head", "LeftArm","LeftForeArm", "LeftHand", "", "", "RightArm","RightForeArm", "RightHand", "","LeftUpLeg", "LeftLeg", "LeftFoot","LeftToeBase","RightUpLeg","RightLeg","RightFoot","RightToeBase"];

var addBlobs = ["Head"];

var isMute = true;

var TO_RADIAN = Math.PI / 180;

var balls = [], ballNum=50, ballBodies = [];
var world;
var blobBodies = [];



$(function() {

	if (!Detector.webgl) Detector.addGetWebGLMessage();

	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xdddddd, 10, 1000);
	//group
	group = new THREE.Object3D();
	scene.add(group);

	//camera
	camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
	camera.position.set(0, 100, 400)
	scene.add(camera);

	cameraTarget = new THREE.Object3D();
	cameraTarget.position.y = 80;


	//light
	mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
	mainLight.castShadow = false;
	mainLight.position.set(0, 800, 200);
	mainLight.lookAt(group.position)
	scene.add(mainLight);

	spotLight = new THREE.SpotLight(0xfffffff, 0.6, 0);
	spotLight.castShadow = true;
	spotLight.position.set( -300, 300, 300 );
	spotLight.lookAt(group.position)
	spotLight.shadowCameraNear = 10;
	spotLight.shadowCameraFar = camera.far;
	spotLight.shadowCameraFov = 50;
	spotLight.shadowBias = 0.0001;
	spotLight.shadowDarkness = 0.3;
	spotLight.shadowMapWidth = 1024;
	spotLight.shadowMapHeight = 1024;
	scene.add(spotLight);

	var ambient = new THREE.AmbientLight(0x222222);
	scene.add(ambient);

	sublight = new THREE.DirectionalLight(0xffffff, 0.55);
	sublight.position.set(0, -100, 0);
	sublight.castShadow = false;
	sublight.rotation.x = -Math.PI;

	scene.add(sublight);

	//renderer
	renderer = new THREE.WebGLRenderer();
	renderer.autoClear = false;
	renderer.setSize(width, height);
	renderer.setClearColorHex(scene.fog.color.getHex(), 1.0);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFShadowMap;
	document.body.appendChild(renderer.domElement);

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	container.appendChild(stats.domElement);

	//trackball
	trackball = new THREE.TrackballControls(camera, renderer.domElement);
	trackball.zoomSpeed = 0.5;
	trackball.minDistance = 200;
	trackball.maxDistance = 600;

	//audio
	// audio = new Audio();
	// audio.src = "perfume.mp3";
	// audio.play();
	frameBufferSize = 1024;
	bufferSize = frameBufferSize / 2;
	signal = new Float32Array(bufferSize);
	peak = new Float32Array(bufferSize);

	fft = new FFT(bufferSize, 44100);


	//load bvh datas
	createScene();
	loadBVHData('gangnam_style_1.bvh');

	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);


});


function loadAudio() {

	context = new webkitAudioContext();
	source = context.createBufferSource();
	//spectrum node
	audioProcessor = context.createJavaScriptNode(2048);
	audioProcessor.onaudioprocess = audioAvailable;
	source.connect(audioProcessor);
	audioProcessor.connect(context.destination);
	//volume manupiration
	// gainNode = context.createGainNode();
	// source.connect(gainNode);
	// gainNode.connect(context.destination);

	//load
	var request = new XMLHttpRequest();
	request.open("GET", "perfume.mp3", true);
	request.responseType = "arraybuffer";

	request.onload = function() {
		source.buffer = context.createBuffer(request.response, false);
		source.noteOn(0);
		startTimes[0] = Date.now();
		//console.log('play')

		if(!isMute){
			source.gain.value = 1;
			$("#mute").text("Mute Sound");
		}else{
			source.gain.value = 0;
			$("#mute").text("Turn On Sound");
		}

	}

	request.send();
}


function audioAvailable(event) {

	// Copy input arrays to output arrays to play sound
	var inputArrayL = event.inputBuffer.getChannelData(0);
	var inputArrayR = event.inputBuffer.getChannelData(1);
	var outputArrayL = event.outputBuffer.getChannelData(0);
	var outputArrayR = event.outputBuffer.getChannelData(1);

	var n = inputArrayL.length;
	for (var i = 0; i < n; ++i) {
		outputArrayL[i] = inputArrayL[i];
		outputArrayR[i] = inputArrayR[i];
		signal[i] = (inputArrayL[i] + inputArrayR[i]) / 2; // create data frame for fft - deinterleave and mix down to mono
	}

	// perform forward transform
	fft.forward(signal);

	var mult = 0;
	for (var i = 0; i < bufferSize / 8; i++) {
		magnitude = fft.spectrum[i]; // multiply spectrum by a zoom value
		currentvalue[i] = magnitude;

		if (magnitude > maxvalue[i]) {
			maxvalue[i] = magnitude;
		} else {
			if (maxvalue[i] > 10) {
				maxvalue[i]--;
			}
		}
		if(i<bufferSize/32) mult += magnitude;
	}
	if (mult>1) {
		var col = spotLightColors[ Math.floor(Math.random()*spotLightColors.length-1)];
		mainLight.color = spotLight.color = sublight.color = new THREE.Color(col);
		spotLight.intensity = mult*24;
		sublight.intensity = mult*10;

	}else{
		if(!isMute){
			spotLight.intensity *= 0.4;
			sublight.intensity *= 0.4;
		}else{
			spotLight.intensity = 0;
			sublight.intensity = 0.75;
			mainLight.color = sublight.color = new THREE.Color(0xffffff);
		}
	}

}


//load and parsing data: modified from Saqoosha's code "http://saqoo.sh/a/labs/perfume/2/"

function loadBVHData(url) {

	$.get(url, function(data) {
		var done;
		motions = data.split(/\s+/g);
		var mot = motions;
		done = false;
		while (!done) {
			switch (mot.shift()) {
			case 'ROOT':

				root = parseNode(mot);

				group.add(root);
				break;
			case 'MOTION':
				mot.shift();
				numFrames = parseInt(mot.shift());
				mot.shift();
				mot.shift();
				secsPerFrames = parseFloat(mot.shift());
				done = true;
			}
		}
		startTimes = Date.now();
		currentFrame = 0;
		metaball = createBlob(root);
		//loadAudio();
		animate();
	});

}

var blobsBall = [];

function parseNode(data) {

	var done = false, n, node;
	node = new THREE.Object3D();
	node.name = data.shift();
	node.eulerOrder = 'ZXY';
	node.matrixAutoUpdate = false;
	while (!done) {
		switch (t = data.shift()) {
		case 'OFFSET':
			node.position.x = parseFloat(data.shift());
			node.position.y = parseFloat(data.shift());
			node.position.z = parseFloat(data.shift());
			node.offset = node.position.clone();
			node.updateMatrix();
			break;
		case 'CHANNELS':
			n = parseInt(data.shift());
			for (var i = 0; 0 <= n ? i < n : i > n; 0 <= n ? i++ : i--) {
				channels.push({
					node: node,
					prop: data.shift()
				});
			}
			break;
		case 'JOINT':
		case 'End':
			if(nodes.indexOf(node)==-1){
				nodes.push(node);

				var sphereShape = new CANNON.Sphere(30);
				var sphereBody = new CANNON.RigidBody(0.0, sphereShape);
				blobBodies.push(sphereBody);
				world.add(sphereBody);
				// var sp = new THREE.Mesh( new THREE.SphereGeometry(15,15,8) )
				// group.add(sp)
				// // sp.position = sphereBody.position;
				// blobsBall.push(sp)
			}
			node.add(this.parseNode(data));

			break;
		case '}':
			done = true;
		}
	}

	return node;
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
	world.gravity.set(0,-300,0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;
	console.log(world.solver.k)
	world.solver.k = 1000;
	world.solver.d = 0;

	//physics material
	var ballPhyMat = new CANNON.Material('ballPhyMat');
	var ballCPhyMat  = new CANNON.ContactMaterial(ballPhyMat, 
		0.0, //friction
		0.3  //restitution
	);
	world.addContactMaterial( ballCPhyMat );

	//ground
	var floorGeometry = new THREE.PlaneGeometry(10000, 10000,1,1);
	var ground = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({
		color:0xffffff
	}
	));
	ground.rotation.x = -Math.PI/2
	ground.castShadow = true;
	ground.receiveShadow = true;
	group.add(ground);
	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.RigidBody( 0, groundShape, ballPhyMat );
	groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),- Math.PI/2);
	world.add(groundBody);

	// //walls
	var floorHalfLength = 300;
	// plane -x
    var planeShapeXmin = new CANNON.Plane();
    var planeXmin = new CANNON.RigidBody(0, planeShapeXmin, ballPhyMat);
    planeXmin.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),  Math.PI/2);
    planeXmin.position.x = -floorHalfLength;
    world.add(planeXmin);

    // Plane +x
    var planeShapeXmax = new CANNON.Plane();
    var planeXmax = new CANNON.RigidBody(0, planeShapeXmax, ballPhyMat);
    planeXmax.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), - Math.PI/2);
    planeXmax.position.x = floorHalfLength;
    world.add(planeXmax);

    // Plane -z
    var planeShapeYmin = new CANNON.Plane();
    var planeYmin = new CANNON.RigidBody(0, planeShapeYmin, ballPhyMat);
    planeYmin.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), 0);
    planeYmin.position.z = -floorHalfLength;
    world.add(planeYmin);

    // Plane +z
    var planeShapeYmax = new CANNON.Plane();
    var planeYmax = new CANNON.RigidBody(0, planeShapeYmax, ballPhyMat);
    planeYmax.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), - Math.PI);
    planeYmax.position.z = floorHalfLength;
    world.add(planeYmax);


	//balls

	var ballR = 10;
	var ballGeom = new THREE.SphereGeometry(ballR,ballR,8);

	for( var i=0; i<ballNum; i++){
		var ballMat = materials[ i%materials.length ];
		var ball = new THREE.Mesh(ballGeom, ballMat);
		ball.castShadow = ball.receiveShadow = true;
		var rnd = Math.random()*2+0.4;
		ball.scale.set(rnd,rnd,rnd)
		group.add(ball);
		balls.push(ball);
		//physics
		var sphereShape = new CANNON.Sphere(ballR*rnd);
		var sphereBody = new CANNON.RigidBody(10, sphereShape );
		ballBodies.push(sphereBody);
		var pos = new THREE.Vector3(Math.random()*2-1, Math.random()*2, Math.random()*2-1);
		pos.normalize().multiplyScalar(Math.random()*200);
		sphereBody.position.set(pos.x, pos.y, pos.z);
		ball.position = sphereBody.position;
		ball.useQuaternion = true;
		ball.quaternion = sphereBody.quaternion;
		world.add(sphereBody);
	}

	//postprocessing
	//Vignette
	var effectVignette = new THREE.ShaderPass( THREE.VignetteShader );
	effectVignette.uniforms['offset'].value = 1.05;
	effectVignette.uniforms['darkness'].value=1.15;
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
	gui.add(metaballController, "isolation", 0, 2400, 1);
	gui.add(metaballController, "resolution", 8, 128, 1);
	gui.add(metaballController, "subtract", 1, 60, 1);
	gui.add(metaballController, "strength", 1, 5, 0.01);

	//mute
	$("#mute").click(mute);


}


function mute(){
	if(isMute){
		source.gain.value = 1;
		$("#mute").text("Mute Sound");
	}else{
		source.gain.value = 0;
		$("#mute").text("Turn On Sound");
	}
	isMute = !isMute;
	return false;
}

function createBlob(root) {

	material = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		specular: 0xffffff,
		ambient: 0xffffff,
		shininess: 250
	});

	var mb = new THREE.MarchingCubes(metaballController.resolution, material)
	mb.castShadow = true;
	mb.receiveShadow = true;
	mb.isolation = metaballController.isolation;
	mb.position = root.position;
	mb.scale.set(metaballFieldSize, metaballFieldSize, metaballFieldSize);
	group.add(mb);
	return mb;
}


function animate() {

	requestAnimationFrame(animate);

	trackball.update();
	//camera
	camera.lookAt(cameraTarget.position)

	//blobs
	updateBlobs(0);
	
	//physics
	var beatTiming = (Date.now() - startTimes)%5000 < 30;
		for(var i=0, l=ballBodies.length; i<l; i++){
			var v = ballBodies[i].position.copy();
			v.normalize();
			v.mult(-2, v);
			if(beatTiming) {
				if(ballBodies[i].position.y<40) {
					v.x *= 5; v.z*=5;
					v.y += 100+Math.random()*200;
				}
			}
			ballBodies[i].velocity.vadd(v, ballBodies[i].velocity);
	}

	if(!world.paused) {
		world.step(1/28);
	}

	render();
	stats.update();
}



function updateBlobs(i) {


	if (channels == undefined || metaball==undefined) return;
	//animation
	var ch, frame, n;
	frame = ((Date.now() - startTimes) / secsPerFrames / 1000) | 0;
	if(currentFrame!=frame)	currentFrame = frame;

	n = currentFrame % numFrames * channels.length;
	if (currentFrame >= numFrames) {
		startTimes = Date.now();
		//loadAudio();
	}

	for (var _i = 0, _len = channels.length; _i < _len; _i++) {
		ch = channels[_i];
		switch (ch.prop) {
		case 'Xrotation':
			ch.node.rotation.x = (parseFloat(motions[n])) * TO_RADIAN;
			break;
		case 'Yrotation':
			ch.node.rotation.y = (parseFloat(motions[n])) * TO_RADIAN;
			break;
		case 'Zrotation':
			ch.node.rotation.z = (parseFloat(motions[n])) * TO_RADIAN;
			break;
		case 'Xposition':
			ch.node.position.x = ch.node.offset.x + parseFloat(motions[n]);
			break;
		case 'Yposition':
			ch.node.position.y = ch.node.offset.y + parseFloat(motions[n]);
			break;
		case 'Zposition':
			ch.node.position.z = ch.node.offset.z + parseFloat(motions[n]);
		}
		ch.node.updateMatrix();
		n++;
	}

	//metaball
	metaball.reset();
	if (metaballController.isolation != metaball.isolation) {
		metaball.isolation = metaballController.isolation;
	};

	if (metaball.resolution != metaballController.resolution) {
		metaball.init(metaballController.resolution);
	}

	var bp = root.position.clone();

	var subtract = metaballController.subtract;
	var strength = metaballController.strength / ((Math.sqrt(nodes.length) - 1) / 4 + 1);
	for (var _i = 0, nlen = nodes.length; _i < nlen; _i++) {

		var nName = nodes[_i].name;
		if (includes.indexOf(nName) == -1) continue;

		var wVec = nodes[_i].matrixWorld.getPosition().clone();
		wVec.subSelf(bp);
		wVec.multiplyScalar(0.5/metaballFieldSize);
		wVec.addSelf( new THREE.Vector3(0.5,0.5,0.5) );
		metaball.addBall(wVec.x, wVec.y, wVec.z, strength, subtract);
		blobBodies[_i].position.set(
			(wVec.x-0.5)*metaballFieldSize*2.0+bp.x, 
			(wVec.y-0.5)*metaballFieldSize*2.0+bp.y, 
			(wVec.z-0.5)*metaballFieldSize*2.0+bp.z
		);

		//add blobs;
		if (addBlobs.indexOf(nName) != -1) {
			metaball.addBall(wVec.x, wVec.y, wVec.z, strength, subtract);
		}

		//add more blobs around knees and ankles
		if (nName == "LeftLeg" || nName == "LeftFoot" ||
			nName == "RightLeg" || nName == "RightFoot" ) {
			var wVecP = nodes[_i].parent.matrixWorld.getPosition().clone(); 
			wVecP.subSelf(bp);
			wVecP.multiplyScalar(0.5/metaballFieldSize);
			wVecP.addSelf( new THREE.Vector3(0.5,0.5,0.5) );
			var vec = wVec.lerpSelf( wVecP, 0.5)
			metaball.addBall(vec.x, vec.y, vec.z, strength, subtract);
		}


	}
	// metaball.addPlaneY(1, 24);

}


function render() {
	// renderer.clear();
	// renderer.render(scene, camera);
	composerScene.render();
}
