let ori_order = [];
let col_order = [];


d3.select("#col_sort")
	.on("change", function() {
		let val = d3.select(this).property('value');

		if (val == 'none') {

		} else if (val = "feat_freq") {

		}
	})

d3.select("#generate_rule")
	.on("click", function() {
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
			param_set = true;
		} else {
			new_nodes = filter_nodes(node_info,);
        	update_summary(new_nodes);
		}
	});

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


