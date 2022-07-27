import Chart from 'chart.js/auto';
import loaders from "./loaders.js"
import * as d3 from "d3";

const {GenerateInfo, LoadProduction} = loaders;

function calculatePoint(i, intervalSize, colorRangeInfo) {
  var { colorStart, colorEnd, useEndAsStart } = colorRangeInfo;
  return (useEndAsStart
    ? (colorEnd - (i * intervalSize))
    : (colorStart + (i * intervalSize)));
}

function interpolateColors(dataLength, colorScale, colorRangeInfo) {
  var { colorStart, colorEnd } = colorRangeInfo;
  var colorRange = colorEnd - colorStart;
  var intervalSize = colorRange / dataLength;
  var i, colorPoint;
  var colorArray = [];

  for (i = 0; i < dataLength; i++) {
    colorPoint = calculatePoint(i, intervalSize, colorRangeInfo);
    colorArray.push(colorScale(colorPoint));
  }

  return colorArray;
}

async function DrawPieChart(prodRegion) {
  let prodDict = await GenerateInfo(prodRegion)
  .then(data => prodDict = data).catch(error => console.log(error));
  
  const dataLength = Object.keys(prodDict).length;

  const colorRangeInfo = {
    colorStart: 0,
    colorEnd: 1,
    useEndAsStart: false,
  };

  let colors = interpolateColors(dataLength, d3.interpolateInferno, colorRangeInfo);
  console.log(colors);

  const data = {
    labels: Object.keys(prodDict),
    datasets: [{
      label: `${prodRegion} Production Pie Chart`,
      data: Object.values(prodDict),
      backgroundColor: colors,
      hoverOffset: 4
    }]
  };

  const options = {
    responsive: true
  };

  const config = {
    type: 'doughnut',
    data: data,
    options: options,
  };

  const pieChart = new Chart($('#production-pie'), config);
}

export default DrawPieChart;