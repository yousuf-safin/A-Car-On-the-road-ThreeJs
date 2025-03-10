import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Orbit Controls (for mouse interaction)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
camera.position.set(0, 2, 5);

// Load Car Model
const loader = new GLTFLoader();
let car;
let wheels = []; // Array to store wheel objects

loader.load('assets/car.glb', function(gltf) {
    car = gltf.scene;
    car.scale.set(1, 1, 1);
    car.position.set(0, 0, 0);

    // Identify wheels
    car.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.name.toLowerCase().includes("wheel")) {
                wheels.push(child);
                console.log("Wheel detected:", child.name);
            }
        }
    });

    scene.add(car);
}, undefined, function(error) {
    console.error("Error loading car model:", error);
});

// Load Road Texture
const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load('assets/road.jpg');
roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(5, 1);

const roadGeometry = new THREE.PlaneGeometry(10, 20);
const roadMaterial = new THREE.MeshStandardMaterial({ map: roadTexture, roughness: 0.8, metalness: 0.2 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

// Car Movement Variables
let carSpeed = 0;
let carRotation = 0;
const maxSpeed = 0.1;
const acceleration = 0.01;
const deceleration = 0.02;
const wheelRadius = 0.3;

// Keyboard Interaction
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            carSpeed = Math.min(carSpeed - acceleration, -maxSpeed);
            break;
        case 'ArrowDown':
            carSpeed = Math.max(carSpeed + acceleration, maxSpeed);
            break;
        case 'ArrowLeft':
            carRotation += 0.02;
            break;
        case 'ArrowRight':
            carRotation -= 0.02;
            break;
        case ' ':
            carSpeed = 0; // Brake when space is pressed
            break;
    }
});

// Camera Movement
const cameraSpeed = 0.1;
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
            camera.position.z -= cameraSpeed;
            break;
        case 's':
            camera.position.z += cameraSpeed;
            break;
        case 'a':
            camera.position.x -= cameraSpeed;
            break;
        case 'd':
            camera.position.x += cameraSpeed;
            break;
    }
});

// Mouse Interaction: Light Rotation
document.addEventListener('mousemove', (event) => {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    directionalLight.position.x = mouseX * 10;
    directionalLight.position.z = mouseY * 10;
});

// Rotate Wheels
function rotateWheels(deltaTime) {
    if (wheels.length > 0) {
        const circumference = 2 * Math.PI * wheelRadius;
        const rotationSpeed = (carSpeed / circumference) * Math.PI * 2;
        wheels.forEach((wheel) => {
            wheel.rotation.z += rotationSpeed * deltaTime;
            console.log(`Wheel Rotating: ${wheel.name}, Speed: ${rotationSpeed}`);
        });
    }
}

// Animation Loop
let clock = new THREE.Clock();
function animate() {
    const deltaTime = clock.getDelta();
    controls.update();
    rotateWheels(deltaTime);

    if (car) {
        car.position.x -= Math.sin(carRotation) * carSpeed;
        car.position.z -= Math.cos(carRotation) * carSpeed;
        car.rotation.y = carRotation;
    }

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// Resize Window Handling
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
