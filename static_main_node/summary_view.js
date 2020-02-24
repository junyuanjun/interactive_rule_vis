let depth_height = 18;
let view_width = 980;
let max_r = 15;

let summary_x,
	summary_y,
	tree_height,
	summary_size,
  fidelity_color,
	summary_opacity;

let summary_color;
let stop_colors = ['#fc8d59', '#ffffbf', '#91bfdb'];
stop_colors = ['#e66101', '#f3eeea', '#7b3294', ]
stop_colors = ['#d7191c', '#ffffbf', '#2c7bb6'];
stop_colors = ['#e66101', '#dfc27d', '#018571'];

let view_margin = {left:5+max_r, right:max_r, top:max_r, bottom:max_r};
let x_tick_height = 18;

let summary_x_tick = d3.select('#summary_x_tick')
    .attr('transform', 'translate(15)')
    .style('width', `${view_width+view_margin.left+view_margin.right}px`)
    .style('height', `${x_tick_height}px`);

let x_axis = d3.axisBottom()
    .scale(summary_x);

let pie = d3.pie()
  .value(d => d);

let clicked_summary_node_rule_id = -1;
let clicked_tree_level = -1;

function intialize_scales(max_depth) {
	tree_height = max_depth * depth_height;
  d3.select('#summary_div')
    .style("height", `${tree_height+view_margin.top+view_margin.bottom}px`);

  let min_support = filter_threshold['support'] / d3.sum(node_info[0]['value']);

	summary_x = d3.scaleLinear()
		.domain([filter_threshold['fidelity'], 1])
		.range([view_margin.left, view_margin.left+view_width]);

	summary_y = d3.scaleLinear()
		.domain([0, max_depth])
		.range([view_margin.top, tree_height]);

	summary_size = d3.scaleLinear()
		.domain([min_support, 1])
		.range([2, max_r]);

	summary_color = d3.scaleLinear()
		.domain([0, .5, 1])
		.range(stop_colors)

  fidelity_color = d3.scaleLinear()
      .domain([filter_threshold['fidelity'], (filter_threshold['fidelity']+1)/2, 1])
      .range(stop_colors)

  // initialize tree settings
  tree = d3.tree()
    .size([ view_width, tree_height,]);

  // diagonal = d3.svg.diagonal()
  //   .projection(function(d) { return [d.x, d.y]; });
  // diagonal = d3.linkHorizontal()
  //   .x(d => d.x)
  //   .y(d => d.y);
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

  // check boxes before different levels
  d3.select("#radio_group").selectAll("input")
    .data(d3.range(max_depth+1)).enter()
    .append("input")
    .attr("name", "tree_level")
    .attr("type", "radio")
    .attr("value", (idx) => `level-${idx}`)
    .on("click", (idx) => {
      click_tree_level(idx);
    });

  // render x ticks
  // summary_x_tick.append('text')
  //   .attr('x', 0)
  //   .attr('y', 8)
  //   .style('fill', 'black')
  //   .style('font-size', '10px')
  //   .style('text-anchor', 'start')
  //   .text("fidelity");

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
        .attr("x2", view_width+view_margin.left)
        .attr("id", d => `depth-${d}`)
        .style('stroke-width', .5)
        .style("stroke", gridColor);
  depth_info.append('text')
      .attr('x', view_margin.left - 5)
      .style('fill', gridColor)
      .style('text-anchor', 'end')
      .text((d, i) => i)
}

function update_stat(node_info) {
  let view = d3.select('#summary_view')

  render_x_ticks();

  view.selectAll('.rule-node').remove();

  nodes = view.selectAll('.rule-node')
      .data(node_info)
      .enter()
      .append('g')
      .attr("id", d => `node-${d['node_id']}`)
      .attr('class', 'rule-node')
      .attr('transform', d => `translate(${X_POS == 'fidelity' ? summary_x(d['fidelity']) : summary_x(d['accuracy'])}, ${summary_y(d['depth'])})`)
      .on('click', d => {
        click_summary_node(d['node_id'])
      });

  nodes.append('title')
      .text(d=>`Support: ${d3.format('.2%')(d['support'])}, ${d3.sum(d['value'])};
        Fidelity: ${d['fidelity']};\nAccuracy: ${d['accuracy']}
        NodeID: ${d['node_id']}; Rule index: ${node2rule[d['node_id']]}`)
  
  switch (NODE_ENCODING) {
      case "accuracy":
        nodes.append('circle')
          .attr('r', d => summary_size(d['support']))
          .attr('stroke', 'none')
          .attr('fill', d => summary_color(d['accuracy']))
          .attr('fill-opacity', .8)
          .attr("stroke", d => {
            return node2rule[d['node_id']] !== undefined ? 'black' : 'none';
          })
        break;
      case "fidelity":
        nodes.append('circle')
          .attr('r', d => summary_size(d['support']))
          .attr('stroke', 'none')
          .attr('fill', d => fidelity_color(d['fidelity']))
          .attr('fill-opacity', .8)
          .attr("stroke", d => {
            return node2rule[d['node_id']] !== undefined ? 'black' : 'none';
          });
        break;
      case "purity":
        nodes          
          .selectAll('path')
          .data(node => {
             let ready = pie(node['value'])
             ready.forEach(part => part['support'] = node['support']);
             return ready;
          }).enter()
          .append("path")
          .attr('d', d => d3.arc()
            .innerRadius(0)
            .outerRadius(summary_size(d['support']))(d)
          )
          .attr('fill', (d, i) => colorCate[i])
          .attr("stroke", "none");    
        break;      
    }
}

function update_summary(node_info, ) {
  if (SUMMARY_LAYOUT == 'stat') {
    d3.selectAll('#summary_view > *:not(.depth-line)').remove();
  
    update_stat(node_info);
  } else if (SUMMARY_LAYOUT == 'tree') {
    d3.selectAll('#summary_x_tick > *').remove();
    d3.selectAll('#summary_view > *:not(.depth-line)').remove();

    generate_tree(treeData);
  }
}

