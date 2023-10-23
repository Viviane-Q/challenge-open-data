// initial setup
const mapSvg = document.getElementById('map-chart');
const d3MapSvg = d3.select(mapSvg),
  width = mapSvg.clientWidth,
  height = mapSvg.clientHeight,
  path = d3.geoPath(),
  data = d3.map(),
  worldmap =
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
const oilData = '/Data/oil.json';

// style of geographic projection and scaling
const projection = d3
  .geoRobinson()
  .scale(130)
  .translate([width / 2, height / 2]);

// Define color scale
const colorScale = d3
  .scaleThreshold()
  .domain([10, 100, 1000, 3000, 10000, 50000])
  .range(d3.schemeBlues[7]);

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
function ready(error, topo) {
  // topo is the data received from the d3.queue defers function
  let selectedCountries = [];

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
        `${d.properties.name}\r\n Total: ${d.consumption}\r\n Per Capita: ${
          d.consumption / d.population
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
      changeCountryStyle(d3.select(this), 1, 'transparent');
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
    d.consumption = dataYear[d.id]?.consumption || 0;
    d.population = dataYear[d.id]?.population || 0;
    return colorScale(d.consumption);
  };

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
      return fillMap(d, 2021);
    })
    // add a class, styling and mouseover/mouseleave and click functions
    .style('stroke', 'transparent')
    .attr('class', function (d) {
      return 'Country';
    })
    .attr('id', function (d) {
      return d.id;
    })
    .style('opacity', 1)
    .on('mouseover', mouseOver)
    .on('mouseleave', mouseLeave)
    .on('click', clickCountry);

  const yearSlider = document.getElementById('year-slider');
  yearSlider.addEventListener('input', () => {
    world.selectAll('path').attr('fill', function (d) {
      return fillMap(d, yearSlider.value);
    });
  });

  // TODO: Legend
  // const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

  // const legend = d3MapSvg.append('g').attr('id', 'legend');

  // const legend_entry = legend
  //   .selectAll('g.legend')
  //   .data(
  //     colorScale.range().map(function (d) {
  //       d = colorScale.invertExtent(d);
  //       if (d[0] == null) d[0] = x.domain()[0];
  //       if (d[1] == null) d[1] = x.domain()[1];
  //       return d;
  //     })
  //   )
  //   .enter()
  //   .append('g')
  //   .attr('class', 'legend_entry');

  // const ls_w = 20,
  //   ls_h = 20;

  // legend_entry
  //   .append('rect')
  //   .attr('x', 20)
  //   .attr('y', function (d, i) {
  //     return height - i * ls_h - 2 * ls_h;
  //   })
  //   .attr('width', ls_w)
  //   .attr('height', ls_h)
  //   .style('fill', function (d) {
  //     return colorScale(d[0]);
  //   })
  //   .style('opacity', 0.8);

  // legend_entry
  //   .append('text')
  //   .attr('x', 50)
  //   .attr('y', function (d, i) {
  //     return height - i * ls_h - ls_h - 6;
  //   })
  //   .text(function (d, i) {
  //     if (i === 0) return '< ' + d[1] / 1000000 + ' m';
  //     if (d[1] < d[0]) return d[0] / 1000000 + ' m +';
  //     return d[0] / 1000000 + ' m - ' + d[1] / 1000000 + ' m';
  //   });

  // legend
  //   .append('text')
  //   .attr('x', 15)
  //   .attr('y', 280)
  //   .text('Population (Million)');
}
