// js/globe.js
// Voor didactisch gebruik aangepast door Robbe Wulgaert,
// Sint-Lievenscollege Gent / AI in de Klas.
// Niet verspreiden zonder naamsvermelding.

import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

let scene, camera, renderer, globe;
const markerGroup = new THREE.Group();
const feedbackGroup = new THREE.Group();
let currentMarker = null;

/**
 * Initialiseer de 3D-globe in de #globe-canvas container.
 */
export function initGlobe() {
  // Scene & camera
  scene = new THREE.Scene();
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

  // Globe
  globe = new ThreeGlobe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .globeRadius(100);
  scene.add(globe);

  // Marker- en feedback-groepen
  scene.add(markerGroup);
  scene.add(feedbackGroup);

  // Resize-handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start animatie­loop
  (function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0005; // langzaam ronddraaien
    renderer.render(scene, camera);
  })();
}

/**
 * Zet een gok-marker op de globe bij gegeven lat/lng.
 * @param {{lat:number, lng:number}} latLng
 */
export function placeMarker(latLng) {
  // Verwijder oude
  if (currentMarker) {
    markerGroup.remove(currentMarker);
    currentMarker.geometry.dispose();
    currentMarker.material.dispose();
    currentMarker = null;
  }

  const { x, y, z } = latLngToVector3(latLng.lat, latLng.lng, globe.globeRadius());
  const geom = new THREE.SphereGeometry(2, 16, 16);
  const mat  = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  currentMarker = new THREE.Mesh(geom, mat);
  currentMarker.position.set(x, y, z);
  markerGroup.add(currentMarker);
}

/**
 * Verplaats de bestaande marker (bij drag).
 * @param {{lat:number, lng:number}} latLng
 */
export function moveMarker(latLng) {
  if (!currentMarker) return;
  const { x, y, z } = latLngToVector3(latLng.lat, latLng.lng, globe.globeRadius());
  currentMarker.position.set(x, y, z);
}

/**
 * Toon de echte locatie en verbind deze met de gok met een lijn.
 * @param {{lat:number, lng:number}} trueLatLng
 * @param {{lat:number, lng:number}} guessLatLng
 */
export function flipToFeedback(trueLatLng, guessLatLng) {
  // Maak feedbackGroup leeg
  feedbackGroup.clear();

  // Echte locatie-marker (groen)
  const { x: xT, y: yT, z: zT } = latLngToVector3(trueLatLng.lat, trueLatLng.lng, globe.globeRadius());
  const trueGeom = new THREE.SphereGeometry(2, 16, 16);
  const trueMat  = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const trueMarker = new THREE.Mesh(trueGeom, trueMat);
  trueMarker.position.set(xT, yT, zT);
  feedbackGroup.add(trueMarker);

  // Lijn van gok naar echt (geel)
  const { x: xG, y: yG, z: zG } = latLngToVector3(guessLatLng.lat, guessLatLng.lng, globe.globeRadius());
  const points = [];
  points.push(new THREE.Vector3(xG, yG, zG));
  points.push(new THREE.Vector3(xT, yT, zT));
  const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat  = new THREE.LineBasicMaterial({ color: 0xffff00 });
  const line     = new THREE.Line(lineGeom, lineMat);
  feedbackGroup.add(line);
}

/**
 * Converteer lat/lng naar 3D-coordinate op een bol met gegeven radius.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius
 * @returns {{x:number,y:number,z:number}}
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
