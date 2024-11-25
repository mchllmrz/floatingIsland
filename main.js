import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import bg from '../Island/assets/bg.jpg';
import moon from '../Island/assets/moon.jpg';


const islandUrl = new URL('../Island/assets/floating_island.glb', import.meta.url);
const grassUrl = new URL('../Island/assets/grass.glb', import.meta.url);
const carUrl = new URL('../Island/assets/cartoon_car.glb', import.meta.url);


const clock = new THREE.Clock();
const meshNodes = [];
// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
document.body.appendChild(renderer.domElement);

// Scene Setup
const scene = new THREE.Scene();
const background = new THREE.TextureLoader();
scene.background = background.load(bg);

// Camera Setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, -5, 40);

// OrbitControls
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

// Lighting
// Directional Light (like sunlight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(10, 20, 10); // Position above the scene
directionalLight.castShadow = true; // Enable shadow casting
directionalLight.shadow.mapSize.width = 1024; // Shadow resolution
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffff, 0.5); // Softer, overall light
scene.add(ambientLight);


// GUI Setup
const gui = new GUI();
const settings = {
    color1: '#a48ab8', // Top color
    color2: '#57581b', // Middle color
    color3: '#ba006b', // Bottom color
    islandHeight: -5, // Island's Y position
    wireframe: false, // Wireframe toggle
    spin: false // Spin toggle
};

const islandGroup = new THREE.Group();


const toggleWireframe = () => {
    meshNodes.forEach((mesh) => {
        if (mesh.material && mesh.material.wireframe !== settings.wireframe) {
            mesh.material.wireframe = settings.wireframe;
        }
    });
};

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// GUI Controls for Wireframe and Spin
gui.add(settings, 'wireframe')
    .name('Wireframe')
    .onChange(debounce(toggleWireframe, 100)); 

gui.add(settings, 'spin')
    .name('Spin Island');

// Load 3D Island Model
const assetLoader = new GLTFLoader();

// Asset Loader for the Island Model
assetLoader.load(islandUrl.href, function (gltf) {
    const model = gltf.scene;

    // Traverse the model to modify its geometry
    model.traverse((node) => {
        if (node.isMesh) {
            meshNodes.push(node);
            const geometry = node.geometry;
            

            if (geometry && geometry.attributes.position) {
                const colors = [];
                const position = geometry.attributes.position;

                const updateGradient = () => {
                    const color1 = new THREE.Color(settings.color1);
                    const color2 = new THREE.Color(settings.color2);
                    const color3 = new THREE.Color(settings.color3);
                    const color = new THREE.Color();

                    for (let i = 0; i < position.count; i++) {
                        const y = position.getY(i); // Get Y position of the vertex
                        const t = THREE.MathUtils.mapLinear(y, -5, 10, 0, 1); // Map Y to range [0, 1]

                        // Interpolate between the three colors
                        if (t < 0.5) {
                            color.lerpColors(color3, color2, t * 2); // Blend from color3 to color2
                        } else {
                            color.lerpColors(color2, color1, (t - 0.5) * 2); // Blend from color2 to color1
                        }

                        // Push the interpolated color
                        colors[i * 3] = color.r;
                        colors[i * 3 + 1] = color.g;
                        colors[i * 3 + 2] = color.b;
                    }

                    // Update the color attribute
                    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                };

                // Call the gradient update for the first time
                updateGradient();

                // Apply a material with vertex colors
                const gradientMaterial = new THREE.MeshStandardMaterial({
                    vertexColors: true,
                    flatShading: true,
                });
                node.material = gradientMaterial;

                // GUI Controls for Colors
               // gui.addColor(settings, 'color1').name('Top Color').onChange(updateGradient);
                gui.addColor(settings, 'color2').name('Island Color').onChange(updateGradient);
                //gui.addColor(settings, 'color3').name('Bottom Color').onChange(updateGradient);

                

                // Enable shadow properties
                node.castShadow = true;
                node.receiveShadow = true;

                

                // Recalculate normals for proper shading
                geometry.computeVertexNormals();

            }
        }
    });

    // Position and scale the model
    model.position.set(0, settings.islandHeight, 0);
    model.scale.set(2, 2, 2);
    


    islandGroup.add(model);
    scene.add(islandGroup);

    // GUI Control for Island Height
    gui.add(settings, 'islandHeight', -10, 10, 0.1)
        .name('Island Height')
        .onChange((value) => {
            islandGroup.position.y = value; // Update island's Y position
        });

        const grassLoader = new GLTFLoader();
        grassLoader.load(grassUrl.href, (grassGltf) => {
            const grassModel = grassGltf.scene;
    
            // Define specific positions for the grass
            const grassPositions = [
                { x: 10, z: -3 },
                { x: 9, z: -3},
                { x: 7, z: -4 },
                { x: 6, z: -3 },
                { x: 8, z: -3 },
                { x: 6, z: -4 },
                { x: 10, z: -2 },
                { x: 6, z: -11 },
                { x: 9, z: -10},
                { x: 5, z: -11 },  // Front-left, slightly inward
                { x: 8, z: -11 },  // Front-left closer to center
                { x: 5, z: -11 },  // Front-center
                { x: 7, z: -11 },   // Front-right closer to edge


                { x: -2, z: -9},
                { x: -3, z: -9},
                { x: -4, z: -8},
            ];
            
            // Loop through the positions and place grass
            grassPositions.forEach((pos) => {
                const grassClone = grassModel.clone();
    
                // Raycast to find the Y (height) on the island surface
                const raycaster = new THREE.Raycaster();
                const downVector = new THREE.Vector3(0, -1, 0); // Direction: down
                raycaster.set(new THREE.Vector3(pos.x, 20, pos.z), downVector); // Cast ray from above
                const intersects = raycaster.intersectObject(model, true);
    
                if (intersects.length > 0) {
                    const y = intersects[0].point.y; // Height of the island's surface
                    grassClone.position.set(pos.x, y, pos.z);
                } else {
                    console.warn(`No surface detected for grass at x: ${pos.x}, z: ${pos.z}`);
                    grassClone.position.set(pos.x, 0, pos.z); // Fallback
                }
    
                // Scale the grass
                grassClone.scale.set(8, 8, 8); 
    
                // Add grass to the island group
                islandGroup.add(grassClone);
            });
        });

        const carLoader = new GLTFLoader();
        carLoader.load(carUrl.href, (gltf) =>{
            const carModel = gltf.scene;

            const carScale = 0.3;
            carModel.scale.set(carScale, carScale, carScale);

            carModel.position.set(8, 0.6, -1);
            carModel.rotation.y = Math.PI/3;

            islandGroup.add(carModel);
        })

        
    
        // Animation Logic
        function animate() {
            requestAnimationFrame(animate);
    
            // Spin the island if enabled
            if (settings.spin) {
                islandGroup.rotation.y += 0.01;
            }
    
            orbit.update();
            renderer.render(scene, camera);
        }
    
        animate();
    });


const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ 
    //color: 0xc2e0ff,
    map: background.load(moon)
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(-10, 3, 10);
sphere.castShadow = true; // Enable shadows for sphere
sphere.receiveShadow = true; // Allow shadows to fall on it
scene.add(sphere)

// Load a Font and Add 3D Text
const fontLoader = new FontLoader();
fontLoader.load('node_modules/three/examples/fonts/droid/droid_serif_bold.typeface.json', (font) => {
    const textGeometry = new TextGeometry('Welcome to Island!', {
        font: font,
        size: 1.5, // Size of the text
        depth: 0.5, // Depth of the text
        curveSegments: 12, // Number of curve segments
        bevelEnabled: true, // Enable bevel
        bevelThickness: 0.03, // Thickness of the bevel
        bevelSize: 0.02, // Size of the bevel
        bevelSegments: 5 // Number of bevel segments
    });

    // Text Material
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xa2fab7, // Color of the text
        metalness: 0.3, // Metalness for a reflective effect
        roughness: 0.4 // Roughness for the material
    });

    // Create a Mesh
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position the Text
    textMesh.position.set(-9, -9, 10); // Adjust position as needed
    textMesh.castShadow = true; // Enable shadows for the text
    textMesh.receiveShadow = true;

    // Add the Text to the Scene
    scene.add(textMesh);

    
});

function createBird() {
    const birdGroup = new THREE.Group(); // Group for bird body and wings

    // Bird Body (Cone)
    const bodyGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2; // Rotate to align like a bird
    birdGroup.add(body);

    // Wings (Two Triangular Planes)
    const wingGeometry = new THREE.PlaneGeometry(0.5, 0.2);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        side: THREE.DoubleSide 
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.rotation.z = Math.PI / 4; // Tilt wing
    leftWing.position.set(-0.25, 0, 0); // Position to the left
    birdGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.rotation.z = -Math.PI / 4; // Tilt wing
    rightWing.position.set(0.25, 0, 0); // Position to the right
    birdGroup.add(rightWing);

    return birdGroup;
}

// Array to hold multiple "birds"
const birds = [];

// Create and position multiple birds above the island
for (let i = 0; i < 5; i++) {
    const bird = createBird();
    bird.position.set(
        Math.random() * 10 - 5, // Random x position
        10 + Math.random() * 3, // Random y position (above the island)
        Math.random() * 10 - 5  // Random z position
    );
    bird.speed = 0.02 + Math.random() * 0.02; // Random speed
    bird.amplitude = 1 + Math.random() * 1.5; // Random flight height
    scene.add(bird);
    birds.push(bird);
}

// Function to animate birds
function animateBirds(delta) {
    birds.forEach((bird) => {
        // Move in a circular pattern above the island
        bird.position.x += bird.speed; // Move right
        bird.position.z = Math.sin(Date.now() * 0.002 * bird.speed) * 5; // Circular path
        bird.position.y = 10 + Math.sin(Date.now() * 0.002 * bird.speed) * bird.amplitude; // Oscillate height

        // Reset position if bird flies out of view
        if (bird.position.x > 15) {
            bird.position.x = -15;
        }
    });
}





// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Time elapsed since last frame
    animateBirds(delta); // Update bird animations
    
    if (settings.spin) {
        islandGroup.rotation.y += 0.01;
    }

    orbit.update();
    renderer.render(scene, camera);
}

animate()