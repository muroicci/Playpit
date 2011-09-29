		
		var canvas;
		var context;
		var particles = new Array();
		var stageWidth = 500;
		var stageHeight = 500;
		var particleNum = 400;
		var mx=0;
		var my=0;
		var omx=0;
		var omy=0;

		function init(){
			
			//canvas setting
			canvas = document.getElementById('main');
			if(canvas.getContext){
				context = canvas.getContext('2d');
			}
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			stageWidth = canvas.width;
			stageHeight = canvas.height;
			
			//particles
			for( var i=0; i<particleNum; i++){
				var xx = Math.random()*stageWidth;
				var yy = Math.random()*stageHeight;
				particles[i] = {
					x:xx, 
					y:yy,
					ox:xx,
					oy:yy,
					vx:0,
					vy:0
					};
			}
			
		
			//event
			canvas.addEventListener('mousemove', mouseMove);
			window.addEventListener('resize', resize, false);
			//setInterval( update, 1000/60);
			animate();
		}
		
		function resize(){
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			stageWidth = canvas.width;
			stageHeight = canvas.height;
		}
		
		function mouseMove(ev){
			omx = mx;
			omy = my;
			 if (ev.layerX || ev.layerX == 0) { // Firefox
			    mx = ev.layerX;
			    my = ev.layerY;
			  } else if (ev.offsetX || ev.offsetX == 0) { // Opera
			    mx = ev.offsetX;
			    my = ev.offsetY;
			  }
		}
		
		function drawNoise(){
		 	var imageData = context.createImageData(canvas.width, canvas.height);
		      //var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

		      for (var x = 0; x < canvas.width; x++)
		      {
		         for (var y = 0; y < canvas.height; y++)
		         {
		            // calculate the Perlin Noise result
		            //var result = noise2d(x / canvas.width * 10, y / canvas.height * 10);
		            var result = fBm2d(x / canvas.width, y / canvas.height , 10);
		            //var result = turbulence2d(x / canvas.width * 10, y / canvas.height * 10, 8);
		            //var result = ridgedmf2d(x / canvas.width * 10, y / canvas.height * 10, 8);

		            // convert the result from [-1, 1] to [0, 1]
		            result = result * 0.5 + 0.5;

		            // convert the result from [0, 1] to [0, 255]
		            result = result * 255;

		            var index = (x + y * canvas.width) * 4;
		            imageData.data[index    ] = result;   //Red
		            imageData.data[index + 1] = result;   //Green
		            imageData.data[index + 2] = result;   //Blue
		            imageData.data[index + 3] = 255;      //Alpha
		         }
		      }
		      context.putImageData(imageData, 0, 0);
		}
		
		function animate(){
			requestAnimationFrame(animate);
			update();
		}
		
		var t1 =0;
		var t2 =0;
		
		var mp = 0;
		
		function update(){
			
			//calcurate mouse force
			var mvx = (-mx+omx);
			var mvy = (-my+omy);
			mp += Math.sqrt( (omx-mx)*(omx-mx)+(omy-my)*(omy-my))*1.5;
			mp += (0-mp)/100;
			
			var l = particles.length;
			var range = 10;
			t1+=0.004;
			t2+=0.008;
			
			for(var i=0; i<l; i++){
				var pt = particles[i];
				pt.ox = pt.x;
				pt.oy = pt.y;
				
				//noise
				var resultX = fBm2d( t1+pt.x / stageWidth, t1+pt.y/stageHeight, 10);
				var resultY = fBm2d( t2+pt.x / stageWidth, t2+pt.y/stageHeight, 20);
				pt.vx += resultX*1.5;
				pt.vy += resultY*1.5;
				
				//mouseforce
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
				
				//set prop				
				pt.x += pt.vx;
				pt.y += pt.vy;
				
				pt.vx += (0-pt.vx)/10;
				pt.vy += (0-pt.vy)/10;
				
				
				//loop
				if(pt.x<-10) {
					pt.x = pt.ox = stageWidth+10;
					pt.y = pt.oy = Math.random()*stageHeight;
//					pt.vx = 0;
//					pt.vy = 0;
				}
				if(pt.x>stageWidth+10){
					pt.x = pt.ox = -10;
					pt.y = pt.oy = Math.random()*stageHeight;
//					pt.vx = 0;
//					pt.vy = 0;
				} 
				if(pt.y<-10) {
					pt.x = pt.ox = Math.random()*stageWidth;
					pt.y = pt.oy = stageHeight+10;
					//pt.vx = 0;
					//pt.vy = 0;
				}
				if(pt.y>stageHeight+10) {
					pt.x = pt.ox = Math.random()*stageWidth;
					pt.y = pt.oy = -10;
					//pt.vx = 0;
					//pt.vy = 0;
				}
			}
			draw();
		}
	
		function draw(){
				
				//context.fillStyle = "rgba(0,0,0,.5)";
				context.clearRect(0,0,stageWidth, stageHeight)
				context.beginPath();
				
				var l=particles.length;
				var arr = particles.slice();
				context.strokeStyle = "rgb(189, 182, 179)";
				
				while(arr.length>0){
					var pt1 = arr.shift();
					context.moveTo(pt1.x, pt1.y);
					for(var i=0; i<l; i++){
						var n = 0;
						var pt2 = particles[i];
						var dw = false;
						if(pt1!=pt2){
							var dist = Math.sqrt( (pt2.x-pt1.x)*(pt2.x-pt1.x)+(pt2.y-pt1.y)*(pt2.y-pt1.y) );
							if(dist<30 && n++<5){
								context.lineTo(pt2.x, pt2.y);
								dw = true;
							}
						}
					}
					if(!dw){
						context.lineTo(pt1.ox, pt1.oy);
					}
				}
				context.stroke();
				
				
				//draw mouse
//				context.moveTo(mx,my);
//				context.arc(mx,my,50,0,Math.PI*2,true);
//				context.stroke();
		}