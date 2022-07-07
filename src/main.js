import "./style.css";
import "./reset.css";
import "./assets/map.geojson";
import "./assets/Kyiv.json";
import loaders from "./loaders.js"

const {GenerateInfo, loadRegions, loadProduction} = loaders;
let currentLayer = L.layerGroup();

var map = L.map('map', {
  zoomControl: false
}).setView([49.98964246591577, 36.23222351074219], 4);

var tiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);

let regionsJSON = await loadRegions().then(data => regionsJSON = data);
let regionsLayer = L.geoJSON(regionsJSON, {
  style: function(geoJsonFeature){ 
    return {
      color: '#87ceeb',
      fillOpacity: 0.1
    };
  },
  onEachFeature: function(feature, layer) {
    let html = undefined;
    if(feature.properties.republic === "Ukraine") {
      html = '<h1>' + feature.properties.name + ' Regional Economic Soviet' + '</h1>';
    } else {
      html = '<h1>' + feature.properties.name + '</h1>';
    }
    layer.bindPopup(html);
    layer.on('click', function(){
      let currentRegion = feature.properties.name;
      map.removeLayer(currentLayer);
      console.log('check')
      highlightConsumers(currentRegion);
      GenerateInfo(currentRegion);
    });
    layer.on('mouseover', () => {
      $('#current-region').val(feature.properties.name);
    });
    layer.on('mouseout', () => {
      $('#current-region').val('');
    });
  }
}).addTo(map);

const highlightConsumers = async (region) => {
  let consumers = new Set();
  let data = await loadProduction(region);
  data.forEach(entry => {
    if(entry.consumer === 'inbound') {
      consumers.add(region);
    } else consumers.add(entry.consumer);
  });
  regionsLayer.eachLayer(function(layer) {
    if(consumers.has(layer.feature.properties.name)) {
      currentLayer.addLayer(layer);
    }
  });
  map.removeLayer(regionsLayer);
  map.addLayer(currentLayer);
};
