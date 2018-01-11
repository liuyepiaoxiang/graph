/**
 * Created by Administrator on 2017/6/1 0001.
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
import * as d3 from 'd3';
import * as $ from 'jquery';
import eventDrops from 'event-drops';
import updateData from '../dataRelated/dataLink';

// const color = d3.scaleOrdinal(d3.schemeCategory20c);

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
const brush = d3.brushX();
const brushSelectedCircles = [];
let svg;
const typeArray = [];
const zh = {
  dateTime: '%x %A %X',
  date: '%Y年%-m月%-d日',
  time: '%H:%M:%S',
  periods: ['上午', '下午'],
  days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  shortDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  shortMonths: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
};
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
    // timeLineZoom(extent);
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

function createTimeSeries(data) {
  // const color = d3.interpolateRainbow();
  const typeSet = new Set();
  $('#time').show();
  $('#finance').hide();
  data.forEach((v, i) => {
    v.data.forEach((item, j) => {
      typeSet.add(item.type);
    });
  });
  typeArray.splice(0, typeArray.length);
  typeSet.forEach((v, i) => {
    typeArray.push(v);
  });
  console.log('typeArray', typeArray);
  const locale = d3.timeFormatDefaultLocale(zh);
  /* eslint-disable no-use-before-define */
  /* 参考https://github.com/marmelab/EventDrops */
  /* TODO:坐标轴汉化失败，貌似locale函数无效，参考d3 */
  const eventDropsChart = eventDrops()
    .start(new Date(946656000))
    .locale(locale)
    .hasDelimiter(false)
    /* .tickFormat((date) => {
      const formatMillisecond = locale.format('.%L');
      const formatSecond = locale.format(':%S');
      const formatMinute = locale.format('%I:%M');
      const formatHour = locale.format('%I %p');
      const formatDay = locale.format('%a %d');
      const formatWeek = locale.format('%b %d');
      const formatMonth = locale.format('%B');
      const formatYear = locale.format('%Y');
      /!* eslint-disable no-nested-ternary *!/
      console.log('formatMonth', formatMonth);
      return (d3.timeSecond(date) < date
        ? formatMillisecond
        : d3.timeMinute(date) < date
          ? formatSecond
          : d3.timeHour(date) < date
            ? formatMinute
            : d3.timeDay(date) < date
              ? formatHour
              : d3.timeMonth(date) < date
                ? d3.timeWeek(date) < date
                  ? formatDay
                  : formatWeek
                : d3.timeYear(date) < date
                  ? formatMonth
                  : formatYear)(date);
    }) */
    .eventColor((d, i) => getTypeColor(d.type))
    .hasBottomAxis(false) // 是否显示下坐标
    .hasTopAxis(true) // 是否显示上坐标
    .click(d => console.log('d', d))
    .eventLineColor('#d9d9d9') // 分割线颜色
    .metaballs(true) // 是否以叠加变宽显示
    .zoomable(true)
    .labelsWidth(80)
    .date((d) => {
      /* eslint-disable no-param-reassign */
      d.date = new Date(d.time);
      return d.date;
    });
  const chart = d3.select('#timelineContainer')
    .datum(data)
    .call(eventDropsChart);
  d3.select('.extremum').remove();
  console.log('chart', chart);
}

function getTypeColor(d) {
  let colorValue = '';
  if (typeArray.length <= 10) {
    colorValue = d3.interpolateRainbow(typeArray.indexOf(d) / 10);
  } else {
    colorValue = d3.interpolateRainbow(typeArray.indexOf(d) / 100);
  }
  return colorValue;
}
function checkFilterTimeSeries(set) {
  const nodeSet = new Set();
  set.forEach((v, i) => {
    d3.selectAll('circle')
      .filter((d) => {
        if (d.type === v) {
          nodeSet.add(d.id);
        }
        return d.type === v;
      });
  });
  d3.selectAll('circle')
    .filter(d => nodeSet.has(d.id))
    .classed('hide', true);
  d3.selectAll('circle')
    .filter(d => !nodeSet.has(d.id))
    .classed('hide', false);
}
/**
 * 更新timeline视图
 * 因为需要根据数据动态修改坐标轴显示的文字格式
 * 以及需要根据数据动态设置坐标轴显示的间隔等
 * 因此直接采用remove方式较为直接保险
 * todo:后期可以将创建和更新函数分离开来，重写该update函数,应当可以适当减少dom操作
 * */
function updateTimeSeries(data) {
  $('#timeSeriesSVG').remove();
  createTimeSeries(data);
}
function setTimeSeries(data) {
  if (!$('#timeSeriesSVG').length) {
    createTimeSeries(data);
  }
  updateTimeSeries(data);
}
export {
  setTimeSeries,
  checkFilterTimeSeries,
  getTypeColor,
};
