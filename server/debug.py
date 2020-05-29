import pandas as pd
import tree_node_info
import json

print("===== generate surrogate rules ======")
para = {
	"filter_threshold": {
		"support": 20,
		"fidelity": .8,
		"num_feat": 5,
  		"num_bin": 3,
	},
    "dataname": 'fico_rf',
}
filter_threshold = para['filter_threshold']
for key in filter_threshold:
	if (key!='fidelity'):
		filter_threshold[key] = int(filter_threshold[key])
	else:
		filter_threshold[key] = float(filter_threshold[key])

num_bin = para['filter_threshold']['num_bin']
dataname = para['dataname']
folder = "./data/" + dataname + "/"

node_info = []
real_min = []
real_max = []
with open(folder + 'node_info.json', 'r') as json_input:
	node_info = json.load(json_input)['node_info_arr']
with open(folder + 'test.json', 'r') as json_input:
	data = json.load(json_input)
	df = pd.DataFrame(columns=data['columns'], data=data['data'])
	y_pred = data['y_pred']
	y_gt = data['y_gt']

# train surrogate
surrogate_obj = tree_node_info.tree_node_info()
to_keep = df.columns
X = df.values
surrogate_obj.initialize(X=X, y=y_gt, y_pred=y_pred, 
                         attrs=to_keep, filter_threshold=filter_threshold,
                         num_bin=num_bin, verbose=True
).train_surrogate_random_forest().tree_pruning()

# extract rules
forest_obj = tree_node_info.forest()
forest_obj.initialize(
    trees=surrogate_obj.tree_list, cate_X=surrogate_obj.cate_X, 
    y=y_gt, y_pred=y_pred, attrs=to_keep, num_bin=num_bin,
    real_percentiles=surrogate_obj.real_percentiles,
    real_min=surrogate_obj.real_min, real_max=surrogate_obj.real_max,
).construct_tree().extract_rules()
print("===== #tree leaves:", len(forest_obj.leaves), "=====")

# find min set
rs = tree_node_info.forest_rules()
rs.initialize(pd.DataFrame(data=X, columns=to_keep), forest_obj.rule_lists, surrogate_obj.real_min, surrogate_obj.real_max)
ts = rs.find_the_min_set()
print("===== min set:", ts, "=====")


# initialize info for front-end

res = {"rules": [forest_obj.rule_lists[x] for x in ts], "tot_rule": len(forest_obj.rule_lists)}
