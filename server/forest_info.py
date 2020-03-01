import numpy as np
import pandas as pd
import copy

class Forest():
	def initialize(self, node_info, real_min, real_max, df):
		self.node_info = { int(x) : node_info[x] for x in node_info }
		# self.node_info = node_info
		ranges = np.zeros(shape=(len(real_max), 2))
		ranges[:, 0] = real_min
		ranges[:, 1] = real_max
		self.ranges = ranges

		self.has_leaves = []

		self.node_feature_ranges = {int(x): [] for x in node_info}
		self.node_feature_marked = {int(x): False for x in node_info}
		# mark the root node
		self.node_feature_marked[0] = True
		self.node_feature_ranges[0] = copy.deepcopy(ranges)
		self.df = df

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

	def convert2rule(self, node_id):
		feature_range = self.node_feature_ranges[node_id]
		rules = []
		for j in range(self.ranges.shape[0]):
			if (feature_range[j][0]!=self.ranges[j][0] and feature_range[j][1]!=self.ranges[j][1]):
				rules.append({
					"feature": j,
					"sign": "range",
					"threshold0": float(feature_range[j][0]),
					"threshold1": float(feature_range[j][1]),
				})
			elif (feature_range[j][0]!=self.ranges[j][0]):
				rules.append({
					"feature": j,
					"sign": ">",
					"threshold": float(feature_range[j][0])
				})
			elif (feature_range[j][1]!=self.ranges[j][1]):
				rules.append({
					"feature": j,
					"sign": "<=",
					"threshold": float(feature_range[j][1])
				})
		return {
			"label": int(np.argmax(self.node_info[node_id]['value'])),
			"node_id": node_id,
            "rules": rules,
		}
					

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
		return matched_data.values.tolist()

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



