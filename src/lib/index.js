import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import TWEEN from 'three-tween';

const scene = new THREE.Scene();
scene.background = backgroundTexture();
const bufferArrays = [];
let current = 0;

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);


const manager = new THREE.LoadingManager();
manager.onStart = (url, itemsLoaded, itemsTotal) => {
    console.log('onStart', 'url');
}

manager.onLoad = () => {
    console.log('onLoad');
    console.log(bufferArrays);
    transition();
}

manager.onError = (url) => {
    console.log('onError', url);
}

const gltfLoader = new GLTFLoader(manager);
loadTexture();


// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);
const geometry = new THREE.BufferGeometry();
geometry.tween = [];
const vertices = [];

for (let i = 0; i < 26016; i++) {
    const position = THREE.MathUtils.randFloat(-4, 4);
    geometry.tween.push(new TWEEN.Tween({ position }).easing(TWEEN.Easing.Exponential.In));
    vertices.push(position);
}

geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.032,
    map: new THREE.TextureLoader().load('white-dot.png'),
    alphaTest: 0.1,
    opacity: 0.5,
    transparent: true,
    depthTest: true,
}));

scene.add(points);
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

window.addEventListener('resize', onWidthResize, false);

document.body.appendChild(renderer.domElement);

render();

function onWidthResize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
}

function render() {
    points.rotation.x += 0.001;
    points.rotation.y += 0.002;
    points.rotation.z += 0.003;
    TWEEN.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function backgroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, innerWidth, 0);
    gradient.addColorStop(0, '#4e22b7');
    gradient.addColorStop(1, '#3292ff');
    context.fillStyle = gradient;
    context.fillRect(0, 0, innerWidth, innerHeight);
    const canvasTexture = new THREE.CanvasTexture(canvas);
    return canvasTexture;
}

function loadTexture() {
    ['box.glb', 'box1.glb', 'sphere.glb'].forEach(load);
}

function load(url) {
    gltfLoader.load(url, (gltf) => {
        gltf.scene.traverse(child => {
            if (child.isMesh) {
                if (url === 'box1.glb') {
                    child.geometry.scale(0.5, 0.5, 0.5);
                    child.geometry.translate(0, 0, 1);
                }
                if (url === 'sphere.glb') child.geometry.translate(1, 0, 0);
                if (url === 'box.glb') child.geometry.translate(0, 1, 0);
                const { array } = child.geometry.attributes.position;
                bufferArrays.push(array);
            }
        })
    });
}

function transition() {
    for (let i = 0, j = 0; i < 26016; i++, j++) {
        const item = geometry.tween[i];
        if (j >= bufferArrays[current].length) {
            j = 0;
        }
        item.to({ position: bufferArrays[current][j] }, THREE.MathUtils.randFloat(1000, 4000)).onUpdate(function () {
            geometry.attributes.position.array[i] = this.position;
            geometry.attributes.position.needsUpdate = true;
        }).start();
    }

    setTimeout(() => {
        transition();
    }, 5000);
    current += 1;
    current = current % 3;
}