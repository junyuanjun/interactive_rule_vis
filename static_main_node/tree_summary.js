let tree,
	root1,
	tree_hierarchy;

let multiple_selection = {};

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {

	path = `M ${s.x} ${s.y}
        C ${(s.x + d.x) / 2} ${s.y},
          ${(s.x + d.x) / 2} ${d.y},
          ${d.x} ${d.y}`

	return path
}

function generate_tree(treeData) {
	d3.selectAll('#summary_view > *:not(.depth-line)').remove();

	d3.select('#summary_view')
		.append('g')
		.attr('id', 'tree_structure')
		.attr('transform', `translate(${view_margin.left}, ${view_margin.top})`);

	root1 = d3.hierarchy(treeData, function(d) { return d.children; });
	root1.x0 = tree_height / 2;
	root1.y0 = 0;

	// Compute the new tree layout.
	tree_hierarchy = tree(root1);

	update_tree(root1);
}

function update_tree(source) {
	let view = d3.select('#tree_structure');

	let nodes = tree_hierarchy.descendants(),
    	links = tree_hierarchy.descendants().slice(1);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) { d.y = d.depth * (depth_height) });

	// Update the nodes…
	var node = view.selectAll("g.node")
	  .data(nodes, function(d) { 
	  	return d.id || (d.id = ++i); 
	  });

	// // Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("g")
	  .attr("class", "node")
	  .attr("transform", function(d) { 
	  	return "translate(" + source.x0 + "," + source.y0 + ")"; 
	  })
	  .attr('id', d => `tree_node-${d['data']['node_id']}`)

	// Transition nodes to their new position.
	var nodeUpdate = nodeEnter.merge(node);

	nodeUpdate.transition()
	  .duration(duration)
	  .attr("transform", (d, i) => { 
	  	return "translate(" + d.x + "," + d.y + ")"; 
	  });

	// render tree nodes in rectangles
	let conf_fill = [ '#4f7d8c', colorCate[0], `#995a57`,colorCate[1],]

	tree_nodes = nodeUpdate.append('g')
		.attr('visibility', (d) => {
			if (!new_node_shown[d['data']['node_id']]) {
				return "hidden";
			} else return "visible";
		});

	tree_nodes.selectAll('rect')
		.data(node => {
			let size = summary_size_(node['data']['support']);
			let v0 = d3.sum(node.data.conf_mat[0]), 
				v1 = d3.sum(node.data.conf_mat[1]);
			conf_mat = [
				{'name': 'fp', 'id':node['data']['node_id'],
					'x': -size/2, 'width': size*v0,
					'y': -size/2, 
					'height': v0 > 0 ? size*node.data.conf_mat[0][1]/v0 : 0,
				},
				{'name': 'tp', 'id':node['data']['node_id'],
					'x': -size/2, 'width': size*v0,
					'y': v0 > 0 ? -size/2+size*node.data.conf_mat[0][1]/v0 : 0, 
					'height': v0 > 0 ? size*node.data.conf_mat[0][0]/v0 : 0,
				},
				{'name': 'fn', 'id':node['data']['node_id'],
					'x': -size/2+size*d3.sum(node.data.conf_mat[0]), 'width': size*v1,
					'y': -size/2, 
					'height': v1 > 0 ? size*node.data.conf_mat[1][0]/v1 : 0,
				},
				{'name': 'tn', 'id':node['data']['node_id'],
					'x': -size/2+size*d3.sum(node.data.conf_mat[0]), 'width': size*v1,
					'y': v1 > 0 ? -size/2+size*node.data.conf_mat[1][0]/v1: 0, 
					'height': v1 > 0 ? size*node.data.conf_mat[1][1]/v1 : 0,
				},
			];
			return conf_mat;
		})
		.enter()
		.append('rect')
		.attr('x', d => d.x)
		.attr('y', d => d.y)
		.attr('width', d=> d.width)
		.attr('height', d=> d.height)
		.style('fill', (d, i) => conf_fill[i])
		.style('stroke', 'none')
		// .style('stroke-width', '.5')


	// add feature names to nodes
	let feature_name = nodeUpdate.append("text")
	  .attr('id', (node)=>`feat_name_${node['data']['node_id']}`)
	  .attr('class', 'node_feature_name')
	  .style("visibility", "hidden");

	feature_name.append("tspan")
		.attr("x", function(d) { return d.children || d._children ? 5 : 13; })
		.text(function(node) { 
			let d = node['data'];
			if (d.feature >= 0) {
				return attrs[d.feature];
			}
		});

	// make a mask for click/mouseover area 
	let node_mask = nodeUpdate.append('rect')
		.attr('class', 'node_mask')
		.attr('x', d => -summary_size_(d['data']['support'])/2)
		.attr('y', d => -summary_size_(d['data']['support'])/2)
		.attr('width', d => summary_size_(d['data']['support']))
		.attr('height', d => summary_size_(d['data']['support']))
		.attr('visibility', (d) => {
			if (!new_node_shown[d['data']['node_id']]) {
				return "hidden";
			} else return "visible";
		})

	node_mask.on('dblclick', dblclick)
		.on('click', d => click_text(d['data']['node_id']))
		.on('mouseover', function(node) {
			let d = node['data'];
			d3.select(`#feat_name_${d['node_id']}`)
				.style('visibility', 'visible');

			if (new_node_shown[d['left']]) {
				d3.select(`#link_text_${d['left']}_${d['node_id']}`)
					.style('visibility', 'visible');
				d3.select(`#tree_link_${d['left']}_${d['node_id']}`)
					.style('stroke', 'steelblue');
			}
			if (new_node_shown[d['right']]) {
				d3.select(`#link_text_${d['right']}_${d['node_id']}`)
					.style('visibility', 'visible');
				d3.select(`#tree_link_${d['right']}_${d['node_id']}`)
					.style('stroke', 'steelblue')
			}

			let str  = `Feature: ${attrs[d['feature']]}; `
			 	+ `Support: ${d3.format('.2%')(d['support'])}, ${d3.sum(d['value'])}; `
			 	+ `Fidelity: ${d3.format('.2%')(d['fidelity'])}; `
			 	+ `Accuracy: ${d3.format('.2%')(d['accuracy'])}`
			// + `\nNodeID: ${d['node_id']}; Rule index: ${node2rule[d['node_id']]}`;
			d3.select('#node_description')
				.html(`<p>${str}</p>`);

			let tree_node = d3.select(this), node_id = d['node_id'];
			let size = summary_size_(node_info[node_id]['support'])
			tree_node.append('rect')
				.attr('class', 'hovered_node')
				.attr('x', -size/2)
				.attr('y', -size/2)
				.attr('width', size)
				.attr('height', size);
		})
		.on('mouseout', () => {
			d3.select('#node_description').selectAll('p').remove();
			d3.selectAll('.hovered_node').remove();

			d3.selectAll('.node_feature_name')
				.style('visibility', "hidden");
			d3.selectAll('.sign_threshold')
				.style('visibility', "hidden");
			d3.selectAll('.link')
				.style('stroke', 'lightgrey')
		});
	

	// Transition exiting nodes to the parent's new position.
	var nodeExit = node.exit().transition()
	  .duration(duration)
	  .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
	  .remove();

	nodeExit.select("circle")
	  .attr("r", 1e-6);

	// Update the links…

	var link = view.selectAll("path.link")
	  .data(links, function(d) { 
	  	return d.id; 
	  });

	// Enter any new links at the parent's previous position.
	let linkEnter = link.enter().insert("path", "g")
	  .attr("class", "link")
	  .attr("id", d => `tree_link_${d['data']['node_id']}_${d['data']['parent']}`)
	  .attr("d", function(d) {
		var o = {x: source.x0, y: source.y0};
		return diagonal(o, o);
	  })
	  .style('fill', 'none')
	  .style('stroke', 'lightgrey')
	  .style("stroke-width", d => {
	  	return 1;
	  	// return linkWidthScale(d.target.value[0]+d.target.value[1])
	  });


	let linkUpdate = linkEnter.merge(link);

	// Transition back to the parent element position
	linkUpdate.transition()
	  .duration(duration)
	  // .attr("d", diagonal);
      .attr('d', function(d){ 
	    if (!new_node_shown[d['data']['node_id']]) return "";
      	 else return diagonal(d, d.parent) 
      });

	// Transition exiting nodes to the parent's new position.
	let linkExit = link.exit().transition()
	  .duration(duration)
	  .attr("d", function(d) {
		var o = {x: source.x, y: source.y};
		return diagonal(o, o);
	  })
	  .remove();

	// Update the link text
    var linktext = view.selectAll("g.link-text")
        .data(links, function (d) {
	        return d.id;
		}).enter()
	    .insert("g")
	    .attr("class", "link-text");

    linktext.append("text")
		.attr("fill", "Black")
		.style("font", "normal 12px " + font_family)
		.attr("dy", ".35em")
		.attr("class", "sign_threshold")
	  	.attr("id", d => `link_text_${d['data']['node_id']}_${d['data']['parent']}`)
		.text(function (d) {
			return d.data.sign + d.parent['data'].threshold.toFixed(2);
		})
		.attr('visibility', 'hidden');

	var textUpdate = linktext.transition()
	  .duration(duration)
	  .attr("transform", (d) => `translate(${((d.x + d.parent.x)/2)}, ${(d.y + d.parent.y)/2})`);

	textUpdate.select("text")
	  .style("fill-opacity", 1);

	// Transition exiting nodes to the parent's new position.
	var textExit = linktext.exit().remove();

	let link_mask = link.enter().append("path", "g")
	  .attr("class", "link_mask")
	  .attr('d', function(d){ 
	    if (!new_node_shown[d['data']['node_id']]) return "";
      	 else return diagonal(d, d.parent) 
      })
      .style("stroke-width", 3)
      .style("stroke", "white")

    link_mask.on('mouseover', function(node) {
    	let d = node['data']
		d3.select(`#tree_link_${d['node_id']}_${d['parent']}`)
			.style('stroke', 'steelblue');
		d3.select(`#feat_name_${d['parent']}`)
			.style('visibility', 'visible');
		d3.select(`#link_text_${d['node_id']}_${d['parent']}`)
			.style('visibility', 'visible');

		let attr = attrs[node_info[d['parent']]['feature']], sign = d['sign'], 
			thred = node_info[d['parent']]['threshold']
		d3.select('#node_description')
			.html(`<p> Condition: ${attr+sign+thred} </p>`)
	})
	.on('mouseout', function(node) {
    	let d = node['data']
		d3.select(`#tree_link_${d['node_id']}_${d['parent']}`)
			.style('stroke', 'lightgrey');
		d3.select('#node_description p').remove();
		d3.selectAll('.sign_threshold')
			.style('visibility', 'hidden');
		d3.selectAll('.node_feature_name')
			.style('visibility', 'hidden');
	})

	// Stash the old positions for transition.
	nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});
}

function click_text(node_id) {
 	console.log("click tree node");
    click_summary_node(node_id);
}

function dblclick(d) {
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else {
		d.children = d._children;
		d._children = null;
	}
	update_tree(d);

 	// show details in the detail view
	// postData("find_node_rules", linked_node_ids, (node_rules)=>{
	// 	let rules = node_rules['rule_lists'];
	//     present_rules = rules;
	//     col_order = column_order_by_feat_freq(rules);

	//     // update linked node2rule pos
	// 	node2rule[1] = {};
	// 	rule2node[1] = {};
	// 	rules.forEach((d, i) => {
	// 		node2rule[1][d['node_id']] = i;
	// 		rule2node[1][i] = d['node_id'];
	// 	});
	 	
	//     // update_column_rendering(col_svg2);
	// 	update_rule_rendering(rule_svg2, col_svg2, stat_svg2, 2, rules, col_order);

	// 	// add one selected rule to multiple selection
	// 	// TODO: remove multiple selection on the same path
	// 	let node_id = rules[rules.length-1]['node_id'];
	// 	if (node_id in multiple_selection) {
	// 		delete multiple_selection[node_id];
	// 	} else {
	// 		multiple_selection[node_id] = rules[rules.length-1];
	// 	}
	// 	let multiple_rules = [];
	// 	node2rule[3] = {};
	// 	rule2node[3] = {}
	// }
}