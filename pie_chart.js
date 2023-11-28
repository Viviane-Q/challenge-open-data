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
const pieChartTitle = document.getElementById("pie-chart-title");
var pieChartSvg = d3.select("#pie-chart").append("g");

pieChartSvg.append("g").attr("class", "slices");
pieChartSvg.append("g").attr("class", "labels");
pieChartSvg.append("g").attr("class", "lines");

var arc = d3
  .arc()
  .outerRadius(radius * 0.6)
  .innerRadius(0);

pieChartSvg.attr(
  "transform",
  "translate(" +
    (pieChartWidth + pieChartContainerPadding) / 2 +
    "," +
    ((pieChartHeight + pieChartContainerPadding) / 2 + 10) + // some spaces for title
    ")"
);

var key = function (d) {
  return d.data.key;
};

var pieChartColor = d3
  .scaleOrdinal()
  .range(["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#808080"]);

function removePieChart() {
  pieChartSvg.selectAll(".slices path").remove();
  pieChartSvg.selectAll(".lines line").remove();
  pieChartSvg.selectAll(".labels text").remove();
  pieChartNoDataText= pieChartSvg.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "2em")
      .attr("font-weight", "bold")
      .attr("dy", "0.25em")
      .text("No data")
  }

const pieChartNoDataText = null;

// add tooltip
const pieChartTooltip = d3
  .select('body')
  .append('div')
  .attr('class', 'map-tooltip')
  .style('opacity', 0);

// update pie chart
function updatePieChart(originalData, selectedEnergyType, selectedCountries) {
  // update title
  pieChartTitle.innerHTML = `Global share of oil ${selectedEnergyType} in ${yearSlider.value}`;
  let data = {};
  total = originalData["OWID_WRL"][selectedEnergyType];
  if (!total) {
    // if there is no data, remove the slices, lines, labels and percentage
    removePieChart();
    return;
  }
  // When there is no selection, display top 3 countries
  if (selectedCountries.length === 0) {
    data = JSON.parse(JSON.stringify(originalData));
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
    data = data.slice(0, 5);
    sum = 0;
    for (let i = 0; i < data.length; i++) {
      if (!data[i][1][selectedEnergyType]) {
        // if there is no data, remove the slices, lines, labels and percentage
        removePieChart();
        return;
      }
      sum += data[i][1][selectedEnergyType];
    }
    data = Object.fromEntries(data);

    
    // When there is selection, display selected countries with others
  } else {
    sum = 0;
    selectedCountries.forEach((country) => {
      if (
        !!originalData[country] &&
        selectedEnergyType in originalData[country]
      ) {
        data[country] = originalData[country];
        sum += originalData[country][selectedEnergyType];
      }
    });
    if (sum === 0) {
      // if there is no data, remove the slices, lines, labels and percentage
      removePieChart();
      return;
    }
  }
  if (pieChartNoDataText != null){
    pieChartNoDataText.remove();
  }
  data["OWID_WRL"] = { country: "Others" };
  data["OWID_WRL"][selectedEnergyType] = total - sum;
  var pie = d3.pie().value(function (d) {
    return d.value[selectedEnergyType];
  });

  /* ------- Drawing pie chart -------*/

  var data_ready = pie(d3.entries(data));

  // default opacity of the slices
  var opacity = 1;

  // hover opacity of the slices
  var opacityHover = 1;
  // hover opacity of other slices
  var otherOpacityOnHover = 0.5;
  // margin of the tooltip
  var tooltipMargin = 5;

  // slices
  var slice = pieChartSvg
    .select(".slices")
    .selectAll("path.slice")
    .data(data_ready);

  slice
    .enter()
    .insert("path")
    .merge(slice)
    // tooltip
    .on("mouseover", function (d) {
      pieChartSvg.selectAll("path").style("opacity", otherOpacityOnHover);
      d3.select(this).style("opacity", opacityHover);

        pieChartTooltip
        .style('left', d3.event.pageX + 15 + 'px')
        .style('top', d3.event.pageY - 28 + 'px')
        .transition()
        .duration(400)
        .style('opacity', 1)
        .text(
          `${d.data.value.country} (${calculatePercentage(
            d.data.value[selectedEnergyType]
          )}%)`
        )
    })
    .on("mouseout", function (d) {
      pieChartTooltip.transition().duration(300).style('opacity', 0);

      d3.select("#pie-chart")
        .style("cursor", "default")
      d3.selectAll("#pie-chart path").style("opacity", opacity);

      // remove tooltip
      d3.select("#pie-chart").select(".tooltip").remove();
    })
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
      return pieChartColor(d.index);
    })
    .attr("class", "slice");

  slice.exit().remove();

  function calculatePercentage(value) {
    return ((value / total) * 100).toFixed(2);
  }

  // Text labels

  var labels = pieChartSvg.select(".labels").selectAll("text").data(data_ready);
  var lines = pieChartSvg.select(".lines").selectAll("line").data(data_ready);
  var labelRadius = radius * 0.8;
  labels
    .enter()
    .append("text")
    .merge(labels)
    .text(function (d) {
      return d.data.value.country;
    })
    .attr("x", function (d, i) {
      var centroid = arc.centroid(d),
        midAngle = Math.atan2(centroid[1], centroid[0]),
        x = Math.cos(midAngle) * labelRadius,
        sign = x > 0 ? 1 : -1;
      return x + 5 * sign;
    })
    .attr("y", function (d, i) {
      var centroid = arc.centroid(d),
        midAngle = Math.atan2(centroid[1], centroid[0]),
        y = Math.sin(midAngle) * labelRadius;
      return y;
    })
    .attr("text-anchor", function (d, i) {
      var centroid = arc.centroid(d),
        midAngle = Math.atan2(centroid[1], centroid[0]),
        x = Math.cos(midAngle) * labelRadius;
      return x > 0 ? "start" : "end";
    })
    .attr("class", "label-text");

  // label lines
  lines
    .enter()
    .append("line")
    .merge(lines)
    // line from the outer arc to the label
    .attr("x1", function (d) {
      var centroid = arc.centroid(d),
        midAngle = Math.atan2(centroid[1], centroid[0]),
        x = Math.cos(midAngle) * arc.outerRadius()(d);
      return x;
    })
    .attr("y1", function (d) {
      var centroid = arc.centroid(d),
        midAngle = Math.atan2(centroid[1], centroid[0]);
      return Math.sin(midAngle) * arc.outerRadius()(d);
    })
    .attr("x2", function (d) {
      var centroid = arc.centroid(d),
        midAngle = Math.atan2(centroid[1], centroid[0]),
        x = Math.cos(midAngle) * labelRadius,
        sign = x > 0 ? 1 : -1;
      return x + 5 * sign;
    })
    .attr("y2", function (d) {
      var centroid = arc.centroid(d),
        midAngle = Math.atan2(centroid[1], centroid[0]);
      return Math.sin(midAngle) * labelRadius;
    })
    .attr("class", "label-line")
    .attr("stroke", function (d) {
      return pieChartColor(d.index);
    });
  var alpha = 0.8,
    spacing = 20;

  // Move labels vertically to avoid collisions
  function relax() {
    var again = false;
    var textLabels = pieChartSvg.select(".labels").selectAll("text");
    textLabels.each(function (d, i) {
      var a = this,
        da = d3.select(a),
        y1 = da.attr("y");

      textLabels.each(function (d, j) {
        var b = this;
        if (a === b) {
          return;
        }

        db = d3.select(b);
        if (da.attr("text-anchor") !== db.attr("text-anchor")) {
          return;
        }

        var y2 = db.attr("y");
        deltaY = y1 - y2;

        if (Math.abs(deltaY) > spacing) {
          return;
        }

        again = true;
        sign = deltaY > 0 ? 1 : -1;
        var adjust = sign * alpha;
        da.attr("y", +y1 + adjust);
        db.attr("y", +y2 - adjust);
      });
    });

    if (again) {
      var labelElements = labels.nodes();
      lines.attr("y2", function (d, i) {
        var labelForLine = d3.select(labelElements[i]);
        return labelForLine.attr("y");
      });
      setTimeout(relax, 20);
    }
  }
  relax();
  lines.exit().remove();
  labels.exit().remove();
}
