var legendHeight = 40, legendWidth = 600;

var colors = ["steelblue", "#fb9a99"];
var conf_colors = ['#2887a1', '#cf597e'];
// var text_colors = ['#ffffcc', '#c2e699', '#78c679', '#238443'];
var text_colors = ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'];

let colorSeq4 = ['#ffffcc', '#a1dab4', '#41b6c4', '#225ea8'];
let colorDiv7 = ['#008080', '#70a494', '#b4c8a8', '#f6edbd', '#edbb8a', '#de8a5a', '#ca562c'];
let colorDiv5 = ['#008080', '#70a494', '#f6edbd', '#de8a5a', '#ca562c'];
let colorCate = ['#6babc1', '#e68882', '#edc867', '#67a879', '#806691',];
let borderColor = ['white', 'black'];
let gradientColor = [d3.lab("#91bfdb"),d3.lab("#ffffbf"),d3.lab("#fc8d59")]

var handleColor = "#969696", ruleColor = "#d9d9d9", gridColor = "#D3D3D3";
var font_family = "Times New Roman";
var font_size = 10;
var font = font_size + "px " + font_family;

var threshold_values = [
	[52, 104],
	[35],
	[86, 95],
	[20, 62],
	[2, 5],
];

function render_legend_label(id) {
	var legend = d3.select(id)
		.style("width", legendWidth)
		.style("height", legendHeight)
		.append("g")
    	// .attr("transform", "translate(" + 0+ "," + margin.top*2 + ")");

	var indent = 20;
	var g = legend.append("g")	
		.attr("class", "legend");

	var yoffset = 20;
	// color legend
	var r = 5;
	// g.append("text")
	// 	.attr("x", 0)
	// 	.attr("y", indent)
	// 	.style("font", "16px Arial")
	// 	.text("Label");

	// yoffset += indent;

	let xoffset = 0;
	target_names.forEach((name, i) => {
		g.append("circle")
			.attr("cx", indent + xoffset)
			.attr("cy", yoffset)
			.attr("r", r)
			.attr("fill", colorCate[i]);
		g.append("text")
			.attr("x", indent + 2 * r + xoffset)
			.attr("y", yoffset + r)
			.text(name);
		xoffset += ctx.measureText(name).width + r * 4 + indent;
	});

	// legend for range bar
	let linear_gradient = legend.append('defs')
	  .append('linearGradient')
      .attr('class','linear_gradient')
      .attr('id', function(d) {
        return "linear-gradient-legend";
      })
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    linear_gradient.append('stop')
      .attr('class','linear_gradient_start')
      .attr('offset', '0%')
      .attr('stop-color', gradientColor[0]);

    linear_gradient.append('stop')
      .attr('class','linear_gradient_mid')
      .attr('offset', '50%')
      .attr('stop-color', gradientColor[1]);

    linear_gradient.append('stop')
      .attr('class','linear_gradient_end')
      .attr('offset', '100%')
      .attr('stop-color', gradientColor[2]);

    xoffset += indent;
    g.append('rect')
    	.attr('x', xoffset)
    	.attr('y', yoffset-r)
    	.attr('width', rectWidth)
    	.attr('height', 10)
    	.attr('fill', `url(#linear-gradient-legend)`)

    g.append('text')
    	.attr('x', xoffset + rectWidth + 5)
    	.attr('y', yoffset+r)
    	.text('range: low→median→high')
}

