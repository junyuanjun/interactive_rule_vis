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

function click_rule(rule_idx) {
	console.log('click rule row-'+rule_idx);

	let rule_des = d3.select('#rule_description');
	rule_des.selectAll('p').remove();
	
	let str = "";
	listData[rule_idx]['rules'].forEach((d, i) => {
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

	rule_des.append('p')
		.text(str);

	rule_des.append('p')
		.text(`THEN ${target_names[listData[rule_idx]['label']]}`)
}


