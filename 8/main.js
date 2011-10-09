		
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
		
		var stageWidth = 500;
		var stageHeight = 500;
		var mx=0;
		var my=0;
		
		var pi = Math.PI;
		
		var sphereR = 100;
		var particleR = 32;
		var particleNum = 100;
		var strokeNum = 300;

		function init(){

			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			
			stageWidth = window.innerWidth;
			stageHeight = window.innerHeight;
			
			//container
			container = document.createElement('div');
			document.body.appendChild(container);
			
			//camera
			cameraOrtho = new THREE.OrthoCamera(-stageWidth/2, stageWidth, stageHeight, -stageHeight, -10000, 10000);
			camera = new THREE.Camera( 75, stageWidth/stageHeight, 1, 10000);
			camera.position.z = 400;
			cTarget = new THREE.Object3D();
			camera.target = cTarget;
			
			//scene
			scene = new THREE.Scene();
			scene.fog = new THREE.Fog( 0x000000, 1, 10000);
			
			sceneBG = new THREE.Scene();
			var bgColor = new THREE.MeshBasicMaterial( {
				color:0x000000
			} );
			var plane = new THREE.PlaneGeometry(1,1);
			var quadBG = new THREE.Mesh(plane, bgColor );
			quadBG.scale.set(stageWidth, stageHeight);
			sceneBG.addChild(quadBG)
			
			//renderer
			renderer = new THREE.WebGLRenderer( { antialias:false } );
			renderer.setSize( stageWidth, stageHeight);
			renderer.setClearColorHex(0x000000, 1);
			renderer.autoClear = true;
			renderer.sortObjects = true;
			container.appendChild( renderer.domElement );
			

			
			//for postprocessing
			var shaderVignette = THREE.ShaderExtras[ "vignette" ];
			var effectVignette = new THREE.ShaderPass( shaderVignette );
			effectVignette.uniforms["offset"].value = 0.95;
			effectVignette.uniforms["darkness"].value = 1.6;
			effectVignette.renderToScreen = true;
			
			var renderBG = new THREE.RenderPass( sceneBG, cameraOrtho );
			var renderModel = new THREE.RenderPass( scene, camera );
			renderModel.clear = false;
			
			var renderTargetParameter = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBufer: true, depthBuffer:true };
			var renderTarget = new THREE.WebGLRenderTarget(stageWidth, stageHeight, renderTargetParameter);
			
			composerScene = new THREE.EffectComposer( renderer,  renderTarget);
			composerScene.addPass( renderModel );
			composerScene.addPass( effectVignette );
			
			
			
			
			//target
			target = new THREE.Object3D();
			target.addChild(cTarget);
			
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
				particleGeometry.vertices.push( new THREE.Vertex(pPos[i]));
				rpVectors[i] = sphereR;
				rvVectors[i] = 0;
				
				for( var j=0; j<strokeNum; j++){
					oPos.push(new Array());
					oPos[i].push(pPos[i].clone());
					lineGeometry.vertices.push( new THREE.Vertex(oPos[i][j]) );
					
					var lc = new THREE.Color( colors[i%colors.length] );
					if(j>0){
						lineColors.push( lc );
						lineColors.push( lc );
					}
				}
			}
			
			particles = new THREE.ParticleSystem( particleGeometry, particleMaterial );
			particles.sortParticles = true;
			scene.addObject( particles );
			

			line = new THREE.Line( lineGeometry, lineMaterial, THREE.LinePieces );
			line.colors = lineColors;
			scene.addObject( line );
			
			
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
			mrx = 0.008*(mx)*pi/180;
			mry = 0.008*(my)*pi/180;
		}
		
		function animate(){
			requestAnimationFrame(animate);
			
			update();
			
			renderer.clear();
			composerScene.render(0.1);
			
			//stats.update();
			
		}
		

		var cnt = 0;

//////////////////////////////	//////////////////////////////	//////////////////////////////	


		function update(){
			
			//refresh line
			var refreshLine = (cnt%2==0);
			if(refreshLine){
				scene.removeChild( line );
				lineGeometry = new THREE.Geometry();
			}
			
			//target vector
			tVector.normalize();
			tVector = tVector.multiplyScalar(speedMultiply*10);
			var tmtp = new THREE.Matrix4();
			tmtp.setPosition( tVector );
			var tmtrx = new THREE.Matrix4();
			tmtrx.setRotationX( -mry );
			var tmtry = new THREE.Matrix4();
			tmtry.setRotationY( -mrx );
			
			var mm = tmtrx.multiplySelf(tmtp); 
			mm= tmtry.multiplySelf(tmtrx);
			tVector = mm.getPosition();
 			
			target.position.addSelf( tVector );
			speedMultiply += (1 - speedMultiply)*0.06;
			
			
			//camera
			var cvec = target.position.clone();
			cvec.setLength(target.position.length()-800);
			camera.position = cvec;
			
			var cmtx1 = new THREE.Matrix4();
			cmtx1.setTranslation(0,0,200);
			var cmtrx = new THREE.Matrix4();
			cmtrx.setRotationX( Math.cos(cnt*pi/180) );
			var cmtry = new THREE.Matrix4();
			cmtry.setRotationY( Math.sin(cnt*pi/180) );
			var cmtx2 = new THREE.Matrix4();
			cmtx2.setPosition( target.position );
			var mm = cmtrx.multiplySelf(cmtx1);
			mm = cmtry.multiplySelf(cmtrx);
			mm = cmtx2.multiplySelf(cmtry);
			cTarget.position = mm.getPosition();
			
			//particles
			var vertices = [];
			var speed = 1.0;
			var perlin = new ImprovedNoise();
			
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
				p.addSelf(v);
				
				//pull each other
				for( var j=0; j<particleNum; j++){
					if(i!=j){
						var q = pVectors[j];
						if( p.distanceTo(q) < 5*pi/180){
							var vv = new THREE.Vector3();
							vv = vv.sub(q, p);
							vv.multiplyScalar( 0.0060 );
							p.addSelf(vv);
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
				mtr.setRotationX( p.x );
				var mtrr = new THREE.Matrix4();
				mtrr.setRotationY( p.y );
				
				var m = mtrr.multiplySelf( mtr.multiplySelf(mtx) );
				
				ptcl.position = m.getPosition();
				ptcl.position.addSelf( target.position );
				ps = ptcl.position;
				
				if(refreshLine){
					oPos[i].unshift(ps.clone());
					oPos[i].pop();

					for( var j=0; j<strokeNum-1; j++){
						vertices.push( new THREE.Vertex( oPos[i][j] ) );
						vertices.push( new THREE.Vertex( oPos[i][j+1] ) );
					}
				}				
			}
			
			//draw lines
			if(refreshLine){
				lineGeometry.vertices = vertices;
				lineGeometry.colors = lineColors;
				line = new THREE.Line( lineGeometry, lineMaterial, THREE.LinePieces );
				scene.addChild( line );
			}
			
			//rotate objects
			// particles.rotation.y += rotationSpeed;
			// particles.rotation.x += rotationSpeed;
			// line.rotation = particles.rotation;
			// rotationSpeed += ( 0 - rotationSpeed)*0.04;
			cnt++;
			
			
			
		}
		
		///////////////////////////////////////////
			
