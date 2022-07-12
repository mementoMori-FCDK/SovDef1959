import "./style.css";
import "./reset.css";
import "./assets/map.geojson";
import "./assets/Kyiv.json";
import loaders from "./loaders.js"
const {GenerateInfo, loadRegions, loadProduction} = loaders;

/**
 * jquery selectors
 */
let table = $('#flex-table');

//array to filter the highlighted regions
const producers = ["Kyiv", "Odesa", "Lviv", "Mykolaiv", "Dnipro", "Zaporizhia", "Kherson", "Vinnytsia", "Donets'k", "Luhans'k", "Kharkiv"];
// cuurent consumers highlighted
let consumersLayer = L.featureGroup();

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
      if(producers.includes(currentRegion)) {
        highlightConsumers(currentRegion);
        GenerateInfo(currentRegion);
      }
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
  let features = [];
  let data = await loadProduction(region);
  try{
    data.forEach(entry => {
      if(entry.consumer === 'inbound') {
        consumers.add(region);
      } else consumers.add(entry.consumer);
    });
    
    //!!!
    //populate new layer with L.geoJSON and FILTER option
    //!!!
    //set map view
    
    map.flyTo(map.getCenter(), 4);
    //replace the layers
    regionsLayer.remove();
    consumersLayer.addTo(map);
    console.log('check end');

  }catch(error) {
    console.log(error);
  }
};

const consumersPopup = () => {
  return L.popup().setContent('test');
};

/**
 * resets the interface to its initial state
 * replaces the table with the placeholder 
 */
const resetView = () => {
  //remove consumers layer
  consumersLayer.remove();
  //delete the generated rows
  let $header = $('.header');
  $header.siblings().remove();
  //replace with the base layer
  regionsLayer.addTo(map);
}

$('#map-reset').on('click', resetView);