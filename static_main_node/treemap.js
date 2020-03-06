const margin = {top: 10, right: 10, bottom: 10, left: 10},
	width = 300 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom,
      color = d3.scaleOrdinal()
      	.domain(['tp', 'fp', 'tn', 'fn'])
      	.range(d3.schemeCategory20);
var svg = d3.select("body").append("svg")
var chartLayer = svg.append("g").classed("chartLayer", true)
    

const div = d3.select("body").append("div")
    .style("position", "relative")
    .style("width", (width + margin.left + margin.right) + "px")
    .style("height", (height + margin.top + margin.bottom) + "px")
    .style("left", margin.left + "px")
    .style("top", margin.top + "px");

data = [
  {"id": "tot",},
  {"id": "tot.tp", "support": 20},
  {"id": 'tot.fp', 'support': 50},
  {"id": 'tot.fn', 'support': 50},
  {"id": "tot.tn", "support": 80},
];

var treemap = d3.treemap()
            .size([width, height]); 

var stratify = d3.stratify()
            .parentId(function(d) {return d.id.substring(0, d.id.lastIndexOf(".")); });
        
root = stratify(data).sum(function(d) { return d.support })
treemap(root);

//data bind
var node = chartLayer
    .selectAll(".node")
    .data(root.leaves(), function(d){ return d.id })

node
    .selectAll("rect")
    .data(root.leaves(), function(d){ return d.id })        

node
    .selectAll("text")
    .data(root.leaves(), function(d){ return d.id })        

// enter                  
var newNode = node.enter()
    .append("g")
    .attr("class", "node")
    
newNode.append("rect")
newNode.append("text")

  
// update   
chartLayer
    .selectAll(".node rect")
    .transition()
    .delay(function(d,i){ return i * 100 })
    .duration(2000)
    .attr("x", function(d) { return d.x0 })
    .attr("y", function(d) { return d.y0  })
    .attr("width", function(d) { return d.x1 - d.x0 })
    .attr("height", function(d) { return d.y1 - d.y0})
    .attr("fill", function(d) { while (d.depth > 1) d = d.parent; return color(d.id); })
    
chartLayer
    .selectAll(".node text")    
    .transition()
    .delay(function(d,i){ return i * 100 })
    .duration(2000)
    .text(function(d,i){return  d.id })
    .attr("y", "1.5em")
    .attr("x", "0.5em")
    .attr("font-size", "1.0em")
    .attr("transform", function(d){ return "translate("+[d.x0, d.y0]+")" })
