d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

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

/////////////////// MUNDO /////////////////////////
// Se establece el ancho y el largo
var width = 1000,
    height = 1200;

<!-- El mapa es ortografico, hay mas modelos a escoger -->
<!-- translate: Pone el centro del grafico en el centro -->
<!-- scale: Reduce la escala del grafico -->
<!-- clipAngle: Define el radio del circulo del mundo -->
var projection = d3.geo.orthographic()
    .translate([(width-40) / 2, (height+10) / 2])
    .scale((width-40) / 2 - 20)
    .clipAngle(90)
    .precision(0.6);

//////////////// SVG MUNDO //////////////////
<!-- Crea un lugar de dibujo con el movimiento de girar -->
var svg = d3.select("#Mundo").append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", mousedown)

    <!-- Crea un nuevo path para el generador geografico -->
<!-- projection: Configura el nuevo path con la proyecion creada antes -->
<!-- context: Con el contexto anterior, 2D -->
var path = d3.geo.path()
    .projection(projection)

// Se añade el campo para poner el nombre del pais
svg.append("text")
    .attr('class','etiqueta')
    .attr('x',50)
    .attr('y',90)
    .style('font-size', '48px')
    .text('País')

svg.append("text")
    .attr('class','etiquetaAnio')
    .attr('x',50)
    .attr('y',150)
    .style('font-size', '48px')
    .text(1743)

svgB.append("text")
    .attr('class','etiquetaG')
    .attr('x',400)
    .attr('y',0)
    .style('font-size', '48px')

<!-- Configura el titulo de la pagina -->
var title = d3.select("h1");

///////////////// VARIABLES GLOBALES /////////////////////
var temperatura;
var anio=1743;
var countries_all;
var countries;
var anio2=0;

///////////////////// PROGRAMA PRINCIPAL //////////////////////
<!-- queue: crea una cola de tareas a realizar (defer) -->
<!-- Con 'await' se ejecuta la funcion, una vez terminadas las tareas anteriores -->
queue()
    .defer(d3.json, "world-110m.json")
    .defer(d3.tsv, "world-country-names.tsv")
    .defer(d3.csv, "DatosTratadosAno.csv")
    .await(ready);

<!-- Funcion que se ejecuta al leer los datos -->
<!-- queue devuelve: -->
<!-- error lo primero, luego lo devuelto por la primera tarea, y por ultimo lo de la segunda -->
function ready(error, world, names, temp) {
    if (error) throw error;

    /////////////// VARIABLES //////////////////////
    <!-- Se crean una serie de variables -->
    <!-- globe: funcion para el globo del mundo -->
    <!-- Obtiene las caracteristicas de cada uno de los paises del JSON -->
    countries = topojson.feature(world, world.objects.countries).features;

    globe = {type: "Sphere"};
    <!-- Obtiene los puntos donde se encuentra la tierra del archivo JSON -->
    var  land = topojson.feature(world, world.objects.land),
    <!-- Devuelve la geometria de los paises en el mapa, haciendo un filtro con dos objetos -->
    <!-- geometricos que comparten un borde interior, selecionandolo para uno de ellos -->
        borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }),
    <!-- Indice del primer elemento en TSV -->
        i = -1;

    // Se asigna el valor leido a la variable global
    temperatura = temp;

    ////////////// FILTROS ///////////////////////////
    <!-- Guarda los paises que pasan un filtro con las caracteristicas -->
    countries = countries.filter(function(d) {
        <!-- Se seleccionan los nombres de los paises con los nombres que cumplen -->
        return names.some(function(n) {
            <!-- Se buscan aquellos paises en JSON y el TSV con el mismo 'id' -->
            <!-- Y se añade un campo con el nombre si se cumple todo -->
            if (d.id == n.id) return d.name = n.name;   // n.name tiene nombres de paises
        });
    });

    // GUARDAMOS LOS VALORES DE TEMPERATURA Y AÑO
    // Para buscar las temperaturas y las fechas
    countries_all = countries.filter(function(d) {
        return temperatura.some(function(n) {
            if (d.name == n.Country)
                return {TEMP: d.temp = n.AverageTemperature, DT: d.dt = n.dt}
        });
    });

    // GUARDAMOS LOS AÑOS LA PRIMERA VEZ LOS DE 1743
    countries = countries.filter(function(d) {
        return temperatura.some(function(m) {
            if (m.dt == anio)
                if (d.name == m.Country) {
                    return d.temp = m.AverageTemperature;
                }
        })
    });

    //////////////// COLOR BREWER /////////////////////
    // Para los colores
    // Limites de los datos
    extentTemp = d3.extent(temperatura, function(d) { return +d['AverageTemperature']});
    // Paso para cada color en la escala
    step = (extentTemp[1]-extentTemp[0])/(11.0-1.0);
    // Dominio de los datos
    dominio = d3.range(extentTemp[0],extentTemp[1]+step,step);
    // Rango de la escala de colores
    rango = colorbrewer['BuRd'][11];
    // Escala de colores
    color = d3.scale.linear().domain(dominio).range(rango);

    //////////// COLORES DE LOS PAISES Y EL GLOBLO ///////////////
    // COLORES DEL GLOBO
    svg.append('path')
        .datum(globe)
        .style('stroke', '#000')
        .style('stroke-width',15)
        .style('fill', 'transparent')
        .attr('d',path)

    // COLORES DE LOS PAISES
    svg.selectAll('.country')
        .data(countries)
        .enter()
        .append('path')
        .attr('d',path)
        .style('fill', function(d) { return color(d.temp)})
        .style('stroke','#fff')
        .on("mouseover", function(d) {update_name(d)})
        .on("click",function(d) {update_chart(d)})

    //////////////////////////////////////////////////////////////
    // ESCALA DE COLOR
    // creamos un grupo para la leyenda de la escala de color
    colorbar = svg.append('g')
        .attr('class','colorbar')
        .attr('transform','translate('+ (width-40) + ',' + 70 + ')')

    // añadimos la escala de color con los rectángulos
    colorbar.selectAll('rect')
        .data(rango)
        .enter()
        .append('rect')
        .attr('x',function(d,i){return 20})
        .attr('y',function(d,i){return i*20})
        .attr('width',function(d,i){return 20})
        .attr('height',function(d,i){return 20})
        .style('fill',function(d,i){return d})
        .style('opacity',.8)

    // añadimos los valores numéricos
    colorbar.selectAll('text')
        .data(dominio)
        .enter()
        .append('text')
        .attr("text-anchor", "end")
        .attr('class','label')
        .attr('x',function(d,i){return 5})
        .attr('y',function(d,i){return i*20+10})
        .text(function(d){return d.toFixed(1)})		// ToFixed para un solo decimal

    // añadimos la etiqueta de la leyenda
    colorbar.append('text')
        .attr('class','label')
        .attr("text-anchor", "end")
        .attr('x',20)
        .attr('y',-10)
        .text('Temperatura ºC')
    ///////////////////////////////////////////////////////////////

    init(countries_all,globe);

}

d3.select(self.frameElement).style("height", height + "px");

/////////////////// INIT ////////////////////////
function init(countries,globe) {

    // Cuando se mueve la barra, actualizamos los colores
    d3.select("#SliderTiempo")
        .on("mousemove", function() {
            update_anioSlider();
        })
    d3.select("#InputAnio")
        .on("change",function() {
            update_anioInput();
        })
}

/////////////////// CLICK: ACTUALIZAR VALOR AÑO //////////////
function update_anioSlider()
{
    anio = SliderTiempo.value;

    countries1 = countries_all.filter(function(d) {
        return temperatura.some(function(m) {
            if (m.dt == anio) {
                if (d.name == m.Country) {
                    return {TEMP1: d.temp1 = m.AverageTemperature}
                }
            }
        })
    })

    d3.select('.etiquetaAnio')
        .attr('x',50)
        .attr('y',150)
        .style('font-size', '48px')
        .text(anio.toString());

    svg.selectAll('.country')
        .data(countries_all)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', '#fff')
        .style('stroke', '#fff')

    update_temp();
}

///////////////////// CHANGE: ACTUALIZAR VALOR AÑO //////////////
function update_anioInput()
{
    anio2 = InputAnio.value;

    countries2 = countries_all.filter(function(d) {
        return temperatura.some(function(m) {
            if (m.dt == anio2) {
                if (d.name == m.Country) {
                    return {TEMP2: d.temp2 = m.AverageTemperature}
                }
            }
        })
    })

    svg.selectAll('.country')
        .data(countries_all)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', '#fff')
        .style('stroke', '#fff')

    update_temp();
}

////////////////// MOUSEMOVE: ACTUALIZAR COLORES ////////////////////
function update_temp() {

    if (anio2<"1743"){

        svg.selectAll('.country')
            .data(countries1)
            .enter()
            .append('path')
            .attr('d', path)
            .style('fill', function (d) {
                return color(d.temp)
            })
            .style('stroke', '#fff')
            .on("mouseover", function (d) {
                update_name(d)
            })
            .on("click", function (d) {
                update_chart(d)
            });

        d3.selectAll('.label')
            .data(dominio)
            .attr('x',function(d,i){return 5})
            .attr('y',function(d,i){return i*20+10})
            .text(function(d){return d.toFixed(1)})		// ToFixed para un solo decimal

    }
    else {

        countries_diff = countries1.filter(function (d) {
            return countries2.some(function (m) {
                if (m.name == d.name) {
                    if (d.temp1 != "" && m.temp2 != "") {
                        return {DIFF: d.diff = d.temp1 - m.temp2}
                    }
                }
            })
        })

        //////////////// ACTUALIZAR ESCALA /////////////////////
        // Para los colores
        // Limites de los datos
        extentTemp_diff = d3.extent(countries_diff, function(d) { return +d['diff']});
        // Paso para cada color en la escala
        step_diff = (extentTemp_diff[1]-extentTemp_diff[0])/(11.0-1.0);
        // Dominio de los datos
        dominio_diff = d3.range(extentTemp_diff[0],extentTemp_diff[1]+step_diff,step_diff);
        // Escala de colores
        color_diff = d3.scale.linear().domain(dominio_diff).range(rango);

        svg.selectAll('.country')
            .data(countries_diff)
            .enter()
            .append('path')
            .attr('d', path)
            .style('fill', function (d) {
                return color_diff(d.diff)
            })
            .style('stroke', '#fff')
            .on("mouseover", function (d) {
                update_name(d)
            })
            .on("click", function (d) {
                update_chart(d)
            });

        d3.selectAll('.label')
            .data(dominio_diff)
            .attr('x',function(d,i){return 5})
            .attr('y',function(d,i){return i*20+10})
            .text(function(d){return d.toFixed(1)})		// ToFixed para un solo decimal

    }

}

//////////////////// MOSEOVER: ACTUALIZAR NOMBRE PAIS /////////////////
function update_name(d)
{
    d3.select('.etiqueta')
        .datum(d)
        .attr('x',50)
        .attr('y',90)
        .style('font-size', '48px')
        .text(function(n) { return n.name });

}

/////////////////// CLICK: ACTUALIZAR GRAFICO ///////////////////////
function update_chart(d)
{
    d3.select('.etiquetaG')
        .datum(d)
        .attr('x',400)
        .attr('y',0)
        .style('font-size', '48px')
        .text(function(n) { return n.name });

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


//////// MOVER LA TIERRA ////////////
var m0, o0;

function mousedown() {
    m0 = [d3.event.pageX, d3.event.pageY];
    o0 = projection.rotate();
    d3.event.preventDefault();
}

function mousemove() {
    if (m0) {

        svg.selectAll('.country')
            .data(countries_all)
            .enter()
            .append('path')
            .attr('d', path)
            .style('fill', '#fff')
            .style('stroke', '#fff')

        var m1 = [d3.event.pageX, d3.event.pageY]
            , o1 = [o0[0] + (m1[0] - m0[0]) / 6, o0[1] + (m0[1] - m1[1]) / 6];

        projection.rotate(o1);

        update_temp();

    }
}

function mouseup() {
    if (m0) {
        mousemove();
        m0 = null;
    }
}
