/**
 * Created by Administrator on 2017/5/26 0026.
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
import * as d3 from 'd3';
import * as $ from 'jquery';

/**
 *@filename:genarator.js
 *@method:
 *@abstract:
 *@parma {}
 *@return
 *@author:liujia
 *@time:2017/5/31 0031
 *@version
 */
const brush = d3.brushX();
let svgTime;
/**
 *@filename:genarator.js
 *@method:
 *@abstract:
 *@parma {}
 *@return
 *@author:liujia
 *@time:2017/5/31 0031
 *@version
 */
function brushStart() {
  // console.log('brushStart');
  const extent = d3.event.selection;
  if (extent !== null) {
    console.log('Nothing to do');
  }
  return true;
}

function brushed() {
  // console.log('brushed', d3.event.selection);
  const extent = d3.event.selection;
  /* eslint-disable max-len */
  if (extent !== null) {
    console.log('Nothing to do');
  }
}
function brushEnd() {
  // console.log('brushEnd', d3.event.selection);
  const extent = d3.event.selection;
  if (extent !== null) {
    // 借用d3选择集对数据d进行操作，实际上并不修改样式
    d3.selectAll('.brushSelected').classed('brushSelected', (d) => {
      console.log('Nothing to do');
      return true;
    });
    // 取消框选
    // d3.select('.brush').call(brush.move, null);
    brush.move(svgTime.select('.brush'), null);
    // console.log(brushSelectedNodes);
  }
}

/**
 *@filename:genarator.js
 *@method:generatorTimeline
 *@abstract:创建SVG以呈现时间轴,container是时间轴的容器;
 * svgwidth是时间轴的宽度;svgheight是时间轴的高度;
 * margin是时间轴的内间距，便于显示;rP是时间轴之间的间距
 *@parma {}
 *@return
 *@author:liujia
 *@time:2017/5/26 0026
 *@version
 */
function generatorTimeline(data) {
  const formatCount = d3.format(',.0f');
  const container = d3.select('#timeline');
  const svgwidth = 800;
  const svgheight = 70;
  const margin = { left: 60, right: 30, top: 20, bottom: 20 };
  const rP = 5;
  const width = svgwidth - margin.left - margin.right;
  const height = svgheight - margin.top - margin.bottom;
  const rectWidth = Math.round(((width - margin.left - margin.right) / data.length) - rP);
  svgTime = container.append('svg')
    .attr('width', svgwidth)
    .attr('height', svgheight)
    .attr('class', 'timeline brush')
    .attr('id', 'timelineId')
    .call(brush
      .on('start', brushStart)
      .on('brush', brushed)
      .on('end', brushEnd));

  const g = svgTime.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  const x = d3.scaleLinear()
    .domain(data.map(d => d.time))
    .rangeRound([0, width]);
  // 参考：https://bl.ocks.org/mbostock/3048450
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.length)])
    .range([height, 0]);
  const bar = g.selectAll('.bar')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'bar')
    .attr('transfrom', d => height - y(d.length));
  bar.append('rect')
    .attr('fill', '#d5d5d5')
    .attr('x', (d, i) => ((rectWidth + rP) * i) + rP)
    .attr('y', d => y(d.length))
    .attr('width', rectWidth)
    .attr('height', d => height - y(d.length));

  bar.append('text')
    .attr('dy', '.75em')
    .attr('y', d => y(d.length))
    .attr('x', (d, i) => ((rectWidth + rP) * i) + rP)
    .attr('text-anchor', 'middle')
    .text((d) => { formatCount(d.length); });
  //  x轴的显示
  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .ticks(d3.timeDay)
      .tickSize(-height)
      .tickFormat(() => null))
    .selectAll('.tick')
    .classed('tick--minor', d => d.time);
  // y轴的显示
  g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transfrom', `translate(${width})`)
    .call(d3.axisLeft(y)
      .ticks(5));
}

/**
 *@filename:genarator.js
 *@method:startTimeLine
 *@abstract:时间轴生成器，用于判断当前是否存在时间轴，若存在，则更新；若不存在，则创建
 *@parma {Object} data
 *@return
 *@author:liujia
 *@time:2017/5/26 0026
 *@version
 */
function startTimeLine(data) {
  if ($('#timelineId').length > 0) {
    $('#timelineId').remove();
    generatorTimeline(data);
  } else {
    generatorTimeline(data);
  }
}

export {
  startTimeLine,
  generatorTimeline,
};
