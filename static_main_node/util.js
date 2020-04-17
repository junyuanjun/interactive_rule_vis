let filter_threshold = {
	'support': 20,
	'fidelity': 0,
	'accuracy': [0, 1.],
  'num_feat': 5,
  'depth': 20,
}

let node2rule = [{}, {}, {}, {}];
let rule2node = [{}, {}, {}, {}];

let new_node_shown = {};

function filter_nodes(node_info) {
	new_nodes = [];

  new_node_shown = {};
	Object.keys(node_info).forEach(idx => {
    let d = node_info[idx];
		if (d3.sum(d['value']) >= filter_threshold['support']
			&& d['accuracy'] >= filter_threshold['accuracy'][0] && d['accuracy'] <= filter_threshold['accuracy'][1]
      && d['num_feat'] <= filter_threshold['num_feat']
    ) {
			new_nodes.push(d);
      new_node_shown[d['node_id']] = true;
		}
	});

	return new_nodes;
}

function find_leaf_rules(new_nodes, node_info, tab_id) {
	let url = 'find_leaf_rules';

	// make a node id list
	let node_list = [];
	new_nodes.forEach(d => node_list.push(d['node_id']));
	postData(url, node_list, (leaf_rules) => {
		let rules = leaf_rules['rule_lists'];
    rules.sort((a,b) => pre_order[a.node_id].order-pre_order[b.node_id].order);
    listData = rules;

    present_rules = rules;
    col_order = column_order_by_feat_freq(rules);

    // update node2rule pos
    node2rule[tab_id] = {};
    rule2node[tab_id] = {}
    rules.forEach((d, idx) => {
      node2rule[tab_id][d['node_id']] = idx;
      rule2node[tab_id][idx] = d['node_id'];
    })

    update_rule_rendering(rule_svg, col_svg, stat_svg, "", rules, col_order);
    d3.select("#rule-num")
        .text(rules.length);
    update_summary(new_nodes);
	})
}

function find_connection(node_id) {
  let connection = [node_id];

  // find ancesters
  let p_id = node_info[node_id]['parent'];
  while (p_id >= 0) {
    if (new_node_shown[p_id]) {
      connection.push(p_id);
    }
    p_id = node_info[p_id]['parent'];
  }

  // find the children
  // let c_id = node_info[node_id]['left'];
  // if (new_node_shown[c_id] && c_id > 0) {
  //   connection.push(c_id);
  // }
  // c_id = node_info[node_id]['right'];
  // if (new_node_shown[c_id] && c_id > 0)
  //   connection.push(c_id);
  
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

function generate_row_order_by_label(listData) {
  let row_info = [];

  // initialize label.
  listData.forEach((d, i)=> {
    row_info.push({
      'idx': i,
      'node_id': d['node_id'],
      'label': d['label'],
    })
  })

  // sort columns by label, ascending
  // left to right for the same label
  row_info.sort((a, b) => {
    if (a.label !== b.label)
      return a.label - b.label;
    else
      return pre_order[a.node_id].order - pre_order[b.node_id].order;
  });
  row_info.forEach((d, i) => row_order[d.idx] = i);

  return row_order;
}

function generate_row_order_by_confmat(listData, conf_idx) {
 let row_info = [];

  // initialize conf val.
  listData.forEach((d, i)=> {
    row_info.push({
      'idx': i,
      'node_id': d['node_id'],
      'conf_val': node_info[d['node_id']]['conf_mat'][conf_idx],
    })
  })

  // sort columns by conf_val, descending
  // left to right for the same label
  row_info.sort((a, b) => {
    if (a.conf_val !== b.conf_val)
      return b.conf_val - a.conf_val;
    else
      return pre_order[a.node_id].order - pre_order[b.node_id].order;
  });
  row_info.forEach((d, i) => row_order[d.idx] = i);

  return row_order;
}

function generate_row_order_by_key(listData, key) {
  let row_info = [];

  // initialize val.
  listData.forEach((d, i)=> {
    row_info.push({
      'idx': i,
      'node_id': d['node_id'],
      'val': node_info[d['node_id']][key],
    })
  })

  // sort columns by val, descending
  // left to right for the same label
  row_info.sort((a, b) => {
    if (a.val !== b.val)
      return b.val - a.val;
    else
      return pre_order[a.node_id].order - pre_order[b.node_id].order;
  });
  row_info.forEach((d, i) => row_order[d.idx] = i);

  return row_order;
}

function generate_row_order_by_feature(listData) {
  let row_info = [];

  for (let i = 0; i<attrs.length; i++) {
    col_info.push({
      'idx': i,
    });
    col_order.push(i);
  }

  listData.forEach((d)=> {
    let rule = d['rules']
    rule.forEach((r) => {
      col_info[r['feature']].freq++;
    });
  })
}