import "./style.css";
import "./reset.css";
import "./assets/map.geojson";
import "./assets/Kyiv.json";

var map = L.map('map', {
  zoomControl: false
}).setView([49.98964246591577, 36.23222351074219], 4);

var tiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);

const loadRegions = async () => {
  try{
    const response = await fetch('/map.geojson', {
      method: 'GET'
    });
    const data = await response.json();
    return data;
  }catch(error) {
    console.log(error);
  }
};

const loadProduction = async (ProdRegion) => {
  try{
    const response = await fetch(`/${ProdRegion}.json`);
    const data = await response.json();
    return data;
  }catch(error) {
    console.log(error);
  }
};

async function GenerateInfo(ProdRegion){
  let arr = await loadProduction(ProdRegion).then(data => arr = data);
  console.log(arr);
  let row, table, col = undefined;
  let headers = ['item', 'unit', 'quantity', 'consumer'];
  table = document.getElementById('flex-table');
  arr.forEach(element => {
    row = document.createElement('div');
    row.className = 'row';

    col = document.createElement('div');
    col.className = 'col item';
    col.innerHTML = element.item;
    row.appendChild(col);

    col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = element.unit;
    row.appendChild(col);

    col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = element.quantity;
    row.appendChild(col);

    col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = element.consumer;
    row.appendChild(col);

    table.appendChild(row);
  });
};

GenerateInfo('Kyiv');

let regionsJSON = await loadRegions().then(data => regionsJSON = data);
let regionsLayer = L.geoJSON(regionsJSON, {
  style: function(geoJsonFeature){
    return {
      color: '#87ceeb',
      fillOpacity: 0.1
    };
  },
  onEachFeature: function(feature, layer) {
    let html = '<h1>' + feature.properties.name + ' Regional Economic Soviet' + '</h1>';
    layer.bindPopup(html);
    layer.on('click', function(){
      map.fitBounds(layer.getBounds());
    })
  }
}).addTo(map);
