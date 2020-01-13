let depth_height = 20;
let view_width = 300;
let max_r = 15;

let summary_x,
	summary_y,
	tree_height,
	summary_size,
	summary_opacity;

let summary_color;
let stop_colors = ['#fc8d59', '#ffffbf', '#91bfdb'];
stop_colors = ['#d7191c', '#ffffbf', '#2c7bb6'];

let view_margin = {left:5, right:5, top:max_r, bottom:20};

function intialize_scales(max_depth) {
	tree_height = max_depth * depth_height;
	summary_x = d3.scaleLinear()
		.domain([0, 1])
		.range([view_margin.left, view_width]);

	summary_y = d3.scaleLinear()
		.domain([0, max_depth])
		.range([view_margin.top, tree_height]);

	summary_size = d3.scaleLinear()
		.domain([0, 1])
		.range([1, max_r]);

	// summary_opacity = d3.scaleLinear()
	// 	.domain([0, 1])
	// 	.range([.2, 1]);

	summary_color = d3.scaleLinear()
		.domain([0, .5, 1])
		.range(stop_colors)

}

// node_info contains the information of nodes: support, accuracy, fidelity
function render_summary(node_info, max_depth) {
	intialize_scales(max_depth);

	// start rendering
	let view = d3.select('#summary_view')
		.attr('width', view_width+view_margin.left+view_margin.right)
		.attr('height', tree_height+view_margin.top+view_margin.bottom)

	// level/depth info
	view.selectAll('.depth-line')
		.data(d3.range(max_depth+1))
        .enter().append("g")
        .attr("class", "depth-line")
        .attr("transform", function(d, i) { return `translate(0, ${summary_y(i)})`; })
		.append("line")
        .attr("x1", view_margin.left)
        .attr("x2", view_width+view_margin.left)
        .attr('stroke-width', .5)
        .style("stroke", gridColor);

    // support -> size, fidelity -> x_pos, accuracy -> color
    view.selectAll('.rule-node')
    	.data(node_info)
    	.enter()
    	.append('circle')
    	.attr('class', 'rule-node')
    	.attr('cx', d => summary_x(d['fidelity']))
    	.attr('cy', d => summary_y(d['depth']))
    	.attr('r', d => summary_size(d['support']))
    	.attr('stroke', 'none')
    	.attr('fill', d => summary_color(d['accuracy']))
    	.attr('fill-opacity', .8);


    // color legend
    let linear_gradient = view.append('defs')
        .append('linearGradient')
      .attr('id', function(d) {
        return "summary-linear-gradient";
      })
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    linear_gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', stop_colors[0]);

    linear_gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', stop_colors[1]);

    linear_gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', stop_colors[2]);

    view.append('rect')
    	.attr('x', view_margin.left)
    	.attr('y', tree_height + view_margin.top )
    	.attr('width', 60)
    	.attr('height', 10)
    	.attr('fill', `url(#summary-linear-gradient)`)

    view.append('text')
    	.attr('x', view_margin.left + 60)
    	.attr('y', tree_height + view_margin.top + 10)
    	.text('accuracy: [0, 100%]')
}

function update_summary(node_info, ) {
  let view = d3.select('#summary_view')

  view.selectAll('.rule-node').remove();
  
  view.selectAll('.rule-node')
      .data(node_info)
      .enter()
      .append('circle')
      .attr('class', 'rule-node')
      .attr('cx', d => summary_x(d['fidelity']))
      .attr('cy', d => summary_y(d['depth']))
      .attr('r', d => summary_size(d['support']))
      .attr('stroke', 'none')
      .attr('fill', d => summary_color(d['accuracy']))
      .attr('fill-opacity', .8);
}

