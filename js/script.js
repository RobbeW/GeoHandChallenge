import { vragen }                  from './data.js';
import { initGestures, onGesture } from './gestures.js';
import {
  initGlobe,
  placeMarker,
  moveMarker,
  flipToFeedback,
  camera,
  renderer,
  globe
} from './globe.js';
import * as THREE from 'three';
import ThreeGlobe  from 'three-globe';


let currentQuestionIndex = 0;
let currentTeam          = 'red';
let guessLatLng          = null;
let countdownTimer       = null;

// DOM references…
const statusEl       = document.getElementById('status');
const questionBanner = document.getElementById('question-banner');
const redOverlay     = document.getElementById('team-red-overlay');
const blueOverlay    = document.getElementById('team-blue-overlay');
const countdownBar   = document.getElementById('countdown-bar');
const videoElement   = document.getElementById('webcam');

function startGame() {
  statusEl.textContent = 'Initialiseren…';
  initGestures(videoElement);
  initGlobe();
  setupGestures();
  showQuestion();
  statusEl.textContent = '';
}
document.addEventListener('DOMContentLoaded', startGame);

function showQuestion() {
  const q = vragen[currentQuestionIndex];
  questionBanner.textContent = `Vind: ${q.label}`;
  toggleTeamOverlay();
  startCountdown(30000);
}
function toggleTeamOverlay() {
  redOverlay.style.opacity  = currentTeam === 'red'  ? '1' : '0';
  blueOverlay.style.opacity = currentTeam === 'blue' ? '1' : '0';
}

function startCountdown(durationMs) {
  clearInterval(countdownTimer);
  countdownBar.style.width = '100%';
  countdownBar.classList.add('pulsing');
  const start = Date.now();
  countdownTimer = setInterval(() => {
    const elapsed = Date.now() - start;
    const frac    = Math.max(0, 1 - elapsed/durationMs);
    countdownBar.style.width = `${frac*100}%`;
    if (elapsed >= durationMs) {
      clearInterval(countdownTimer);
      countdownBar.classList.remove('pulsing');
      confirmGuess();
    }
  }, 50);
}

function setupGestures() {
  onGesture('point', ({ xNorm, yNorm }) => {
    if (!guessLatLng) {
      guessLatLng = screenToLatLng(xNorm, yNorm);
      placeMarker(guessLatLng);
      statusEl.textContent = 'Gok geplaatst';
    }
  });

  onGesture('pinch', ({ xNorm, yNorm }) => {
    if (guessLatLng) {
      guessLatLng = screenToLatLng(xNorm, yNorm);
      moveMarker(guessLatLng);
    }
  });

  onGesture('thumbsUp', confirmGuess);
  onGesture('clap',     showHint);
  onGesture('swipe',    ({ direction }) => {
    if (direction === 'right') nextRound();
  });
}

function confirmGuess() {
  clearInterval(countdownTimer);
  countdownBar.classList.remove('pulsing');
  const trueLoc = vragen[currentQuestionIndex];
  flipToFeedback(trueLoc, guessLatLng || { lat:0, lng:0 });
  statusEl.textContent = 'Afstand berekenen…';
  setTimeout(() => {
    const distKm = haversine(
      trueLoc.lat, trueLoc.lng,
      (guessLatLng||{}).lat, (guessLatLng||{}).lng
    ).toFixed(1);
    statusEl.textContent = `Team ${currentTeam} zat ${distKm} km van de waarheid.`;
  }, 1000);
}

function nextRound() {
  guessLatLng = null;
  statusEl.textContent = '';
  questionBanner.textContent = '';
  currentQuestionIndex = (currentQuestionIndex+1)%vragen.length;
  currentTeam = currentTeam==='red' ? 'blue':'red';
  showQuestion();
}

function showHint() {
  statusEl.textContent = 'Hint: …';
  // TODO: overlay met continent/vlag
}

function screenToLatLng(xNorm, yNorm) {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = {
    x: (xNorm*rect.width + rect.left)/rect.width*2 -1,
    y:-((yNorm*rect.height+rect.top)/rect.height)*2 +1
  };
  const ray = new THREE.Raycaster();
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObject(globe.globeMesh||globe);
  if (hits.length) {
    const {x,y,z} = hits[0].point;
    return vectorToLatLng(x,y,z);
  }
  return {lat:0,lng:0};
}

function vectorToLatLng(x,y,z) {
  const r   = globe.globeRadius();
  const lat = 90 - (Math.acos(y/r)*180/Math.PI);
  const lng = ((Math.atan2(z,-x)*180/Math.PI)+180)%360 -180;
  return {lat,lng};
}

function haversine(lat1,lon1,lat2,lon2){
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2 +
          Math.cos(lat1*Math.PI/180) *
          Math.cos(lat2*Math.PI/180) *
          Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
