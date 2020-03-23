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
	  .on('dblclick', dblclick)
	  .on('click', d => click_text(d['data']['node_id']))
	  .on('mouseover', function(node) {
	  	let d = node['data'];
	  	let str  = `Feature: ${attrs[d['feature']]}; `
	  	 	+ `Support: ${d3.format('.2%')(d['support'])}, ${d3.sum(d['value'])}; `
	  	 	+ `Fidelity: ${d3.format('.2%')(d['fidelity'])}; `
	  	 	+ `Accuracy: ${d3.format('.2%')(d['accuracy'])}`
        	// + `\nNodeID: ${d['node_id']}; Rule index: ${node2rule[d['node_id']]}`;
	  	d3.select('#node_description')
	  		.html(`<p>${str}</p>`);

	  	let tree_node = d3.select(this), node_id = d['node_id'];
	  	if (NODE_ENCODING == 'purity') {
			let size = summary_size_(node_info[node_id]['support'])
			tree_node.append('rect')
				.attr('class', 'hovered_node')
				.attr('x', -size/2)
				.attr('y', -size/2)
				.attr('width', size)
				.attr('height', size);
		} else {
			tree_node.append('circle')
				.attr('class', 'hovered_node')
				.attr('r', summary_size(node_info[node_id]['support']));
		}
	  })
	  .on('mouseout', () => {
	    d3.select('#node_description').selectAll('p').remove();
	    d3.selectAll('.hovered_node').remove();
	  });

	// Transition nodes to their new position.
	var nodeUpdate = nodeEnter.merge(node);

	nodeUpdate.transition()
	  .duration(duration)
	  .attr("transform", (d, i) => { 
	  	return "translate(" + d.x + "," + d.y + ")"; 
	  });

	if (NODE_ENCODING === 'purity') {
		let conf_fill = [ '#4f7d8c', colorCate[0], `#995a57`,colorCate[1],]
		// nodeUpdate          
  //         .selectAll('path')
  //         .data(node => {
  //            // let ready = pie(node['data']['value'])
  //            conf_mat = [
  //            	node['data']['conf_mat'][0][0],
  //            	node['data']['conf_mat'][0][1],
  //            	node['data']['conf_mat'][1][1],
  //            	node['data']['conf_mat'][1][0],
  //            ]
  //            let ready = pie(conf_mat);
  //            ready.forEach(part => {
  //            	part['support'] = node['data']['support'];
  //            	part['node_id'] = node['data']['node_id'];
  //            });
  //            return ready;
  //         }).enter()
  //         .append("path")
  //         .attr('d', d => d3.arc()
  //           .innerRadius(0)
  //           .outerRadius(summary_size(d['support']))(d)
  //         )
  //         .style('fill', (d, i) => conf_fill[i])
  //         .style('fill-opacity', (d) => {
  //         	if (!new_node_shown[d['node_id']]) {
		//   		return .1;
		//   	} else return 1;
  //         })
  //         .style("stroke", "none");  
  		nodeUpdate.selectAll('rect')
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
  			.style('fill-opacity', (d) => {
	          	if (!new_node_shown[d['id']]) {
			  		return 0;
			  	} else return 1;
          	})
  			// .style('stroke-width', '.5')
	} else {
		nodeUpdate.append("circle")
		  .attr("r", d => {
		  		return summary_size(d['data']['support']);
		  })
		  .style("fill", function(d) {
		  	
		  	if (NODE_ENCODING === 'accuracy')
		  		return summary_color(d['data']['accuracy']);
		  	else if (NODE_ENCODING === 'fidelity')
		  		return fidelity_color(d['data']['fidelity']);
		  })
		  .style('fill-opacity', function(d) {
		  	if (!new_node_shown[d['data']['node_id']]) {
		  		return .0
		  	} else return 1;
		  })
		  .style("stroke", "none")
	}
	// nodeUpdate.append('title')
	//   .text(node => {
	//   		let d = node['data'];
	//   	 return `Feature: ${attrs[d['feature']]}`
	//   	 	+ `\nSupport: ${d3.format('.2%')(d['support'])}, ${d3.sum(d['value'])};`
	//   	 	+ `\nFidelity: ${d['fidelity']};\nAccuracy: ${d['accuracy']}`
 //        	+ `\nNodeID: ${d['node_id']}; Rule index: ${node2rule[d['node_id']]}`;
 //    });
	

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

    linkUpdate.on('mouseover', function(d) {
		d3.select(this)
			.style('stroke', 'steelblue');
		let attr = attrs[d['parent']['data']['feature']], sign = d['data']['sign'], 
			thred = d['parent']['data']['threshold']
		d3.select('#node_description')
			.html(`<p> Condition: ${attr+sign+thred} </p>`)
	})
	.on('mouseout', function(d) {
		d3.select(this)
			.style('stroke', 'lightgrey');
		d3.select('#node_description p').remove();

	})

	// Transition exiting nodes to the parent's new position.
	let linkExit = link.exit().transition()
	  .duration(duration)
	  .attr("d", function(d) {
		var o = {x: source.x, y: source.y};
		return diagonal(o, o);
	  })
	  .remove();

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
}