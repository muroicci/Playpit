		
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
		
		var stageWidth = 500;
		var stageHeight = 500;
		var windowHalfX = stageWidth/2;
		var windowHalfY = stageHeight/2;
		var mx=0;
		var my=0;
		
		var pi = Math.PI;
		
		var sphereR = 250;
		var particleR = 7;
		var particleNum = 200;

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
			scene.fog = new THREE.Fog( 0x201021, 1, 900);

			scene.add(camera);
			
			group = new THREE.Object3D();
			target = new THREE.Object3D();
		 	target.position.y = 50;
			

			var texture = THREE.ImageUtils.loadTexture( "textures/100px_circle.png");
			material = new THREE.MeshBasicMaterial({
				color:0xffffff,
				map:texture,
				depthTest:false,
				//blending:THREE.AdditiveBlending,
				transparent:true,
				opacity:1
			});
			
			lineMat = new THREE.LineBasicMaterial(	{	
				color:0xffffff,
				opacity:0.5
			 });
			lineGeometry = new THREE.Geometry();
			
			for( var i=0; i<particleNum; i++){
				
				//create vectors;
				pPos[i] = new THREE.Vector3(0,0,0);
				pVectors[i] = new THREE.Vector2(Math.random()*pi, Math.random()*pi);
				vVectors[i] = new THREE.Vector2( 0, 0);
				var pr = particleR*Math.random()*2 + 2;
				radius[i] = pr;
				
				//create particles
				geometry = new THREE.CubeGeometry(pr, pr, 0);
				var mesh = new THREE.Mesh(geometry, material);
				mesh.matrixAutoUpdate = false;
				mesh.updateMatrix();
				particles[i] = mesh;
				group.add(mesh);
				
				//line
				lineGeometry.vertices.push(new THREE.Vertex(pPos[i]));
			}
			
			line = new THREE.Line(lineGeometry, lineMat, THREE.LinePieces);
			//group.add( line );
			
			//light
			var light = new THREE.PointLight(0xffffff, 1);
			light.position.x = -80;
			light.position.y = 0;
			light.position.z = 400;
			
			scene.add( light );
			scene.add( group );
			scene.add( target );
			
			
			//renderer
			renderer = new THREE.WebGLRenderer( { clearColor:0x201021, clearAlpha: 1 } );
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
			console.log(camera)
			
			resize();
			animate();
			
		}
		
		function resize(){
			stageWidth = window.innerWidth;
			stageHeight = window.innerHeight;
			camera.aspect =  stageWidth/stageHeight;
			renderer.setSize(stageWidth, stageHeight)
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

			camera.position.y += (my/2+100 - camera.position.y) * 0.05;
			camera.lookAt( target.position );
			group.rotation.y += (((mx-stageWidth*0.5)/10*pi/180  + 0 - group.rotation.y) * 0.05);
			line.rotation.y = group.rotation.y;

			
			render();
//			stats.update();
		}
		
		function render(){
			renderer.render( scene, camera );
		}
		

		var ofx = Math.random()*10;
		var ofy = Math.random()*10;

		function update(){

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
				
				if(p.x>pi) {p.x =pi; v.x *=-0.7}
				if(p.y>pi) {p.y =pi;v.y *=-0.7}
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
				
			}
			
			var vertices = new Array();
			
			for (i=0; i<particleNum; i++){
				var ps = pPos[i];
				var p = pVectors[i];
				var mesh = particles[i];
				
				mesh.position.x = ps.x;
				mesh.position.y = ps.y;
				mesh.position.z = ps.z;
				mesh.lookAt(group.position);
				mesh.updateMatrix();
				
				for(j=i+1; j<particleNum; j++){
					var dist = pPos[j].distanceTo(ps);
					if(dist<50) {
						vertices.push( new THREE.Vertex(ps.clone()));
						vertices.push( new THREE.Vertex(pPos[j].clone()));
					}
				}
				
			}
			
			//draw lines
			scene.remove(line);
			lineGeometry = new THREE.Geometry();
			lineGeometry.vertices = vertices;
			line = new THREE.Line(lineGeometry, lineMat, THREE.LinePieces)
			scene.add(line);
			
		}
		
