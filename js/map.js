// map.js
// Voor didactisch gebruik aangepast door Robbe Wulgaert, Sint‑Lievenscollege Gent / AI in de Klas. Niet verspreiden zonder naamsvermelding

// Globale variabelen voor map en markers
let map;
let guessMarker = null;
let trueMarker = null;
let pathLine = null;

/**
 * Callback van Google Maps API om de 3D globe te initialiseren.
 */
window.initMap = function() {
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: { lat: 51.0, lng: 10.0 },
    zoom: 3,
    mapId: 'YOUR_MAP_ID',   // Vervang door jouw Map ID
    tilt: 67,
    heading: 0,
    mapTypeId: 'satellite',
    disableDefaultUI: true,
    gestureHandling: 'none'
  });
};

/**
 * Toon de globe over de webcam.
 */
export function showGlobe() {
  document.getElementById('map-canvas').style.display = 'block';
}

/**
 * Verberg de globe.
 */
export function hideGlobe() {
  document.getElementById('map-canvas').style.display = 'none';
}

/**
 * Plaats of verplaats de gok-marker op de globe.
 * @param {{lat: number, lng: number}} latLng
 */
export function placeMarker(latLng) {
  if (!guessMarker) {
    guessMarker = new google.maps.Marker({
      position: latLng,
      map,
      title: 'Jouw gok'
    });
  } else {
    guessMarker.setPosition(latLng);
  }
}

/**
 * Verplaats de bestaande gok-marker (alias placeMarker gebruiken).
 * @param {{lat: number, lng: number}} latLng
 */
export function moveMarker(latLng) {
  if (guessMarker) guessMarker.setPosition(latLng);
}

/**
 * Toon de echte locatie en verbind lijnen tussen gok en echt.
 * @param {{lat: number, lng: number}} trueLatLng
 */
export function flipToFeedback(trueLatLng) {
  // Plaats echte locatie
  trueMarker = new google.maps.Marker({
    position: trueLatLng,
    map,
    title: 'Echte locatie',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#FFFF00',
      fillOpacity: 1,
      strokeColor: '#000',
      strokeWeight: 2
    }
  });

  // Teken lijn tussen gok en echt
  if (guessMarker) {
    if (pathLine) pathLine.setMap(null);
    pathLine = new google.maps.Polyline({
      path: [guessMarker.getPosition(), trueMarker.getPosition()],
      map,
      strokeColor: '#FF0000',
      strokeOpacity: 0.7,
      strokeWeight: 2
    });
  }

  // Zoom uit en centreer beide punten
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(guessMarker.getPosition());
  bounds.extend(trueMarker.getPosition());
  map.fitBounds(bounds);
}
