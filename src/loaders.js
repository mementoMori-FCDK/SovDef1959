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
    let row, table, col = undefined;
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

const resources = {GenerateInfo, loadProduction, loadRegions};
export default resources;