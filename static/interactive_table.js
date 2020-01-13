let margin = {top: 60, right: 5, bottom: 20, left: 10},
    width = 860 - margin.right - margin.left,
    height,
    // height = 300 - margin.top - margin.bottom
    indent = 40;

let folder = "fico";

height = 650 - margin.top - margin.bottom


let svg1 = d3.select("#svg1")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
let stat_svg = d3.select('#stat')
    .attr("width", 80)
    .attr("height", height + margin.top + margin.bottom)
    // .append("g")
    // .attr("transform", `translate(0, ${margin.top})`);

let radiusRange = [4, 20];
let handleWidth = 0.5, 
    handleHeight, 
    handleLedge = 3;
let rectMarginTop = 5, rectMarginBottom = 5, 
    rectMarginH = 10;

let glyphCellWidth = 5, glyphCellHeight = 10;
let rectHeight, rectWidth;
let supportRectWidth = 80;

let widthScale, radiusScale, xScale, yScale, colorScale, supportScale;
let colorBarHeight = 5;
let barHeight = (rectHeight - rectMarginTop - rectMarginBottom) / 2;

let c = document.getElementById("myCanvas");
let ctx = c.getContext("2d");
ctx.font = '12 sans-serif';

let selected_range = [];
let rule_attr_ranges = [];
let rules_to_keep = [];

let i = 0,
    duration = 750,
    root,
    real_min,
    real_max,
    raw_data,
    attrs,
    median,
    node_info,
    max_depth,
    target_names;

let RULE_MODE = GRADIENT_RULE_VIS;

function loadData() {
    let path = "../" + folder;
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
        d3.select("#svg1")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom);

        // scale for placing cells
        xScale = d3.scaleBand(d3.range(attrs.length+1),[0, width]);
        yScale = d3.scaleBand(d3.range(listData.length+1), [margin.top, height]);

        // scale for render the support bar
        supportScale = d3.scaleLinear([0, d3.max(support)], [5, supportRectWidth]);

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
        render_feature_ranges();
        switch (RULE_MODE) {
            case BAND_RULE_VIS:
                generate_band_bars(listData);
                break;
            case GRADIENT_RULE_VIS:
                generate_gradient_bars(listData);
                break;
            case MEDIAN_VAL_VIS:
                generate_value_cells(listData);
                break;
        }

        render_legend_label("#legend1");
        render_summary(node_info, max_depth);
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
        .text((d) => {
            let textLength = ctx.measureText(d).width;
            let text = d;
            let txt = d;
            while (textLength > margin.top*2) {
                text = text.slice(0, -1);
                textLength = ctx.measureText(text+'...').width;
                txt = text+'...';
            }
            return txt;
        })
        .append('title')
        .text(d => d);

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

    // svg.selectAll(".rule-num")
    //     .data(yScale.domain().slice(0, yScale.domain().length-1))
    //     .enter().append("g")
    //     .attr("class", "rule-num")
    //     .attr("transform", function(d, i) { return `translate(-10, ${yScale(i)+font_size})`; })
    //     .append("text")
    //     .attr("x", 0)
    //     .text((d, i) => "R"+(i+1))
    //     .style("text-anchor", "end")
    //     .style("stroke", "black")
    //     .style("font-size", "16px")
    //     .style("stroke-width", "0.5px")
    //     .append('title')
    //     .text((d, i)=>{
    //         let str = "If "
    //         listData[i]['rules'].forEach((cond) => {
    //             str += attrs[cond['feature']] + " " + cond['sign'] + " " + cond['threshold'] + " AND ";
    //         })
    //         str = str.substring(0, str.length-4) + " THEN " + target_names[listData[i]['label']];
    //         return str;
    //     });

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

function render_slider() {
    let slider_support = d3
        .sliderHorizontal()
        .min(0)
        .max(100)
        .marks([0,20,40,60,80,100])
        .step(1)
        .width(legendWidth*.9)
        .default([0, 100])
        .fill('#2196f3')
        .on('onchange', val => {
            // change the text
            d3.select('#support-text').text(`Support: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['support'] = [+val[0]/100, +val[1]/100];
            new_nodes = filter_nodes(node_info);
            update_summary(new_nodes);
        });
 
    d3.select('#slider-support')
        .append('svg')
        .attr('width', legendWidth)
        .attr('height', 45)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_support);

    let slider_fidelity = d3
        .sliderHorizontal()
        .min(0)
        .max(100)
        .marks([0,20,40,60,80,100])
        .step(1)
        .width(legendWidth*.9)
        .default([0, 100])
        .fill('#2196f3')
        .on('onchange', val => {
            // change the text
            d3.select('#fidelity-text').text(`Fidelity: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['fidelity'] = [+val[0]/100, +val[1]/100];
            new_nodes = filter_nodes(node_info);
            update_summary(new_nodes);
        });
 
    d3.select('#slider-fidelity')
        .append('svg')
        .attr('width', legendWidth)
        .attr('height', 45)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_fidelity);

    let slider_accuracy = d3
        .sliderHorizontal()
        .min(0)
        .max(100)
        .marks([0,20,40,60,80,100])
        .step(1)
        .width(legendWidth*.9)
        .default([0, 100])
        .fill('#2196f3')
        .on('onchange', val => {
            // change the text
            d3.select('#accuracy-text').text(`Accuracy: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['accuracy'] = [+val[0]/100, +val[1]/100];
            new_nodes = filter_nodes(node_info,);
            update_summary(new_nodes);
        });
 
    d3.select('#slider-accuracy')
        .append('svg')
        .attr('width', legendWidth)
        .attr('height', 45)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_accuracy);
}

function filter_rules() {

}

function render_feature_ranges() {
    let feat_selection = d3.select('#feature-ranges');
    ctx.font= "15 sans-serif";

    attrs.forEach((d, i) => {
        let feat_r = feat_selection.append('div')
            .attr('class', 'range')
            .style('margin', '5px')
        let textLength = ctx.measureText(d).width;
        let text = d;
        let txt = d;
        while (textLength > 90) {
            text = text.slice(0, -1);
            textLength = ctx.measureText(text+'...').width;
            txt = text+'...';
        }
        feat_r.append('div')
            .append('span')
            .text(txt);

        let band = feat_r.append('svg')
            .attr('class', 'rangeband')
            .attr('width', 5 * (2 * glyphCellWidth + 2))
            .attr('height', glyphCellHeight + 2 * 2)
            .style("margin-left", 10);
        let range_clicked = []
        d3.range(0,5).forEach((idx) => {
            range_clicked.push(0);
            band.append('rect')
                .attr('id', `range-${i}-${idx}`)
                .style('x', idx * (glyphCellWidth * 2 + 2))
                .style('y', 2)
                .attr('width', glyphCellWidth * 2)
                .attr('height', glyphCellHeight)
                .style('fill', colorDiv5[idx])
                .style('stroke', borderColor[0])
                .style('stroke-width', 2)
                .on('click', function() {
                    let attr_idx = this.id.split('-')[1];
                    let range_idx = this.id.split('-')[2];
                    selected_range[attr_idx][range_idx] = 1 - selected_range[attr_idx][range_idx];
                    this.style.stroke = borderColor[selected_range[attr_idx][range_idx]];

                    // update the rule view 
                    
                });
        })
        selected_range.push(range_clicked);
    });

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
        res.append('g')
            .selectAll('rect')
            .data(class_support[i]).enter()
            .append('rect')
            .attr('x', (d, idx)=> {
                let offset = 0;
                for (let j = 0; j < idx; j++) {
                    offset += class_support[i][j];
                }
                return xScale(attrs.length) + supportScale(offset) + 10;
            })
            .attr('y', yScale(i))
            .attr('width', d => supportScale(d))
            .attr('height', rectHeight+rectMarginTop+rectMarginBottom)
            .attr('stroke', 'black')
            .attr('fill', (d,idx) => colorCate[idx])
            .append('title')
            .text(d => (d/support[i]*100).toFixed(1)+"%");

    }
}

function generate_value_cells(listData) {
    render_feature_names_and_grid(svg1);
    
    // get the median values


    // render rectangles
    let row = svg1.selectAll(".row")
        .data(listData)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return `translate(${rectMarginH}, ${yScale(i)+rectMarginTop})`; });

    row.selectAll(".rule-fill")
        .data(d => d['rules'])
        .enter()
        .append("rect")
        .attr("x", (d) => { 
           return  xScale(d['feature']);
        })
        .attr('class', 'rule-fill')
        .attr("width", glyphCellWidth)
        .attr("y",  0)
        .attr("height", glyphCellHeight)
        .attr("fill", d => {
            // TODO: use real median, preprocessing
            let min = real_min[d['feature']];
            let max = real_max[d['feature']];
            if (d['sign'] == '<=') {
                max = d['threshold'];
            } else if (d['sign'] == '>') {
                min = d['threshold']
            } else {
                min = d['threshold0'];
                max = d['threshold1'];
            }
            let med = (min + max) / 2;
            return colorScale[d['feature']](med);
        })

    render_confusion_bars(stat_svg);

}

function generate_band_bars(listData) {
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
                } else if (rule['sign'] == '>'){
                    arr.push({'feature': idx, 'coverRange': valueStops[idx].length})
                    for (let j = valueStops[idx].length-1; j >= 0; j--) {
                        
                        if (rule['threshold'] < valueStops[idx][j]) {
                            arr.push({'feature': idx, 'coverRange': j});
                        } else break;
                    }
                } else {
                    let range_start = 0;
                    while (rule['threshold0'] > valueStops[idx][range_start]
                        && range_start < 4) {
                        range_start++;
                    }

                    let range_end = valueStops[idx].length;
                     while (rule['threshold1'] < valueStops[idx][range_end]
                        && range_start > 0) {
                        range_start--;
                    }

                    for (let j = range_start; j < range_end; j++) {
                        arr.push({'feature': idx, 'coverRange': j});
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

    render_confusion_bars(stat_svg);
    // render_data_table();
}

function generate_gradient_bars(listData) {
    render_feature_names_and_grid(svg1);

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
    let linear_gradient = svg1.append('defs')
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

    // render by rows
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
        .data(d => d["rules"])
        .enter().append("rect")
        .attr("x", function(d) { 
            if (d["sign"] === "<=") {
                return xScale(d["feature"]);
            } else if (d["sign"] === ">") {
                return xScale(d["feature"]) + widthScale[d["feature"]](d["threshold"])
            } else {
                return xScale(d["feature"]) + widthScale[d["feature"]](d["threshold0"])
            }
        })
        .attr("width", function(d) {
            if (d["sign"] === "<=") {
                return widthScale[d["feature"]](d["threshold"]);
            } else if (d["sign"] === ">"){
                return rectWidth - widthScale[d["feature"]](d["threshold"]);
            } else if (d["sign"] === "range") {
                return (widthScale[d["feature"]](d["threshold1"]) - widthScale[d["feature"]](d["threshold0"]))
            }
        })
        .attr("y",  0)
        .attr("height", glyphCellHeight)
        .attr("fill", d => `url(#linear-gradient-${d.id})`)

    render_confusion_bars(stat_svg);
}

function render_data_table() {
    let table = d3.select('#datatable')
        .append('table');

    // let rows = table.selectAll('tr')    
    //     .data(raw_data)
    //     .enter()
    //     .append('tr');

    // rows.selectAll('td')
    //     .data(d => {
    //         return d;
    //     })
    //     .enter()
    //     .append('td')
    //     .text(d => {
    //         return d;
    //     });
}

function main() {
    loadData();
}

main();