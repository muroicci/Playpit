		
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
		var meshMat;
		
		var stageWidth = 500;
		var stageHeight = 500;
		var windowHalfX = stageWidth/2;
		var windowHalfY = stageHeight/2;
		var mx=0;
		var my=0;
		
		var pi = Math.PI;
		
		var sphereR = 200;
		var particleR = 2;
		var particleNum = 100;

		function init(){

			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			
			//container
			container = document.createElement('div');
			document.body.appendChild(container);
			
			//camera
			camera = new THREE.Camera(75, window.innerWidth/window.innerHeight, 1, 10000);
			camera.position.z = 400;
			
			//scene
			scene = new THREE.Scene();
			scene.fog = new THREE.Fog( 0x222222, 1, 900);
			
			group = new THREE.Object3D();
			target = new THREE.Object3D();
//		 	target.position.y = 50;
			camera.target = target;

			var texture = THREE.ImageUtils.loadTexture( "textures/100px_circle.png");
			material = new THREE.MeshLambertMaterial({
				color:0x000000,
				map:texture,
				depthTest:false,
				//blending:THREE.AdditiveBlending,
				transparent:true,
				opacity:1
			});
			
			meshMat = new THREE.MeshLambertMaterial(	{	
				color:0x666666
//				depthTest:true
		 	});
			
			meshGeom = new THREE.Geometry();
			
			for( var i=0; i<particleNum; i++){
				
				//create vectors;
				pVectors[i] = new THREE.Vector2(Math.random()*pi, Math.random()*pi);
				vVectors[i] = new THREE.Vector2( 0, 0);
				pPos[i] = new THREE.Vector3(sphereR*Math.sin(pVectors[i].y)*Math.cos(pVectors[i].x), sphereR*Math.sin(pVectors[i].y)*Math.sin(pVectors[i].x), sphereR*Math.cos(pVectors[i].y));
				var pr = particleR*Math.random()*2 + 2;
				radius[i] = pr;
				
				//create particles
				geometry = new THREE.CubeGeometry(pr, pr, 0);
				var mesh = new THREE.Mesh(geometry, material);
				mesh.matrixAutoUpdate = false;
				mesh.updateMatrix();
				particles[i] = mesh;
				group.addChild(mesh);
				
				//meshes
				meshGeom.vertices.push(new THREE.Vertex(pPos[i]));

			}
			
			line = new THREE.Mesh(meshGeom, meshMat);
			line.doubleSided = true;
			scene.addChild( line );
			
			//light
			var light = new THREE.PointLight(0xffffff, 2.5);
			light.position.x = 0;
			light.position.y = 0;
			light.position.z = 0;
			
			scene.addLight( light );
			scene.addObject( group );
			scene.addObject( target );
			
			//renderer
			renderer = new THREE.WebGLRenderer( { clearColor:0x222222, clearAlpha: 1 } );
			renderer.setSize( window.innerWidth, window.innerHeight);
			renderer.sortObjects = true;
			container.appendChild( renderer.domElement );
			
			
			//event
			document.addEventListener('mousemove', mouseMove);
			window.addEventListener('resize', resize, false);
			
			//stats
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			//container.appendChild( stats.domElement );
			
			animate();
			
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
			mx = ev.clientX - windowHalfX;
			my = ev.clientY - windowHalfY;
		}
		
		function animate(){
			requestAnimationFrame(animate);
			update();
			render();
//			stats.update();
		}
		
		function render(){
			
			camera.position.y += (my/2+100 - camera.position.y) * 0.05;
			group.rotation.y += (((mx-stageWidth*0.5)/10*pi/180  + 0 - group.rotation.y) * 0.05);
			line.rotation.y = group.rotation.y;
			renderer.render( scene, camera );
		}
		

		var ofx = Math.random()*10;
		var ofy = Math.random()*10;

		function update(){
			
			meshGeom = new THREE.Geometry();
			
			ofx += 0.004;
			ofy += 0.008;
			
			for(var i=0; i<particleNum; i++){
				var mesh = particles[i];
				var ps = pPos[i];
				var p = pVectors[i];
				var v = vVectors[i];
				
				//noise
				var result = fBm2d( p.x/2 + ofx, p.y/2, 10);
				v.x += (result)*0.000075;
				v.y += (result)*0.000075;
				
				//set prop
				
				p.x += v.x;
				p.y += v.y;
				
				if(p.x>2*pi) {p.x =2*pi; v.x *=-0.7}
				if(p.y>2*pi) {p.y =2*pi;v.y *=-0.7}
				if(p.x<0) {p.x =0;v.x *=-0.7}
				if(p.y<0) {p.y =0;v.y *=-0.7}

			}
			
			
			//colision
			for(i=0;i<particleNum;i++){
				
				var ps = pPos[i];
				var p1 = pVectors[i];
				var v1 = vVectors[i];
				var r1 = radius[i];
				
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
						
						//draw lines
						
						
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
				
				ps.x = sphereR*Math.sin(p1.y)*Math.cos(p1.x);
				ps.y = sphereR*Math.sin(p1.y)*Math.sin(p1.x);
				ps.z = sphereR*Math.cos(p1.y);
				
				meshGeom.vertices.push(new THREE.Vertex(ps));
				
			}
			
			//draw 
			var min = 80;
			for (i=0; i<particleNum; i++){
				var mesh = particles[i];
				
				mesh.position = pPos[i];
				mesh.lookAt(group.position);
				mesh.updateMatrix();
				
				for(j=i+1; j<particleNum-1; j++){
					var dist = pPos[j].distanceTo(pPos[i]);
					if(dist<min) {
						for( var k=j+1; k<particleNum-1; k++){
							if(k!=i && k!=j){
								var dist2 = pPos[k].distanceTo(pPos[j]);
								if(dist2<min){
									var face = new THREE.Face3(i, j, k );
									var nml = getNormalVector(pPos[i], pPos[j], pPos[k]);
									face.normal = nml;
									nml.addSelf(pPos[i]);
								 	nml.multiplyScalar(-1);
									meshGeom.faces.push( face );
								}
							}
						}
					}
				}
			}

			//draw lines
			scene.removeChild(line);
			line = new THREE.Mesh(meshGeom, meshMat);
			line.doubleSided = true;
			scene.addChild(line);
		
		}
			
		function getNormalVector( p0, p1, p2) {
			var va = new THREE.Vector3(p0.x-p1.x, p0.y-p1.y, p0.z-p1.z);//p0.sub(p1);
			var vb = new THREE.Vector3(p2.x-p1.x, p2.y-p1.y, p2.z-p1.z);//p2.sub(p1);
			var crossV = Cross(va, vb);
			return crossV.normalize();
		}
		
		function Cross( v1, v2 )
			{
		        var vx = v1.y * v2.z - v1.z * v2.y;
		        var vy = v1.z * v2.x - v1.x * v2.z;
		        var vz = v1.x * v2.y - v1.y * v2.x;

			    return new THREE.Vector3(vx,vy,vz);
		}		
		
		
		
		
