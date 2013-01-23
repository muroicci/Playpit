//random material

var materials = [];

materials.push (
	new THREE.MeshPhongMaterial( {
		color:0xffffff,
		map: THREE.ImageUtils.loadTexture("/common/images/textures/blkwhtstripe.jpg")
	})
);
materials[0].map.wrapS = materials[0].map.wrapT = THREE.RepeatWrapping;

materials.push (
	new THREE.MeshPhongMaterial({
		color:0xcc0000,
		specular: 0xffffff,
		ambient: 0xffffff,
		shininess: 250
	})
)

materials.push (
	new THREE.MeshPhongMaterial({
		color:0x36f3ff,
		specular: 0xffffff,
		ambient: 0xffffff,
		shininess: 250
	})
)