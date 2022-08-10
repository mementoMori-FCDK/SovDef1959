import loaders from './loaders';

const {GenerateInfo} = loaders;

let iconWidth = '25px';
let iconHeight = '25px';

const producers = {
    "Kyiv": [50.450001, 30.523333],
    "Odesa": [46.4405856,  29.0831283],
    "Dnipro": [48.566921, 34.1118983],
    "Donets'k": [47.9278479, 38.8021476],
    "Kharkiv": [49.7952095, 36.5920395],
    "Luhans'k": [48.966163, 39.001870],
    "Lviv": [49.842957, 24.031111],
    "Vinnytsia": [49.233083, 28.468217],
    "Zaporizhia": [47.8388, 35.139567],
    "Kherson": [47.0660367, 33.209167]
};

let prodTypesByProducer = {};

async function GenerateProductionTypes() {
    await Promise.all(Object.keys(producers).map(async (producer) => {
        let dict = await GenerateInfo(producer)
        .then(data => dict = data).catch(error => console.log(error));
        prodTypesByProducer[producer] = Object.keys(dict);
    }));
};

function FormHtml(typesArr) {
    let html = "<div style='display: flex'>"
    typesArr.forEach((type) => {
        html += `<img src='${type}.svg' width=${iconWidth} height=${iconHeight}/>`
    });
    html += "</div>";
    return html;
};

function GenerateMarker(producer) {
    let typesArr  = prodTypesByProducer[producer];
    //create leaflet icon
    let icon = L.divIcon({
        html: FormHtml(typesArr),
        iconSize: [typesArr.lenght * iconWidth, iconHeight],
        iconAnchor: [(typesArr.lenght * iconWidth)/2, iconHeight]
    });

    let lat = producers[producer][0];
    let long = producers[producer][1];
    let marker = L.marker([lat, long], {icon: icon});
    return marker;
}

async function GenerateLayer() {
    await GenerateProductionTypes();
    let markers = [];
    Object.keys(producers).forEach(producer => {
        markers.push(GenerateMarker(producer));
    });
    let iconLayer = L.featureGroup(markers);
    return iconLayer;
}

const resources = {
    GenerateLayer
};

export default resources;
