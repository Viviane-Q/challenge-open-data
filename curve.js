function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const curveEnergyType = {
    consumption: {
        colorScale: d3
            .scaleThreshold()
            .domain([100, 300, 500, 1000, 3000, 5000])
            .range(d3.schemeBlues[7]),
        legend: 'Consumption (TWh)',
        title: `Annual Oil Consumption (TWh)`,
    },
    production: {
        colorScale: d3
            .scaleThreshold()
            .domain([100, 300, 500, 1000, 3000, 5000])
            .range(d3.schemeReds[7]),
        legend: 'Production (TWh)',
        title: `Annual Oil Production (TWh)`,
    },
    reserves: {
        colorScale: d3
            .scaleThreshold()
            .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
            .range(d3.schemeGreens[7]),
        legend: 'Reserves (Barrels)',
        title: `Annual Oil Reserves (Barrels)`,
    },
};


const curveTitle = document.querySelector('#curve-title');
const curveSvg = document.querySelector('#curve-chart');




const svg = d3.select(document.getElementById('curve-chart'));
// svg.on('mouseover', hoverChart)

function curveReady(selectedEnergyType, data) {
    console.log("curve ready");
    curveTitle.innerText = curveEnergyType[selectedEnergyType].title

    console.log(data)
    let consumptionPoints = [];
    let productionPoints = [];
    let reservesPoints = [];
    for (const [year, countries] of Object.entries(data)) {
        let productedTT = 0;
        let consumedTT = 0;
        let reserveTT = 0;
        for (const [country, values] of Object.entries(countries)) {
            productedTT += values.production ? values.production : 0;
            consumedTT += values.consumption ? values.consumption : 0;
            reserveTT += values.reserves ? values.reserves : 0;
        }
        consumptionPoints.push({ xpoint: parseInt(year.substring(1)), ypoint: Math.round(consumedTT) });
        productionPoints.push({ xpoint: year.substring(1), ypoint: Math.round(productedTT) });
        reservesPoints.push({ xpoint: year.substring(1), ypoint: Math.round(reserveTT) });
    }
    console.log(consumptionPoints);
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(consumptionPoints, function (d) { return new Date(d.xpoint, 0, 1); }))
        .range([20, width - 50]);
    svg.append("g")
        .attr("transform", "translate(30," + height / 2 + ")")
        .call(d3.axisBottom(x));
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(consumptionPoints, function (d) { return d.ypoint; })])
        .range([height / 2, 0]);
    svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(y));
    // Add the line

    var Gen = d3.line()
        .x((p) => x(new Date(p.xpoint, 0, 1)))
        .y((p) => y(p.ypoint))
    const hoverChart = (d) => {
            const xMousePosition = d3.mouse(svg.node())[0] - 30;
            const xScale = d3.scaleTime()
                .domain(d3.extent(consumptionPoints, function (d) { return new Date(d.xpoint, 0, 1); }))
                .range([20, width - 50]);
            const YMousetPosition = d3.mouse(svg.node())[1];
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(consumptionPoints, function (d) { return d.ypoint; })])
                .range([height / 2, 0]);
            const consumption = numberWithSpaces(Math.floor(yScale.invert(YMousetPosition)));
            const year = xScale.invert(xMousePosition).getFullYear();
            const tooltipContent = `
                <div>Year: ${year}</div>
                <div>${curveEnergyType[selectedEnergyType].legend}: ${consumption}</div>
            `;
            console.log(tooltipContent);
            tooltip
            .html(tooltipContent)
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px')
            .transition()
            .duration(400)
            .style('opacity', 1)
            .style('display', 'block')
            .style('background-color', 'white')
            .style('border', '1px solid black')
            .style('padding', '5px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
    }
    const leaveChart = () => {
        tooltip.transition().duration(300).style('opacity', 0);

    }

    svg.append("path").datum(consumptionPoints)
        .attr("fill", "none")
        .attr("transform", "translate(30,0)")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", Gen);
    svg.append("g")
        .selectAll("dot")
        .data(consumptionPoints)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(new Date(d.xpoint, 0, 1)) })
        .attr("cy", function (d) { return y(d.ypoint) })
        .attr("r", 5)
        .attr("transform", "translate(30,0)")
        .attr("fill", "#69b3a2")
        .on('mouseover', hoverChart)
        .on('mouseleave', leaveChart)



    for (let i = 0; i < energyBtn.length; i++) {
        energyBtn[i].addEventListener('click', () => {
            selectedEnergyType = energyBtn[i].getAttribute('energy-type');
            // drawLegend();
            // world.selectAll('path').attr('fill', function(d) {
            //     return fillMap(d, yearSlider.value);
            // });
            curveTitle.innerText = curveEnergyType[selectedEnergyType].title
        });
    }

    
    
}