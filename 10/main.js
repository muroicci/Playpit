		
		var container;
		var camera;
		var scene;
		var renderer;
		var geometry;
		var group;
		var line;

		var particles = new Array();
		var pPos = new Array();
		var pVectors = new Array();
		var vVectors = new Array();
		var radius = new Array();
		var lines = new Array();
		var lineMat;
		
		var composerScene;
		
		var mx=0;
		var my=0;
		
		var pi = Math.PI;
		
		var sphereR = 1500;
		var particleR = 200;
		var particleNum = 150;
		
		var colorTables = [0x0d3033, 0x317466, 0xb9d49e, 0xe8f196, 0xc7e947];
		
		var composerScene;
		var rtTextureDepth, rtTextureColor, shaderBokeh, effectBokeh;
		var pScene, pCamera, pMaterialBokeh, materialDepth;
    

		function init(){

			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			
			//container
			container = document.createElement('div');
			document.body.appendChild(container);
			
			//camera
			camera = new THREE.Camera(75, window.innerWidth/window.innerHeight, 1, 10000);
			camera.position.z = 3500;
			
			//scene
			scene = new THREE.Scene();
			scene.fog = new THREE.Fog( 0xffffff, 1, 9000);
			scene.matrixAutoUpdate = false;
			
			group = new THREE.Object3D();
			target = new THREE.Object3D();
			camera.target = target;

			var texture = THREE.ImageUtils.loadTexture( "textures/100px_circle.png");
			
			lineMat = new THREE.LineBasicMaterial(	{	
				color:0xb9d49e,
				opacity:1
			 });
			//lineGeometry = new THREE.Geometry();
			
			for( var i=0; i<particleNum; i++){
				
				//create vectors;
				pPos[i] = new Array();
				pPos[i][0] = new THREE.Vector3(1-2*Math.random(),1-2*Math.random(),1-2*Math.random());
				pVectors[i] = new THREE.Vector2(2*Math.random()*pi, 2*Math.random()*pi);
				vVectors[i] = new THREE.Vector2( 0, 0);
				var pr = particleR;
				radius[i] = pr;
				
				pPos[i][0].normalize();
				pPos[i][0].x = sphereR*Math.sin(pVectors[i].y)*Math.cos(pVectors[i].x);
				pPos[i][0].y = sphereR*Math.sin(pVectors[i].y)*Math.sin(pVectors[i].x);
				pPos[i][0].z = sphereR*Math.cos(pVectors[i].y);
				
				//create particles
				geometry = new THREE.CylinderGeometry(16, pr/2, pr/2, 0);
				var material = new THREE.MeshBasicMaterial({
					color:colorTables[ Math.floor(Math.random()*colorTables.length)],
					shading:THREE.FlatShading
				});
				var mesh = new THREE.Mesh(geometry, material);
				mesh.matrixAutoUpdate = false;
				mesh.position = pPos[i][0];
				mesh.lookAt(group.position);
				mesh.updateMatrix();
				particles[i] = new Array();
				particles[i][0] = mesh;
				group.addChild(mesh);
				
				//branch
				
				if(Math.random()<0.5){
					
					var branchNum = Math.floor(Math.random()*10);
					var previous = pPos[i][0];
					var prevMesh = particles[i][0];
					var lineGeom = new THREE.Geometry();
					var vertices = new Array();
					vertices.push(new THREE.Vertex( new THREE.Vector3(0,0,0) ));

					for(var j=0; j<branchNum; j++){ 

						var bvec = new THREE.Vector3(0,0,-1);//previous.clone();
						bvec.normalize();
						var mtx = new THREE.Matrix4();
						mtx.setRotationAxis(new THREE.Vector3(Math.random(),Math.random(),Math.random()), 30/(j+1)*pi/180);
						mtx.multiplyVector3(bvec);
						var mult = 300*(j+1) - 15*j;
						bvec.multiplySelf(new THREE.Vector3(mult,mult,mult));
						pPos[i].push( bvec );
						previous = bvec;
						vertices.push( new THREE.Vertex(bvec));
						
						geometry = new THREE.CylinderGeometry(16, pr/(j+2)/2, pr/(j+2)/2, 0);
						material = new THREE.MeshBasicMaterial({
							color:colorTables[ Math.floor(Math.random()*colorTables.length)],
							shading:THREE.FlatShading
						});
						mesh = new THREE.Mesh(geometry, material);
						mesh.matrixAutoUpdate = false;
						mesh.position = bvec;
						mesh.lookAt( previous );
						mesh.updateMatrix();
						particles[i][0].addChild(mesh);
						particles[i].push(mesh);
						prevMesh = mesh;
						
					}
					
					lineGeom.vertices = vertices;
					var line = new THREE.Line(lineGeom, lineMat);
					particles[i][0].addChild(line);
					
				}
				
			}

			
			//light
			var light = new THREE.PointLight(0xffffff, 1);
			light.position.x = -800;
			light.position.y = 0;
			light.position.z = 3000;
		 	scene.addLight( light );
			
			scene.addObject( group );
			scene.addObject( target );
			
			
			//renderer

			renderer = new THREE.WebGLRenderer( );
			renderer.setSize( window.innerWidth, window.innerHeight);
			renderer.setClearColorHex(0xffffff);
			renderer.clearAlpha = 1;
			renderer.autoClear = false;
			renderer.sortObjects = true;
			container.appendChild( renderer.domElement );

			//Postprocessing
			pScene = new THREE.Scene();
			pCamera = new THREE.OrthoCamera(-window.innerWidth/2, window.innerWidth/2, window.innerHeight/2, -window.innerHeight/2, -10000, 10000);
			pCamera.position.z = 100;
			
			//bokeh
			materialDepth = new THREE.MeshDepthMaterial()
			var pars = { minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, format: THREE.RGBFormat };
			rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars, true );
			rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars, true );
			shaderBokeh = THREE.ShaderExtras["bokeh"];
			effectBokeh = new THREE.ShaderPass( shaderBokeh );
			effectBokeh.uniforms["tColor"].texture = rtTextureColor;
			effectBokeh.uniforms["tDepth"].texture = rtTextureDepth;
			effectBokeh.uniforms["focus"].value = 0.90;
			effectBokeh.uniforms["aperture"].value = 0.05;
			effectBokeh.uniforms["maxblur"].value = 1;
			effectBokeh.uniforms["aspect"].value = window.innerWidth/window.innerHeight;
			pMaterialBokeh = new THREE.MeshShaderMaterial({
				uniforms: effectBokeh.uniforms,
				vertexShader: shaderBokeh.vertexShader,
				fragmentShader: shaderBokeh.fragmentShader
			});
			
			quad = new THREE.Mesh( new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), pMaterialBokeh );
			quad.position.z = -500;
		 	pScene.addObject(quad);
			
			//vignette
			var shaderVignette = THREE.ShaderExtras["vignette"];
			var effectVignette = new THREE.ShaderPass(shaderVignette);
			effectVignette.uniforms["offset"].value = 0.3;
			effectVignette.uniforms["darkness"].value = 2.5;
			effectVignette.renderToScreen = true;
			
			//render pass			
			var renderModel = new THREE.RenderPass( pScene, pCamera );
			var renderTargetParameter = { minFilter:THREE.LinearFilter, magFilter: THREE. LinearFilter, format:THREE.RGBFormat, stencilBuffer:true, depthBuffer:true };
			var renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameter);
			
			composerScene = new THREE.EffectComposer(renderer, renderTarget);
			composerScene.addPass( renderModel );
			composerScene.addPass( effectVignette );
			
			
			//debug
			// var effectController = {
			// 	focus: 1.0,
			// 	aperture: 0.025,
			// 	maxblur: 1.0
			// };
			// 
			// var matChanger = function(){
			// 	effectBokeh.uniforms["focus"].value = effectController.focus;
			// 	effectBokeh.uniforms["aperture"].value = effectController.aperture;
			// 	effectBokeh.uniforms["maxblur"].value = effectController.maxblur;
			// }
			// var gui = new GUI();
			// gui.add( effectController, "focus", 0.0, 3.0, 0.025).onChange(matChanger);
			// gui.add( effectController, "aperture", 0.001, 0.2, 0.001).onChange(matChanger);
			// gui.add( effectController, "maxblur", 0.0, 20.0, 0.025).onChange(matChanger);
			
			
			//event
			document.addEventListener('mousemove', mouseMove);
			window.addEventListener('resize', resize, false);
			
			//stats
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
		
			resize();
			animate();
			
		}
		
		function resize(){
			var stageWidth = window.innerWidth;
			var stageHeight = window.innerHeight;
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
			requestAnimationFrame(animate);
			update();
			render();
		}
		
		function render(){
			renderer.clear();
					
			scene.overrideMaterial = null;
			renderer.render( scene, camera, rtTextureColor, true);
			
			scene.overrideMaterial = materialDepth;
			renderer.render( scene, camera, rtTextureDepth, true );
			
			//renderer.render( pScene, pCamera );
			
			composerScene.render();
		}
		

		var ofx = Math.random()*10;
		var ofy = Math.random()*10;

		function update(){
			
			ofx += 0.004;
			ofy += 0.008;
			
			for(var i=0; i<particleNum; i++){
				var mesh = particles[i][0];
				var ps = pPos[i][0];
				var oldPs = ps.clone();
				var p = pVectors[i];
				var v = vVectors[i];
				
				//noise
				var result = fBm2d( p.x/2 + ofx, p.y/2, 10);
				var dx = (result)*0.000175
				var dy = (result)*0.000175
				v.x += dx;
				v.y += dy;
				
				//set prop
				
				p.x += v.x;
				p.y += v.y;
				
				if(p.x>2*pi) {p.x = 2*pi; v.x *=-0.7}
				if(p.y>2*pi) {p.y = 2*pi;v.y *=-0.7}
				if(p.x<0) {p.x =0;v.x *=-0.7}
				if(p.y<0) {p.y =0;v.y *=-0.7}

			}
			
			//calc collision
			for(i=0;i<particleNum;i++){
				
				var ps = pPos[i][0];
				var p1 = pVectors[i];
				var v1 = vVectors[i];
				var r1 = radius[i];
				
				//colision
				for( var j=i+1; j<particleNum; j++){
					var p2 = pVectors[j];
					var v2 = vVectors[j];
					var r2 = radius[j];
					
					var ra = (r1*360/(2*pi*sphereR))　*　pi/180;
					var rb = (r2*360/(2*pi*sphereR))　*　pi/180;
					
					var _a =     (v1.x * v1.x) - 2 * (v1.x * v2.x) +     (v2.x * v2.x) +     (v1.y * v1.y) - 2 * (v1.y * v2.y) +     (v2.y * v2.y);
					var _b = 2 * (p1.x * v1.x) - 2 * (p1.x * v2.x) - 2 * (v1.x * p2.x) + 2 * (p2.x * v2.x) + 2 * (p1.y * v1.y) - 2 * (p1.y * v2.y) - 2 * (v1.y * p2.y) + 2 * (p2.y * v2.y);
					var _c =     (p1.x * p1.x) - 2 * (p1.x * p2.x) +     (p2.x * p2.x) +     (p1.y * p1.y) - 2 * (p1.y * p2.y) +     (p2.y * p2.y) - (ra + rb) * (ra + rb);
					var _d = _b * _b - 4 * _a * _c;
					
					if(_d<=0){
						
					}else{
						
						_d = Math.sqrt(_d);
						var f0 = (- _b - _d) / (2 * _a);
						var f1 = (- _b + _d) / (2 * _a);
						var hit = false;
						
						if(f0>=0 && f0<=1){
							
							hit = true;
							p1.x = p1.x + v1.x*f0;
							p1.y = p1.y + v1.y*f0;
							p2.x = p2.x + v2.x*f0;
							p2.y = p2.y + v2.y*f0;
							
						}else if(f0*f1<0){
							hit = true;
							var vx = (p1.x - p2.x);
							var vy = (p1.y - p2.y);
							var len = Math.sqrt(vx*vx + vy*vy);
							var distance = (ra+rb) - len;
							
							if(len>0) len = 1/len;
							vx*=len;
							vy*=len;
							
							distance /= 2.0;
							p1.x += vx*distance;
							p1.y += vy*distance;
							p2.x -= vx*distance;
							p2.y -= vy*distance;
						}
						
						
						if(false&&hit){
						
							var t;
							var vx = (p2.x - p1.x);
							var vy = (p2.y - p1.y);
							
							t = -(vx*v1.x + vy*v1.y) / (vx*vx+vy*vy);
							var rx1 = v1.x + vx*t;
							var ry1 = v1.y + vy*t;
							
							t = -(-vy*v1.x + vx*v1.y) / (vy*vy+vx*vy);
							var mx1 = v1.x - vy*t;
							var my1 = v1.y + vx*t;
						
							t = -(vx*v2.x + vy*v2.y) / (vx*vx + vy*vy);
							var rx2 = v2.x + vx*t;
							var ry2 = v2.y + vy*t;
							
							t = -(-vy*v2.x + vx*v2.y) / (vy*vy + vx*vy);
							var mx2 = v2.x - vy*t;
							var my2 = v2.y + vx*t;
							
							var e = 0.8;
							var m = 10;
							var dx1 = (m * mx1 + m * mx2 + mx2 * e * m - mx1 * e * m) / (m + m);
							var dx2 = - e * (mx2 - mx1) + dx1;
							var dy1 = (m * my1 + m * my2 + my2 * e * m - my1 * e * m) / (m + m);
							var dy2 = - e * (my2 - my1) + dy1;
							
							v1.x = dx1+rx1;
							v1.y = dy1+ry1;
							v2.x = dx2+rx2;
							v2.y = dy2+ry2;
							
						}
						
					}
					
				}
				
				
			}
			
			//set prop
			var vertices = new Array();
			
			for (i=0; i<particleNum; i++){
				var ps = pPos[i][0];
				var p = pVectors[i];
				var op = p.clone();
				var v = vVectors[i];
				var mesh = particles[i][0];

				//polar coord
				ps.x = sphereR*Math.sin(p.y)*Math.cos(p.x);
				ps.y = sphereR*Math.sin(p.y)*Math.sin(p.x);
				ps.z = sphereR*Math.cos(p.y);
				
				mesh.position = ps;
				mesh.lookAt(group.position);
				mesh.updateMatrix();
				
				//for branch
				subL = pPos[i].length;
				var previous = pPos[i][0];
				
					for(j=1; j<subL; j++){
						var mesh2 = particles[i][j];
						var pps = pPos[i][j];
						mesh2.position = pps;
						mesh2.updateMatrix();
						previous = pps;
					}
				
				

				
			}
			

			//camera movement
			group.rotation.x += -my*0.00005;
			group.rotation.y += -mx*0.00005;
			camera.position.x += (-mx*5 - camera.position.x) * 0.05;
			camera.position.y += (my*5 - camera.position.y) * 0.05;
			
			
			
		}
		
