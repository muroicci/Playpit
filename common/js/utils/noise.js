   var p = [ 151,160,137,91,90,15,
   131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
   190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
   88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
   77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
   102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
   135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
   5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
   223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
   129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
   251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
   49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
   138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
                       151,160,137,91,90,15,
   131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
   190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
   88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
   77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
   102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
   135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
   5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
   223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
   129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
   251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
   49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
   138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180 ];

function noise2d(x, y)
{
      var X = Math.floor(x) & 255;
      var Y = Math.floor(y) & 255; 

      x -= Math.floor(x);
      y -= Math.floor(y);

      var u = fade(x);
      var v = fade(y);

      var A = p[X  ]+Y;
      var AA = p[A]; 
      var AB = p[A+1];
      
      var B = p[X+1]+Y;
      var BA = p[B];
      var BB = p[B+1];      

      return lerp(v, lerp(u, grad(p[AA  ], x  , y  , 0),
                             grad(p[BA  ], x-1, y  , 0)),
                     lerp(u, grad(p[AB  ], x  , y-1, 0),
                             grad(p[BB  ], x-1, y-1, 0)));
}

function noise3d(x, y, z)
{
      var X = Math.floor(x) & 255;                  // FIND UNIT CUBE THAT
      var Y = Math.floor(y) & 255;                  // CONTAINS POINT.
      var Z = Math.floor(z) & 255;

      x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
      y -= Math.floor(y);                                // OF POINT IN CUBE.
      z -= Math.floor(z);

      var u = fade(x);                                // COMPUTE FADE CURVES
      var v = fade(y);                                // FOR EACH OF X,Y,Z.
      var w = fade(z);

      var A = p[X  ]+Y;                        // HASH COORDINATES OF
      var AA = p[A]+Z;                          // THE 8 CUBE CORNERS,
      var AB = p[A+1]+Z;
      
      var B = p[X+1]+Y;
      var BA = p[B]+Z;
      var BB = p[B+1]+Z;      

      return lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
                                     grad(p[BA  ], x-1, y  , z   )), // BLENDED
                             lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
                                     grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
                     lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
                                     grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
                             lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                     grad(p[BB+1], x-1, y-1, z-1 ))));
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

function lerp(t, a, b) { return a + t * (b - a); }

function grad(hash, x, y, z) 
{
      var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
      var u = h<8 ? x : y;                 // INTO 12 GRADIENT DIRECTIONS.
      var v = h<4 ? y : h==12||h==14 ? x : z;
      return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
}

// fractal sum
function fBm2d(x, y, octaves)
{
        var lacunarity = 2.0;
        var gain = 0.5;

	var freq = 1.0;
        var amp = 0.5;

	var sum = 0;	
	for(var i=0; i<octaves; i++) 
        {
		sum += noise2d(x*freq, y*freq)*amp;
		freq *= lacunarity;
		amp *= gain;
	}
	return sum;
}

function fBm3d(x, y, z, octaves)
{
        var lacunarity = 2.0;
        var gain = 0.5;

	var freq = 1.0;
        var amp = 0.5;

	var sum = 0;	
	for(var i=0; i<octaves; i++) 
        {
		sum += noise3d(x*freq, y*freq, z*freq)*amp;
		freq *= lacunarity;
		amp *= gain;
	}
	return sum;
}

// Turbulence - absolute value of noise summed
function turbulence2d(x, y, octaves)
{
        var lacunarity = 2.0;
        var gain = 0.5;

	var sum = 0;
	var freq = 1.0;
        var amp = 1.0;

	for(var i=0; i<octaves; i++)
        {
		sum += Math.abs(noise2d(x*freq, y*freq))*amp;
		freq *= lacunarity;
		amp *= gain;
	}
	return sum;
}

function turbulence3d(x, y, z, octaves)
{
        var lacunarity = 2.0;
        var gain = 0.5;

	var sum = 0;
	var freq = 1.0;
        var amp = 1.0;

	for(var i=0; i<octaves; i++)
        {
		sum += Math.abs(noise3d(x*freq, y*freq, z*freq))*amp;
		freq *= lacunarity;
		amp *= gain;
	}
	return sum;
}

// Ridged multifractal
// See "Texturing & Modeling, A Procedural Approach", Chapter 12
function ridge(h, offset)
{
    h = Math.abs(h);
    h = offset - h;
    h = h * h;
    return h;
}

function ridgedmf2d(x, y, octaves)
{
        var lacunarity = 2.0;
        var gain = 0.5;
        var offset = 1.0;

	var sum = 0;
	var freq = 1.0;
        var amp = 0.5;
	var prev = 1.0;

	for(var i=0; i<octaves; i++) 
        {
		var n = ridge(noise2d(x*freq, y*freq), offset);
		sum += n*amp*prev;
		prev = n;
		freq *= lacunarity;
		amp *= gain;
	}
	return sum;
}

function ridgedmf3d(x, y, z, octaves)
{
        var lacunarity = 2.0;
        var gain = 0.5;
        var offset = 1.0;

	var sum = 0;
	var freq = 1.0;
        var amp = 0.5;
	var prev = 1.0;

	for(var i=0; i<octaves; i++) 
        {
		var n = ridge(noise3d(x*freq, y*freq, z*freq), offset);
		sum += n*amp*prev;
		prev = n;
		freq *= lacunarity;
		amp *= gain;
	}
	return sum;
}