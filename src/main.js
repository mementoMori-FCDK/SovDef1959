import "./style.css";
import "./reset.css";
import "./assets/map.geojson";
import "./assets/Kyiv.json";
import loaders from "./loaders.js"
const {GenerateInfo, loadRegions, loadProduction} = loaders;

/**
 * jquery selectors
 */
let $table = $('#flex-table');
let $welcome = $('.welcome');
let $resList = $('#res-list');

//array to filter the highlighted regions
const producers = ["Kyiv", "Odesa", "Lviv", "Mykolaiv", "Dnipro", "Zaporizhia", "Kherson", "Vinnytsia", "Donets'k", "Luhans'k", "Kharkiv"];
// cuurent consumers highlighted
const center = [49.98964246591577, 36.23222351074219];
let currentLayer = undefined;
let defaultStyle = {
  color: '#87ceeb',
  fillOpacity: 0.1
};
let hoverStyle ={
  color: '#ff7d00',
  fillOpacity: 0.5
};

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
      let $listElement =$('<a></a>').text(`${feature.properties.name}`);
      $listElement.addClass('list-element');
      $resList.append($listElement);
    }
  } else {
    let $listElement =$('<a></a>').text(`${feature.properties.name}`);
    $listElement.addClass('list-element');
    $resList.append($listElement);
  }
};

async function baseLayerClickHandler(regionName) {
  if(producers.includes(regionName)) {
    $table.show();
    $welcome.hide();
    currentLayer = await highlightConsumers(regionName);
    GenerateInfo(regionName);
  }
};


let regionsJSON = await loadRegions().then(data => regionsJSON = data);
let regionsLayer = L.geoJSON(regionsJSON, {
  style: defaultStyle,
  onEachFeature: function(feature, layer) {
    setDropdown(feature, true);
    layer.on('click', async function(){
      baseLayerClickHandler(feature.properties.name);
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
  let data = await loadProduction(region);
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

    $('.list-element').on('mouseover', (e) => {
      let dropdownOption = e.target.innerText;
      let layers = currentLayer.getLayers();
      layers.forEach(function(layer) {
        if(layer.feature.properties.name === dropdownOption){
          console.log(layer);
          layer.fire('mouseover');
        }
      });
    });
    
    $('.list-element').on('mouseout', (e) => {
      let dropdownOption = e.target.innerText;
      let layers = currentLayer.getLayers();
      layers.forEach(function(layer) {
        if(layer.feature.properties.name === dropdownOption){
          layer.fire('mouseout');
        }
      });
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
  }catch(error) {
    console.log(error);
  }
};

/**
 * resets the interface to its initial state
 * replaces the table with the placeholder
 */
const resetView = () => {
  //remove currentLayer from the map
  if(currentLayer !== undefined){
    currentLayer.remove();
    currentLayer = undefined;
  }
  // reset dropdown
  $resList.empty();
  //toggle welcome div
  $welcome.show();
  //toggle info table
  $table.hide();
  //delete generated rows
  let $header = $('.header');
  if($header !== undefined)
    $header.siblings().remove();
  //replace with the base layer
  regionsLayer.addTo(map);
  regionsLayer.eachLayer(function(layer) {
    setDropdown(layer.feature, true);
  });

  $('.list-element').on('click', (e) => {
    console.log('dropdown select');
    baseLayerClickHandler(e.target.innerText);
  });
  
  $('.list-element').on('mouseover', (e) => {
    let dropdownOption = e.target.innerText;
    let layers = regionsLayer.getLayers();
    layers.forEach(function(layer) {
      if(layer.feature.properties.name === dropdownOption){
        layer.fire('mouseover');
      }
    });
  });
  
  $('.list-element').on('mouseout', (e) => {
    let dropdownOption = e.target.innerText;
    let layers = regionsLayer.getLayers();
    layers.forEach(function(layer) {
      if(layer.feature.properties.name === dropdownOption){
        layer.fire('mouseout');
      }
    });
  });

  console.log($resList);
  map.flyTo(center, 5, {
    animate: true,
    duration: 0.5
  });
};

$('#map-reset').on('click', resetView);

$('.list-element').on('click', (e) => {
  console.log('dropdown select');
  baseLayerClickHandler(e.target.innerText);
});

$('.list-element').on('mouseover', (e) => {
  let dropdownOption = e.target.innerText;
  let layers = regionsLayer.getLayers();
  layers.forEach(function(layer) {
    if(layer.feature.properties.name === dropdownOption){
      layer.fire('mouseover');
    }
  });
});

$('.list-element').on('mouseout', (e) => {
  let dropdownOption = e.target.innerText;
  let layers = regionsLayer.getLayers();
  layers.forEach(function(layer) {
    if(layer.feature.properties.name === dropdownOption){
      layer.fire('mouseout');
    }
  });
});
