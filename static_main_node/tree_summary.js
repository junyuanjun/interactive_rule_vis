let tree,
	// diagonal,
	root1;

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

	root1 = d3.hierarchy(treeData, function(d) { return d.children; });
	root1.x0 = tree_height / 2;
	root1.y0 = 0;

	update_tree(root1);

	root1.children.forEach(collapse);

	// Collapse the node and all it's children
	function collapse(d) {
	  if(d.children) {
	    d._children = d.children
	    d._children.forEach(collapse)
	    d.children = null
	  }
}

	// d3.select(self.frameElement).style("height", "500px");
}

function update_tree(source) {
	let view = d3.select('#summary_view')
		.append('g')
		.attr('transform', `translate(${view_margin.left}, ${view_margin.right})`)

	// Compute the new tree layout.
	let tree_hierarchy = tree(source);

	// var nodes = tree_hierarchy.nodes(root1).reverse(),
	//   links = tree_hierarchy.links(nodes);
	let nodes = tree_hierarchy.descendants(),
    	links = tree_hierarchy.descendants().slice(1);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) { d.y = d.depth * 17 });

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
	  .on("click", d => click_text(d['data']['node_id']));

	nodeEnter.append("circle")
	  .attr("r", 1e-6)
	  .style("fill",  d => {
	  	return summary_color(d['data']['accuracy']);
	  })
	  .append('title')
	  .text(d => `Support: ${d3.format('.2%')(d['data']['support'])}, ${d3.sum(d['data']['value'])};
        Fidelity: ${d['data']['fidelity']}\nAccuracy: ${d['data']['accuracy']}`);

	// Transition nodes to their new position.
	var nodeUpdate = nodeEnter.merge(node);

	nodeUpdate.transition()
	  .duration(duration)
	  .attr("transform", (d, i) => { 
	  	return "translate(" + d.x + "," + d.y + ")"; 
	  });

	nodeUpdate.select("circle")
	  .attr("r", d => {
	  		return summary_size(d['data']['support']);
	  })
	  .style("fill", function(d) {
	  	if (!new_node_shown[d['data']['node_id']]) {
	  		return "rgba(0,0,0,0)"
	  	}
	  	return summary_color(d['data']['accuracy']);
	  })
	  // .style("fill-opacity", .8)
	  .style("stroke", "none")


	nodeUpdate.select("text")
	  .style("fill-opacity", (d) => d.children ? 1 : 1e-6);

	// Transition exiting nodes to the parent's new position.
	var nodeExit = node.exit().transition()
	  .duration(duration)
	  .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
	  .remove();

	nodeExit.select("circle")
	  .attr("r", 1e-6);

	nodeExit.select("text")
	  .style("fill-opacity", 1e-6);

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
	  .style('stroke', gridColor)
	  .style("stroke-width", d => {
	  	return .3;
	  	// return linkWidthScale(d.target.value[0]+d.target.value[1])
	  });

	let linkUpdate = linkEnter.merge(link);

	// Transition back to the parent element position
	linkUpdate.transition()
	  .duration(duration)
	  // .attr("d", diagonal);
      .attr('d', function(d){ return diagonal(d, d.parent) });

	// Transition exiting nodes to the parent's new position.
	let linkExit = link.exit().transition()
	  .duration(duration)
	  .attr("d", function(d) {
		var o = {x: source.x, y: source.y};
		return diagonal({source: o, target: o});
	  })
	  .remove();

	// Stash the old positions for transition.
	nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});
}

function click_text(node_id) {
 //  if (d.children) {
	// d._children = d.children;
	// d.children = null;
 //  } else {
	// d.children = d._children;
	// d._children = null;
 //  }
 //  update_text(d);
 	console.log("click tree node");
    click_summary_node(node_id)
}