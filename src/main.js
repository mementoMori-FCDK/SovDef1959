import "./style.css";
import "./reset.css";
import "./assets/map.geojson";
import loaders from "./loaders.js"
import chartResources from "./pieChart";
import * as d3 from "d3";
import img from "./assets/scheme.png";
import resources from './iconLayer.js';

//unpack imports
const {LoadRegions, LoadProduction} = loaders;
const {DrawPieChart, DestroyChart} = chartResources;
const {GenerateLayer, LoadTypes} = resources;

/**
 * jquery selectors
 */
let $table = $('.tableWrapper');
let $welcome = $('.welcome');
let $resList = $('#res-list');
let $listElement = $('.list-element');
let $chart = $('.producer-chart');
let $colorScheme = $('.colorScheme');
let $schemeImg = $('.schemeImg');         //scheme image source
$schemeImg.attr('src', img);

//array to filter the highlighted regions
const producers = ["Kyiv", "Odesa", "Lviv", "Dnipro", "Zaporizhia", "Kherson", "Vinnytsia", "Donets'k", "Luhans'k", "Kharkiv"];
// cuurent consumers highlighted
const center = [49.065783, 33.410033];
let currentLayer = undefined;
//regions hover styles (default and hover)
let defaultStyle = {
  fillColor: '#87ceeb',
  color: 'skyblue',
  fillOpacity: 0.1
};
let hoverStyle = {
  fillColor: '#ff7d00',
  color: 'orange',
  fillOpacity: 0.5
};

//track low zoom level
let lowZoom = false;
//icon layer variable
let iconLayer = undefined;

//for accets import
const cache = {};

//dynamic import 
function importAll(r) {
  r.keys().forEach((key) => (cache[key] = r(key)));
};
importAll(require.context('./assets/', true, /\.json$/));
importAll(require.context('./assets/', true, /\.svg$/));

var map = L.map('map', {
  zoomControl: false,
  minZoom: 4
}).setView(center, 6);

LoadTypes();

//initialize iconLayer
iconLayer = await GenerateLayer(false)
.then(data => iconLayer = data).catch(error => console.log(error));
iconLayer.addTo(map);

//change iconLayer on zoomend event
map.on('zoomend', async () => {
  if(map.getZoom() <= 5) {
    if (!lowZoom) {
      lowZoom = true;
      iconLayer.remove();
      iconLayer = await GenerateLayer(lowZoom)
      .then(data => iconLayer = data).catch(error => console.log(error));
      iconLayer.addTo(map);
    }
  }
  if (map.getZoom() > 5) {
    if(lowZoom) {
      lowZoom = false;
      iconLayer.remove();
      iconLayer = await GenerateLayer(lowZoom)
      .then(data => iconLayer = data).catch(error => console.log(error));
      iconLayer.addTo(map);
    }
  }
});

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
    $welcome.hide();
    $chart.show();
    DrawPieChart(regionName);
    currentLayer = await highlightConsumers(regionName);
    if($colorScheme.is(":hidden")) $colorScheme.show();
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

function CalculateConsumerWeight(prodArray, region) {
  let dict = {};
  //calculate the number of entries
  prodArray.forEach((item) => {
    if(dict[item.consumer]) {
      dict[item.consumer] += 1;
    } else dict[item.consumer] = 1;
  });
  //replace 'inbound' key with feature name for map coloring
  for(let [key, value] of Object.entries(dict)) {
    if (key === 'inbound') {
      let tmp = dict[key];
      dict[region] = tmp;
      delete dict[key];
    }
  }
  //look for the max consumer
  let max = 0;
  for(const [key, value] of Object.entries(dict)) {
    if (value > max) max = value;
  }
  //interpolate consumers
  for(const [key, value] of Object.entries(dict)) {
    value =  value/max;
    dict[key] = value;
  }
  return dict;
};

/**
 * form a style object for a respective consumer region
 * @param {String} consumerName - the name of the consumer region
 * @param {Object} dict         - the dictionary with consumerName/coloring value pairs
 * @returns style object
 */
function ConsumerStyle (consumerName, dict) {
  return {
    fillColor: d3.interpolateTurbo(dict[consumerName]),
    fillOpacity: 0.6,
    color: d3.interpolateTurbo(dict[consumerName])
  }
};

/**
 * 
 * @param {String} region 
 * @returns a promise
 */
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
    let consumerColors = CalculateConsumerWeight(data, region);

    //create new layer
    currentLayer = L.geoJSON(regionsJSON, {
      style: function(feature) {
        return ConsumerStyle(feature.properties.name, consumerColors)
      },
      filter: function(geoJsonFeature){
        if(consumers.has(geoJsonFeature.properties.name)) return true;
      },
      onEachFeature: function(feature, layer){
        let name = feature.properties.name;
        setDropdown(feature, false);
        layer.on('mouseover', () => {
          $('#current-region').val(setRegionInfo(feature));
          layer.setStyle({
            color: 'black',
            fillOpacity: 1
          })
        });
        layer.on('mouseout', () => {
          $('#current-region').val('');
          layer.setStyle(ConsumerStyle(name, consumerColors));
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
  //hide color scheme
  if($colorScheme.is(":visible")) $colorScheme.hide();
  //remove current chart
  DestroyChart();
  //replace the map with the base layer
  regionsLayer.addTo(map);
  regionsLayer.eachLayer(function(layer) {
    setDropdown(layer.feature, true);
  });
  //reset the info table
  TableClearContent();
  $('.list-element').on('click', (e) => {
    BaseLayerClickHandler(e.target.innerText);
  });

  map.flyTo(center, 6, {
    animate: true,
    duration: 0.5
  });
};

function TableClearContent() {
  //delete generated rows
  let $header = $('.header');
  if($header !== undefined)
    $header.siblings().remove();
};

$('#map-reset').on('click', resetView);
$('#table-map-reset').on('click', resetView);

$('#table-back-to-pie').on('click', () => {
  if($table.is(":visible")) $table.hide();
  TableClearContent();
  $('.producer-chart').show();
});

$('.list-element').on('click', (e) => {
  BaseLayerClickHandler(e.target.innerText);
});
