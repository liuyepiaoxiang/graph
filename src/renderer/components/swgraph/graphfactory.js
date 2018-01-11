import * as d3 from 'd3'
import * as $ from 'jquery'
/* eslint-disable semi */
const swgraph = {
  version: '1.0',
  colors: d3.scale.category20()
};
let rulePRKeeper = []; // 外部定义一个数组保存pagerank的全部数值？便于用比例尺进行大小定义
let cypherKeeper = {
  stroeid: '',
  skuid: ''
};
/* 查询 */
swgraph.searchstart = (cythersql, type) => {
  if (typeof swgraph.rest.CYPHER_URL === 'undefined') {
    swgraph.logger.error('swgraph.rest.CYPHER_URL is not set but this property is required.');
  } else {
    if (swgraph.graph.isActive) {
      swgraph.rest.post(
        {
          'statements': [
            {
              'statement': cythersql,
              'resultDataContents': ['graph']
            }
          ]
        })
        .done(function (data) {
          if (swgraph.graph.force.nodes().length > 0) {
            swgraph.graph.force.nodes().splice(0, swgraph.graph.force.nodes().length);
            swgraph.graph.force.links().splice(0, swgraph.graph.force.links().length);
            swgraph.update()
          }
          if (data.results.length > 0) {
            swgraph.eventType = swgraph.algorithm.type.NONE;
            let mydata = data.results[0].data;
            mydata.forEach((item) => {
              let gnodes = item.graph.nodes;
              let relations = item.graph.relationships;
              gnodes.forEach((node) => {
                if (swgraph.graph.node.isHasSvgNodeElement(node) === false) {
                  const subnode = node.properties;
                  subnode['id'] = node.id;
                  subnode['label'] = node.labels;
                  subnode['status'] = 1;
                  subnode['expand'] = false;
                  subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
                  subnode['internalLabel'] = node.labels[0];
                  swgraph.graph.force.nodes().push(subnode)
                }
              });
              relations.forEach((edge) => {
                if (swgraph.graph.link.isHasSvgLinkElement(edge) === false) {
                  let icount = swgraph.graph.link.isHasSvgRelElement(edge);
                  if (icount > 0) {
                    swgraph.graph.force.links().push({
                      'source': swgraph.graph.findNode(edge.startNode),
                      'target': swgraph.graph.findNode(edge.endNode),
                      'id': edge.id,
                      'relation': edge.type,
                      'count': icount++,
                      'properties': edge.properties
                    })
                  }
                }
              })
            });
            if (type === swgraph.graph.type.PARENT && swgraph.graph.force.links().length > 0) {
              // swgraph.algorithm.updateTriangleNode(swgraph.graph.force.links());
            }
            if (swgraph.taxonomy.isActive && type === swgraph.graph.type.PARENT) {
              swgraph.taxonomy.createTaxonomyPanel()
            }
            swgraph.update()
          }
        })
    }
  }
};
swgraph.start = function (cythersql, stroeid, skuid) {
  cypherKeeper.stroeid = stroeid;
  cypherKeeper.skuid = skuid;
  if (typeof swgraph.rest.CYPHER_URL === 'undefined') {
    swgraph.logger.error('swgraph.rest.CYPHER_URL is not set but this property is required.')
  } else {
    swgraph.checkHtmlComponents();
    if (swgraph.graph.isActive) {
      swgraph.graph.createGraphArea();
      swgraph.graph.createForceLayout();
    }
    if (swgraph.graph.isActive) {
      swgraph.rest.post(
        {
          'statements': [
            {
              'statement': cythersql, // swgraph.query.generateRelsQuery(label),
              'resultDataContents': ['graph']
            }]
        })
        .done((data) => {
          if (data.results[0].data.length === 0) {
            const cypher2 = `MATCH (n:Store${stroeid}) WHERE n.shopid='${skuid}' RETURN n order by id(n) limit 1`;
            swgraph.searchstart(cypher2, 1);
          } else {
            if (swgraph.graph.force.nodes().length > 0) {
              swgraph.graph.force.nodes().splice(0, swgraph.graph.force.nodes().length);
              swgraph.graph.force.links().splice(0, swgraph.graph.force.links().length);
              swgraph.update();
            }
            if (data.results.length > 0) {
              swgraph.eventType = swgraph.algorithm.type.NONE;
              let mydata = data.results[0].data;
              rulePRKeeper = [];
              mydata.forEach((item) => {
                let gnodes = item.graph.nodes;
                let relations = item.graph.relationships;
                gnodes.forEach((node) => {
                  let y = node.properties.rulePR;
                  // hth20160825一定要考虑rulePR不存在的情况！！！
                  if (y) { rulePRKeeper.push(y) }
                  if (swgraph.graph.node.isHasSvgNodeElement(node) === false) {
                    let subnode = node.properties;
                    subnode['id'] = node.id;
                    subnode['label'] = node.labels;
                    subnode['status'] = 1;
                    subnode['expand'] = false;
                    subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
                    subnode['internalLabel'] = node.labels[0];
                    swgraph.graph.force.nodes().push(subnode)
                  }
                });
                relations.forEach((edge) => {
                  if (swgraph.graph.link.isHasSvgLinkElement(edge) === false) {
                    let icount = swgraph.graph.link.isHasSvgRelElement(edge);
                    if (icount > 0) {
                      swgraph.graph.force.links().push({
                        'source': swgraph.graph.findNode(edge.startNode),
                        'target': swgraph.graph.findNode(edge.endNode),
                        'id': edge.id,
                        'relation': edge.type,
                        'count': icount++,
                        'properties': edge.properties
                      })
                    }
                  }
                })
              });
              if (swgraph.graph.force.links().length > 0) {
                // swgraph.algorithm.updateTriangleNode(swgraph.graph.force.links());
                // swgraph.taxonomy.updateTaxonomy(data);
              }
              if (swgraph.taxonomy.isActive) {
                swgraph.taxonomy.createTaxonomyPanel()
              }
              swgraph.update()
            }
          }
        })
        .fail((xhr, textStatus, errorThrown) => {
          // swgraph.graph.node.chooseWaiting = false;
        })
    }
  }
};

swgraph.searchnew = (cypher2) => {
  if (typeof swgraph.rest.CYPHER_URL === 'undefined') {
    swgraph.logger.error('swgraph.rest.CYPHER_URL is not set but this property is required.')
  } else {
    if (swgraph.graph.isActive) {
      swgraph.rest.post(
        {
          'statements': [
            {
              'statement': cypher2,
              'resultDataContents': ['graph']
            }
          ]
        })
        .done((data) => {
          const myData = data.results[0].data[0].graph;
          myData.nodes.forEach((node) => {
            d3.select(`#swgraph-gnode_${node.id}`).select('.ppt-g-node-middleground')
              .select('circle')
              .style('fill', '#ff7043')
              .style('stroke', '#f29a76')
          })
        })
    }
  }
};
/***
 * Graph-Aided-Search 查询
 */
swgraph.essearch = (strsql) => {
  swgraph.rest.espost(
    {
      'query': {
        'match_phrase': {
          '_all': strsql
        }
      },
      'size': 5,
      'gas-filter': {
        'name': 'SearchResultCypherFilter',
        'query': 'MATCH (n:Book)-[r:`同时借`]-(m) return m.objectId as id',
        'exclude': false,
        'keyProperty': 'objectId'
      }
    }
  )
    .done((data) => {
      // console.log(JSON.stringify(data));
      let hits = [];
      if (data['hits'].hasOwnProperty('hits')) {
        let res = data['hits']['hits'];
        $.each(res, (i, item) => {
          hits.push(item._source.objectId)
        })
      }
      swgraph.searchstart(swgraph.query.generateNodeObjIDsQuery(hits, 'Book', 1), 0)
    })
    .fail(function (xhr, textStatus, errorThrown) {
      console.log('error')
    })
};
swgraph.checkHtmlComponents = function () {
  const graphHTMLContainer = d3.select(`#${swgraph.graph.containerId}`);
  const taxonomyHTMLContainer = d3.select(`#${swgraph.taxonomy.containerId}`);
  // var queryHTMLContainer = d3.select(`#${swgraph.queryviewer.containerId}`);
  // var cypherHTMLContainer = d3.select(`#${swgraph.cypherviewer.containerId}`);
  const resultsHTMLContainer = d3.select(`#${swgraph.result.containerId}`);
  if (graphHTMLContainer.empty()) {
    swgraph.logger.debug(`The page doesn't contain a container with ID = '${swgraph.graph.containerId} no graph area will be generated. This ID is defined in swgraph.graph.containerId property.`);
    swgraph.graph.isActive = false
  } else {
    swgraph.graph.isActive = true
  }
  if (taxonomyHTMLContainer.empty()) {
    swgraph.logger.debug(`The page doesn't contain a container with ID = ${swgraph.taxonomy.containerId} no taxonomy filter will be generated. This ID is defined in swgraph.taxonomy.containerId property.`);
    swgraph.taxonomy.isActive = false
  } else {
    swgraph.taxonomy.isActive = true
  }
  if (resultsHTMLContainer.empty()) {
    swgraph.logger.debug(`The page doesn't contain a container with ID = ${swgraph.result.containerId} no result area will be generated. This ID is defined in swgraph.result.containerId property.`);
    swgraph.result.isActive = false
  } else {
    swgraph.result.isActive = true
  }
  /* if(queryHTMLContainer.empty()){
   swgraph.logger.debug('The page doesn't contain a container with ID = \'' + swgraph.queryviewer.containerId + '\' no query viewer will be generated. This ID is defined in swgraph.queryviewer.containerId property.');
   swgraph.queryviewer.isActive = false;
   }else{
   swgraph.queryviewer.isActive = true;
   }
   if(cypherHTMLContainer.empty()){
   swgraph.logger.debug('The page doesn't contain a container with ID = \'' + swgraph.cypherviewer.containerId + '\' no cypher query viewer will be generated. This ID is defined in swgraph.cypherviewer.containerId property.');
   swgraph.cypherviewer.isActive = false;
   } else {
   swgraph.cypherviewer.isActive = true;
   }
   */
};
swgraph.update = () => {
  swgraph.updateGraph()
  /*
   swgraph.graph.force.nodes().forEach(function(item){
   swgraph.graph.node.expandNode(item);
   })
   */
  /* if (swgraph.queryviewer.isActive) {
   swgraph.queryviewer.updateQuery();
   }
   if (swgraph.cypherviewer.isActive) {
   swgraph.cypherviewer.updateQuery();
   }
   if (swgraph.result.isActive || swgraph.result.resultListeners.length > 0 || swgraph.result.resultCountListeners.length > 0) {
   swgraph.result.updateResults();
   } */
};
swgraph.updateGraph = function () {
  if (swgraph.graph.isActive) {
    swgraph.graph.force.start();
    swgraph.graph.node.updateNodes();
    swgraph.graph.link.updateLinks();
  }
};

// REST请求 ------------------------------------------------------------------------------------------------------------
swgraph.rest = {};
swgraph.rest.CYPHER_URL = 'http://localhost:7474/db/data/transaction/commit';
swgraph.rest.ES_URL = 'http://192.168.0.12:9200/neo4j-index/Book/_search';
swgraph.rest.post = function (data) {
  const strData = JSON.stringify(data);
  swgraph.logger.info(`REST POST:${strData}`);
  return $.ajax({
    type: 'POST',
    beforeSend: function (request) {
      if (swgraph.rest.AUTHORIZATION) {
        request.setRequestHeader('Authorization', swgraph.rest.AUTHORIZATION)
      }
    },
    url: swgraph.rest.CYPHER_URL,
    contentType: 'application/json',
    data: strData
  })
};

swgraph.rest.espost = (data) => {
  const strData = JSON.stringify(data);
  return $.ajax({
    type: 'POST',
    url: swgraph.rest.ES_URL,
    contentType: 'application/json; charset=UTF-8',
    crossDomain: true,
    data: strData
  })
};

// LOGGER -----------------------------------------------------------------------------------------------------------
swgraph.logger = {};
swgraph.logger.LogLevels = Object.freeze({DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4});
swgraph.logger.LEVEL = swgraph.logger.LogLevels.NONE;
swgraph.logger.TRACE = false;

swgraph.logger.log = function (logLevel, message) {
  if (console && logLevel >= swgraph.logger.LEVEL) {
    if (swgraph.logger.TRACE) {
      message = `message:${new Error().stack}`
    }
    switch (logLevel) {
      case swgraph.logger.LogLevels.DEBUG:
        console.log(message);
        break;
      case swgraph.logger.LogLevels.INFO:
        console.log(message);
        break;
      case swgraph.logger.LogLevels.WARN:
        console.warn(message);
        break;
      case swgraph.logger.LogLevels.ERROR:
        console.error(message);
        break;
    }
  }
};
swgraph.logger.debug = function (message) {
  swgraph.logger.log(swgraph.logger.LogLevels.DEBUG, message)
};
swgraph.logger.info = function (message) {
  swgraph.logger.log(swgraph.logger.LogLevels.INFO, message)
};
swgraph.logger.warn = function (message) {
  swgraph.logger.log(swgraph.logger.LogLevels.WARN, message)
};
swgraph.logger.error = function (message) {
  swgraph.logger.log(swgraph.logger.LogLevels.ERROR, message)
};

// TAXONOMIES  -----------------------------------------------------------------------------------------------------
swgraph.taxonomy = {};
swgraph.taxonomy.containerId = 'swgraph-taxonomy';
swgraph.taxonomy.nodetreepaenlId = 'swgraph-node-panel-tree';
swgraph.taxonomy.linktreepaenlId = 'swgraph-link-panel-tree';

/***
 * 创建数据面板
 */
swgraph.taxonomy.createTaxonomyPanel = function () {
  const nodetreeContainer = $(`#${swgraph.taxonomy.nodetreepaenlId}`);
  const linktreeContainer = $(`#${swgraph.taxonomy.linktreepaenlId}`);
  /* eslint-disable no-unused-vars */
  let zTreeNodeObj;
  let zTreeListObj;
  const setting = {
    callback: {
      onClick: zTreeOnClick
    }
  };
  function zTreeOnClick (event, treeId, treeNode) {
    swgraph.searchstart(swgraph.query.generateNodeIDsQuery(treeNode.nodelist), 1);
    let treeObj = $.fn.zTree.getZTreeObj(swgraph.taxonomy.nodetreepaenlId);
    if (treeNode.open === true) {
      treeObj.expandNode(treeNode, false, false, false)
    } else {
      treeObj.expandNode(treeNode, true, false, false)
    }
  }
  let zNodes = [];
  let nodemap = d3.map(zNodes, d => d.categoryName);
  swgraph.graph.force.nodes().forEach((item) => {
    zNodes.push(item.id);
    if (!nodemap.has(item.internalLabel)) {
      nodemap.set(item.internalLabel, {
        label: item.internalLabel,
        name: `${item.internalLabel}(1)`,
        nodelist: [item.id],
        count: 1,
        open: true,
        children: []
      })
    } else {
      const content = nodemap.get(item.internalLabel);
      const count = content.count + 1;
      const nodelist = content.nodelist;
      nodelist.push(item.id);
      nodemap.set(item.internalLabel, {
        label: item.internalLabel,
        name: `${item.internalLabel}(${count})`,
        nodelist: nodelist,
        count: count,
        open: true,
        children: []
      })
    }
  });
  swgraph.graph.node.structure = [];
  swgraph.graph.link.structure = [];
  nodemap.forEach((key, value) => {
    const childmap = d3.map(value.children, d => d.label);
    let nodestructure = {};
    swgraph.graph.force.nodes().filter((d) => d.internalLabel === value.label).forEach((item, i) => {
      if (i === 0) {
        let resultAttributes = swgraph.provider.getReturnAttributes(item.internalLabel);
        let attribute = d3.set([]);
        resultAttributes.forEach((ditem, di) => {
          attribute.add(ditem)
        });
        nodestructure['label'] = item.internalLabel;
        nodestructure['attibute'] = attribute.values();
        nodestructure['type'] = 'node';
        swgraph.graph.node.structure.push(nodestructure)
      }

      const type = item[swgraph.provider.getCategoryName(item.internalLabel)];
      let stype = type;
      if (type === 2) {
        stype = '学生'
      }
      if (type === 1) {
        stype = '教师'
      }
      if (childmap.has(type)) {
        const tnodelist = childmap.get(type)['nodelist'];
        const count = childmap.get(type)['count'] + 1;
        tnodelist.push(item.id);
        childmap.set(type, {
          label: item.internalLabel,
          categoryName: type,
          name: `${stype}(${count})`,
          nodelist: tnodelist,
          count: count
        })
      } else {
        childmap.set(type, {
          label: item.internalLabel,
          categoryName: type,
          name: `${stype}(1)`,
          nodelist: [item.id],
          count: 1
        })
      }
    });
    // console.log(JSON.stringify(swgraph.graph.node.structure));

    value.children = childmap.values();
    value.children.sort((a, b) => b.count - a.count);
    nodemap.set(key, value);
  })
  nodemap.values().sort((a, b) => b.count - a.count);
  zTreeNodeObj = $.fn.zTree.init(nodetreeContainer, setting, [{
    label: 'all',
    categoryName: 'root',
    name: `所有(${zNodes.length})`,
    nodelist: zNodes,
    count: zNodes.length,
    open: true,
    children: nodemap.values()}
  ]);

  const linksetting = {
    callback: {
      onClick: zTreeLinkOnClick
    }
  };
  function zTreeLinkOnClick (event, treeId, treeNode) {
    expandlinktree(treeNode)
  }
  function expandlinktree (treeNode) {
    const listlinks = swgraph.graph.force.links().filter(function (d) {
      return treeNode.linklist.indexOf(d.source.id) > -1 || treeNode.linklist.indexOf(d.target.id) > -1
    });
    const treeObj = $.fn.zTree.getZTreeObj(swgraph.taxonomy.linktreepaenlId);
    if (treeNode.label === '子图') {
      if (treeNode.clicked === false) {
        swgraph.algorithm.restpost(
          listlinks, swgraph.algorithm.type.CHILDGRAPH
        ).done(function (data) {
          const dataIn = data[0].obj;
          dataIn.sort(function (a, b) {
            return b.length - a.length
          });
          treeObj.removeChildNodes(treeNode);
          $.each(dataIn, function (i, item) {
            treeObj.addNodes(treeNode, {
              label: 'graph',
              name: '子图' + i + '(' + item.length + ')',
              linklist: item,
              count: item.length,
              open: false
            });
          });
          treeNode.name = `子图(${dataIn.length})`;
        }).fail(function (r) {
          console.log('error' + r);
        }).always(function () {
          treeNode.clicked = true;
          treeObj.updateNode(treeNode);
          treeObj.expandNode(treeNode, false, false, false);
        });
      }
    } else {
      swgraph.searchstart(swgraph.query.generateNodeIDsQuery(treeNode.linklist, 1), 1);
    }
    if (treeNode.open === true) {
      treeObj.expandNode(treeNode, false, false, false);
    } else {
      treeObj.expandNode(treeNode, true, false, false);
    }
  }
  function updateChildrenGraphTree () {
    let treeObj = $.fn.zTree.getZTreeObj(swgraph.taxonomy.linktreepaenlId);
    let nodes = treeObj.getNodesByParam('name', '子图', null);
    for (let ii in nodes) {
      let node = nodes[ii];
      let childnode = treeObj.getNodeByTId(node.tId);
      // childnode.click;
      expandlinktree(childnode);
    }
  }

  const zLinks = [];
  const linkmap = d3.map(zLinks, (d) => d.type);
  swgraph.graph.force.links().forEach(function (item) {
    if (item.target.communityrule1 === item.source.communityrule1) {
      zLinks.push(item.id);
      if (!linkmap.has(item.relation)) {
        linkmap.set(item.relation, {
          label: item.relation,
          name: item.relation + '(1)',
          properties: item.properties,
          linklist: [item.source.id, item.target.id],
          count: 1,
          open: false,
          children: [{
            label: item.relation + '子图',
            name: '子图',
            clicked: false,
            linklist: [item.id],
            open: false,
            isParent: true,
            children: []
          }]
        });
      } else {
        const content = linkmap.get(item.relation);
        const count = content.count + 1;
        const linklist = content.linklist;
        linklist.push(item.source.id);
        linklist.push(item.target.id);
        linkmap.set(item.relation, {
          label: item.relation,
          name: item.relation + '(' + count + ')',
          properties: item.properties,
          linklist: linklist,
          count: count,
          open: false,
          children: [{
            label: '子图',
            name: '子图',
            open: false,
            clicked: false,
            isParent: true,
            linklist: linklist,
            children: []
          }]
        });
      }
    }
  });

  let linkstructure = {};
  linkmap.forEach(function (key, value) {
    let linkattribute = d3.set([]);
    const properties = value.properties;
    linkstructure['label'] = key;
    for (let iitem in properties) {
      linkattribute.add(iitem);
    }
    linkstructure['attibute'] = linkattribute.values();
    linkstructure['type'] = 'link';
    swgraph.graph.link.structure.push(linkstructure);
  });
  linkmap.set('childmap', {
    label: '子图',
    name: '子图',
    linklist: zNodes,
    open: false,
    clicked: false,
    isParent: true,
    children: []
  });
  zTreeListObj = $.fn.zTree.init(linktreeContainer, linksetting, [{
    label: 'all',
    categoryName: 'root',
    name: `所有(${zLinks.length})`,
    linklist: zNodes,
    count: zLinks.length,
    open: true,
    children: linkmap.values()
  }]);
  updateChildrenGraphTree();
};

/* ************嫌疑人分析***************** */
swgraph.taxonomy.PeopleFilter = function () {
  let counterNodes = swgraph.graph.force.nodes()
    .filter(function (d) {
      return d.type !== swgraph.graph.node.NodeTypes.VALUE && d.type !== swgraph.graph.node.NodeTypes.GROUP;
    });

  swgraph.logger.info('Count nodes ==> ');
  swgraph.rest.post(
    {
      'statements': [{
        'statement': swgraph.query.peopleCountQuery()
      }]
    })
    .done(function (returnedData) {
      swgraph.algorithm.UNUSUAL.hitNodes = [];
      let id = returnedData.results[0].data[0].meta[0].id;
      console.log(returnedData);
      swgraph.algorithm.UNUSUAL.hitNodes.push('' + id);
      if (returnedData.errors && returnedData.errors.length > 0) {
        swgraph.logger.error('Cypher query error:' + JSON.stringify(returnedData.errors));
      }

      if (returnedData.results && returnedData.results.length > 0) {
        for (let i = 0; i < counterNodes.length; i++) {
          counterNodes[i].count = returnedData.results[i].data[0].row[0];
        }
      } else {
        counterNodes.forEach(function (node) {
          node.count = 0;
        });
      }
      swgraph.graph.node.updateElements();
      swgraph.graph.link.updateElements();
    })
    .fail(function (xhr, textStatus, errorThrown) {
      swgraph.logger.error(textStatus + ': error while accessing Neo4j server on URL:\'' + swgraph.rest.CYPHER_URL + '\' defined in \'popoto.rest.CYPHER_URL\' property: ' + errorThrown);
      counterNodes.forEach(function (node) {
        node.count = 0;
      });
      swgraph.graph.node.updateElements();
      swgraph.graph.link.updateElements();
    });
};

/* ************嫌疑人分析2***************** */
swgraph.taxonomy.PeopleFilter2 = function () {
  let counterNodes = swgraph.graph.force.nodes()
    .filter(function (d) {
      return d.type !== swgraph.graph.node.NodeTypes.VALUE && d.type !== swgraph.graph.node.NodeTypes.GROUP;
    });

  swgraph.logger.info('Count nodes ==> ');
  swgraph.rest.post(
    {
      'statements': [{
        'statement': swgraph.query.peopleCountQuery2()
      }]
    })
    .done(function (returnedData) {
      if (returnedData.results.length > 0) {
        swgraph.algorithm.UNUSUAL.hitNodes = [];
        let mydata = returnedData.results[0].data;
        mydata.forEach(function (item, i) {
          i++;
          swgraph.graph.force.links().push({
            'source': swgraph.graph.findNode(item.row[0]),
            'target': swgraph.graph.findNode(item.row[1]),
            'id': 'L' + i,
            'relation': '同出境（' + item.row[3] + ')',
            'properties': item.row[3]
          });
          swgraph.algorithm.UNUSUAL.hitNodes.push('' + item.row[0]);
        });
        swgraph.update();
      }
    })
    .fail(function (xhr, textStatus, errorThrown) {
      swgraph.logger.error(textStatus + ': error while accessing Neo4j server on URL:\'' + swgraph.rest.CYPHER_URL + '\' defined in \'popoto.rest.CYPHER_URL\' property: ' + errorThrown);
      counterNodes.forEach(function (node) {
        node.count = 0;
      });
      swgraph.graph.node.updateElements();
      swgraph.graph.link.updateElements();
    });
};

// TOOLS -----------------------------------------------------------------------------------------------------------
swgraph.tools = {};
swgraph.tools.CENTER_GRAPH = true;
swgraph.tools.RESET_GRAPH = false;
swgraph.tools.TOGGLE_TAXONOMY = true;
swgraph.tools.TOGGLE_FULL_SCREEN = true;

swgraph.tools.reset = function () {
  while (swgraph.graph.force.nodes().length > 0) {
    swgraph.graph.force.nodes().pop();
  }
  while (swgraph.graph.force.links().length > 0) {
    swgraph.graph.force.links().pop();
  }
  // Reinitialize internal label generator
  swgraph.graph.node.internalLabels = {};

  swgraph.update();
  // swgraph.graph.addRootNode(swgraph.graph.mainLabel);
  /* swgraph.graph.hasGraphChanged = true;
   swgraph.result.hasChanged = false;
   swgraph.update(); */
  swgraph.tools.center();
};
swgraph.tools.center = function () {
  swgraph.graph.zoom.translate([0, 0]).scale(1);
  swgraph.graph.svg.transition().attr('transform', 'translate(' + swgraph.graph.zoom.translate() + ')' + ' scale(' + swgraph.graph.zoom.scale() + ')');
};
swgraph.tools.toggleTaxonomy = function () {
  const taxo = d3.select('#' + swgraph.taxonomy.containerId);
  if (taxo.filter('.disabled').empty()) {
    taxo.classed('disabled', true);
  } else {
    taxo.classed('disabled', false);
  }
};

swgraph.tools.toggleFullScreen = function () {
  const stroeid = cypherKeeper.stroeid;
  const skuid = cypherKeeper.skuid;
  const cypher2 = `match (n:Store${stroeid} {shopid:'${skuid}'})-[r:rule]-(m:Store${stroeid}) return r order by r.suport desc limit 1`;
  swgraph.searchnew(cypher2);
  /*
   var elem = document.getElementById(swgraph.graph.containerId);
   if (!document.fullscreenElement &&    // alternative standard method
   !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
   if (elem.requestFullscreen) {
   elem.requestFullscreen();
   } else if (elem.msRequestFullscreen) {
   elem.msRequestFullscreen();
   } else if (elem.mozRequestFullScreen) {
   elem.mozRequestFullScreen();
   } else if (elem.webkitRequestFullscreen) {
   elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
   }
   //$(elem).width(document.body.clientWidth);
   }else{
   if (document.exitFullscreen) {
   document.exitFullscreen();
   } else if (document.msExitFullscreen) {
   document.msExitFullscreen();
   } else if (document.mozCancelFullScreen) {
   document.mozCancelFullScreen();
   } else if (document.webkitExitFullscreen) {
   document.webkitExitFullscreen();
   }
   }
   */
};

// GRAPH -----------------------------------------------------------------------------------------------------------
swgraph.graph = {};
swgraph.graph.containerId = 'swgraph-graph';
swgraph.graph.hasGraphChanged = true;
swgraph.graph.type = Object.freeze({PARENT: 0, CHILD: 1});// 0:所有 1：子图
swgraph.graph.zoom = d3.behavior.zoom().scaleExtent([0.1, 10]);
swgraph.graph.WHEEL_ZOOM_ENABLED = true;
swgraph.graph.TOOL_TAXONOMY = 'Show/hide taxonomy panel';
swgraph.graph.TOOL_CENTER = 'Center view';
swgraph.graph.TOOL_FULL_SCREEN = 'Full screen';
swgraph.graph.TOOL_RESET = 'Reset graph';

swgraph.graph.createGraphArea = function () {
  // hth20160812****************放在此处有效。放在linkSwitch的上面那里是无效的！不会被运行！
  d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')

    // 以下部分写在样式表内无法读取？hth20160812
    .style('opacity', 0.0)
    .style('position', 'absolute')
    .style('width', 'auto')
    .style('height', 'auto')
    .style('text-align', 'left')
    .style('font-size', '14px')
    .style('border', '1px solid black')
    .style('border-radius', '5px')
    .style('background-color', 'gray')
    .style('color', 'white')
    .style('visibility', 'hidden')
    .style('padding', '5px 10px 5px 10px');

  const htmlContainer = d3.select('#' + swgraph.graph.containerId);
  const toolbar = htmlContainer
    .append('div')
    .attr('class', 'ppt-toolbar');
  if (swgraph.tools.RESET_GRAPH) {
    toolbar.append('span')
      .attr('id', 'swgraph-reset-menu')
      .attr('class', 'ppt-menu reset')
      .attr('title', swgraph.graph.TOOL_RESET)
      .on('click', swgraph.tools.reset);
  }
  if (swgraph.taxonomy.isActive && swgraph.tools.TOGGLE_TAXONOMY) {
    toolbar.append('span')
      .attr('id', 'swgraph-taxonomy-menu')
      .attr('class', 'ppt-menu taxonomy')
      .attr('title', swgraph.graph.TOOL_TAXONOMY)
      .on('click', swgraph.tools.toggleTaxonomy);
  }
  if (swgraph.tools.CENTER_GRAPH) {
    toolbar.append('span')
      .attr('id', 'swgraph-center-menu')
      .attr('class', 'ppt-menu center')
      .attr('title', swgraph.graph.TOOL_CENTER)
      .on('click', swgraph.tools.center);
  }
  if (swgraph.tools.TOGGLE_FULL_SCREEN) {
    toolbar.append('span')
      .attr('id', 'swgraph-fullscreen-menu')
      .attr('class', 'ppt-menu fullscreen')
      .attr('title', swgraph.graph.TOOL_FULL_SCREEN)
      .on('click', swgraph.tools.toggleFullScreen);
  }
  const svgTag = htmlContainer.append('svg').call(swgraph.graph.zoom.on('zoom', swgraph.graph.rescale));
  svgTag.on('dblclick.zoom', null)
    .attr('class', 'ppt-svg-graph')
    .on('mousedown', swgraph.graph.node.mouseDownNode);
  if (!swgraph.graph.WHEEL_ZOOM_ENABLED) {
    // Disable mouse wheel events.
    svgTag.on('wheel.zoom', null)
      .on('mousewheel.zoom', null);
  }
  swgraph.graph.svg = svgTag.append('svg:g');
  swgraph.graph.svg.append('g').attr('id', swgraph.graph.link.gID);
  swgraph.graph.svg.append('g').attr('id', swgraph.graph.node.gID);

  // var arrow='M 0 0 L 10 5 L 0 10 Z';
  const defs = svgTag.append('svg:defs');
  const marker = defs.append('svg:marker')
    .attr('id', 'arrow')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 40)
    .attr('refY', 5)
    .attr('orient', 'auto');
  // const arrowpath = marker.append('svg:path')
  marker.append('svg:path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
    .attr('fill', '#444444');

  const marker3 = defs.append('svg:marker')
    .attr('id', 'arrow3')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 40)
    .attr('refY', 3)
    .attr('orient', 'auto');
  marker3.append('svg:path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
    .attr('fill', '#444444');

  const marker7 = defs.append('svg:marker')
    .attr('id', 'arrow7')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 40)
    .attr('refY', 7)
    .attr('orient', 'auto');
  marker7.append('svg:path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
    .attr('fill', '#444444');

  window.addEventListener('resize', swgraph.graph.centerRootNode);
};
/*
 swgraph.graph.centerRootNode = function () {
 swgraph.graph.getRootNode().px = swgraph.graph.getSVGWidth() / 2;
 swgraph.graph.getRootNode().py = swgraph.graph.getSVGHeight() / 2;
 swgraph.update();
 };
 */
swgraph.graph.getSVGWidth = function () {
  if (typeof swgraph.graph.svg === 'undefined' || swgraph.graph.svg.empty()) {
    swgraph.logger.debug('swgraph.graph.svg is undefined or empty.');
    return 0;
  } else {
    return document.getElementById(swgraph.graph.containerId).clientWidth;
  }
};
swgraph.graph.getSVGHeight = function () {
  if (typeof swgraph.graph.svg === 'undefined' || swgraph.graph.svg.empty()) {
    swgraph.logger.debug('swgraph.graph.svg is undefined or empty.');
    return 0;
  } else {
    return document.getElementById(swgraph.graph.containerId).clientHeight;
  }
};
swgraph.graph.rescale = function () {
  const trans = d3.event.translate;
  const scale = d3.event.scale;
  swgraph.graph.svg.attr('transform', `translate(${trans}) scale(${scale})`);
};

/*************************************************************
 * Default parameters used to configure D3.js force layout.
 * These parameter can be modified to change graph behavior.
 ************************************************************/
swgraph.graph.LINK_DISTANCE = 1600; // 150;
swgraph.graph.LINK_STRENGTH = 1;
swgraph.graph.FRICTION = 0.9; // 0.8;
swgraph.graph.CHARGE = -500;// -1400;
swgraph.graph.THETA = 0.8;// 0.8;
swgraph.graph.GRAVITY = 0.1;// 0.0;

swgraph.graph.rootNodeAddListeners = [];
swgraph.graph.nodeExpandRelationsipListeners = [];

swgraph.graph.createForceLayout = function () {
  swgraph.graph.force = d3.layout.force()
    .size([swgraph.graph.getSVGWidth(), swgraph.graph.getSVGHeight()])

    // 以下为结合方法
    .linkDistance(function (d) {
      // console.log(d.source.communityrule1)
      // console.log(d)
      if (d.source.hasOwnProperty('communityrule1')) {
        // console.log(rulePRKeeper)
        const maxrulePR = Math.max.apply(this, rulePRKeeper);
        const minrulePR = Math.min.apply(this, rulePRKeeper);
        const rulePRLinear = d3.scale.linear()
          .domain([minrulePR, maxrulePR])
          .range([5, 50]);
        const mindistance = Math.round(rulePRLinear(d.source.rulePR)) + Math.round(rulePRLinear(d.target.rulePR))
        // console.log(mindistance)
        const distance = 0.6 / Number(d.properties.suport);// suport越大，关系越紧密，距离distance越近
        if (distance < swgraph.graph.LINK_DISTANCE) {
          return (distance < mindistance) ? mindistance : distance;
        } else {
          return swgraph.graph.LINK_DISTANCE;
        }
      } else {
        return swgraph.graph.LINK_DISTANCE;
      }
    })
    .linkStrength(function (d) {
      if (d.linkStrength) {
        return d.linkStrength;
      } else {
        return swgraph.graph.LINK_STRENGTH;
      }
    })
    .friction(swgraph.graph.FRICTION)
    .charge(function (d) {
      if (d.charge) {
        return d.charge;
      } else {
        return swgraph.graph.CHARGE;
      }
    })
    .theta(swgraph.graph.THETA)
    .gravity(swgraph.graph.GRAVITY)
    .on('tick', swgraph.graph.tick); // Function called on every position update done by D3.js

  // Disable event propagation on drag to avoid zoom and pan issues
  swgraph.graph.force.drag()
    .on('dragstart', function (d) {
      // console.log(1222);
      d3.event.sourceEvent.stopPropagation();
      d.fixed = true;
    })
    .on('dragend', function (d) {
      // d3.event.sourceEvent.stopPropagation();
    })
    .on('drag', function (d, i) {
      // label_text_2.text('拖拽状态：进行中');
    });
};

swgraph.graph.on = function (event, listener) {
  // console.log(event);
  if (event === swgraph.graph.Events.NODE_ROOT_ADD) {
    swgraph.graph.rootNodeAddListeners.push(listener);
  }
  if (event === swgraph.graph.Events.NODE_EXPAND_RELATIONSHIP) {
    swgraph.graph.nodeExpandRelationsipListeners.push(listener);
  }
};

/*
 swgraph.graph.addRootNode = function (label) {
 if (swgraph.graph.force.nodes().length > 0) {
 swgraph.logger.debug('swgraph.graph.addRootNode is called but the graph is not empty.');
 }
 swgraph.graph.force.nodes().push({
 'id': '0',
 'type': swgraph.graph.node.NodeTypes.ROOT,
 'x': swgraph.graph.getSVGWidth() / 2,
 'y': swgraph.graph.getSVGHeight() / 2,
 'label': label,
 'fixed': true,
 'internalLabel': swgraph.graph.node.generateInternalLabel(label)
 });
 swgraph.graph.rootNodeAddListeners.forEach(function (listener) {
 listener(swgraph.graph.getRootNode());
 });
 };
 */
swgraph.graph.getRootNode = function () {
  return swgraph.graph.force.nodes()[0];
};
swgraph.graph.findNode = function (nodeid) {
  const nodes = swgraph.graph.force.nodes();
  for (let i in nodes) {
    if (nodes[i]['id'] === nodeid) return nodes[i];
  }
  return null;
};
swgraph.graph.tick = function () {
  /* eslint-disable no-whitespace-before-property */
  swgraph.graph.svg.selectAll(`#${swgraph.graph.link.gID}> g`)
    .selectAll('path')
    .attr('fill', 'none')
    .attr('d', function (d) {
      return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
    }) .filter(function (d) {
      return !swgraph.graph.link.nodirection.has(d.relation);
    }).attr('marker-end', function (d) {
      let urlArrow = 'url(#arrow)';
      switch (d.count) {
        case 2:
          urlArrow = 'url(#arrow3)';
          break;
        case 3:
          urlArrow = 'url(#arrow7)';
          break;
        default:
          urlArrow = 'url(#arrow)';
          break;
      }
      return urlArrow;
    });
  swgraph.graph.svg.selectAll('#' + swgraph.graph.node.gID + ' > g')
    .attr('transform', function (d) {
      // console.log('translate(' + (d.x) + ',' + (d.y) + ')');
      return 'translate(' + (d.x) + ',' + (d.y) + ')';
    });
  swgraph.graph.svg.selectAll('text.ppt-link-text-relation')
    .attr('x', function (d) {
      return (d.source.x + d.target.x) / 2;
    })
    .attr('y', function (d) {
      return (d.source.y + d.target.y) / 2;
    });
};
// LINKS -----------------------------------------------------------------------------------------------------------
swgraph.graph.link = {};
swgraph.graph.link.RADIUS = 25;
swgraph.graph.link.gID = 'swgraph-glinks';
swgraph.graph.link.nodirection = d3.set(['同时借']);

swgraph.graph.link.LinkTypes = Object.freeze({RELATION: 0, VALUE: 1});
swgraph.graph.link.structure = [];

swgraph.graph.link.updateLinks = function () {
  swgraph.graph.link.svgLinkElements = swgraph.graph.svg.select('#' + swgraph.graph.link.gID).selectAll('g');
  swgraph.graph.link.updateData();
  swgraph.graph.link.removeElements();
  swgraph.graph.link.addNewElements();
  swgraph.graph.link.updateElements();
};
swgraph.graph.link.updateData = function () {
  swgraph.graph.link.svgLinkElements = swgraph.graph.link.svgLinkElements.data(swgraph.graph.force.links(), function (d) {
    return d.id;
  });
};
swgraph.graph.link.removeElements = function () {
  swgraph.graph.link.svgLinkElements.exit().remove();
};
swgraph.graph.link.addNewElements = function () {
  const newLinkElements = swgraph.graph.link.svgLinkElements.enter().append('g')
    .attr('class', 'ppt-glink')
    .on('mouseover', swgraph.graph.link.mouseOverLink)
    .on('mouseout', swgraph.graph.link.mouseOutLink)
    .call(swgraph.graph.force.drag);
  /* .filter(function(d){
   return d.properties.weight>1;
   }) */

  newLinkElements.append('path')
    .attr('id', function (d) {
      return 'path' + d.source.id;
    })
    .attr('stroke', '#7f8c8d')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1)
    .filter(function (d) {
      return !swgraph.graph.link.nodirection.has(d.relation);
    }).attr('marker-end', 'url(#arrow)');

  newLinkElements.append('text')
    .attr('class', 'linetext')
    .attr('dy', '4')
    .attr('text-anchor', 'middle')
    .attr('pointer-events', 'none')
    .attr('fill', '#68BDF6')
    .attr('font-size', '11px')
    .text(function (d) {
      // console.log(d)
      return d.properties.suport || ' ';
    });
};

swgraph.graph.link.updateElements = function () {
  swgraph.graph.link.svgLinkElements
    .attr('id', function (d) {
      return 'ppt-glink_' + d.id;
    });
  swgraph.graph.link.svgLinkElements.selectAll('path')
    .attr('id', function (d) {
      return 'ppt-path_' + d.id
    })
    .attr('class', function (d) {
      if (d.type === swgraph.graph.link.LinkTypes.VALUE) {
        return 'ppt-link-value';
      } else {
        if (d.target.count === 0) {
          return 'ppt-link-relation disabled';
        } else {
          if (d.target.value !== undefined) {
            return 'ppt-link-relation value';
          } else {
            return 'ppt-link-relation';
          }
        }
      }
    });

  swgraph.graph.link.svgLinkElements.selectAll('text')
    .attr('id', function (d) {
      return 'ppt-text_' + d.id
    })
    .attr('class', function (d) {
      if (d.type === swgraph.graph.link.LinkTypes.VALUE) {
        return 'ppt-link-text-value';
      } else {
        if (d.target.count === 0) {
          return 'ppt-link-text-relation disabled';
        } else {
          if (d.target.value !== undefined) {
            return 'ppt-link-text-relation value';
          } else {
            return 'ppt-link-text-relation';
          }
        }
      }
    })
    .selectAll('.ppt-textPath')
    .attr('id', function (d) {
      return 'ppt-textpath_' + d.id
    })
    .attr('xlink:href', function (d) {
      return '#ppt-path_' + d.id
    })
    .text(function (d) {
      return swgraph.provider.getLinkTextValue(d);
    });
};

swgraph.graph.link.mouseOverLink = function (d) {
  d3.select(this).select('path').classed('ppt-link-hover', true);
  d3.select(this).select('text').classed('ppt-link-hover', true);

  // const hoveredLink = d3.select(this).data()[0];
  // hth20160809以下增加提示框显示相关代码
  const tooltip = d3.select('.tooltip');

  if (d.properties.hasOwnProperty('lift')) {
    const lift = Number(d.properties.lift);
    const confidence = Number(d.properties.confidence);
    const suport = Number(d.properties.suport);
    tooltip.html(
      'lift:' + lift.toFixed(6) + '<br/>' + 'confidence:' + confidence.toFixed(6) + '<br/>' + 'suport:' + suport.toFixed(6)
    ).transition()
      .style('left', (d3.event.pageX) + 'px')
      .style('top', (d3.event.pageY + 30) + 'px')
      .style('visibility', 'visible')
      .style('opacity', 1.0);
  } else {
    tooltip.html(
      'lift:' + '<br/>' + 'confidence:' + '<br/>' + 'suport:'
    ).transition()
      .style('left', (d3.event.pageX) + 'px')
      .style('top', (d3.event.pageY + 30) + 'px')
      .style('visibility', 'visible')
      .style('opacity', 1.0);
  }
};

swgraph.graph.link.mouseOutLink = function () {
  d3.select(this).select('path').classed('ppt-link-hover', false);
  d3.select(this).select('text').classed('ppt-link-hover', false);

  // const hoveredLink = d3.select(this).data()[0];
  // hth20160809以下增加提示框显示相关代码
  const tooltip = d3.select('.tooltip');
  tooltip.transition()
    .style('opacity', 0.0)
    .style('visibility', 'hidden');
};
swgraph.graph.link.isHasSvgRelElement = function (SvgLinkElement) {
  // var flag=false;
  let iflag = 1;
  swgraph.graph.force.links().forEach(function (item) {
    if (swgraph.graph.link.nodirection.has(item.relation)) {
      if ((SvgLinkElement.startNode === item.target.id && SvgLinkElement.endNode === item.source.id) ||
        (SvgLinkElement.startNode === item.source.id && SvgLinkElement.endNode === item.target.id)) {
        // if (SvgLinkElement.startNode == item.source.id && SvgLinkElement.endNode == item.target.id) {
        if (SvgLinkElement.type === item.relation) {
          iflag = 0;
          return iflag;
        } else {
          iflag++;
        }
      }
    } else {
      if (SvgLinkElement.startNode === item.source.id && SvgLinkElement.endNode === item.target.id) {
        if (SvgLinkElement.type === item.relation) {
          iflag = 0;
          return iflag;
        } else {
          iflag++;
        }
      }
    }
  });
  // console.log(iflag);
  return iflag;
};
swgraph.graph.link.isHasSvgLinkElement = function (edage) {
  let flag = false;
  swgraph.graph.force.links().forEach(function (item) {
    // alert(JSON.stringify(item));
    if (edage.id === item.id) {
      flag = true;
      return flag;
    }
  });
  return flag;
};

// NODES -----------------------------------------------------------------------------------------------------------

swgraph.graph.node = {};
swgraph.graph.node.gID = 'swgraph-gnodes';
swgraph.graph.node.ELLIPSE_RX = 50;
swgraph.graph.node.ELLIPSE_RY = 25;
swgraph.graph.node.TEXT_Y = 5;
swgraph.graph.node.BACK_CIRCLE_R = 35;
swgraph.graph.node.NODE_MAX_CHARS = 11;

swgraph.graph.node.PAGE_SIZE = 10;
swgraph.graph.node.CountBox = {x: 16, y: 33, w: 52, h: 19};

swgraph.graph.node.chooseWaiting = false;

/**
 * Defines the list of possible nodes.
 * ROOT: Node used as graph root. It is the target of the query. Only one node of this type should be available in graph.
 * CHOOSE: Nodes defining a generic node label. From these node is is possible to select a value or explore relations.
 * VALUE: Unique node containing a value constraint. Usually replace CHOOSE nodes once a value as been selected.
 * GROUP: Empty node used to group relations. No value can be selected but relations can be explored. These nodes doesn't have count.
 */
swgraph.graph.node.NodeTypes = Object.freeze({ROOT: 0, CHOOSE: 1, VALUE: 2, GROUP: 3});

// Variable used to generate unique id for each new nodes.
swgraph.graph.node.idgen = 0;

// Used to generate unique internal labels used for example as identifier in Cypher query.
swgraph.graph.node.internalLabels = {};

swgraph.graph.node.structure = [];

/**
 * TODO 点击节点展示菜单
 *
 * @param clickedNode
 */

swgraph.graph.node.MenuOpen = false;
swgraph.graph.node.menuSymbol = [];
swgraph.graph.node.menu = [['移除', 1], ['选择', 1], ['关闭', 1]];

swgraph.graph.node.createMenu = function (clickedNode) {
  /* var clickedNode=d3.select(this).data()[0]; */
  const menuContainer = d3.select('#swgraph-gnode_' + clickedNode.id);
  // console.log(menuContainer.select('.swt-menu').length);
  if ($('.swt-menu').length > 0) {
    $('.swt-menu').remove();
  } else {
    // swgraph.graph.node.removeMenu();
    menuContainer.append('g')
      .attr('class', 'swt-menu');
    const pie = d3.layout.pie().value(function (d) {
      return d[1];
    });
    const menuData = pie(swgraph.graph.node.menu);
    const arc = d3.svg.arc()
      .innerRadius(30)
      .outerRadius(60);
    // const color = d3.scale.category20();
    const items = menuContainer
      .select('.swt-menu')
      .append('g')
      .attr('id', 'itemsContainer');
    /* .transition()
     .duration(400) */
    const ars = items.selectAll('g')
      .data(menuData)
      .enter()
      .append('g')
      .attr('class', 'item')
      .attr('id', function (d, i) {
        return 'item-' + i;
      })
      .attr('data-svg-origin', '100 100')
      .on('click', function (d, i) {
        return swgraph.graph.node.menuClick(clickedNode, i);
      });
    ars.append('path')
      .transition()
      .duration(400)
      .attr('class', 'sector')
      .attr('d', function (d) {
        return arc(d);
      });
    ars.append('text')
      .transition()
      .duration(400)
      .attr('transform', function (d) {
        const x = arc.centroid(d)[0];
        const y = arc.centroid(d)[1];
        return 'translate(' + x + ',' + y + ')';
      })
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d.data[0];
      })
  }
};
swgraph.graph.node.removeMenu = function () {
  $('.swt-menu').remove();
  // swtmenu.selectAll('*').remove();
};

swgraph.graph.node.attrMenu = function (clickedNode) {
  const menu = $('#swgraph-gnode_' + clickedNode.id + ' .swt-menu');
  if (!swgraph.graph.node.MenuOpen) {
    swgraph.graph.node.MenuOpen = true;
    $('.circledisplay').remove();
    $('.swt-menu').remove();
    createMenu();
  } else {
    swgraph.graph.node.MenuOpen = false;
    menu.attr('class', 'circledisplay');
  }
  function createMenu () {
    const menuContainer = d3.select('#swgraph-gnode_' + clickedNode.id);
    menuContainer.append('g')
      .attr('class', 'swt-menu');
    const pie = d3.layout.pie().value(d => d[1]);
    const menuData = pie(swgraph.graph.node.menu);

    const arc = d3.svg.arc()
      .innerRadius(30)
      .outerRadius(60);
    // const color = d3.scale.category20();
    const items = menuContainer
      .select('.swt-menu')
      .append('g')
      .attr('id', 'itemsContainer');
    /* .transition()
     .duration(400) */
    const ars = items.selectAll('g')
      .data(menuData)
      .enter()
      .append('g')
      .attr('class', 'item')
      .attr('id', function (d, i) {
        return 'item-' + i;
      })
      .attr('data-svg-origin', '100 100')
      .on('click', function (d, i) {
        return swgraph.graph.node.menuClick(clickedNode, i);
      });

    ars.append('path')
      .transition()
      .duration(400)
      .attr('class', 'sector')
      .attr('d', function (d) {
        return arc(d);
      });
    ars.append('text')
      .transition()
      .duration(400)
      .attr('transform', function (d) {
        const x = arc.centroid(d)[0];
        const y = arc.centroid(d)[1];
        return 'translate(' + x + ',' + y + ')';
      })
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d.data[0];
      })
  }
};

swgraph.graph.node.generateInternalLabel = function (nodeLabel) {
  const label = nodeLabel.toLowerCase().replace(/ /g, '');
  if (label in swgraph.graph.node.internalLabels) {
    swgraph.graph.node.internalLabels[label] = swgraph.graph.node.internalLabels[label] + 1;
  } else {
    swgraph.graph.node.internalLabels[label] = 0;
    return label;
  }
  return label + swgraph.graph.node.internalLabels[label];
};

swgraph.graph.node.updateNodes = function () {
  /* if (!swgraph.graph.node.svgNodeElements) {
   swgraph.graph.node.svgNodeElements = swgraph.graph.svg.select('#' + swgraph.graph.node.gID).selectAll('g');
   } */
  swgraph.graph.node.svgNodeElements = swgraph.graph.svg.select('#' + swgraph.graph.node.gID).html('').selectAll('g');
  swgraph.graph.node.updateData();
  swgraph.graph.node.removeElements();
  swgraph.graph.node.addNewElements();
  swgraph.graph.node.updateElements();
};

swgraph.graph.node.updateData = function () {
  swgraph.graph.node.svgNodeElements = swgraph.graph.node.svgNodeElements.data(swgraph.graph.force.nodes(), function (d) {
    return d.id;
  });

  if (swgraph.graph.hasGraphChanged) {
    // swgraph.graph.node.updateCount();
    swgraph.graph.hasGraphChanged = false;
  }
};
swgraph.graph.node.removeElements = function () {
  // const toRemove = swgraph.graph.node.svgNodeElements.exit().remove(); // 删除多余的元素
  swgraph.graph.node.svgNodeElements.exit().remove(); // 删除多余的元素
};
swgraph.graph.node.addNewElements = function () {
  const gNewNodeElements = swgraph.graph.node.svgNodeElements.enter()
    .append('g')
    .on('dblclick', swgraph.graph.node.nodedblClick)
    .on('click', swgraph.graph.node.nodeClick)
    .on('mouseover', swgraph.graph.node.mouseOverNode)
    .on('mouseout', swgraph.graph.node.mouseOutNode)
    // .on('click',swgraph.graph.node.createmenu)
    .on('mousedown', swgraph.graph.node.mouseDownNode)
    .on('contextmenu', swgraph.graph.node.clearSelection)
    .call(swgraph.graph.force.drag);

  // Add right click on all nodes except value
  /*
   gNewNodeElements.filter(function (d) {
   return d.type !== swgraph.graph.node.NodeTypes.VALUE;
   }).on('contextmenu', swgraph.graph.node.clearSelection);
   */
  // Disable right click context menu on value nodes
  /*
   gNewNodeElements.filter(function (d) {
   return d.type === swgraph.graph.node.NodeTypes.VALUE;
   }).on('contextmenu', function () {
   // Disable context menu on
   d3.event.preventDefault();
   });
   */
  // Most browser will generate a tooltip if a title is specified for the SVG element
  // TODO Introduce an SVG tooltip instead?
  gNewNodeElements.append('title').attr('class', 'ppt-svg-title');

  // Nodes are composed of 3 layouts and skeleton are created here.
  swgraph.graph.node.addBackgroundElements(gNewNodeElements);
  swgraph.graph.node.addMiddlegroundElements(gNewNodeElements);
  swgraph.graph.node.addForegroundElements(gNewNodeElements);
};
swgraph.graph.node.addBackgroundElements = function (gNewNodeElements) {
  const background = gNewNodeElements
    .append('g')
    .attr('class', 'ppt-g-node-background');
  background.append('circle')
    .attr('class', function (d) {
      let cssClass = 'ppt-node-background-circle value';
      if (d.value !== undefined) {
        cssClass = cssClass + ' selected-value';
      } else if (d.type === swgraph.graph.node.NodeTypes.ROOT) {
        cssClass = cssClass + ' root';
      } else if (d.type === swgraph.graph.node.NodeTypes.CHOOSE) {
        cssClass = cssClass + ' choose';
      } else if (d.type === swgraph.graph.node.NodeTypes.VALUE) {
        cssClass = cssClass + ' value';
      } else if (d.type === swgraph.graph.node.NodeTypes.GROUP) {
        cssClass = cssClass + ' group';
      }
      return cssClass;
    })
    .style('fill-opacity', 0)
    .attr('fill', '#FFE599')
    .attr('r', swgraph.graph.node.BACK_CIRCLE_R);
};
swgraph.graph.node.addMiddlegroundElements = function (gNewNodeElements) {
  // const middle = gNewNodeElements
  gNewNodeElements
    .append('g')
    .attr('class', 'ppt-g-node-middleground');
};
swgraph.graph.node.addForegroundElements = function (gNewNodeElements) {
  const foreground = gNewNodeElements
    .append('g')
    .style('display', 'none')
    .attr('class', 'ppt-g-node-foreground');
  const gRelationship = foreground.append('g').attr('class', 'ppt-rel-plus-icon');
  /*
   gRelationship.append('title')
   .text('Add relationship');
   */
  gRelationship
    .append('circle')
    .attr('class', 'ppt-rel-plus-background')
    .attr('cx', '23.5')
    .attr('cy', '-33')
    .attr('r', '11');
  gRelationship
    .append('path')
    .attr('class', 'ppt-rel-plus-path')
    // .attr('d', 'M 40,-45 35,-45 35,-50 30,-50 30,-45 25,-45 25,-40 30,-40 30,-35 35,-35 35,-40 40,-40 z');
    // .attr('d', 'M 30,-35 25,-35 25,-40 20,-40 20,-35 15,-35 15,-30 20,-30 20,-25 25,-25 25,-30 30,-30 z');
    .attr('d', 'M 28,-35 25,-35 25,-38 22,-38 22,-35 19,-35 19,-32 22,-32 22,-29 25,-29 25,-32 28,-32 z');
  gRelationship
    .on('mouseover', function () {
      d3.select(this).select('.ppt-rel-plus-background').transition().style('fill-opacity', 0.5);
    })
    .on('mouseout', function () {
      d3.select(this).select('.ppt-rel-plus-background').transition().style('fill-opacity', 0);
    })
    .on('click', function () {
      d3.event.stopPropagation(); // To avoid click event on svg element in background
      swgraph.graph.node.expandRelationship.call(this);
    });
  const gMinusRelationship = foreground.append('g').attr('class', 'ppt-rel-minus-icon');
  gMinusRelationship.append('title')
    .text('Remove relationship');
  gMinusRelationship
    .append('circle')
    .attr('class', 'ppt-rel-minus-background')
    .attr('cx', '25')
    .attr('cy', '-33.5')
    .attr('r', '11');
  gMinusRelationship
    .append('path')
    .attr('class', 'ppt-rel-minus-path')
    // .attr('d', 'M 40,-45 25,-45 25,-40 40,-40 z');
    .attr('d', 'M 29,-35 21,-35 21,-32 29,-32 z');

  gMinusRelationship
    .on('mouseover', function () {
      d3.select(this).select('.ppt-rel-minus-background').transition().style('fill-opacity', 0.5);
    })
    .on('mouseout', function () {
      d3.select(this).select('.ppt-rel-minus-background').transition().style('fill-opacity', 0);
    })
    .on('click', function () {
      d3.event.stopPropagation(); // To avoid click event on svg element in background
      swgraph.graph.node.collapseRelationship.call(this);
    });
};
swgraph.graph.node.updateElements = function () {
  swgraph.graph.node.svgNodeElements.attr('id', function (d) {
    return 'swgraph-gnode_' + d.id;
  });
  swgraph.graph.node.svgNodeElements
    .selectAll('.ppt-svg-title')
    .text(function (d) {
      // TODO add new property in config to truncate text and not directly in getTextValue to avoid truncated text in title?
      return swgraph.provider.getTextValue(d);
    });

  swgraph.graph.node.svgNodeElements.filter(function (n) {
    return n.type !== swgraph.graph.node.NodeTypes.ROOT
  });
  // .call(swgraph.graph.force.drag);

  swgraph.graph.node.updateBackgroundElements();
  swgraph.graph.node.updateMiddlegroundElements();
  swgraph.graph.node.updateForegroundElements();
};
swgraph.graph.node.updateBackgroundElements = function () {
  swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-background')
    .selectAll('.ppt-node-background-circle')
    .attr('class', function (d) {
      let cssClass = 'ppt-node-background-circle value';
      if (d.type === swgraph.graph.node.NodeTypes.VALUE) {
        cssClass = cssClass + ' value';
      } else if (d.type === swgraph.graph.node.NodeTypes.GROUP) {
        cssClass = cssClass + ' group';
      } else {
        if (d.value !== undefined) {
          if (d.type === swgraph.graph.node.NodeTypes.ROOT) {
            cssClass = cssClass + ' selected-root-value';
          } else if (d.type === swgraph.graph.node.NodeTypes.CHOOSE) {
            cssClass = cssClass + ' selected-value';
          }
        } else {
          if (d.count === 0) {
            cssClass = cssClass + ' disabled';
          } else {
            if (d.type === swgraph.graph.node.NodeTypes.ROOT) {
              cssClass = cssClass + ' root';
            } else if (d.type === swgraph.graph.node.NodeTypes.CHOOSE) {
              cssClass = cssClass + ' choose';
            }
          }
        }
      }
      return cssClass;
    })
    .attr('r', swgraph.graph.node.BACK_CIRCLE_R);
};
swgraph.graph.node.updateMiddlegroundElements = function () {
  const middleG = swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-middleground');
  middleG.selectAll('*').remove();
  // 图片
  const imageMiddle = middleG.filter(function (d) {
    return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.IMAGE;
  }).append('image').attr('class', 'ppt-node-image');
  imageMiddle
    .attr('width', function (d) {
      return swgraph.provider.getImageWidth(d);
    })
    .attr('height', function (d) {
      return swgraph.provider.getImageHeight(d);
    })
    // Center the image on node
    .attr('transform', function (d) {
      return 'translate(' + (-swgraph.provider.getImageWidth(d) / 2) + ',' + (-swgraph.provider.getImageHeight(d) / 2) + ')';
    })
    .attr('xlink:href', function (d) {
      return swgraph.provider.getImagePath(d);
    });

  // 文字
  // var ellipseMiddle =
  middleG.filter(function (d) {
    return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
  }).append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('fill', '#999999')
    .attr('stroke', '#5CA8DB')
    .attr('stroke-width', '2px')
    .style('fill-opacity', 1)
    .attr('r', '25')
    .transition()
    .duration(2000);

  switch (swgraph.eventType) {
    case swgraph.algorithm.type.UNUSUAL:
      middleG.selectAll('circle').filter(function (d) {
        return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
      }).filter(function (d) {
        return swgraph.algorithm.UNUSUAL.hitNodes.indexOf(d.id) >= 0;
      }).attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', '#FFA500')
        .attr('stroke', '#5CA8DB')
        .attr('stroke-width', '2px')
        .style('fill-opacity', 1)
        .transition()
        .duration(2000);
      break;
    case swgraph.algorithm.type.TRIANGLE:
      // console.log('test'+swgraph.eventType);
      middleG.selectAll('circle').filter(function (d) {
        return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
      }).filter(function (d) {
        return swgraph.algorithm.Triangle.hitNodes.indexOf(d.id) >= 0;
      }).attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', '#FFA500')
        .attr('stroke', '#5CA8DB')
        .attr('stroke-width', '2px')
        .style('fill-opacity', 1)
        .transition()
        .duration(2000);
      break;
    case swgraph.algorithm.type.PAGERANK:
      middleG.selectAll('circle').filter(function (d) {
        return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
      }).filter(function (d) {
        // console.log(swgraph.algorithm.PAGERANK.hitNodes)
        return swgraph.algorithm.PAGERANK.hitNodes.indexOf(d.id) >= 0;
      }).attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', '#FFA500')
        .attr('stroke', '#5CA8DB')
        .attr('stroke-width', '2px')
        .style('fill-opacity', 1)
        .transition()
        .duration(2000);
      break;
    case swgraph.algorithm.type.SHORTPATH:
      // console.log(swgraph.algorithm.SHORTPATH.hitNodes);
      middleG.selectAll('circle').filter(function (d) {
        return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
      }).filter(function (d) {
        return swgraph.algorithm.SHORTPATH.hitNodes.indexOf(d.id) >= 0;
      }).attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', '#FFA500')
        .attr('stroke', '#5CA8DB')
        .attr('stroke-width', '2px')
        .style('fill-opacity', 1)
        .transition()
        .duration(2000);
      break;
    default:
      middleG.selectAll('circle').filter(function (d) {
        return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
      }).attr('fill', function (d) {
        let color = '';
        if (typeof (d.book_type) !== 'undefined') {
          switch (d.book_type) {
            case '经济':
              color = swgraph.colors(0);
              break;
            case '自动化技术计算机技术':
              color = swgraph.colors(1);
              break;
            case '政法':
              color = swgraph.colors(2);
              break;
            case '历史地理':
              color = swgraph.colors(3);
              break;
            case '哲学宗教':
              color = swgraph.colors(4);
              break;
            case '文化':
              color = swgraph.colors(5);
              break;
            case '艺术':
              color = swgraph.colors(6);
              break;
            case '数理化':
              color = swgraph.colors(7);
              break;
            case '生物科学':
              color = swgraph.colors(8);
              break;
            case '机械仪表工业':
              color = swgraph.colors(9);
              break;
            case '社科':
              color = swgraph.colors(10);
              break;
            case '文学':
              color = swgraph.colors(11);
              break;
            case '语文文学':
              color = swgraph.colors(12);
              break;
            case '电子技术':
              color = swgraph.colors(13);
              break;
            case '综合性图书':
              color = swgraph.colors(14);
              break;
            case '能量与动力工程':
              color = swgraph.colors(15);
              break;
            case '天文地理':
              color = swgraph.colors(16);
              break;
            case '其他':
              color = swgraph.colors(17);
              break;
            default:
              color = swgraph.colors(18);
              break;
          }
        } else {
          // color = swgraph.colors(0);
          color = swgraph.provider.getCategoryColor(d.internalLabel);
        }
        /* console.log(d.internalLabel);
         console.log(color); */
        return color;
      })
        .attr('stroke', '#5CA8DB')
        .attr('stroke-width', '2px')
        .style('fill-opacity', 0.98)
        .attr('r', '25');
  }

  const svgMiddle = middleG.filter(function (d) {
    return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.SVG;
  }).append('g')
  // Add D3.js nested data with all paths required to render the svg element.
    .selectAll('path').data(function (d) {
      return swgraph.provider.getSVGPaths(d);
    });
  svgMiddle.exit().remove();
  svgMiddle.enter().append('path');
  middleG
    .selectAll('path')
    .attr('d', function (d) {
      return d.d;
    })
    .attr('class', function (d) {
      return d['class'];
    });
  // Update text
  const textMiddle = middleG.filter(function (d) {
    return swgraph.provider.isTextDisplayed(d);
  }).append('text')
    .attr('x', 0)
    .attr('y', swgraph.graph.node.TEXT_Y)
    .attr('font-size', '14px')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle');
  textMiddle
    .attr('y', swgraph.graph.node.TEXT_Y)
    .attr('class', function (d) {
      switch (d.type) {
        case swgraph.graph.node.NodeTypes.CHOOSE:
          if (d.value === undefined) {
            if (d.count === 0) {
              return 'ppt-node-text-choose disabled';
            } else {
              return 'ppt-node-text-choose';
            }
          } else {
            return 'ppt-node-text-choose selected-value';
          }
        case swgraph.graph.node.NodeTypes.GROUP:
          return 'ppt-node-text-group';
        case swgraph.graph.node.NodeTypes.ROOT:
          if (d.value === undefined) {
            if (d.count === 0) {
              return 'ppt-node-text-root disabled';
            } else {
              return 'ppt-node-text-root';
            }
          } else {
            return 'ppt-node-text-root selected-value';
          }
        case swgraph.graph.node.NodeTypes.VALUE:
          return 'ppt-node-text-value';
      }
    })
    .text(function (d) {
      if (swgraph.provider.isTextDisplayed(d)) {
        // console.log(swgraph.provider.getTextValue(d));
        // return d.label;
        // return swgraph.provider.getValueOrderByAttribute(d.label);
        // console.log(swgraph.provider.getConstraintAttribute(d.label));
        // return swgraph.provider.getConstraintAttribute(d.label);
        return swgraph.provider.getTextValue(d);
      } else {
        return '';
      }
    });
};
swgraph.graph.node.updateForegroundElements = function () {
  /*
   var gArrows = swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-foreground')
   .selectAll('.ppt-node-foreground-g-arrows');
   gArrows.classed('active', function (d) {
   return d.valueExpanded && d.data && d.data.length > swgraph.graph.node.PAGE_SIZE;
   });
   gArrows.selectAll('.ppt-larrow').classed('enabled', function (d) {
   return d.page > 1;
   });
   gArrows.selectAll('.ppt-rarrow').classed('enabled', function (d) {
   if (d.data) {
   var count = d.data.length;
   return d.page * swgraph.graph.node.PAGE_SIZE < count;
   } else {
   return false;
   }
   });
   var gForegrounds = swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-foreground');
   gForegrounds.selectAll('.ppt-count-box').filter(function (d) {
   return d.type !== swgraph.graph.node.NodeTypes.CHOOSE;
   }).classed('root', true);

   gForegrounds.selectAll('.ppt-count-box').filter(function (d) {
   return d.type === swgraph.graph.node.NodeTypes.CHOOSE;
   }).classed('value', true);

   gForegrounds.selectAll('.ppt-count-box').classed('disabled', function (d) {
   return d.count == 0;
   });

   gForegrounds.selectAll('.ppt-count-text')
   .text(function (d) {
   if (d.count != null) {
   return d.count;
   } else {
   return '...';
   }
   })
   .classed('disabled', function (d) {
   return d.count == 0;
   });
   */
  // Hide/Show plus icon (set disabled CSS class) if node already has been expanded.
  const gForegrounds = swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-foreground');
  gForegrounds.selectAll('.ppt-rel-plus-icon')
    .classed('disabled', function (d) {
      return d.expand === true;
    });
  gForegrounds.selectAll('.ppt-rel-minus-icon')
    .classed('disabled', function (d) {
      return d.expand === false;
    });
};

swgraph.graph.node.mouseOverNode = function () {
  d3.event.preventDefault();
  // const hoveredNode = d3.select(this).data()[0];
  d3.select(this).select('.ppt-g-node-background').selectAll('circle').transition().style('fill-opacity', 0.5);
  /*
   if (swgraph.queryviewer.isActive) {
   // Hover the node in query
   swgraph.queryviewer.queryConstraintSpanElements.filter(function (d) {
   return d.ref === hoveredNode;
   }).classed('hover', true);
   swgraph.queryviewer.querySpanElements.filter(function (d) {
   return d.ref === hoveredNode;
   }).classed('hover', true);
   }
   if (swgraph.cypherviewer.isActive) {
   swgraph.cypherviewer.querySpanElements.filter(function (d) {
   return d.node === hoveredNode;
   }).classed('hover', true);
   }
   */
};
swgraph.graph.node.mouseDownNode = function () {
  // d3.event.preventDefault();
  if (d3.event.button === 2) {
    // alert('你点了右键');
    let clickedNode = d3.select(this).data()[0];
    if (typeof (clickedNode) === 'undefined') {
      d3.event.preventDefault();
      // console.log(11111111111);
      swgraph.graph.node.removeMenu();
    } else {
      // console.log(clickedNode);
      swgraph.graph.node.removeMenu();
      swgraph.graph.node.createMenu(clickedNode);
    }
  }
};

swgraph.graph.node.mouseOutNode = function () {
  d3.event.preventDefault();
  // const hoveredNode = d3.select(this).data()[0];
  d3.select(this).select('.ppt-g-node-background').selectAll('circle').transition().style('fill-opacity', 0);
  /*
   if (swgraph.queryviewer.isActive) {
   // Remove hover class on node.
   swgraph.queryviewer.queryConstraintSpanElements.filter(function (d) {
   return d.ref === hoveredNode;
   }).classed('hover', false);
   swgraph.queryviewer.querySpanElements.filter(function (d) {
   return d.ref === hoveredNode;
   }).classed('hover', false);
   }

   if (swgraph.cypherviewer.isActive) {
   swgraph.cypherviewer.querySpanElements.filter(function (d) {
   return d.node === hoveredNode;
   }).classed('hover', false);
   }
   */
};
swgraph.graph.node.nodedblClick = function () {
  const clickedNode = d3.select(this).data()[0]; // Clicked node data
  swgraph.logger.debug('nodeClick (' + clickedNode.internalLabel + ')');
  clickedNode.expand = true;
  swgraph.graph.node.expandNode(clickedNode);
};
swgraph.graph.node.nodeClick = function () {
  const clickedNode = d3.select(this).data()[0];
  swgraph.result.updateResults(clickedNode);
  // swgraph.graph.node.createMenu(clickedNode);
  // swgraph.graph.node.attrMenu(clickedNode);
  // console.log(JSON.stringify(swgraph.algorithm.SHORTPATH.nodes));
};

swgraph.graph.node.menuClick = function (clickedNode, i) {
  d3.event.preventDefault();
  // const menu= $('#swgraph-gnode_' + clickedNode.id + ' .swt-menu');
  // menu.attr('class','circledisplay');
  swgraph.graph.node.MenuOpen = false;
  switch (i) {
    case 0 : // 移除
      swgraph.graph.node.removeNode(clickedNode, 0, 0);
      swgraph.update();
      // swgraph.selected.parseData(clickedNode);
      break;
    case 1 :// 选择
      // console.log('2');
      const len = swgraph.algorithm.SHORTPATH.nodes.length;
      if (len > 0) {
        if (swgraph.algorithm.SHORTPATH.nodes[len - 1] !== clickedNode.id) {
          swgraph.algorithm.SHORTPATH.nodes.push(clickedNode.id);
        }
        if (swgraph.algorithm.SHORTPATH.nodes.length > 2) {
          swgraph.algorithm.SHORTPATH.nodes = swgraph.algorithm.SHORTPATH.nodes.slice(
            swgraph.algorithm.SHORTPATH.nodes.length - 2, swgraph.algorithm.SHORTPATH.nodes.length);
        }
      } else {
        swgraph.algorithm.SHORTPATH.nodes.push(clickedNode.id);
      }
      break;
    default:break;
  }
  swgraph.graph.node.removeMenu();
};

swgraph.graph.node.collapseNode = function (clickedNode) {
  swgraph.graph.node.removeNode(clickedNode, 1, true);
  swgraph.update();
};

swgraph.graph.node.valueNodeClick = function (clickedNode) {
  swgraph.logger.debug('valueNodeClick (' + clickedNode.internalLabel + ')');
  clickedNode.parent.value = clickedNode;
  swgraph.result.hasChanged = true;
  swgraph.graph.hasGraphChanged = true;
  swgraph.graph.node.collapseNode(clickedNode.parent);
};

swgraph.graph.node.chooseNodeClick = function (clickedNode) {
  swgraph.logger.debug('chooseNodeClick (' + clickedNode.internalLabel + ') with waiting state set to ' + swgraph.graph.node.chooseWaiting);
  if (!swgraph.graph.node.chooseWaiting && !clickedNode.immutable) {
    // Collapse all expanded nodes first
    swgraph.graph.force.nodes().forEach(function (n) {
      if ((n.type === swgraph.graph.node.NodeTypes.ROOT || n.type === swgraph.graph.node.NodeTypes.CHOOSE) && n.valueExpanded) {
        swgraph.graph.node.collapseNode(n);
      }
    });
    // Set waiting state to true to avoid multiple call on slow query execution
    swgraph.graph.node.chooseWaiting = true;
    swgraph.logger.info('Values (' + clickedNode.internalLabel + ') ==> ');
    swgraph.rest.post(
      {
        'statements': [
          {
            'statement': swgraph.query.generateValueQuery(clickedNode)
          }
        ]
      })
      .done(function (data) {
        clickedNode.id = (++swgraph.graph.node.idgen);
        clickedNode.data = swgraph.graph.node.parseResultData(data);
        clickedNode.page = 1;
        swgraph.graph.node.expandNode(clickedNode);
        swgraph.graph.node.chooseWaiting = false;
      })
      .fail(function (xhr, textStatus, errorThrown) {
        swgraph.graph.node.chooseWaiting = false;
        swgraph.logger.error(textStatus + ': error while accessing Neo4j server on URL:\'' + swgraph.rest.CYPHER_URL + '\' defined in \'swgraph.rest.CYPHER_URL\' property: ' + errorThrown);
      });
  }
};

swgraph.graph.node.parseResultData = function (data) {
  const results = [];
  for (let x = 0; x < data.results[0].data.length; x++) {
    const obj = {};
    for (let i = 0; i < data.results[0].columns.length; i++) {
      obj[data.results[0].columns[i]] = data.results[0].data[x].row[i];
    }
    results.push(obj);
  }
  return results;
};
swgraph.graph.computeParentAngle = function (node) {
  let angleRadian = 0;
  const r = 100;
  if (node.parent) {
    const xp = node.parent.x;
    const yp = node.parent.y;
    const x0 = node.x;
    const y0 = node.y;
    const dist = Math.sqrt(Math.pow(xp - x0, 2) + Math.pow(yp - y0, 2));

    const k = r / (dist - r);
    const xc = (x0 + (k * xp)) / (1 + k);

    let val = (xc - x0) / r;
    if (val < -1) {
      val = -1;
    }
    if (val > 1) {
      val = 1;
    }
    angleRadian = Math.acos(val);
    if (yp > y0) {
      angleRadian = 2 * Math.PI - angleRadian;
    }
  }
  return angleRadian;
};

swgraph.graph.node.expandNode = function (clickedNode) {
  swgraph.rest.post(
    {
      'statements': [
        {
          'statement': 'start n= node(' + clickedNode.id + ') match (n)-[r]-(m) return n,r,m limit 50',
          'resultDataContents': ['graph']
        }]
    }).done(function (data) {
    // console.log(JSON.stringify(data));
    if (data.results.length > 0) {
      const mydata = data.results[0].data;
      mydata.forEach(function (item) {
        const gnodes = item.graph.nodes;
        const relations = item.graph.relationships;
        // var relnode={};
        gnodes.forEach(function (node) {
          // var itemdata=item[0].data;
          if (swgraph.graph.node.isHasSvgNodeElement(node) === false) {
            const subnode = node.properties;
            subnode['id'] = node.id;
            subnode['label'] = node.labels;
            subnode['status'] = 1;
            subnode['expand'] = false;
            subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
            subnode['internalLabel'] = node.labels[0];
            // subnode['internalLabel']=swgraph.graph.node.generateInternalLabel(node.labels[0]);
            // subnode['attr']=JSON.stringify(node.properties);
            swgraph.graph.force.nodes().push(subnode);
          }
        });
        relations.forEach(function (edge) {
          if (swgraph.graph.link.isHasSvgLinkElement(edge) === false) {
            let icount = swgraph.graph.link.isHasSvgRelElement(edge);
            if (icount > 0) {
              swgraph.graph.force.links().push({
                'source': swgraph.graph.findNode(edge.startNode),
                'target': swgraph.graph.findNode(edge.endNode),
                'id': edge.id,
                'relation': edge.type,
                'count': icount++,
                'properties': edge.properties
              });
            }
          }
          /* if(swgraph.graph.link.isHasSvgLinkElement(edge)==false && swgraph.graph.link.isHasSvgRelElement(edge)==false){
           swgraph.graph.force.links().push({'source':swgraph.graph.findNode(edge.startNode),'target':swgraph.graph.findNode(edge.endNode),'id':edge.id,'relation':edge.type,'properties':edge.properties});
           } */
        });
      });
      swgraph.update();
    }
  })
};

swgraph.graph.node.expandNode1 = function (clickedNode) {
  const lIndex = clickedNode.page * swgraph.graph.node.PAGE_SIZE;
  const sIndex = lIndex - swgraph.graph.node.PAGE_SIZE;
  const dataToAdd = clickedNode.data.slice(sIndex, lIndex);
  const parentAngle = swgraph.graph.computeParentAngle(clickedNode);
  let i = 1;
  dataToAdd.forEach(function (d) {
    let angleDeg;
    if (clickedNode.parent) {
      angleDeg = (((360 / (dataToAdd.length + 1)) * i));
    } else {
      angleDeg = (((360 / (dataToAdd.length)) * i));
    }
    let nx = clickedNode.x + (100 * Math.cos((angleDeg * (Math.PI / 180)) - parentAngle));
    let ny = clickedNode.y + (100 * Math.sin((angleDeg * (Math.PI / 180)) - parentAngle));
    const node = {
      'id': (++swgraph.graph.node.idgen),
      'parent': clickedNode,
      'attributes': d,
      'type': swgraph.graph.node.NodeTypes.VALUE,
      'label': clickedNode.internalLabel,
      'count': d.count,
      'x': nx,
      'y': ny,
      'internalID': d[swgraph.query.NEO4J_INTERNAL_ID.queryInternalName]
    };
    swgraph.graph.force.nodes().push(node);
    swgraph.graph.force.links().push(
      {
        id: 'l' + (++swgraph.graph.node.idgen),
        source: clickedNode,
        target: node,
        type: swgraph.graph.link.LinkTypes.VALUE
      }
    );
    i++;
  });

  // Pin clicked node and its parent to avoid the graph to move for selection, only new value nodes will blossom around the clicked node.
  clickedNode.fixed = true;
  if (clickedNode.parent && clickedNode.parent.type !== swgraph.graph.node.NodeTypes.ROOT) {
    clickedNode.parent.fixed = true;
  }
  // Change node state
  clickedNode.valueExpanded = true;
  swgraph.update();
};

swgraph.graph.node.expandRelationship = function () {
  // Prevent default right click event opening menu.
  d3.event.preventDefault();
  // Notify listeners
  swgraph.graph.nodeExpandRelationsipListeners.forEach(function (listener) {
    listener(this);
  });
  // Get clicked node.
  const clickedNode = d3.select(this).data()[0];
  clickedNode.expand = true;
  swgraph.graph.node.expandNode(clickedNode);
};
swgraph.graph.node.collapseRelationship = function () {
  d3.event.preventDefault();
  const clickedNode = d3.select(this).data()[0];
  clickedNode.expand = false;
  swgraph.graph.node.collapseNode(clickedNode);
};
/**
 * 删除节点
 * @param clickednode
 * @param type 删除节点方式，0：无向 1：有向
 * @param flag  bool类型 true：清除没有连线的节点， false：保留没有连线的节点
 */
swgraph.graph.node.removeNode = function (clickednode, type, flag) {
  // const linksToDelete = [];
  const childNodes = [clickednode];
  const remove = function (node) {
    const length = swgraph.graph.force.links().length;
    for (let i = length - 1; i >= 0; i--) {
      try {
        if (swgraph.graph.force.links()[i]['source'] === node) {
          const target = swgraph.graph.force.links()[i]['target'];
          swgraph.graph.force.links().splice(i, 1);
          // console.log(swgraph.graph.force.nodes().indexOf(node));
          remove(target);
        }
      } catch (e) {
        console.log(e);
      }
    }
    swgraph.graph.force.nodes().filter(function () {
      return node !== clickednode;
    }).splice(swgraph.graph.force.nodes().indexOf(node), 1);
  };
  if (type === 1) {
    childNodes.forEach(function (inode) {
      remove(inode);
    });
  } else {
    // swgraph.graph.force.nodes().splice(swgraph.graph.force.nodes().indexOf(clickednode), 1);
    const linksToRemove = swgraph.graph.force.links().filter(function (l) {
      return (l.source === clickednode || l.target === clickednode);
    });
    // Remove links from model
    for (let i = swgraph.graph.force.links().length - 1; i >= 0; i--) {
      if (linksToRemove.indexOf(swgraph.graph.force.links()[i]) >= 0) {
        swgraph.graph.force.links().splice(i, 1);
      }
    }
    swgraph.graph.force.nodes().splice(swgraph.graph.force.nodes().indexOf(clickednode), 1);
  }
  // 清除没有连线的节点
  if (flag === true) {
    for (let i = swgraph.graph.force.nodes().length - 1; i >= 0; i--) {
      let haveFoundNode = false;
      for (let j = 0, l = swgraph.graph.force.links().length; j < l; j++) {
        if ((swgraph.graph.force.links()[j]['source'] === swgraph.graph.force.nodes()[i] ||
          swgraph.graph.force.links()[j]['target'] === swgraph.graph.force.nodes()[i]) ||
          swgraph.graph.force.nodes()[i] === clickednode) {
          haveFoundNode = true
        }
      }
      /* if(swgraph.graph.force.nodes()[i]==clickednode){
       console.log(haveFoundNode);
       } */
      !haveFoundNode && swgraph.graph.force.nodes().splice(i, 1);
    }
  }
};

swgraph.graph.node.clearSelection = function () {
  d3.event.preventDefault();
  const clickedNode = d3.select(this).data()[0];
  swgraph.graph.force.nodes().forEach(function (n) {
    if ((n.type === swgraph.graph.node.NodeTypes.CHOOSE || n.type === swgraph.graph.node.NodeTypes.ROOT) && n.valueExpanded) {
      swgraph.graph.node.collapseNode(n);
    }
  });
  if (clickedNode.value !== null && !clickedNode.immutable) {
    delete clickedNode.value;
    swgraph.result.hasChanged = true;
    swgraph.graph.hasGraphChanged = true;
    swgraph.update();
  }
};

/* swgraph.graph.node.createmenu=function(){
 var clickedNode = d3.select(this).data()[0];
 console.log(d3.select(this)[0]);
 var dataset=[25,25,25,25];
 var w=200,h=200;
 var outerRadius=w/2;
 var innerRadius=w/4;
 var arc=d3.svg.arc()
 .innerRadius(innerRadius)
 .outerRadius(outerRadius);
 var color=d3.scale.category10();
 var pie=d3.layout.pie();
 var arcs=d3.select(this).append('g')
 .data(pie(dataset))
 .enter()
 .append('g')
 .attr('transform','translate('+outerRadius+','+outerRadius+')');
 arcs.append('path')
 .attr('fill',function(d,i){
 return color(i);
 })
 .attr('d',function(d){
 return arc(d);
 })
 }; */
swgraph.graph.node.isHasSvgNodeElement = function (NodeElement) {
  let flag = false;
  swgraph.graph.force.nodes().forEach(function (item) {
    // alert(JSON.stringify(item));
    if (NodeElement.id === item.id) {
      flag = true;
      return flag;
    }
  });
  return flag;
};

// QUERY VIEWER -----------------------------------------------------------------------------------------------------

// QUERY ------------------------------------------------------------------------------------------------------------
swgraph.query = {};
/**
 * Define the number of results displayed in result list.
 */
swgraph.query.RESULTS_PAGE_SIZE = 500;
swgraph.query.RESULTS_PAGE_INDEX = 0;// 设置当前PSGE的索引号
swgraph.query.VALUE_QUERY_LIMIT = 1000;
swgraph.query.USE_PARENT_RELATION = false;
swgraph.query.USE_RELATION_DIRECTION = false;

swgraph.query.NEO4J_INTERNAL_ID = Object.freeze({queryInternalName: 'NEO4JID'});
swgraph.query.filterRelation = function (d) {
  return true;
};
swgraph.query.generateTaxonomyCountQuery = function (label) {
  const constraintAttr = swgraph.provider.getConstraintAttribute(label);
  const whereElements = [];
  const predefinedConstraints = swgraph.provider.getPredefinedConstraints(label);
  predefinedConstraints.forEach(function (predefinedConstraint) {
    whereElements.push(predefinedConstraint.replace(new RegExp('\\$identifier', 'g'), 'n'));
  });
  if (constraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
    return 'MATCH (n:`' + label + '`)' + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN count(DISTINCT ID(n)) as count'
  } else {
    return 'MATCH (n:`' + label + '`)' + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN count(DISTINCT n.' + constraintAttr + ') as count'
  }
};
swgraph.query.generateQueryElements = function (rootNode, selectedNode, links, isConstraintNeeded) {
  const matchElements = [];
  const whereElements = [];
  const rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';

  const rootPredefinedConstraints = swgraph.provider.getPredefinedConstraints(rootNode.label);

  rootPredefinedConstraints.forEach(function (predefinedConstraint) {
    whereElements.push(predefinedConstraint.replace(new RegExp('\\$identifier', 'g'), rootNode.internalLabel));
  });

  // Generate root node match element
  if (rootNode.value && (isConstraintNeeded || rootNode.immutable)) {
    const rootConstraintAttr = swgraph.provider.getConstraintAttribute(rootNode.label);
    if (rootConstraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
      matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`)');
      whereElements.push('ID(' + rootNode.internalLabel + ') = ' + rootNode.value.internalID);
    } else {
      const constraintValue = rootNode.value.attributes[rootConstraintAttr];

      if (typeof constraintValue === 'boolean' || typeof constraintValue === 'number') {
        matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`{`' + rootConstraintAttr + '`:' + constraintValue + '})');
      } else {
        matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`{`' + rootConstraintAttr + '`:\'' + constraintValue + '\'})');
      }
    }
  } else {
    matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`)');
  }

  // Generate match elements for each links
  links.forEach(function (l) {
    const sourceNode = l.source;
    const targetNode = l.target;
    const predefinedConstraints = swgraph.provider.getPredefinedConstraints(targetNode.label);
    predefinedConstraints.forEach(function (predefinedConstraint) {
      whereElements.push(predefinedConstraint.replace(new RegExp('\\$identifier', 'g'), targetNode.internalLabel));
    });

    if (targetNode.value && targetNode !== selectedNode && (isConstraintNeeded || rootNode.immutable)) {
      const constraintAttr = swgraph.provider.getConstraintAttribute(targetNode.label);
      const constraintValue = targetNode.value.attributes[constraintAttr];
      if (constraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
        matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`)');
        whereElements.push('ID(' + targetNode.internalLabel + ') = ' + targetNode.value.internalID);
      } else {
        if (typeof constraintValue === 'boolean' || typeof constraintValue === 'number') {
          matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`{`' + constraintAttr + '`:' + constraintValue + '})');
        } else {
          matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`{`' + constraintAttr + '`:\'' + constraintValue + '\'})');
        }
      }
    } else {
      matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`)');
    }
  });

  return {'matchElements': matchElements, 'whereElements': whereElements};
};
swgraph.query.getRelevantLinks = function (rootNode, targetNode, initialLinks) {
  const links = initialLinks.slice();
  const filteredLinks = [];
  const finalLinks = [];
  links.forEach(function (l) {
    if (l.target.value || l.target === targetNode) {
      filteredLinks.push(l);
    }
  });
  filteredLinks.forEach(function (l) {
    links.splice(links.indexOf(l), 1);
  });
  filteredLinks.forEach(function (fl) {
    let sourceNode = fl.source;
    let search = true;

    while (search) {
      let intermediateLink = null;
      links.forEach(function (l) {
        if (l.target === sourceNode) {
          intermediateLink = l;
        }
      });
      if (intermediateLink === null) { // no intermediate links needed
        search = false
      } else {
        if (intermediateLink.source === rootNode) {
          finalLinks.push(intermediateLink);
          links.splice(links.indexOf(intermediateLink), 1);
          search = false;
        } else {
          finalLinks.push(intermediateLink);
          links.splice(links.indexOf(intermediateLink), 1);
          sourceNode = intermediateLink.source;
        }
      }
    }
  });

  return filteredLinks.concat(finalLinks);
};
swgraph.query.getLinksToRoot = function (node, links) {
  const pathLinks = [];
  let targetNode = node;
  while (targetNode !== swgraph.graph.getRootNode()) {
    let nodeLink;
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link.target === targetNode) {
        nodeLink = link;
        break;
      }
    }
    if (nodeLink) {
      pathLinks.push(nodeLink);
      targetNode = nodeLink.source;
    }
  }
  return pathLinks;
};
swgraph.query.generateLinkQuery = function (targetNode) {
  const linksToRoot = swgraph.query.getLinksToRoot(targetNode, swgraph.graph.force.links());
  const queryElements = swgraph.query.generateQueryElements(swgraph.graph.getRootNode(), targetNode, linksToRoot, false);
  const matchElements = queryElements.matchElements;
  const returnElements = [];
  const whereElements = queryElements.whereElements;
  const endElements = [];
  const rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
  matchElements.push('(' + targetNode.internalLabel + ':`' + targetNode.internalLabel + '`)-[r]' + rel + '(x)');
  returnElements.push('type(r) AS relationship');
  if (swgraph.query.USE_PARENT_RELATION) {
    returnElements.push('head(labels(x)) AS label');
  } else {
    returnElements.push('last(labels(x)) AS label');
  }
  returnElements.push('count(r) AS count');
  endElements.push('ORDER BY count(r) DESC');
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};
swgraph.query.generateResultCypherQuery = function () {
  const rootNode = swgraph.graph.getRootNode();
  const queryElements = swgraph.query.generateQueryElements(rootNode, rootNode, swgraph.query.getRelevantLinks(rootNode, rootNode, swgraph.graph.force.links()), true);
  const matchElements = queryElements.matchElements;
  const returnElements = [];
  const whereElements = queryElements.whereElements;
  const endElements = [];
  const resultOrderByAttribute = swgraph.provider.getResultOrderByAttribute(rootNode.internalLabel);
  if (resultOrderByAttribute) {
    const order = swgraph.provider.isResultOrderAscending(rootNode.internalLabel) ? 'ASC' : 'DESC';
    endElements.push('ORDER BY ' + resultOrderByAttribute + ' ' + order);
  }
  endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
  const resultAttributes = swgraph.provider.getReturnAttributes(rootNode.internalLabel);
  const constraintAttribute = swgraph.provider.getConstraintAttribute(rootNode.internalLabel);
  for (let i = 0; i < resultAttributes.length; i++) {
    const attribute = resultAttributes[i];
    if (attribute === swgraph.query.NEO4J_INTERNAL_ID) {
      if (attribute === constraintAttribute) {
        returnElements.push('ID(' + rootNode.internalLabel + ') AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
      } else {
        returnElements.push('COLLECT(DISTINCT ID(' + rootNode.internalLabel + ')) AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
      }
    } else {
      if (attribute === constraintAttribute) {
        returnElements.push(rootNode.internalLabel + '.' + attribute + ' AS ' + attribute);
      } else {
        returnElements.push('COLLECT(DISTINCT ' + rootNode.internalLabel + '.' + attribute + ') AS ' + attribute);
      }
    }
  }
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};
swgraph.query.generateResultCypherQueryCount = function () {
  const rootNode = swgraph.graph.getRootNode();
  const queryElements = swgraph.query.generateQueryElements(rootNode, rootNode, swgraph.query.getRelevantLinks(rootNode, rootNode, swgraph.graph.force.links()), true);
  const constraintAttribute = swgraph.provider.getConstraintAttribute(rootNode.internalLabel);
  const matchElements = queryElements.matchElements;
  const returnElements = [];
  const whereElements = queryElements.whereElements;
  const endElements = [];
  if (constraintAttribute === swgraph.query.NEO4J_INTERNAL_ID) {
    returnElements.push('count(DISTINCT ID(' + rootNode.internalLabel + ')) AS count');
  } else {
    returnElements.push('count(DISTINCT ' + rootNode.internalLabel + '.' + constraintAttribute + ') AS count');
  }
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN ' + returnElements.join(', ') + (endElements.length > 0 ? ' ' + endElements.join(' ') : '');
};
swgraph.query.generateNodeCountCypherQuery = function (countedNode) {
  const queryElements = swgraph.query.generateQueryElements(swgraph.graph.getRootNode(), countedNode, swgraph.query.getRelevantLinks(swgraph.graph.getRootNode(), countedNode, swgraph.graph.force.links()), true);
  const matchElements = queryElements.matchElements;
  const whereElements = queryElements.whereElements;
  const returnElements = [];
  const countAttr = swgraph.provider.getConstraintAttribute(countedNode.internalLabel);
  if (countAttr === swgraph.query.NEO4J_INTERNAL_ID) {
    returnElements.push('count(DISTINCT ID(' + countedNode.internalLabel + ')) as count');
  } else {
    returnElements.push('count(DISTINCT ' + countedNode.internalLabel + '.' + countAttr + ') as count');
  }
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN ' + returnElements.join(', ');
};
swgraph.query.generateValueQuery = function (targetNode) {
  const rootNode = swgraph.graph.getRootNode();
  const queryElements = swgraph.query.generateQueryElements(rootNode, targetNode, swgraph.query.getRelevantLinks(rootNode, targetNode, swgraph.graph.force.links()), true);
  const matchElements = queryElements.matchElements;
  const endElements = [];
  const whereElements = queryElements.whereElements;
  const returnElements = [];
  const valueOrderByAttribute = swgraph.provider.getValueOrderByAttribute(targetNode.internalLabel);
  if (valueOrderByAttribute) {
    const order = swgraph.provider.isValueOrderAscending(targetNode.internalLabel) ? 'ASC' : 'DESC';
    endElements.push('ORDER BY ' + valueOrderByAttribute + ' ' + order);
  }
  endElements.push('LIMIT ' + swgraph.query.VALUE_QUERY_LIMIT);
  const resultAttributes = swgraph.provider.getReturnAttributes(targetNode.internalLabel);
  const constraintAttribute = swgraph.provider.getConstraintAttribute(targetNode.internalLabel);
  for (let i = 0; i < resultAttributes.length; i++) {
    if (resultAttributes[i] === swgraph.query.NEO4J_INTERNAL_ID) {
      if (resultAttributes[i] === constraintAttribute) {
        returnElements.push('ID(' + targetNode.internalLabel + ') AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
      } else {
        returnElements.push('COLLECT (DISTINCT ID(' + targetNode.internalLabel + ')) AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
      }
    } else {
      if (resultAttributes[i] === constraintAttribute) {
        returnElements.push(targetNode.internalLabel + '.' + resultAttributes[i] + ' AS ' + resultAttributes[i]);
      } else {
        returnElements.push('COLLECT(DISTINCT ' + targetNode.internalLabel + '.' + resultAttributes[i] + ') AS ' + resultAttributes[i]);
      }
    }
  }
  // Add count return attribute on root node
  const rootConstraintAttr = swgraph.provider.getConstraintAttribute(rootNode.internalLabel);
  if (rootConstraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
    returnElements.push('count(DISTINCT ID(' + rootNode.internalLabel + ')) AS count');
  } else {
    returnElements.push('count(DISTINCT ' + rootNode.internalLabel + '.' + rootConstraintAttr + ') AS count');
  }
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};

/* ******************嫌疑人分析************************************* */
swgraph.query.peopleCountQuery = function () {
  // const queryElements = [];
  const matchElements = [' (s:Address)<-[r1:工作单位]-(m:Passport)-[r:代办人]->(n:People)<-[r2:代办人]-(t:Passport)-[r3:工作单位]->(o:Address) with n.name as xm,o.address as dz1,s.address as dz2,n'];
  const returnElements = ['n'];
  const whereElements = [' dz1<>dz2'];
  const endElements = [];
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};

/* ******************嫌疑人分析2************************************* */
swgraph.query.peopleCountQuery2 = function () {
  // const queryElements = [];
  const matchElements = [' (s:Qianzheng)<-[r1:签证类型]-(m:People)-[r2:arrive]->(o:Destination)<-[r4:arrive]-(n:People)-[r3:签证类型]->(s:Qianzheng)'];
  const returnElements = ['id(m),id(n),o,sum1'];
  const whereElements = [' r2.time=r4.time with m,n,o,count(r2) as sum1'];
  const endElements = [];
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};

/* ****************************************************Z S 修改于2016年5月24日  生成查询语句***************** */
/***
 * 获取label下的节点信息
 * @param label
 * @returns {string}
 */
swgraph.query.generateNodesQuery = function (label) {
  const matchElements = [];
  const whereElements = [];
  const returnElements = [];
  const endElements = [];
  // const rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
  if (label.length > 0) {
    matchElements.push('(n:`' + label + '`)');
  } else {
    matchElements.push('(n)');
  }
  returnElements.push('n');
  endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};
swgraph.query.generateRelsQuery = function (label) {
  const matchElements = [];
  const whereElements = [];
  const returnElements = [];
  const endElements = [];
  const rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
  if (label.length > 0) {
    matchElements.push('(n:`' + label + '`)-' + ' [r]' + rel + ' (m:`' + label + '`)');
  } else {
    matchElements.push('(n)-[r]' + rel + '(m)');
  }
  returnElements.push('r');
  endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};

swgraph.query.generateNodeIDsQuery = function (idlist, isrel) {
  const matchElements = [];
  const whereElements = [];
  const returnElements = [];
  const endElements = [];
  const rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
  if (idlist.length > 0) {
    if (isrel === true) {
      matchElements.push('(n)-' + '[r]' + rel + ' (m)');
      whereElements.push('id(n) in [' + idlist + '] and id(m) in [' + idlist + ']');
      returnElements.push('r');
    } else {
      matchElements.push('(n)');
      whereElements.push('id(n) in [' + idlist + ']');
      returnElements.push('n');
    }
  }
  // returnElements.push('r');
  endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};

// objectID
swgraph.query.generateNodeObjIDsQuery = function (Objidlist, label, isrel) {
  const matchElements = [];
  const whereElements = [];
  const returnElements = [];
  const endElements = [];
  const rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
  if (Objidlist.length > 0) {
    if (isrel === true) {
      matchElements.push('(n:' + label + ')-' + '[r:`同时借`]' + rel + '(m)');
      whereElements.push('n.objectId in [' + Objidlist + ']');
      returnElements.push('r');
    } else {
      matchElements.push('(n:' + label + ')');
      whereElements.push('n.objectId in [' + Objidlist + ']');
      returnElements.push('n');
    }
  }
  // returnElements.push('r');
  endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
  return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
};

/* **************************************************图算法******************************************************** */
swgraph.algorithm = {};
swgraph.algorithm.uri = 'http://192.168.0.171:8080/ShuWeiAlgorithm/services';
swgraph.algorithm.type = Object.freeze({NONE: 0, PAGERANK: 1, TRIANGLE: 2, DEGREE: 3, INDEGREE: 4, OUTDEGREE: 5, SHORTPATH: 6, CHILDGRAPH: 7, FILTER: 8, UNUSUAL: 9});
swgraph.eventType = swgraph.algorithm.type.NONE; // 算法类型

swgraph.algorithm.Triangle = {};
swgraph.algorithm.Triangle.Count = 10; // 节点周边三角形个数阈值设置
swgraph.algorithm.Triangle.hitNodes = [];

swgraph.algorithm.PAGERANK = {};
swgraph.algorithm.PAGERANK.hitNodes = [];

swgraph.algorithm.DEGREE = {};
swgraph.algorithm.DEGREE.hitNodes = [];

swgraph.algorithm.INDEGREE = {};
swgraph.algorithm.INDEGREE.hitNodes = [];

swgraph.algorithm.OUTDEGREE = {};
swgraph.algorithm.OUTDEGREE.hitNodes = [];

swgraph.algorithm.SHORTPATH = {};
swgraph.algorithm.SHORTPATH.hitNodes = [];
swgraph.algorithm.SHORTPATH.nodes = [];

swgraph.algorithm.UNUSUAL = {};
swgraph.algorithm.UNUSUAL.hitNodes = [];

swgraph.algorithm.restpost = function (data, type) {
  let strUrl = '';
  switch (type) {
    case swgraph.algorithm.type.CHILDGRAPH:
      strUrl = swgraph.algorithm.uri + '/algorithm/cc_define';
      break;
    case swgraph.algorithm.type.PAGERANK:
      strUrl = swgraph.algorithm.uri + '/algorithm/pagerank_define';
      break;
    case swgraph.algorithm.type.TRIANGLE:
      strUrl = swgraph.algorithm.uri + '/algorithm/trianglecount_define';
      break;
    case swgraph.algorithm.type.INDEGREE:
      strUrl = swgraph.algorithm.uri + '/algorithm/indegree_define';
      break;
    case swgraph.algorithm.type.OUTDEGREE:
      strUrl = swgraph.algorithm.uri + '/algorithm/outdegree_define';
      break;
    case swgraph.algorithm.type.DEGREE:
      strUrl = swgraph.algorithm.uri + '/algorithm/degree_Define01';
      break;
    case swgraph.algorithm.type.SHORTPATH:
      strUrl = swgraph.algorithm.uri + '/algorithm/shortpath_define';
      break;
    case swgraph.algorithm.type.UNUSUAL:
      strUrl = swgraph.algorithm.uri + '/algorithm/unusual_define';
      break;
  }
  // console.log(type+strUrl);
  return $.ajax({
    type: 'POST',
    url: strUrl,
    contentType: 'text/plain; charset=UTF-8',
    async: false,
    data: JSON.stringify(data)
  })
};

/* TO-DO 图过滤 */
swgraph.algorithm.filter = function (filterSql) {
  const st = swgraph.graph.force.nodes().filter(function (d) {
    const returenStr = [];
    const ss = filterSql.filter(function (dd) {
      return dd.type === 'node';
    });
    $.each(ss, function (item) {
      returenStr.push(`d.internalLabel=='$ss[item].label}'`);
      $.each(ss[item].attr, function (k, v) {
        returenStr.push('d.' + k + ' ' + v);
      })
    });
    if (returenStr.length > 0) {
      /* eslint-disable no-eval */
      return !(eval(returenStr.join(' && ')));
    } else {
      return false;
    }
  });
  // swgraph.graph.force.nodes().splice(0,swgraph.graph.force.nodes().length);
  $.each(st, function (item) {
    swgraph.graph.node.removeNode(st[item], 0, false);
  });

  const sl = swgraph.graph.force.links().filter(function (d) {
    let returenStr = [];
    let ss = filterSql.filter(function (dd) {
      return dd.type === 'link';
    });
    $.each(ss, function (item) {
      // returenStr+='1==1';
      $.each(ss[item].attr, function (k, v) {
        returenStr.push(' d.properties.' + k + ' ' + v);
      })
    });
    if (returenStr.length > 0) {
      return !(eval(returenStr.join(' && ')));
    } else {
      return false;
    }
    // return !(d.properties.weight>1);
  });
  for (let i = swgraph.graph.force.links().length - 1; i >= 0; i--) {
    if (sl.indexOf(swgraph.graph.force.links()[i]) >= 0) {
      swgraph.graph.force.links().splice(i, 1);
    }
  }
  if (sl.length > 0) {
    for (let i = swgraph.graph.force.nodes().length - 1; i >= 0; i--) {
      let haveFoundNode = false;
      for (let j = 0, l = swgraph.graph.force.links().length; j < l; j++) {
        if ((swgraph.graph.force.links()[j]['source'] === swgraph.graph.force.nodes()[i] ||
          swgraph.graph.force.links()[j]['target'] === swgraph.graph.force.nodes()[i])) {
          haveFoundNode = true
        }
      }
      !haveFoundNode && swgraph.graph.force.nodes().splice(i, 1);
    }
  }
  swgraph.update();
};

// 获取三角形个数
swgraph.algorithm.updateTriangleNode = function (neojson) {
  swgraph.algorithm.restpost(
    neojson, swgraph.algorithm.type.TRIANGLE
  ).done(function (data) {
    swgraph.algorithm.Triangle.hitNodes = [];
    var dataSort = data.obj;
    // console.log(JSON.stringify(dataSort));
    $.each(dataSort, function (k, v) {
      if (parseInt(v.value) >= swgraph.algorithm.Triangle.Count) {
        // console.log(v.value);
        swgraph.algorithm.Triangle.hitNodes.push(v.key);
      }
    });
  }).fail(function (r) {
    console.log('error' + r);
  })
    .always(function () {
      // alert( 'complete' );
    });
};

// PAGERANK算法请求
swgraph.algorithm.updatePGNode = function (neojson) {
  swgraph.algorithm.restpost(
    neojson, swgraph.algorithm.type.PAGERANK
  ).done(function (data) {
    swgraph.algorithm.PAGERANK.hitNodes = [];
    // console.log(JSON.stringify(data));
    let dataSort = data[0].obj;
    let i = 0;
    $.each(dataSort, function (k, v) {
      if (i < 5) {
        swgraph.algorithm.PAGERANK.hitNodes.push(v.key);
      }
      i++;
    });
  }).fail(function (r) {
    console.log('error' + r);
  })
    .always(function () {
      // alert( 'complete' );
    });
};

/**
 * 最短路径-图计算
 * @param neojson
 * @param startnodeid
 * @param endnodeid
 */
swgraph.algorithm.shortpath = function (neojson, startnodeid, endnodeid) {
  // console.log(JSON.stringify({'data':neojson,'startid':startnodeid,'endid':endnodeid}));
  swgraph.algorithm.restpost(
    {'data': neojson, 'startid': startnodeid, 'endid': endnodeid}, swgraph.algorithm.type.SHORTPATH
  ).done(function (data) {
    swgraph.algorithm.SHORTPATH.hitNodes = [];
    // console.log(JSON.stringify(data));
    let dataSort = data[0].obj;
    let i = 0;
    $.each(dataSort, function (k, v) {
      if (i < 5) {
        swgraph.algorithm.SHORTPATH.hitNodes.push(v.key);
      }
      i++;
    });
  }).fail(function (r) {
    console.log('error' + r);
  })
    .always(function () {
      // alert( 'complete' );
    });
};

swgraph.algorithm.shortpathByCyther = function (startnodeid, endnodeid) {
  swgraph.algorithm.SHORTPATH.hitNodes = [startnodeid, endnodeid];
  swgraph.rest.post({
    'statements': [
      {
        'statement': 'START a=node(' + startnodeid + '), x=node(' + endnodeid + ') MATCH p = shortestPath(a-[*]-x) RETURN p',
        'resultDataContents': ['graph']
      }]
  }).done(function (data) {
    // console.log(JSON.stringify(data));
    if (swgraph.graph.force.nodes().length > 0) {
      swgraph.graph.force.nodes().splice(0, swgraph.graph.force.nodes().length);
      swgraph.graph.force.links().splice(0, swgraph.graph.force.links().length);
      swgraph.update();
    }
    if (data.results.length > 0) {
      // console.log(type+'=='+swgraph.graph.type.CHILD);
      swgraph.eventType = swgraph.algorithm.type.SHORTPATH;
      let mydata = data.results[0].data;
      // let snodes = [];
      // let edges = [];
      mydata.forEach(function (item) {
        let gnodes = item.graph.nodes;
        let relations = item.graph.relationships;
        gnodes.forEach(function (node) {
          if (swgraph.graph.node.isHasSvgNodeElement(node) === false) {
            let subnode = node.properties;
            subnode['id'] = node.id;
            subnode['label'] = node.labels;
            subnode['status'] = 1;
            subnode['expand'] = false;
            subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
            subnode['internalLabel'] = node.labels[0];
            swgraph.graph.force.nodes().push(subnode);
          }
        });
        relations.forEach(function (edge) {
          if (swgraph.graph.link.isHasSvgLinkElement(edge) === false) {
            let icount = swgraph.graph.link.isHasSvgRelElement(edge);
            if (icount > 0) {
              swgraph.graph.force.links().push({
                'source': swgraph.graph.findNode(edge.startNode),
                'target': swgraph.graph.findNode(edge.endNode),
                'id': edge.id,
                'relation': edge.type,
                'count': icount++,
                'properties': edge.properties
              });
            }
          }
        });
      });
      swgraph.update();
    }
  }).fail(function (r) {
    console.log('error' + r);
  }).always(function () {
    // alert( 'complete' );
  });
};

swgraph.algorithm.degree = function (neojson) {
  swgraph.algorithm.restpost(
    neojson, swgraph.algorithm.type.DEGREE
  ).done(function (data) {
    // swgraph.algorithm.DEGREE.hitNodes=[];
    console.log(JSON.stringify(data));
    // var dataSort = data[0].obj;
    swgraph.algorithm.DEGREE.hitNodes = data;
    /* var i=0;
     $.each(dataSort,function(k,v){
     if(i<5) {
     swgraph.algorithm.DEGREE.hitNodes.push(v.key);
     }
     i++;
     }); */
  }).fail(function (r) {
    console.log('error' + r);
  })
    .always(function () {
      // alert( 'complete' );
    });
};
/* ************************ */

swgraph.result = {};
swgraph.result.containerId = 'swgraph-results';
swgraph.result.hasChanged = false;
swgraph.result.resultCountListeners = [];
swgraph.result.resultListeners = [];

/**
 * Register a listener to the result count event.
 * This listener will be called on evry result change with total result count.
 */
swgraph.result.onTotalResultCount = function (listener) {
  swgraph.result.resultCountListeners.push(listener);
};

swgraph.result.onResultReceived = function (listener) {
  swgraph.result.resultListeners.push(listener);
};

/**
 * Parse REST returned data and generate a list of result objects.
 *
 * @param data
 * @returns {Array}
 */
swgraph.result.parseResultData = function (data) {
  let results = [];
  if (data.results && data.results.length > 0) {
    for (let x = 0; x < data.results[0].data.length; x++) {
      let obj = {
        'resultIndex': x,
        'label': swgraph.graph.getRootNode().internalLabel,
        'attributes': {}
      };

      for (let i = 0; i < data.results[0].columns.length; i++) {
        // Some results can be an array as collect is used in query
        // So all values are converted to string
        obj.attributes[data.results[0].columns[i]] = '' + data.results[0].data[x].row[i];
      }
      results.push(obj);
    }
  }
  return results;
};

swgraph.result.updateResults = function (node) {
  // Parse data
  // var resultObjects = swgraph.result.parseResultData(node);
  // console.log(node);
  // Update displayed results only if needed ()
  if (swgraph.result.isActive) {
    // Clear all results
    // var results = d3.select('#' + swgraph.result.containerId).selectAll('.ppt-result').data([node]);
    // results.exit().remove();
    //  Update data
    let results = d3.select('#' + swgraph.result.containerId).html('').selectAll('.ppt-result').data([node], function (d) {
      return d.id;
    });
    // Add new elements
    // let spanElmt = results.enter()
    results.enter()
      .append('span')
      .html(function (d) {
        let resHtml = '';
        // console.log(d);
        resHtml = `<p id='swgraph-result-${d.id}'>${d.internalLabel}</p>`;
        $.each(d, function (key, value) {
          // console.log(key);
          // console.log(value);
          resHtml += `<span class='attributeName'>${key}:&nbsp;</span>`;
          resHtml += `<span class='attributeValue'>${value}</span>`;
        });
        return resHtml;
      });

    // Generate results with providers
    // pElmt.each(function (d) {
    // swgraph.provider.getDisplayResultFunction(d.label)(d3.select(this));
    // });
  }
};

// NODE LABEL PROVIDERS -----------------------------------------------------------------------------------------------------
swgraph.provider = {};
swgraph.provider.linkProvider = {};
swgraph.provider.taxonomyProvider = {};
swgraph.provider.nodeProviders = {};

swgraph.provider.getLinkTextValue = function (link) {
  if (swgraph.provider.linkProvider.hasOwnProperty('getLinkTextValue')) {
    return swgraph.provider.linkProvider.getLinkTextValue(link);
  } else {
    if (swgraph.provider.DEFAULT_LINK_PROVIDER.hasOwnProperty('getLinkTextValue')) {
      return swgraph.provider.DEFAULT_LINK_PROVIDER.getLinkTextValue(link);
    } else {
      swgraph.logger.error('No provider defined for getLinkTextValue');
    }
  }
};
swgraph.provider.getLinkSemanticValue = function (link) {
  if (swgraph.provider.linkProvider.hasOwnProperty('getLinkSemanticValue')) {
    return swgraph.provider.linkProvider.getLinkSemanticValue(link);
  } else {
    if (swgraph.provider.DEFAULT_LINK_PROVIDER.hasOwnProperty('getLinkSemanticValue')) {
      return swgraph.provider.DEFAULT_LINK_PROVIDER.getLinkSemanticValue(link);
    } else {
      swgraph.logger.error('No provider defined for getLinkSemanticValue');
    }
  }
};

swgraph.provider.DEFAULT_LINK_PROVIDER = Object.freeze(
  {
    'getLinkTextValue': function (link) {
      if (link.type === swgraph.graph.link.LinkTypes.VALUE) {
        if (swgraph.provider.isTextDisplayed(link.target)) {
          return '';
        } else {
          return swgraph.provider.getTextValue(link.target);
        }
      } else {
        return link.label
      }
    },
    'getLinkSemanticValue': function (link) {
      return swgraph.provider.getLinkTextValue(link);
    }
  });
swgraph.provider.linkProvider = swgraph.provider.DEFAULT_LINK_PROVIDER;

swgraph.provider.getTaxonomyTextValue = function (label) {
  if (swgraph.provider.taxonomyProvider.hasOwnProperty('getTextValue')) {
    return swgraph.provider.taxonomyProvider.getTextValue(label);
  } else {
    if (swgraph.provider.DEFAULT_TAXONOMY_PROVIDER.hasOwnProperty('getTextValue')) {
      return swgraph.provider.DEFAULT_TAXONOMY_PROVIDER.getTextValue(label);
    } else {
      swgraph.logger.error('No provider defined for taxonomy getTextValue');
    }
  }
};

swgraph.provider.DEFAULT_TAXONOMY_PROVIDER = Object.freeze(
  {
    'getTextValue': function (label) {
      return label;
    }
  });
swgraph.provider.taxonomyProvider = swgraph.provider.DEFAULT_TAXONOMY_PROVIDER;

swgraph.provider.NodeDisplayTypes = Object.freeze({TEXT: 0, IMAGE: 1, SVG: 2});

swgraph.provider.getProvider = function (label) {
  if (label === undefined) {
    swgraph.logger.error('Node label is undefined, no label provider can be found.');
  } else {
    if (swgraph.provider.nodeProviders.hasOwnProperty(label)) {
      return swgraph.provider.nodeProviders[label];
    } else {
      swgraph.logger.debug('No direct provider found for label ' + label);
      // Search in all children list definitions to find the parent provider.
      for (let p in swgraph.provider.nodeProviders) {
        if (swgraph.provider.nodeProviders.hasOwnProperty(p)) {
          let provider = swgraph.provider.nodeProviders[p];
          if (provider.hasOwnProperty('children')) {
            if (provider['children'].indexOf(label) > -1) {
              swgraph.logger.debug('No provider is defined for label (' + label + '), parent (' + p + ') will be used');
              // A provider containing the required label in its children definition has been found it will be cloned.
              let newProvider = {'parent': p};
              for (let pr in provider) {
                if (provider.hasOwnProperty(pr) && pr !== 'children' && pr !== 'parent') {
                  newProvider[pr] = provider[pr];
                }
              }
              swgraph.provider.nodeProviders[label] = newProvider;
              // console.log(swgraph.provider.nodeProviders[label]);
              return swgraph.provider.nodeProviders[label];
            }
          }
        }
      }
      swgraph.logger.debug('No label provider defined for label (' + label + ') default one will be created from swgraph.provider.DEFAULT_PROVIDER');
      swgraph.provider.nodeProviders[label] = {};
      // Clone default provider properties in new provider.
      for (let prop in swgraph.provider.DEFAULT_PROVIDER) {
        if (swgraph.provider.DEFAULT_PROVIDER.hasOwnProperty(prop)) {
          swgraph.provider.nodeProviders[label][prop] = swgraph.provider.DEFAULT_PROVIDER[prop];
        }
      }
      // console.log(swgraph.provider.nodeProviders[label]);
      return swgraph.provider.nodeProviders[label];
    }
  }
};
swgraph.provider.getProperty = function (label, name) {
  let provider = swgraph.provider.getProvider(label);
  if (!provider.hasOwnProperty(name)) {
    let providerIterator = provider;
    // Check parents
    let isPropertyFound = false;
    // console.log(providerIterator);
    while (providerIterator.hasOwnProperty('parent') && !isPropertyFound) {
      providerIterator = swgraph.provider.getProvider(providerIterator.parent);
      if (providerIterator.hasOwnProperty(name)) {
        // Set attribute in child to optimize next call.
        provider[name] = providerIterator[name];
        isPropertyFound = true;
      }
    }
    if (!isPropertyFound) {
      swgraph.logger.debug('No \'' + name + '\' property found for node label provider (' + label + '), default value will be used');
      if (swgraph.provider.DEFAULT_PROVIDER.hasOwnProperty(name)) {
        provider[name] = swgraph.provider.DEFAULT_PROVIDER[name];
      } else {
        swgraph.logger.error('No default value for \'' + name + '\' property found for label provider (' + label + ')');
      }
    }
  }
  return provider[name];
};
swgraph.provider.getIsSearchable = function (label) {
  return swgraph.provider.getProperty(label, 'isSearchable');
};
swgraph.provider.getReturnAttributes = function (label) {
  let provider = swgraph.provider.getProvider(label);
  let attributes = {}; // Object is used as a Set to merge possible duplicate in parents
  if (provider.hasOwnProperty('returnAttributes')) {
    for (let i = 0; i < provider.returnAttributes.length; i++) {
      if (provider.returnAttributes[i] === swgraph.query.NEO4J_INTERNAL_ID) {
        attributes[swgraph.query.NEO4J_INTERNAL_ID.queryInternalName] = true;
      } else {
        attributes[provider.returnAttributes[i]] = true;
      }
    }
  }
  // Add parent attributes
  while (provider.hasOwnProperty('parent')) {
    provider = swgraph.provider.getProvider(provider.parent);
    if (provider.hasOwnProperty('returnAttributes')) {
      for (let j = 0; j < provider.returnAttributes.length; j++) {
        if (provider.returnAttributes[j] === swgraph.query.NEO4J_INTERNAL_ID) {
          attributes[swgraph.query.NEO4J_INTERNAL_ID.queryInternalName] = true;
        } else {
          attributes[provider.returnAttributes[j]] = true;
        }
      }
    }
  }
  // Add default provider attributes if any but not internal id as this id is added only if none has been found.
  if (swgraph.provider.DEFAULT_PROVIDER.hasOwnProperty('returnAttributes')) {
    for (let k = 0; k < swgraph.provider.DEFAULT_PROVIDER.returnAttributes.length; k++) {
      if (swgraph.provider.DEFAULT_PROVIDER.returnAttributes[k] !== swgraph.query.NEO4J_INTERNAL_ID) {
        attributes[swgraph.provider.DEFAULT_PROVIDER.returnAttributes[k]] = true;
      }
    }
  }
  // Add constraint attribute in the list
  let constraintAttribute = swgraph.provider.getConstraintAttribute(label);
  if (constraintAttribute === swgraph.query.NEO4J_INTERNAL_ID) {
    attributes[swgraph.query.NEO4J_INTERNAL_ID.queryInternalName] = true;
  } else {
    attributes[constraintAttribute] = true;
  }
  // Add all in array
  let attrList = [];
  for (let attr in attributes) {
    if (attributes.hasOwnProperty(attr)) {
      if (attr === swgraph.query.NEO4J_INTERNAL_ID.queryInternalName) {
        attrList.push(swgraph.query.NEO4J_INTERNAL_ID);
      } else {
        attrList.push(attr);
      }
    }
  }
  // If no attributes have been found internal ID is used
  if (attrList.length <= 0) {
    attrList.push(swgraph.query.NEO4J_INTERNAL_ID);
  }
  return attrList;
};
swgraph.provider.getConstraintAttribute = function (label) {
  return swgraph.provider.getProperty(label, 'constraintAttribute');
};
swgraph.provider.getPredefinedConstraints = function (label) {
  return swgraph.provider.getProperty(label, 'getPredefinedConstraints')();
};
swgraph.provider.getValueOrderByAttribute = function (label) {
  return swgraph.provider.getProperty(label, 'valueOrderByAttribute');
};
swgraph.provider.isValueOrderAscending = function (label) {
  return swgraph.provider.getProperty(label, 'isValueOrderAscending');
};
swgraph.provider.getResultOrderByAttribute = function (label) {
  return swgraph.provider.getProperty(label, 'resultOrderByAttribute');
};
swgraph.provider.isResultOrderAscending = function (label) {
  return swgraph.provider.getProperty(label, 'isResultOrderAscending');
};
swgraph.provider.getTextValue = function (node) {
  return swgraph.provider.getProperty(node.label, 'getTextValue')(node);
};
swgraph.provider.getSemanticValue = function (node) {
  return swgraph.provider.getProperty(node.label, 'getSemanticValue')(node);
};
swgraph.provider.getSVGPaths = function (node) {
  return swgraph.provider.getProperty(node.label, 'getSVGPaths')(node);
};
swgraph.provider.isTextDisplayed = function (node) {
  return swgraph.provider.getProperty(node.label, 'getIsTextDisplayed')(node);
};
swgraph.provider.getIsGroup = function (node) {
  return swgraph.provider.getProperty(node.label, 'getIsGroup')(node);
};
swgraph.provider.getNodeDisplayType = function (node) {
  return swgraph.provider.getProperty(node.label, 'getDisplayType')(node);
};
swgraph.provider.getImagePath = function (node) {
  return swgraph.provider.getProperty(node.label, 'getImagePath')(node);
};
swgraph.provider.getImageWidth = function (node) {
  return swgraph.provider.getProperty(node.label, 'getImageWidth')(node);
};
swgraph.provider.getImageHeight = function (node) {
  return swgraph.provider.getProperty(node.label, 'getImageHeight')(node);
};
swgraph.provider.getDisplayResultFunction = function (label) {
  return swgraph.provider.getProperty(label, 'displayResults');
};
swgraph.provider.getCategoryName = function (label) {
  return swgraph.provider.getProperty(label, 'categoryAttribute');
};
swgraph.provider.getCategoryColor = function (label) {
  return swgraph.provider.getProperty(label, 'categoryColor');
};

swgraph.provider.DEFAULT_PROVIDER = Object.freeze(
  {
    /**********************************************************************
     * Label specific parameters:
     *
     * These attributes are specific to a node label and will be used for every node having this label.
     **********************************************************************/

    /**
     * Defines whether this label can be used as root element of the graph query builder.
     * This property is also used to determine whether the label can be displayed in the taxonomy filter.
     *
     * The default value is true.
     */
    'isSearchable': true,

    /**
     * Defines the list of attribute to return for node of this label.
     * All the attributes listed here will be added in generated cypher queries and available in result list and in node provider's functions.
     *
     * The default value contains only the Neo4j internal id.
     * This id is used by default because it is a convenient way to identify a node when nothing is known about its attributes.
     * But you should really consider using your application attributes instead, it is a bad practice to rely on this attribute.
     */
    'returnAttributes': [swgraph.query.NEO4J_INTERNAL_ID],

    /**
     * Defines the attribute used to order the value displayed on node.
     *
     * Default value is 'count' attribute.
     */
    'valueOrderByAttribute': 'count',

    /**
     * Defines whether the value query order by is ascending, if false order by will be descending.
     *
     * Default value is false (descending)
     */
    'isValueOrderAscending': false,

    /**
     * Defines the attribute used to order the results.
     *
     * Default value is 'null' to disable order by.
     */
    'resultOrderByAttribute': null,

    /**
     * Defines whether the result query order by is ascending, if false order by will be descending.
     *
     * Default value is true (ascending)
     */
    'isResultOrderAscending': true,

    /**
     * Defines the attribute of the node to use in query constraint for nodes of this label.
     * This attribute is used in the generated cypher query to build the constraints with selected values.
     *
     * The default value is the Neo4j internal id.
     * This id is used by default because it is a convenient way to identify a node when nothing is known about its attributes.
     * But you should really consider using your application attributes instead, it is a bad practice to rely on this attribute.
     */
    'constraintAttribute': swgraph.query.NEO4J_INTERNAL_ID,

    /**
     * Return the list of predefined constraints to add for the given label.
     * These constraints will be added in every generated Cypher query.
     *
     * For example if the returned list contain ['$identifier.born > 1976'] for 'Person' nodes everywhere in swgraph.js the generated Cypher query will add the constraint
     * 'WHERE person.born > 1976'
     *
     * @returns {Array}
     */
    'getPredefinedConstraints': function () {
      return [];
    },

    /**********************************************************************
     * Node specific parameters:
     *
     * These attributes are specific to nodes (in graph or query viewer) for a given label.
     * But they can be customized for nodes of the same label.
     * The parameters are defined by a function that will be called with the node as parameter.
     * In this function the node internal attributes can be used to customize the value to return.
     **********************************************************************/

    /**
     * Function returning the display type of a node.
     * This type defines how the node will be drawn in the graph.
     *
     * The result must be one of the following values:
     *
     * swgraph.provider.NodeDisplayTypes.IMAGE
     *  In this case the node will be drawn as an image and 'getImagePath' function is required to return the node image path.
     *
     * swgraph.provider.NodeDisplayTypes.SVG
     *  In this case the node will be drawn as SVG paths and 'getSVGPaths'
     *
     * swgraph.provider.NodeDisplayTypes.TEXT
     *  In this case the node will be drawn as a simple ellipse.
     *
     * Default value is TEXT.
     *
     * @param node the node to extract its type.
     * @returns {number} one value from swgraph.provider.NodeDisplayTypes
     */
    'getDisplayType': function (node) {
      return swgraph.provider.NodeDisplayTypes.TEXT;
    },

    /**
     * Function defining whether the node is a group node.
     * In this case no count are displayed and no value can be selected on the node.
     *
     * Default value is false.
     */
    'getIsGroup': function (node) {
      return false;
    },

    /**
     * Function defining whether the node text representation must be displayed on graph.
     * If true the value returned for getTextValue on node will be displayed on graph.
     *
     * This text will be added in addition to the getDisplayType representation.
     * It can be displayed on all type of node display, images, SVG or text.
     *
     * Default value is true
     *
     * @param node the node to display on graph.
     * @returns {boolean} true if text must be displayed on graph for the node.
     */
    'getIsTextDisplayed': function (node) {
      return true;
    },

    /**
     * Function used to return the text representation of a node.
     *
     * The default behavior is to return the label of the node
     * or the value of constraint attribute of the node if it contains value.
     *
     * The returned value is truncated using swgraph.graph.node.NODE_MAX_CHARS property.
     *
     * @param node the node to represent as text.
     * @returns {string} the text representation of the node.
     */
    'getTextValue': function (node) {
      let text;
      let constraintAttr = swgraph.provider.getProperty(node.internalLabel, 'constraintAttribute');
      if (node.type === swgraph.graph.node.NodeTypes.VALUE) {
        if (constraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
          text = '' + node.internalID;
        } else {
          // console.log(node);
          text = '' + node[constraintAttr];
        }
      } else {
        if (node.value === undefined) {
          text = node.internalLabel;
        } else {
          if (constraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
            text = '' + node.value.internalID;
          } else {
            text = '' + node.value.attributes[constraintAttr];
          }
        }
      }
      // Text is truncated to fill the ellipse
      return text.substring(0, swgraph.graph.node.NODE_MAX_CHARS);
    },

    /**
     * Function used to return a descriptive text representation of a link.
     * This representation should be more complete than getTextValue and can contain semantic data.
     * This function is used for example to generate the label in the query viewer.
     *
     * The default behavior is to return the getTextValue not truncated.
     *
     * @param node the node to represent as text.
     * @returns {string} the text semantic representation of the node.
     */
    'getSemanticValue': function (node) {
      let text;
      let constraintAttr = swgraph.provider.getProperty(node.internalLabel, 'constraintAttribute');
      if (node.type === swgraph.graph.node.NodeTypes.VALUE) {
        if (constraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
          text = '' + node.internalID;
        } else {
          text = '' + node.attributes[constraintAttr];
        }
      } else {
        if (node.value === undefined) {
          text = node.internalLabel;
        } else {
          if (constraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
            text = '' + node.value.internalID;
          } else {
            text = '' + node.value.attributes[constraintAttr];
          }
        }
      }
      return text;
    },

    /**
     * Function returning the image file path to use for a node.
     * This function is only used for swgraph.provider.NodeDisplayTypes.IMAGE type nodes.
     *
     * @param node
     * @returns {string}
     */
    'getImagePath': function (node) {
      if (node.type === swgraph.graph.node.NodeTypes.VALUE) {
        return 'css/image/node-yellow.png';
      } else {
        if (node.value === undefined) {
          if (node.type === swgraph.graph.node.NodeTypes.ROOT) {
            return 'css/image/node-blue.png';
          }
          if (node.type === swgraph.graph.node.NodeTypes.CHOOSE) {
            return 'css/image/node-green.png';
          }
          if (node.type === swgraph.graph.node.NodeTypes.GROUP) {
            return 'css/image/node-black.png';
          }
        } else {
          return 'css/image/node-orange.png';
        }
      }
    },

    /**
     * Function returning the image width of the node.
     * This function is only used for swgraph.provider.NodeDisplayTypes.IMAGE type nodes.
     *
     * @param node
     * @returns {number}
     */
    'getImageWidth': function (node) {
      return 125;
    },

    /**
     * Function returning the image height of the node.
     * This function is only used for swgraph.provider.NodeDisplayTypes.IMAGE type nodes.
     *
     * @param node
     * @returns {number}
     */
    'getImageHeight': function (node) {
      return 125;
    },

    /**********************************************************************
     * Results specific parameters:
     *
     * These attributes are specific to result display.
     **********************************************************************/

    /**
     * Generate the result entry content using d3.js mechanisms.
     *
     * The parameter of the function is the &lt;p&gt; selected with d3.js
     *
     * The default behavior is to generate a &lt;table&gt; containing all the return attributes in a &lt;th&gt; and their value in a &lt;td&gt;.
     *
     * @param pElmt the &lt;p&gt; element generated in the result list.
     */
    'displayResults': function (pElmt) {
      let result = pElmt.data()[0];

      let returnAttributes = swgraph.provider.getReturnAttributes(result.label);

      let table = pElmt.append('table').attr('class', 'ppt-result-table');

      returnAttributes.forEach(function (attribute) {
        let attributeName = (attribute === swgraph.query.NEO4J_INTERNAL_ID) ? swgraph.query.NEO4J_INTERNAL_ID.queryInternalName : attribute;

        let tr = table.append('tr');
        tr.append('th').text(function () {
          if (attribute === swgraph.query.NEO4J_INTERNAL_ID) {
            return 'internal ID:'
          } else {
            return attribute + ':';
          }
        });
        if (result.attributes[attributeName] !== undefined) {
          tr.append('td').text(function (result) {
            return result.attributes[attributeName];
          });
        }
      });
    }

  });
export default swgraph
