
function update_rule_rendering(rule_svg, col_svg, stat_svg, idx, listData, col_order,) {
    // !!! temeporay for categorical
    widthScale = d3.scaleLinear()
        .domain([0, 2])
        .range([0, rectWidth]);

    // remove the column lines and the outdated rules
    rule_svg.selectAll(".grid-col").remove();
    rule_svg.selectAll(".grid-row").remove();
    rule_svg.selectAll(".column").remove();
    rule_svg.selectAll(".row").remove();
    rule_svg.selectAll("defs").remove();

    // re-render column lines
    height = listData.length * (glyphCellHeight + rectMarginTop + rectMarginBottom) + margin.top + margin.bottom;
    rule_svg
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom);

    d3.select(`#rule_div${idx} div`)
        .style("height", `${height + margin.bottom}px`)

    d3.select(`#rule_svg${idx}`)
        .attr("height", height + margin.bottom);

    d3.select(`#stat_div${idx} div`)
        .style("height", `${height + margin.bottom}px`);

    // scale for placing cells
    let yScale = d3.scaleBand(d3.range(listData.length), [margin.top, height - margin.bottom]);

    render_feature_names_and_grid(col_svg, col_order);

    // render by rows
    let row = rule_svg.selectAll(".row")
        .data(listData)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return `translate(${rectMarginH}, ${yScale(i)+rectMarginTop})`; })
        .on('mouseover', function(d, i) {
            hover_rule(d3.select(this), i, d, idx);
        })
        .on('mouseout', function(d, i) {
            d3.select(`.rule_clicked_node`).remove();

            d3.select('#rule_description').selectAll('p').remove();
        })
        .on('click', function (d, i) {
            click_rule(d3.select(this), i, d, idx);
        })

    // render the white background for better click react
    row.append('rect')
        .attr('id', (d, i) => `back-rect-${i}`)
        .attr('class', 'back-rect')
        .attr('x', -rectMarginH)
        .attr('y', -rectMarginTop)
        .attr('height', `${yScale.bandwidth()}px`)
        .attr('width', `${width-xScale.bandwidth()}px`)
        // .attr('fill', 'white')
        .attr('fill', (d, i) => 
            new_node_shown[d['node_id']] ? 'white': 'rgba(0,0,0,.05)'
        );

    // render the horizontal_line
    row.selectAll(".middle")
        .data(function(d, i) { 
            return d["rules"]; 
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
                // return xoffset + widthScale[d["feature"]](d["threshold"])
                return xoffset + widthScale(d["threshold"])

            } else {
                return xoffset + widthScale(d["threshold0"])
                // return xoffset + widthScale[d["feature"]](d["threshold0"])
            }
        })
        .attr("width", function(d) {
            // if (d["sign"] === "<=") {
            //     return widthScale[d["feature"]](d["threshold"]);
            // } else if (d["sign"] === ">"){
            //     return rectWidth - widthScale[d["feature"]](d["threshold"]);
            // } else if (d["sign"] === "range") {
            //     return (widthScale[d["feature"]](d["threshold1"]-d["threshold0"]))
            // }
            if (d["sign"] === "<=") {
                return widthScale(d["threshold"]);
                // return widthScale(Math.round(d['threshold']))
            } else if (d["sign"] === ">"){
                // return rectWidth - widthScale(Math.round(d["threshold"]));
                return rectWidth - widthScale(d["threshold"]);
            } else if (d["sign"] === "range") {
                return (widthScale(d["threshold1"]-d["threshold0"]));
                // return (widthScale(Math.round(d["threshold1"])-Math.round(d["threshold0"])));
            }
        })
        .attr("y",  0)
        .attr("height", glyphCellHeight)
        .attr("fill", rule => {
            // let left, right;
            // if (rule['sign'] == 'range') {
            //     left = rule['threshold0'];
            //     right = rule['threshold1'];
            // } else if (rule['sign'] == '<=') {
            //     left = real_min[rule['feature']];
            //     right = rule['threshold'];
            // } else if (rule['sign'] == '>') {
            //     left = rule['threshold'];
            //     right = real_max[rule['feature']];
            // } else {
            //     console.log('invalid rule');
            // }
            // left = left.toFixed(1);
            // right = right.toFixed(1);
            // let id = `range-${rule['feature']}-${left}-${right}`
            // id = id.replace(/\./g, '_');
            // return `url(#liniked-linear-gradient-${id})`
            return 'dimgray'
        })

    // grid
    rule_svg.selectAll(".grid-row")
        .data(d3.range(listData.length+1))
        .enter().append("g")
        .attr("class", "grid-row")
        .attr("transform", function(idx) { return `translate(0, ${margin.top + yScale.bandwidth() * idx})`; })
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
        .attr("y2", height-margin.top-margin.bottom)
        .style("stroke", gridColor);

    // render_size_circle(listData);
    render_confusion_bars(stat_svg, listData);
}