////////////// GRAFICO DE BARRAS ///////////////////////////
// Se establecen los margenes para el grafico de barras
var marginB = {topB: 60, rightB: 0, bottomB: 30, leftB: 200},
    widthB = 1200 - marginB.leftB - marginB.rightB,
    heightB = 800 - marginB.topB - marginB.bottomB;

// Se establece la escala de las X del grafico de barras
var xB = d3.scale.ordinal()
    .rangeRoundBands([0, widthB], .1);

// Se establece la escala del grafico de barras
var yB = d3.scale.linear()
    .range([heightB, 0]);

// Escala del eje x
var xAxisB = d3.svg.axis()
    .scale(xB)
    .orient("bottom");

// Escala del eje y
var yAxisB = d3.svg.axis()
    .scale(yB)
    .orient("left")
    .ticks(10, "ºC");

var svgB = d3.select("#Grafico").append("svg")
    .attr("width", widthB + marginB.leftB + marginB.rightB)
    .attr("height", heightB + marginB.topB + marginB.bottomB)
    .append("g")
    .attr("transform", "translate(" + marginB.leftB + "," + marginB.topB + ")");

svgB.append("text")
    .attr('class','etiquetaG')
    .attr('x',400)
    .attr('y',0)
    .style('font-size', '48px')

/////////////////// CLICK: ACTUALIZAR GRAFICO ///////////////////////
function update_chart(d)
{

    var country = temperatura.filter(function(n){
        if (d.name == n.Country)
            if (n.AverageTemperature!="")
                if ((anio<(+n.dt+10)) & (anio>(n.dt-10)))
                    return {dt: temperatura.dt, AverageTemperature: temperatura.AverageTemperature}
    })


    xB.domain(country.map(function(n) { return n.dt; }));
    yB.domain(d3.extent(country, function(d) {return +d.AverageTemperature}));

    svgB.selectAll("g")
        .remove();

    svgB.selectAll(".bar")
        .data(country)
        .remove();

    svgB.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + heightB + ")")
        .call(xAxisB);

    svgB.append("g")
        .attr("class", "y axis")
        .call(yAxisB)
        .append("text")
        //.attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("dy", ".71em")
        .style('font-size', '20px')
        .style("text-anchor", "end")
        .text("Temperatura ºC");

    svgB.selectAll(".bar")
        .data(country)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(n) { return xB(n.dt); })
        .attr("width", xB.rangeBand())
        .attr("y", function(n) { return yB(n.AverageTemperature); })
        .attr("height", function(n) { return heightB - yB(n.AverageTemperature); })
        .on("mouseover", function(n) {draw_line(n)})
        .on("mouseout", function() { svgB.selectAll("line").remove(); svgB.selectAll(".etiquetaTemp").remove();})

    d3.select('.etiquetaG')
        .datum(d)
        .attr('x',400)
        .attr('y',0)
        .style('font-size', '48px')
        .text(function(n) { return n.name });
}

//////////////////// MOUSEOVER: DRAW LINE ////////////////////
function draw_line(n) {

    var y=yB(n.AverageTemperature);
    var x=xB(n.dt);
    var x_total=xB.rangeBand();

    svgB.append("line")
        .attr("class", "line")
        .attr("x1",10)
        .attr("y1",y)
        .attr("x2",1000)
        .attr("y2",y)
        .style("stroke-width", 2)
        .style("stroke", "#fff");

    svgB.append("text")
        .attr("class","etiquetaTemp")
        .attr('x',x+x_total/4)
        .attr('y',y-10)
        .style('font-size', '30px')
        .text(n.AverageTemperature.substr(0,5));

}
