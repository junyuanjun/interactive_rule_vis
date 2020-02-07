let ori_order = [];
let col_order = [];


d3.select("#col_sort")
	.on("change", function() {
		let val = d3.select(this).property('value');

		if (val == 'none') {

		} else if (val = "feat_freq") {

		}
	})


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


