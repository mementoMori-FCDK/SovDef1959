import "./style.css";
import "./reset.css";
import "./assets/map.geoJSON"

var map = L.map('map', {
  zoomControl: false
}).setView([49.98964246591577, 36.23222351074219], 4);

var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

loadJson();

function loadJson() {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', 'map.geojson');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.responseType = 'json';
  xhr.onload = function() {
    if (xhr.status !== 200) return
    L.geoJSON(xhr.response).addTo(map);
    console.log('check');
  };
  xhr.send();
}
