import loaders from './loaders';

const {GenerateInfo} = loaders;

let iconWidth = '25px';
let iconHeight = '25px';
let iconWidthLow = '15px';
let iconHeightLow = '15px';

const producers = {
    "Kyiv": [50.450001, 30.523333],
    "Odesa": [46.4405856,  29.0831283],
    "Dnipro": [48.566921, 34.1118983],
    "Donets'k": [47.9257046, 38.1957157],
    "Kharkiv": [49.7952095, 36.5920395],
    "Luhans'k": [48.966163, 39.001870],
    "Lviv": [49.842957, 24.031111],
    "Vinnytsia": [49.233083, 28.468217],
    "Zaporizhia": [47.8388, 35.139567],
    "Kherson": [47.0660367, 33.209167]
};

let prodTypesByProducer = {};
let productionTypes = new Set();

async function LoadTypes() {
    await Promise.all(Object.keys(producers).map(async (producer) => {
        let dict = await GenerateInfo(producer)
        .then(data => dict = data).catch(error => console.log(error));
        Object.keys(dict).forEach(type => productionTypes.add(type));
    }));
    return productionTypes;
}

async function GenerateLegendOverlay() {
    await LoadTypes();
    let column = $('#right');
    let iconHtml = '';
    let iconNames = Array.from(productionTypes);
    let counter = 0;
    iconNames.forEach((iconName) => {
        if(counter === iconNames.length/2){
            column = $('#left');
            counter = 0;
        }
        iconHtml = `<div><img src='${iconName}.svg' width=${iconWidth} height=${iconHeight}/> 
        - ${iconName}</div>`
        column.append(iconHtml);
        counter++;
    });
}

async function GenerateProductionTypes() {
    await Promise.all(Object.keys(producers).map(async (producer) => {
        let dict = await GenerateInfo(producer)
        .then(data => dict = data).catch(error => console.log(error));
        let dictValues = Object.values(dict);
        dictValues = dictValues.sort((a, b) => {return b - a}).slice(0, 2);
        let prod1, prod2;
        prod1 = Object.keys(dict).find(function(key){
            return dict[key] === dictValues[0];
        });
        if (dictValues.length > 1) {
            prod2 = Object.keys(dict).find(function(key){
                return dict[key] === dictValues[1];
            });
        }
    prodTypesByProducer[producer] = prod2 ? [prod1, prod2] : [prod1];
        console.log(prodTypesByProducer[producer]);
    }));
}

function FormHtml(typesArr) {
    let html = "<div style='display: flex'>"
    typesArr.forEach((type) => {
        html += `<img src='${type}.svg' width=${iconWidth} height=${iconHeight}/>`
    });
    html += "</div>";
    return html;
};

function FormHtmlLow() {
    return `<div style='display: flex'><img src='zoom.svg' width=${iconWidthLow} height=${iconHeightLow}/></div>`;
}

function GenerateMarker(producer, lowZoom) {
    let typesArr  = prodTypesByProducer[producer];
    let icon = undefined;
    //create leaflet icon
    if(!lowZoom) {
        icon = L.divIcon({
            html: FormHtml(typesArr),
            iconSize: [typesArr.lenght * iconWidth, iconHeight],
            iconAnchor: [(typesArr.lenght * iconWidth)/2, iconHeight]
        });
    } else {
        icon = L.divIcon({
            html: FormHtmlLow(),
            iconSize: [iconWidth, iconHeight],
            iconAnchor: [iconWidth/2, iconHeight]
        })
    }
    let lat = producers[producer][0];
    let long = producers[producer][1];
    let marker = L.marker([lat, long], {icon: icon});
    return marker;
}

//creates divIcon layer
async function GenerateLayer(lowZoom) {
    await GenerateProductionTypes();
    let markers = [];
    Object.keys(producers).forEach(producer => {
        markers.push(lowZoom ?
            GenerateMarker(producer, true) : GenerateMarker(producer, false))
    });
    let iconLayer = L.featureGroup(markers);
    return iconLayer;
}

const resources = {
    GenerateLayer,
    LoadTypes,
    GenerateLegendOverlay
};

export default resources;
