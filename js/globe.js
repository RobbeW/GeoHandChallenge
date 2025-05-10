// js/globe.js
// Voor didactisch gebruik aangepast door Robbe Wulgaert,
// Sint-Lievenscollege Gent / AI in de Klas.
// Niet verspreiden zonder naamsvermelding.

import * as THREE from 'three';
import ThreeGlobe  from 'three-globe';


export let camera, renderer, globe;

const GLOBE_RADIUS = 100;
const markerGroup   = new THREE.Group();
const feedbackGroup = new THREE.Group();
let currentMarker   = null;

/**
 * Initialiseer de 3D-globe in de #globe-canvas container.
 */
export function initGlobe() {
  const scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 300);

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('globe-canvas').appendChild(renderer.domElement);

  // Verlichting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(100, 100, 100);
  scene.add(dirLight);

  // Globe
  globe = new ThreeGlobe()
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .globeRadius(GLOBE_RADIUS);
  scene.add(globe);

  // Marker- en feedback-groepen
  scene.add(markerGroup, feedbackGroup);

  // Responsief
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animatielus
  (function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0005;
    renderer.render(scene, camera);
  })();
}

/**
 * Plaats een gok-marker op de globe.
 */
export function placeMarker(latLng) {
  if (currentMarker) {
    markerGroup.remove(currentMarker);
    currentMarker.geometry.dispose();
    currentMarker.material.dispose();
  }
  const { x, y, z } = latLngToVector3(latLng.lat, latLng.lng, GLOBE_RADIUS);
  currentMarker = new THREE.Mesh(
    new THREE.SphereGeometry(2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  currentMarker.position.set(x, y, z);
  markerGroup.add(currentMarker);
}

/**
 * Versleep de bestaande marker (bij pinch).
 */
export function moveMarker(latLng) {
  if (!currentMarker) return;
  const { x, y, z } = latLngToVector3(latLng.lat, latLng.lng, GLOBE_RADIUS);
  currentMarker.position.set(x, y, z);
}

/**
 * Toon de echte locatie en verbind met de gok.
 */
export function flipToFeedback(trueLatLng, guessLatLng) {
  // Wis vorige feedback
  feedbackGroup.clear();

  // Echte locatie (groen)
  const { x: xt, y: yt, z: zt } =
    latLngToVector3(trueLatLng.lat, trueLatLng.lng, GLOBE_RADIUS);
  const trueMarker = new THREE.Mesh(
    new THREE.SphereGeometry(2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  trueMarker.position.set(xt, yt, zt);
  feedbackGroup.add(trueMarker);

  // Lijn van gok → echt (geel)
  const { x: xg, y: yg, z: zg } =
    latLngToVector3(guessLatLng.lat, guessLatLng.lng, GLOBE_RADIUS);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xg, yg, zg),
      new THREE.Vector3(xt, yt, zt)
    ]),
    new THREE.LineBasicMaterial({ color: 0xffff00 })
  );
  feedbackGroup.add(line);
}

function latLngToVector3(lat, lng, radius) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y:  radius * Math.cos(phi),
    z:  radius * Math.sin(phi) * Math.sin(theta)
  };
}
