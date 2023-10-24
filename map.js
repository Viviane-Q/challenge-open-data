const energyType = {
  consumption: {
    colorScale: d3
      .scaleThreshold()
      .domain([100, 300, 500, 1000, 3000, 5000])
      .range(d3.schemeBlues[7]),
    legend: 'Consumption (TWh)',
  },
  production: {
    colorScale: d3
      .scaleThreshold()
      .domain([100, 300, 500, 1000, 3000, 5000])
      .range(d3.schemeReds[7]),
    legend: 'Production (TWh)',
  },
  reserves: {
    colorScale: d3
      .scaleThreshold()
      .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
      .range(d3.schemeGreens[7]),
    legend: 'Reserves (Barrels)',
  },
};

// initial setup
const mapSvg = document.getElementById('map-chart');
const d3MapSvg = d3.select(mapSvg),
  width = mapSvg.clientWidth,
  height = mapSvg.clientHeight,
  path = d3.geoPath(),
  data = d3.map();
const worldmap = '/Data/world.geojson';
const oilData = '/Data/oil.json';
const legend = d3MapSvg.append('g').attr('id', 'legend');
const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

// style of geographic projection and scaling
const projection = d3
  .geoRobinson()
  .scale(160)
  .translate([width / 2, height / 2 + 10]);

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
  const yearSlider = document.getElementById('year-slider');
  const energyBtn = document.getElementsByClassName('energy-btn');
  let selectedCountries = [];
  let selectedEnergyType = 'consumption';

  // set oil data to map
  for (const [key, value] of Object.entries(topo[1])) {
    data.set(key, value);
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
        `${d.properties.name}\r\n Total: ${d.value}\r\n Per Capita: ${
          d.value / d.population
        }`
      );
  };

  const mouseLeave = function (d) {
    if (selectedCountries.length > 0) {
      // if hovered country is selected
      if (selectedCountries.find((e) => e.id == d.id)) {
        return;
      }
      changeCountryStyle(d3.select(this), 0.5, 'transparent');
    } else {
      changeCountryStyle(d3.selectAll('.Country'), 1, 'transparent');
    }
    tooltip.transition().duration(300).style('opacity', 0);
  };

  // Select or deselect country
  function clickCountry(d) {
    if (selectedCountries.find((e) => e.id == d.id)) {
      // deselect country
      selectedCountries = selectedCountries.filter((e) => e.id != d.id);
      if (selectedCountries.length === 0) {
        changeCountryStyle(d3.selectAll('.Country'), 1, 'transparent');
      } else {
        changeCountryStyle(d3.select(this), 0.5, 'transparent');
      }
    } else {
      // select country
      selectedCountries.push(d);
      changeCountryStyle(d3.select(this), 1, 'black');
    }
  }

  // Add clickable background
  const clickBackground = () => {
    // deselect all countries when clicking background
    selectedCountries.length = 0;
    changeCountryStyle(d3.selectAll('.Country'), 1, 'transparent');
    tooltip.transition().duration(300).style('opacity', 0);
  };

  const fillMap = (d, year) => {
    const dataYear = data.get(year);
    d.value = dataYear[d.id]?.[selectedEnergyType] || 0;
    d.population = dataYear[d.id]?.population || 0;
    return energyType[selectedEnergyType].colorScale(d.value);
  };

  yearSlider.addEventListener('input', () => {
    world.selectAll('path').attr('fill', function (d) {
      return fillMap(d, yearSlider.value);
    });
  });

  for (let i = 0; i < energyBtn.length; i++) {
    energyBtn[i].addEventListener('click', () => {
      selectedEnergyType = energyBtn[i].getAttribute('energy-type');
      drawLegend();
      world.selectAll('path').attr('fill', function (d) {
        return fillMap(d, yearSlider.value);
      });
    });
  }

  d3MapSvg
    .append('rect')
    .attr('class', 'map-background')
    .attr('width', width)
    .attr('height', height)
    .on('click', clickBackground);

  // Draw the map
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

  const drawLegend = () => {
    const legendSize = 20;

    // clear legend before redrawing
    legend.selectAll('*').remove();

    legend
      .append('text')
      .attr('y', height - legendSize * 10)
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

    legend_entry
      .append('rect')
      .attr('y', function (d, i) {
        return height - (i + 3) * legendSize;
      })
      .attr('width', legendSize)
      .attr('height', legendSize)
      .style('fill', function (d) {
        return energyType[selectedEnergyType].colorScale(d[0]);
      });

    legend_entry
      .append('text')
      .attr('x', 30)
      .attr('y', function (d, i) {
        return height - (i + 2) * legendSize - 4;
      })
      .text(function (d, i) {
        if (i === 0) return '< ' + d[1];
        if (d[1] < d[0]) return d[0] + ' +';
        return d[0] + ' - ' + d[1];
      });
  };

  drawLegend();
}
