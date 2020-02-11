let depth_height = 20;
let view_width = 280;
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

let view_margin = {left:5, right:5, top:max_r, bottom:20};

let clicked_summary_node_id = -1;

function intialize_scales(max_depth) {
	tree_height = max_depth * depth_height;
  let min_support = filter_threshold['support'] / d3.sum(node_info[0]['value']);

	summary_x = d3.scaleLinear()
		.domain([filter_threshold['fidelity'], 1])
		.range([view_margin.left, view_width]);

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
        .call(d3.zoom().on("zoom", function () {
          svg.attr("transform", d3.event.transform)
        }))
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

function click_summary_node(node_id) {
    console.log('click node: '+ node_id)

    if (node2rule[node_id]) {
      // rule_svg.append('g')
      //   .attr('id', 'highlight-rule')
      //   .append('rect')
      //   .attr('x', xScale(0))
      //   .attr('y', yScale(node2rule[node_id]))
      //   .attr('width', `${margin.left + width + margin.right}px`)
      //   .attr('height', `${glyphCellHeight+rectMarginTop + rectMarginBottom}px`)
      //   .attr('fill', 'grey')
      //   .attr('fill-opacity', 0.5)
      
      rule_svg.select(`#back-rect-${clicked_summary_node_id}`)
            .classed('rule_highlight', false);

      if (clicked_summary_node_id == node_id) {
        clicked_summary_node_id = -1;
      } else {
        rule_svg.select(`#back-rect-${node2rule[node_id]}`)
          .classed('rule_highlight', true);
        clicked_summary_node_id = node2rule[node_id];

        document.getElementById('stat_div').scrollTop = yScale(node2rule[node_id]);
        document.getElementById('rule_div').scrollTop = yScale(node2rule[node_id]);
      }
    }
}

function update_summary(node_info, ) {
  let view = d3.select('#summary_view')

  view.selectAll('.rule-node').remove();

  view.selectAll('.rule-node')
      .data(node_info)
      .enter()
      .append('circle')
      .attr("id", d => `node-${d['node_id']}`)
      .attr('class', 'rule-node')
      .attr('cx', d => summary_x(d['fidelity']))
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

