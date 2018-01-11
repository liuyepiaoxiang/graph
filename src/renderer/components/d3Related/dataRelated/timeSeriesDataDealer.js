/**
 * Created by Administrator on 2017/6/1 0001.
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
import * as d3 from 'd3';

// 测试用默认数据
const testData = {
  body: [
    { name: '入住时间', time: '2016-06-18 21:28:47', type: '住宿事件' }, { name: '入住时间', time: '2016-06-25 13:39:19', type: '住宿事件' }, { name: '入住时间', time: '2016-06-29 09:10:00', type: '住宿事件' },
  ],
};
/**
 * 判断数据是否为日期格式
 * */

/**
 * 根据日期差选择合适的X轴坐标格式
 * @param {Date} max 最大日期,日期格式
 * @param {Date} min 最小日期，日期格式
 * @return d3.timeFormat
 * */
function getFormatFn(max, min) {
  let timeFormat = d3.timeFormat('%-m/%-d/%y');
  if (d3.timeYear.count(d3.timeYear(min), d3.timeYear(max)) >= 1) {
    timeFormat = d3.timeFormat('%-m/%-d/%y');
    return timeFormat;
  } else if (d3.timeMonth.count(d3.timeMonth(min), d3.timeMonth(max)) >= 1) {
    timeFormat = d3.timeFormat('%-m/%-d/%y');
    return timeFormat;
  } else if (d3.timeWeek.count(d3.timeWeek(min), d3.timeWeek(max)) >= 1) {
    timeFormat = d3.timeFormat('%-m/%-d/%y');
    return timeFormat;
  } else if (d3.timeDay.count(d3.timeDay(min), d3.timeDay(max)) >= 1) {
    timeFormat = d3.timeFormat('%-m/%-d/%y');
    return timeFormat;
  }
  // const tick = d3.timeMonth;
  return timeFormat;
}
/**
 * 根据日期差选择合适的坐标尺
 * @param {Date} max 最大日期,日期格式
 * @param {Date} min 最小日期，日期格式
 * @return d3.time
 * */
function getTickFn(max, min) {
  let tick = d3.timeHour;
  if (d3.timeYear.count(d3.timeYear(min), d3.timeYear(max)) >= 1) {
    tick = d3.timeMonth;
    return tick;
  } else if (d3.timeMonth.count(d3.timeMonth(min), d3.timeMonth(max)) >= 1) {
    tick = d3.timeWeek;
    return tick;
  } else if (d3.timeWeek.count(d3.timeWeek(min), d3.timeWeek(max)) >= 1) {
    tick = d3.timeDay;
    return tick;
  } else if (d3.timeDay.count(d3.timeDay(min), d3.timeDay(max)) >= 1) {
    tick = d3.timeDay;
    return tick;
  }
  // const tick = d3.timeMonth;
  return tick;
}
/**
 * 处理时间轴相关数据
 * */
/* eslint-disable max-len */
function timeSeriesTransform(data = testData) {
  console.log('timelineTransform', data);
  const timeMap = new Map();
  // data.forEach(d => timeMap.set(d.time, d.time));
  const DealDate = [];
  const yScaleData = new Set();
  const xScaleData = new Set();
  const colorType = new Set();
  data.forEach((d) => {
    yScaleData.add(d.name);
    d.data.forEach((item) => {
      DealDate.push(item);
      xScaleData.add(item.time);
      colorType.add(item.type);
    });
  });
  console.log('xscale', Array.from(xScaleData));
  // console.log(d3.max([...timeMap.values()]), new Date(d3.max([...timeMap.values()])));
  const maxDate = new Date(d3.max(Array.from(xScaleData)));
  const minDate = new Date(d3.min(Array.from(xScaleData)));
  const yScaleRange = Array.from(yScaleData);
  const tick = getTickFn(maxDate, minDate);
  const timeFormat = getFormatFn(maxDate, minDate);
  const Type = Array.from(colorType);
  return {
    maxDate,
    minDate,
    tick,
    timeFormat,
    data,
    Type,
    yScaleRange,
  };
}

export default timeSeriesTransform;
