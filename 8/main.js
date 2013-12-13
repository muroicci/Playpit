


		var container, camera, scene, renderer;
		var target, cTarget;
		var particleGeometry,	particles, particleMaterials;
		
    	var composerScene;

		var lineGeometry, lineMaterial, line;
		var lineColors = new Array();
		var colors = [ 0xdd2f37, 0xe467a5, 0xda9930, 0x9bb252, 0x478cc9, 0x626874 ];

		var pPos = new Array();
		var oPos = new Array();
		var pVectors = new Array();
		var vVectors = new Array();
		var rpVectors = new Array();
		var rvVectors = new Array();
		
		var rotationSpeed = 0;
		
		var tVector = new THREE.Vector3(0,0,5);
		var mrx = 0;
		var mry = 0;
		var speedMultiply = 1;
		
		var stageWidth = window.innerWidth;
		var stageHeight = window.innerHeight;
		var mx=0;
		var my=0;
		
		var pi = Math.PI;
		
		var sphereR = 100;
		var particleR = 32;
		var particleNum = 100;
		var strokeNum = 500;

		function init(){

			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			
			stageWidth = window.innerWidth;
			stageHeight = window.innerHeight;
			
			//container
			container = document.createElement('div');
			document.body.appendChild(container);
			
			//camera
			cameraOrtho = new THREE.OrthographicCamera(-stageWidth/2, stageWidth, stageHeight, -stageHeight, -10000, 10000);
			camera = new THREE.PerspectiveCamera( 75, stageWidth/stageHeight, 1, 10000);
			camera.position.z = 400;
			cTarget = new THREE.Object3D();
			
			//scene
			scene = new THREE.Scene();
			scene.fog = new THREE.Fog( 0x000000, 1, 10000);
			scene.add(camera);
			
			sceneBG = new THREE.Scene();
			var bgColor = new THREE.MeshBasicMaterial( {
				color:0x000000
			} );
			var plane = new THREE.PlaneGeometry(1,1);
			var quadBG = new THREE.Mesh(plane, bgColor );
			quadBG.scale.set(stageWidth, stageHeight);
			sceneBG.add(quadBG)
			sceneBG.add(cameraOrtho);
			
			//renderer
			renderer = new THREE.WebGLRenderer( { antialias:false } );
			renderer.setSize( stageWidth, stageHeight);
			renderer.setClearColor(0x000000, 1);
			renderer.autoClear = true;
			renderer.sortObjects = true;
			container.appendChild( renderer.domElement );
			

			
			//for postprocessing
			var effectVignette = new THREE.ShaderPass( THREE.VignetteShader );
			effectVignette.uniforms["offset"].value = 0.95;
			effectVignette.uniforms["darkness"].value = 1.6;
			effectVignette.renderToScreen = true;
			
			var renderBG = new THREE.RenderPass( sceneBG, cameraOrtho );
			var renderModel = new THREE.RenderPass( scene, camera );
			renderModel.clear = false;
			
			var renderTargetParameter = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBufer: true, depthBuffer:true };
			var renderTarget = new THREE.WebGLRenderTarget(stageWidth, stageHeight, renderTargetParameter);
			
			var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
			effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

			composerScene = new THREE.EffectComposer( renderer,  renderTarget);
			composerScene.addPass( renderModel );
			composerScene.addPass( effectFXAA );
			composerScene.addPass( effectVignette );
			
			
			
			
			//target
			target = new THREE.Object3D();
			target.add(cTarget);
			
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
					
					var lc = new THREE.Color( colors[i%colors.length] );
					if(j>0){
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
			line.dynamic = true;
			line.colors = lineColors;
			scene.add( line );
			
			
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
				rvVectors[i] += 10*Math.random()+10;
				rvVectors[i] *= 1.5;
				if(rvVectors[i]<0) rvVectors[i]*= -1;
			};
			
			rotationSpeed += 0.05*(2*Math.random()-1);
//			rotationSpeed += 0.12;
			if(speedMultiply<30)	speedMultiply *= 3;
			
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
			}, 1000/60 );
			
			
			update();
			
			renderer.clear();
			 composerScene.render(0.1);
			//renderer.render(scene, camera)
			
			//stats.update();
			
		}
		

		var cnt = 0;

//////////////////////////////	//////////////////////////////	//////////////////////////////	


		function update(){
			
			//refresh line
			var refreshLine = (cnt%2==0);
			if(refreshLine){
				scene.remove( line );
				lineGeometry = new THREE.Geometry();
			}
			
			//mouse position
			mrx += 0.008*(mx)*pi/180; //(0.08*(mx)*pi/180 - mrx)*0.8;
			mry += 0.008*(my)*pi/180; //(0.08*(my)*pi/180 - mry)*0.8;

			var tVector = new THREE.Vector3(0,0,10);
			var rotMatX = new THREE.Matrix4();
			var rotMatY = new THREE.Matrix4();
			rotMatX.makeRotationY(-mrx);
			rotMatY.makeRotationX(-mry);

			// tVector.applyMatrix4(rotMatX);
			rotMatY = rotMatY.multiply(rotMatX)
			tVector.applyMatrix4(rotMatY);
			tVector.multiplyScalar(speedMultiply);
			target.position.add( tVector )
			speedMultiply += (1 - speedMultiply)*0.06;			
			
			//camera
			var cvec = target.position.clone();
			cvec.setLength(target.position.length()-800);
			camera.position = cvec;
			
			camera.lookAt(target.position);
			
			//particles
			var vertices = [];
			var speed = 1.0;
			var perlin = new ImprovedNoise();
			var ptcl, ps, p, v, rp, rv;

			particles.geometry.verticesNeedUpdate = true;

			for(var i=0; i<particleNum; i++){
				
				ptcl = particleGeometry.vertices[i];
				ps = pPos[i];
				p = pVectors[i];
				v = vVectors[i];
				rp = rpVectors[i];
				rv = rvVectors[i];
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
						if( p.distanceTo(q) < 5*pi/180){
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
				mtr.makeRotationX( p.x );
				var mtrr = new THREE.Matrix4();
				mtrr.makeRotationY( p.y );
				
				var m = mtrr.multiply( mtr.multiply(mtx) );

				ps.getPositionFromMatrix(m);
				ps.add( target.position );
				//set particle position
				// ptcl.position = pPos[i];
				particleGeometry.vertices[i] = pPos[i];
				// ptcl.set(0,0,0)

				//set line postition
				if(refreshLine){
					oPos[i].unshift(ps.clone());
					oPos[i].pop();

					for( var j=0; j<strokeNum-1; j++){
						vertices.push( oPos[i][j] );
						vertices.push( oPos[i][j+1] );
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
			// rotationSpeed += ( 0 - rotationSpeed)*0.04;
			cnt++;

			
		}
		
		///////////////////////////////////////////
			
