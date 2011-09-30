		
		var container;
		var camera;
		var scene;
		var renderer;

		var particles = new Array();
		var pVectors = new Array();
		var vVectors = new Array();
		var particleNum = 1200;
		
		var stageWidth = 500;
		var stageHeight = 500;
		var windowHalfX = stageWidth/2;
		var windowHalfY = stageHeight/2;
		var mx=0;
		var my=0;
		var omx=0;
		var omy=0;
		
		var sphereR = 60;
		var particleR = 0.3;
		var minAngle = (particleR*360/(2*Math.PI*sphereR))*Math.PI/180;

		function init(){

			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			
			//container
			container = document.createElement('div');
			document.body.appendChild(container);
			
			//camera
			camera = new THREE.Camera(75, window.innerWidth/window.innerHeight, 1, 10000);
			camera.position.z = 100;
			
			//scene
			scene = new THREE.Scene();
//			scene.fog = new THREE.FogExp2( 0x000000, 0.000001);
			var geometry = new THREE.Geometry();
			
			//renderer
			renderer = new THREE.WebGLRenderer();
			renderer.setSize( window.innerWidth, window.innerHeight);
			container.appendChild( renderer.domElement );
			
			//particles
			var PI2 = Math.PI*2;
			var material = new THREE.ParticleBasicMaterial({
				size:particleR,
				color:0xe2ecd4,
			});

			for( var i=0; i<particleNum; i++){
				pVectors[i] = new THREE.Vector3(0,0,0);
				vVectors[i] = new THREE.Vector3( Math.random()*Math.PI/4, Math.random()*Math.PI/4, Math.random()*Math.PI/4);
				geometry.vertices.push( new THREE.Vertex(pVectors[i]) );
			}
			
			particles = new THREE.ParticleSystem( geometry, material );
			particles.sortParticles = true;
			scene.addObject( particles );
			
			//event
			document.addEventListener('mousemove', mouseMove);
			window.addEventListener('resize', resize, false);
			
			//stats
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
//			container.appendChild( stats.domElement );
			
			animate();
			
		}
		
		function resize(){
			stageWidth = window.innerWidth;
			stageHeight = window.innerHeight;
			windowHalfX = stageWidth/2;
			windowHalfY = stageHeight/2;
			camera.aspect = stageWidth/stageHeight;
			renderer.setSize( stageWidth, stageHeight);
			camera.updateProjectionMatrix();
		}
		
		function mouseMove(ev){
			omx = mx;
			omy = my;
			mx = ev.clientX - windowHalfX;
			my = ev.clientY - windowHalfY;
		}
		
		function animate(){
			requestAnimationFrame(animate);
			update();
			render();
			stats.update();
		}
		
		function render(){
			
			camera.position.x += (mx/4 - camera.position.x) * 0.05;
			camera.position.y += (my/2 - camera.position.y) * 0.05;
			
			renderer.render( scene, camera );
		}
		

		var mp = 0;
		var ofx = 0;
		var ofy = 0;

		function update(){
			
			//calcurate mouse force
			//mp += Math.sqrt( (omx-mx)*(omx-mx)+(omy-my)*(omy-my))*1.5;
			//mp += (0-mp)/100;
			
			ofx += 0.004;
			ofy += 0.003;
			
			for(var i=0; i<particleNum; i++){
				var p = pVectors[i];
				var v = vVectors[i];
				
				//noise
				var resultX = fBm2d( p.x/(stageWidth*1)+i*0.0001 + ofx, p.y/(stageHeight*1), 10);
				var resultY = fBm2d( p.x/(stageWidth*1)+i*0.0001 + ofy, p.y/(stageHeight*1), 20);
				v.x += resultX*0.1;
				v.y += resultY*0.1;
				
				//collision test
				/*
				for(var j=i; j<particleNum; j++){
					var v2 = vVectors[j];
					var dist = v.distanceTo(v2);
					if(dist<minAngle*2){
						var dif = 2*particleR - dist;
						var ovx = v.x-v2.x;
						var ovy = v.y-v2.y;
						if(dist>0) dist = 1/dist;
						ovx*=dist;
						ovy*=dist;
						dif/=2;
						v.x += ovx*dif;
						v.y += ovy*dif;
						v2.x -= ovx*dif;
						v2.y -= ovy*dif;
					}
				}
				*/
				
				//polar to quad
				var vx = sphereR*Math.sin(v.x)*Math.cos(v.y);
				var vy = sphereR*Math.sin(v.x)*Math.sin(v.y);
				var vz = sphereR*Math.cos(v.x);
			
				//mouseforce
				/*
				var dist = Math.sqrt(  (my-pt.y)*(my-pt.y) + (mx-pt.x)*(mx-pt.x) );
				var forceX = pt.x-mx;
				var forceY = pt.y-my;
				//normalize
				var len = Math.sqrt(forceX*forceX+forceY*forceY);
				if(len>0) len=1/len;
				forceX*=len;
				forceY*=len;
				
				//add power
				pt.vx += forceX*mp*1/dist*0.03;
				pt.vy += forceY*mp*1/dist*0.03;
				*/
				
				//set prop				
				p.x = vx;
				p.y = vy;
				p.z = vz;
				
			}
		}
		
