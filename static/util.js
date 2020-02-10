filter_threshold = {
	'support': 20,
	'fidelity': 0.8,
	'accuracy': [0, 1],
  'num_feat': [0, 20],
  'depth': [0, 20],
}

leaf_nodes = [];


function filter_nodes(node_info) {
	let new_nodes = [];

	node_info.forEach(d => {
		if (d3.sum(d['value']) >= filter_threshold['support']
      && d['fidelity'] >= filter_threshold['fidelity']
			&& d['accuracy'] >= filter_threshold['accuracy'][0] && d['accuracy'] <= filter_threshold['accuracy'][1]
      && d['num_feat'] >= filter_threshold['num_feat'][0] && d['num_feat'] <= filter_threshold['num_feat'][1]
    ) {
			new_nodes.push(d);
		}
	});

	return new_nodes;
}

function find_leaf_rules(new_nodes, node_info, listData) {
	let url = 'find_leaf_rules';

	// make a node id list
	let node_list = [];
	new_nodes.forEach(d => node_list.push(d['node_id']));
	postData(url, node_list, (leaf_rules) => {
		let rules = leaf_rules['rule_lists'];
    present_rules = rules;
    col_order = column_order_by_feat_freq(rules);
    leaf_nodes = []
    rules.forEach(d => leaf_nodes.push(d['node_id']))
    update_column_rendering();
		update_rule_rendering(rules, col_order);

    if (!param_set) {
      update_summary(new_nodes)
    }
	})
}


function postData(url, data, cb) {
  var myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  if (cb !== undefined) {
    fetch(`${domain}${url}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body:JSON.stringify(data)
    }).then((data) => {
      if(data.status !== 200 || !data.ok) {
        throw new Error(`server returned ${data.status}${data.ok ? " ok" : ""}`);
      }
      const ct = data.headers.get("content-type");
      return data.json();
    }).then((cb));
  } else {
    fetch(`${domain}${url}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body:JSON.stringify(data)
    }).then((res) => {
      console.log(res);
    });
  }

}