/**
 * Created by Administrator on 2017/6/1 0001.
 */
import * as d3 from 'd3'
import * as $ from 'jquery'
import updateData from '../dataRelated/dataLink'

// const color = d3.scaleOrdinal(d3.schemeCategory20);
const timelineColor = d3.scaleOrdinal()
  .domain(['乘车事件', '住宿事件'])
  .range(['#7986cb', '#90bf6d'])
const brush = d3.brushX()
const brushSelectedRects = []
let svg
/**
 * 毛刷相关
 * */
function brushStart () {
  console.log('brushStart')
  const extent = d3.event.selection
  brushSelectedRects.splice(0)
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
    console.log(extent[0])
    // d3.selectAll('.rects').classed('timeline-brushSelected', d => extent[0] <= d.x && extent[1] >= d.x + d.width);
    d3.selectAll('.rects').classed('timeline-brushSelected', d => extent[0] <= (d.x + d.width) && extent[1] >= d.x)
  }
}
function brushEnd () {
  // console.log('brushEnd', d3.event.selection);
  const extent = d3.event.selection
  if (extent !== null) {
    // 取消框选
    // d3.select('.brush').call(brush.move, null);
    // brush.move(d3.select('.brush'), null);
    // 毛刷选择结束，将选中的数据进行存储
    d3.selectAll('.timeline-brushSelected').classed('timeline-brushSelected', (d) => {
      brushSelectedRects.push(d)
      return true
    })
  } else {
    // 点击空白处取消框选范围时，将所有已经选择的矩形移除选中效果
    d3.selectAll('.rects').classed('timeline-brushSelected', false)
  }
  updateData(brushSelectedRects)
}

function createTimeLine (data) {
  $('#financeSVG').remove()
  // console.log('createTimeLine', data);
  const containerBox = $('#timelineContainer')
  // console.log(containerBox.width(), containerBox.height());
  const svgwidth = containerBox.width()
  const svgheight = containerBox.height()
  svg = d3.select('#timelineContainer').append('svg')
    .attr('width', svgwidth)
    .attr('height', svgheight)
    .attr('id', 'timelineSVG')
    // .call(brush);
  const margin = { left: 60, right: 30, top: 20, bottom: 30 }
  const width = svgwidth - margin.left - margin.right
  const height = svgheight - margin.top - margin.bottom
  // const rP = 5;
  // const rectWidth = Math.round(((width - margin.left - margin.right) / data.data.length) - rP);
  const rectWidth = 10
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  /* const x = d3.scaleLinear()
    .domain(data.map(d => d.time))
    .rangeRound([0, width]); */
  const x = d3.scaleTime()
    .domain([new Date(data.minDate), new Date(data.maxDate)])
    .range([0, width])
  // 参考：https://bl.ocks.org/mbostock/3048450
  const y = d3.scaleLinear()
    // .domain([0, d3.max(data, d => d.length)])
    .domain([0, 20])
    .range([height, 0])
  //  x轴的显示
  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .ticks(8)
      // .tickFormat(date => d3.timeHour(date))
      .tickFormat(data.timeFormat)
      .tickPadding(7)
      .tickSize(3/* -height / 8 */))
    .selectAll('.tick')
    .classed('tick--minor', d => d.time)
  // y轴的显示
  g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transfrom', `translate(${width}, 0)`)
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickSize(3))

  // 毛刷
  svg.append('g')
    .attr('class', 'brush')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.brushX()
      .extent([[0, 0], [width + rectWidth, height]])
      .on('start', brushStart)
      .on('brush', brushed)
      .on('end', brushEnd))

  // 矩形,添加矩形颜色
  /* eslint-disable arrow-parens,no-else-return */
  const rectsContainer = g.selectAll('.rects')
    .data(data.data)
    .enter()
    .append('g')
    .attr('class', 'rects')
  rectsContainer.append('rect')
    .attr('fill', (d, i) => timelineColor(d.type))
    .attr('fill-opacity', 0.5)
    .attr('x', (d, i) => {
      // console.log(d, rectWidth, ((rectWidth + rP) * i) + rP);
      /* eslint-disable no-param-reassign */
      d.x = x(new Date(d.time))
      d.width = rectWidth
      return d.x
    })
    .attr('y', d => y(15))
    .attr('width', rectWidth)
    .attr('height', d => height - y(15))
}
/**
 * 更新timeline视图
 * 因为需要根据数据动态修改坐标轴显示的文字格式
 * 以及需要根据数据动态设置坐标轴显示的间隔等
 * 因此直接采用remove方式较为直接保险
 * todo:后期可以将创建和更新函数分离开来，重写该update函数,应当可以适当减少dom操作
 * */
function updateTimeline (data) {
  $('#timelineSVG').remove()
  createTimeLine(data)
}
function setTimeline (data) {
  console.log('setTimeline')
  if (!$('#timelineSVG').length) {
    createTimeLine(data)
  }
  updateTimeline(data)
}
export default setTimeline
