let ori_order = [];
let col_order = [];

let phrased_rule_id = -1;

d3.select("#col_sort")
	.on("change", function() {
		let val = d3.select(this).property('value');

		if (val == 'none') {

		} else if (val = "feat_freq") {

		}
	})

d3.select("#generate_rule")
	.on("click", function() {
		generate_rules();
	});

function generate_rules() {
	let support_val, fidelity_val;
		d3.select('#support_val')
	        .attr('value', function() {
	            support_val = this.value;
	            return this.value;
	        });
	    d3.select('#fidelity_val')
	        .attr('value', function() {
	            fidelity_val = this.value;
	            return this.value;
	        });

	    support_val = parseFloat(support_val);
    	fidelity_val = parseFloat(fidelity_val);	
		filter_threshold['support'] = support_val;
		filter_threshold['fidelity'] = fidelity_val/100;

		d3.select(".modal")
			.style("display", "none");
		if (!param_set) {
			loadData();
		} else {
			new_nodes = filter_nodes(node_info,);
			update_summary(new_nodes);
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
	document.getElementById('fidelity_val').value = filter_threshold['fidelity'] * 100;


	d3.select(".modal")
		.style("display", "block");
}

function click_cancel() {
	d3.select(".modal")
		.style("display", "none");
}

function click_summary_node(node_id) {
    console.log('click node: '+ node_id)

    // highlight in the overview
    if (node2rule[node_id]) {      
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


    // get the linked node information
    let linked_node_ids = find_connection(node_id);

    // link the node in the summary view
    let summary_view = d3.select('#summary_view');
    summary_view.selectAll(".link").remove();

    linked_node_ids.sort((a,b) => a-b);
    linked_node_ids.forEach((id, i) => {
    	if (i == 0) {
    		return;
    	}
    	let parent = linked_node_ids[i-1];
    	if (i === linked_node_ids.length - 1 && node_info[id]['parent']!== parent) {
    		parent = linked_node_ids[i-2];
    	}
    	
    	summary_view.append('line')
			.attr('class', 'link')
			.attr("x1", summary_x(node_info[parent]['fidelity']))
		    .attr("x2", summary_x(node_info[id]['fidelity']))
		    .attr("y1", summary_y(node_info[parent]['depth']))
		    .attr("y2", summary_y(node_info[id]['depth']))
		    .style("stroke", nodeHighlightColor)
		    .style("stroke-width", "1px")
		    .style("stroke-dasharray", );
    })

    // show details in the detail view
    let query_url = domain + "find_linked_rules/" + node_id;
    linked_rules = fetch(query_url).then((data) => {
      if(data.status !== 200 || !data.ok) {
        throw new Error(`server returned ${data.status}${data.ok ? " ok" : ""}`);
      }
      const ct = data.headers.get("content-type");
      return data.json();
    }).then((node_rules) => {
		let rules = node_rules['rule_lists'];
	    present_rules = rules;
	    col_order = column_order_by_feat_freq(rules);

	    // update linked node2rule pos
	    linkednode2rule = {};
	    rules.forEach((d, idx) => {
	      linkednode2rule[d['node_id']] = idx;
	    })
	    // update_column_rendering(col_svg2);
		update_linked_rule_rendering(rules, col_order);
	})
}

function click_rule(rule_idx, rule) {
	console.log('click rule row-'+rule_idx);

	let rule_des = d3.select('#rule_description');
	rule_des.selectAll('p').remove();


	let rules = listData[rule_idx];
	if (rule) {
		rules = rule;
	}
	let str = "";
	rules['rules'].forEach((d, i) => {
		if (i>0) {
			str += "AND "
		} else {
			str += "IF "
		}
		str += attrs[d['feature']];
		if (d['sign'] !== 'range') {
			str += " " + d['sign'] + d['threshold'] + ", "
		} else {
			str += " in range[" + d['threshold0'] + ', ' + d['threshold1'] + '), '
		}
	})

	str += "Then " + target_names[rules['label']]

	rule_des.append('p')
		.text(str);
}

function showRule(evt, id) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(id).style.display = "flex";
  evt.currentTarget.className += " active";
}


