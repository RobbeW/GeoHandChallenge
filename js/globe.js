// no imports at all – just use the globals THREE and ThreeGlobe

export let camera, renderer, globe;
const GLOBE_RADIUS = 100;
const markerGroup   = new THREE.Group();
const feedbackGroup = new THREE.Group();
let currentMarker   = null;

export function initGlobe() {
  const scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 300);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('globe-canvas').appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl = new THREE.DirectionalLight(0xffffff, 0.8);
  dl.position.set(100, 100, 100);
  scene.add(dl);

  // instantiate IIFE ThreeGlobe and set its radius
  globe = new ThreeGlobe();
  globe.globeImageUrl('https://unpkg.com/three-globe@2.24.9/example/img/earth-blue-marble.jpg');
  globe.globeRadius = GLOBE_RADIUS;        // ← property, not method
  scene.add(globe, markerGroup, feedbackGroup);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  (function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0005;
    renderer.render(scene, camera);
  })();
}

// … placeMarker, moveMarker, flipToFeedback, etc. …


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
