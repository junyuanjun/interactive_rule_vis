from forest_info import Forest
import json
import os
from flask import Flask
from flask_cors import CORS
from flask import request
from flask import send_from_directory

app = Flask(__name__, static_folder="../static", template_folder="../static")
CORS(app)

forest = Forest()

@app.route("/index.html")
def index():
	print("return index.html")
	return send_from_directory('../static/', 'interactive_rule_table.html')

@app.route('/static/<path:path>')
def send_static(path):
	print("return file at: "+path)
	return send_from_directory('../static', path)

@app.route('/data/<path:path>')
def send_data(path):
	print("return data: "+path)
	return send_from_directory('../data', path)

@app.route("/initialize/<dataname>")
def initialize(dataname):
	print("start initialization")
	folder = "../data/" + dataname + "/"
	node_info = []
	real_min = []
	real_max = []
	with open(folder + 'node_info.json', 'r') as json_input:
		node_info = json.load(json_input)['node_info_arr']
	with open(folder + 'test.json', 'r') as json_input:
		data = json.load(json_input)
		real_min = data['real_min']
		real_max = data['real_max']

	forest.initialize(node_info, real_min, real_max)
	print("====initialized====")
	return "initialized"

@app.route("/find_leaf_rules", methods=['POST'])
def find_leaf_rules():
	print("===== FIND LEAF RULES =====")
	print("content type: ",  request.content_type)
	new_node_ids = json.loads(str(request.get_json(force=True)))
	leaf_rules = forest.find_leaf_rules(new_node_ids)
	return {'rule_lists': leaf_rules}

@app.route("/find_linked_rules/<node_id>")
def find_linked_rules(node_id):
	print("===== FIND LINKED RULES =====")
	ranked_rules = forest.find_linked_rules(node_id)
	return {'rule_lists': ranked_rules}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6060)