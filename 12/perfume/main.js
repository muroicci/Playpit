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

var metaballs = [];
var metaballFieldSize = 100;

var	metaballController = {
		isolation: 250,
		resolution: 32,
		subtract: 30,
		strength: 1//2.05
		// isolation: 80,
		// resolution: 28,
		// subtract: 30,
		// strength: 1//2.05
	}


var SHADOW_MAP_WIDTH = 2048;
var SHADOW_MAP_HEIGHT = 2048;

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
var roots = [];
var numFrames = [];
var secsPerFrames = [];
var startTimes = [];
var currentFrames = [];
var nodes = [];
var spotLightColors = [0x00fffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff7800];

var isMute = true;


$(function() {

	if (!Detector.webgl) Detector.addGetWebGLMessage();

	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 500, 1000);
	//group
	group = new THREE.Object3D();
	scene.add(group);

	//camera
	camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
	camera.position.set(0, 100, -400)
	scene.add(camera);

	cameraTarget = new THREE.Object3D();
	cameraTarget.position.y = 30;


	//light
	mainLight = new THREE.DirectionalLight(0xffffff, 0.2);
	mainLight.castShadow = true;
	mainLight.position.set(0, 600, 0);
	scene.add(mainLight);

	spotLight = new THREE.SpotLight(0x00fffff, 10, 400);
	//spotLight.castShadow = true;
	scene.add(spotLight);

	var ambient = new THREE.AmbientLight(0x999999);
	scene.add(ambient);

	sublight = new THREE.DirectionalLight(0xffffff, 0.5);
	sublight.position.set(0, -10, 0)
	scene.add(sublight);

	//renderer
	renderer = new THREE.WebGLRenderer();
	renderer.autoClear = false;
	renderer.setSize(width, height);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapDarkness = 1.00;
	renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
	renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
	renderer.setClearColorHex(0x000000, 1.0);
	document.body.appendChild(renderer.domElement);

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	//container.appendChild(stats.domElement);

	//trackball
	trackball = new THREE.TrackballControls(camera, renderer.domElement);
	//trackball = new THREE.RollControls(camera, renderer.domElement);

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
	loadBVHData('bvhfiles/aachan.bvh');

	createScene();
	animate();

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
		console.log('play')

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
	if (mult>2) {
		var col = spotLightColors[ Math.floor(Math.random()*spotLightColors.length-1)];
		spotLight.color = sublight.color = new THREE.Color(col);
		spotLight.intensity = mult*16;
		
	}else{
		spotLight.intensity *= 0.4;
	}

}


//load and parsing data: modified from Saqoosha's code "http://saqoo.sh/a/labs/perfume/2/"

function loadBVHData(url) {

	$.get(url, function(data) {
		var done;
		nodes.push([]);
		motions.push(data.split(/\s+/g));
		channels.push([]);
		var mot = motions[motions.length - 1];
		done = false;
		while (!done) {
			switch (mot.shift()) {
			case 'ROOT':
				roots.push(parseNode(mot));
				group.add(roots[roots.length - 1]);
				break;
			case 'MOTION':
				mot.shift();
				numFrames.push(parseInt(mot.shift()));
				mot.shift();
				mot.shift();
				secsPerFrames.push(parseFloat(mot.shift()));
				done = true;
			}
		}
		startTimes.push(Date.now());
		currentFrames.push(0);
		createBlob(roots[roots.length - 1]);
		loadAudio();
	});

}


function parseNode(data) {

	//for debug
	// var sphereMesh = new THREE.Mesh(
	// 	new THREE.SphereGeometry(10, 12, 12), new THREE.MeshBasicMaterial({color:0xffffff})
	// 	)

	var done, geometry, i, material, n, node, t;
	node = new THREE.Object3D();
	node.name = data.shift();
	node.eulerOrder = 'YXZ';
	done = false;
	while (!done) {
		switch (t = data.shift()) {
		case 'OFFSET':
			node.position.x = parseFloat(data.shift());
			node.position.y = parseFloat(data.shift());
			node.position.z = parseFloat(data.shift());
			node.offset = node.position.clone();
			break;
		case 'CHANNELS':
			n = parseInt(data.shift());
			for (i = 0; 0 <= n ? i < n : i > n; 0 <= n ? i++ : i--) {
				channels[0].push({
					node: node,
					prop: data.shift()
				});
			}
			break;
		case 'JOINT':
		case 'End':
			nodes[0].push(node);
			node.add(this.parseNode(data));

			// node.add(sphereMesh)

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

	//material
	// environment map
	var path = "/common/images/textures/cube/Bridge2/";
	var format = '.jpg';
	var urls = [
	path + 'posx' + format, path + 'negx' + format, path + 'posy' + format, path + 'negy' + format, path + 'posz' + format, path + 'negz' + format];

	var reflectionCube = THREE.ImageUtils.loadTextureCube(urls);
	reflectionCube.format = THREE.RGBFormat;

	var refractionCube = new THREE.Texture(reflectionCube.image, new THREE.CubeRefractionMapping());
	refractionCube.format = THREE.RGBFormat;

	material = new THREE.MeshPhongMaterial({
		color: 0xdd0000,
		specular: 0xdddddd,
		ambient: 0x222222,
		shininess: 8,
		perPixel: true,
		metal:true
	});

	//ground
	var geometry = new THREE.PlaneGeometry(10000, 10000);
	var ground = new THREE.Mesh(geometry, material);
	ground.castShadow = true;
	ground.receiveShadow = true;
	// ground.position.y = -metaballFieldSize/2;
	group.add(ground);

	//test box
	// box = new THREE.Mesh(new THREE.CubeGeometry(metaballFieldSize*2,metaballFieldSize*2, metaballFieldSize*2, 1,1))
	// group.add(box)

	//Marching Cubes

	//gui
	gui = new DAT.GUI();
	gui.add(metaballController, "isolation", 0, 2400, 1);
	gui.add(metaballController, "resolution", 8, 128, 1);
	gui.add(metaballController, "subtract", 1, 30, 1);
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

	var mb = new THREE.MarchingCubes(metaballController.resolution, material)
	metaballs.push(mb);
	mb.castShadow = true;
	mb.receiveShadow = true;
	mb.isolation = metaballController.isolation;
	mb.position = root.position;
	mb.scale.set(metaballFieldSize, metaballFieldSize, metaballFieldSize);
	group.add(mb);

	// box.position = root.position;

}


function animate() {
	requestAnimationFrame(animate);

	trackball.update();
	if (roots[0] != undefined) {
		//camera
		camera.lookAt(roots[0].position)
		//light
		spotLight.position = roots[0].position.clone();
		spotLight.position.y += 300;
	}

	for (var i = 0; i < 1; i++) {
		updateBlobs(i);
	}

	render();
	//stats.update();
}

function updateBlobs(i) {


	if (channels[i] == undefined) return;
	//animation
	var ch, frame, n, torad, _i, _len, _ref;
	frame = ((Date.now() - startTimes[i]) / secsPerFrames[i] / 1000) | 0;
	n = frame % numFrames[i] * channels[i].length;
	if (frame >= numFrames[i]) {
		startTimes[i] = Date.now();
		loadAudio();
	}

	torad = Math.PI / 180;
	_ref = channels[i];

	var _len = _ref.length

	for (_i = 0; _i < _len; _i++) {
		ch = _ref[_i];
		switch (ch.prop) {
		case 'Xrotation':
			ch.node.rotation.x = (parseFloat(motions[i][n])) * torad;
			break;
		case 'Yrotation':
			ch.node.rotation.y = (parseFloat(motions[i][n])) * torad;
			break;
		case 'Zrotation':
			ch.node.rotation.z = (parseFloat(motions[i][n])) * torad;
			break;
		case 'Xposition':
			ch.node.position.x = ch.node.offset.x + parseFloat(motions[i][n]);
			break;
		case 'Yposition':
			ch.node.position.y = ch.node.offset.y + parseFloat(motions[i][n]);
			break;
		case 'Zposition':
			ch.node.position.z = ch.node.offset.z + parseFloat(motions[i][n]);
		}
		n++;
	}

	//metaball
	metaballs[i].reset();
	if (metaballController.isolation != metaballs[i].isolation) {
		metaballs[i].isolation = metaballController.isolation;
	};

	if (metaballs[i].resolution != metaballController.resolution) {
		metaballs[i].init(metaballController.resolution);
	}

	var excludes = ["Chest1", "Chest2", "Neck"];
	var addBlobs = ["RightAnkle", "LeftAnkle", "RightWrist", "LeftWrist"];

	var subtract = metaballController.subtract;
	var strength = metaballController.strength / ((Math.sqrt(nodes.length) - 1) / 4 + 1);
	var nlen = nodes[i].length;
	for (var _i = 0; _i < nlen; _i++) {

		var wVec = nodes[i][_i].matrixWorld.getPosition(); //new THREE.Vector3(roots[i].matrixWorld.n14, roots[i].matrixWorld.n24, roots[i].matrixWorld.n34);
		var bp = roots[i].position.clone();
		wVec.subSelf(bp);

		var px = wVec.x / (metaballFieldSize)*0.5 + 0.5;
		var py = wVec.y / (metaballFieldSize)*0.5 + 0.5;
		var pz = wVec.z / (metaballFieldSize)*0.5 + 0.5;

		var nName = nodes[i][_i].name;

		if (excludes.indexOf(nName) == -1) metaballs[i].addBall(px, py, pz, strength, subtract);

		//add blogs for writs and ankles;
		if (addBlobs.indexOf(nName) != -1) {
			metaballs[i].addBall(px, py, pz, strength, subtract);
		}

		//add more blobs around knees and ankles
		if (nName == "RightKnee" || nName == "LeftKnee" || nName == "RightAnkle" || nName == "LeftAnkle") {
			var wVecP = nodes[i][_i - 1].matrixWorld.getPosition(); //new THREE.Vector3(nodes[i][_i - 1].matrixWorld.n14, nodes[i][_i - 1].matrixWorld.n24, nodes[i][_i - 1].matrixWorld.n34);
			var vec = wVec.lerpSelf(wVecP, 0.5);
			px = (vec.x - roots[i].position.x) / (metaballFieldSize * 2) + 0.5;
			py = (vec.y - roots[i].position.y) / (metaballFieldSize * 2) + 0.5;
			pz = (vec.z - roots[i].position.z) / (metaballFieldSize * 2) + 0.5;
			metaballs[i].addBall(px, py, pz, strength, subtract);
		}


	}
	metaballs[i].addPlaneY(1, 12);

	if (++currentFrames[i] >= numFrames[i]) currentFrames[i] = 0;


}


function render() {
	renderer.clear();
	renderer.render(scene, camera);
}
