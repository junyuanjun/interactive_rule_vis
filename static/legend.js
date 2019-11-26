var legendHeight = 350, legendWidth = 200;

var colors = ["steelblue", "#fb9a99"];
// var text_colors = ['#ffffcc', '#c2e699', '#78c679', '#238443'];
var text_colors = ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'];

var handleColor = "#969696", ruleColor = "#d9d9d9", gridColor = "#D3D3D3";
var font_family = "Times New Roman";
var font_size = 16;
var font = font_size + "px " + font_family;

var threshold_values = [
	[52, 104],
	[35],
	[86, 95],
	[20, 62],
	[2, 5],
];

function render_legend(id, show_rect, cond) {
	var legend = d3.select(id)
		.attr("width", legendWidth)
		.attr("height", legendHeight);

	if (cond == 'list') {
		legend.attr("transform", "translate(-100, 20)");
	} else {
		legend.attr("transform", "translate(0, 20)")
	}

	var indent = 20;
	var g = legend.append("g")	
		.attr("class", "legend");

	var yoffset = 20;
	// color legend
	var r = 10;
	g.append("text")
		.attr("x", 0)
		.attr("y", indent)
		.style("font", "16px Arial")
		.text("Label");

	yoffset += indent;
	target_names.forEach((name, i) => {
		g.append("circle")
			.attr("cx", indent)
			.attr("cy", yoffset)
			.attr("r", r)
			.attr("fill", colors[i]);
		g.append("text")
			.attr("x", indent + 2 * r)
			.attr("y", yoffset + font_size/2)
			.style("font-family", "Arial")
			.text(name);
		yoffset += r * 2 * 1.5;
	});

	// size legend
	yoffset += 10;
	// g.append("text")
	// 	.attr("x", 0)
	// 	.attr("y", yoffset)
	// 	.style("font", "16px Arial")
	// 	.text("Coverage of Rule");

	// yoffset += indent;
 //    var sizes = [0.05, 0.1, 0.3, 0.5];
	// var xoffset = 0;
	// sizes.forEach((s, i) => {
	// 	g.append("circle")
	// 		.attr("cx", indent + xoffset)
	// 		.attr("cy", yoffset)
	// 		.attr("r", radiusScale(s))
	// 		.attr("stroke", "black")
	// 		.attr("fill", "none");
	// 	xoffset += radiusScale(s) * 2 +20;
	// });
	// yoffset += radiusScale(sizes[sizes.length-1]) * 2 + 5 ;
	// xoffset = 0;
	// sizes.forEach((s, i) => {
	// 	g.append("text")
	// 		.attr("x", indent + xoffset)
	// 		.attr("y", yoffset)
	// 		.style("font-family", font_family)
	// 		.attr("text-anchor", "middle")
	// 		.text(Math.floor(100*s)+"%");
	// 	xoffset += radiusScale(s) * 2 + 20;
	// });
	// yoffset += font_size;

	if (!show_rect) return;
	// bar legend
	yoffset += 10;
	g.append("text")
		.attr("x", 0)
		.attr("y", yoffset)
		.style("font", "16px Arial")
		.text("Rules");

	yoffset += indent;
	g.append("rect")
		.attr("x", indent)
		.attr("y", yoffset)
		.attr("width", rectWidth)
		.attr("height", rectHeight)
		.attr("fill", "#fff")
		.attr("stroke", "black");
	g.append("rect")
		.attr("class", "rule-fill fill1")
		.attr("x", indent)
		.attr("y", yoffset)
		.attr("width", rectWidth*.3)
		.attr("height", rectHeight)
		// .attr("fill", ruleColor)
		.attr("stroke", "black");

	g.append("rect")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset - (handleHeight - rectHeight)/2)
		.attr("width", handleWidth)
		.attr("height", handleHeight)
		.attr("fill", handleColor)
		.attr("stroke", "black");

	g.append("text")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset - (handleHeight - rectHeight))
		.attr("text-anchor", "middle")
		.text("x");

	g.append("text")
		.attr("x", indent + rectWidth +10)
		.attr("y", yoffset + rectHeight/2)
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.text("<=x");

	yoffset += rectHeight + 10 + font_size;
	g.append("rect")
		.attr("x", indent)
		.attr("y", yoffset)
		.attr("width", rectWidth)
		.attr("height", rectHeight)
		.attr("fill", "#fff")
		.attr("stroke", "black");
	g.append("rect")
		.attr("x", indent+rectWidth*.3)
		.attr("y", yoffset)
		.attr("width", rectWidth*.7)
		.attr("height", rectHeight)
		// .attr("fill", ruleColor)
		.attr("class", "rule-fill fill1")
		.attr("stroke", "none");

	g.append("rect")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset - (handleHeight - rectHeight)/2)
		.attr("width", handleWidth)
		.attr("height", handleHeight)
		.attr("fill", handleColor)
		.attr("stroke", "black");

	g.append("text")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset - (handleHeight - rectHeight))
		.attr("text-anchor", "middle")
		.text("x");

	g.append("text")
		.attr("x", indent + rectWidth +10)
		.attr("y", yoffset + rectHeight/2)
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.text("> x");

	yoffset += rectHeight + 10 + font_size;
	g.append("rect")
		.attr("x", indent)
		.attr("y", yoffset)
		.attr("width", rectWidth)
		.attr("height", rectHeight)
		.attr("fill", "#fff")
		.attr("stroke", "black");
	g.append("rect")
		.attr("x", indent+rectWidth*.3)
		.attr("y", yoffset)
		.attr("width", rectWidth*.5)
		.attr("height", rectHeight)
		.attr("class", "rule-fill fill1")
		// .attr("fill", ruleColor)
		.attr("stroke", "none");

	g.append("rect")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset - (handleHeight - rectHeight)/2)
		.attr("width", handleWidth)
		.attr("height", handleHeight)
		.attr("fill", handleColor)
		.attr("stroke", "black");

	g.append("rect")
		.attr("x", indent + rectWidth * .8)
		.attr("y", yoffset - (handleHeight - rectHeight)/2)
		.attr("width", handleWidth)
		.attr("height", handleHeight)
		.attr("fill", handleColor)
		.attr("stroke", "black");

	g.append("text")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset - (handleHeight - rectHeight))
		.attr("text-anchor", "middle")
		.text("x");

	g.append("text")
		.attr("x", indent + rectWidth * .8)
		.attr("y", yoffset + handleHeight + font_size/2)
		.attr("text-anchor", "middle")
		.text("y");

	g.append("text")
		.attr("x", indent + rectWidth +10)
		.attr("y", yoffset + rectHeight/2)
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.text(">x AND <=y");
}

function render_filled_bar_legend(id) {
	var legend = d3.select(id)
		.attr("width", legendWidth)
		.attr("height", legendHeight)
		.attr("transform", "translate(0, 20)");

	var indent = 20;
	var g = legend.append("g")	
		.attr("class", "legend");

	var yoffset = 20;
	rectWidth = rectWidth * .6
	// color legend
	var r = 10;
	g.append("text")
		.attr("x", 0)
		.attr("y", indent)
		.style("font", "16px Arial")
		.text("Label");

	yoffset += indent;
	target_names.forEach((name, i) => {
		g.append("circle")
			.attr("cx", indent)
			.attr("cy", yoffset)
			.attr("r", r)
			.attr("fill", colors[i]);
		g.append("text")
			.attr("x", indent + 2 * r)
			.attr("y", yoffset + font_size/2)
			.style("font-family", "Arial")
			.text(name);
		yoffset += r * 2 * 1.5;
	});

	// size legend
	yoffset += 10;

	// bar legend
	// for x<a<y
	yoffset += 10;
	g.append("text")
		.attr("x", 0)
		.attr("y", yoffset)
		.style("font", "16px Arial")
		.text("Rules");

	yoffset += indent;
    var barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;
	g.append("line")
        .attr("class", "middle")
        .attr("x1", 0)
        .attr("x2", rectWidth)
        .attr("y1", yoffset + barHeight + rectMarginTop)
        .attr("y2", yoffset + barHeight + rectMarginTop)
        .style("stroke", "grey")
        .style("stroke-width", 1);

    g.append("rect")
		.attr("x", indent + rectWidth*.1)
		.attr("y", yoffset + rectMarginTop)
		.attr("width", rectWidth * .2)
		.attr("height", rectHeight - rectMarginTop - rectMarginBottom)
		.attr("fill", "#484848");
	
	g.append("text")
		.attr("x", indent + rectWidth * .1)
		.attr("y", yoffset + rectHeight)
		.attr("text-anchor", "end")
		.text("x");

	g.append("text")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset + rectHeight)
		.attr("text-anchor", "start")
		.text("y");
	
	g.append("text")
		.attr("x", indent + rectWidth +10)
		.attr("y", yoffset + rectHeight/2)
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.text("x<");

	g.append("rect")
		.attr("x",  indent + rectWidth + 26)
		.attr("y", yoffset + rectHeight/2 - 3)
		.attr("width", 8)
		.attr("height", 8)
		.attr("fill", "black");

	g.append("text")
		.attr("x", indent + rectWidth + 37)
		.attr("y", yoffset + rectHeight/2)
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.text("<y");

	// for A>x
	yoffset += indent * 2;
    var barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;
	g.append("line")
        .attr("class", "middle")
        .attr("x1", 0)
        .attr("x2", rectWidth)
        .attr("y1", yoffset + barHeight + rectMarginTop)
        .attr("y2", yoffset + barHeight + rectMarginTop)
        .style("stroke", "grey")
        .style("stroke-width", 1);

    g.append("rect")
		.attr("x", indent + rectWidth*.3)
		.attr("y", yoffset + rectMarginTop)
		.attr("width", rectWidth * .7-indent)
		.attr("height", rectHeight - rectMarginTop - rectMarginBottom)
		.attr("fill", "#484848");
	
	g.append("text")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset + rectHeight)
		.attr("text-anchor", "end")
		.text("x");

	g.append("text")
		// .attr("x", indent + rectWidth + 37)
		.attr("y", yoffset + rectHeight/2)
		.attr("x",  indent + rectWidth + 26)
		// .attr("y", yoffset + rectHeight/2 - 3)
		.attr("dy", ".35em")
		.attr("text-anchor", "center")
		.text("x");

	g.append("text")
		// .attr("x", indent + rectWidth + 37)
		.attr("y", yoffset + rectHeight/2)
		.attr("x",  indent + rectWidth + 35)
		// .attr("y", yoffset + rectHeight/2 - 3)
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.text("<");

	g.append("rect")
		// .attr("x",  indent + rectWidth + 26)
		.attr("y", yoffset + rectHeight/2 - 3)
		.attr("x", indent + rectWidth + 45)
		.attr("width", 8)
		.attr("height", 8)
		.attr("fill", "black");

	

	// for A<x
	yoffset += indent * 2;
    var barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;
	g.append("line")
        .attr("class", "middle")
        .attr("x1", 0)
        .attr("x2", rectWidth)
        .attr("y1", yoffset + barHeight + rectMarginTop)
        .attr("y2", yoffset + barHeight + rectMarginTop)
        .style("stroke", "grey")
        .style("stroke-width", 1);

    g.append("rect")
		.attr("x", 0)
		.attr("y", yoffset + rectMarginTop)
		.attr("width", indent + rectWidth * .3)
		.attr("height", rectHeight - rectMarginTop - rectMarginBottom)
		.attr("fill", "#484848");
	
	g.append("text")
		.attr("x", indent + rectWidth * .3)
		.attr("y", yoffset + rectHeight)
		.attr("text-anchor", "start")
		.text("x");

	g.append("rect")
		.attr("x",  indent + rectWidth + 8)
		.attr("y", yoffset + rectHeight/2 - 3)
		.attr("width", 8)
		.attr("height", 8)
		.attr("fill", "black");

	g.append("text")
		.attr("x", indent + rectWidth + 26)
		.attr("y", yoffset + rectHeight/2)
		.attr("dy", ".35em")
		.attr("text-anchor", "center")
		.text("x");

	g.append("text")
		.attr("x", indent + rectWidth + 25)
		.attr("y", yoffset + rectHeight/2)
		.attr("dy", ".35em")
		.attr("text-anchor", "end")
		.text("<");

	// for median line
	yoffset += indent * 2;
    var barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;
	g.append("line")
        .attr("class", "middle")
        .attr("x1", 0)
        .attr("x2", rectWidth)
        .attr("y1", yoffset + barHeight + rectMarginTop)
        .attr("y2", yoffset + barHeight + rectMarginTop)
        .style("stroke", "grey")
        .style("stroke-width", 1);

	g.append("circle")
		.attr("cx", 10)
		.attr("cy", yoffset + barHeight + rectMarginTop)
		.attr("r", 2)
		.attr("fill", "dimgrey");

  //   g.append("text")
		// .attr("x", 10)
  //       .attr("y", yoffset + barHeight + rectMarginTop-5)
  //       .attr("text-anchor", "middle")
  //       .text("3");

  //   g.append("circle")
		// .attr("cx", 20)
		// .attr("cy", yoffset + barHeight + rectMarginTop)
		// .attr("r", 2)
		// .attr("fill", "dimgrey");

  //   g.append("text")
		// .attr("x", 20)
  //       .attr("y", yoffset + barHeight + rectMarginTop-5)
  //       .attr("text-anchor", "middle")
  //       .text("2");

  //   g.append("circle")
		// .attr("cx", 30)
		// .attr("cy", yoffset + barHeight + rectMarginTop)
		// .attr("r", 2)
		// .attr("fill", "dimgrey");

    g.append("text")
		.attr("x", 10)
        .attr("y", yoffset + barHeight + rectMarginTop-5)
        .attr("text-anchor", "middle")
        .text("x");

    g.append("text")
		.attr("x", indent + rectWidth + 10)
		.attr("y", yoffset + rectHeight/2 - 5)
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.text("median: x");	
}
