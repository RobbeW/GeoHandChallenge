// js/globe.js
// Voor didactisch gebruik aangepast door Robbe Wulgaert,
// Sint-Lievenscollege Gent / AI in de Klas.
// Niet verspreiden zonder naamsvermelding.

// ESM-imports vanaf unpkg (geen bare specifiers)
import * as THREE    from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import ThreeGlobe    from 'https://unpkg.com/three-globe@2.24.9/dist/three-globe.module.js';


// Exporteer deze variabelen, zodat script.js ze kan importeren
export let camera, renderer, globe;

const markerGroup   = new THREE.Group();
const feedbackGroup = new THREE.Group();
let currentMarker   = null;

/**
 * Initialiseer de 3D-globe in de #globe-canvas container.
 */
export function initGlobe() {
  // Scene
  const scene = new THREE.Scene();

  // Camera (exporteren)
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 300);

  // Renderer (exporteren)
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('globe-canvas').appendChild(renderer.domElement);

  // Globe (exporteren)
  globe = new ThreeGlobe()
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .globeRadius(100);
  scene.add(globe);

  // Marker- en feedback-groepen
  scene.add(markerGroup);
  scene.add(feedbackGroup);

  // Responsief
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animatielus
  (function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0005; // langzaam ronddraaien
    renderer.render(scene, camera);
  })();
}

/**
 * Zet een gok-marker op de globe bij gegeven lat/lng.
 */
export function placeMarker(latLng) {
  if (currentMarker) {
    markerGroup.remove(currentMarker);
    currentMarker.geometry.dispose();
    currentMarker.material.dispose();
  }
  const { x, y, z } = latLngToVector3(latLng.lat, latLng.lng, globe.globeRadius());
  const geom = new THREE.SphereGeometry(2, 16, 16);
  const mat  = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  currentMarker = new THREE.Mesh(geom, mat);
  currentMarker.position.set(x, y, z);
  markerGroup.add(currentMarker);
}

/**
 * Versleep de bestaande marker (bij pinch-move).
 */
export function moveMarker(latLng) {
  if (!currentMarker) return;
  const { x, y, z } = latLngToVector3(latLng.lat, latLng.lng, globe.globeRadius());
  currentMarker.position.set(x, y, z);
}

/**
 * Toon de echte locatie en verbind deze met de gok (lijn).
 */
export function flipToFeedback(trueLatLng, guessLatLng) {
  feedbackGroup.clear();

  // Echte locatie (groen)
  const { x: xT, y: yT, z: zT } = latLngToVector3(trueLatLng.lat, trueLatLng.lng, globe.globeRadius());
  const trueGeom = new THREE.SphereGeometry(2, 16, 16);
  const trueMat  = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const trueMarker = new THREE.Mesh(trueGeom, trueMat);
  trueMarker.position.set(xT, yT, zT);
  feedbackGroup.add(trueMarker);

  // Lijn van gok naar echt (geel)
  const { x: xG, y: yG, z: zG } = latLngToVector3(guessLatLng.lat, guessLatLng.lng, globe.globeRadius());
  const points = [ new THREE.Vector3(xG, yG, zG), new THREE.Vector3(xT, yT, zT) ];
  const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat  = new THREE.LineBasicMaterial({ color: 0xffff00 });
  const line     = new THREE.Line(lineGeom, lineMat);
  feedbackGroup.add(line);
}

/**
 * Converteer lat/lng naar 3D-coordinate op de bol.
 */
function latLngToVector3(lat, lng, radius) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y:  radius * Math.cos(phi),
    z:  radius * Math.sin(phi) * Math.sin(theta)
  };
}
