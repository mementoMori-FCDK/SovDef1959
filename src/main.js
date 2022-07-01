import "./style.css";
import "./reset.css";
import "./assets/map.geojson";
import React from "react";

var map = L.map('map', {
  zoomControl: false
}).setView([49.98964246591577, 36.23222351074219], 4);

var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

let regionsJSON = await loadRegions().then(data => regionsJSON = data);
let regionsLayer = L.geoJSON(regionsJSON, {
  style: function(geoJsonFeature){
    return {
      color: '#87ceeb',
      fillOpacity: 0.1
    };
  },
  onEachFeature: function(feature, layer) {
    let html = '<h1>' + feature.properties.name + '</h1>' + '</br>' +
    '<input type="text">';
    layer.bindPopup(html);
  }
}).addTo(map);

