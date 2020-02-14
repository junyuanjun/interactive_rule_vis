let margin = {top: 0, right: 50, bottom: 5, left: 10},
    column_height = 80,
    width = 860 - margin.right - margin.left,
    height,
    // height = 300 - margin.top - margin.bottom
    indent = 40;
let overviewWidth = 250;

let folder = "fico";

height = 650 - margin.top - margin.bottom;

let radiusRange = [4, 20];
let handleWidth = 0.5, 
    handleHeight, 
    handleLedge = 3;
let rectMarginTop = 5, rectMarginBottom = 5, 
    rectMarginH = 10;

let glyphCellWidth = 5, glyphCellHeight = 10;
let rectHeight, rectWidth;
let supportRectWidth = 100;

let tot_train;

let rule_svg = d3.select("#rule_svg")
    .attr("width", width + margin.right)
    .attr("height", height + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left})`);


let column_svg = d3.select("#column_svg")
    .style("height", `${column_height}px`);

let stat_svg = d3.select('#stat')
    .style("width", `${supportRectWidth}px`)
    .style("height", `${height + margin.top + margin.bottom}px`);

let rule_svg2 = d3.select("#rule_svg2")
    .append("g")
    .attr("transform", `translate(${margin.left})`);
let stat_svg2 = d3.select("#stat2")
    .style("width", `${supportRectWidth}px`);
let col_svg2 = d3.select("#column_svg2")
    .style("height", `${column_height}px`);

let widthScale, radiusScale, xScale, yScale, colorScale, supportScale;
let colorBarHeight = 5;
let barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;

let c = document.getElementById("myCanvas");
let ctx = c.getContext("2d");
ctx.font = '10px sans-serif';

let selected_range = [];
let rule_attr_ranges = [];
let rules_to_keep = [];

let param_set = false;

let i = 0,
    duration = 750,
    root,
    listData,
    real_min,
    real_max,
    real_5_1, real_5_2, real_5_3, real_5_4,
    support, true_support, false_support, class_support, tot_data,
    raw_data,
    attrs,
    median,
    node_info,
    max_depth,
    target_names;

let present_rules;

let RULE_MODE = GRADIENT_RULE_VIS;

let added_filters = [];

function loadData() {
    let path = "/data/" + folder;

    fetch(domain + "initialize/" + folder);

    d3.queue()
        .defer(d3.json, path + "/test.json")
        .defer(d3.json, path + "/list.json")
        .defer(d3.json, path + "/support.json")
        .defer(d3.json, path + "/node_info.json")
        .await((err, file1, file2, file3, file4) => {
            if (err) {
                console.log(err);
                return;
            }
            // assign values
            attrs = file1["columns"];
            raw_data = file1["data"];
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
            class_support = file3['class_support'];
            tot_data = file1['data'].length;
            node_info = file4['node_info_arr'];
            max_depth = file4['max_depth'];
            tot_train = node_info[0]['value'][0] + node_info[0]['value'][1];

            present_rules = listData;
            summary_nodes = filter_nodes(node_info);

            // adjust width and height
            if (RULE_MODE === MEDIAN_VAL_VIS) {
                glyphCellWidth *= 2;
                rectMarginH = 1;
                rectMarginBottom = 1;
                rectMarginTop = 1;

                width = attrs.length * (glyphCellWidth + rectMarginH);
            } else {
                width = attrs.length * (glyphCellWidth * 5 + rectMarginH * 2);
            }

            height = listData.length * (glyphCellHeight + rectMarginTop + rectMarginBottom) + margin.top + margin.bottom;

            scroll_functions(width, height);
            scroll_functions2(width, height);


            // scale for placing cells
            xScale = d3.scaleBand(d3.range(attrs.length+1),[0, width]);
            yScale = d3.scaleBand(d3.range(listData.length+1), [margin.top, height]);

            // scale for render the support bar
            supportScale = d3.scaleLinear([0, d3.sum(node_info[0]['value'])], [.5, supportRectWidth]);

            // scale for filling rule ranges
            // rectHeight = yScale.bandwidth() - rectMarginTop - rectMarginBottom;
            rectHeight = glyphCellHeight;
            rectWidth = glyphCellWidth * 5;
            handleHeight = rectHeight + handleLedge * 2;
            widthScale = [];
            colorScale = [];
            valueStops = [];

            attrs.forEach((d, i) => {
                widthScale.push(d3.scaleLinear()
                    .range([0, rectWidth])
                    .domain([real_min[i], real_max[i]]));

                colorScale.push(d3.scaleLinear()
                    .domain([real_min[i], (real_min[i]+real_max[i])/2, real_max[i]])
                    .range([d3.lab("#91bfdb"),d3.lab("#ffffbf"),d3.lab("#fc8d59")])
                    .interpolate(d3.interpolateLab));
            });


            attrs.forEach((d, i) => {
                // let step = (real_max[i] - real_min[i]) / 5;
                // let rangeArr = [real_min[i]+step, real_min[i]+step*2, real_min[i]+step*3, real_min[i]+step*4];
                let rangeArr = [real_5_1[i], real_5_2[i], real_5_3[i], real_5_4[i]];
                valueStops.push(rangeArr);
            });


            render_slider();

            d3.select("#rule-num")
                .text(listData.length);

            let col_order = column_order_by_feat_freq(listData);

            switch (RULE_MODE) {
                case BAND_RULE_VIS:
                    generate_band_bars(listData);
                    break;
                case GRADIENT_RULE_VIS:
                    generate_gradient_bars(listData, col_order);
                    break;
                case MEDIAN_VAL_VIS:
                    generate_value_cells(listData);
                    break;
            }

            render_legend_label("#legend1");
            find_leaf_rules(summary_nodes, node_info, listData);
            render_summary(summary_nodes, max_depth);
    });
}

function scroll_functions(width, height) {
    d3.select("#rule_div div")
        .style("height", `${height + margin.bottom}px`)
        .style("width", `${margin.left + width + margin.right}px`);

    d3.select("#rule_svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom);

    d3.select("#column_div div")
        .style("width", `${margin.left + width + margin.right}px`);

    d3.select("#column_svg")
        .style("width", `${margin.left + width + margin.right}px`);

    d3.select("#stat_div div")
        .style("height", `${height + margin.bottom}px`);

    d3.select("#stat")
        .attr("height", height + margin.bottom);

    d3.select('#rule_div').on('scroll', function () {
        document.getElementById('column_div').scrollLeft = this.scrollLeft;
        document.getElementById('stat_div').scrollTop = this.scrollTop;
    });

    d3.select('#column_div').on('scroll', function () {
        document.getElementById('rule_div').scrollLeft = this.scrollLeft;
    });

    d3.select('#stat_div').on('scroll', function () {
        document.getElementById('rule_div').scrollTop = this.scrollTop;
    });
}

function scroll_functions2(width, height) {
    d3.select("#rule_div2 div")
        .style("height", `${height + margin.bottom}px`)
        .style("width", `${margin.left + width + margin.right}px`);

    d3.select("#rule_svg2")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom);

    d3.select("#column_div2 div")
        .style("width", `${margin.left + width + margin.right}px`);

    d3.select("#column_svg2")
        .style("width", `${margin.left + width + margin.right}px`);

    d3.select("#stat_div2 div")
        .style("height", `${height + margin.bottom}px`);

    d3.select("#stat2")
        .attr("height", height + margin.bottom);

    d3.select('#rule_div2').on('scroll', function () {
        document.getElementById('column_div2').scrollLeft = this.scrollLeft;
        document.getElementById('stat_div2').scrollTop = this.scrollTop;
    });

    d3.select('#column_div').on('scroll', function () {
        document.getElementById('rule_div').scrollLeft = this.scrollLeft;
    });

    d3.select('#stat_div').on('scroll', function () {
        document.getElementById('rule_div').scrollTop = this.scrollTop;
    });
}

function render_feature_names_and_grid(column_svg, col_order) {
    column_svg.selectAll(".column").remove();

    let column = column_svg.selectAll(".column").data(attrs)
        .enter().append("g")
        .classed("column", true)
        .classed((d, i) => `col-title-${i}`, true)
        .attr("transform", function(d, i) { 
            return `translate(${xScale(col_order[i])}, 
            ${column_height+yScale(0)-font_size*2})rotate(330)`; });

    column.append("text")
        .attr("x", 6)
        .attr("y", yScale.bandwidth() / 1.5 - 5)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text((d) => {
            let textLength = ctx.measureText(d).width;
            let text = d;
            let txt = d;
            while (textLength > column_height * 2 - 50) {
                text = text.slice(0, -1);
                textLength = ctx.measureText(text+'...').width;
                txt = text+'...';
            }
            return txt;
        })
        .append('title')
        .text(d => d);

    // grid
    // rule_svg.selectAll(".grid-row")
    //     .data(yScale.domain())
    //     .enter().append("g")
    //     .attr("class", "grid-row")
    //     .attr("transform", function(d, i) { return `translate(0, ${yScale(i)})`; })
    //     .append("line")
    //     .attr("x1", 0)
    //     .attr("x2", width-xScale.bandwidth())
    //     .style("stroke", gridColor);

    // rule_svg.selectAll(".grid-col")
    //     .data(xScale.domain())
    //     .enter().append("g")
    //     .attr("class", "grid-col")
    //     .attr("transform", function(d, i) { return `translate(${xScale(i)}, ${margin.top})`; })
    //     .append("line")
    //     .attr("y1", 0)
    //     .attr("y2", height-yScale.bandwidth()-margin.top)
    //     .style("stroke", gridColor);
}

function render_slider() {
    let slider_accuracy = d3
        .sliderHorizontal()
        .min(0)
        .max(100)
        .step(1)
        .width(overviewWidth)
        .default([0, 100])
        .fill('#2196f3')
        // .fill('url(#summary-linear-gradient)')
        .on('drag', val => {
            // change the text
            d3.select('#accuracy-text').text(`Accuracy: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['accuracy'] = [+val[0]/100, +val[1]/100];
            new_nodes = filter_nodes(node_info,);
            update_summary(new_nodes);

        })
        .on('end', val => {
            // change the text
            d3.select('#accuracy-text').text(`Accuracy: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['accuracy'] = [+val[0]/100, +val[1]/100];
            update_rules();
        })
 
    d3.select('#slider-accuracy')
        .append('svg')
        .attr('width', overviewWidth*1.2)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_accuracy);

    filter_threshold['num_feat'] = attrs.length;
    let slider_feat = d3
        .sliderHorizontal()
        .min(0)
        .max(attrs.length)
        .step(1)
        .width(overviewWidth)
        .default(attrs.length)
        .fill('#2196f3')
        .on('drag', val => {
            // change the text
            d3.select('#feat-text').text(`Max Number of Features: ${val}`);
            // filter the nodes
            filter_threshold['num_feat'] = +val;
            // depth is used when num_feat is not defined
            filter_threshold['depth'] = +val;
            new_nodes = filter_nodes(node_info,);
            update_summary(new_nodes);
        })
        .on('end', val => {
            // change the text
            d3.select('#feat-text').text(`Max Number of Features: ${val}`);
            // filter the nodes
            filter_threshold['num_feat'] = +val;
            // depth is used when num_feat is not defined
            filter_threshold['depth'] = +val;
            update_rules();
        });
 
    d3.select('#slider-feat')
        .append('svg')
        .attr('width', overviewWidth*1.2)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_feat);
}

function update_rules() {
    console.log("update");

    new_nodes = filter_nodes(node_info);
    find_leaf_rules(new_nodes, node_info, listData);   
    update_summary(new_nodes);
}

function prune_nodes() {
    let support_val, fidelity_val, number_val; 
    d3.select('#support_val')
        .attr('value', function() {
            support_val = this.value;
            return this.value;
        });
    d3.select('#fidelity_val')
        .attr('value', function() {
            fidelity_val = this.value;
            return this.value;
        });
    d3.select('#number_val')
        .attr('value', function() {
            number_val = this.value;
            return this.value;
        });
    support_val = parseFloat(support_val);
    fidelity_val = parseFloat(fidelity_val);
    number_val = parseInt(number_val);

    filter_threshold['support'] = [support_val/100, 1];
    filter_threshold['fidelity'] = [fidelity_val/100, 1];
    // TODO: add threshold for number_val

    // re-render rules
    new_nodes = filter_nodes(node_info,);
    update_summary(new_nodes);
    let rules = find_leaf_rules(new_nodes, node_info, listData);
}

function render_size_circle(listData) {
    stat_svg.selectAll(".label_circle").remove();
    height = listData.length * (glyphCellHeight + rectMarginTop + rectMarginBottom) + margin.top + margin.bottom;
    stat_svg.attr("height", height + margin.top + margin.bottom);


    let circles = stat_svg.selectAll(".label_circle")
        .data(listData)
        .enter()
        .append("circle")
        .attr("class", "label_circle")
        .attr("cx", xScale.bandwidth()/2)
        .attr("cy", (d, i) => {
            return yScale(i) + yScale.bandwidth()/2
        })
        // .attr("r", d => radiusScale(d["coverage"]))
        .attr("r", 7)
        .attr("fill", d => colorCate[d["label"]])
        .attr("stroke", "none")
}

function render_confusion_bars(stat_svg, listData, customized_y) {
    let yScale = d3.scaleBand(d3.range(listData.length+1), [margin.top, height]);
    stat_svg.selectAll('.support').remove();

    stat_svg.style('height', `${height}px`)

    let res = stat_svg.selectAll('g')
        .data(listData)
        .enter()
        .append('g')
        .attr('class', 'support')

    let circles = res.append("circle")
        .attr("class", "label_circle")
        .attr("cx", xScale.bandwidth()/2)
        .attr("cy", (d, i) => {
            return yScale(i) + yScale.bandwidth()/2
        })
        // .attr("r", d => radiusScale(d["coverage"]))
        .attr("r", 7)
        .attr("fill", d => colorCate[d["label"]])
        .attr("stroke", "none");
    
    res.append('text')
        .attr('x', xScale.bandwidth()/2+1)
        .attr('y', (d, i) => {
            return yScale(i) + yScale.bandwidth()/2 + 2
        })
        .style('font-size', '8px')
        .style('fill', 'white')
        .style('text-anchor', 'middle')
        .text((d,i) => 
            d3.format('0d')(d3.sum(node_info[d['node_id']]['value'])/tot_train*100)+'%')

    // covered instances of label 0
    res.append("rect")
        .attr("class", "label0")
        .attr("x", 10 + xScale.bandwidth()/2)
        .attr("y", (d, i) => {
            return yScale(i) + yScale.bandwidth()/4
        })
        .attr("width", d => supportScale(node_info[d['node_id']]['value'][0]))
        .attr("height", glyphCellHeight)
        .attr("fill", d => colorCate[0])
        .append('title')
            .text(d => node_info[d['node_id']]['value'][0])

    res.append('text')
        .attr('class', 'label0-text')
        .attr("x", 10 + xScale.bandwidth()/2)
        .attr("y", (d, i) => {
            return yScale(i) + rectMarginTop + glyphCellHeight /2 +2;
        })
        .style('fill', 'white')
        .text(d => node_info[d['node_id']]['value'][0] > 600 ? node_info[d['node_id']]['value'][0] : "")

    // covered instances of label 1
    res.append("rect")
        .attr("class", "label1")
        .attr("x", d => 10 + xScale.bandwidth()/2 + supportScale(node_info[d['node_id']]['value'][0]))
        .attr("y", (d, i) => {
            return yScale(i) + yScale.bandwidth()/4
        })
        .attr("width", d => supportScale(node_info[d['node_id']]['value'][1]))
        .attr("height", glyphCellHeight)
        .attr("fill", d => colorCate[1])
        .append('title')
        .text(d => node_info[d['node_id']]['value'][1])

    res.append('text')
        .attr('class', 'label1-text')
        .attr("x", d => 10 + xScale.bandwidth()/2 + supportScale(node_info[d['node_id']]['value'][0]))
        .attr("y", (d, i) => {
            return yScale(i) + rectMarginTop + glyphCellHeight /2 +2;
        })
        .style('fill', 'white')
        .text(d => node_info[d['node_id']]['value'][1] > 600 ? node_info[d['node_id']]['value'][1] : "")
}


function generate_gradient_bars(listData) {
    render_feature_names_and_grid(column_svg, col_order);

    // prepare ranges for rendering
    let filtered_data = {};
    listData.forEach((d) => {
        d['rules'].forEach((rule, row_idx) => {
            let left, right;
            if (rule['sign'] == 'range') {
                left = rule['threshold0'];
                right = rule['threshold1'];
            } else if (rule['sign'] == '<=') {
                left = real_min[rule['feature']];
                right = rule['threshold'];
            } else if (rule['sign'] == '>') {
                left = rule['threshold'];
                right = real_max[rule['feature']];
            } else {
                console.log('invalid rule');
            }
            left = left.toFixed(1);
            right = right.toFixed(1);
            let id = `range-${rule['feature']}-${left}-${right}`
            id = id.replace(/\./g, '_');

            let currentObj = filtered_data[id] || {
                'id': id,
                'row': row_idx,
                'feature': rule['feature'],
                'start': left,
                'end': right,
            }
            filtered_data[id] = currentObj;

            rule['id'] = id; 
        })
    });
    filtered_data = Object.keys(filtered_data).map((d) => filtered_data[d]);

    // define linear gradients
    let linear_gradient = rule_svg.append('defs')
        .selectAll('.linear_gradient')
        .data(filtered_data).enter()
        .append('linearGradient')
      .attr('class','linear_gradient')
      .attr('id', function(d) {
        return "linear-gradient-" + d.id;
      })
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    linear_gradient.append('stop')
      .attr('class','linear_gradient_start')
      .attr('offset', '0%')
      .attr('stop-color', function(d){
        return colorScale[d.feature]( +d.start );
      });

    linear_gradient.append('stop')
      .attr('class','linear_gradient_end')
      .attr('offset', '100%')
      .attr('stop-color', function(d){
        return colorScale[d.feature]( +d.end );
      });
}

function update_column_rendering(svg, col_order) {
    for (let i = 0; i<attrs.length; i++) {
        svg.select(`.col-title-${i}`)
            .attr("transform", ()=> { 
                return `translate(${xScale(col_order[i])}, 
                ${column_height+yScale(0)-font_size*2})rotate(330)`; 
            });    
    }
}

function update_rule_rendering(listData, col_order, row_order) {
    // remove the column lines and the outdated rules
    rule_svg.selectAll(".grid-col").remove();
    rule_svg.selectAll(".grid-row").remove();
    rule_svg.selectAll(".column").remove();
    rule_svg.selectAll(".row").remove();

    // re-render column lines
    height = listData.length * (glyphCellHeight + rectMarginTop + rectMarginBottom) + margin.top + margin.bottom;
    d3.select("#rule_svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom);

    d3.select("#rule_div div")
        .style("height", `${height + margin.bottom}px`)

    d3.select("#rule_svg")
        .attr("height", height + margin.bottom);

    d3.select("#stat_div div")
        .style("height", `${height + margin.bottom}px`);

    // scale for placing cells
    yScale = d3.scaleBand(d3.range(listData.length+1), [margin.top, height]);
    d3.select("#rule-num")
        .text(listData.length);
    render_feature_names_and_grid(column_svg, col_order);

    // render by rows
    let row = rule_svg.selectAll(".row")
        .data(listData)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return `translate(${rectMarginH}, ${yScale(i)+rectMarginTop})`; })
        .on('click', (d, i) => {
            click_rule(i);
        })

    // render the white background for better click react
    row.append('rect')
        .attr('id', (d, i) => `back-rect-${i}`)
        .attr('x', -rectMarginH)
        .attr('y', -rectMarginTop)
        .attr('height', `${glyphCellHeight + rectMarginTop + rectMarginBottom}px`)
        .attr('width', `${width-margin.left}px`)
        .attr('fill', 'white');

    // render the horizontal_line
    row.selectAll(".middle")
        .data(function(d, i) { 
            if (row_order !== undefined) {
                return listData[row_order[i]]['rules'];
            } else {
                return d["rules"]; 
            }
        })
        .enter().append("line")
        .attr("class", "middle")
        .attr("x1", function(d) { 
            return xScale(col_order[d["feature"]]) ; 
        })
        .attr("x2", function(d) { 
            return xScale(col_order[d["feature"]])+ glyphCellWidth * 5; 
        })
        .attr("y1", glyphCellHeight/2)
        .attr("y2", glyphCellHeight/2)
        .style("stroke", "lightgrey")
        .style("stroke-width", 1);

    // render the rule ranges
    row.selectAll(".rule-fill")
        .data(d => d["rules"])
        .enter().append("rect")
        .attr("x", function(d) { 
            let xoffset = xScale(col_order[d["feature"]])
            if (d["sign"] === "<=") {
                return xoffset;
            } else if (d["sign"] === ">") {
                return xoffset + widthScale[d["feature"]](d["threshold"])
            } else {
                return xoffset + widthScale[d["feature"]](d["threshold0"])
            }
        })
        .attr("width", function(d) {
            if (d["sign"] === "<=") {
                return widthScale[d["feature"]](d["threshold"]);
            } else if (d["sign"] === ">"){
                return rectWidth - widthScale[d["feature"]](d["threshold"]);
            } else if (d["sign"] === "range") {
                return (widthScale[d["feature"]](d["threshold1"]-d["threshold0"]))
            }
        })
        .attr("y",  0)
        .attr("height", glyphCellHeight)
        .attr("fill", rule => {
            let left, right;
            if (rule['sign'] == 'range') {
                left = rule['threshold0'];
                right = rule['threshold1'];
            } else if (rule['sign'] == '<=') {
                left = real_min[rule['feature']];
                right = rule['threshold'];
            } else if (rule['sign'] == '>') {
                left = rule['threshold'];
                right = real_max[rule['feature']];
            } else {
                console.log('invalid rule');
            }
            left = left.toFixed(1);
            right = right.toFixed(1);
            let id = `range-${rule['feature']}-${left}-${right}`
            id = id.replace(/\./g, '_');
            return `url(#linear-gradient-${id})`
        })

    // grid
    rule_svg.selectAll(".grid-row")
        .data(yScale.domain())
        .enter().append("g")
        .attr("class", "grid-row")
        .attr("transform", function(d, i) { return `translate(0, ${yScale(i)})`; })
        .append("line")
        .attr("x1", 0)
        .attr("x2", width-xScale.bandwidth())
        .style("stroke", gridColor);

    rule_svg.selectAll(".grid-col")
        .data(xScale.domain())
        .enter().append("g")
        .attr("class", "grid-col")
        .attr("transform", function(d, i) { return `translate(${xScale(i)}, ${margin.top})`; })
        .append("line")
        .attr("y1", 0)
        .attr("y2", height-yScale.bandwidth()-margin.top)
        .style("stroke", gridColor);
    // render_size_circle(listData);
    render_confusion_bars(stat_svg, listData);
}

function render_data_table() {
    let table = d3.select('#datatable')
        .append('table');
}

function main() {
    loadData();
    param_set = true;
}

main();