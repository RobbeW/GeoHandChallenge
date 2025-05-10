// js/gestures.js
// Voor didactisch gebruik aangepast door Robbe Wulgaert,
// Sint-Lievenscollege Gent / AI in de Klas.
// Niet verspreiden zonder naamsvermelding.

const gestureListeners = {
  pinch: [],
  point: [],
  thumbsUp: [],
  clap: [],
  swipe: []
};

/**
 * Registreer een callback voor een bepaald gebaar.
 * @param {string} type – 'pinch' | 'point' | 'thumbsUp' | 'clap' | 'swipe'
 * @param {Function} callback – ontvangt een object met details (bv. handedness, direction)
 */
export function onGesture(type, callback) {
  if (gestureListeners[type]) {
    gestureListeners[type].push(callback);
  }
}

/**
 * Initialiseer MediaPipe Hands en start de camera.
 * @param {HTMLVideoElement} videoElement – het <video>-element met de webcam-feed
 */
export async function initGestures(videoElement) {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  hands.onResults(onResults);

  const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 1280,
    height: 720
  });
  camera.start();
}

// Hulpmiddelen voor gebaar-detectie
let lastPalmX = {};
const lastGestureTime = {};

/**
 * Interne callback bij nieuwe resultaten van MediaPipe Hands.
 */
function onResults(results) {
  const now = Date.now();
  if (!results.multiHandLandmarks) return;

  // Per hand: detecteer pinch, point en thumbsUp
  results.multiHandLandmarks.forEach((landmarks, idx) => {
    const handedness = results.multiHandedness[idx].label; // 'Left' of 'Right'

    const thumbTip  = landmarks[4];
    const indexTip  = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip   = landmarks[16];
    const pinkyTip  = landmarks[20];

    // Bereken afstand thumb–index
    const pinchDist = Math.hypot(
      thumbTip.x - indexTip.x,
      thumbTip.y - indexTip.y
    );
    if (pinchDist < 0.05) trigger('pinch', { handedness });

    // Point: index verlengd, andere vingers gevouwen
    const indexExtended = Math.hypot(indexTip.x - landmarks[6].x, indexTip.y - landmarks[6].y) > 0.1;
    const othersFolded  =
      (middleTip.y > landmarks[10].y) &&
      (ringTip.y   > landmarks[14].y) &&
      (pinkyTip.y  > landmarks[18].y);
    if (indexExtended && othersFolded) {
      trigger('point', { handedness });
    }

    // ThumbsUp: duim omhoog, andere vingers gevouwen
    const thumbUp      = thumbTip.y < landmarks[3].y;
    if (thumbUp && othersFolded) {
      trigger('thumbsUp', { handedness });
    }
  });

  // Clap: twee handen en palmen dicht bij elkaar
  if (results.multiHandLandmarks.length === 2) {
    const palm0 = results.multiHandLandmarks[0][0];
    const palm1 = results.multiHandLandmarks[1][0];
    const distPalms = Math.hypot(palm0.x - palm1.x, palm0.y - palm1.y);
    if (distPalms < 0.1) {
      trigger('clap', {});
    }
  }

  // Swipe: snelle horizontale beweging per hand
  results.multiHandLandmarks.forEach((landmarks, idx) => {
    const palm = landmarks[0]; // gebruik landmark 0 (pols) als palm proxy
    if (lastPalmX[idx] != null) {
      const dx = palm.x - lastPalmX[idx];
      const dt = (now - (lastGestureTime[`swipe-${idx}`] || now)) / 1000;
      const velocity = Math.abs(dx / dt);
      if (velocity > 1.5) {
        trigger('swipe', { direction: dx > 0 ? 'right' : 'left' });
        lastGestureTime[`swipe-${idx}`] = now;
      }
    }
    lastPalmX[idx] = palm.x;
  });
}

/**
 * Interne trigger-functie: roept alle geregistreerde callbacks aan.
 */
function trigger(name, detail) {
  const now = Date.now();
  // throttle per gebaar: ten minste 500ms tussen twee calls
  if (lastGestureTime[name] && now - lastGestureTime[name] < 500) return;
  lastGestureTime[name] = now;
  gestureListeners[name].forEach(cb => cb(detail));
}
