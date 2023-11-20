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
pieChartSvg.append("g").attr("class", "percentage");

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

var pieChartColor = d3.scaleOrdinal().range(d3.schemeCategory10);

// update pie chart
function updatePieChart(originalData, selectedEnergyType, selectedCountries) {
  let data = {};
  total = originalData["OWID_WRL"][selectedEnergyType];

  // When there is no selection, display top 5 countries
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
    // take only 3 first elements
    data = data.slice(0, 3);
    sum = data.reduce((accumulator, currentValue) => {
      return accumulator + currentValue[1][selectedEnergyType];
    }, 0);
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
  }
  data["OWID_WRL"] = { country: "Others" };
  data["OWID_WRL"][selectedEnergyType] = total - sum;
  var pie = d3.pie().value(function (d) {
    return d.value[selectedEnergyType];
  });

  // update title
  pieChartTitle.innerHTML = `Part de ${selectedEnergyType} du monde ${yearSlider.value}`;
  /* ------- Drawing pie chart -------*/

  var data_ready = pie(d3.entries(data));

  // default opacity of the slices
  var opacity = 1;

  // hover opacity of the slices
  var opacityHover = 1;
  // hover opacity of other slices
  var otherOpacityOnHover = 0.6;
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

      let g = d3
        .select("#pie-chart")
        .style("cursor", "pointer")
        .append("g")
        .attr("class", "tooltip")
        .style("opacity", 0);

      g.append("text")
        .attr("class", "name-text")
        //bigger font for country name
        .style("font-size", "25px")
        .text(
          `${d.data.value.country} (${calculatePercentage(
            d.data.value[selectedEnergyType]
          )}%)`
        )
        .attr("text-anchor", "middle");

      let text = g.select("text");
      let bbox = text.node().getBBox();
      let padding = 1;
      g.insert("rect", "text")
        .attr("x", bbox.x - padding)
        .attr("y", bbox.y - padding)
        .attr("width", bbox.width + padding * 2)
        .attr("height", bbox.height + padding * 2)
        .style("fill", "white")
        .style("opacity", 0.8)
        .attr("rx", 5)
        .style("stroke", "black")
        .style("stroke-width", 1);
    })
    .on("mousemove", function (d) {
      let mousePosition = d3.mouse(this);
      let x = mousePosition[0] + width / 2 - tooltipMargin - 50;
      let y = mousePosition[1] + height / 2 - tooltipMargin;

      let text = d3.select(".tooltip text");
      let bbox = text.node().getBBox();
      if (x - bbox.width / 2 < 0) {
        x = bbox.width / 2;
      } else if (width - x - bbox.width / 2 < 0) {
        x = width - bbox.width / 2;
      }

      if (y - bbox.height / 2 < 0) {
        y = bbox.height + tooltipMargin * 2;
      } else if (height - y - bbox.height / 2 < 0) {
        y = height - bbox.height / 2;
      }

      d3.select(".tooltip")
        .style("opacity", 1)
        .attr("transform", `translate(${x}, ${y})`);
    })
    .on("mouseout", function (d) {
      d3.select("#pie-chart")
        .style("cursor", "default")
        .select(".tooltip")
        .remove();
      d3.selectAll("#pie-chart path").style("opacity", opacity);
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
    return Math.round((value / total) * 100);
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
    labels.each(function (d, i) {
      var a = this,
        da = d3.select(a),
        y1 = da.attr("y");
      labels.each(function (d, j) {
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

  // Percentage (shows nothing when the percentage is too small)
  var percentage = pieChartSvg
    .select(".percentage")
    .selectAll("text")
    .data(data_ready);
    
  function pointIsInArc(pt, ptData, d3Arc) {
    // Center of the arc is assumed to be 0,0
    // (pt.x, pt.y) are assumed to be relative to the center
    var r1 = arc.innerRadius()(ptData),
      r2 = arc.outerRadius()(ptData),
      theta1 = arc.startAngle()(ptData),
      theta2 = arc.endAngle()(ptData);

    var dist = pt.x * pt.x + pt.y * pt.y,
      angle = Math.atan2(pt.x, -pt.y);

    angle = angle < 0 ? angle + Math.PI * 2 : angle;

    return (
      r1 * r1 <= dist && dist <= r2 * r2 && theta1 <= angle && angle <= theta2
    );
  }
  percentage
    .enter()
    .append("text")
    .merge(percentage)
    .attr("transform", function (d) {
      return "translate(" + arc.centroid(d) + ")";
    })
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .style("color", "white")
    .text(function (d) {
      return calculatePercentage(d.data.value[selectedEnergyType]);
    })
    .each(function (d) {
      var bb = this.getBBox(),
        center = arc.centroid(d);

      var topLeft = {
        x: center[0] + bb.x,
        y: center[1] + bb.y,
      };

      var topRight = {
        x: topLeft.x + bb.width,
        y: topLeft.y,
      };

      var bottomLeft = {
        x: topLeft.x,
        y: topLeft.y + bb.height,
      };

      var bottomRight = {
        x: topLeft.x + bb.width,
        y: topLeft.y + bb.height,
      };

      d.visible =
        pointIsInArc(topLeft, d, arc) &&
        pointIsInArc(topRight, d, arc) &&
        pointIsInArc(bottomLeft, d, arc) &&
        pointIsInArc(bottomRight, d, arc);
    })
    .each(function (d) {
      if (!d.visible) {
        d3.select(this).remove();
      }
    });
  percentage.exit().remove();
}
