# GeoHand Challenge

Een hands-free GeoQuiz waarin leerlingen met handtracking (MediaPipe) een 3D-globe (three-globe) bedienen en wereldlocaties raden.

---

## Beschrijving

**GeoHand Challenge** combineert:

- **MediaPipe Hands** voor realtime hand-landmark detectie  
- **Three.js + three-globe** voor een interactieve, roterende wereldbol  
- **Gebaren** (wijzen, knijpen, duim-omhoog, klappen, swipe) om te navigeren, een gok te plaatsen en te bevestigen  
- **Teams-modus** (rood vs. blauw) met transparante overlay  
- **Tijdslimiet** per ronde, visuele aftelbalk  
- **Hints** via klap- of “shrug”-gebaar  
- **Feedback**: na elke gok zie je de echte locatie en de afstand tot je guess

Deze educatieve game sluit perfect aan bij het **AI in de Klas**-project en maakt geografie én basis AI-concepten toegankelijk voor de klas.

---

## 📁 Projectstructuur

GeoHandChallenge/
│
├─ index.html
├─ css/
│ └─ style.css
├─ js/
│ ├─ data.js ← vragenlijst (min. 50 locaties)
│ ├─ gestures.js ← MediaPipe initialisatie & gebarenherkenning
│ ├─ globe.js ← three-globe initialisatie & marker-logica
│ └─ script.js ← spel-state, rondelogica & integratie
├─ assets/
│ └─ hints/ ← afbeeldingen voor continent/vlachsilhouetten
└─ README.md

## Gebruiken: 

Surf met een moderne browser naar: 
https://RobbeW.github.io/GeoHandChallenge/

🛠️ Configuratie en afhankelijkheden

index.html: laadt CSS, MediaPipe-scripts, Three.js, three-globe en eigen modules
css/style.css: kleuren, layout, overlays, animaties
js/data.js: array met locaties (label, lat, lng)
js/gestures.js: registreer point, pinch, thumbsUp, clap, swipe
js/globe.js: initGlobe(), placeMarker(), moveMarker(), flipToFeedback()
js/script.js: startGame(), showQuestion(), countdown, rondelogica, gestuurde acties
📜 Credits & Licentie

MediaPipe Hands (Google)
three.js & three-globe (MIT-licentie)
Ontwikkeld door Robbe Wulgaert, Sint-Lievenscollege Gent / AI in de Klas
Disclaimer: Niet verspreiden zonder naamsvermelding
Met veel plezier en succes in de klas!
