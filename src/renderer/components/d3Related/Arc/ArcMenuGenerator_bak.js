/**
 * Created by Administrator on 2017/5/17 0017.
 */
/**
 * 该文件用于生成Arc环形菜单
 * */
import * as Vue from 'vue'
import * as d3 from 'd3'
import * as $ from 'jquery'
import * as layer from 'layer/src/layer'
import { http } from '../dataRelated/dataTransfer'
import { arcMenuDataDealer, hardCodingArcMenuData, getPieIcon } from '../dataRelated/otherDataDealer'
import { switchBrush, removeNode, start, expandNode, rescale, releaseGroup } from '../forceSimulation/createForceSimulation'
import dataTransform from '../dataRelated/neo4jDataDealer'
import timeSeriesTransform from '../dataRelated/timeSeriesDataDealer'
import setTimeline from '../timeLine/generateTimeline'
import timelineTransform from '../dataRelated/timelineDataDealer'
import setFinance from '../timeLine/generateFinance'
import { setTimeSeries } from '../timeLine/generateTimeSeries'

const color = d3.scaleOrdinal(d3.schemeCategory20)
const defaultMenuData = [
  // { arcID: 1, size: 4, level: 1, name: '扩展', option: 'getRel' },
  { arcID: 2, size: 1, level: 1, name: '移除', option: 'remove' },
  { arcID: 3, size: 1, level: 1, name: '选择', option: 'select' },
  { arcID: 4, size: 1, level: 1, name: '关系推演', option: 'relationInfer' },
  // { arcID: 5, size: 1, level: 1, name: '事件比对', option: 'eventCompare' },
  { arcID: 6, size: 1, level: 1, name: '事件扩展', option: 'eventSpread' },
  // { arcID: 8, size: 1, level: 1, name: '分析', option: 'analysis' },
  { arcID: 7, size: 1, level: 1, name: '实体扩展', option: 'entitySpread' },
  { arcID: 8, size: 1, level: 1, name: '资产分析', option: 'financeAnalysis' }]
const defaultGroupMenuData = [
  { arcID: 1, size: 1, level: 1, name: '释放', option: 'release' },
  { arcID: 2, size: 1, level: 1, name: '移除', option: 'remove' },
  { arcID: 3, size: 1, level: 1, name: '选择', option: 'select' },
  { arcID: 4, size: 1, level: 1, name: '分析', option: 'analysis' },
  { arcID: 5, size: 1, level: 1, name: '实体扩展', option: 'entity' }]
let dynamicMenuDataSpread // 二级扩展菜单数据
let dynamicMenuDataAnalysis // 二级分析菜单数据
let dynamicMenuDataEventSpread = [] // 二级事件扩展菜单数据
let dynamicMenuDataEntitySpread = [] // 二级实体扩展菜单数据
const innerRadius = 25 // 初始环形菜单内环半径
const outerRadius = 60 // 初始环形菜单外环半径
const infoData = { data: '' }
const timeData = []
const timeSeriesData = []
const checkSet = new Set()
const checkData = []
const dipUrl = {}
// const tau = 2 * Math.PI; // http://tauday.com/tau-manifesto
/**
 * 删除节点函数,TODO:LJ调用的单节点删除函数会重新和时间轴，
 * */
function removeExpand (nodeID, response) {
  // console.log('nodeID', nodeID);
  // console.log('response', response);
  const data = response.body.data.results[0].data
  $.each(data, (i, v) => {
    const nodes = v.graph.nodes
    $.each(nodes, (k, n) => {
      if (n.id !== nodeID) {
        removeNode(n.id)
      }
    })
  })
}

/**
 * 拓展节点关系函数
 * @param {String} nodeID
 * @param {String} arcName
 * @param {String} relName
 * */
function spreadRel (nodeID, arcName, relName = '-[r]-', where = '') {
  const cypher = `start n= node(${nodeID}) match (n)${relName}(m) ${where} return n,r,m`
  // console.log(cypher);
  http.getRelation('/kbms/gap/graph/neo4j', 'post', { cypher })
    .then((response) => {
      expandNode(nodeID, arcName, response)
    })
}
/**
 * 关系扩展函数，根据传来的值判断是扩展还是删除
 * */
function inferRel (nodeID, arcName, cypher, isExpand) {
  http.getRelation('/kbms/gap/graph/neo4j', 'post', { cypher })
    .then((response) => {
      if (isExpand) {
        expandNode(nodeID, arcName, response)
      } else {
        removeExpand(nodeID, response)
      }
    })
}

/**
 * 获取二级环形菜单函数
 * 保证相同类型的只创建一个二级菜单
 * @param {Object} d 点击的节点数据
 * @param {Array} type 二级菜单的类型，根据此项创建id选择对应的环形菜单数据
 * */
function getSecondMenu (d, type) {
  if ($(`#secondPie${type}`).length) {
    // 如果有，则显示
    $(`#secondPie${type}`).removeClass('dashOut')
  } else {
    // 如果没有，则创建
    // 建立角度比例尺
    const angleScale = d3.scaleLinear()
      .domain([0, 2 * Math.PI])
      .range([d.startAngle, d.endAngle])
    let pieMenuData
    switch (type) {
      case 'eventSpread':
        pieMenuData = dynamicMenuDataEventSpread
        break
      case 'entitySpread':
        pieMenuData = dynamicMenuDataEntitySpread
        break
      case 'analysis':
        pieMenuData = dynamicMenuDataAnalysis
        break
      case 'getRel':
        pieMenuData = dynamicMenuDataSpread
        break
      default:
        return
    }
    /* eslint-disable no-use-before-define */
    /* eslint-disable max-len */
    generatorArc(d.data, { innerR: outerRadius * 1.00, outerR: outerRadius * 1.5, startAngle: l => angleScale(l.startAngle), endAngle: l => angleScale(l.endAngle) }, pieMenuData, `secondPie${type}`)
    // 给新生成的环形菜单容器定位
    const transform = d3.select('#firstPie').attr('transform')
    d3.select(`#secondPie${type}`).attr('transform', transform)
  }
}
function clickArc (d) {
  const arclevel = d.data.level // 点击的是几级环形菜单
  const arcOption = d.data.option // 点击的环形菜单操作
  switch (arcOption) {
    case 'eventSpread':
    case 'entitySpread':
    case 'analysis': // 节点分析
    case 'getRel': // 扩展二级菜单
      getSecondMenu(d, arcOption)
      break
    case 'remove': // 删除节点
      removeNode(d.data.id)
      break
    case 'select': // 选择节点
      break
    case 'relationInfer': // 关系推演
      /* eslint-disable no-param-reassign,quotes */
      d.data.isExpand['关系推演'] = !d.data.isExpand['关系推演']
      inferRel(d.data.id, d.data.name, `start n=node(${d.data.id}) MATCH p=(n:\`人员\`)-[*2..4]-(m) where not exists(m.\`银行卡号\`) and not exists(m.\`电话号码\`)  return p`, d.data.isExpand['关系推演'])
      break
    case 'eventCompare': // 事件比对

      break
    case 'entity': // 实体扩展

      showMessage(d.data)
      break
    case 'spread': // 选择节点
      d.data.isExpand[d.data.name] = !d.data.isExpand[d.data.name]
      if (d.data.name === '所有') {
        Object.keys(d.data.isExpand).forEach((v, i) => {
          d.data.isExpand[v] = d.data.isExpand['所有']
        })
        inferRel(d.data.id, '', `start n= node(${d.data.id}) match (n)-[r]-(m) where not exists(r.类型) return n,r,m`, d.data.isExpand[d.data.name])
      } else if (d.data.name === '共现分析') {
        /* inferRel(d.data.id, d.data.name, `start n1=node(${d.data.id}) match  (n1)-[r1:铁路同乘车]-(m1)  return n1 as n, r1 as r,  m1 as m\n
                        union start n2=node(${d.data.id}) match (n2)-[r2:同住宿]-(m2)   return n2 as n, r2 as r,  m2 as m\n
                        union start n3=node(${d.data.id}) match (n3)-[r3:同入境]-(m3)   return r3 as r, n3 as n, m3 as m\n
                        union start n4=node(${d.data.id}) match (n4)-[r4:同出境]-(m4)   return r4 as r, n4 as n, m4 as m\n
                        union start n5=node(${d.data.id}) match (n5)-[r5:同乘飞机]-(m5)   return r5 as r, n5 as n, m5 as m\n
                        union start n6=node(${d.data.id}) match (n6)-[r6:飞机同订票]-(m6)   return r6 as r, n6 as n, m6 as m
              `, d.data.isExpand[d.data.name]); */
        http.getRelation(`/kbms/gap/graph/conoccurrelation/${d.data.id}`, 'get')
          .then((response) => {
            const conoData = {}
            conoData.body = response.body
            if (d.data.isExpand[d.data.name]) {
              expandNode(d.data.id, d.data.name, conoData)
            } else {
              removeExpand(d.data.id, conoData)
            }
          })
      } else {
        const type = d.data.name.substr(-1, 1)
        switch (type) {
          case 'r':
            inferRel(d.data.id, d.data.name, `start n= node(${d.data.id}) match (n)-[r:${d.data.name.substr(0, d.data.name.length - 1)}]->(m) return n,r,m`, d.data.isExpand[d.data.name])
            break
          case 'l':
            inferRel(d.data.id, d.data.name, `start n= node(${d.data.id}) match (n)<-[r:${d.data.name.substr(0, d.data.name.length - 1)}]-(m) return n,r,m`, d.data.isExpand[d.data.name])
            break
          default :
            inferRel(d.data.id, d.data.name, `start n= node(${d.data.id}) match (n)-[r:${d.data.name}]-(m) return n,r,m`, d.data.isExpand[d.data.name])
        }
      }
      break
    case 'eventNode':
      d.data.isExpand[d.data.name] = !d.data.isExpand[d.data.name]
      d.data.eventType = d.data.name
      http.getRelation('/kbms/gap/graph/event', 'post', d.data)
        .then((response) => {
          console.log(response)
          const eventData = response.body.data
          const eventDataForDeal = {
            body: {
              data: {
                results: []
              }
            }
          }
          eventDataForDeal.body.data.results[0] = eventData.graphData
          if (d.data.isExpand[d.data.name]) {
            if (checkSet.has(d.date.name)) {
              checkData.forEach((item, i) => {
                if (item.type === d.data.name) {
                  checkData[i].num += eventData.time.length
                }
              })
            } else {
              checkSet.add(d.data.name)
              checkData.push({ type: d.data.name, checked: true, num: eventData.time.length })
            }
            // expandNode(d.data.id, d.data.name, eventDataForDeal);
            /* 时间轴的数据处理 */
            timeData.push(...eventData.time)
            // setTimeline(timelineTransform(timeData));
            /* 时间序列的数据处理 */
            const seriesData = {}
            seriesData.name = eventData.name
            seriesData.data = eventData.time
            console.log('seriesData', seriesData)
            if (!timeSeriesData.length) {
              timeSeriesData.push(seriesData)
            } else {
              let equalFlag = false
              let equalNum = 0
              timeSeriesData.forEach((v, i) => {
                console.log('v.name', v.name)
                console.log('seriesData.name', seriesData.name)
                console.log('seriesData.name===v.name?', seriesData.name === v.name)
                if (v.name === seriesData.name) {
                  equalFlag = true
                  equalNum = i
                }
              })
              if (equalFlag) {
                timeSeriesData[equalNum].data.push(...seriesData.data)
              } else {
                timeSeriesData.push(seriesData)
              }
            }
            setTimeSeries(timeSeriesData)
            console.log('timeSeriesData', timeSeriesData)
          } else {
            /* checkSet.delete(d.data.name);
            checkData.splice(0, checkData.length);
            checkSet.forEach((v, i) => {
              checkData.push({ type: v, checked: true });
            }); */
            checkData.forEach((item, i) => {
              if (item.type === d.data.name) {
                checkData[i].num -= eventData.time.length
                if (checkData[i].num === 0) {
                  checkSet.delete(d.data.name)
                  checkData.splice(i, 1)
                }
              }
            })
            removeExpand(d.data.id, eventDataForDeal)
            /* eslint-disable */
            /*  数组1根据某个字段去除数组2的相同内容 */
            Array.prototype.del_byArr2 = function(cArr,fKey,sKey){
              // 取得key的数组
              for (let i = 0; i< cArr.length; i +=1){
                if(!cArr[i]||!cArr[i][fKey]) continue;
                var key1 = cArr[i][fKey],
                  key2 = cArr[i][sKey],
                  filter = function(obj){
                    if(sKey) return (obj[fKey] == key1)&&(obj[sKey] == key2);
                    return obj[fKey] == key1;
                  };
                for(let n = this.length - 1; n >= 0;n -= 1){
                  if(this[n] == null) continue;
                  if(filter(this[n])) this.splice(n,1);
                };
              };
            };
            timeData.del_byArr2(eventData.time, 'id');
            // setTimeline(timelineTransform(timeData));
            timeSeriesData.forEach((v, i) => {
              console.log('v.name', v);
              if (v.name === eventData.name) {
                v.data.del_byArr2(eventData.time, 'id');
              }
            });
            setTimeSeries(timeSeriesData);
          }
          /* expandNode(d.data.id, d.data.name, eventDataForDeal);*/
        });
      break;
    case 'cardAnalysis': // 分析
      break;
    case 'companyAnalysis': // 同行分析
      window.open('http://192.168.0.141:5601/app/graph#/workspace/e1b5c1f0-202a-11e7-8ca3-a5f879aacc5e?_g=()');
      break;
    case 'pathAnalysis': // 轨迹分析
      window.open(`/static/trailDemo/trailDemo.html?=${d.data.properties['姓名']}`);
      break;
    case 'phoneAnalysis': // 话单分析
      window.open('http://192.168.0.141:5601/goto/992ed6016b8f81161082de145bcbe60e?embed=true');
      break;
    case 'graphAnalysis': // 话单关联分析
      window.open('http://192.168.0.141:5601/app/graph#/workspace/f14d9330-3dfe-11e7-be3e-c5ce0da79e34?_g=()');
      break;
    case 'release': // 解除组合
      releaseGroup(d);
      break;
    case 'financeAnalysis':
      if (d.data.icon === 'female' || d.data.icon === 'male' || d.data.icon === 'people') {
        http.getRelation('/kbms/gap/graph/dealrecord', 'post', { name: d.data.properties['姓名'], caseID: d.data.properties.caseID, startDate: '', endDate: '' })
          .then((response) => {
            console.log('资产分析', response);
            const income = timelineTransform(response.body.data.income);
            const outcome = timelineTransform(response.body.data.outcome);
            setFinance(income, outcome);
          });
      } else if (d.data.icon === 'phone') {
        http.getRelation(`/kbms/gap/dip/callrecord/${d.data.properties.caseID}/${d.data.properties['电话号码']}`, 'get')
          .then((response) => {
            if (response.body.status === 200) {
              // $('#dipModal').show();
              dipUrl.data = response.body.data;
              // $('#dipFrame').attr('src', dipUrl);
              layer.open({
                type: 2,
                title: '数据洞察平台电话分析专题',
                shadeClose: false,
                shade: false,
                maxmin: true, // 开启最大化最小化按钮
                area: ['893px', '600px'],
                content: dipUrl.data,
              });
            } else {
              console.log('后台错误');
            }
          });
        /* $('#analysisContainer').html(`${telAnalysisUrl}`);
        $('#analysisModal').show();*/
      } else if (d.data.icon === 'cardid') {
        http.getRelation('/kbms/gap/graph/carddealrecord', 'post', { cardNumber: d.data.properties['银行卡号'], caseID: d.data.properties.caseID, startDate: '', endDate: '' })
          .then((response) => {
            const income = timelineTransform(response.body.data);
            setFinance(income);
          });
      }
      break;
    default:
      // console.log('clickArc default');
      break;
  }
  d3.selectAll('.pieContainer').classed('pieDisable', true);
}


function mousedownArc() {
  // console.log('mousedownArc');
}
function mouseoverArc(d) {
  const arclevel = d.data.level;
  if (arclevel === 1) {
    // 移上时，先隐藏所有二级菜单，再根据需求显示其一
    $('.pieContainer').eq(0).siblings('.pieContainer').addClass('dashOut');
  }
  // 鼠标移上的hover样式添加
  d3.select(event.target).classed('pieActive', true);
  const arcOption = d.data.option; // 点击的环形菜单操作
  switch (arcOption) {
    case 'eventSpread': // 事件扩展一级菜单
    case 'entitySpread': // 实体扩展一级菜单
    case 'analysis': // 节点分析
    case 'getRel': // 节点分析
      getSecondMenu(d, arcOption);
      break;
    default:
      // $('.pieContainer').eq(1).fadeOut();
      // console.log('mouseoverArc default');
      break;
  }
}
function mouseOutArc(d) {
  // 鼠标移上的hover样式移除
  d3.select(event.target).classed('pieActive', false);
  const arclevel = d.data.level; // 点击的是几级环形菜单
  const arcOption = d.data.option; // 点击的环形菜单操作
  switch (arcOption) {
    case 'spread': // 扩展二级菜单
      // 因为path形状问题，暂时屏蔽移出二级菜单时的消失功能
      // if (arclevel === 2) getSecondMenu(d);
      break;
    case 'phoneAnalysis':
    case 'cardAnalysis':
    case 'companyAnalysis': // 节点分析
      // 因为path形状问题，暂时屏蔽移出二级菜单时的消失功能
      // if (arclevel === 2) getAnalysisMenu(d);
      break;
    case 'analysis':
      break;
    default:
      break;
  }
}
/**
 * 生成环形菜单函数
 * 需要根据传入的参数动态生成环形菜单
 * 如果不传入任何参数直接调用该函数，会生成一个默认环形菜单
 * @param {Object} nodeData 环形菜单所需要的节点数据
 * @param {Object}  环形菜单的内外半径和起始角度等参数部分
 * @param {Array} menuData 默认的菜单部分
 * @param {String} id 环形菜单的容器
 * */
/* eslint-disable max-len */
function generatorArc(nodeData, { innerR = innerRadius, outerR = outerRadius, startAngle = d => d.startAngle, endAngle = d => d.endAngle } = {}, menuData = defaultMenuData, id = 'firstPie') {
  /* eslint-disable no-param-reassign */
  // 如果存在节点数据，则对节点数据进行操作，将需要的数据放置到环形菜单数据中
  if (nodeData) {
    menuData.forEach((e) => {
      e.id = nodeData.id;
      e.properties = nodeData.properties;
      e.groupNodesData = nodeData.groupNodesData;
      e.groupLinksData = nodeData.groupLinksData;
      e.isExpand = nodeData.isExpand;
      e.labels = nodeData.labels;
      e.icon = nodeData.icon;
    });
  }
  const arc = d3.arc()
    .innerRadius(innerR)
    .outerRadius(outerR)
    // .padAngle(0.03)
    .padAngle(0)
    .startAngle(startAngle)
    .endAngle(endAngle);
  /* const arc2 = d3.arc()
    .innerRadius(outerRadius)
    .outerRadius(outerRadius * 1.5);*/
  // .startAngle(0)
  // .endAngle(d => d.index);
  const pie = d3.pie();
  const arcsData = pie.value(d => d.size)(menuData);
  const g = d3.select('.mainG').append('g')
    .attr('id', id)
    .attr('class', 'pieContainer');
  // 这种绑定方式最容易理解
  const arcs = g.selectAll('g')
    .data(arcsData)
    .enter()
    .append('g');

  // 样式移动到main.css中
  /* arcs.append('path')
    // .style('fill', '#333') // 一定要添加颜色，不然无法点击触发事件
    // .attr('fill-opacity', '0') // 达到透明效果，与上一条结合使用
    // .attr('stroke', '#898989')
    // .attr('stroke-width', '2')
    // .attr('stroke-linecap', 'round')
    // .attr('stroke-linejoin', 'round')
    .attr('class', 'piePath')
    // .style('fill', d => color(d.data.arcID))
    .attr('d', arc)
    .on('mouseover', mouseoverArc)
    .on('mouseout', d => mouseOutArc(d, innerR, outerR))
    .on('mousedown', mousedownArc)
    .on('click', clickArc);*/

  if (id !== 'firstPie') {
    arc.padAngle(0.01);

    // 样式移动到main.css中
    arcs.append('path')
    // .style('fill', '#333') // 一定要添加颜色，不然无法点击触发事件
    // .attr('fill-opacity', '0') // 达到透明效果，与上一条结合使用
    // .attr('stroke', '#898989')
    // .attr('stroke-width', '2')
    // .attr('stroke-linecap', 'round')
    // .attr('stroke-linejoin', 'round')
      .attr('class', 'secondPiePath')
      // .style('fill', d => color(d.data.arcID))
      .attr('d', arc)
      .on('mouseover', mouseoverArc)
      .on('mouseout', d => mouseOutArc(d, innerR, outerR))
      .on('mousedown', mousedownArc)
      .on('click', clickArc);
    // 二级菜单直接添加文字
    // TODO:LJ20170708菜单文字旋转
    arcs.append('text')
      .text(d => d.data.name)
      .style('font-size', '6px')
      .attr('text-anchor', 'middle')
      /* .attr('transform', (d, i) => {
       // 第一个元素（最中间的），只平移不旋转
      // 其他的元素，既平移也旋转
        let r = 0;
        if ((d.startAngle + d.endAngle) / (2 * arcsData.length) / (Math.PI * 180) < 180) { // 0 - 180 度以内的
          r = -180 * (((d.startAngle + d.endAngle) / (2 * arcsData.length)) / Math.PI);
        } else { // 180 - 360 度以内的
          r = 180 * ((((d.startAngle + d.endAngle) / (2 * arcsData.length)) + (Math.PI / 2)) / Math.PI);
        }
        // 既平移也旋转
        return `translate(${arc.centroid(d)}) rotate(${r})`;
      }) */
      .attr('class', 'ArcText')
      .attr('pointer-events', 'none')
      .attr('x', d =>
      arc.centroid(d)[0] * 1)
      .attr('y', d =>
      arc.centroid(d)[1] * 1);
  } else {
    // 样式移动到main.css中
    arcs.append('path')
    // .style('fill', '#333') // 一定要添加颜色，不然无法点击触发事件
    // .attr('fill-opacity', '0') // 达到透明效果，与上一条结合使用
    // .attr('stroke', '#898989')
    // .attr('stroke-width', '2')
    // .attr('stroke-linecap', 'round')
    // .attr('stroke-linejoin', 'round')
      .attr('class', 'piePath')
      // .style('fill', d => color(d.data.arcID))
      .attr('d', arc)
      .on('mouseover', mouseoverArc)
      .on('mouseout', d => mouseOutArc(d, innerR, outerR))
      .on('mousedown', mousedownArc)
      .on('click', clickArc);
    // 一级菜单添加图片
    arcs.append('image')
      .attr('xlink:href', (d) => {
        return getPieIcon(d.data.option);
      })
      .attr('width', '20')
      .attr('height', '20')
      .attr('class', 'ArcImage')
      .attr('pointer-events', 'none')
      .attr('x', d =>
      (arc.centroid(d)[0] * 1) - 10)
      .attr('y', d =>
      (arc.centroid(d)[1] * 1) - 10);

    // 临时添加文字，应当由带文字的图片替代
    /* arcs.append('text')
      .text(d => d.data.name)
      .style('font-size', '4px')
      .style('color', '#fff')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .attr('x', d =>
      (arc.centroid(d)[0] * 1) - 8)
      .attr('y', d =>
      (arc.centroid(d)[1] * 1) + 10);*/
  }
}
/**
 * 定位环形菜单位置
 * @param {Number} x x轴坐标
 * @param {Number} y y轴坐标
 */
function placeArc(x, y) {
  d3.selectAll('.pieContainer').attr('transform', `translate(${x}, ${y})`);
}
/**
 * 清除已有的环形菜单
 * 因为需要动态生成
 * */
function removeArc() {
  d3.selectAll('.pieContainer').remove();
}
/**
 * 选择或者创建环形菜单
 * method removeArc 移除旧的环形菜单
 * method generatorArc 创建新的环形菜单
 * method placeArc 定位新的环形菜单
 * @param {Object} d 点击的节点包含的数据
 * @param {Number} x x轴坐标
 * @param {Number} y y轴坐标
 * */
function getArc(d, x, y) {
  removeArc();
  // 请求数据，获取二级菜单总数，用来生成1级菜单,query/relnotype用case/event替换,参数为d
  http.getRelation(`/kbms/gap/graph/relationtype/${d.id}`, 'get')
    .then((response) => {
      http.getRelation('/kbms/gap/graph/eventtype', 'post', d)
        .then((response2) => {
          // 生成扩展和收回关系数据，如果未创建该属性，则创建
          if (!d.isExpand) {
            d.isExpand = {};
            let isExpand = ['关系推演'];
            if (response.body.data && response.body.data.length) {
              isExpand = isExpand.concat(...response.body.data);
            }
            if (response2.body.data && response2.body.data.length) {
              isExpand = isExpand.concat(...response2.body.data);
            }
            isExpand.forEach((v, i) => {
              d.isExpand[v] = false;
            });
          }
          // 生成环形菜单所需要的数据
          // 临时采用写死数据，禁用response
          dynamicMenuDataAnalysis = hardCodingArcMenuData(d.labels[0]);
          if (response2.body.data && response2.body.data.length) {
            console.log('response2', response2);
            dynamicMenuDataEventSpread = arcMenuDataDealer(response2.body.data, 'eventNode');
            const menuLength = dynamicMenuDataEventSpread.length;
            defaultMenuData.filter(z => z.arcID === 6)[0].size = menuLength;
          }
          if (response.body.data && response.body.data.length) {
            dynamicMenuDataEntitySpread = arcMenuDataDealer(response.body.data);
            const menuLength = dynamicMenuDataEntitySpread.length;
            defaultMenuData.filter(z => z.arcID === 7)[0].size = menuLength;
          }
          removeArc();
          // 如果是组，需要传入大组对应的一级菜单
          if (!d.isGroup) {
            generatorArc(d);
          } else {
            generatorArc(d, { innerR: innerRadius * 1.25, outerR: outerRadius * 1.25, startAngle: a => a.startAngle, endAngle: a => a.endAngle }, defaultGroupMenuData);
          }
          // generatorArc({ innerR: 50, outerR: 80, startAngle: 0, endAngle: Math.PI / 2 });
          placeArc(x, y);
        });
    });
}
/**
 * 隐藏环形菜单
 * */
function hidePie() {
  d3.selectAll('.pieContainer')
    // .transition()
    .style('visibility', 'hidden')
    .attr('opacity', '0');
    // .attr('opacity', 0);
}
/**
 *@filename:ArcMenuGenerator.js
 *@method:环形菜单信息展示按钮方法
 *@abstract:通过点击环形菜单，获取当前节点信息，并将data.properties的内容展示在界面上
 *@parma {Object} data
 *@return
 *@author:liujia
 *@time:2017/5/20 0020
 *@version
 */
/* eslint-disable quote-props */
function showMessage(data) {
  // console.log('data');
  /* let innerHtml = '';
  Object.keys(data.properties).forEach((key, i) => {
    innerHtml += `<div class="info" style="text-align: left;padding-left: 10px;margin-top: 10px;"><span>${key}</span>:<span>${data.properties[key]}</span></div>`;
  });
  console.log(innerHtml);
  $('#infoContent').html(innerHtml);*/
  // this.$modal.show('info');
  // window.open('http://192.168.0.150:5601/goto/4b9a511f010ec81a5a8d3bb1fccab216');
  infoData.data = data.properties;
}
export { getArc, hidePie, showMessage, infoData, checkData, dipUrl, timeSeriesData };
