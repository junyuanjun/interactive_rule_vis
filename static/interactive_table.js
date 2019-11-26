var margin = {top: 60, right: 80, bottom: 20, left: 80},
    width = 860 - margin.right - margin.left,
    height,
    // height = 300 - margin.top - margin.bottom
    indent = 40;

var folder = "fico";

if (folder == "fico" || folder == 'alien') {
    height = 650 - margin.top - margin.bottom
} else if (folder == "fico_tree_rule"){
    height = 300 - margin.top - margin.bottom
} else if (folder == "fico_train") {
    height = 345 - margin.top - margin.bottom
} else {
    height = 650 - margin.top - margin.bottom
    width = 1100 - margin.right - margin.left
}


var radiusRange = [4, 20];
var handleWidth = 0.5, 
    handleHeight, 
    handleLedge = 3;
var rectMarginTop = 5, rectMarginBottom = 10, 
    rectMarginH = 20;
var rectHeight, rectWidth;

var colorSeq4 = ['#ffffcc', '#a1dab4', '#41b6c4', '#225ea8'];
var widthScale, radiusScale, xScale, yScale, colorScale;
var colorBarHeight = 5;
var barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;

var svg1 = d3.select("#svg1")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svg2 = d3.select("#svg2")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top );

var i = 0,
    duration = 750,
    root,
    real_min,
    real_max,
    attrs,
    median,
    target_names;

function loadData() {
    var path = "../" + folder;
    d3.queue()
        .defer(d3.json, path + "/test.json")
        .defer(d3.json, path + "/list.json")
        .await((err, file1, file2) => {
        if (err) {
            console.log(err);
            return;
        }
        attrs = file1["columns"];
        real_min = file1["real_min"];
        real_max = file1["real_max"];
        median = file1["median"]
        listData = file2["rule_lists"];
        target_names = file2["target_names"];

        // scale for placing cells
        xScale = d3.scale.ordinal()
            .domain(d3.range(attrs.length+1))
            .rangeBands([0, width]);

        yScale = d3.scale.ordinal()
            .domain(d3.range(listData.length+1))
            .rangeBands([margin.top, height]);

        // scale for rendering size circles
        radiusScale = d3.scale.pow()
            .exponent(.5)
            .range([0, radiusRange[1]])
            .domain([0, 1]);

        // scale for filling rule ranges
        rectHeight = yScale.rangeBand() - rectMarginTop - rectMarginBottom;
        rectWidth = xScale.rangeBand() - rectMarginH * 2;
        handleHeight = rectHeight + handleLedge * 2;
        widthScale = [];
        colorScale = [];
        attrs.forEach((d, i) => {
            widthScale.push(d3.scale.linear()
                .range([0, rectWidth])
                .domain([real_min[i], real_max[i]]));
        });

        generate_bar_with_horizontal_line(listData);
    });
}


function render_feature_names_and_grid(svg, id) {
    var column = svg.selectAll(".column").data(attrs)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return "translate(" + xScale(i) + ")rotate(345)"; });

    column.append("text")
        .attr("x", 6)
        .attr("y", yScale.rangeBand() / 1.5)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) { return d; });

    // render median line on the top
    if (median !== undefined) {
        var median_line = svg.selectAll(".median_line").data(median)
            .enter().append("g")
            .attr("class", "median_line")
            .attr("transform", function(d, i) { return "translate(" + xScale(i) + ","+ margin.top + ")"; });

        if (id==6) {
            median_line.append("line")
                .attr("x1", rectMarginH)
                .attr("x2", rectMarginH + rectWidth)
                .attr("y1", -10)
                .attr("y2", -10)
                .style("fill", "grey")
                .style("stroke", "grey")
                .style("stroke-width", 1);

            median_line.append("circle")
                .attr("cx", function(d,i) { return rectMarginH+widthScale[i](d); })
                .attr("cy", -10)
                .attr("r", 2)
                .style("stroke", "none")
                .style("fill", "dimgrey");

            font_size = 12;
            font = font_size + "px " + font_family;
            median_line.append("text")
                .attr("x", function(d,i) { return rectMarginH+widthScale[i](d); })
                .attr("y", -16)
                .attr("text-anchor", "middle")
                .style("font", font)
                .text((d)=>d.toFixed(0))
        } else {
            median_line.append("text")
                .attr("x", rectMarginH)
                .attr("y", -10)
                .attr("text-anchor", "start")
                .style("fill", "grey")
                .text((d)=>"median: " + d.toFixed(0));
        }
    }


    // grid
    svg.selectAll(".grid-row")
        .data(yScale.domain())
        .enter().append("g")
        .attr("class", "grid-row")
        .attr("transform", function(d, i) { return "translate(0," + yScale(i) + ")"; })
        .append("line")
        .attr("x1", 0)
        .attr("x2", width-xScale.rangeBand())
        .style("stroke", gridColor);

    svg.selectAll(".rule-num")
        .data(yScale.domain().slice(0, yScale.domain().length-1))
        .enter().append("g")
        .attr("class", "rule-num")
        .attr("transform", function(d, i) { return "translate(-10," + (yScale(i)+rectMarginH+rectHeight/2) + ")"; })
        .append("text")
        .attr("x", 0)
        .text((d, i) => "R"+(i+1))
        .style("text-anchor", "end")
        .style("stroke", "black")
        .style("font-size", "16px")
        .style("stroke-width", "0.5px");

    svg.selectAll(".grid-col")
        .data(xScale.domain())
        .enter().append("g")
        .attr("class", "grid-col")
        .attr("transform", function(d, i) { return "translate(" + xScale(i)+","+ margin.top + ")"; })
        .append("line")
        .attr("y1", 0)
        .attr("y2", height-yScale.rangeBand()-margin.top)
        .style("stroke", gridColor);
}

function render_size_circle(svg, listData) {
    var circles = svg.selectAll(".label_circle")
        .data(listData)
        .enter()
        .append("circle")
        .attr("class", "label_circle")
        .attr("cx", xScale(xScale.domain().length-1) + xScale.rangeBand()/2)
        .attr("cy", (d, i) => {
            return yScale(i) + yScale.rangeBand()/2
        })
        // .attr("r", d => radiusScale(d["coverage"]))
        .attr("r", 10)
        .attr("fill", d => colors[d["label"]])
        .attr("stroke", "none")
}

function generate_bar_with_horizontal_line(listData) {
    render_feature_names_and_grid(svg1, 6);

    var row = svg1.selectAll(".row")
        .data(listData)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + (yScale(i) + rectMarginTop + 2) + ")"; });

    // render the horizontal line in the middle
    // var barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;
    // row.selectAll(".middle")
    //     .data(function(d) { return d["rules"]; })
    //     .enter().append("line")
    //     .attr("class", "middle")
    //     .attr("x1", function(d) { return xScale(d["feature"]) + rectMarginH; })
    //     .attr("x2", function(d) { return xScale(d["feature"]) + rectMarginH + rectWidth; })
    //     .attr("y1", barHeight + rectMarginTop)
    //     .attr("y2", barHeight + rectMarginTop)
    //     .style("stroke", "grey")
    //     .style("stroke-width", 1);

    // render background
    row.selectAll('.rule-background')
        .data(function(d) { return d["rules"]; })
        .enter().append("rect")
        .attr("class", ".rule-background")
        .attr("x", 0)
        .attr("y", rectMarginTop)
        .attr("transform", function(d) { 
            return `translate(${xScale(d["feature"]) + rectMarginH}, 0)`; 
        })
        .attr("width", rectWidth)
        .attr("height", rectHeight - rectMarginTop - rectMarginBottom)
        .attr("fill", "url(#seq4band)");

    // render the rule ranges
    row.selectAll(".rule-fill")
        .data(function(d) { 
            var obj = d["rules"];
            obj.forEach((rule) => {
                rule["label"] = d["label"];
            })
            return obj; 
        })
        .enter()
        .append("rect")
        .attr("x", function(d) { 
            if (d["sign"] === ">") {
                return xScale(d["feature"]) + rectMarginH;
            } else if (d["sign"] === "<=") {
                return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold"])
            } else {
                return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold0"])
            }
        })
        .attr("width", function(d) {
            if (d["sign"] === ">") {
                return widthScale[d["feature"]](d["threshold"]);
            } else if (d["sign"] === "<="){
                return rectWidth - widthScale[d["feature"]](d["threshold"]);
            } else if (d["sign"] === "range") {
                return (widthScale[d["feature"]](d["threshold1"]) - widthScale[d["feature"]](d["threshold0"]))
            }
        })
        .attr("y",  rectMarginTop)
        .attr("height", rectHeight - rectMarginTop - rectMarginBottom)
        .attr("fill", "white")
        // .attr("fill", "#484848")
        .attr("stroke", "white");


    font_size = 12;
    font = font_size + "px " + font_family;
    var threshold = row.selectAll(".threshold")
        .data((d) => d["rules"])
        .enter().append("text")
        .attr("class", "threshold")
        .attr("text-anchor", "middle")
        .attr("dy", rectHeight )
        .attr("fill", "Black")
        .style("font", font);

    threshold.append("tspan")
        .attr("x", (d) => {
            // return d["sign"]==="<=" || d["sign"]===">" ?
            // xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold"])
            // : xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold0"]) - 10
            switch (d["sign"]) {
                case ">":
                    return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold"]);
                case "<=":
                    return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](real_min[d["feature"]]);
                case "range":
                    return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold0"]);
            }
        })
        // .attr("y", rectHeight + font_size + 2)
        .style("text-anchor", "end")
        // .text(d => d["sign"]==="<=" || d["sign"]===">" ? d["threshold"].toFixed(0) : d["threshold0"].toFixed(0));
        .text(d=>{
            switch (d["sign"]) {
                case ">":
                    return d["threshold"].toFixed(0);
                // case "<=":
                //     return real_min[d["feature"]];
                case "range":
                    return d["threshold0"].toFixed(0);
            }
        })

    threshold.append("tspan")
        .attr("x", (d) => {
            // return d["sign"]==="range" ? xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold1"]) + 10 : 0
            switch (d["sign"]) {
                case "<=":
                    return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold"]);
                case ">":
                    return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](real_max[d["feature"]]);
                case "range":
                    return xScale(d["feature"]) + rectMarginH + widthScale[d["feature"]](d["threshold1"]);
            }
        })
        // .attr("y", rectHeight + font_size + 2)
        .style("text-anchor", "start")
        // .text(d => d["sign"]==="range" ? d["threshold1"].toFixed(0) : "");
        .text(d=>{
            switch (d["sign"]) {
                case "<=":
                    return d["threshold"].toFixed(0);
                // case ">":
                //     return real_max[d["feature"]];
                case "range":
                    return d["threshold1"].toFixed(0);
            }
        })

    render_size_circle(svg1, listData);
}

function main() {
    loadData();
}

main();