/**
 * Created by Administrator on 2017/5/19 0019.
 */
/**
 * 处理后端获得的各种数据
 * */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
/**
 * 临时写死的二级环形菜单数据
 * @param {String} name 临时写死，根据不同name返回特定的二级菜单数据
 * @return
 * */
function hardCodingArcMenuData(name) {
  let arr = [];
  switch (name) {
    case '人员':
      arr = [{ level: 2, size: 1, option: 'companyAnalysis', name: '同行' }, { level: 2, size: 1, option: 'pathAnalysis', name: '轨迹' }];
      break;
    case '电话号码':
      arr = [{ level: 2, size: 1, option: 'phoneAnalysis', name: '话单分析' }, { level: 2, size: 1, option: 'graphAnalysis', name: '图谱分析' }];
      break;
    case '银行卡号':
      arr = [{ level: 2, size: 1, option: 'cardAnalysis', name: '分析' }];
      break;
    default:
      // 默认返回 大组菜单
      break;
  }
  return arr;
}

function trans(d, type) {
  // console.log(d instanceof Array);
  const ele = { level: 2, size: 1, option: type };
  if (d instanceof Array) {
    ele.name = d[0];
  } else {
    ele.name = d;
  }
  return ele;
}
/**
 * 处理动态获取的环形菜单数据
 * 默认为spread，即关系扩展，eventNode为事件扩展
 * */
function arcMenuDataDealer(resp, type = 'spread') {
  // console.log('arcMenuDataDealer', resp);
  const arr = [];
  resp.forEach((d) => { arr.push(trans(d, type)); });
  // 如果环形菜单没有等级，则默认添加等级2； 默认的菜单为等级1；后期用来判断是几级菜单
  return arr;
}

/**
 * 定义节点显示图标种类的函数
 * @param {String} icon 判断属于哪个大类
 * @param {Boolean} hover 判断获取原始图标还是hover图标
 * @abstract 1.0版本的数据为中文汉字，为大层级的图标；2.0版本直接在图数据中添加icon字段，可直接根据icon获取
 * 其调用函数在createForceSimulation中相应的参数需要增加properties
 * @return {String} 返回图片的路径地址
 * @version 2.00
 * author hth@1.0 lj@2.0
 * */
function getNodeIcon(icon, hover = false) {
  let iconPath;
  if (icon) {
    if (!hover) {
      iconPath = `@/components/img/${icon}Hover.png`;
    } else {
      iconPath = `@/components/img/${icon}Hover.png`;
    }
  } else if (!hover) {
    iconPath = '@/components/img/nodeDefaultHover.png';
  } else {
    iconPath = '@/components/img/nodeDefaultHover.png';
  }
  /* switch (icon) {
    case 'cardid':
      if (!hover) {
        iconPath = './static/img/cardid.png';
      } else {
        iconPath = './static/img/cardidHover.png';
      }
      break;
    case '检察院':
      if (!hover) {
        iconPath = './static/img/procuratorate.png';
      } else {
        iconPath = './static/img/procuratorateHover.png';
      }
      break;
    case '医药':
      if (!hover) {
        iconPath = './static/img/hospital.png';
      } else {
        iconPath = './static/img/hospitalHover.png';
      }
      break;
    case '公安':
      if (!hover) {
        iconPath = './static/img/police.png';
      } else {
        iconPath = './static/img/policeHover.png';
      }
      break;
    case '化工行业':
      if (!hover) {
        iconPath = './static/img/chemical.png';
      } else {
        iconPath = './static/img/chemicalHover.png';
      }
      break;
    case 'nodesGroup':
      if (!hover) {
        iconPath = './static/img/nodesGroup.png';
      } else {
        iconPath = './static/img/nodesGroupHover.png';
      }
      break;
    default:
      if (!hover) {
        iconPath = './static/img/nodeDefault.png';
      } else {
        iconPath = './static/img/nodeDefaultHover.png';
      }
      break;
  } */
  return iconPath;
}
/**
 * 获取环形菜单图标
 * @param {String} pieicon
 * */
function getPieIcon(pieicon) {
  let iconPath;
  switch (pieicon) {
    case 'relationInfer':
      iconPath = './static/img/relationInfer.png';
      break;
    case 'eventCompare':
      iconPath = './static/img/eventCompare.png';
      break;
    case 'eventSpread':
      iconPath = './static/img/eventSpread.png';
      break;
    case 'entitySpread':
      iconPath = './static/img/entitySpread.png';
      break;
    case 'getRel':
      iconPath = './static/img/getRel.png';
      break;
    case 'analysis':
      iconPath = './static/img/analysis.png';
      break;
    case 'remove':
      iconPath = './static/img/remove.png';
      break;
    case 'select':
      iconPath = './static/img/select.png';
      break;
    case 'message':
      iconPath = './static/img/message.png';
      break;
    case 'financeAnalysis':
      iconPath = './static/img/finance.png';
      break;
    default:
      iconPath = './static/img/pieDefault.png';
      break;
  }
  return iconPath;
}
/**
 * 获取连线颜色的函数
 * 根据连线终点的节点类型来确定link的颜色
 * */
function getLinkColor(icon) {
  let color;
  switch (icon) {
    case 'people':
      color = '#ba68c8';
      break;
    case 'cardid':
      color = '#64b5f6';
      break;
    case 'phone':
      color = '#4db6ac';
      break;
    case 'hotel':
      color = '#90bf6d';
      break;
    case 'car':
    case 'trail':
      color = '#7986cb';
      break;
    default:
      color = '#ccc';
      break;
  }
  return color;
}
export { arcMenuDataDealer, hardCodingArcMenuData, getNodeIcon, getPieIcon, getLinkColor };
