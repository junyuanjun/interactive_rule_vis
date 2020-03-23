from forest_info import Forest
import json
import os
import pandas as pd
from flask import Flask
from flask_cors import CORS
from flask import request
from flask import send_from_directory

app = Flask(__name__, static_folder="../static_main_node", template_folder="../static_main_node")
CORS(app)

forest = Forest()

@app.route("/index.html")
def index():
	print("return index.html")
	return send_from_directory('../static_main_node/', 'interactive_rule_table.html')

@app.route('/static_main_node/<path:path>')
def send_static(path):
	print("return file at: "+path)
	return send_from_directory('../static_main_node', path)

@app.route('/data/<path:path>')
def send_data(path):
	print("return data: "+path)
	return send_from_directory('../data', path)

@app.route("/initialize/<dataname>")
def initialize(dataname):
	print("start initialization")
	folder = "./data/" + dataname + "/"
	node_info = []
	real_min = []
	real_max = []
	with open(folder + 'node_info.json', 'r') as json_input:
		node_info = json.load(json_input)['node_info_arr']
	with open(folder + 'test.json', 'r') as json_input:
		data = json.load(json_input)
		real_min = data['real_min']
		real_max = data['real_max']
		df = pd.DataFrame(columns=data['columns'], data=data['data'])
		y_pred = data['y_pred']
		y_gt = data['y_gt']

	forest.initialize(node_info, real_min, real_max, df, y_pred, y_gt)
	print("====initialized====")
	return "initialized"

@app.route("/find_leaf_rules", methods=['POST'])
def find_leaf_rules():
	print("===== FIND LEAF RULES =====")
	print("content type: ",  request.content_type)
	new_node_ids = json.loads(str(request.get_json(force=True)))
	leaf_rules = forest.find_leaf_rules(new_node_ids)
	return {'rule_lists': leaf_rules}

@app.route("/find_node_rules", methods=['POST'])
def find_node_rules():
	print("====== FIND NODE RULES ======")
	node_ids = json.loads(str(request.get_json(force=True)))
	ranked_rules = forest.find_node_rules(node_ids)
	return {'rule_lists': ranked_rules}

@app.route("/find_linked_rules/<node_id>")
def find_linked_rules(node_id):
	print("===== FIND LINKED RULES =====")
	try:
		int_node_id = int(node_id)
	except:
		return "Please enter a number"
	ranked_rules = forest.find_linked_rules(int_node_id)
	return {'rule_lists': ranked_rules}

@app.route("/get_matched_data", methods=['POST'])
def get_matched_data():
	print("===== GET MATCHED DATA =====")
	rule = json.loads(str(request.get_json(force=True)))
	matched_res = forest.get_matched_data(rule["rules"])
	return matched_res

@app.route("/get_rules_by_level/<depth>")
def get_rules_by_level(depth):
	print("===== FIND RULES BY LEVEL =====")
	try:
		int_depth= int(depth)
	except:
		return "Please enter a number"
	res = forest.get_rules_by_level(int_depth)
	return res

@app.route("/generate_rules")
def generate_rules_after_filtering():
	print("===== generate_rules =====")
	threshold = json.loads(str(request.get_json(force=True)))
	res = forest.generate_tree_and_rules(threshold)
	return res

@app.route("/get_histogram", methods=['POST'])
def get_histogram():
	print("===== get_histogram =====")
	selection = json.loads(str(request.get_json(force=True)))
	selected_hist = forest.get_histogram(selection)
	return {'res': selected_hist}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6060)