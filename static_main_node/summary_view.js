let depth_height = 18;
let view_width = 950;
let max_r = 15;

let summary_x,
	summary_y,
	tree_height,
	summary_size,
	summary_opacity;

let summary_color;
let stop_colors = ['#fc8d59', '#ffffbf', '#91bfdb'];
stop_colors = ['#d7191c', '#ffffbf', '#2c7bb6'];
stop_colors = ['#e66101', '#f3eeea', '#7b3294', ]

let view_margin = {left:15+max_r, right:5+max_r/2, top:max_r, bottom:max_r};
let x_tick_height = 18;

let summary_x_tick = d3.select('#summary_x_tick')
    .style('width', `${view_width+view_margin.left+view_margin.right}px`)
    .style('height', `${x_tick_height}px`);

let x_axis = d3.axisBottom()
    .scale(summary_x);

let clicked_summary_node_id = -1;

function intialize_scales(max_depth) {
	tree_height = max_depth * depth_height;
  d3.select('#summary_div')
    .style("height", `${tree_height+view_margin.top+view_margin.bottom}px`);

  let min_support = filter_threshold['support'] / d3.sum(node_info[0]['value']);

	summary_x = d3.scaleLinear()
		.domain([filter_threshold['fidelity'], 1])
		.range([view_margin.left, view_width - view_margin.right - view_margin.left]);

	summary_y = d3.scaleLinear()
		.domain([0, max_depth])
		.range([view_margin.top, tree_height]);

	summary_size = d3.scaleLinear()
		.domain([min_support, 1])
		.range([2, max_r]);

	summary_color = d3.scaleLinear()
		.domain([0, .5, 1])
		.range(stop_colors)

}

function render_x_ticks() {
  x_axis.scale(summary_x);

  summary_x_tick
    .transition()
    .duration(500)
    .call(x_axis);
}

// node_info contains the information of nodes: support, accuracy, fidelity
function render_summary(node_info, max_depth) {
  d3.select('#summary_view > *').remove();
	intialize_scales(max_depth);

  // render x ticks
  summary_x_tick.append('text')
    .attr('x', 0)
    .attr('y', 8)
    .style('fill', 'black')
    .style('font-size', '10px')
    .style('text-anchor', 'start')
    .text("fidelity");

  render_x_ticks();

	// start rendering
	let view = d3.select('#summary_view')
		.style('width', `${view_width+view_margin.left+view_margin.right}px`)
		.style('height', `${tree_height+view_margin.top+view_margin.bottom}px`)

	// level/depth info
	let depth_info = view.selectAll('.depth-line')
		.data(d3.range(max_depth+1))
        .enter().append("g")
        .attr("class", "depth-line")
        .attr("transform", function(d, i) { return `translate(0, ${summary_y(i)})`; })

	depth_info.append("line")
        .attr("x1", view_margin.left)
        .attr("x2", view_width-view_margin.left-view_margin.right)
        .attr('stroke-width', .5)
        .style("stroke", gridColor);
  depth_info.append('text')
      .attr('x', view_margin.left - 5)
      .style('fill', gridColor)
      .style('text-anchor', 'end')
      .text((d, i) => i)


    // support -> size, fidelity -> x_pos, accuracy -> color
    view.selectAll('.rule-node')
    	.data(node_info)
    	.enter()
    	.append('circle')
      .attr("id", d => `node-${d['node_id']}`)
    	.attr('class', 'rule-node')
    	.attr('cx', d => summary_x(d['fidelity']))
    	.attr('cy', d => summary_y(d['depth']))
    	.attr('r', d => summary_size(d['support']+(1e-8)))
    	.attr("stroke", d => {
        return node2rule[d['node_id']] !== undefined ? 'black' : 'none';
      })
    	.attr('fill', d => summary_color(d['accuracy']))
    	.attr('fill-opacity', .8)
      .on('click', d => {
        click_summary_node(d['node_id'])
      })
      .append('title')
      .text(d => `Support: ${d3.format('.2%')(d['support'])}, ${d3.sum(d['value'])};
        \nFidelity: ${d['fidelity']}\nAccuracy: ${d['accuracy']}`);


    // color legend
    let linear_gradient = view.append('defs')
        .append('linearGradient')
      .attr('id', "summary-linear-gradient")
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
    	.attr('x', view_margin.left + 80)
    	.attr('y', tree_height + view_margin.top + 10)
    	.text('accuracy: [0, 100%]')
}

function update_summary(node_info, ) {
  d3.selectAll('#summary_view > *:not(.depth-line)').remove();

  let view = d3.select('#summary_view')
  summary_x.domain([filter_threshold['fidelity'], 1])
  render_x_ticks();

  view.selectAll('.rule-node').remove();

  view.selectAll('.rule-node')
      .data(node_info)
      .enter()
      .append('circle')
      .attr("id", d => `node-${d['node_id']}`)
      .attr('class', 'rule-node')
      .attr('cx', d => summary_x(d['fidelity']) + Math.random()-.5)
      .attr('cy', d => summary_y(d['depth']))
      .attr('r', d => summary_size(d['support']))
      .attr('stroke', 'none')
      .attr('fill', d => summary_color(d['accuracy']))
      .attr('fill-opacity', .8)
      .attr("stroke", d => {
        return node2rule[d['node_id']] !== undefined ? 'black' : 'none';
      })
      .on('click', d => {
        click_summary_node(d['node_id'])
      })
      .append('title')
      .text(d=>`Support: ${d3.format('.2%')(d['support'])}, ${d3.sum(d['value'])};
        Fidelity: ${d['fidelity']};\nAccuracy: ${d['accuracy']}
        NodeID: ${d['node_id']}; Rule index: ${node2rule[d['node_id']]}`);
;
}

