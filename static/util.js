filter_threshold = {
	'support': [0, 1],
	'fidelity': [0, 1],
	'accuracy': [0, 1],
}


function filter_nodes(node_info) {
	let new_nodes = [];

	node_info.forEach(d => {
		if (d['support'] >= filter_threshold['support'][0] && d['support'] <= filter_threshold['support'][1]
			&& d['accuracy'] >= filter_threshold['accuracy'][0] && d['accuracy'] <= filter_threshold['accuracy'][1]
			&& d['fidelity'] >= filter_threshold['fidelity'][0] && d['fidelity'] <= filter_threshold['fidelity'][1]) {
			new_nodes.push(d);
		}
	});

	return new_nodes;
}