/**
 * Created by Administrator on 2017/6/1 0001.
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
import * as d3 from 'd3';
import * as $ from 'jquery';
import updateData from '../dataRelated/dataLink';

// const color = d3.scaleOrdinal(d3.schemeCategory20);
/**
 * 下面6个变量全部跟时间轴缩放相关
 * */
let tmpTimelineScaler; // 保存生成时间轴时的x轴比例尺，用于在brushed函数中获得反向坐标
let timeScaleZoom = false; // 用来判断时间轴是否已经放大，false为初始未放大状态
let incomeOrigin; // 保存第一次生成时间轴的数据
let outcomeOrigin; // 保存第一次生成时间轴的数据
let incomeKeeper; // 保存每次时间轴放大后的调用参数
let outcomeKeeper; // 保存每次时间轴放大后的调用参数

const timelineColor = d3.scaleOrdinal()
  .domain(['收入', '支出'])
  .range(['#7986cb', '#90bf6d']);
const brush = d3.brushX();
const brushSelectedCircles = [];
let svg;

/**
 * 时间轴放大功能
 * */
function timeLineZoom(extent) {
  timeScaleZoom = true;
  const minData = tmpTimelineScaler.invert(extent[0]);
  const maxData = tmpTimelineScaler.invert(extent[1]);
  /* eslint-disable no-use-before-define */
  updateFinance(incomeKeeper, outcomeKeeper, minData, maxData);
}
/**
 * 时间轴还原功能
 * */
function timeLineRezoom() {
  if (timeScaleZoom) {
    timeScaleZoom = false;
    updateFinance(incomeOrigin, outcomeOrigin);
  }
}

/**
 * 毛刷相关
 * */
function brushStart() {
  console.log('brushStart');
  const extent = d3.event.selection;
  brushSelectedCircles.splice(0);
  if (extent !== null) {
    // console.log('brushStart');
  }
  return true;
}

function brushed() {
  console.log('brushed');
  const extent = d3.event.selection;
  /* eslint-disable max-len */
  if (extent !== null) {
    // d3.selectAll('.rects').classed('timeline-brushSelected', d => extent[0] <= d.x && extent[1] >= d.x + d.width);
    d3.selectAll('.rects').classed('timeline-brushSelected', d => extent[0] <= (d.x + d.width) && extent[1] >= d.x);
  }
}
function brushEnd() {
  // console.log('brushEnd', d3.event.selection);
  const extent = d3.event.selection;
  if (extent !== null) {
    timeLineZoom(extent);
    // 取消框选
    // d3.select('.brush').call(brush.move, null);
    // brush.move(d3.select('.brush'), null);
    // 毛刷选择结束，将选中的数据进行存储
    d3.selectAll('.timeline-brushSelected').classed('timeline-brushSelected', (d) => {
      brushSelectedCircles.push(d);
      return true;
    });
  } else {
    // 点击空白处取消框选范围时，将所有已经选择的矩形移除选中效果
    d3.selectAll('.rects').classed('timeline-brushSelected', false);
  }
  updateData(brushSelectedCircles);
}

function createFinance(income, outcome, minDate, maxDate) {
  if (!timeScaleZoom) {
    // 保存第一次生成时间轴的数据
    incomeOrigin = income;
    outcomeOrigin = outcome;
  }
  incomeKeeper = income; // 保存每次时间轴放大后的调用参数
  outcomeKeeper = outcome; // 保存每次时间轴放大后的调用参数
  $('#time').hide();
  $('#finance').show();
  // console.log('createTimeLine', data);
  const containerBox = $('#finance');
  // console.log(containerBox.width(), containerBox.height());
  /* const svgwidth = containerBox.width();
  const svgheight = containerBox.height(); */
  const svgwidth = 1000;
  const svgheight = 250;
  svg = d3.select('#finance').append('svg')
    .attr('width', svgwidth)
    .attr('height', svgheight)
    .attr('id', 'financeSVG');
  // .call(brush);

  const margin = { left: 60, right: 30, top: 20, bottom: 30 };
  const width = svgwidth - margin.left - margin.right;
  const height = svgheight - margin.top - margin.bottom;
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  const x = d3.scaleTime()
    .domain([new Date(minDate || income.minDate), new Date(maxDate || income.maxDate)])
    .range([0, width]);
  tmpTimelineScaler = x;
  // 参考：https://bl.ocks.org/mbostock/3048450
  console.log('d3.max', d3.max(income.data, d => d.value));
  const y = d3.scaleLinear()
    // .domain([0, d3.max(data, d => d.length)])
    .domain([0, d3.max(income.data, d => d.value)])
    .range([height, 0]);
  //  x轴的显示
  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .ticks(10)
      // .tickFormat(date => d3.timeHour(date))
      .tickFormat(income.timeFormat)
      .tickPadding(7)
      .tickSize(0))
    .selectAll('.tick')
    .classed('tick--minor', d => d.time);
  // y轴的显示
  g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transfrom', `translate(${width})`)
    .call(d3.axisLeft(y)
      .tickFormat(d => `${d / 10000}w`)
      .ticks(5));

  // 毛刷
  svg.append('g')
    .attr('class', 'brush')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.brushX()
      .extent([[0, 0], [width, height]])
      .on('start', brushStart)
      .on('brush', brushed)
      .on('end', brushEnd));

  // 收入的点
  /* eslint-disable arrow-parens,no-else-return */
  const incomeContainer = g.selectAll('.circle')
    .data(income.data)
    .enter()
    .append('g')
    .attr('class', 'circle');
  incomeContainer.append('circle')
    .attr('fill', (d, i) => '#7986cb')
    .attr('fill-opacity', 0.5)
    .attr('r', 1)
    .attr('cx', (d, i) => {
      // console.log(d, rectWidth, ((rectWidth + rP) * i) + rP);
      /* eslint-disable no-param-reassign */
      d.x = x(new Date(d.time));
      return d.x;
    })
    .attr('cy', d => y(d.value));
  // 支出的点
  const outcomeContainer = g.selectAll('.circle')
    .data(income.data)
    .enter()
    .append('g')
    .attr('class', 'circle');
  outcomeContainer.append('circle')
    .attr('fill', (d, i) => '#90bf6d')
    .attr('fill-opacity', 0.5)
    .attr('r', 1)
    .attr('cx', (d, i) => {
      // console.log(d, rectWidth, ((rectWidth + rP) * i) + rP);
      /* eslint-disable no-param-reassign */
      d.x = x(new Date(d.time));
      return d.x;
    })
    .attr('cy', d => y(d.value));
  // 收入的曲线
  const incomeline = d3.line()
    .x(d => x(new Date(d.time)))
    .y(d => y(d.value))
    .curve(d3.curveCardinal.tension(0.5));

  svg.append('path')
    .attr('transform', `translate(${margin.left + 10},${margin.top})`)
    .attr('d', (d) => incomeline(income.data))
    .attr('fill', 'none')
    .attr('stroke', '#f4511e')
    .attr('stroke-width', 2);

  const outcomeline = d3.line()
    .x(d => x(new Date(d.time)))
    .y(d => y(d.value))
    .curve(d3.curveCardinal.tension(0.5));

  svg.append('path')
    .attr('transform', `translate(${margin.left + 10},${margin.top})`)
    .attr('d', (d) => outcomeline(outcome.data))
    .attr('fill', 'none')
    .attr('stroke', '#90bf6d')
    .attr('stroke-width', 2);
  // 收入和支出的图例
  const incomemap = svg.append('g')
    .attr('class', 'incomemap');
  incomemap.append('rect')
    .attr('x', '80')
    .attr('y', '10')
    .attr('width', '10px')
    .attr('height', '2px')
    .attr('fill', '#f4511e');
  incomemap.append('text')
    .attr('x', '100')
    .attr('y', '12')
    .attr('font-size', '12px')
    .attr('color', '#f4511e')
    .text('收入');
  const outcomemap = svg.append('g')
    .attr('class', 'outcomemap');
  outcomemap.append('rect')
    .attr('x', '80')
    .attr('y', '30')
    .attr('width', '10px')
    .attr('height', '2px')
    .attr('fill', '#90bf6d');
  outcomemap.append('text')
    .attr('x', '100')
    .attr('y', '32')
    .attr('font-size', '12px')
    .attr('color', '#90bf6d')
    .text('支出');
  svg.append('rect')
    .attr('x', `${width - 30}`)
    .attr('y', 10)
    .attr('width', '10px')
    .attr('height', '8px')
    .attr('fill', '#ad1234')
    .on('click', timeLineRezoom);
}
/**
 * 更新timeline视图
 * 因为需要根据数据动态修改坐标轴显示的文字格式
 * 以及需要根据数据动态设置坐标轴显示的间隔等
 * 因此直接采用remove方式较为直接保险
 * todo:后期可以将创建和更新函数分离开来，重写该update函数,应当可以适当减少dom操作
 * */
function updateFinance(income, outcome, minData, maxData) {
  $('#financeSVG').remove();
  createFinance(income, outcome, minData, maxData);
}
function setFinance(income, outcome) {
  console.log('setFinance');
  if (!$('#financeSVG').length) {
    createFinance(income, outcome);
  }
  updateFinance(income, outcome);
}
export default setFinance;
