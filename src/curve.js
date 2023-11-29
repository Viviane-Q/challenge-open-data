function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const curveEnergyType = {
    consumption: {
        title: `Annual oil consumption (TWh)`,
        unit: 'TWh',
        legend_simple: `Consumption`,
        curveColor: '#2a5c9d',
    },
    production: {
        title: `Annual oil production (TWh)`,
        unit: 'TWh',
        legend_simple: `Production`,
        curveColor: '#238358',
    },
    reserves: {
        title: `Annual oil reserves (Million Barrels)`,
        unit: 'Million Barrels',
        legend_simple: `Reserves`,
        curveColor: '#dc7830',
    },
};

const curveTitle = document.querySelector('#curve-title');
const curveSvg = document.querySelector('#curve-chart');

// svg.on('mouseover', hoverChart)

let consumptionPoints = [];
let productionPoints = [];
let reservesPoints = [];

function calculateValues() {
    consumptionPoints = [];
    productionPoints = [];
    reservesPoints = [];
    for (const [year, countries] of Object.entries(data)) {
        let productedTT = 0;
        let consumedTT = 0;
        let reserveTT = 0;
        for (const [country, values] of Object.entries(countries)) {
            if (
                selectedCountries.includes(country) ||
                selectedCountries.length === 0
            ) {
                productedTT += values.production ? values.production : 0;
                consumedTT += values.consumption ? values.consumption : 0;
                reserveTT += values.reserves ? values.reserves : 0;
            }
        }
        if (reserveTT == 0) reserveTT = null;
        if (productedTT == 0) productedTT = null;
        if (consumedTT == 0) consumedTT = null;

        if (Math.round(consumedTT) != 0) {
            consumptionPoints.push({
                xpoint: parseInt(year.substring(1)),
                ypoint: parseFloat(consumedTT.toFixed(2)),
            });
        }
        if (Math.round(productedTT) != 0) {
            productionPoints.push({
                xpoint: parseInt(year.substring(1)),
                ypoint: parseFloat(productedTT.toFixed(2)),
            });
        }
        if (Math.round(reserveTT) != 0) {
            reservesPoints.push({
                xpoint: parseInt(year.substring(1)),
                ypoint: parseFloat(reserveTT.toFixed(2)),
            });
        }
    }
}

function drawChart(data) {
    const svg = d3.select(document.getElementById('curve-chart'));
    svg.selectAll('*').remove();
    // Add X axis --> it is a date format
    var x = d3
        .scaleTime()
        .domain(
            d3.extent(data, function (d) {
                return new Date(d.xpoint, 0, 1);
            })
        )
        .range([20, width - 50]);
    svg.append('g')
        .attr('transform', `translate(30, ${height / 2 - 24})`)
        .call(d3.axisBottom(x));
    // Add Y axis
    var y = d3
        .scaleLinear()
        .domain([
            d3.min(data, function (d) {
                return d.ypoint;
            }),
            d3.max(data, function (d) {
                return d.ypoint;
            }),
        ])
        .range([height / 2 - 24, 0]);
    const axisY = d3.axisLeft(y);
    axisY.tickFormat(d3.format('.0f'));
    svg.append('g').attr('transform', 'translate(50,0)').call(axisY);
    // Add the line

    var Gen = d3
        .line()
        .x((p) => x(new Date(p.xpoint, 0, 1)))
        .y((p) => y(p.ypoint));
    const hoverChart = (d) => {
        const year = d.xpoint;
        let consumption = d.ypoint;
        const tooltipContent = `Year: ${year}\r\n
                ${curveEnergyType[selectedEnergyType].legend_simple}: ${consumption} ${curveEnergyType[selectedEnergyType].unit}
            `;
        tooltip
            .text(tooltipContent)
            .style('left', d3.event.pageX + 15 + 'px')
            .style('top', d3.event.pageY - 100 + 'px')
            .transition()
            .duration(400)
            .style('opacity', 1)
            .style('display', 'block')
            .style('background-color', 'white')
            .style('border', '1px solid black')
            .style('padding', '5px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');
        svg.selectAll('circle')
            .filter(function (p) {
                return p.xpoint == year;
            })
            .attr('r', 10);
    };
    const leaveChart = (d) => {
        tooltip.transition().duration(300).style('opacity', 0);
        svg.selectAll('circle')
            .filter(function (p) {
                return p.xpoint == d.xpoint;
            })
            .attr('r', 5);
    };

    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('transform', 'translate(30,0)')
        .attr('stroke', curveEnergyType[selectedEnergyType].curveColor)
        .attr('stroke-width', 2)
        .attr('d', Gen);
    svg.append('g')
        .selectAll('dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function (d) {
            return x(new Date(d.xpoint, 0, 1));
        })
        .attr('cy', function (d) {
            return y(d.ypoint);
        })
        .attr('r', 5)
        .attr('transform', 'translate(30,0)')
        .attr('fill', curveEnergyType[selectedEnergyType].curveColor)
        .on('mouseover', hoverChart)
        .on('mouseleave', leaveChart);
    curveSvg.style.overflow = 'visible';
}

function curveReady(data) {
    curveTitle.innerText = curveEnergyType[selectedEnergyType].title;

    calculateValues();

    drawChart(consumptionPoints, 'consumption');

    for (let i = 0; i < energyBtn.length; i++) {
        energyBtn[i].addEventListener('click', () => {
            selectedEnergyType = energyBtn[i].getAttribute('energy-type');
            calculateValues();
            curveTitle.innerText = curveEnergyType[selectedEnergyType].title;
            if (selectedEnergyType === 'consumption') {
                drawChart(consumptionPoints, selectedEnergyType);
            } else if (selectedEnergyType === 'production') {
                drawChart(productionPoints, selectedEnergyType);
            } else {
                drawChart(reservesPoints, selectedEnergyType);
            }
        });
    }
    countryListBox.addEventListener('change', () => {
        calculateValues();
        curveTitle.innerText = curveEnergyType[selectedEnergyType].title;
        if (selectedEnergyType === 'consumption') {
            drawChart(consumptionPoints, selectedEnergyType);
        } else if (selectedEnergyType === 'production') {
            drawChart(productionPoints, selectedEnergyType);
        } else {
            drawChart(reservesPoints, selectedEnergyType);
        }
    });
    mapSvg.addEventListener('click', () => {
        calculateValues();
        curveTitle.innerText = curveEnergyType[selectedEnergyType].title;
        if (selectedEnergyType === 'consumption') {
            drawChart(consumptionPoints, selectedEnergyType);
        } else if (selectedEnergyType === 'production') {
            drawChart(productionPoints, selectedEnergyType);
        } else {
            drawChart(reservesPoints, selectedEnergyType);
        }
    });
    document
        .getElementById('map-deselect-btn')
        .addEventListener('click', () => {
            calculateValues();
            curveTitle.innerText = curveEnergyType[selectedEnergyType].title;
            if (selectedEnergyType === 'consumption') {
                drawChart(consumptionPoints, selectedEnergyType);
            } else if (selectedEnergyType === 'production') {
                drawChart(productionPoints, selectedEnergyType);
            } else {
                drawChart(reservesPoints, selectedEnergyType);
            }
        });
}
