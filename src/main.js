import "./style.css";
import "./reset.css";
import "./assets/map.geojson";
import loaders from "./loaders.js"
import chartResources from "./pieChart";

//unpack imports
const {LoadRegions, LoadProduction} = loaders;
const {DrawPieChart, DestroyChart} = chartResources;

/**
 * jquery selectors
 */
let $table = $('#flex-table');
let $welcome = $('.welcome');
let $resList = $('#res-list');
let $listElement = $('.list-element');
let $chart = $('.producer-chart');

//array to filter the highlighted regions
const producers = ["Kyiv", "Odesa", "Lviv", "Dnipro", "Zaporizhia", "Kherson", "Vinnytsia", "Donets'k", "Luhans'k", "Kharkiv"];
// cuurent consumers highlighted
const center = [49.98964246591577, 36.23222351074219];
let currentLayer = undefined;
let defaultStyle = {
  color: '#87ceeb',
  fillOpacity: 0.1
};
let hoverStyle = {
  color: '#ff7d00',
  fillOpacity: 0.5
};

//for accets import
const cache = {};

//dynamic import
function importAll(r) {
  r.keys().forEach((key) => (cache[key] = r(key)));
};
importAll(require.context('./assets/', true, /\.json$/));

var map = L.map('map', {
  zoomControl: false
}).setView(center, 5);

var tiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);

/**
 * returns region info string
 * @param feature
 * @returns string with region info
 */
const setRegionInfo = (feature) => {
  if(feature.properties.republic === "Ukraine") {
    return feature.properties.name + ' RES';
  } else {
    return feature.properties.name;
  }
};

const setDropdown = (feature, base) => {
  if(base){
    if(producers.includes(feature.properties.name)) {
      $listElement =$('<a></a>').text(`${feature.properties.name}`);
      $listElement.addClass('list-element');
      $resList.append($listElement);
    }

    $listElement.on('mouseover', (e) => {
      // $('#dropdown-button').
      let dropdownOption = e.target.innerText;
      let layers = regionsLayer.getLayers();  
      layers.forEach(function(layer) {
        if(layer.feature.properties.name === dropdownOption){
          layer.fire('mouseover');
        }
      });
    });
    
    $listElement.on('mouseout', (e) => {
      let dropdownOption = e.target.innerText;
      let layers = regionsLayer.getLayers();
      layers.forEach(function(layer) {
        if(layer.feature.properties.name === dropdownOption){
          layer.fire('mouseout');
        }
      });
    });
  } else {
    $listElement =$('<a></a>').text(`${feature.properties.name}`);
    $listElement.addClass('list-element');
    $resList.append($listElement);

    $listElement.on('mouseover', (e) => {
      let dropdownOption = e.target.innerText;
      let layers = currentLayer.getLayers();  
      layers.forEach(function(layer) {
        if(layer.feature.properties.name === dropdownOption){
          layer.fire('mouseover');
        }
      });
    });
    
    $listElement.on('mouseout', (e) => {
      let dropdownOption = e.target.innerText;
      let layers = currentLayer.getLayers();
      layers.forEach(function(layer) {
        if(layer.feature.properties.name === dropdownOption){
          layer.fire('mouseout');
        }
      });
    });
  }
};

async function BaseLayerClickHandler(regionName) {
  if(producers.includes(regionName)) {
    //$table.show();
    $welcome.hide();
    $chart.show();
    currentLayer = await highlightConsumers(regionName);
    DrawPieChart(regionName);
    //GenerateInfo(regionName);
    //GenerateTable(regionName);
  }
};

let regionsJSON = await LoadRegions().then(data => regionsJSON = data);
export let regionsLayer = L.geoJSON(regionsJSON, {
  style: defaultStyle,
  onEachFeature: function(feature, layer) {
    setDropdown(feature, true);
    layer.on('click', async function(){
      BaseLayerClickHandler(feature.properties.name);
    });
    layer.on('mouseover', () => {
      $('#current-region').val(setRegionInfo(feature));
      layer.setStyle(hoverStyle);
    });
    layer.on('mouseout', () => {
      $('#current-region').val('');
      layer.setStyle(defaultStyle);
    });
  }
  
}).addTo(map);

const highlightConsumers = async (region) => {
  $resList.empty();
  let consumers = new Set();
  let data = await LoadProduction(region);
  try{
    data.forEach(entry => {
      if(entry.consumer === 'inbound') {
        consumers.add(region);
      } else consumers.add(entry.consumer);
    });
    //create new layer
    currentLayer = L.geoJSON(regionsJSON, {
      style: defaultStyle,
      filter: function(geoJsonFeature){
        if(consumers.has(geoJsonFeature.properties.name)) return true;
      },
      onEachFeature: function(feature, layer){
        setDropdown(feature, false);
        layer.on('mouseover', () => {
          $('#current-region').val(setRegionInfo(feature));
          layer.setStyle(hoverStyle);
        });
        layer.on('mouseout', () => {
          $('#current-region').val('');
          layer.setStyle(defaultStyle);
        });
      }
    });

    //set map view
    map.flyTo(center, 4, {
      animate: true,
      duration: 0.5
    });
    //replace the layers
    regionsLayer.remove();
    currentLayer.addTo(map);
    return currentLayer;
  } catch(error) {
    console.log(error);
  }
};

/*
 * resets the interface to its initial state
 * replaces the table with the placeholder
 */
const resetView = () => {
  //remove currentLayer from the map
  if(currentLayer !== undefined) {
    currentLayer.remove();
    currentLayer = undefined;
  }
  // reset dropdown
  $resList.empty();
  //show welcome div
  $welcome.show();
  //hide info table if visible
  if($table.is(":visible")) $table.hide();
  //hide pie chart if visible
  if($chart.is(":visible")) $chart.hide();
  DestroyChart();
  //delete generated rows
  let $header = $('.header');
  if($header !== undefined)
    $header.siblings().remove();
  //replace the map with the base layer
  regionsLayer.addTo(map);
  regionsLayer.eachLayer(function(layer) {
    setDropdown(layer.feature, true);
  });

  $('.list-element').on('click', (e) => {
    BaseLayerClickHandler(e.target.innerText);
  });

  map.flyTo(center, 5, {
    animate: true,
    duration: 0.5
  });
};

$('#map-reset').on('click', resetView);

$('.list-element').on('click', (e) => {
  BaseLayerClickHandler(e.target.innerText);
});
