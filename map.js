// initial setup
const mapSvg = document.getElementById('map-chart');
const d3MapSvg = d3.select(mapSvg),
  width = mapSvg.clientWidth,
  height = mapSvg.clientHeight,
  path = d3.geoPath(),
  data = d3.map(),
  worldmap =
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
  worldpopulation =
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv';

// style of geographic projection and scaling
const projection = d3
  .geoRobinson()
  .scale(130)
  .translate([width / 2, height / 2]);

// Define color scale
const colorScale = d3
  .scaleThreshold()
  .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
  .range(d3.schemeOrRd[7]);

// add tooltip
const tooltip = d3
  .select('body')
  .append('div')
  .attr('class', 'map-tooltip')
  .style('opacity', 0);

// Load external data and boot
d3.queue()
  .defer(d3.json, worldmap)
  // TODO : replace with our data
  .defer(d3.csv, worldpopulation, function (d) {
    data.set(d.code, +d.pop);
  })
  .await(ready);

// ----------------------------
//Start of Choropleth drawing
// ----------------------------
function ready(error, topo) {
  let selectedCountries = [];
  // topo is the data received from the d3.queue function (the world.geojson)
  // the data from world_population.csv (country code and country population) is saved in data variable

  const mouseOver = function (d) {
    // change opacity of all countries when hovering over a country
    if (selectedCountries.length === 0) {
      d3.selectAll('.Country')
        .transition()
        .duration(200)
        .style('opacity', 0.5)
        .style('stroke', 'transparent');
    }
    d3.select(this)
      .transition()
      .duration(200)
      .style('opacity', 1)
      .style('stroke', 'black');
    tooltip
      .style('left', d3.event.pageX + 15 + 'px')
      .style('top', d3.event.pageY - 28 + 'px')
      .transition()
      .duration(400)
      .style('opacity', 1)
      // TODO : change tooltip text
      .text(
        d.properties.name +
          ': ' +
          Math.round((d.total / 1000000) * 10) / 10 +
          ' mio.'
      );
  };

  const mouseLeave = function (d) {
    if (selectedCountries.length > 0) {
      // if hovered country is selected
      if (selectedCountries.find((e) => e.id == d.id)) {
        return;
      }
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 0.5)
        .style('stroke', 'transparent');
    } else {
      d3.selectAll('.Country')
        .transition()
        .duration(200)
        .style('opacity', 1)
        .style('stroke', 'transparent');
    }
    tooltip.transition().duration(300).style('opacity', 0);
  };

  // Zoom functionality
  function click_country(d) {
    if (selectedCountries.find((e) => e.id == d.id)) {
      // deselect country
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 0.5)
        .style('stroke', 'transparent');
      selectedCountries = selectedCountries.filter((e) => e.id != d.id);
    } else {
      // select country
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 1)
        .style('stroke', 'black');
      selectedCountries.push(d);
    }
  }

  // Add clickable background
  const click_background = () => {
    // deselect all countries when clicking background
    selectedCountries.length = 0;
    d3.selectAll('.Country')
      .transition()
      .duration(200)
      .style('opacity', 1)
      .style('stroke', 'transparent');
    tooltip.transition().duration(300).style('opacity', 0);
  };

  d3MapSvg
    .append('rect')
    .attr('class', 'map-background')
    .attr('width', width)
    .attr('height', height)
    .on('click', click_background);

  // Draw the map
  const world = d3MapSvg.append('g').attr('class', 'world');
  world
    .selectAll('path')
    .data(topo.features)
    .enter()
    .append('path')
    // draw each country
    // d3.geoPath() is a built-in function of d3 v4 and takes care of showing the map from a properly formatted geojson file, if necessary filtering it through a predefined geographic projection
    .attr('d', d3.geoPath().projection(projection))

    //retrieve the name of the country from data
    .attr('data-name', function (d) {
      return d.properties.name;
    })

    // set the color of each country
    .attr('fill', function (d) {
      d.total = data.get(d.id) || 0;
      return colorScale(d.total);
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
    .on('click', click_country);

  // Legend
  // TODO : change this with range of our own
  const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

  const legend = d3MapSvg.append('g').attr('id', 'legend');

  const legend_entry = legend
    .selectAll('g.legend')
    .data(
      colorScale.range().map(function (d) {
        d = colorScale.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      })
    )
    .enter()
    .append('g')
    .attr('class', 'legend_entry');

  const ls_w = 20,
    ls_h = 20;

  legend_entry
    .append('rect')
    .attr('x', 20)
    .attr('y', function (d, i) {
      return height - i * ls_h - 2 * ls_h;
    })
    .attr('width', ls_w)
    .attr('height', ls_h)
    .style('fill', function (d) {
      return colorScale(d[0]);
    })
    .style('opacity', 0.8);

  legend_entry
    .append('text')
    .attr('x', 50)
    .attr('y', function (d, i) {
      return height - i * ls_h - ls_h - 6;
    })
    .text(function (d, i) {
      if (i === 0) return '< ' + d[1] / 1000000 + ' m';
      if (d[1] < d[0]) return d[0] / 1000000 + ' m +';
      return d[0] / 1000000 + ' m - ' + d[1] / 1000000 + ' m';
    });

  legend
    .append('text')
    .attr('x', 15)
    .attr('y', 280)
    .text('Population (Million)');
}
