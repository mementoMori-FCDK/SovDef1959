import Chart from 'chart.js/auto';
import loaders from "./loaders.js"

const {GenerateInfo, LoadProduction} = loaders;

async function DrawPieChart(prodRegion) {
  let prodDict = await GenerateInfo(prodRegion)
  .then(data => prodDict = data).catch(error => console.log(error));
  console.log(prodDict);
}

const data = {
    labels: [
      'Red',
      'Blue',
      'Yellow'
    ],
    datasets: [{
      label: 'My First Dataset',
      data: [300, 50, 100],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
};

const options = {
    responsive: true
}

const config = {
    type: 'doughnut',
    data: data,
    options: options,
};

//const pieChart = new Chart($('#production-pie'), config);

export default DrawPieChart;