
var nestedData = [];
var maxvals = [];
var maxpriceval = 0;
var legendcolor = ["#ffffcc","#a1dab4", "#41b6c4", "#2c7fb8", "#253494"];
var k = 1;
var whiteShadow = "-1px -1px 2px #ccc, 1px -1px 2px #ccc, -1px  1px 2px #ccc, 1px  1px 2px #ccc";

var mapdatas = [];

// get the csv data of the line chart and bar chart
d3.queue(3)
    .defer(d3.csv, 'OffersPerdistrict__Apartments.csv')
    .defer(d3.csv, 'AveragePricePerDistrict__Apartments.csv')
    .defer(d3.csv, 'riyadh_districts_NEW.csv')
	.defer(d3.json, 'boundary_polygon.json')
    .await(interactivedata);

function interactivedata(error, districtbar, priceline, pointsdata, mapdata){

	mapdatas = mapdata;
	for(var i = 0; i<districtbar.length; i++){
		nestedData[i] = {
			district_name_en: districtbar[i].district_name_en,
			values: [
				{barval: districtbar[i].Total_offers},
				{
					2014 : priceline[i][2014],
					2015 : priceline[i][2015],
					2016 : priceline[i][2016]
				},
				{
					lat : pointsdata[i].Latit,
					long : pointsdata[i].Long,
				}
			],
			orderval : i
		}
	}
	// get the price of the linechart
	for(var i = 0; i< nestedData.length; i++){

		let pricelineval = nestedData[i].values;
		let pval = Object.values(pricelineval[1]);
		maxvals[i] = Math.max(...pval);
	}
	maxpriceval = Math.max(...maxvals);

	var yearval = 2016;
	linechart(nestedData);
	mapchart(yearval, mapdata);
	barchart(nestedData);
}

// draw map function
function mapchart(yearval, mapdata){

	// set the margin and width and height of the map
	var margin = {top: 30, left: 30, bottom: 30, right: 30};
	var w1 = window.innerWidth*2/3 - margin.left - margin.right;
	var h1 = document.getElementById('map').clientHeight - margin.top - margin.bottom;
	// D3 projection
	var projection = d3.geoMercator()
						.center([46.7, 24.7])
						.scale(3500)
						.translate([w1/2, h1/2]);

	// Define path generator
	var path = d3.geoPath()
	  .projection(projection);

	// append svg to the map chart part
	var svg1 = d3.select("#map").append("svg")
		.attr("width", w1 + margin.left + margin.right)
		.attr("height", h1 + margin.top + margin.bottom);

	// set the tooltip
	var tooltip = d3.select("#map")
		.append("div")
		.attr("class", "tooltip")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("font-size", "1.3em")
		.style("text-shadow", whiteShadow)
		.style("pointer-events", "none")
		.style("visibility", "hidden");

	// zoom range of the map
	var zoom = d3.zoom()
		.scaleExtent([0.01,200])
		.on('zoom', zoomed);

	var svgmap = svg1.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	var svgpoints = svg1.append("g")
		.attr("id", "points")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

	svg1.call(zoom)
	console.log(colorval(41000));
	var drawmap = svgmap.selectAll("path")
		.data(mapdata.features).enter()
		.append("path")
		.attr("d", path)
		.attr("stroke-width", 2)
		.attr("stroke", "#949494")
		.attr("fill", "none");

	// add the points to the map
	const circles = svgpoints.selectAll('circle')
            .data(nestedData)
            .enter()
            .append('circle')
            .attr("id", function(d){
            	return "line" + d.orderval;
            })
            .attr('cx', function(d){
            	var cood = d.values[2];
            	var longval = cood.long;
            	var latval = cood.lat;
            	return projection([longval, latval])[0];
            })
            .attr('cy', function(d){
            	var cood = d.values[2];
            	var longval = cood.long;
            	var latval = cood.lat;
            	return projection([longval, latval])[1];
            	})
            .attr('r', 5)
            .style('fill', function(d){
            	let priceval = parseFloat(d.values[1][yearval]);
            	return colorval(priceval);
            })
            .on("mouseover", function(d, i){

            	let priceval = d.values[1][yearval];
            	var districtname = d.district_name_en;
            	var currentID = d3.select(this).attr("id");
            	let bval = d.values[0];
            	let barval = bval.barval;
            	let gety = d3.select("#barchart").selectAll("#" + currentID).attr("y");
            	let getwidth = d3.select("#barchart").selectAll("#" + currentID).attr("width");

            	d3.select(this)
            		.attr("r", 10/k)
            		.attr("stroke", "#121212")
            		.attr("stroke-width", 1/k)
            		.style("cursor", "pointer");

            	tooltip.style("visibility", "visible")
            		.html("District Name : " + d.district_name_en + "<br/>" + "Price : SAR " + priceval)
            		.style("top", (event.pageY - 10) + "px")
            		.style("left", (event.pageX + 10) + "px")
            		.attr("font-family", "arial");

            	// d3 linechart remove siblings of the current line and add style to the current line.
            	d3.select("#linechart").selectAll(".lines path")
            		.attr("stroke-width", 0);

            	d3.select("#linechart #" + currentID)
            		.attr("stroke", "red")
            		.attr("stroke-width", 3);

        		// d3 bar chart change color
        		d3.select("#barchart #" + currentID)
        			.attr("fill", "yellow");

            	d3.select("#barchart").selectAll(".tooltip1").style("visibility", "visible")
            		.html("Offers : " + barval )
            		.style("top", gety + "px")
            		.style("right", 250 + "px")
            		.attr("font-family", "arial")
    				.attr("font-size", 10);
            })
            .on("mouseout", function(d){

            	var currentID = d3.select(this).attr("id");
            	d3.select(this)
            		.transition()
            		.duration(250)
            		.attr("r", 5/k)
            		.attr("stroke-width", "0");
            	tooltip.style("visibility", "hidden");

            	d3.select("#barchart").selectAll(".tooltip1").style("visibility", "hidden");

            	// d3 linechart remove siblings of the current line and add style to the current line.
            	d3.select("#linechart").selectAll(".lines path")
            		.attr("stroke-width", 1);

            	d3.select("#linechart #" + currentID)
            		.attr("stroke", "#000")
            		.attr("stroke-width", 1);

            	// d3 bar chart change color
        		d3.select("#barchart #" + currentID)
        			.attr("fill", "#41b6c4");

            });

    var legendval = [10000, 20000, 30000, 40000,50000,60000];
    // add the legend to the map
    var legend = svg1.append("g")
    	.selectAll("rect")
    	.data(legendval).enter()
    	.append("g")
    	.attr("class", "legend");

    legend.append("rect")
    	.attr("x", 20.5)
    	.attr("y", function(d, i){
    		return i * 30 + 20.5;
    	})
    	.attr("width", 20)
    	.attr("height", 20)
    	.style("stroke", "grey")
    	.style("stroke-width", "1px")
    	.attr("fill", function(d, i){
    		return legendcolor[i];
    	});

    legend.append("text")
    	.text(function(d, i){
    		var textval = "";
        if(i == 0){
    			textval = "< SAR " + legendval[i];
    		}else if (i >=1){
    			textval = "SAR " + legendval[i-1] + " - SAR " + legendval[i];
    		}
    		return textval;
    	})
    	.attr("x", 45)
    	.attr("dx", 0.5 + "em")
    	.attr("y", function(d, i){
    		return i * 30 + 20;
    	})
    	.attr("dy", "0.8em")
    	.style("font-size", "0.8em");

	// zoom function of the mapchart
	function zoomed() {
	  svgmap.style("stroke-width", 1);
	  k = d3.event.transform.k;
	  svgmap.attr("transform", d3.event.transform);
	  drawmap.attr('stroke-width', (1/k));
	  svgpoints.attr("transform", d3.event.transform);
	  circles.attr('r', (5/k) + "px");
	}
}

function linechart(nestedData){
  let tipBox;
	// set the margin and width and height of the linechart
	var margin = {top: 80, bottom: 30, left: 30, right: 80};
	var w2 = window.innerWidth * 2/3 - margin.left - margin.right;
	var h2 = document.getElementById('linechart').clientHeight - margin.top - margin.bottom;

	// time parse
	var parseDate = d3.timeParse("%Y");
	var bisectDate = d3.bisector(function(d) { return d.date; }).left;
	// set the color
	var color = d3.scaleOrdinal(d3.schemeCategory10);

	// add svg to the linechart part
	var svg2 = d3.select("#linechart").append("svg")
		.attr("width", (w2 + margin.left + margin.right))
		.attr("height", (h2 + margin.top + margin.bottom))
		.append("g")
		.attr("transform", "translate(" + margin.top + "," + margin.left + ")");

	var data = [];
	for(var i = 0; i < nestedData.length; i++){
		let prices = nestedData[i].values;
		var priceval1 = prices[1][2014];
		var priceval2 = prices[1][2015];
		var priceval3 = prices[1][2016];

		data[i] = {
			district_name_en : nestedData[i].district_name_en,
			values : [
				{date: 2014, price: priceval1},
				{date: 2015, price: priceval2},
				{date: 2016, price: priceval3}
			],
			order: nestedData[i].orderval
		}
	}
	data.forEach(function(d) {
	    d.values.forEach(function(d) {
	        d.date = parseDate(d.date);
	        d.price = +d.price;
	    });
    });

	// scale
	var xScale = d3.scaleTime().domain(d3.extent(data[0].values, d=>d.date)).range([0, w2]);
	var yScale = d3.scaleLinear().domain([0, maxpriceval]).range([h2, 0]);

	// add line to the svg
	var line = d3.line()
		.x(d => xScale(d.date))
		.y(d => yScale(d.price));

	let lines = svg2.append("g").attr("class", "lines");
	lines.selectAll(".line-group")
		.data(data).enter()
		.append("path")
		.attr("id", function(d,i){
			return "line" + d.order;
		})
		.attr("d", function(d){
			return line(d.values);
		})
		.attr("fill", "none")
		.attr("stroke", "#000")
		.attr("stroke-width", 1)
		.style('opacity', 1);

	// draw axis
	var xAxis = d3.axisBottom(xScale).ticks(4);
	var yAxis = d3.axisLeft(yScale).ticks(5);

	svg2.append("g")
		.attr('class', 'x axis')
		.attr('transform', `translate(0, ${h2})`)
		.call(xAxis);

	svg2.append('g')
		.attr('class', 'y axis')
		.call(yAxis)
		.append('text')
		.attr('y', 15)
		.attr("dy", -2 + "em")
		.attr("dx", "2.1em")
		.attr('fill', '#000')
		.text('Price (SAR)')
		.attr("font-size", "1.4em");

	// add tooltipline to the linechart svg.
    var focus = svg2.append("g")
        .attr("class", "focus");

    focus.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", h2)
        .attr("stroke", "#41b6c4")
        .attr("stroke-width", 2)
        .attr("transform", "translate(" + xScale(parseDate(2016)) + "," + 0 + ")");

    // flag use for mouse click and mouse out
    var isClicked = false;

    svg2.append("rect")
        .attr("class", "overlay")
        .attr("width", w2)
        .attr("height", h2)
        .attr("fill", "#ccc")
        .attr("opacity", "0")
        .on("mousemove", mousemove)
        .on("mouseout", function() {
        	if(!isClicked){
        		focus.selectAll(".hover-line").attr("transform", "translate(" + xScale(parseDate(2016)) + "," + 0 + ")");
        	}
        });

    svg2.select(".overlay")
        .on("click", function(){
	    	var datedata = data[0].values;
	      	var x0 = xScale.invert(d3.mouse(this)[0]),
	          i = bisectDate(datedata, x0, 1),
	          d0 = datedata[i - 1],
	          d1 = datedata[i],
	          d = x0 - d0.date > d1.date - x0 ? d1 : d0;
	        let year = d.date;
	        var yearstring = new Date(year).getFullYear();

	        isClicked = !isClicked;
	        focus.select(".hover-line").attr("transform", "translate(" + xScale(d.date) + "," + 0 + ")");

	        // original points hidden in the map
	        d3.select("#map").html("");
	        // add new points in the map
	        mapchart(yearstring, mapdatas);

    	})

    function mousemove() {
    	var datedata = data[0].values;
      	var x0 = xScale.invert(d3.mouse(this)[0]),
          i = bisectDate(datedata, x0, 1),
          d0 = datedata[i - 1],
          d1 = datedata[i],
          d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        let year = d.date;
        var yearstring = new Date(year).getFullYear();
        focus.selectAll(".hover-line").attr("transform", "translate(" + xScale(d.date) + "," + 0 + ")");

	    // // original points hidden in the map
	    //d3.select("#map").html("");
	    // // add new points in the map
	    // mapchart(yearstring, mapdatas);
    }

}
function barchart(nestedData){
	// set the margin and width and height of the bar chart
	var margin = {top: 30, bottom: 30, left: 30, right: 60};
	var w3 = window.innerWidth * 1/3 - margin.left - margin.right;
	var h3 = document.getElementById('barchart').clientHeight - margin.top - margin.bottom;

	// set the scale of the bar
	var y = d3.scaleBand()
			.range([h3, 0])
			.padding(0.2);

	var x = d3.scaleLinear()
			.range([0, w3]);

	// append svg to the bar chart part.
	var svg3 = d3.select("#barchart").append("svg")
	    .attr("width", w3 + margin.left + margin.right)
	    .attr("height", h3 + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform",
	          "translate(" + margin.left + "," + margin.top + ")");

    // add the tooltip to the bar chart
	var tooltip1 = d3.select("#barchart")
		.append("div")
		.attr("class", "tooltip1")
		.style("position", "absolute")
		.style("font-size", "1.2em")
		.style("text-shadow", whiteShadow)
		.style("pointer-events", "none")
		.style("visibility", "hidden");
	var bardata = [];
	for(var i = 0; i<nestedData.length; i++){

		var bval = nestedData[i].values[0];
		bardata[i] = {
			name : nestedData[i].district_name_en,
			value : bval.barval
		}
	}

	nestedData.forEach(function(d, i){
		d.order = +i;
	})

	nestedData.sort(function(a,b){
		var aval = a.values[0].barval;
		var bval = b.values[0].barval;
		return d3.ascending(parseFloat(aval), parseFloat(bval) );
	});

	let maxbar = [];
	for(var i = 0; i<nestedData.length; i++){
		let barvals = nestedData[i].values[0];
		maxbar[i] = barvals.barval;
	}
	let mbar = Math.max(...maxbar);

	x.domain([0, mbar])
	y.domain(nestedData.map(function(d) { return d.district_name_en; }));

	svg3.selectAll(".bar")
      .data(nestedData)
    .enter().append("rect")
      .attr("id", function(d){
      	return "line" + d.order;
      })
      .attr("width", function(d) {return x(d.values[0].barval); } )
      .attr("y", function(d) { return y(d.district_name_en); })
      .attr("height", y.bandwidth())
      .attr("fill", "#41b6c4")
      .on("mouseover", function(d){
      	var currentID = d3.select(this).attr("id");
    	let priceval = d.values[1][2016];
    	var districtname = d.district_name_en;
    	let bval = d.values[0];
    	let barval = bval.barval;
    	let getcx = d3.select("#map").selectAll("#" + currentID).attr("cx");
    	let getcy = d3.select("#map").selectAll("#" + currentID).attr("cy");
    	let gety = d3.select("#barchart").selectAll("#" + currentID).attr("y");
    	let getwidth = d3.select("#barchart").selectAll("#" + currentID).attr("width");

      	d3.select(this)
      		.attr("fill", "yellow");

    	tooltip1.style("visibility", "visible")
    		.html("District Name : " + districtname + "</br>" + "Offers : " + barval )
    		.style("top", gety + "px")
    		.style("right", 100 + "px")
    		.attr("font-family", "arial")
			.attr("font-size", 11);

		d3.select("#map").selectAll("#points circle")
			.attr("visibility", "hidden");

      	d3.select("#map").selectAll("#" + currentID)
      		.attr("r", 10/k)
      		.attr("stroke", "#000")
      		.attr("stroke-width", "0.2")
      		.attr("visibility", "visible");

		d3.select("#map").selectAll(".tooltip").style("visibility", "visible")
    		.html("Price : SAR " + priceval)
    		.style("top", (getcx - 310) + "px")
    		//.style("left", (getcy + 210) + "px")
        .style("right", (getcy - 300) + "px")
    		.attr("font-family", "arial");

      	d3.select("#linechart").selectAll(".lines path")
            		.attr("stroke-width", 0);

    	d3.select("#linechart #" + currentID)
    		.attr("stroke", "red")
    		.attr("stroke-width", 3);


      })
      .on("mouseout", function(d){

      	var currentID = d3.select(this).attr("id");
      	d3.select(this)
      		.attr("fill", "#41b6c4");
      	tooltip1.style("visibility", "hidden");

      	d3.select("#map").selectAll("#points circle")
			.attr("visibility", "visible")
			.attr("stroke-width", 0)
			.attr("r", 5/k);

		d3.select("#map").selectAll(".tooltip").style("visibility", "hidden");

      	d3.select("#linechart").selectAll(".lines path")
			.attr("stroke-width", 1)
			.attr("stroke", "#000");
      });
}

// dynamic legend function
function colorval(priceval){
	var step = 10000 ;
	let cval = "";
    if(priceval >= 0 && priceval < step){
        cval = legendcolor[0];
    }else if(priceval >= step && priceval < step * 2){
        cval = legendcolor[1];
    }else if(priceval >= step * 2 && priceval < step * 3){
        cval = legendcolor[2];
    }else if(priceval >= step * 3 && priceval < step * 4){
        cval = legendcolor[3];
    }else if(priceval >= step * 4 && priceval < step * 5){
        cval = legendcolor[4];
      }

	return cval;
}
