var container;
var camera;
var cameraTarget;
var light;
var scene;
var renderer;
var group	;
var mousex = 0,
	mousey = 0;
var trackball;

var world, bp;
var balls = [];

var metaballs = [];
var metaballController;
var metaballFieldSize = 100;

var SHADOW_MAP_WIDTH = 2048;
var SHADOW_MAP_HEIGHT = 2048;

var motions = [];

$(function() {

	if (!Detector.webgl) Detector.addGetWebGLMessage();

	//container
	container = document.createElement('div');
	document.body.appendChild(container);

	var width = window.innerWidth;
	var height = window.innerHeight;

	//scene
	scene = new THREE.Scene();
	//scene.fog = new THREE.Fog(0xeeeeee, 1, 1000);
	//group
	group = new THREE.Object3D();
	scene.add(group);

	//camera
	camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
	camera.position.set(-0, 300, -300)
	scene.add(camera);

	cameraTarget = new THREE.Object3D();
	cameraTarget.position.y = 30;


	//light
	var ambient = new THREE.AmbientLight(0x999999);
	scene.add(ambient);

	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.castShadow = true;
	light.position.set(0, 600, 0);
	scene.add(light);

	//renderer
	renderer = new THREE.WebGLRenderer();
	renderer.autoClear = false;
	renderer.setSize(width, height);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapDarkness = 0.10;
	renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
	renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
	renderer.setClearColorHex(0x000000, 1.0);
	document.body.appendChild(renderer.domElement);

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	container.appendChild(stats.domElement);

	//trackball
	trackball = new THREE.TrackballControls(camera, renderer.domElement);

	//load bvh datas
	loadBVHData('bvhfiles/aachan.bvh');
	// loadBVHData('bvhfiles/kashiyuka.bvh');
	// loadBVHData('bvhfiles/aachan.bvh');

	createScene();
	animate();

	//event
	document.addEventListener('mousemove', mouseMove);
	window.addEventListener('resize', resize, false);


});


var channels = [];
var roots = [];
var numFrames = [];
var secsPerFrames = [];
var startTimes = [];
var currentFrames = [];
var nodes = [];

//load and parsing data: modified from Saqoosha's code "http://saqoo.sh/a/labs/perfume/2/"

function loadBVHData(url) {

	$.get(url, function(data) {
		var done;
		nodes.push([]);
		motions.push(data.split(/\s+/g));
		channels.push([]);
		var mot = motions[motions.length-1];
		done = false;
		while (!done) {
			switch (mot.shift()) {
			case 'ROOT':
				roots.push(parseNode(mot));
				group.add(roots[roots.length-1]);
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
		createBlob(roots[roots.length-1]);
	});

}


function parseNode(data) {
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
	material = new THREE.MeshPhongMaterial({
		color: 0x222222,
		specular: 0xdddddd,
		ambient: 0x222222,
		shininess: 0,
		perPixel: true
	});

	var floorMat = new THREE.MeshNormalMaterial();

	//ground
	var geometry = new THREE.PlaneGeometry(10000, 10000);
	var ground = new THREE.Mesh(geometry, material);
	ground.castShadow = true;
	ground.receiveShadow = true;
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = -3;
	group.add(ground);


	//Marching Cubes
	metaballController = {
		isolation: 1000,
		resolution: 22,
		subtract: 12,
		strength: 1.5
	}

	//gui
	gui = new DAT.GUI();
	var is = gui.add(metaballController, "isolation", 0, 24000, 1);
	var rs = gui.add(metaballController, "resolution", 8, 128, 1);
	var sb = gui.add(metaballController, "subtract", 1, 30, 1);
	var st = gui.add(metaballController, "strength", 1, 5, 0.01);


}

function createBlob(root){
	
	var mb = new THREE.MarchingCubes(metaballController.resolution, material)
	metaballs.push(mb);
	mb.castShadow = true;
	mb.receiveShadow = true;
	mb.isolation = metaballController.isolation;
	mb.position = root.position;
	mb.scale.set(metaballFieldSize, metaballFieldSize, metaballFieldSize);
	group.add(mb);
	
}



function animate() {
	requestAnimationFrame(animate);
	
	//camera
	trackball.update();
	if(roots[0] != undefined ) camera.lookAt(roots[0].position)

	for(var i=0; i<1; i++){
		updateBlobs(i);
	}
	render();
	stats.update();
}

function updateBlobs(i) {


	if(channels[i]==undefined) return;
	//animation
	var ch, frame, n, torad, _i, _len, _ref;

	frame = ((Date.now() - startTimes[i]) / secsPerFrames[i] / 1000) | 0;
	n = frame % numFrames[i] * channels[i].length;
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

	var subtract = metaballController.subtract;
	var strength = metaballController.strength / ((Math.sqrt(nodes.length) - 1) / 4 + 1);
	var nlen = nodes[i].length;
	for (var _i = 0; _i < nlen; _i++) {
		var wVec = new THREE.Vector3(nodes[i][_i].matrixWorld.n14, nodes[i][_i].matrixWorld.n24, nodes[i][_i].matrixWorld.n34);
		var px = (wVec.x - roots[i].position.x) / (metaballFieldSize * 2) + 0.5;
		var py = (wVec.y - roots[i].position.y) / (metaballFieldSize * 2) + 0.5;
		var pz = (wVec.z - roots[i].position.z) / (metaballFieldSize * 2) + 0.5;

		var nName = nodes[i][_i].name;

		var excludes = ["Chest1", "Chest2", "Neck"];
		var addBlobs = ["RightAnkle", "LeftAnkle", "RightWrist", "LeftWrist"];

		if (excludes.indexOf(nName) == -1) metaballs[i].addBall(px, py, pz, strength, subtract);

		//add blogs for writs and ankles;
		if (addBlobs.indexOf(nName) != -1) {
			metaballs[i].addBall(px, py, pz, strength, subtract);
		}

		//add more blobs around knees and ankles
		if (nName == "RightKnee" || nName == "LeftKnee" || nName == "RightAnkle" || nName == "LeftAnkle") {
			var wVecP = new THREE.Vector3(nodes[i][_i - 1].matrixWorld.n14, nodes[i][_i - 1].matrixWorld.n24, nodes[i][_i - 1].matrixWorld.n34);
			var vec = wVec.lerpSelf(wVecP, 0.5);
			px = (vec.x - roots[i].position.x) / (metaballFieldSize * 2) + 0.5;
			py = (vec.y - roots[i].position.y) / (metaballFieldSize * 2) + 0.5;
			pz = (vec.z - roots[i].position.z) / (metaballFieldSize * 2) + 0.5;
			metaballs[i].addBall(px, py, pz, strength, subtract);
		}


	}
	metaballs[i].addPlaneY(5, 12);

	metaballs[i].position = roots[i].position;

	if (++currentFrames[i] >= numFrames[i]) currentFrames[i] = 0;


}


function render() {
	renderer.clear();
	renderer.render(scene, camera);
}
