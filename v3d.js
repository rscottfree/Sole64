"use strict";

s64.v3d.camera = null;
s64.v3d.scene = null;
s64.v3d.renderer = null;
s64.v3d.animating = false;
s64.v3d.canvas = null;
s64.v3d.renderer = null;
s64.v3d.testmesh = null;
s64.v3d.meshes = [];
s64.v3d.context = null;
s64.v3d.color = 0xff0000;
s64.v3d.animateId = null;

s64.v3d.setup = function() {
    s64.v3d.width = s64.screen.width - (s64.screen.border_width * 2);
    s64.v3d.height = s64.screen.height - (s64.screen.border_width * 2);

    if (window.WebGLRenderingContext) {
        try {
            s64.v3d.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (e) {
            // s64.screen.printLine('An error occured initializing WebGL. No 3D graphics for you.');
            return;
        }
    } else {
        // s64.screen.printLine('It looks like your browser does not support WebGL. No 3D graphics for you.');
        return;
    }

    s64.v3d.renderer.setSize(s64.v3d.width, s64.v3d.height);
    s64.v3d.renderer.domElement.classList.add('graphicscanvas');
    s64.v3d.renderer.domElement.style.top = 10 + s64.screen.border_width + 'px';
    s64.v3d.renderer.domElement.style.left = 10 + s64.screen.border_width + 'px';

    document.getElementById('commodore').appendChild(s64.v3d.renderer.domElement);

    s64.v3d.scene = new THREE.Scene();

    s64.v3d.camera = new THREE.PerspectiveCamera(40, s64.v3d.width / s64.v3d.height, 1, 5000);
    // s64.v3d.camera = new THREE.OrthographicCamera(s64.v3d.width / -2, s64.v3d.width / 2, s64.v3d.height / 2, s64.v3d.height / -2, 0, 10000);
    s64.v3d.camera.position.z = 1000;
    s64.v3d.scene.add(s64.v3d.camera);

    s64.v3d.scene.add(new THREE.AmbientLight(0x555555));

    // (color, distance, intensity)
    var light = new THREE.PointLight(0xffffff, 1, 2500);
    light.position.z = 600;
    s64.v3d.scene.add(light);

    // define materials
    /*s64.v3d.mat_phong1 = new THREE.MeshPhongMaterial({
        ambient: s64.v3d.color, specular: s64.v3d.color, color: s64.v3d.color, shininess: 10, shading: THREE.FlatShading
    });
    s64.v3d.mat_wire = new THREE.MeshBasicMaterial({ color: s64.v3d.color, wireframe: true });*/
};

s64.v3d.refresh = function() {
    s64.v3d.clear();
    s64.v3d.setup();
};

s64.v3d.startAnimation = function(context) {
    s64.v3d.context = context;
    s64.v3d.animateId = -1;
    return s64.v3d.animate();
};

s64.v3d.stopAnimation = function() {
    s64.v3d.context = null;
    cancelAnimationFrame(s64.v3d.animateId);
    s64.v3d.animateId = null;
};

s64.v3d.clear = function() {
    s64.v3d.context = null;

    while(s64.v3d.meshes.length > 0) {
        s64.v3d.scene.remove(s64.v3d.meshes.pop());
    }

    s64.v3d.render();

    cancelAnimationFrame(s64.v3d.animateId);
    s64.v3d.animateId = null;
};

s64.v3d.animate = function(t) {
    if (s64.v3d.animateId == null) return;

    if (undefined == t) t = new Date().getTime();
    if (s64.v3d.context) s64.v3d.context(t);
    s64.v3d.animateId = requestAnimationFrame(s64.v3d.animate);
    if (s64.v3d.meshes.length > 0) s64.v3d.render();
};

s64.v3d.collide = function(mesh, others) {
    var colliders = [];

    if (undefined == mesh.geometry
        || undefined == mesh.boundRadius
        || !mesh.geometry instanceof THREE.SphereGeometry
        || !mesh.geometry instanceof THREE.BoxGeometry) {
        return colliders;
    }

    for (var o in others) {
        var other = others[o];

        if (undefined == other.boundRadius) {
            continue;
        }

        var distance = Math.sqrt(
            Math.pow(mesh.position.x - others[o].position.x, 2)
                + Math.pow(mesh.position.y - others[o].position.y,2)
                + Math.pow(mesh.position.z - others[o].position.z, 2));
        var meshradius = mesh.boundRadius;

        var othersradius = others[o].boundRadius;

        if (distance - meshradius - othersradius <= 0){
            colliders.push(others[o]);
        }
    }

    if (colliders.length > 0) {
        //console.log(colliders);
    }
};

s64.v3d.render = function() {
    if (s64.v3d.renderer) {
        s64.v3d.renderer.render(s64.v3d.scene, s64.v3d.camera);
    }
};

s64.v3d.show = function(mesh) {
    s64.v3d.meshes.push(mesh);
    s64.v3d.scene.add(mesh);
    s64.v3d.render();
    return true;
};

s64.v3d.hide = function(mesh) {
    if (s64.v3d.meshes.indexOf(mesh) > 0) {
        s64.v3d.meshes.splice(s64.v3d.meshes.indexOf(mesh), 1);
    }
    s64.v3d.scene.remove(mesh);
    s64.v3d.render();
    return true;
};

s64.v3d.setColor = function(color) {
    s64.v3d.color = color;
};

s64.v3d.cube = function(w, h, d) {
    return new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        s64.v3d.getMaterial()
    );
};

s64.v3d.sphere = function(radius, segsWidth, segsHeight) {
    return new THREE.Mesh(
        new THREE.SphereGeometry(radius, segsWidth, segsHeight),
        s64.v3d.getMaterial());
};

s64.v3d.cylinder = function(radTop, radBottom, height, segRad, segHeight, open) {
    open = open || false;

    return new THREE.Mesh(
        new THREE.CylinderGeometry(radTop, radBottom, height, segRad, segHeight, open),
        s64.v3d.getMaterial());
};

s64.v3d.getMaterial = function() {
    return new THREE.MeshPhongMaterial({
        specular: 0xffffff, color: s64.v3d.color, shininess: 10, flatShading: true
    });
};
