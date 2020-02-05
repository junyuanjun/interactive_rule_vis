import numpy as np
import copy

class Forest():
	def initialize(self, node_info, real_min, real_max):
		self.node_info = { x['node_id'] : x for x in node_info }
		ranges = np.zeros(shape=(len(real_max), 2))
		ranges[:, 0] = real_min
		ranges[:, 1] = real_max
		self.ranges = ranges

		self.has_leaves = []

		self.node_feature_ranges = {x['node_id']: [] for x in node_info}
		self.node_feature_marked = {x['node_id']: False for x in node_info}
		# mark the root node
		self.node_feature_marked[0] = True
		self.node_feature_ranges[0] = copy.deepcopy(ranges)


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
			"node": node_id,
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

