const pieChartContainer = document.getElementById("pie-chart-container");
const pieChartContainerPadding = parseFloat(
  window
    .getComputedStyle(pieChartContainer, null)
    .getPropertyValue("padding")
    .replace("px", "")
);
const pieChartWidth =
    pieChartContainer.clientWidth - pieChartContainerPadding * 2,
  pieChartHeight =
    pieChartContainer.clientHeight - pieChartContainerPadding * 2;

// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
var radius = Math.min(pieChartWidth, pieChartHeight) / 2;

// var svg = d3.select("#pie-chart-container").append("svg").append("g");
// d3.select("#pie-chart-container svg").attr("class", "pie-chart");

var pieCHartSvg = d3
  .select("#pie-chart-container")
  .append("svg")
  .attr("class", "pie-chart")
  .append("g")
  .attr(
    "transform",
    "translate(" +
      (pieChartWidth + pieChartContainerPadding) / 2 +
      "," +
      pieChartHeight / 2 +
      ")"
  );

pieCHartSvg.append("g").attr("class", "slices");
pieCHartSvg.append("g").attr("class", "labels");
pieCHartSvg.append("g").attr("class", "lines");

var pie = d3
  .pie()
  .sort(null)
  .value(function (d) {
    return d.value;
  });

var arc = d3
  .arc()
  .outerRadius(radius * 0.8)
  .innerRadius(0);

var outerArc = d3
  .arc()
  .innerRadius(radius * 0.9)
  .outerRadius(radius * 0.9);

pieCHartSvg.attr(
  "transform",
  "translate(" +
    (pieChartWidth + pieChartContainerPadding) / 2 +
    "," +
    pieChartHeight / 2 +
    ")"
);

var key = function (d) {
  return d.data.key;
};

var pieChartColor = d3.scaleOrdinal().range(d3.schemeCategory10);

function randomData() {
  var labels = pieChartColor.domain();
  var dict = {};
  for (var i = 0; i < labels.length; i++) {
    dict[labels[i]] = { consumption: Math.random() };
  }
  return dict;
}

d3.select(".randomize").on("click", function () {
  updatePieChart(randomData());
});

// update pie chart
function updatePieChart(data, selectedEnergyType, selectedCountries) {
  if (selectedCountries.length === 0) {
    data = JSON.parse(JSON.stringify(data));
    total = data["OWID_WRL"][selectedEnergyType];
    delete data["OWID_WRL"];
    data = Object.entries(data).sort((a, b) => {
      if (!!b[1][selectedEnergyType] && !!a[1][selectedEnergyType]) {
        return b[1][selectedEnergyType] - a[1][selectedEnergyType];
      } else if (!b[1][selectedEnergyType]) {
        return -1;
      } else {
        return 1;
      }
    });
    // take only 5 first elements
    data = data.slice(0, 3);
    sum = data.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue[1][selectedEnergyType],
      0
    );
    data = Object.fromEntries(data);
    data["OWID_WRL"] = { country: "Others" };
    data["OWID_WRL"][selectedEnergyType] = total - sum;
  } else {
    const newData = {};
    selectedCountries.forEach((country) => {
      if (!! data[country] && selectedEnergyType in data[country]){
        newData[country] = data[country];
      }
    });
    data = newData;
  }
  var pie = d3.pie().value(function (d) {
    return d.value[selectedEnergyType];
  });

  // pie.startAngle()

  var data_ready = pie(d3.entries(data));
  var slice = pieCHartSvg
    .select(".slices")
    .selectAll("path.slice")
    .data(data_ready);

  // Arcs

  slice
    .enter()
    .insert("path")
    .merge(slice)
    .transition()
    .duration(1000)
    .attrTween("d", function (d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        return arc(interpolate(t));
      };
    })
    .style("fill", function (d) {
      return pieChartColor(d.data.key);
    })
    .attr("class", "slice");

  slice.exit().remove();

  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

  // Text labels
  var text = pieCHartSvg.select(".labels").selectAll("text").data(data_ready);

  text
    .enter()
    .append("text")
    .merge(text)
    .transition()
    .duration(1000)
    .attrTween("transform", function (d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        var d2 = interpolate(t);
        var pos = outerArc.centroid(d2);
        pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
        return "translate(" + pos + ")";
      };
    })
    .styleTween("text-anchor", function (d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        var d2 = interpolate(t);
        return midAngle(d2) < Math.PI ? "start" : "end";
      };
    })
    .attr("dy", ".35em")
    .text(function (d) {
      return d.data.value.country;
    });

  text.exit().remove();

  /* ------- SLICE TO TEXT POLYLINES -------*/

  var polyline = pieCHartSvg
    .select(".lines")
    .selectAll("polyline")
    .data(data_ready);

  polyline
    .enter()
    .append("polyline")
    .merge(polyline)
    .transition()
    .duration(1000)
    .attrTween("points", function (d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        var d2 = interpolate(t);
        var pos = outerArc.centroid(d2);
        pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
        return [arc.centroid(d2), outerArc.centroid(d2), pos];
      };
    });

  polyline.exit().remove();
}
