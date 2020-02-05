    
    <!-- <p id="f1-text" style="margin-bottom: 1px">F1: 0-100%</p>
          <div id="slider-f1"></div>

          <p id="precision-text" style="margin-bottom: 1px">Precision: 0-100%</p>
          <div id="slider-precision"></div>

          <p id="recall-text" style="margin-bottom: 1px">Recall: 0-100%</p>
          <div id="slider-recall"></div> -->


    let slider_f1 = d3
        .sliderHorizontal()
        .min(0)
        .max(100)
        .marks([0,20,40,60,80,100])
        .step(1)
        .width(overviewWidth*.9)
        .default([0, 100])
        .fill('#2196f3')
        .on('onchange', val => {
            // change the text
            d3.select('#f1-text').text(`F1: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['f1'] = [+val[0]/100, +val[1]/100];
        });
 
    d3.select('#slider-f1')
        .append('svg')
        .attr('width', overviewWidth)
        .attr('height', 45)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_f1);

    let slider_recall = d3
        .sliderHorizontal()
        .min(0)
        .max(100)
        .marks([0,20,40,60,80,100])
        .step(1)
        .width(overviewWidth*.9)
        .default([0, 100])
        .fill('#2196f3')
        .on('onchange', val => {
            // change the text
            d3.select('#recall-text').text(`Recall: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['recall'] = [+val[0]/100, +val[1]/100];
        });
 
    d3.select('#slider-recall')
        .append('svg')
        .attr('width', overviewWidth)
        .attr('height', 45)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_recall);

    let slider_precision = d3
        .sliderHorizontal()
        .min(0)
        .max(100)
        .marks([0,20,40,60,80,100])
        .step(1)
        .width(overviewWidth*.9)
        .default([0, 100])
        .fill('#2196f3')
        .on('onchange', val => {
            // change the text
            d3.select('#precision-text').text(`Precision: ${val.map(d => d3.format('.2%')(d/100)).join('-')}`);
            // filter the nodes
            filter_threshold['precision'] = [+val[0]/100, +val[1]/100];
        });
    d3.select('#slider-precision')
        .append('svg')
        .attr('width', overviewWidth)
        .attr('height', 45)
        .append('g')
        .attr('transform', 'translate(15,10)')
        .call(slider_precision);
