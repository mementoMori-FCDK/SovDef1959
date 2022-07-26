const loadRegions = async () => {
    try{
      const response = await fetch('/map.geojson', {
        method: 'GET'
      });
      if(response.ok) {
        return await response.json();
      }
      else throw new Error('file not found');
    }catch(error) {
      console.log(error);
    }
  };

  const loadProduction = async (ProdRegion) => {
    try{
      const response = await fetch(`/${ProdRegion}.json`);
      if(response.ok) {
        return await response.json();
      }
      else throw new Error('file not found');
    }catch(error) {
      console.log(error);
    }
  };

  async function GenerateInfo(ProdRegion) {
    let arr = await loadProduction(ProdRegion)
    .then(data => arr = data).catch(error => console.log(error));

    let tabs = new Set();

    arr.forEach(element => {
      if(!tabs.has(element.type)) tabs.add(element.type);
    });

    console.log(tabs);
  };

  async function GenerateTable(ProdRegion){
    let arr = await loadProduction(ProdRegion)
    .then(data => arr = data).catch(error => console.log(error));

    let row, table, col = undefined;
    table = document.getElementById('flex-table');
    try{
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
    } catch(error){
      console.log(error);
    }
  };

const resources = {
  GenerateTable: GenerateTable,
  GenerateInfo: GenerateInfo,
  LoadRegions: loadRegions,
  LoadProduction: loadProduction
};

export default resources;
