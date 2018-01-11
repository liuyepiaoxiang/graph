/* eslint-disable semi,space-before-function-paren,no-unused-vars */
import * as Vue from 'vue';
import * as d3 from 'd3';
import * as $ from 'jquery';

const color = ['#44c483', '#edcd3b', '#49a5e6', '#928ee7', '#ecb43d', '#44cacf', '#d382f1', '#6293e5'];

/**
 * 生成柱状图
 * @param {Object} nodeData 所需要的节点数据
 * @param {Number} width
 * @param {Number} height
 * @param {String} id
 * */
function histogram(nodeData, width, height, id) {
  console.log('nodeData', nodeData);
  const newdata = nodeData.sort((a, b) => d3.ascending(a.date, b.date));
  d3.select(`#${id}`).attr('width', width * 0.98);
  $('#svgP').width(width * 0.98);
  // y轴的比例尺
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(newdata, d => d.count)])
    .range([height * 0.8, 0]);
  // 定义y轴
  const yAxis = d3.axisLeft(yScale)
    .tickSize(width * 0.90)
    .ticks(6, 's');
  const bg = d3.select(`#${id}`)
    .append('g')
    .attr('class', 'bg')
    .attr('transform', `translate(${width},30)`);
  bg.call(yAxis);
  bg.select('.domain').remove();
  bg.selectAll('.tick line').attr('stroke', '#eee');
  bg.selectAll('.tick text').attr('fill', '#eee');
  // x轴的比例尺
  const xScale = d3.scaleBand()
    .domain(newdata.map(d => d.date))
    .rangeRound([0, width * 0.94], 0.1);
  // 定义x轴
  const xAxis = d3.axisBottom(xScale)
    .tickFormat((d, i) => {
      if (newdata.length > 13) {
        if (i % 2 === 0) {
          return d3.timeFormat('%m/%e')(new Date(d));
        }
        return '';
      }
      return d3.timeFormat('%m/%e')(new Date(d));
    });
  // 添加x轴
  const axis = d3.select(`#${id}`)
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${(width) * 0.068},${(height * 0.8) + 30})`);
  axis.call(xAxis);
  axis.select('.domain').remove();
  axis.selectAll('.tick line').attr('opacity', 0);
  const area = d3.area()
    .x(d => xScale(d.date))
    .y1(d => yScale(d.count))
    .y0(yScale(0));
  const totalPie = d3.select(`#${id}`)
    .append('g')
    .attr('class', 'shadow');
  const defs = totalPie.append('defs');
  const shadow = defs.append('linearGradient')
    .attr('id', 'shadows')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  shadow.append('stop')
    .attr('offset', '0%')
    .style('stop-color', 'rgb(73,165,230)');
  shadow.append('stop')
    .attr('offset', '100%')
    .style('stop-color', 'rgba(255,255,255,0.9)');
  // 添加悬浮标签
  const tooltip = d3.select('#svgP')
    .append('div')
    .attr('class', 'vis-tooltip')
    .style('position', 'absolute')
    .style('width', '100px')
    .style('height', '50px')
    .style('font-size', '12px')
    .style('vertical-align', 'middle')
    .style('background', '#fff')
    .style('pointer-events', 'none')
    .style('box-shadow', '0 0 10px #ececec')
    .style('visibility', 'hidden');
  const g = d3.select(`#${id}`).append('g')
    .attr('class', 'area');
  g.append('path')
    .datum(newdata)
    .attr('transform', `translate(${width * 0.1},30)`)
    .attr('fill', `url(#${shadow.attr('id')})`)
    .attr('d', area);
  const circles = d3.select(`#${id}`).append('g').selectAll('circle')
    .data(newdata)
    .enter()
    .append('circle')
    .attr('transform', `translate(${width * 0.1},30)`)
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.count))
    .attr('r', 2)
    .attr('fill', 'rgba(73,165,230,0.5)');
  circles.style('cursor', 'pointer')
    .on('mouseover', (d) => {
      tooltip.html('<div style="padding:12px 12px 14px 12px;">' +
        `<span>${d.date}</span>` +
        '<div>' +
        `<span style="color: #4371e2;padding: 5px 0;">${d.count}次</span>` +
        '</div></div>')
        .style('left', `${xScale(d.date)}px`)
        .style('top', `${yScale(d.count) + 10}px`)
        .style('visibility', 'visible');
    })
    .on('mouseout', (d) => {
      tooltip.style('visibility', 'hidden');
    });
}

/**
 * 生成圆环函数
 * @param {Object} nodeData 所需要的节点数据
 * @param {Number} width
 * @param {Number} height
 * @param {String} id
 * */
function generatorPie(nodeData, width, height, id) {
  const innerRadius = height * 0.4; // 初始环形菜单内环半径
  const outerRadius = innerRadius + 16; // 初始环形菜单外环半径
  const arcAll = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .padAngle(0)
    .startAngle(0)
    .endAngle(Math.PI * 2);
  const arcWeek = d3.arc()
    .innerRadius(innerRadius - 30)
    .outerRadius(outerRadius - 30)
    .cornerRadius(8)
    .padAngle(0)
    .startAngle(0)
    .endAngle(Math.PI * 1.5);
  const arcDay = d3.arc()
    .innerRadius(innerRadius - 60)
    .outerRadius(outerRadius - 60)
    .cornerRadius(8)
    .padAngle(0)
    .startAngle(0)
    .endAngle(Math.PI * 1.5 * (nodeData.day / nodeData.week));
  const arc = d3.select(`#${id}`)
    .append('g')
    .attr('class', 'arc');
  arc.append('g')
    .attr('class', 'all')
    .attr('transform', `translate(${(outerRadius + 30)},${(height / 2)})`)
    .append('path')
    .style('fill', '#49a5e6')
    .attr('d', d => arcAll(d));
  arc.append('g')
    .attr('class', 'week')
    .attr('transform', `translate(${(outerRadius + 30)},${(height / 2)})`)
    .append('path')
    .style('fill', '#44c483')
    .attr('d', d => arcWeek(d));
  arc.append('g')
    .attr('class', 'day')
    .attr('transform', `translate(${(outerRadius + 30)},${(height / 2)})`)
    .append('path')
    .style('fill', '#ffd13a')
    .attr('d', d => arcDay(d));
  const title = d3.select(`#${id}`)
    .append('g')
    .attr('class', 'title');
  title.append('g')
    .attr('class', 'allTitle')
    .attr('transform', `translate(${((outerRadius * 2) + 60)}, 60)`)
    .append('circle')
    .style('fill', '#49a5e6')
    .attr('r', 6);
  d3.select('.allTitle')
    .append('text')
    .attr('x', 20)
    .attr('y', 4)
    .attr('fill', '#333')
    .text('总次数')
    .append('tspan')
    .attr('x', 73)
    .attr('y', 5)
    .attr('fill', '#49a5e6')
    .text(`${nodeData.all}`);
  title.append('g')
    .attr('class', 'weekTitle')
    .attr('transform', `translate(${((outerRadius * 2) + 60)}, 90)`)
    .append('circle')
    .style('fill', '#44c483')
    .attr('r', 6);
  d3.select('.weekTitle')
    .append('text')
    .attr('x', 20)
    .attr('y', 4)
    .attr('fill', '#333')
    .text('周次数')
    .append('tspan')
    .attr('x', 73)
    .attr('y', 5)
    .attr('fill', '#49a5e6')
    .text(`${nodeData.week}`);
  title.append('g')
    .attr('class', 'dayTitle')
    .attr('transform', `translate(${((outerRadius * 2) + 60)}, 120)`)
    .append('circle')
    .style('fill', '#ffd13a')
    .attr('r', 6);
  d3.select('.dayTitle')
    .append('text')
    .attr('x', 20)
    .attr('y', 4)
    .attr('fill', '#333')
    .text('天次数')
    .append('tspan')
    .attr('x', 73)
    .attr('y', 5)
    .attr('fill', '#49a5e6')
    .text(`${nodeData.day}`);
}

export { generatorPie, histogram };
// export default generatorPie;
