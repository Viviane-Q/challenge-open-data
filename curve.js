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


var Gen = d3.line()
    .x((p) => new Date(p.xpoint, 0, 1))
    .y((p) => p.ypoint)
    .curve(d3.curveBasis);

const svg = d3.select(document.getElementById('curve-chart'))

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
        consumptionPoints.push({ xpoint: year.substring(1), ypoint: consumedTT });
        productionPoints.push({ xpoint: year.substring(1), ypoint: productedTT });
        reservesPoints.push({ xpoint: year.substring(1), ypoint: reserveTT });
    }
    console.log(consumptionPoints);
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(consumptionPoints, function(d) { return new Date(d.xpoint, 0, 1); }))
        .range([20, width - 50]);
    svg.append("g")
        .attr("transform", "translate(30," + height/2  + ")")
        .call(d3.axisBottom(x));
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(consumptionPoints, function(d) { return d.ypoint; })])
        .range([height/2, 0]);
    svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(y));
    // Add the line

    svg.append("path").datum(consumptionPoints).attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", Gen);

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