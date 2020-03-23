let ori_order = [];
let col_order = [];

let phrased_rule_id = -1;
let NODE_ENCODING = "purity";
let SUMMARY_LAYOUT = "tree";
let X_POS = 'fidelity';

d3.select("#node_encoding")
	.on("change", function() {
		let val = d3.select(this).property('value');
		change_node_encoding(val);
	});

d3.select("#layout")
	.on("change", function() {
		let val = d3.select(this).property('value');
		change_layout(val);
	});

d3.select("#generate_rule")
	.on("click", function() {
		generate_rules();
	});

d3.select('#x_position')
	.on('change', function() {
		let val = d3.select(this).property('value');
		change_x_position(val);
	});

d3.select('#dataset')
	.on('change', function() {
		let val = d3.select(this).property('value');
		folder = val;
		param_set = false;
		loadData();
	})

function generate_rules() {
	let support_val, num_feat_val;
		d3.select('#support_val')
	        .attr('value', function() {
	            support_val = this.value;
	            return this.value;
	        });

	    d3.select('#feature_val')
	        .attr('value', function() {
	            num_feat_val = this.value;
	            return this.value;
	        });

	    support_val = parseFloat(support_val);
		filter_threshold['support'] = support_val;

		num_feat_val = parseFloat(num_feat_val);
		filter_threshold['num_feat'] = num_feat_val;

		d3.select(".modal")
			.style("display", "none");
		if (!param_set) {
			loadData();
		} else {
			update_rules();
		}
}

function column_order_by_feat_freq(listData) {
	// initialize feature used freq.
	let col_info = [];
	col_order = [];
	for (let i = 0; i<attrs.length; i++) {
		col_info.push({
			'idx': i,
			'freq': 0
		});
		col_order.push(i);
	}

	listData.forEach((d)=> {
		let rule = d['rules']
		rule.forEach((r) => {
			col_info[r['feature']].freq++;
		});
	})

	// sort columns by freq.
	col_info.sort((a, b) => (a.freq > b.freq) ? -1 : 1);
	col_info.forEach((d, i) => col_order[d.idx] = i);

	return col_order;
}

function click_setting() {
	// console.log("click")
	document.getElementById('support_val').value = filter_threshold['support'];

	d3.select(".modal")
		.style("display", "block");
}

function click_cancel() {
	d3.select(".modal")
		.style("display", "none");
}

function click_summary_node(node_id) {
    console.log('click node: '+ node_id)

    // highlight in the tree view
    d3.select(`#tree_node-${node_id} .highlight-circle`).remove();
    d3.select(`.rule_clicked_node`).remove();

    if (!(node_id in multiple_selection)) {
    	let node = d3.select(`#tree_node-${node_id}`)

    	if (NODE_ENCODING == 'purity') {
    		let size = summary_size_(node_info[node_id]['support'])
    		node.append('rect')
				.attr('class', 'highlight-circle')
    			.attr('x', -size/2)
    			.attr('y', -size/2)
    			.attr('width', size)
    			.attr('height', size);
    	} else {
			node.append('circle')
				.attr('class', 'highlight-circle')
				.attr('r', summary_size(node_info[node_id]['support']));
    	}
    }

    // get the linked node information
    let linked_node_ids = find_connection(node_id);

	// link the node in the summary view
    let summary_view = d3.select('#summary_view');

    if (SUMMARY_LAYOUT == 'stat') {
	    summary_view.selectAll(".link").remove();
	    linked_node_ids.sort((a,b) => a-b);
	    linked_node_ids.forEach((id, i) => {
	    	if (i == 0) {
	    		return;
	    	}
	    	let parent = linked_node_ids[i-1];
	    	
	    	summary_view.append('line')
				.attr('class', 'link')
				.attr("x1", X_POS === 'fidelity' ? summary_x(node_info[parent]['fidelity'])
						: summary_x(node_info[parent]['accuracy']))
			    .attr("x2", X_POS === 'fidelity' ? summary_x(node_info[id]['fidelity'])
			    		: summary_x(node_info[id]['accuracy']))
			    .attr("y1", summary_y(node_info[parent]['depth']))
			    .attr("y2", summary_y(node_info[id]['depth']))
			    .style("stroke", nodeHighlightColor)
			    .style("stroke-width", "1.5px");
	    })
    } else if (SUMMARY_LAYOUT == 'tree') {
    	summary_view.selectAll('.link')
    		.style('stroke-width', '1px')

    	// highlight the path in the tree layout
		linked_node_ids.sort((a,b) => a-b);
	    linked_node_ids.forEach((id, i) => {
	    	if (i == 0) {
	    		return;
	    	}
	    	let parent = node_info[id]['parent'];
	    	let present_node = id;
	    	while (parent !== linked_node_ids[i-1]) {
				summary_view.select(`#tree_link_${id}_${parent}`)
			   	 .style("stroke-width", "1.5px");
			   	id = parent;
			   	parent = node_info[id]['parent'];
	    	}
	    	
	    	summary_view.select(`#tree_link_${id}_${parent}`)
			    .style("stroke-width", "2px");
	    })
    }
   
    // show details in the detail view
    postData("find_node_rules", linked_node_ids, (node_rules)=>{
		let rules = node_rules['rule_lists'];
	    present_rules = rules;
	    col_order = column_order_by_feat_freq(rules);

	    // update linked node2rule pos
		node2rule[1] = {};
		rule2node[1] = {};
		rules.forEach((d, i) => {
			node2rule[1][d['node_id']] = i;
			rule2node[1][i] = d['node_id'];
		});
	 	
	    // update_column_rendering(col_svg2);
		update_rule_rendering(rule_svg2, col_svg2, stat_svg2, 2, rules, col_order);

    	// add one selected rule to multiple selection
    	// TODO: remove multiple selection on the same path
    	let node_id = rules[rules.length-1]['node_id'];
    	if (node_id in multiple_selection) {
    		delete multiple_selection[node_id];
    	} else {
    		multiple_selection[node_id] = rules[rules.length-1];
    	}
		let multiple_rules = [];
		node2rule[3] = {};
		rule2node[3] = {}

		let summary_info = {
			'support': 0,
			'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0,
			'r-squared': [0, 0]
		}
		Object.keys(multiple_selection).forEach((node_id, idx) => {
			multiple_rules.push(multiple_selection[node_id]);
			node2rule[3][node_id] = idx;
			rule2node[3][idx] = node_id;
			summary_info['support'] += d3.sum(node_info[node_id]['value'])
			summary_info['tp'] += Math.floor(node_info[node_id]['conf_mat'][0][0] * d3.sum(node_info[node_id]['value']))
			summary_info['fp'] += Math.floor(node_info[node_id]['conf_mat'][0][1] * d3.sum(node_info[node_id]['value']))
			summary_info['tn'] += Math.floor(node_info[node_id]['conf_mat'][1][1] * d3.sum(node_info[node_id]['value']))
			summary_info['fn'] += Math.floor(node_info[node_id]['conf_mat'][1][0] * d3.sum(node_info[node_id]['value']))
			// summary_info['r-squared'][0] += summary_info['tp'] + summary_info['tn'];
			// summary_info['r-squared'][1] += 
		})
	    col_order = column_order_by_feat_freq(multiple_rules);
		update_rule_rendering(rule_svg4, col_svg4, stat_svg4, 4, multiple_rules, col_order);

		// get multiple selection summary
		render_stat_summary(summary_info);

		// highlight in the rule view TODO: DEBUG 
	    if (node_id in node2rule[0]) {      
	    	highlight_in_tab(0, '', node_id);
	    }
	    for (let tab_id = 1; tab_id < 4; tab_id++) {
		    if (node_id in node2rule[tab_id]) {
		    	highlight_in_tab(tab_id, tab_id+1, node_id);
		    }	
	    }
	    if (clicked_summary_node_id == node_id) {
	    	clicked_summary_node_id = -1;
	    } else {
	    	clicked_summary_node_id = node_id;
	    }
	})
}

function highlight_in_tab(tab_id, tab_p, node_id) {
	let rule_idx = node2rule[tab_id][node_id];
	d3.select(`#rule_svg${tab_p}`).select(`#back-rect-${rule_idx}`)
            .classed('rule_highlight', false);

	if (clicked_summary_node_id != node_id) {
		d3.select(`#rule_svg${tab_p}`).select(`#back-rect-${rule_idx}`)
		  .classed('rule_highlight', true);

		document.getElementById(`stat_div${tab_p}`).scrollTop = yScale(rule_idx);
		document.getElementById(`rule_div${tab_p}`).scrollTop = yScale(rule_idx);
	}
}

function click_rule(clicked_g, rule_idx, rule, tab_p) {
	console.log("click on rule", rule_idx);
	// highlight the rule in the rule view
	rule_svg.selectAll('.rule_highlight')
		.classed('rule_highlight', false);
	rule_svg2.selectAll('.rule_highlight')
		.classed('rule_highlight', false);
	rule_svg3.selectAll('.rule_highlight')
		.classed('rule_highlight', false);
	rule_svg4.selectAll('.rule_highlight')
		.classed('rule_highlight', false);

	clicked_g.select('.back-rect')
		.classed('rule_highlight', true);

	// get rule content
	let rules = listData[rule_idx];
	if (rule) {
		rules = rule;
	}
	// update data table
	let url = "get_matched_data"
	postData(url, JSON.stringify({"rules": rules['rules']}), (data) => {
		render_feature_names_and_grid(d3.select("#column_svg5"), col_order);
		d3.select("#data-table tbody").remove();

		let matched_data = data['matched_data'];
		let matched_gt = data['matched_gt'];
		let matched_pred = data['matched_pred'];

		d3.selectAll('#data-table *').remove();
		
		let table_width = attrs.length* (glyphCellWidth * 5 + rectMarginH * 2 - 2);
		let rows = d3.select('#data-table').append('table')
			.style('width', `${table_width}px`)
			.style('padding-left', `${margin.left}px`)
			.style('padding-right', `${margin.right}px`)
			.append('tbody')
			.selectAll('tr')
			.data(matched_data)
			.enter()
			.append('tr');

		let cells = rows.selectAll('td')
			.data(row => {
				let ordered_row = new Array(row.length);
				for (let i = 0; i<row.length; i++) {
					ordered_row[col_order[i]] = row[i];
				}
				return ordered_row;
			})
			.enter()
			.append('td')
			.text(cell => cell);

		// add prediction
		d3.selectAll('#data-pred svg *').remove();

		d3.select('#data-pred svg')
			.attr('width', "50px")
			.attr('height', 18*matched_gt.length)
			.append('g')
			.attr('class', 'instance-conf')
			.selectAll('circle')
			.data(matched_pred)
			.enter()
			.append('circle')
			.attr("cx", xScale.bandwidth()/2)
	        .attr("cy", (d, idx) => {
	            return 18 * idx + rule_radius + 2;
	        })
	        .attr("r", rule_radius)
	        .attr("fill", (d, idx) => {
	        	if (d == matched_gt[idx]) {
	        		return colorCate[d];
	        	} else {
	        		if (d == 0)
	        			return "url(#fp_pattern)"
	        		else 
	        			return "url(#fn_pattern)"
	        	}
	        })
	})
}

function hover_rule(clicked_g, rule_idx, rule, tab_p) {
	console.log('hover on rule row-'+rule_idx);

	let tab_id;
	if (tab_p == '') {
		tab_id = 0;
	} else {
		tab_id = +tab_p - 1;
	}

	// highlight the rule in the rule view
	clicked_g.select('.back-rect')
		.classed('rule_hover', true);
	// highlight in the stat
	d3.select(`#stat${tab_p}-back-rect-${rule_idx}`)
		.classed('rule_hover', true);

	// highlight the node in the tree view
	let node_id = rule2node[tab_id][rule_idx];
	d3.select(`.rule_clicked_node`).remove();

	// d3.select(`#tree_node-${node_id}`)
	// 	.append('circle')
	// 	.attr('class', 'rule_clicked_node')
	// 	.attr('r', summary_size(node_info[node_id]['support']))
	let node = d3.select(`#tree_node-${node_id}`)

	if (NODE_ENCODING == 'purity') {
		let size = summary_size_(node_info[node_id]['support'])
		node.append('rect')
			.attr('class', 'rule_clicked_node')
			.attr('x', -size/2)
			.attr('y', -size/2)
			.attr('width', size)
			.attr('height', size);
	} else {
		node.append('circle')
			.attr('class', 'rule_clicked_node')
			.attr('r', summary_size(node_info[node_id]['support']));
	}

	// update rule description
	let rule_des = d3.select('#rule_description');
	rule_des.selectAll('p').remove();

	let rules = listData[rule_idx];
	if (rule) {
		rules = rule;
	}
	let str = "";

	let rule_to_show = Array.from(rules['rules']);
	rule_to_show.sort((a, b) => col_order[a['feature']] - col_order[b['feature']]);
	rule_to_show.forEach((d, i) => {
		if (i>0) {
			str += "<b>AND</b> "
		} else {
			str += "<b>IF</b> "
		}
		str += `<u>${attrs[d['feature']]}</u>`;
		if (d['sign'] !== 'range') {
			str += " " + d['sign'] + d['threshold'] + " "
			// if (d['sign'] === '<=') {
			// 	str += ` is <span style="color: silver">low</span> `
			// } else {
			// 	str += ` is <span style="color: dimgrey">high</span> `
			// }
		} else {
			str += " btw. [" + d['threshold0'] + ', ' + d['threshold1'] + ') '
			// str += ` is <span style="color: grey">medium</span> `
		}
	})

	str += "<b>THEN</b> " + `<span style="color: ${colorCate[rules['label']]}">` + target_names[rules['label']] + "</span>.";

	rule_des.append('p')
		.html(str);
}

function showRule(evt, id) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementById("rule-detail").getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementById("rule-detail").getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(id).style.display = "flex";
  evt.currentTarget.className += " active";
}

function change_node_encoding(val) {
	NODE_ENCODING = val;

	update_summary(new_nodes);	
	update_legend();
}

function change_layout(val) {
	SUMMARY_LAYOUT = val;

	if (SUMMARY_LAYOUT == 'tree') {
		d3.select('#x-setting').style('display', 'none');
	} else {
		d3.select('#x-setting').style('display', 'flex');
	}

	update_summary(new_nodes);
}

function change_x_position(val) {
	X_POS = val;

	if (X_POS == 'accuracy') {
		summary_x = d3.scaleLinear()
			.domain([filter_threshold['accuracy'][0], filter_threshold['accuracy'][1]])
			.range([view_margin.left, view_margin.left+view_width]);	
	} else if (X_POS == 'fidelity') {
		summary_x = d3.scaleLinear()
			.domain([filter_threshold['fidelity'], 1])
			.range([view_margin.left, view_margin.left+view_width]);
	}

	update_summary(new_nodes);
}

function click_tree_level(idx) {
	d3.select(`#depth-${clicked_tree_level}`)
		.style("stroke-width", .5);

	d3.select(`#depth-${idx}`)
		.style("stroke-width", 1.5);
	clicked_tree_level = idx;

	// update the rule view for selected level
	fetch(domain + "get_rules_by_level/" + idx)
	.then((data) => {
      if(data.status !== 200 || !data.ok) {
        throw new Error(`server returned ${data.status}${data.ok ? " ok" : ""}`);
      }
      const ct = data.headers.get("content-type");
      return data.json();
    }).then((res) => {
		let rules = res['rule_lists'];
		let nodes = res['nodes'];
	    present_rules = rules;
	    col_order = column_order_by_feat_freq(rules);

	    // update linked node2rule pos
	    node2rule[2] = {};
	    rule2node[2] = {};
	    rules.forEach((d, idx) => {
	      node2rule[3][d['node_id']] = idx;
	      rule2node[3][idx] = d['node_id'];
	    })
	    // update_column_rendering(col_svg2);
		update_rule_rendering(rule_svg3, col_svg3, stat_svg3, 3, rules, col_order);
	})
}

function click_setting_tab(evt, id) {
	// Declare all variables
	var i, tabcontent, tablinks;

	// Get all elements with class="tabcontent" and hide them
	tabcontent = document.getElementById("setting-block").getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	// Get all elements with class="tablinks" and remove the class "active"
	tablinks = document.getElementById("setting-tabs").getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	// Show the current tab, and add an "active" class to the button that opened the tab
	document.getElementById(id).style.display = "flex";
	evt.currentTarget.className += " active";
}
