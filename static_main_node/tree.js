// ************** Generate the tree diagram	 *****************
var margin = {top: 20, right: 10, bottom: 20, left: 10},
	width = 1050 - margin.right - margin.left,
	height = 900 - margin.top - margin.bottom;

var radiusRange = [4, 20],
	linkWidthRange = [0, 20];

var tree = d3.layout.tree()
	.size([height, width]);

var diagonal = d3.svg.diagonal()
	.projection(function(d) { return [d.x, d.y]; });

var radiusScale, linkWidthScale, rectWidthScale;
var rectHeight = 15, rectWidth = 50;
var handleWidth = 2, handleHeight = 20;
var bracketWidth = 6;

var font_size = 12;
var svg1 = d3.select("#svg1")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
  	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svg2 = d3.select("#svg2")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
  	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let colors = ['#6babc1', '#e68882', '#edc867', '#67a879', '#806691',];
var i = 0,
	duration = 750,
	root1,
	root2,
	attrs,
	target_names,
	tot_val;

var folder = "fico";

let stop_colors = ['#e66101', '#f3eeea', '#7b3294', ];
stop_colors = ['#d7191c', '#ffffbf', '#2c7bb6'];

let summary_color = d3.scale.linear()
		.domain([0, .5, 1])
		.range(stop_colors)

function loadData() {
	d3.queue()
		.defer(d3.json, '/data/' + folder + "/test.json")
		.defer(d3.json, '/data/' + folder + "/tree.json")
		.await((err, file1, file2) => {
        if (err) {
            console.log(err);
            return;
        }
        attrs = file1["columns"]
        real_min = file1["real_min"];
        real_max = file1["real_max"];
        treeData = file2["tree"];
        minval = file2["minval"];
        maxval = file2["maxval"];
        target_names = file2["target_names"];
        tot_val = treeData[0].value[0] + treeData[0].value[1];

        radiusScale = d3.scale.pow()
  			.exponent(.5)
        	.range([0, radiusRange[1]])
        	.domain([0, 1]);

        linkWidthScale = d3.scale.linear()
        	.range([1, linkWidthRange[1]])
        	.domain([0, maxval]);

        rectWidthScale = [];
        attrs.forEach((d, i) => {
        	rectWidthScale.push(d3.scale.linear()
        		.range([0, rectWidth])
        		.domain([real_min[i], real_max[i]]));
        });

        generate_tree(treeData, attrs);
	});
}

function update_text(source) {
	// Compute the new tree layout.
	var nodes = tree.nodes(root1).reverse(),
	  links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) { d.y = d.depth * 18 });

	// Update the nodes…
	var node = svg1.selectAll("g.node")
	  .data(nodes, function(d) { 
	  	return d.id || (d.id = ++i); 
	  });

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("g")
	  .attr("class", "node")
	  .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
	  .on("click", click_text);

	nodeEnter.append("circle")
	  .attr("r", 1e-6)
	  .style("fill",  d => summary_color[d['accuracy']]);

	// var feature_name = nodeEnter.append("text")		
	//   // .attr("x", -5)
	//   // .attr("text-anchor", "start")
	//   .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
	//   .style("font-weight", "bold")
	//   .style("fill-opacity", 1e-6);


	// feature_name.append("tspan")
	//   .attr("x", function(d) { return d.children || d._children ? 5 : 13; })
	// 	.attr("dy", "1.8em")
	//   .text(function(d) { 
	//   		if (d.feature >= 0) {
	//   			var str = attrs[d.feature];
	//   			var i = 0, count = 0, last_i =-10;
	//   			while (i < str.length && count < 2) {
	//   				if (str[i]>="A" && str[i]<='Z') {
	//   					if (last_i + 1 < i) {
	//   						count++;
	//   					}
	//   					last_i = i;
	//   				}
	//   				i++;
	//   			}
	//   			return i==str.length ? str : str.substring(0, i-1);
	//   		}
	//    });
	// feature_name.append("tspan")
	//   .attr("x", function(d) { return d.children || d._children ? 5 : 13; })
	// 	.attr("dy", "1em")
	//   .text(function(d) { 
	//   		if (d.feature >= 0) {
	//   			var str = attrs[d.feature];
	//   			var i = 0, count = 0, last_i =-10;
	//   			while (i < str.length && count < 2) {
	//   				if (str[i]>="A" && str[i]<='Z') {	  			
	//   					if (last_i + 1 < i) {
	//   						count++;
	//   					}
	//   					last_i = i;
	//   				}
	//   				i++;
	//   			}
	//   			return i==str.length ? "" : str.substring(i-1);
	//   		}
	//    });

	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
	  .duration(duration)
	  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	nodeUpdate.select("circle")
	  .attr("r", d => {
	  		// return d.children ? radiusRange[0] : radiusScale((d.value[0]+d.value[1])/tot_val)
	  		// return d.children ? radiusRange[0] : 10;
	  		return summary_size(d['support']);
	  })
	  .style("fill", function(d) {
	  	// return d.children ? "#fff" :
	  	// 	(d.value[0] > d.value[1] ? colors[0] : colors[1]);
	  	return summary_color(d['accuracy']);
	  })
	  // .style("fill-opacity", .8)
	  .style("stroke", "none")


	nodeUpdate.select("text")
	  .style("fill-opacity", (d) => d.children ? 1 : 1e-6);

	// Transition exiting nodes to the parent's new position.
	var nodeExit = node.exit().transition()
	  .duration(duration)
	  .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
	  .remove();

	nodeExit.select("circle")
	  .attr("r", 1e-6);

	nodeExit.select("text")
	  .style("fill-opacity", 1e-6);

	// Update the links…
	// links = links.map(l => {
	// 	newObj = Object.assign(l);
	// 	newObj.source = {...l.source}
	// 	var w = rectWidthScale[l.source.feature](l.source.threshold);
	// 	if (newObj.target.sign === "<=") {
	// 		newObj.source.x += linkWidthScale(l.source.value[0] + l.source.value[1] - (l.target.value[0] + l.target.value[1]))/2;
	// 	} else {
	// 		newObj.source.x -= linkWidthScale(l.source.value[0] + l.source.value[1] - (l.target.value[0] + l.target.value[1]))/2;
	// 	}
	// 	// return newObj;
	// 	l.source = {...newObj.source}
	// 	return {...l};
	// })


	var link = svg1.selectAll("path.link")
	  .data(links, function(d) { return d.target.id; });

	// Enter any new links at the parent's previous position.
	link.enter().insert("path", "g")
	  .attr("class", "link")
	  .attr("d", function(d) {
		var o = {x: source.x0, y: source.y0};
		return diagonal({source: o, target: o});
	  })
	  .attr("stroke-width", d => {
	  	return 1;
	  	// return linkWidthScale(d.target.value[0]+d.target.value[1])
	  });


	// Transition links to their new position.
	link.transition()
	  .duration(duration)
	  .attr("d", diagonal);

	// Transition exiting nodes to the parent's new position.
	link.exit().transition()
	  .duration(duration)
	  .attr("d", function(d) {
		var o = {x: source.x, y: source.y};
		return diagonal({source: o, target: o});
	  })
	  .remove();

	 // Update the link text
 //    var linktext = svg1.selectAll("g.link-text")
 //        .data(links, function (d) {
 //        return d.target.id;
 //    });   

 //    linktext.enter()
	//     .insert("g")
	//     .attr("class", "link-text")
	//     .append("text")
	//     .attr("fill", "Black")
	//     .style("font", "normal 12px " + font_family)
	//     .attr("dy", ".35em")
	//     .attr("text-anchor", "middle")
	//     .text(function (d) {
	//     	return d.target.sign + d.source.threshold.toFixed(2);
	// 	});

	// var textUpdate = linktext.transition()
	//   .duration(duration)
	//   .attr("transform", function(d) { 
	//   	var offset = 0;
	//   	// if (d.target.sign === "<=") {
	//   	// 	offset = 5;
	//   	// }
	//   	return "translate(" +
 //            ((d.source.y + d.target.y)/2 - 50) + "," + 
 //            ((d.source.x + d.target.x)/2 + offset) + ")"; });

	// textUpdate.select("text")
	//   .style("fill-opacity", 1);

	// // Transition exiting nodes to the parent's new position.
	// var textExit = linktext.exit().transition()
	//   .duration(duration)
	//   .attr("transform", function(d) { return "translate(" +
 //            ((d.source.y + d.target.y)/2) + "," + 
 //            ((d.source.x + d.target.x)/2) + ")"; })
	//   .remove();

	// textExit.select("text")
	//   .style("fill-opacity", 1e-6);

	// Stash the old positions for transition.
	nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});
}

// Toggle children on click.
function click_text(d) {
  if (d.children) {
	d._children = d.children;
	d.children = null;
  } else {
	d.children = d._children;
	d._children = null;
  }
  update_text(d);
}

let summary_size;

function generate_tree(treeData) {
	root1 = treeData[0];
	root1.x0 = height / 2;
	root1.y0 = 0;

	root2 = treeData[0];
	root2.x0 = height / 2;
	root2.y0 = 0;

  	let min_support = 20 / d3.sum(treeData[0]['value']);
  	summary_size = d3.scale.linear()
		.domain([min_support, 1])
		.range([1, 15]);
	  
	update_text(root1);

	d3.select(self.frameElement).style("height", "500px");
}


function main() {
    loadData();
}

main();