class App
    
    constructor: ->
        @container = document.createElement 'div'
        document.body.appendChild @container

        @scene = new THREE.Scene

        @camera = new THREE.PerspectiveCamera 55, window.innerWidth / window.innerHeight, 1, 100000
        @camera.position.y = 200
        @camera.position.z = 500
        @scene.add @camera
        
        geo = new THREE.PlaneGeometry 500, 500, 10, 10
        mat = new THREE.LineBasicMaterial color: 0xeeeeee
        floor = new THREE.Mesh geo, mat
        floor.rotation.x = -Math.PI / 2
        @scene.add floor
        
        @renderer = new THREE.WebGLRenderer
        @container.appendChild @renderer.domElement

        @controls = new THREE.TrackballControls @camera, @renderer.domElement

        @stats = new Stats
        @stats.domElement.style.position = 'absolute'
        @stats.domElement.style.top = '0'
        @container.appendChild @stats.domElement

        window.addEventListener 'resize', @onWindowResize
        @onWindowResize()

        # @animate()
        @load()
        
    load: ->
        $.get 'data/nocchi.bvh', (data) =>
            @data = data.split /\s+/g
            @channels = []
            done = false
            while not done
                switch @data.shift()
                    when 'ROOT'
                        @root = @parseNode @data
                        @scene.add @root
                    when 'MOTION'
                        @data.shift() # Frames:
                        @numFrames = parseInt @data.shift()
                        @data.shift() # Frame
                        @data.shift() # Time:
                        @secsPerFrame = parseFloat @data.shift() # actual seconds per frame
                        done = true
            @root.material = new THREE.MeshBasicMaterial color: 0xff0000
            # @root.matrixAutoUpdate = false
            @startTime = Date.now()
            @animate()
    
    parseNode: (data) ->
        geometry = new THREE.CubeGeometry 3, 3, 3
        material = new THREE.MeshNormalMaterial
        node = new THREE.Mesh geometry, material
        node.name = data.shift()
        node.eulerOrder = 'YXZ'
        done = false
        while not done
            switch t = data.shift()
                when 'OFFSET'
                    node.position.x = parseFloat data.shift()
                    node.position.y = parseFloat data.shift()
                    node.position.z = parseFloat data.shift()
                    node.offset = node.position.clone()
                when 'CHANNELS'
                    n = parseInt data.shift()
                    for i in [0...n]
                        @channels.push node: node, prop: data.shift()
                when 'JOINT', 'End'
                    node.add @parseNode data
                when '}'
                    done = true
        return node
    
    onWindowResize: (event) =>
        width = window.innerWidth
        height = window.innerHeight

        @renderer.setSize width, height

        @camera.aspect = width / height
        @camera.updateProjectionMatrix()

        @controls.screen.width = width
        @controls.screen.height = height
        @controls.radius = (width + height) / 4
        
    animate: =>
        frame = ((Date.now() - @startTime) / @secsPerFrame / 1000) | 0
        n = frame % @numFrames * @channels.length
        torad = Math.PI / 180
        for ch in @channels
            switch ch.prop
                when 'Xrotation' then ch.node.rotation.x = (parseFloat @data[n]) * torad
                when 'Yrotation' then ch.node.rotation.y = (parseFloat @data[n]) * torad
                when 'Zrotation' then ch.node.rotation.z = (parseFloat @data[n]) * torad
                when 'Xposition' then ch.node.position.x = ch.node.offset.x + parseFloat @data[n]
                when 'Yposition' then ch.node.position.y = ch.node.offset.y + parseFloat @data[n]
                when 'Zposition' then ch.node.position.z = ch.node.offset.z + parseFloat @data[n]
            n++
        if ++@currentFrame >= @numFrames then @currentFrame = 0
        @render()
        @stats.update()
        requestAnimationFrame @animate
        # @log @root
    
    log: (obj) ->
        pos = obj.matrixWorld.decompose()[0]
        console.log obj.name, pos.x, pos.y, pos.z, obj.matrixWorld
        @log child for child in obj.children
        
    render: =>
        @controls.update()
        @renderer.render @scene, @camera


$ ->
    if Detector.webgl
        new App()
    else
        Detector.addGetWebGLMessage()




