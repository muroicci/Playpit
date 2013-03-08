		
		var container;
		var camera;
		var scene;
		var renderer;
		
		//for cube mapping
		var cameraCube;
		var sceneCube;
		
		var particleGeometry;
		var particles;
		var particleMaterial;

		var lineGeometry;
		var lineMaterial;
		var line;
		var lineColors = new Array();

		var pPos = new Array();
		var oPos = new Array();
		var pVectors = new Array();
		var vVectors = new Array();
		var rpVectors = new Array();
		var rvVectors = new Array();
		
		var rotationSpeed = 0;
		
		var stageWidth = 500;
		var stageHeight = 500;
		var mx=0;
		var my=0;
		
		var pi = Math.PI;
		
		var sphereR = 150;
		var particleR = 8;
		var particleNum = 300;
		var strokeNum = 100;

		function init(){

			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			
			//container
			container = document.createElement('div');
			document.body.appendChild(container);
			
			//camera
			camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 10000);
			camera.position.z = 400;
			
			//scene
			scene = new THREE.Scene();
			scene.fog = new THREE.Fog( 0x222222, 1, 1400);
			scene.add(camera);
			
			target = new THREE.Object3D();
			
			//Material
			var texture = THREE.ImageUtils.loadTexture( "/7/textures/100px_circle.png");
			particleMaterial = new THREE.ParticleBasicMaterial({
				color:0xffffff,
				map:texture,
				depthTest:false,
				blending:THREE.AdditiveBlending,
				size:particleR,
				opacity:0.8,
				transparent:true
			});
			
			lineMaterial = new THREE.LineBasicMaterial({
					vertexColors:true,
					color:0xffffff,
					blending:THREE.AdditiveBlending,
					opacity: 1.0,//0.1,
					lineWidth:1
				});
			
			//create particles
			particleGeometry = new THREE.Geometry();
			lineGeometry = new THREE.Geometry();
			
			for( var i=0; i<particleNum; i++){
				
				//create vectors;
				pVectors[i] = new THREE.Vector2(0.5*Math.random()*pi, 0.5*Math.random()*pi);
				vVectors[i] = new THREE.Vector2( 0, 0);
				pPos[i] = new THREE.Vector3(sphereR*Math.sin(pVectors[i].y)*Math.cos(pVectors[i].x), sphereR*Math.sin(pVectors[i].y)*Math.sin(pVectors[i].x), sphereR*Math.cos(pVectors[i].y));
				particleGeometry.vertices.push( pPos[i]);
				rpVectors[i] = sphereR;
				rvVectors[i] = 0;
				
				for( var j=0; j<strokeNum; j++){
					oPos.push(new Array());
					oPos[i].push(pPos[i].clone());
					lineGeometry.vertices.push( oPos[i][j] );
					
					if(j>0){
						//colors
						var lc = new THREE.Color( 0xffffff );
						lc.setHSL( 0.0, 0.0, (-0.47/strokeNum*j + 0.6)*1 );
						lineColors.push( lc );
						lineColors.push( lc );
					}
					
				}
				
			}
			
			particles = new THREE.ParticleSystem( particleGeometry, particleMaterial );
			particles.sortParticles = true;
			particles.dynamic = true;
			scene.add( particles );
			

			line = new THREE.Line( lineGeometry, lineMaterial, THREE.LinePieces );
			line.colors = lineColors;
			scene.add( line );
			
			//renderer
			renderer = new THREE.WebGLRenderer( { antialias:true, autoClear:false } );
			renderer.setSize( window.innerWidth, window.innerHeight);
			renderer.sortObjects = true;
			container.appendChild( renderer.domElement );
			
			//Post proceccing
			//var vignettEffect = new THREE.ShaderPass( THREE.ShaderExtras( "vignette" ) );
			
			//event
			document.addEventListener('mousemove', mouseMove);
			document.addEventListener('click', mouseClick);
			window.addEventListener('resize', resize, false);
			
			//stats
			// stats = new Stats();
			// stats.domElement.style.position = 'absolute';
			// stats.domElement.style.top = '0px';
			// container.appendChild( stats.domElement );
			
			animate();
			
		}
		
		function mouseClick (e) {
			for (var i = rvVectors.length - 1; i >= 0; i--){
				rvVectors[i] += 5*Math.random()+5;
				rvVectors[i] *= 1.2;
				if(rvVectors[i]<0) rvVectors[i]*= -1;
			};
			
			rotationSpeed += 0.05*(2*Math.random()-1);
			
		}
		
		function resize(){
			stageWidth = window.innerWidth;
			stageHeight = window.innerHeight;
			camera.aspect =  stageWidth/stageHeight;
			renderer.setSize(stageWidth, stageHeight)
			camera.updateProjectionMatrix();
		}
		
		function mouseMove(ev){
			omx = mx;
			omy = my;
			mx = ev.clientX - window.innerWidth/2;
			my = ev.clientY - window.innerHeight/2;
		}
		
		function animate(){
			setTimeout(function(){
				requestAnimationFrame(animate);	
			}, 1000/60);
			
			
			camera.position.x += (mx*2 - camera.position.x) * 0.05;
			camera.position.y += (my*2 - camera.position.y) * 0.05;
			camera.lookAt( target.position)
			
			update();
			render();
			//stats.update();
		}
		
		function render(){
			renderer.clear();
		//	renderer.render( sceneCube, cameraCube );
			renderer.render( scene, camera );
		}
		

		var cnt = 0;

		function update(){
			
			var perlin = new ImprovedNoise();
			
			var speed = 1.00;
			
			var vertices = [];
			
			var refreshLine = (cnt++%3==0);
			
			if(refreshLine){
				scene.remove( line );
				lineGeometry = new THREE.Geometry();
			}
			
			particles.geometry.verticesNeedUpdate = true;

			for(var i=0; i<particleNum; i++){
				
				var ptcl = particleGeometry.vertices[i];
				var ps = pPos[i];
				var p = pVectors[i];
				var v = vVectors[i];
				var rp = rpVectors[i];
				var rv = rvVectors[i];

				var z = i*10;
				
				//noise
				var resultX = perlin.noise( v.x*speed,	v.y*speed, z)*2-1;
				var mrv = Math.abs(rv)/10;
				v.x = (mrv+0.6)*(i/particleNum+1)*resultX*pi/180;
				v.y = (mrv+0.3)*(i/particleNum+1)*resultX*pi/180;
				speed*=1.0002;
				p.add(v);
				
				//pull each other
				for( var j=0; j<particleNum; j++){
					if(i!=j){
						var q = pVectors[j];
						if( p.distanceTo(q) < 10*pi/180){
							var vv = new THREE.Vector3();
							vv = vv.subVectors(q, p);
							vv.multiplyScalar( 0.0060 );
							p.add(vv);
						}
					}
				}
				
				//rVectors
				var a = sphereR - rp;
				a *= 0.010;
				rv += a;
				rv *= 0.93;
				rp += rv;
				var ps2 = ps.clone();
				ps2.normalize();
				ps2.multiplyScalar( rp );
				rpVectors[i] = rp;
				rvVectors[i] = rv;
				
				//matrix
				//position
				var mtx = new THREE.Matrix4();
				mtx.setPosition( ps2 );
				
				//rotation
				var mtr = new THREE.Matrix4();
				mtr.rotateX( p.x );
				var mtrr = new THREE.Matrix4();
				mtrr.rotateY( p.y );
				
				var m = mtrr.multiply( mtr.multiply(mtx) );

				// ps = m.getPosition();
				ps = ps.clone().getPositionFromMatrix(m);
				// ptcl.position = ps.clone();
				particleGeometry.vertices[i] = ps.clone();
				// ptcl.set(pps.x, pps.y, pps.z);

				
				if(refreshLine){
					oPos[i].unshift(ps.clone());
					oPos[i].pop();

					for( var j=0; j<strokeNum-1; j++){
						vertices.push( oPos[i][j] ) ;
						vertices.push(  oPos[i][j+1] );
					}
				}				
			}

			//draw lines
			if(refreshLine){
				lineGeometry.vertices = vertices;
				lineGeometry.colors = lineColors;
				line = new THREE.Line( lineGeometry, lineMaterial, THREE.LinePieces );
				scene.add( line );
			}
			
			//rotate objects
			// particles.rotation.y += rotationSpeed;
			// particles.rotation.x += rotationSpeed;
			// line.rotation = particles.rotation;
			//rotationSpeed += ( 0 - rotationSpeed)*0.04;
			cnt++;
			
		}
		
		///////////////////////////////////////////
			
