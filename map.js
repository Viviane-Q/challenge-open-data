const energyType = {
  consumption: {
    colorScale: d3
      .scaleThreshold()
      .domain([300, 500, 1000, 3000, 5000, 10000])
      .range(d3.schemeBlues[7]),
    legend: 'Consumption (TWh)',
    title: (year) => `Global oil consumption (TWh) in ${year}`,
    unit: 'TWh',
    perCapitaUnit: 'MWh',
  },
  production: {
    colorScale: d3
      .scaleThreshold()
      .domain([100, 300, 500, 1000, 3000, 5000])
      .range(d3.schemeGreens[7]),
    legend: 'Production (TWh)',
    title: (year) => `Global oil production (TWh) in ${year}`,
    unit: 'TWh',
    perCapitaUnit: 'MWh',
  },
  reserves: {
    colorScale: d3
      .scaleThreshold()
      .domain([500, 1000, 3000, 5000, 10000, 30000])
      .range(d3.schemeOranges[7]),
    legend: 'Reserves (Million Barrels)',
    title: (year) => `Global oil reserves (Million Barrels) in ${year}`,
    unit: 'Million Barrels',
    perCapitaUnit: 'Barrels',
  },
};
let selectedEnergyType = 'consumption';

// initial setup
const mapSvg = document.getElementById('map-chart');
const d3MapSvg = d3.select(mapSvg),
  width = mapSvg.clientWidth,
  height = mapSvg.clientHeight,
  path = d3.geoPath(),
  data = d3.map();
const worldmap = './Data/world.geojson';
const oilData = './Data/oil.json';
const legend = d3MapSvg.append('g').attr('id', 'legend');
const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);
const yearSlider = document.getElementById('year-slider');
const energyBtn = document.getElementsByClassName('energy-btn');
const mapTitle = document.getElementById('map-title');
const countryListBox = document.getElementById('country-list-box');
let selectedCountries = [];

// style of geographic projection and scaling
const projection = d3
  .geoRobinson()
  .scale(height / 3)
  .translate([width / 2, height / 2 + 20]);

// add tooltip
const tooltip = d3
  .select('body')
  .append('div')
  .attr('class', 'map-tooltip')
  .style('opacity', 0);

d3.queue().defer(d3.json, worldmap).defer(d3.json, oilData).awaitAll(ready);

// ----------------------------
//Start of Choropleth drawing
// ----------------------------
// topo is the data received from the d3.queue defers function
function ready(error, topo) {
  // let selectedEnergyType = 'consumption';

  // set oil data to map
  for (const [year, value] of Object.entries(topo[1])) {
    data.set(year, value);
  }
  const changeCountryStyle = (selector, opacity, stroke) => {
    selector
      .transition()
      .duration(200)
      .style('opacity', opacity)
      .style('stroke', stroke);
  };

  const mouseOver = function (d) {
    // change opacity of all countries when hovering over a country
    if (selectedCountries.length === 0) {
      changeCountryStyle(d3.selectAll('.Country'), 0.5, 'transparent');
    }
    changeCountryStyle(d3.select(this), 1, 'black');
    tooltip
      .style('left', d3.event.pageX + 15 + 'px')
      .style('top', d3.event.pageY - 28 + 'px')
      .transition()
      .duration(400)
      .style('opacity', 1)
      .text(
        `${d.properties.name}\r\n Total: ${d.value ? d.value.toFixed(2) + ' ' + energyType[selectedEnergyType].unit : 'NA'
        }\r\n Per Capita: ${d.value && d.population
          ? ((d.value * 1000000) / d.population).toFixed(2) + ' ' + energyType[selectedEnergyType].perCapitaUnit
          : 'NA'
        }`
      );
  };

  const mouseLeave = function (d) {
    if (selectedCountries.length > 0) {
      // if hovered country is not selected
      if (!selectedCountries.includes(d.id)) {
        changeCountryStyle(d3.select(this), 0.5, 'transparent');
      }
    } else {
      changeCountryStyle(d3.selectAll('.Country'), 1, 'transparent');
    }
    tooltip.transition().duration(300).style('opacity', 0);
  };

  // Select or deselect country
  function clickCountry(d) {
    let countryElement;
    if (typeof countryElement === 'number') {
      // if click is triggered through map
      countryElement = this;
    } else {
      // if click is triggered through country list
      countryElement = document.querySelector(`path#${d.id}`);
    }

    if (selectedCountries.includes(d.id)) {
      // deselect country
      selectedCountries = selectedCountries.filter((e) => e !== d.id);
      countryListBox.querySelector(`input[value="${d.id}"]`).checked = false;
      if (selectedCountries.length === 0) {
        changeCountryStyle(d3.selectAll('.Country'), 1, 'transparent');
      } else {
        changeCountryStyle(d3.select(countryElement), 0.5, 'transparent');
      }
    } else {
      // select country
      if (selectedCountries.length === 0) { // when selecting first country
        changeCountryStyle(d3.selectAll('.Country'), 0.5, 'transparent');
      }
      selectedCountries.push(d.id);
      countryListBox.querySelector(`input[value="${d.id}"]`).checked = true;
      changeCountryStyle(d3.select(countryElement), 1, 'black');
    }
    updatePieChart(data.get(yearSlider.value), selectedEnergyType, selectedCountries);
  }

  // Add clickable background
  const clickBackground = () => {
    if (selectedCountries.length === 0) return;
    // deselect all countries when clicking background
    selectedCountries.length = 0;
    countryListBox
      .querySelectorAll('input')
      .forEach((e) => (e.checked = false));
    changeCountryStyle(d3.selectAll('.Country'), 1, 'transparent');
    tooltip.transition().duration(300).style('opacity', 0);
    updatePieChart(data.get(yearSlider.value), selectedEnergyType, []);
  };

  // Add deselect button
  document.getElementById('map-deselect-btn').addEventListener('click', () => {
    clickBackground();
  });

  const fillMap = (d, year) => {
    const dataYear = data.get(year);
    d.value = dataYear[d.id]?.[selectedEnergyType];
    d.population = dataYear[d.id]?.population;
    if (isNaN(d.value)) return 'grey';
    return energyType[selectedEnergyType].colorScale(d.value);
  };

  const fillCountryList = () => {
    countryListBox.innerHTML = '';
    for (const country of topo[0].features) {
      const countryId = country.id;
      const countryName = country.properties.name;

      // create input element
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = countryId;
      input.checked = selectedCountries.includes(countryId) ? true : false;
      input.addEventListener('change', () => {
        clickCountry({ id: countryId });
      });

      // create label element
      const label = document.createElement('label');
      label.appendChild(input);
      label.appendChild(document.createTextNode(countryName));

      const li = document.createElement('li');
      li.appendChild(label);

      countryListBox.appendChild(li);
    }
  };

  yearSlider.addEventListener('input', () => {
    updatePieChart(data.get(yearSlider.value), selectedEnergyType, selectedCountries);
    // replace country list with selected year's countries
    fillCountryList(yearSlider.value);
    world.selectAll('path').attr('fill', function (d) {
      return fillMap(d, yearSlider.value);
    });
    mapTitle.innerText = energyType[selectedEnergyType].title(yearSlider.value);
  });

  for (let i = 0; i < energyBtn.length; i++) {
    energyBtn[i].addEventListener('click', () => {
      selectedEnergyType = energyBtn[i].getAttribute('energy-type');
      drawLegend();
      world.selectAll('path').attr('fill', function (d) {
        return fillMap(d, yearSlider.value);
      });
      mapTitle.innerText = energyType[selectedEnergyType].title(
        yearSlider.value
      );
      updatePieChart(data.get(yearSlider.value), selectedEnergyType, selectedCountries);
    });
  }

  d3MapSvg
    .append('rect')
    .attr('class', 'map-background')
    .attr('width', width)
    .attr('height', height)
    .on('click', clickBackground);

  // Draw the map
  mapTitle.innerText = energyType[selectedEnergyType].title(yearSlider.value);
  const world = d3MapSvg.append('g').attr('class', 'world');
  world
    .selectAll('path')
    .data(topo[0].features)
    .enter()
    .append('path')
    // draw each country
    .attr('d', d3.geoPath().projection(projection))
    //retrieve the name of the country from data
    .attr('data-name', function (d) {
      return d.properties.name;
    })
    // set the color of each country
    .attr('fill', function (d) {
      return fillMap(d, yearSlider.value);
    })
    // add a class, styling and mouseover/mouseleave and click functions
    .style('stroke', 'transparent')
    .attr('class', 'Country')
    .attr('id', function (d) {
      return d.id;
    })
    .style('opacity', 1)
    .on('mouseover', mouseOver)
    .on('mouseleave', mouseLeave)
    .on('click', clickCountry);

  fillCountryList();

  const drawLegend = () => {
    const legendSize = 20;

    // clear legend before redrawing
    legend.selectAll('*').remove();

    // legend title
    legend
      .append('text')
      .attr('y', height - legendSize * 11)
      .text(`${energyType[selectedEnergyType].legend}`);

    const legend_entry = legend
      .selectAll('g.legend')
      .data(
        energyType[selectedEnergyType].colorScale.range().map(function (d) {
          d = energyType[selectedEnergyType].colorScale.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        })
      )
      .enter()
      .append('g')
      .attr('class', 'legend_entry');

    // defined values colors
    legend_entry
      .append('rect')
      .attr('y', function (d, i) {
        return height - (i + 4) * legendSize;
      })
      .attr('width', legendSize)
      .attr('height', legendSize)
      .style('fill', function (d) {
        return energyType[selectedEnergyType].colorScale(d[0]);
      });

    // legend text
    legend_entry
      .append('text')
      .attr('x', 30)
      .attr('y', function (d, i) {
        return height - (i + 3) * legendSize - 4;
      })
      .text(function (d, i) {
        if (i === 0) return '< ' + d[1];
        if (d[1] < d[0]) return d[0] + ' +';
        return d[0] + ' - ' + d[1];
      });

    // undefined values color
    legend
      .append('rect')
      .attr('y', height - legendSize * 3)
      .attr('width', legendSize)
      .attr('height', legendSize)
      .style('fill', 'grey');

    // undefined values legend text
    legend
      .append('text')
      .attr('x', 30)
      .attr('y', height - legendSize * 2 - 3)
      .text('NA');
  };

  drawLegend();
  curveReady(data)
  mixReady(data)

  // Update pie chart 
  updatePieChart(data.get(yearSlider.value), selectedEnergyType, selectedCountries);

}
