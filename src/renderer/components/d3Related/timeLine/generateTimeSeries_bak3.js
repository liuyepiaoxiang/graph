/**
 * Created by Administrator on 2017/6/1 0001.
 */
import * as d3 from 'd3'
import * as $ from 'jquery'
import eventDrops from 'event-drops'
import updateData from '../dataRelated/dataLink'

const color = d3.scaleOrdinal(d3.schemeCategory20c)

/**
 * 下面6个变量全部跟时间轴缩放相关
 *
let tmpTimelineScaler; // 保存生成时间轴时的x轴比例尺，用于在brushed函数中获得反向坐标
let timeScaleZoom = false; // 用来判断时间轴是否已经放大，false为初始未放大状态
let incomeOrigin; // 保存第一次生成时间轴的数据
let outcomeOrigin; // 保存第一次生成时间轴的数据
let incomeKeeper; // 保存每次时间轴放大后的调用参数
let outcomeKeeper; // 保存每次时间轴放大后的调用参数

const timelineColor = d3.scaleOrdinal()
  .domain(['收入', '支出'])
  .range(['#7986cb', '#90bf6d']);
 */
const brush = d3.brushX()
const brushSelectedCircles = []
let svg

/**
 * 时间轴放大功能
 *
function timeLineZoom(extent) {
  timeScaleZoom = true;
  const minData = tmpTimelineScaler.invert(extent[0]);
  const maxData = tmpTimelineScaler.invert(extent[1]);
  updateTimeSeries(incomeKeeper, outcomeKeeper, minData, maxData);
}
*/
/**
 * 时间轴还原功能
 *
function timeLineRezoom() {
  if (timeScaleZoom) {
    timeScaleZoom = false;
    updateTimeSeries(incomeOrigin, outcomeOrigin);
  }
}
*/
/**
 * 毛刷相关
 * */
function brushStart () {
  console.log('brushStart')
  const extent = d3.event.selection
  brushSelectedCircles.splice(0)
  if (extent !== null) {
    // console.log('brushStart');
  }
  return true
}

function brushed () {
  console.log('brushed')
  const extent = d3.event.selection
  /* eslint-disable max-len */
  if (extent !== null) {
    // d3.selectAll('.rects').classed('timeline-brushSelected', d => extent[0] <= d.x && extent[1] >= d.x + d.width);
    d3.selectAll('.rects').classed('timeline-brushSelected', d => extent[0] <= (d.x + d.width) && extent[1] >= d.x)
  }
}
function brushEnd () {
  // console.log('brushEnd', d3.event.selection);
  const extent = d3.event.selection
  if (extent !== null) {
    // timeLineZoom(extent);
    // 取消框选
    // d3.select('.brush').call(brush.move, null);
    // brush.move(d3.select('.brush'), null);
    // 毛刷选择结束，将选中的数据进行存储
    d3.selectAll('.timeline-brushSelected').classed('timeline-brushSelected', (d) => {
      brushSelectedCircles.push(d)
      return true
    })
  } else {
    // 点击空白处取消框选范围时，将所有已经选择的矩形移除选中效果
    d3.selectAll('.rects').classed('timeline-brushSelected', false)
  }
  updateData(brushSelectedCircles)
}

function createTimeSeries (data) {
  const colors = d3.scaleOrdinal(d3.schemeCategory20c)
    .domain(data.Type)
  $('#timelineSVG').remove()
  // console.log('createTimeLine', data);
  const containerBox = $('#timelineContainer')
  // console.log(containerBox.width(), containerBox.height());
  const svgwidth = containerBox.width()
  const svgheight = containerBox.height()
  svg = d3.select('#timelineContainer').append('svg')
    .attr('width', svgwidth)
    .attr('height', svgheight)
    .attr('id', 'timeSeriesSVG')
    // .call(brush);

  const margin = { left: 60, right: 30, top: 20, bottom: 30 }
  const width = svgwidth - margin.left - margin.right
  const height = svgheight - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  /* const x = d3.scaleLinear()
    .domain(data.map(d => d.time))
    .rangeRound([0, width]); */
  const x = d3.scaleTime()
    .domain([new Date(data.minDate), new Date(data.maxDate)])
    .range([0, width])
  // tmpTimelineScaler = x;
  // 参考：https://bl.ocks.org/mbostock/3048450
  console.log('d3.max', d3.max(data.data, d => d.name))
  const y = d3.scaleLinear()
    // .domain([0, d3.max(data, d => d.length)])
    .domain(data.yScaleRange)
    .range([height, 0])
  //  x轴的显示
  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .ticks(10)
      // .tickFormat(date => d3.timeHour(date))
      .tickFormat(data.timeFormat)
      .tickPadding(7)
      .tickSize(0/* -height / 8 */))
    .selectAll('.tick')
    .classed('tick--minor', d => d.time)
  // y轴的显示
  g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transfrom', `translate(${width})`)
    .call(d3.axisLeft(y)
      .tickFormat(d => `${d / 10000}w`)
      .ticks(5))

  // 毛刷
  svg.append('g')
    .attr('class', 'brush')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.brush()
      .extent([[0, 0], [width, height]])
      .on('start', brushStart)
      .on('brush', brushed)
      .on('end', brushEnd))

  // 绘制单个组合
  /* eslint-disable arrow-parens,no-else-return */
  function drawSeries (groupdata) {
    const gContainer = g.selectAll('g')
      .append('g')
      .attr('class', 'g')
      .attr('transfrom', `translate(0,${y(data.name)})`)
    const circleContainer = gContainer.selectAll('circle')
      .data(groupdata.data)
      .enter()
      .attr('fill', (d, i) => color(d.type))
      .attr('fill-opacity', 0.5)
      .attr('r', 1)
      .attr('cx', (d, i) => {
        // console.log(d, rectWidth, ((rectWidth + rP) * i) + rP);
        /* eslint-disable no-param-reassign */
        d.x = x(new Date(d.time))
        return d.x
      })
      .attr('cy', 0)
  }
  data.forEach((v, i) => {
    drawSeries(v)
  })
}
/**
 * 更新timeline视图
 * 因为需要根据数据动态修改坐标轴显示的文字格式
 * 以及需要根据数据动态设置坐标轴显示的间隔等
 * 因此直接采用remove方式较为直接保险
 * todo:后期可以将创建和更新函数分离开来，重写该update函数,应当可以适当减少dom操作
 * */
function updateTimeSeries (data) {
  $('#timeSeriesSVG').remove()
  createTimeSeries(data)
}
function setTimeSeries (data) {
  if (!$('#timeSeriesSVG').length) {
    createTimeSeries(data)
  }
  updateTimeSeries(data)
}
export default setTimeSeries
