
function update_linked_rule_rendering(listData, col_order,) {
    let rule_svg = rule_svg2;

    // remove the column lines and the outdated rules
    rule_svg.selectAll(".grid-col").remove();
    rule_svg.selectAll(".grid-row").remove();
    rule_svg.selectAll(".column").remove();
    rule_svg.selectAll(".row").remove();
    rule_svg.selectAll("defs").remove();

    // re-render column lines
    height = listData.length * (glyphCellHeight + rectMarginTop + rectMarginBottom) + margin.top + margin.bottom;
    d3.select("#rule_svg2")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom);

    d3.select("#rule_div2 div")
        .style("height", `${height + margin.bottom}px`)

    d3.select("#rule_svg2")
        .attr("height", height + margin.bottom);

    d3.select("#stat_div2 div")
        .style("height", `${height + margin.bottom}px`);

    // scale for placing cells
    let yScale = d3.scaleBand(d3.range(listData.length+1), [margin.top, height]);

    render_feature_names_and_grid(col_svg2, col_order);

    // design gradient patterns
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
        return "liniked-linear-gradient-" + d.id;
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
    let row = rule_svg.selectAll(".row")
        .data(listData)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return `translate(${rectMarginH}, ${yScale(i)+rectMarginTop})`; })
        .on('click', (d, i) => {
            click_rule(i, d);
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
    render_confusion_bars(stat_svg2, listData);
}
