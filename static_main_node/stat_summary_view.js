
function render_stat_summary(summary_info) {
	d3.selectAll('#selection_summary svg *').remove();

	let svg = d3.selectAll('#selection_summary svg');

	let summary_height = 18, 
		summary_bar_width = 80,
		summary_bar_height = 10,
		margin = {left: 5, top: -10},
		xoffset = 50;

	let stat = svg.append('g')
		.attr("class", "stat_summary")
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

	let key_list = ['support', 'tp', 'fp', 'tn', 'fn'];
	let size_list = [
		d3.sum(node_info[0]['value']),
		Math.floor(node_info[0]['conf_mat'][0][0] * d3.sum(node_info[0]['value'])),
		Math.floor(node_info[0]['conf_mat'][0][1] * d3.sum(node_info[0]['value'])),
		Math.floor(node_info[0]['conf_mat'][1][1] * d3.sum(node_info[0]['value'])),
		Math.floor(node_info[0]['conf_mat'][1][0] * d3.sum(node_info[0]['value'])),
	];
	let conf_fill = ['lightgrey', colorCate[0], 'url(#fp_pattern_white)', colorCate[1], `url(#fn_pattern_white)`,];

	for (let i = 0; i < 5; i++) {
		stat.append('text')
			.attr('x', 0)
			.attr('y', summary_height * (i+1) + summary_bar_height)
			.text(key_list[i]);
		stat.append('rect')
			.attr('x', xoffset)
			.attr('y', summary_height * (i+1))
			.classed('summary_back_bar', true);
		stat.append('rect')
			.attr('x', xoffset)
			.attr('y', summary_height * (i+1))
			.classed('summary_front_bar', true)
			.style('fill', conf_fill[i])
			.attr('width', summary_bar_width * summary_info[key_list[i]]/ size_list[i]);
		stat.append('text')
			.attr('x', xoffset+2)
			.attr('y', summary_height * (i+1) + summary_bar_height)
			.attr('class', 'des_text')
			.text(`${summary_info[key_list[i]]} / ${size_list[i]}`);
	}
}