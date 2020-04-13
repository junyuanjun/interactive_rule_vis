import numpy as np
import pandas as pd
import copy

class Forest():
	def initialize(self, node_info, real_min, real_max, real_percentile, df, y_pred, y_gt):
		self.node_info = { int(x) : node_info[x] for x in node_info }
		# self.node_info = node_info
		ranges = np.zeros(shape=(len(real_max), 2))
		ranges[:, 0] = 0
		ranges[:, 1] = real_percentile['num_threshold']
		self.ranges = ranges

		self.has_leaves = []

		self.node_feature_ranges = {int(x): [] for x in node_info}
		self.node_feature_marked = {int(x): False for x in node_info}
		# mark the root node
		self.node_feature_marked[0] = True
		self.node_feature_ranges[0] = copy.deepcopy(ranges)
		self.df = df
		self.y_pred = np.array(y_pred)
		self.y_gt = np.array(y_gt)
		# cate_X initialization
		# self.initialize_cate_X(self.df.values)

		self.real_percentile = real_percentile
		self.rep_range = np.zeros(shape=(len(real_min), real_percentile['num_threshold']+1, 2))
		for idx in range(len(real_min)):
			self.rep_range[idx][0] = np.array([real_min[idx], real_percentile['percentile_table'][0][idx]])
			for i in range(real_percentile['num_threshold']-1):
				self.rep_range[idx][1] = np.array([real_percentile['percentile_table'][i][idx], 
					real_percentile['percentile_table'][i+1][idx]])
			self.rep_range[idx][2] = np.array([real_percentile['percentile_table'][i+1][idx], real_max[idx]])

	def initialize_cate_X(self, X):
		self.real_3_1 = np.percentile(X, q=33, axis=0)
		self.real_3_2 = np.percentile(X, q=67, axis=0)
		cate_X = []
		for col_idx in range(X.shape[1]):
			cate_X.append([self.transform_func(col_idx, ele) for ele in X[:, col_idx]])

		cate_X = np.transpose(np.array(cate_X))
		self.cate_X = cate_X

	def transform_func(self, col_idx, ele):
		if (ele < self.real_3_1[col_idx]):
			return 0
		elif (ele < self.real_3_2[col_idx]):
			return 1
		else:
			return 2

	def empty_has_leaves(self):
		self.has_leaves = np.zeros(len(self.node_info))
		self.has_leaves[0] = True

	def trace_back(self, node_id):
		if (self.has_leaves[node_id] or node_id<0):
			return
		parent_id = self.node_info[node_id]['parent']
		self.has_leaves[node_id] = True
		self.trace_back(parent_id)

	def rule_traversal(self, node_id):
		if (self.node_feature_marked[node_id]):
			return self.node_feature_ranges[node_id]
		# recursive process
		parent_id = self.node_info[node_id]['parent']
		self.rule_traversal(parent_id)
		threshold = self.node_info[parent_id]['threshold']
		f_id = self.node_info[parent_id]['feature']

		# update left child, feat < threshold, (val0, min(val1, threshold))
		left = self.node_info[parent_id]['left']
		self.node_feature_ranges[left] = copy.deepcopy(self.node_feature_ranges[parent_id])
		self.node_feature_ranges[left][f_id][1] = np.min([self.node_feature_ranges[left][f_id][1], threshold])
		self.node_feature_marked[left] = True
		# update right child, feat > threshold, (max(val0, threshold), val1)
		right = self.node_info[parent_id]['right']
		self.node_feature_ranges[right] = copy.deepcopy(self.node_feature_ranges[parent_id])
		self.node_feature_ranges[right][f_id][0] = np.max([self.node_feature_ranges[right][f_id][0], threshold])
		self.node_feature_marked[right] = True

	def tree_traversal_limite_depth(self, node_id):
		if (self.node_info[node_id]['depth'] == self.depth_limit):
			self.node_order.append(node_info)
			return
		self.tree_traversal_limite_depth(node_info[node_id]['left'])
		self.tree_traversal_limite_depth(node_info[node_id]['right'])

	def convert2rule(self, node_id):
		feature_range = self.node_feature_ranges[node_id]
		rules = []
		for j in range(self.ranges.shape[0]):
			if (feature_range[j][0]!=0 or feature_range[j][1]!=self.real_percentile['num_threshold']):
				new_cond = self.translate_rule(feature_range[j], j)
				rules.append(new_cond)
		return {
			"label": int(np.argmax(self.node_info[node_id]['value'])),
			"node_id": node_id,
			"rules": rules,
		}

	def translate_rule(self, feat_range, feat_idx):
		# find the integers that fit
		ranges = []
		for i in range(3):
		    if (i >= feat_range[0] and i <= feat_range[1]):
		        ranges.append(i)

		# translate the integer into rule condition
		if (ranges[0] == 0):
		    # (min, threshold]
		    cond = {
		        'feature': feat_idx,
		        'sign': '<=',
		        'threshold': self.rep_range[feat_idx][ranges[-1]][1]
		    }
		elif (ranges[-1] == 2):
		    # (threshold, max]
		    cond = {
		        'feature': feat_idx,
		        'sign': '>',
		        'threshold': self.rep_range[feat_idx][ranges[0]][0]
		    }
		else:
		    # (threshold0, threshold1]
		    cond = {
		        'feature': feat_idx,
		        'sign': 'range',
		        'threshold0': self.rep_range[feat_idx][ranges[0]][0],
		        'threshold1': self.rep_range[feat_idx][ranges[-1]][1]
		    }
		return cond
					

	def find_leaf_rules(self, new_node_ids):
		self.empty_has_leaves()
		# sort nodes by level, the lower (deeper) ones rank first
		new_nodes = []
		for node_id in new_node_ids:
			new_nodes.append({
				'node_id': node_id,
				'depth': self.node_info[node_id]['depth'],
			});

		sorted_nodes = sorted(new_nodes, key = lambda x: -x['depth'])

		# trace the branches
		leaf_node_ids = []
		for node in sorted_nodes:
			node_id = node['node_id']
			if (self.has_leaves[node_id] != True):
				leaf_node_ids.append(node_id)
				rule = self.trace_back(node_id)

		# convert leaf nodes into rules
		leaf_rules = []
		for leaf_node_id in leaf_node_ids:
			self.rule_traversal(leaf_node_id)
			leaf_rules.append(self.convert2rule(leaf_node_id))

		return leaf_rules

	def find_linked_rules(self, node_id):
		self.rule_traversal(node_id)
		p_id = node_id
		linked_rules = []
		while (p_id > 0):
			linked_rules.append(self.convert2rule(p_id))
			p_id = self.node_info[p_id]['parent']
		linked_rules.reverse()
		return linked_rules

	def find_node_rules(self, node_ids):
		# min_node_id = np.min(node_ids)
		node_rules = []
		for node_id in node_ids:
			self.rule_traversal(node_id)
			node_rules.append(self.convert2rule(node_id))
		return node_rules

	def get_matched_data(self, conditions):
		cols = self.df.columns
		matched_data = pd.DataFrame(self.df)
		for cond in conditions:
			col = cols[cond['feature']]
			if (cond['sign'] == '<='):	
				matched_data = matched_data[matched_data[col] <= cond['threshold']]
			elif (cond['sign'] == '>'):
				matched_data = matched_data[matched_data[col] > cond['threshold']]
			elif (cond['sign'] == 'range'):
				matched_data = matched_data[(matched_data[col] > cond['threshold0']) & (matched_data[col] <= cond['threshold1'])]
			else:
				print("!!!!!! Error rule !!!!!!")

		matched_index = matched_data.index.values.astype(int)
		matched_pred = self.y_pred[matched_index]
		matched_gt = self.y_gt[matched_index]
		return {
			'matched_data': matched_data.values.tolist(),
			'matched_pred': matched_pred.tolist(),
			'matched_gt': matched_gt.tolist(),
		}

	def get_rules_by_level(self, depth):
		self.result_nodes = []
		self.get_nodes_by_level(0, depth)
		
		node_rules = self.find_node_rules(self.result_nodes)
		return {"nodes": self.result_nodes, "rule_lists": node_rules}


	def get_nodes_by_level(self, node_id, target_level):
		# print(node_id, self.node_info[node_id]['depth'])
		if (self.node_info[node_id]['depth'] == target_level):
			self.result_nodes.append(node_id)
			return
		if (self.node_info[node_id]['left'] > 0):
			self.get_nodes_by_level(self.node_info[node_id]['left'], target_level)
		if (self.node_info[node_id]['right'] > 0):
			self.get_nodes_by_level(self.node_info[node_id]['right'], target_level)

	def get_histogram(self, selection):
		dist_list = []
		node_list = []
		for node in selection:
			node_id = int(node)
			node_list.append(node_id)
		rule_list = self.find_node_rules(node_list)

		cols = self.df.columns
		matched_data = pd.DataFrame(self.df)
		# matched_data = pd.DataFrame(data = self.cate_X, columns=cols)
		included_index = []
		for rule in rule_list:
			for cond in rule['rules']:
				col = cols[cond['feature']]
				if (cond['sign'] == '<='):	
					matched_data = matched_data[matched_data[col] <= cond['threshold']]
				elif (cond['sign'] == '>'):
					matched_data = matched_data[matched_data[col] > cond['threshold']]
				elif (cond['sign'] == 'range'):
					matched_data = matched_data[(matched_data[col] > cond['threshold0']) & (matched_data[col] <= cond['threshold1'])]
				else:
					print("!!!!!! Error rule !!!!!!")
			included_index.extend(matched_data.index.values)
			to_exclude = self.df.index.isin(included_index)
			matched_data = pd.DataFrame(self.df)[~to_exclude]

		X = self.df.iloc[included_index].values
		dist_list = []
		print(X.shape)

		for attr_idx in range(len(cols)):
			hist = np.histogram(X[:, attr_idx], bins=10, range=self.ranges[attr_idx])
			dist_list.append({
				'hist': hist[0].tolist(),
				'bin_edges': hist[1].tolist(),
			})
		return dist_list
	
	def get_r_sqaured():
		# calculate R-squared
		leave_pred = estimator.predict(cate_X)
		sse = np.sum((leave_pred - y_svm_)**2)
		sst = np.sum((y_svm_ - y)**2)
		rsqr = 1-sse/sst
		return rsqr
		
	def get_level_rules(depth_limit):
		self.depth_limit = depth_limit
		self.node_order = []
		self.tree_traversal_limite_depth(0)
		rule_list = []
		for node_id in self.node_order:
			rule_list.append(self.convert2rule(node_id))
		return rule_list

