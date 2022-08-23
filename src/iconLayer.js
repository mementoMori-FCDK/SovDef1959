import loaders from './loaders';

const {GenerateInfo} = loaders;

const iconWidth = '25px';
const iconHeight = '25px';
const iconWidthLow = '15px';
const iconHeightLow = '15px';
const iconWidthLowInt = 15;
const iconWidthInt = 25;

const producers = {
    "Kyiv": [50.450001, 30.523333],
    "Odesa": [46.440586,  29.083128],
    "Dnipro": [48.566921, 34.111898],
    "Donets'k": [47.925705, 38.195716],
    "Kharkiv": [49.795210, 36.592040],
    "Luhans'k": [48.966163, 39.001870],
    "Lviv": [49.842957, 24.031111],
    "Vinnytsia": [49.233083, 28.468217],
    "Zaporizhia": [47.838800, 35.139567],
    "Kherson": [47.066037, 33.209167]
};

let prodTypesByProducer = {};
let allProdTypesByProducer = {};
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
        //get top 2 production types (by quantity)
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
        // console.log(Object.keys(dict));
        allProdTypesByProducer[producer] = Object.keys(dict);
        prodTypesByProducer[producer] = prod2 ? [prod1, prod2] : [prod1];
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

function GeneratePopupContent(producer){
    let html = '<div>';
    allProdTypesByProducer[producer].forEach((type) => {
        html += `<img src='${type}.svg' width=${iconWidth} height=${iconHeight}/>`;
    });
    html += '</div>';
    return html;
}

function GenerateMarker(producer, lowZoom) {
    let typesArr  = prodTypesByProducer[producer];
    let typesNum = typesArr.length;
    let icon = undefined;
    //create Leaflet icon
    if(!lowZoom) {
        icon = L.divIcon({
            html: FormHtml(typesArr),
            iconSize: [typesArr.lenght * iconWidth, iconHeight],
            iconAnchor: [(typesArr.lenght * iconWidth)/2, iconHeight],
            popupAnchor: [(typesArr.length * iconWidthInt)/2, 0]
        });
    } else {
        icon = L.divIcon({
            html: FormHtmlLow(),
            iconSize: [iconWidth, iconHeight],
            iconAnchor: [iconWidth/2, iconHeight],
            popupAnchor: [iconWidthLowInt/2, 0]
        })
    }
    let lat = producers[producer][0];
    let long = producers[producer][1];
    let popup = L.popup().setContent(GeneratePopupContent(producer)).setLatLng([lat, long]);
    let marker = L.marker([lat, long], {icon: icon});
    marker.bindPopup(popup);
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
    GenerateLegendOverlay
};

export default resources;
