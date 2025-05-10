// js/script.js
// Voor didactisch gebruik aangepast door Robbe Wulgaert,
// Sint-Lievenscollege Gent / AI in de Klas.
// Niet verspreiden zonder naamsvermelding.

import { vragen } from './data.js';
import { initGestures, onGesture } from './gestures.js';
import { initGlobe, placeMarker, moveMarker, flipToFeedback } from './globe.js';

let currentQuestionIndex = 0;
let currentTeam = 'red';             // 'red' of 'blue'
let guessLatLng = null;              // {lat, lng}
let countdownTimer = null;

// DOM-referenties
const statusEl        = document.getElementById('status');
const questionBanner  = document.getElementById('question-banner');
const redOverlay      = document.getElementById('team-red-overlay');
const blueOverlay     = document.getElementById('team-blue-overlay');
const countdownBar    = document.getElementById('countdown-bar');
const videoElement    = document.getElementById('webcam');


// === Initialisatie ===
export function startGame() {
  statusEl.textContent = 'Initialiseren…';
  initGestures(videoElement);
  initGlobe();
  setupGestures();
  showQuestion();
  statusEl.textContent = '';
}

document.addEventListener('DOMContentLoaded', startGame);


// === Vraag-weergave & Team-overlay ===
function showQuestion() {
  const q = vragen[currentQuestionIndex];
  questionBanner.textContent = `Vind: ${q.label}`;
  toggleTeamOverlay();
  startCountdown(30000);  // 30s per ronde
}

function toggleTeamOverlay() {
  if (currentTeam === 'red') {
    redOverlay.style.opacity  = '1';
    blueOverlay.style.opacity = '0';
  } else {
    redOverlay.style.opacity  = '0';
    blueOverlay.style.opacity = '1';
  }
}


// === Countdown ===
function startCountdown(durationMs) {
  clearInterval(countdownTimer);
  countdownBar.style.width = '100%';
  countdownBar.classList.add('pulsing');
  const start = Date.now();

  countdownTimer = setInterval(() => {
    const elapsed = Date.now() - start;
    const frac    = Math.max(0, 1 - elapsed / durationMs);
    countdownBar.style.width = `${frac * 100}%`;
    if (elapsed >= durationMs) {
      clearInterval(countdownTimer);
      countdownBar.classList.remove('pulsing');
      autoConfirm();
    }
  }, 50);
}

function autoConfirm() {
  statusEl.textContent = 'Tijd om!';
  confirmGuess();
}


// === Gebaren koppelen ===
function setupGestures() {
  // Point: zet eerste gok
  onGesture('point', ({ handedness }) => {
    if (!guessLatLng) {
      const normPos = lastPointPosition;  // bepaal in gestures.js de laatste point coords
      guessLatLng = screenToLatLng(normPos.x, normPos.y);
      placeMarker(guessLatLng);
      statusEl.textContent = 'Gok geplaatst';
    }
  });

  // Pinch+move: marker verslepen
  onGesture('pinch', ({ handedness }) => {
    if (guessLatLng) {
      const normPos = lastPointPosition;
      guessLatLng = screenToLatLng(normPos.x, normPos.y);
      moveMarker(guessLatLng);
    }
  });

  // Thumbs-up: bevestig gok
  onGesture('thumbsUp', () => {
    confirmGuess();
  });

  // Clap: toon hint (eventueel continent of vlag)
  onGesture('clap', () => {
    showHint();
  });

  // Swipe: skip of volgende ronde
  onGesture('swipe', ({ direction }) => {
    if (direction === 'right') {
      nextRound();
    }
  });
}


// === Gok bevestigen & feedback ===
function confirmGuess() {
  clearInterval(countdownTimer);
  countdownBar.classList.remove('pulsing');

  const trueLoc = vragen[currentQuestionIndex];
  if (!guessLatLng) {
    // Geen gok geplaatst: gebruik centrum van kaart
    guessLatLng = { lat: 0, lng: 0 };
  }
  flipToFeedback(
    { lat: trueLoc.lat, lng: trueLoc.lng },
    guessLatLng
  );
  statusEl.textContent = `Afstand berekenen…`;

  // Simuleer scoreberekening en toon resultaat
  setTimeout(() => {
    const distKm = haversine(
      trueLoc.lat, trueLoc.lng,
      guessLatLng.lat, guessLatLng.lng
    ).toFixed(1);
    statusEl.textContent = `Team ${currentTeam} zat ${distKm} km van de waarheid.`;
  }, 1000);
}


// === Volgende ronde ===
function nextRound() {
  // Reset
  guessLatLng = null;
  statusEl.textContent = '';
  questionBanner.textContent = '';
  currentQuestionIndex = (currentQuestionIndex + 1) % vragen.length;
  currentTeam = currentTeam === 'red' ? 'blue' : 'red';
  // Globe en markers blijven zichtbaar; markerGroup wordt overschreven
  showQuestion();
}


// === Hints ===
function showHint() {
  // Voeg hier logica toe om een overlay met continent of vlag te tonen
  statusEl.textContent = 'Hint: …';
  // Bijv. document.getElementById('hint-overlay').classList.add('active');
}


// === Hulpfuncties ===
function screenToLatLng(xNorm, yNorm) {
  // Convert normalized [0-1] x/y naar 3D-raycast en lat/lng
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = {
    x: (xNorm * rect.width + rect.left)  / rect.width  * 2 - 1,
    y: -((yNorm * rect.height + rect.top) / rect.height) * 2 + 1
  };
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(globe.globeMesh || globe); 
  if (intersects.length) {
    const { x, y, z } = intersects[0].point;
    return vector3ToLatLng(x, y, z);
  }
  return null;
}

function vector3ToLatLng(x, y, z) {
  const radius = globe.globeRadius();
  const lat  = 90 - (Math.acos(y / radius) * 180 / Math.PI);
  const lng  = (Math.atan2(z, -x) * 180 / Math.PI) - 180;
  return { lat, lng };
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2
          + Math.cos(lat1*Math.PI/180)
            * Math.cos(lat2*Math.PI/180)
            * Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
