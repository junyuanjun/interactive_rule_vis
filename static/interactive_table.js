let margin = {top: 60, right: 80, bottom: 20, left: 80},
    width = 860 - margin.right - margin.left,
    height,
    // height = 300 - margin.top - margin.bottom
    indent = 40;

let folder = "fico";

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

let svg1 = d3.select("#svg1")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let radiusRange = [4, 20];
let handleWidth = 0.5, 
    handleHeight, 
    handleLedge = 3;
let rectMarginTop = 5, rectMarginBottom = 5, 
    rectMarginH = 10;

let glyphCellWidth = 5, glyphCellHeight = 15;
let rectHeight, rectWidth;
let supportRectWidth = 80;

let widthScale, radiusScale, xScale, yScale, colorScale, supportScale;
let colorBarHeight = 5;
let barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;

let i = 0,
    duration = 750,
    root,
    real_min,
    real_max,
    attrs,
    median,
    target_names;

function loadData() {
    let path = "../" + folder;
    d3.queue()
        .defer(d3.json, path + "/test.json")
        .defer(d3.json, path + "/list.json")
        .defer(d3.json, path + "/support.json")
        .await((err, file1, file2, file3) => {
        if (err) {
            console.log(err);
            return;
        }
        // assign values
        attrs = file1["columns"];
        real_min = file1["real_min"];
        real_max = file1["real_max"];
        median = file1["median"]
        real_5_1 = file1['real_5_1']
        real_5_2 = file1['real_5_2']
        real_5_3 = file1['real_5_3']
        real_5_4 = file1['real_5_4']
        listData = file2["rule_lists"];
        target_names = file2["target_names"];
        support = file3['support'];
        true_support = file3['true_support'];
        false_support = file3['false_support'];
        tot_data = file1['data'].length;

        // adjust width and height
        width = attrs.length * (glyphCellWidth * 5 + rectMarginH * 2);
        height = listData.length * (glyphCellHeight + rectMarginTop + rectMarginBottom) + margin.top + margin.bottom;
        d3.select("#svg1")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom);

        // scale for placing cells
        xScale = d3.scaleBand(d3.range(attrs.length+1),[0, width]);
        yScale = d3.scaleBand(d3.range(listData.length+1), [margin.top, height]);

        // scale for render the support bar
        supportScale = d3.scaleLinear([0, tot_data], [0, supportRectWidth]);

        // scale for filling rule ranges
        // rectHeight = yScale.bandwidth() - rectMarginTop - rectMarginBottom;
        rectHeight = glyphCellHeight;
        // rectWidth = xScale.bandwidth() - rectMarginH * 2;
        handleHeight = rectHeight + handleLedge * 2;
        widthScale = [];
        valueStops = [];
        attrs.forEach((d, i) => {
            widthScale.push(d3.scaleLinear()
                .range([0, rectWidth])
                .domain([real_min[i], real_max[i]]));
        });
        
        attrs.forEach((d, i) => {
            // let step = (real_max[i] - real_min[i]) / 5;
            // let rangeArr = [real_min[i]+step, real_min[i]+step*2, real_min[i]+step*3, real_min[i]+step*4];
            let rangeArr = [real_5_1[i], real_5_2[i], real_5_3[i], real_5_4[i]];
            valueStops.push(rangeArr);
        });

        generate_bar_with_horizontal_line(listData);
    });
}


function render_feature_names_and_grid(svg, id) {
    let column = svg.selectAll(".column").data(attrs)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return `translate(${xScale(i)}, ${yScale(0)-font_size})rotate(330)`; });

    column.append("text")
        .attr("x", 6)
        .attr("y", yScale.bandwidth() / 1.5)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) { return d; });

    // render median line on the top
    if (median !== undefined) {
        let median_line = svg.selectAll(".median_line").data(median)
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
            // median_line.append("text")
            //     .attr("x", rectMarginH)
            //     .attr("y", -10)
            //     .attr("text-anchor", "start")
            //     .style("fill", "grey")
            //     .text((d)=>"median: " + d.toFixed(0));
        }
    }


    // grid
    svg.selectAll(".grid-row")
        .data(yScale.domain())
        .enter().append("g")
        .attr("class", "grid-row")
        .attr("transform", function(d, i) { return `translate(0, ${yScale(i)})`; })
        .append("line")
        .attr("x1", 0)
        .attr("x2", width-xScale.bandwidth())
        .style("stroke", gridColor);

    svg.selectAll(".rule-num")
        .data(yScale.domain().slice(0, yScale.domain().length-1))
        .enter().append("g")
        .attr("class", "rule-num")
        .attr("transform", function(d, i) { return `translate(-10, ${yScale(i)+font_size})`; })
        .append("text")
        .attr("x", 0)
        .text((d, i) => "R"+(i+1))
        .style("text-anchor", "end")
        .style("stroke", "black")
        .style("font-size", "16px")
        .style("stroke-width", "0.5px")
        .append('title')
        .text((d, i)=>{
            let str = "If "
            listData[i]['rules'].forEach((cond) => {
                str += attrs[cond['feature']] + " " + cond['sign'] + " " + cond['threshold'] + " AND ";
            })
            str = str.substring(0, str.length-4) + " THEN " + target_names[listData[i]['label']];
            return str;
        });

    svg.selectAll(".grid-col")
        .data(xScale.domain())
        .enter().append("g")
        .attr("class", "grid-col")
        .attr("transform", function(d, i) { return `translate(${xScale(i)}, ${margin.top})`; })
        .append("line")
        .attr("y1", 0)
        .attr("y2", height-yScale.bandwidth()-margin.top)
        .style("stroke", gridColor);
}

function render_size_circle(svg, listData) {
    let circles = svg.selectAll(".label_circle")
        .data(listData)
        .enter()
        .append("circle")
        .attr("class", "label_circle")
        .attr("cx", xScale(xScale.domain().length-1) + xScale.bandwidth()/2)
        .attr("cy", (d, i) => {
            return yScale(i) + yScale.bandwidth()/2
        })
        // .attr("r", d => radiusScale(d["coverage"]))
        .attr("r", 7)
        .attr("fill", d => conf_colors[d["label"]])
        .attr("stroke", "none")
}

function render_confusion_bars(svg) {
    let res = svg.append('g')
        .attr('class', 'support')
    // suppose we have the confusion matrix for each rule
    // tp, fp, tn, fn, support, confidence
    confusion_mat = [];
    for (let i = 0; i < support.length; i++) {

        res.append('rect')
            .attr('x', xScale(attrs.length) + 10)
            .attr('y', yScale(i))
            .attr('width', supportScale(support[i]))
            .attr('height', rectHeight+rectMarginTop+rectMarginBottom)
            .attr('stroke', 'black')
            .attr('fill', conf_colors[listData[i]['label']]);

        res.append('rect')
            .attr('x', xScale(attrs.length) + 10 + supportScale(true_support[i]))
            .attr('y', yScale(i))
            .attr('width', supportScale(false_support[i]))
            .attr('height', rectHeight+rectMarginTop+rectMarginBottom)
            .attr('stroke', 'black')
            .attr('fill', 'url(#pattern-stripe)')
    }
}

function generate_bar_with_horizontal_line(listData) {
    render_feature_names_and_grid(svg1);

    let row = svg1.selectAll(".row")
        .data(listData)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return `translate(${rectMarginH}, ${yScale(i)+rectMarginTop})`; });

    // render the horizontal_line
    row.selectAll(".middle")
        .data(function(d) { return d["rules"]; })
        .enter().append("line")
        .attr("class", "middle")
        .attr("x1", function(d) { return xScale(d["feature"]) ; })
        .attr("x2", function(d) { return xScale(d["feature"])+ glyphCellWidth * 5; })
        .attr("y1", glyphCellHeight/2)
        .attr("y2", glyphCellHeight/2)
        .style("stroke", "lightgrey")
        .style("stroke-width", 1);

    // render the rule ranges
    row.selectAll(".rule-fill")
        .data(function(d) { 
            let arr = [];
            d['rules'].forEach((rule, i) => {
                let idx = rule['feature'];
                if (rule['sign'] == '<=') {
                    arr.push({'feature': idx, 'coverRange': 0})
                    for (let j = 0; j < valueStops[idx].length; j++) {
                        if (rule['threshold'] > valueStops[idx][j]) {
                            arr.push({'feature': idx, 'coverRange': j});
                        } else break;
                    }
                } else {
                    arr.push({'feature': idx, 'coverRange': valueStops[idx].length})
                    for (let j = valueStops[idx].length-1; j >= 0; j--) {
                        
                        if (rule['threshold'] < valueStops[idx][j]) {
                            arr.push({'feature': idx, 'coverRange': j});
                        } else break;
                    }
                }
            });
            return arr;
        })
        .enter()
        .append("rect")
        .attr("x", (d) => { 
           return  xScale(d['feature']) + d['coverRange'] * glyphCellWidth;
        })
        .attr("width", glyphCellWidth)
        .attr("y",  0)
        .attr("height", glyphCellHeight)
        .attr("fill", (d) => colorDiv5[d['coverRange']])

    render_confusion_bars(svg1)
    // render_size_circle(svg1, listData);
}

function main() {
    loadData();
}

main();