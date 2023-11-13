const mixEnergyType = {
    consumption: {
        colorScale: d3
            .scaleThreshold()
            .domain(['oil', 'other'])
            .range(['#', '#1f77b4', '#aec7e8']),
        legend: 'Consommation (TWh)',
        title: (year) => `Part de la consommation annuelle de pétrole dans le mix énergétique mondial en ${year} (en %)`,
    },
};

const mixTitle = document.querySelector('#mix-title');
const mixLegend = document.querySelector('#mix-legend');

// set the dimensions and margins of the graph
const mixWidth = 250
const mixHeight = 250
const mixMargin = 40

// radius of pieplot is half the mixWidth or half the mixHeight (smallest one)
var radius = Math.min(mixWidth, mixHeight) / 2 - mixMargin

// append the mixSvg object to the mix-chart-container
const mixSvg = d3.select("#mix-chart-container")
  .append("svg")
    .attr("flex", 1)
    .attr("width", mixWidth)
    .attr("height", mixHeight)
  .append("g")
    .attr("transform", "translate(" + mixWidth / 2 + "," + mixHeight / 2 + ")");

// compute the position of each group on the pie:
var pie = d3.pie()
  .value(function(d) {return d.value; });

// center text management
const centerText = mixSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("font-size", "2em")
    .attr("font-weight", "bold")
    .attr("dy", "0.2em");

// center text dynamic update
function updateCenterText(newText) {
  centerText.text(newText);
}

function drawDonut(mixData) {
  var data_ready = pie(d3.entries(mixData));
  mixSvg
    .selectAll('whatever')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', d3.arc()
      .innerRadius(120) // size of the donut hole
      .outerRadius(radius)
    )
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
    console.log("mix ready");
    updateMix(data);

    yearSlider.addEventListener('input', () => {
      updateMix(data);
    });

    mapSvg.addEventListener('click', () => {
      updateMix(data);
    });
}