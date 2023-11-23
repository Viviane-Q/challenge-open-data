const mixEnergyType = {
    consumption: {
        colorScale: d3
            .scaleThreshold()
            .domain(['oil', 'other'])
            .range(['#', '#1f77b4', '#aec7e8']),
        legend: 'Consommation (TWh)',
        title: (year) => `Share of annual oil consumption in the global energy mix in ${year}`,
    },
};

const mixTitle = document.querySelector('#mix-title');
const mixLegend = document.querySelector('#mix-legend');

// set the dimensions and margins of the graph
const mixWidth = width/2
const mixHeight = height/2
const mixMargin = width/30

// radius of pieplot is half the mixWidth or half the mixHeight (smallest one)
var donutRadius = mixHeight / 2 - mixMargin

// append the mixSvg object to the mix-chart-container
const mixSvg = d3.select("#mix-chart-container")
  .append("svg")
    .attr("flex", 1)
    .attr("width", mixWidth)
    .attr("height", mixHeight)
    .attr("overflow", "visible")
  .append("g")
    .attr("transform", "translate(" + mixWidth / 2 + "," + mixHeight / 2 + ")");

// compute the position of each group on the pie:
var donutPie = d3.pie()
  .value(function(d) {return d.value; });

// center text management
const centerText = mixSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("font-size", "2em")
    .attr("font-weight", "bold")
    .attr("dy", "0.25em");

// center text dynamic update
function updateCenterText(newText) {
  // Si le texte contient NaN, on le remplace par "No data"
  if (newText.includes("NaN")) {
    newText = "No data";
  }
  centerText.text(newText);
}

function drawDonut(mixData) {
  var data_ready = donutPie(d3.entries(mixData));
  mixSvg.selectAll('path')
    .remove();

  mixSvg
    .selectAll('whatever')
    .data(data_ready)
    .enter()
    .append('path')
    .merge(mixSvg.selectAll('path')) // merge new data with existing paths
    .transition()
    .duration(500)
    .attr('d', d3.arc()
      .innerRadius(width/10) // size of the donut hole
      .outerRadius(donutRadius)
    )
    .attr("overflow", "visible")
    .attr('fill', function(d){ return(mixEnergyType["consumption"].colorScale(d.data.key)) })
}

function retrieveMixData(data, year) {
  let oilPercent = 0;
  // if no country is selected, we display the world data
  if (selectedCountries.length == 0) {
    oilPercent = data.get(year)["OWID_WRL"].mix * 100;
  } else { // else we display the average of the selected countries
    oilPercent = 0;
    let nbCountries = selectedCountries.length;
    let nbCountriesWithData = 0;
    for (let i = 0; i < nbCountries; i++) {
      if (data.get(year)[selectedCountries[i]] && data.get(year)[selectedCountries[i]].mix) {
        oilPercent += data.get(year)[selectedCountries[i]].mix * 100;
        nbCountriesWithData++;
      }
    }
    oilPercent /= nbCountriesWithData;
  }
  const otherPercent = 100 - oilPercent;
  const mixData = {
    oil: oilPercent,
    other: otherPercent,
  };
  return mixData;
}

function updateMix(data) {
  mixTitle.innerText = mixEnergyType["consumption"].title(yearSlider.value);
  let mixData = retrieveMixData(data, yearSlider.value);
  drawDonut(mixData);
  updateCenterText(mixData.oil.toFixed(0) + "%");
}


function mixReady(data) {
    updateMix(data);

    yearSlider.addEventListener('input', () => {
      updateMix(data);
    });

    // Listeners
    mapSvg.addEventListener('click', () => {
      updateMix(data);
    });

    countryListBox.addEventListener('change', () => {
      updateMix(data);
    });

    document.getElementById('map-deselect-btn').addEventListener('click', () => {
      updateMix(data);
    });
}