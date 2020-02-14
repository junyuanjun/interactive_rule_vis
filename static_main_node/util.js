let filter_threshold = {
	'support': 20,
	'fidelity': 0,
	'accuracy': [0, 1.],
  'num_feat': 20,
  'depth': 20,
}

let node2rule = {};
let linkednode2rule = {};

let new_node_shown = {};

function filter_nodes(node_info) {
	let new_nodes = [];

  new_node_shown = {};
	Object.keys(node_info).forEach(idx => {
    let d = node_info[idx];
		if (d3.sum(d['value']) >= filter_threshold['support']
      && d['fidelity'] >= filter_threshold['fidelity']
			&& d['accuracy'] >= filter_threshold['accuracy'][0] && d['accuracy'] <= filter_threshold['accuracy'][1]
      && d['num_feat'] <= filter_threshold['num_feat']
    ) {
			new_nodes.push(d);
      new_node_shown[d['node_id']] = true;
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

    // update node2rule pos
    node2rule = {};
    rules.forEach((d, idx) => {
      node2rule[d['node_id']] = idx;
    })
    // update_column_rendering(column_svg, col_order);
		update_rule_rendering(rules, col_order);

    update_summary(new_nodes);
	})
}

function find_connection(node_id) {
  let connection = [node_id];

  // find ancesters
  let p_id = node_info[node_id]['parent'];
  while (p_id > 0) {
    if (new_node_shown[p_id]) {
      connection.push(p_id);
    }
    p_id = node_info[p_id]['parent'];
  }

  // find the children
  let c_id = node_info[node_id]['left'];
  if (new_node_shown[c_id] && c_id > 0) {
    connection.push(c_id);
  }
  c_id = node_info[node_id]['right'];
  if (new_node_shown[c_id] && c_id > 0)
    connection.push(c_id);
  
  return connection;
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