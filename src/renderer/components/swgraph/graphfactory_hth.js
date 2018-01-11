/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
/* eslint-disable */

swgraph = (function() {
  // hth20160810添加一个数据处理函数用的全局变量保存d*********************
  // var allRelationships = [];
  // hth20160809创建一个全局变量用来保存d.communityrule1，用于对鼠标移入时其他的节点进行减淡效果；
  var communityrule1_keeper = [];
  // hth20160805***********************
  var color_com = d3.scale.category20();// hth20160805**********建立在外部才有用。如果放在attr内无效；
  var rulePR_keeper = [];// 外部定义一个数组保存pagerank的全部数值？便于用比例尺进行大小定义
  var swgraph = {
    version: '1.0',
    colors: d3.scale.category20()
  };
    // hth20160822定义一个全局变量，控制tick函数内部link画法的启动；
  var tickToggle = false;
  // hth20160824
  var tmpDataKeeper = [];

  /** *查询**/
  swgraph.searchstart = function(cythersql, type, bol, key) {
    // hth20160812
    // console.log("searchstart")
    // console.log(cythersql);
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
            // console.log(data.results[0].data.length)
            if (data.results[0].data.length === 0) {
              // console.log(data.results[0].data.length)
              swgraph.searchstart(swgraph.query.generateRootNodeIDsQueryForNull(key))
            } {
              // hth20160812
              // console.log("searchdone")
              // console.log(data)
              // console.log(JSON.stringify(data));
              if (swgraph.graph.force.nodes().length > 0) {
                swgraph.graph.force.nodes().splice(0, swgraph.graph.force.nodes().length);
                swgraph.graph.force.links().splice(0, swgraph.graph.force.links().length);
                swgraph.update();
              }
              if (data.results.length > 0) {
                swgraph.eventType = swgraph.algorithm.type.NONE;
                var mydata = data.results[0].data;
                // console.log(mydata)
                var snodes = [];
                var edges = [];
                var linksMap = d3.map([]);
                var nodesMap = d3.map([]);
                rulePR_keeper = [];
                mydata.forEach(function(item) {
                  var gnodes = item.graph.nodes;
                  // var relations=item.graph.relationships;
                  // var relnode={};

                  gnodes.forEach(function(node) {
                    // hth20160816

                    var y = node.properties.rulePR;
                    rulePR_keeper.push(y);
                    // console.log(node);
                    // hth20160816

                    var subnode = node.properties;
                    subnode['id'] = node.id;
                    subnode['label'] = node.labels;
                    subnode['status'] = 1;
                    subnode['expand'] = false;
                    subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
                    subnode['internalLabel'] = node.labels[0];
                    nodesMap.set(node.id, subnode);
                  });
                });

                nodesMap.forEach(function(key, value) {
                  swgraph.graph.force.nodes().push(value);
                });

                // console.log(mydata)
                mydata.forEach(function(item) {
                  var relations = item.graph.relationships;
                  relations.forEach(function(edge) {
                    var nodeA = edge.startNode;
                    var nodeB = edge.endNode;
                    if (nodeA > nodeB) {
                      nodeA = edge.endNode;
                      nodeB = edge.startNode;
                    }
                    if (linksMap.has(nodeA + '-' + nodeB)) {
                      var templist = linksMap.get(nodeA + '-' + nodeB);
                      templist.push({
                        'source': nodesMap.get(edge.startNode),
                        'target': nodesMap.get(edge.endNode),
                        // "source":swgraph.graph.findNode(edge.startNode),
                        // "target":swgraph.graph.findNode(edge.endNode),
                        'id': edge.id,
                        'relation': edge.type,
                        'relCommunity': nodesMap.get(edge.startNode).communityrule1,
                        'properties': edge.properties,
                        // hth20160817nodeA用于tick中判断不同起点箭头是否要反向；不然会重叠；
                        'nodeA': nodeA
                      });
                      // console.log(nodeA+"-"+nodeB)
                      linksMap.set(nodeA + '-' + nodeB, templist);
                    } else {
                      // console.log(nodeA+"-"+nodeB)
                      linksMap.set(nodeA + '-' + nodeB, [{
                        'source': nodesMap.get(edge.startNode),
                        'target': nodesMap.get(edge.endNode),
                        // "source":swgraph.graph.findNode(edge.startNode),
                        // "target":swgraph.graph.findNode(edge.endNode),
                        'id': edge.id,
                        'relation': edge.type,
                        'relCommunity': nodesMap.get(edge.startNode).communityrule1,
                        'properties': edge.properties,
                        // hth20160817nodeA用于tick中判断不同起点箭头是否要反向；不然会重叠；
                        'nodeA': nodeA
                      }])
                    }
                  });
                });
                // console.log(JSON.stringify(linksMap));
                linksMap.forEach(function(key, value) {
                  // console.log(JSON.stringify(value));
                  var len = value.length;
                  for (var index = 0; index < len; index++) {
                    var item = value[index];
                    item['ccccount'] = len;
                    item['iiiindex'] = index;
                    // console.log(item)
                    swgraph.graph.force.links().push(item);
                  }
                });

                // console.log(JSON.stringify(swgraph.graph.force.links()));
                if (swgraph.graph.force.links().length > 0) {
                  // swgraph.algorithm.updateTriangleNode(swgraph.graph.force.links());
                  // swgraph.taxonomy.updateTaxonomy(data);
                }
                // hth修改树刷新条件hth20160825
                // if (swgraph.taxonomy.isActive){
                if (bol) {
                  // hth20160819以下一行屏蔽，不然点击左侧子类时，创建的新Panel只有子类；
                  swgraph.taxonomy.createTaxonomyPanel();
                }
                swgraph.update();
              }
            }
          })
      }
    }
  };

  swgraph.start = function (cythersql, cythersql_label) {
    // hth20160824
    tmpDataKeeper = [];
    (function() {
      // hth20160824新增以下语句用于侧边栏列表显示；****************************
      swgraph.rest.post(
        {
          'statements': [
            {
              'statement': cythersql_label, // swgraph.query.generateRelsQuery(label),
              'resultDataContents': ['row']
            }]
        }
      )
        .done(function (data) {
			  // console.log(data)
          if (data.results.length > 0) {
            var mydata = data.results[0].data;
            // console.log(mydata)
            var labelsMap = d3.map([]);
            mydata.forEach(function(item) {
              var glabels = item.row[0];
              glabels.forEach(function(label) {
                // var subnode=node.properties;
                labelsMap.set(label, label);
              });
            });
            // console.log(labelsMap)
            labelsMap.forEach(function(key, value) {
              tmpDataKeeper.push(value);
            });
          };

          if (swgraph.taxonomy.isActive) {
            swgraph.taxonomy.createTaxonomyPanel();
          }

          // console.log(tmpDataKeeper)
        })
        // console.log(tmpDataKeeper)
        // hth20160824新增以下语句用于侧边栏列表显示；****************************
    })()

    if (typeof swgraph.rest.CYPHER_URL === 'undefined') {
      swgraph.logger.error('swgraph.rest.CYPHER_URL is not set but this property is required.');
    } else {
      swgraph.checkHtmlComponents();
      console.log('checkHtmlComponents')
      console.log('result:' + swgraph.graph.isActive)
      if (swgraph.graph.isActive) {
        swgraph.graph.createGraphArea();
        swgraph.graph.createForceLayout();

        // hth20160824
        /*
          var create = (function(){
            var count = 0;
            return function(){
              if(count == 0){
                swgraph.graph.createGraphArea();
                swgraph.graph.createForceLayout();
                count += 1;
              }
            }
          })();
          create();
          */
      }

      if (swgraph.graph.isActive) {
        swgraph.rest.post(
          {
            'statements': [
              {
                'statement': cythersql, // swgraph.query.generateRelsQuery(label),
                'resultDataContents': ['graph']
              }]
          }

          /*
            ,
            {
              "statements2": [
                {
                  "statement":cythersql2,// swgraph.query.generateRelsQuery(label),
                  "resultDataContents":["graph"]
                }]
            }
            */

        )
          .done(function (data) {
            // console.log(data)
            // console.log(JSON.stringify(data));
            // console.log(JSON.stringify(data.results[0].data));
            if (swgraph.graph.force.nodes().length > 0) {
              swgraph.graph.force.nodes().splice(0, swgraph.graph.force.nodes().length);
              swgraph.graph.force.links().splice(0, swgraph.graph.force.links().length);
              swgraph.update();
            }
            if (data.results.length > 0) {
              swgraph.eventType = swgraph.algorithm.type.NONE;
              var mydata = data.results[0].data;
              // console.log(mydata)
              var snodes = [];
              var edges = [];
              var linksMap = d3.map([]);
              var nodesMap = d3.map([]);
              rulePR_keeper = [];
              mydata.forEach(function(item) {
                var gnodes = item.graph.nodes;
                // var relations=item.graph.relationships;
                // var relnode={};

                gnodes.forEach(function(node) {
                  // hth20160816

                  var y = node.properties.rulePR;
                  // hth20160825一定要考虑rulePR不存在的情况！！！
                  if (y) { rulePR_keeper.push(y); }
                  // console.log(node);
                  // hth20160816

                  var subnode = node.properties;
                  subnode['id'] = node.id;
                  subnode['label'] = node.labels;
                  subnode['status'] = 1;
                  subnode['expand'] = false;
                  subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
                  subnode['internalLabel'] = node.labels[0];
                  nodesMap.set(node.id, subnode);
                });
              });

              nodesMap.forEach(function(key, value) {
                swgraph.graph.force.nodes().push(value);
              });

              // console.log(mydata)
              mydata.forEach(function(item) {
                var relations = item.graph.relationships;
                relations.forEach(function(edge) {
                  var nodeA = edge.startNode;
                  var nodeB = edge.endNode;
                  if (nodeA > nodeB) {
                    nodeA = edge.endNode;
                    nodeB = edge.startNode;
                  }
                  if (linksMap.has(nodeA + '-' + nodeB)) {
                    var templist = linksMap.get(nodeA + '-' + nodeB);
                    templist.push({
                      'source': nodesMap.get(edge.startNode),
                      'target': nodesMap.get(edge.endNode),
                      // "source":swgraph.graph.findNode(edge.startNode),
                      // "target":swgraph.graph.findNode(edge.endNode),
                      'id': edge.id,
                      'relation': edge.type,
                      'relCommunity': nodesMap.get(edge.startNode).communityrule1,
                      'properties': edge.properties,
                      // hth20160817nodeA用于tick中判断不同起点箭头是否要反向；不然会重叠；
                      'nodeA': nodeA
                    });
                    // console.log(nodeA+"-"+nodeB)
                    linksMap.set(nodeA + '-' + nodeB, templist);
                  } else {
                    // console.log(nodeA+"-"+nodeB)
                    linksMap.set(nodeA + '-' + nodeB, [{
                      'source': nodesMap.get(edge.startNode),
                      'target': nodesMap.get(edge.endNode),
                      // "source":swgraph.graph.findNode(edge.startNode),
                      // "target":swgraph.graph.findNode(edge.endNode),
                      'id': edge.id,
                      'relation': edge.type,
                      'relCommunity': nodesMap.get(edge.startNode).communityrule1,
                      'properties': edge.properties,
                      // hth20160817nodeA用于tick中判断不同起点箭头是否要反向；不然会重叠；
                      'nodeA': nodeA
                    }])
                  }
                });
              });
              // console.log(JSON.stringify(linksMap));
              linksMap.forEach(function(key, value) {
                // console.log(JSON.stringify(value));
                var len = value.length;
                for (var index = 0; index < len; index++) {
                  var item = value[index];
                  item['ccccount'] = len;
                  item['iiiindex'] = index;
                  // console.log(item)
                  swgraph.graph.force.links().push(item);
                }
              });

              // console.log(JSON.stringify(swgraph.graph.force.links()));
              if (swgraph.graph.force.links().length > 0) {
                // swgraph.algorithm.updateTriangleNode(swgraph.graph.force.links());
                // swgraph.taxonomy.updateTaxonomy(data);
              }

              // hth20160824创建数据面板的指令移到上面另一个post请求函数内；****************
              /*
                if (swgraph.taxonomy.isActive){
                  swgraph.taxonomy.createTaxonomyPanel();
                }
                */
              // hth20160824创建数据面板的指令移到上面另一个post请求函数内；***************

              // console.log(swgraph.graph.force.nodes())
              // hth20160823在数据量较大时，不建议开始就进行force.start()，非常卡，此处暂时屏蔽；
              // tmpDataKeeper.push(swgraph.graph.force.nodes())
              // console.log(tmpDataKeeper)
              swgraph.update();
            }
          })
          .fail(function (xhr, textStatus, errorThrown) {
            //	swgraph.graph.node.chooseWaiting = false;
          });
      }
    }
  };

  /***
     * Graph-Aided-Search 查询
    */
  swgraph.essearch = function(strsql) {
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
      .done(function(data) {
        // console.log(JSON.stringify(data));
        var hits = [];
        if (data['hits'].hasOwnProperty('hits')) {
          var res = data['hits']['hits'];
          $.each(res, function (i, item) {
            hits.push(item._source.objectId);
          })
        }
        // console.log(hits);
        console.log(swgraph.query.generateNodeObjIDsQuery(hits, 'Book', 1));
        swgraph.searchstart(swgraph.query.generateNodeObjIDsQuery(hits, 'Book', 1), 0);
      })
      .fail(function (xhr, textStatus, errorThrown) {
        console.log('error');
      });
  };
  swgraph.checkHtmlComponents = function () {
    var graphHTMLContainer = d3.selectAll('div');
    // console.log(graphHTMLContainer)
    var taxonomyHTMLContainer = d3.select('#' + swgraph.taxonomy.containerId);
    // var queryHTMLContainer = d3.select("#" + swgraph.queryviewer.containerId);
    // var cypherHTMLContainer = d3.select("#" + swgraph.cypherviewer.containerId);
    var resultsHTMLContainer = d3.select('#' + swgraph.result.containerId);
    if (graphHTMLContainer.empty()) {
      swgraph.logger.debug("The page doesn't contain a container with ID = \"" + swgraph.graph.containerId + '" no graph area will be generated. This ID is defined in swgraph.graph.containerId property.');
      swgraph.graph.isActive = false;
    } else {
      swgraph.graph.isActive = true;
    }
    if (taxonomyHTMLContainer.empty()) {
      swgraph.logger.debug("The page doesn't contain a container with ID = \"" + swgraph.taxonomy.containerId + '" no taxonomy filter will be generated. This ID is defined in swgraph.taxonomy.containerId property.');
      swgraph.taxonomy.isActive = false;
    } else {
      swgraph.taxonomy.isActive = true;
    }
    if (resultsHTMLContainer.empty()) {
      swgraph.logger.debug("The page doesn't contain a container with ID = \"" + swgraph.result.containerId + '" no result area will be generated. This ID is defined in swgraph.result.containerId property.');
      swgraph.result.isActive = false;
    } else {
      swgraph.result.isActive = true;
    }
    /*
       if(queryHTMLContainer.empty()){
       swgraph.logger.debug("The page doesn't contain a container with ID = \"" + swgraph.queryviewer.containerId + "\" no query viewer will be generated. This ID is defined in swgraph.queryviewer.containerId property.");
       swgraph.queryviewer.isActive = false;
       }else{
       swgraph.queryviewer.isActive = true;
       }
       if(cypherHTMLContainer.empty()){
       swgraph.logger.debug("The page doesn't contain a container with ID = \"" + swgraph.cypherviewer.containerId + "\" no cypher query viewer will be generated. This ID is defined in swgraph.cypherviewer.containerId property.");
       swgraph.cypherviewer.isActive = false;
       } else {
       swgraph.cypherviewer.isActive = true;
       }

       */
  };
  swgraph.update = function() {
    swgraph.updateGraph();
    /*
       swgraph.graph.force.nodes().forEach(function(item){
       swgraph.graph.node.expandNode(item);
       })
       */
    /*
       if (swgraph.queryviewer.isActive) {
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
  // hth20160824请求labels，改用label接口；
  swgraph.rest.CYPHER_URL = 'http://localhost:7474/db/data/transaction/commit';
  swgraph.rest.CYPHER_URL2 = 'http://localhost:7474/db/data/labels';
  swgraph.rest.ES_URL = 'http://192.168.0.12:9200/neo4j-index/Book/_search';

  /*
    swgraph.rest.post = function (data1,data2) {
      var strData1 = JSON.stringify(data1);
      var strData2 = JSON.stringify(data2);
      //console.log(data)
      //console.log(strData)

      var dataAll = $.extend({},data1, data2)
      console.log(dataAll)
      var strDataAll = JSON.stringify(dataAll);
      console.log(strDataAll)

      swgraph.logger.info("REST POST:" + strData2);
      return $.ajax({
        type: "POST",
        beforeSend: function (request) {
          if (swgraph.rest.AUTHORIZATION) {
            request.setRequestHeader("Authorization", swgraph.rest.AUTHORIZATION);
          }
        },
        url: swgraph.rest.CYPHER_URL,
        contentType: "application/json",
        data: strDataAll
      });
    };
    */

  swgraph.rest.post = function (data) {
    var strData = JSON.stringify(data);
    // console.log(data)
    // console.log(strData)
    swgraph.logger.info('REST POST:' + strData);
    return $.ajax({
      type: 'POST',
      beforeSend: function (request) {
        if (swgraph.rest.AUTHORIZATION) {
          request.setRequestHeader('Authorization', swgraph.rest.AUTHORIZATION);
        }
      },
      url: swgraph.rest.CYPHER_URL,
      contentType: 'application/json',
      // hth20160824
      Accept: 'application/json; charset=UTF-8',
      data: strData
    });
  };

  swgraph.rest.espost = function(data) {
    var strData = JSON.stringify(data);
    return $.ajax({
      type: 'POST',
      url: swgraph.rest.ES_URL,
      contentType: 'application/json; charset=UTF-8',
      crossDomain: true,
      data: strData
    });
  };

  // LOGGER -----------------------------------------------------------------------------------------------------------
  swgraph.logger = {};
  swgraph.logger.LogLevels = Object.freeze({DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4});
  swgraph.logger.LEVEL = swgraph.logger.LogLevels.NONE;
  swgraph.logger.TRACE = false;

  swgraph.logger.log = function (logLevel, message) {
    if (console && logLevel >= swgraph.logger.LEVEL) {
      if (swgraph.logger.TRACE) {
        message = message + '\n' + new Error().stack
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
    swgraph.logger.log(swgraph.logger.LogLevels.DEBUG, message);
  };
  swgraph.logger.info = function (message) {
    swgraph.logger.log(swgraph.logger.LogLevels.INFO, message);
  };
  swgraph.logger.warn = function (message) {
    swgraph.logger.log(swgraph.logger.LogLevels.WARN, message);
  };
  swgraph.logger.error = function (message) {
    swgraph.logger.log(swgraph.logger.LogLevels.ERROR, message);
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
    var nodetreeContainer = $('#' + swgraph.taxonomy.nodetreepaenlId);
    var linktreeContainer = $('#' + swgraph.taxonomy.linktreepaenlId);
    var zTreeNodeObj, zTreeListObj;
    var setting = {
      callback: {
        onClick: zTreeOnClick
      }
    };
    function zTreeOnClick(event, treeId, treeNode) {
      var treeObj = $.fn.zTree.getZTreeObj(swgraph.taxonomy.nodetreepaenlId);
      var sNodes = treeObj.getSelectedNodes();
      if (sNodes.length > 0) {
        var level = sNodes[0].level;
      }
      // console.log(sNodes[0].label)
      // console.log(level)
      if (level > 1) {
        swgraph.searchstart(swgraph.query.generateNodeIDsQuery(treeNode.nodelist, 1), false);
      } else {
        swgraph.searchstart(swgraph.query.generateRootNodeIDsQuery(sNodes[0].label), 1, true, sNodes[0].label);
      }

      // hth以下切换节点展开代码多余，影响体验？hth20160825
      /*
        if(treeNode.open==true){
          treeObj.expandNode(treeNode, false, false, false);
        }else{
          treeObj.expandNode(treeNode, true, false, false);
        }
        */
    }
    var zNodes = [];
    var nodemap = d3.map(zNodes, function(d) {
      return d.categoryName;
    });
      // hth20160824以下原版暂时屏蔽，修改显示内容；*******************************
      /*
      swgraph.graph.force.nodes().forEach(function(item,i){
        //console.log(i);
        zNodes.push(item.id);
        if(!nodemap.has(item.internalLabel)){
          nodemap.set(item.internalLabel,{label:item.internalLabel,name:item.internalLabel+"(1)",nodelist:[item.id],count:1,open:true,children:[]});
        }
        else {
          //console.log(JSON.stringify(nodemap.values()));
          var content = nodemap.get(item.internalLabel);
          var count = content.count + 1;
          var nodelist=content.nodelist;
          nodelist.push(item.id);
          nodemap.set(item.internalLabel,{label:item.internalLabel,name:item.internalLabel+"("+count+")",nodelist:nodelist,count:count,open:true,children:[]})
        }
      });
      */
      // hth20160824以下原版暂时屏蔽，修改显示内容；*******************************

      // 以下尝试在左侧显示全部门店；
    tmpDataKeeper.forEach(function(item, i) {
      // console.log(i);
      zNodes.push(item);
      nodemap.set(item, {label: item, name: item + '(总数)', nodelist: [item], count: 1, open: false, children: []});
    });

    /*
       //hth20160808创建父节点******************
       swgraph.graph.force.nodes().forEach(function(item,i){
       //console.log(item.internalLabel); STORE7189
       zNodes.push(item.communityrule);//力导向图节点的ID组成的数组；
       if(!nodemap.has(item.communityrule)){
       nodemap.set(item.communityrule,{label:item.communityrule,name:item.communityrule+"(1)",nodelist:[item.id],count:1,open:true,children:[]});//预先设置好空的子集数组供后面使用；
       }
       else {
       //console.log(JSON.stringify(nodemap.values()));
       var content = nodemap.get(item.communityrule);
       var count = content.count + 1;
       var nodelist=content.nodelist;
       nodelist.push(item.communityrule);
       nodemap.set(item.communityrule,{label:item.communityrule,name:item.communityrule+"("+count+")",nodelist:nodelist,count:count,isParent:true,open:true,children:[]})
       }
       //console.log(nodemap.get(item.internalLabel))
       //console.log(item)
       });

       //hth20160808创建父节点***************
       */

    swgraph.graph.node.structure = [];
    swgraph.graph.link.structure = [];
    nodemap.forEach(function(key, value) {
      // console.log(key);
      // console.log(value);
      var childmap = d3.map(value.children, function(d) {
        return d.label;
      });

        // hth20160824下列if语句无作用？屏蔽后貌似没有任何影响；
      var nodestructure = {};
      swgraph.graph.force.nodes().filter(function(d) {
        return d.internalLabel == value.label;
      }).forEach(function(item, i) {
        if (i == 0) {
          // console.log(item);
          var resultAttributes = swgraph.provider.getReturnAttributes(item.internalLabel);
          var attribute = d3.set([]);
          resultAttributes.forEach(function(ditem, di) {
            // console.log(ditem);
            attribute.add(ditem);
          });
          // console.log(resultAttributes);
          nodestructure['label'] = item.internalLabel;
          nodestructure['attibute'] = attribute.values();
          nodestructure['type'] = 'node';
          swgraph.graph.node.structure.push(nodestructure);
        }
        // hth20160824下列if语句无作用？屏蔽后貌似没有任何影响；

        // console.log(item.internalLabel)
        var type = item[swgraph.provider.getCategoryName(item.internalLabel)];
        // console.log(type)
        // console.log(JSON.stringify(value.children));
        // tnodelist.push(item.id);

        // hth20160808
        /*
           var stype=type;
           if(type==2){
           stype="学生";
           }
           if(type==1){
           stype="教师";
           }
           */

        if (childmap.has(type)) {
          var tnodelist = childmap.get(type)['nodelist'];
          var count = childmap.get(type)['count'] + 1;
          tnodelist.push(item.id);
          childmap.set(type, {label: item.internalLabel, categoryName: type, name: type + '(' + count + ')', nodelist: tnodelist, count: count});
        } else {
          childmap.set(type, {label: item.internalLabel, categoryName: type, name: type + '(1)', nodelist: [item.id], count: 1});
        }
      });
      // console.log(JSON.stringify(swgraph.graph.node.structure));

      value.children = childmap.values();
      // console.log(childmap)
      // console.log(childmap.values())
      value.children.sort(function(a, b) {
        return b.count - a.count;
      });
      nodemap.set(key, value);
    });
    nodemap.values().sort(function(a, b) {
      return b.count - a.count;
    });
    zTreeNodeObj = $.fn.zTree.init(nodetreeContainer, setting, [{label: 'all', categoryName: 'root', name: '所有(' + zNodes.length + ')', nodelist: zNodes, count: zNodes.length, open: true, children: nodemap.values()}]);

    // hth20160808下方尝试在节点下再添加节点
    // $.fn.zTree.init(nodetreeContainer, setting, [{label:"all",categoryName:"root",name:"所有门店("+zNodes.length+")",nodelist:zNodes,count:zNodes.length,open:true,children:nodemap.values()}]);

    linksetting = {
      callback: {
        onClick: zTreeLinkOnClick
      }
    };
    function zTreeLinkOnClick(event, treeId, treeNode) {
      // console.log(event);
      expandlinktree(treeNode);
    }
    function expandlinktree(treeNode) {
      var listlinks = swgraph.graph.force.links().filter(function(d) {
        return treeNode.linklist.indexOf(d.source.id) > -1 || treeNode.linklist.indexOf(d.target.id) > -1;
      });
      var treeObj = $.fn.zTree.getZTreeObj(swgraph.taxonomy.linktreepaenlId);
      if (treeNode.label == '子图') {
        if (treeNode.clicked == false) {
          swgraph.algorithm.restpost(
            listlinks, swgraph.algorithm.type.CHILDGRAPH
          ).done(function (data) {
            // console.log(JSON.stringify(data));
            // var node = treeObj.getNodeByTId(treeNode.tId);
            var dataIn = data[0].obj;
            // console.log(JSON.stringify(dataIn));
            dataIn.sort(function (a, b) {
              return b.length - a.length;
            });
            treeObj.removeChildNodes(treeNode);
            $.each(dataIn, function(i, item) {
              // console.log(item);
              treeObj.addNodes(treeNode, {
                label: 'graph',
                name: '子图' + i + '(' + item.length + ')',
                linklist: item,
                count: item.length,
                open: false
              });
            });
            treeNode.name = '子图(' + dataIn.length + ')';
          }).fail(function (r) {
            console.log('error' + r);
          }).always(function () {
            // alert( "complete" );
            // swgraph.result.hasChanged=true;
            treeNode.clicked = true;
            treeObj.updateNode(treeNode);
            treeObj.expandNode(treeNode, false, false, false);
          });
        }
      } else {
        // console.log(treeNode.linklist);
        swgraph.searchstart(swgraph.query.generateNodeIDsQuery(treeNode.linklist, 1), 1);
      }
      // console.log(treeNode.open);

      /*
        //hth20160825
        if(treeNode.open==true){
          treeObj.expandNode(treeNode, false, false, false);
        }else{
          treeObj.expandNode(treeNode, true, false, false);
        }
        */
    }
    function updateChildrenGraphTree() {
      var treeObj = $.fn.zTree.getZTreeObj(swgraph.taxonomy.linktreepaenlId);
      var nodes = treeObj.getNodesByParam('name', '子图', null);
      for (var ii in nodes) {
        var node = nodes[ii];
        var childnode = treeObj.getNodeByTId(node.tId);
        // childnode.click;
        expandlinktree(childnode);
      }
    }

    // 将d.relation以及item.relation改成其他relationships的属性，则可以自动生成对应分组的列表hth；
    var zLinks = [];
    var linkmap = d3.map(zLinks, function(d) {
      return d.relCommunity;
    });
      // (function(){console.log(swgraph.graph.force.links())})()
    swgraph.graph.force.links().forEach(function(item, i) {
      if (item.target.communityrule1 == item.source.communityrule1) {
        zLinks.push(item.id);
        if (!linkmap.has(item.relCommunity)) {
          // 暂时不需社区links里面的子图，将childrten清空；hth20160827；
          // linkmap.set(item.relCommunity,{label:item.relCommunity,name:item.relCommunity+"(1)",properties:item.properties,linklist:[item.source.id,item.target.id],count:1,open:false,children:[{label:item.relCommunity+"子图",name:"子图",clicked:false,linklist:[item.id],open:false,isParent:true,children:[]}]});
          linkmap.set(item.relCommunity, {
            label: item.relCommunity,
            name: '社区:' + item.relCommunity + '(1)',
            properties: item.properties,
            linklist: [item.source.id, item.target.id],
            count: 1,
            open: false,
            children: []
          });
        } else {
          // console.log(JSON.stringify(nodemap.values()));
          var content = linkmap.get(item.relCommunity);
          var count = content.count + 1;
          var linklist = content.linklist;
          linklist.push(item.source.id);
          linklist.push(item.target.id);

          // 暂时不需社区links里面的子图，将childrten清空；hth20160827；
          // linkmap.set(item.relCommunity,{label:item.relCommunity,name:item.relCommunity+"("+count+")",properties:item.properties,linklist:linklist,count:count,open:false,children:[{label:"子图",name:"子图",open:false,clicked:false,isParent:true,linklist:linklist,children:[]}]});
          linkmap.set(item.relCommunity, {
            label: item.relCommunity,
            name: '社区:' + item.relCommunity + '(' + count + ')',
            properties: item.properties,
            linklist: linklist,
            count: count,
            open: false,
            children: []
          });
        }
      }
    });

    // linkmap.set("childmap",{label:"子图",name:"子图",linklist:zNodes,open:false,clicked:false,isParent:true,children:[]});
    zTreeListObj = $.fn.zTree.init(linktreeContainer, linksetting, [{label: 'all', categoryName: 'root', name: '所有(' + zLinks.length + ')', linklist: zNodes, count: zLinks.length, open: true, children: linkmap.values()}]);
    updateChildrenGraphTree();
    // console.log(tmpDataKeeper)
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
    var taxo = d3.select('#' + swgraph.taxonomy.containerId);
    if (taxo.filter('.disabled').empty()) {
      taxo.classed('disabled', true);
    } else {
      taxo.classed('disabled', false);
    }
  };
  swgraph.tools.toggleFullScreen = function () {
    var elem = document.getElementById(swgraph.graph.containerId);
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
      // $(elem).width(document.body.clientWidth);
    } else {
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
  };

  // hth20160809创建鼠标移入节点时的显示框——createGraphArea中有效，在此处无效
  /*
    d3.select("body")
      .append("div")
      .attr("id","tooltip")
      .style("position","absolute")

     .style("opacity",0.0)
     .style("position","absolute")
     .style("width","auto")
     .style("height","auto")
     .style("text-align","center")
     .style("font-size","14px")
     .style("border","2px solid black")
     .style("border-radius","5px")
     .style("background-color","gray")
     .style("color","white")
     .style("visibility","hidden")
     .style("padding","5px 10px 5px 10px");

//hth20160809创建鼠标移入节点时的显示框
     */
  // hth20160809创建点击按钮时，显示隐藏节点的功能

  swgraph.tools.linkSwitch = function() {
    var selection = d3.select('#' + swgraph.graph.link.gID).selectAll('g');
    // console.log(selection.array)
    // console.log(selection[0])

    if (selection[0].length != 0) {
      var judgement = selection.classed('toggleby_communityrule');
      // console.log(selection);
      // console.log(judgement)

      selection.classed('toggleby_communityrule', function() {
        var bol = !judgement;
        // console.log(bol);
        // console.log(selection)
        // console.log(judgement)
        return bol;
      });
    } else {
      alert('没有关系以供显示')
    }

    // hth20160822定义一个全局变量，控制tick函数内部link画法的启动；
    tickToggle = judgement;
    swgraph.graph.force.resume();

    var array = swgraph.graph.force.nodes()
    for (var i = 0, len = array.length; i < len; i++) {
      array[i].fixed = judgement;
    }
  };
  // hth20160809创建点击按钮时，显示隐藏节点的功能

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
  swgraph.graph.SHOW_LINKS = 'Show Links'

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

    // hth20160812****************放在此处有效。放在linkSwitch的上面那里是无效的！不会被运行！

    var htmlContainer = d3.select('#' + swgraph.graph.containerId);
    var toolbar = htmlContainer
      .append('div')
      .attr('class', 'ppt-toolbar');

      // 增加一个按钮，显示和隐藏屏幕线条；hth20160809
    toolbar.append('span')
      .attr('id', 'swgraph-linkswitch-menu')
      .attr('title', swgraph.graph.SHOW_LINKS)
      .attr('class', 'ppt-menu center')
      .on('click', swgraph.tools.linkSwitch);
    // 增加一个按钮，显示和隐藏屏幕线条；hth20160809

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

    // hth20160819call移动到了swgraph.graph.selectArea事件内。双击后才能进行缩放；

    var svgTag = htmlContainer.append('svg')
      .call(swgraph.graph.zoom.on('zoom', swgraph.graph.rescale));
    svgTag.on('dblclick.zoom', null)
    // 双击以后进入缩放平移模式功能，暂时屏蔽；
    // .on("dblclick", swgraph.graph.selectArea)
      .attr('class', 'ppt-svg-graph')

      // hth20160819brush相关；
      // svgTag.call(swgraph.graph.brush)
    // .style("fill-opacity",0.3)

    htmlContainer.append('svg')
    // console.log(htmlContainer)

    // hth20160809将环形菜单进行改善，移出后自动关闭，所以以下一条暂时屏蔽
    // .on("mousedown",swgraph.graph.node.mouseDownNode);
    if (!swgraph.graph.WHEEL_ZOOM_ENABLED) {
      // Disable mouse wheel events.
      svgTag.on('wheel.zoom', null)
        .on('mousewheel.zoom', null);
    }

    swgraph.graph.svg = svgTag.append('svg:g');
    // console.log(svgTag)
    // console.log(swgraph.graph.svg)
    swgraph.graph.svg.append('g').attr('id', swgraph.graph.link.gID);
    swgraph.graph.svg.append('g').attr('id', swgraph.graph.node.gID);

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
      // hth20160805*****此处的document和clientHeight可能造成全屏错误；
      return document.getElementById(swgraph.graph.containerId).clientHeight;
    }
  };

  // hth20160822建立创建刷子的函数；
  swgraph.graph.createBrush = function() {
    // hth20160819创建一个刷子相关
    var XbrushScale = d3.scale.linear()
      // .domain([50,450])
      .range([0,
        // 1000

        (function() {
          // console.log(swgraph.graph.getSVGWidth());
          return swgraph.graph.getSVGWidth();
        })()

      ]);
    var YbrushScale = d3.scale.linear()
      // .domain([50,450])
      .range([0,
        // 1000

        (function() {
          // console.log(swgraph.graph.getSVGHeight());
          return swgraph.graph.getSVGHeight();
        })()

      ]);
    swgraph.graph.brush = d3.svg.brush()
      .x(XbrushScale)
      .y(YbrushScale)
    // .extent([[0,0],[0.5,0.5]])
    // .on("brush",function(){
    // console.log(swgraph.graph.brush.extent())
    // console.log(swgraph.graph.getSVGWidth())
    // })
      // .on("brush",swgraph.graph.brushSelect);
  }

  swgraph.graph.rescale = function() {
    var trans = d3.event.translate,
      scale = d3.event.scale;

      // 添加以后，缩放时会进行路径重绘制hth20160817;
      // 注意：swgraph.update()只能放在这里，放在下面不行；swgraph.graph.force.start()可以放在下面；
      // swgraph.update();

      // swgraph.graph.force.start();

      // console.log(scale)
      // 缩放时节点文字的显示隐藏hth20160805
    if (scale > 1.2) {
      d3.select('svg').selectAll('.ppt-g-node-middleground').selectAll('text').style('display', 'block');
    } else {
      d3.select('svg').selectAll('.ppt-g-node-middleground').selectAll('text').style('display', 'none');
    }

    // 缩放时连接文字的显示隐藏hth20160805
    if (scale > 1.2) {
      d3.select('svg').selectAll('#swgraph-glinks').selectAll('text').style('display', 'block');
    } else {
      d3.select('svg').selectAll('#swgraph-glinks').selectAll('text').style('display', 'none');
    }
    // console.log(scale)

    // 添加以后，缩放时会进行路径重绘制hth20160817;swgraph.graph.force.start()可以放在上面或者此处；比swgraph.update()更好；
    // 再数据较大时，每次缩放重新开始影响性能，放弃hth20160818
    // swgraph.graph.force.start();
    // swgraph.graph.force.resume();

    swgraph.graph.svg.attr('transform',
      'translate(' + trans + ')' +
        ' scale(' + scale + ')');
  };

  // hth20160819双击进行平移缩放以及普通模式间的切换；
  swgraph.graph.selectArea = function() {
    var toggle = d3.select('svg').style('cursor')
    // console.log(toggle)
    if (toggle == 'default') {
      d3.select('svg').style('cursor', 'move')
        .call(swgraph.graph.zoom.on('zoom', swgraph.graph.rescale));
    } else {
      d3.select('svg').style('cursor', 'default')
        .call(swgraph.graph.zoom.on('zoom', null));
    }
  };

  // hth20160819brush刷子相关函数；
  swgraph.graph.brushSelect = function() {
    console.log('brushthis')
  };

  /*************************************************************
     * Default parameters used to configure D3.js force layout.
     * These parameter can be modified to change graph behavior.
     ************************************************************/
  swgraph.graph.LINK_DISTANCE = 100; // 150;
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

      // 以下为默认方法
      /*
         .linkDistance(function (d) {
         if (d.type === swgraph.graph.link.LinkTypes.RELATION) {
         return ((3 * swgraph.graph.LINK_DISTANCE) / 2);
         } else {
         return swgraph.graph.LINK_DISTANCE;
         }
         })
         */

      // 以下为结合方法
      .linkDistance(function (d) {
        // console.log(d.source.communityrule1)
        // console.log(d)
        if (d.source.hasOwnProperty('communityrule1')) {
          if (d.source.communityrule1 !== d.target.communityrule1) {
            return swgraph.graph.LINK_DISTANCE;
          } else {
            // console.log(rulePR_keeper)
            var maxrulePR = Math.max.apply(this, rulePR_keeper);
            var minrulePR = Math.min.apply(this, rulePR_keeper);
            rulePR_Linear = d3.scale.linear()
              .domain([minrulePR, maxrulePR])
              .range([5, 50]);
            var mindistance = Math.round(rulePR_Linear(d.source.rulePR)) + Math.round(rulePR_Linear(d.target.rulePR))
            // console.log(mindistance)
            var distance = 0.001 / Number(d.properties.suport);// suport越大，关系越紧密，距离distance越近
            if (distance < swgraph.graph.LINK_DISTANCE) {
              return (distance < mindistance) ? mindistance : distance;
            } else {
              return swgraph.graph.LINK_DISTANCE / 2;
            }
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
      // 根据节点连接数设置电荷

      /*
         //hth20160809以下为根据节点关系数量来决定排斥力大小，此方法参数还需要深究暂时取消！！！！
         .charge(function(d){
         //console.log(d.weight)
         var charge = d.weight*(500) - 4600
         if(charge < 0){
         return charge
         }else{
         return -50
         }
         })

         */

      .charge(function (d) {
        if (d.charge) {
          return d.charge;
        } else {
          return swgraph.graph.CHARGE;
        }
      })
      .theta(swgraph.graph.THETA)
      .gravity(swgraph.graph.GRAVITY)
      // hth20160819添加力导向图结束时的监听，将links连接画法写在此处也许可以增加图形导入速度；
      // .on("end",swgraph.graph.end)

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
      .on('drag', function(d, i) {
        // label_text_2.text("拖拽状态：进行中");
      });

    /*
      //函数的先后顺序很重要；先要执行getSVGWidth和getSVGHeight函数以后，再执行createBrush，因为在
      //createBrush中需要用到getSVGWidth和getSVGHeight的值；所以保证createBrush在后面执行才能获取正确值；
      //而call(swgraph.graph.brush)必须在createBrush之后执行，因为createBrush执行以后才有swgraph.graph.brush；
      swgraph.graph.createBrush();
      //hth20160819刷子相关：给svg里的最大的g调用刷子；
      d3.select("svg").append('svg:g').call(swgraph.graph.brush)
      //.selectAll("rect")
      */
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
     swgraph.logger.debug("swgraph.graph.addRootNode is called but the graph is not empty.");
     }
     swgraph.graph.force.nodes().push({
     "id": "0",
     "type": swgraph.graph.node.NodeTypes.ROOT,
     "x": swgraph.graph.getSVGWidth() / 2,
     "y": swgraph.graph.getSVGHeight() / 2,
     "label": label,
     "fixed": true,
     "internalLabel": swgraph.graph.node.generateInternalLabel(label)
     });
     swgraph.graph.rootNodeAddListeners.forEach(function (listener) {
     listener(swgraph.graph.getRootNode());
     });
     };
     */
  swgraph.graph.getRootNode = function () {
    return swgraph.graph.force.nodes()[0];
  };
  swgraph.graph.findNode = function(nodeid) {
    var nodes = swgraph.graph.force.nodes();
    for (var i in nodes) {
      if (nodes[i]['id'] == nodeid) return nodes[i];
    }
    return null;
  };

  swgraph.graph.tick = function () {
    // console.log(d)
    /*
       //此处应当增加判断，采用直线还是弧线画法，确定画法后再创建实例！！！***************hth
       var middleRelationshipIndex, defaultDeflectionStep, maximumTotalDeflection, numberOfSteps, totalDeflection, deflectionStep;

       middleRelationshipIndex = (d.count - 1) / 2;
       defaultDeflectionStep = 30;
       maximumTotalDeflection = 150;
       numberOfSteps = d.index - 1;
       totalDeflection = defaultDeflectionStep * numberOfSteps;
       deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
       deflection = deflectionStep * (d.index - middleRelationshipIndex);

       if (d.index === middleRelationshipIndex) {
       var straight=new drawStraight({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y});
       return straight.outline(straight.textWidth(d));
       } else {
       deflection = deflectionStep * (d.index - middleRelationshipIndex);
       //if (nodePair.nodeA !== relationship.source) {
       //deflection *= -1;
       var arc=new drawArc({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y}, d.index);
       return arc.outline(arc.textWidth(d));
       }
       */
    // 可在此处定义跟样式相关的确定函数,得到具体参数以后当做变量传入下面的函数；hth20160817
    // links的线宽
    var arrowWidth = 2// 1/8;因为卡顿，背景选择线屏蔽，将此处加粗方便鼠标选取；
    arrowWidth2 = arrowWidth * 20;
    // 箭头尖端宽度
    var headWidth = 12// 6;因为卡顿，背景选择线屏蔽，将此处加粗方便鼠标选取；
    headWidth2 = headWidth * 2;
    // 箭头尖端长度
    var headHeight = 12// 6;因为卡顿，背景选择线屏蔽，将此处加粗方便鼠标选取；
    headHeight2 = headHeight * 3;

    // tick内部重复用到的参数在此处统一设置，下面重复的部分删除；
    var defaultDeflectionStep = 15;
    var maximumTotalDeflection = 150;
    // hth20160819
    var maxrulePR = Math.max.apply(this, rulePR_keeper);
    var minrulePR = Math.min.apply(this, rulePR_keeper);
    var rulePR_Linear = d3.scale.linear()
      .domain([minrulePR, maxrulePR]).nice()
      .range([5, 50]);
      // console.log(minrulePR)
      // deflection = 30;
      // hth20160819创建一个变量保存下面第一次创建的实例以供后面调用，避免多次创建重复实例；
      // var arc = null;
      // console.log(arc)

      // hth20160822因为较卡，考虑对此部分进行改善
    if (tickToggle == true) {
      swgraph.graph.svg.selectAll('#' + swgraph.graph.link.gID + ' > g')
        .select('path')
        .attr('fill', 'gray')
        .attr('opacity', 0.2)
        .attr('d', function(d) {
          // console.log(d)
          var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
          middleRelationshipIndex = (d.ccccount - 1) / 2;
          numberOfSteps = d.iiiindex - 1;
          totalDeflection = defaultDeflectionStep * numberOfSteps;
          deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
          deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);

          // startRadius = 26;
          // endRadius = 8;
          startRadius = Math.round(rulePR_Linear(d.source.rulePR)) || 26;
          // console.log(Math.round(rulePR_Linear(d.source.rulePR)))
          // console.log(startRadius1)
          endRadius = Math.round(rulePR_Linear(d.target.rulePR)) || 26;
          // console.log(Math.round(rulePR_Linear(d.target.rulePR)))
          // console.log(endRadius1)
          // 下面代码必须有，不然起点不同的箭头可能重叠；
          if (d.nodeA !== d.source.id) {
            deflection *= -1;
          }

          if (d.iiiindex !== middleRelationshipIndex) {
            var arc = new drawArc.arcdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
            return arc.outline(arc.textWidth(d));
          } else {
            var arc = new drawArc.straightdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
            return arc.outline(arc.textWidth(d));
          }
        });

      // hth20160817添加新的path，加宽处理，便于鼠标选择！******************
      // hth20160825因为卡顿暂时屏蔽；
      /*
         swgraph.graph.svg.selectAll("#linkOverlay")
         .attr("fill","gray")
         .attr("d",function(d){
         var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
         middleRelationshipIndex = (d.ccccount - 1) / 2;
         numberOfSteps = d.iiiindex - 1;
         totalDeflection = defaultDeflectionStep * numberOfSteps;
         deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
         deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);
         startRadius = Math.round(rulePR_Linear(d.source.rulePR))||26;
         endRadius = Math.round(rulePR_Linear(d.target.rulePR))||26;
         if (d.nodeA !== d.source.id) {
         deflection *= -1;
         }

         if(d.iiiindex !== middleRelationshipIndex){
         var arc=new drawArc.arcdraw({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y}, deflection, startRadius, endRadius, arrowWidth2, headWidth2, headHeight2);
         return arc.outline(arc.textWidth(d));
         }else{
         var arc=new drawArc.straightdraw({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y}, deflection, startRadius, endRadius, arrowWidth2, headWidth2, headHeight2);
         return arc.outline(arc.textWidth(d));
         }
         });
        */
      // hth20160817添加新的path，加宽处理，便于鼠标选择！******************
    }

    /*
        .filter(function(d){
          return !swgraph.graph.link.nodirection.has(d.relation);
        })
      */

    // 给链接集合添加transform——hth20160726********************************************************************************101752
    swgraph.graph.svg.selectAll('#' + swgraph.graph.link.gID + ' > g')
      .attr('transform', function (d) {
        var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
        middleRelationshipIndex = (d.ccccount - 1) / 2;
        numberOfSteps = d.iiiindex - 1;
        totalDeflection = defaultDeflectionStep * numberOfSteps;
        deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
        deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);
        // return "translate(" + (d.x) + "," + (d.y) + ")";
        dx = d.target.x - d.source.x;
        dy = d.target.y - d.source.y;
        angle = ((Math.atan2(dy, dx) / Math.PI * 180) + 360) % 360;
        d.naturalAngle = d.target === d.nodeA ? (angle + 180) % 360 : angle;
        // return "translate(" + d.source.x + " " + d.source.y + ") rotate(" + (d.naturalAngle + 180) + ")";//原版中有+180，带入后箭头刚好翻转，取消则ok，此处+180意义不明*********hth20160726
        return 'translate(' + d.source.x + ' ' + d.source.y + ') rotate(' + (d.naturalAngle) + ')';
      });
    // 给链接集合添加transform——hth20160726********************************************************************************101752

    swgraph.graph.svg.selectAll('#' + swgraph.graph.node.gID + ' > g')
      .attr('transform', function (d) {
        // console.log("translate(" + (d.x) + "," + (d.y) + ")");
        return 'translate(' + (d.x) + ',' + (d.y) + ')';
      });

    swgraph.graph.svg.selectAll('text.ppt-link-text-relation')
      .attr('x', function(d) {
        var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
        middleRelationshipIndex = (d.ccccount - 1) / 2;
        numberOfSteps = d.iiiindex - 1;
        totalDeflection = defaultDeflectionStep * numberOfSteps;
        deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
        deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);
        startRadius = Math.round(rulePR_Linear(d.source.rulePR)) || 26;
        endRadius = Math.round(rulePR_Linear(d.target.rulePR)) || 26;
        if (d.nodeA !== d.source.id) {
          deflection *= -1;
        }

        if (d.iiiindex !== middleRelationshipIndex) {
          var arc = new drawArc.arcdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
          return arc.textpos_x();
        } else {
          var arc = new drawArc.straightdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
          return arc.textpos_x();
        }
      })
      .attr('y', function(d, i) {
        var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
        middleRelationshipIndex = (d.ccccount - 1) / 2;
        numberOfSteps = d.iiiindex - 1;
        totalDeflection = defaultDeflectionStep * numberOfSteps;
        deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
        deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);

        // startRadius = 26;
        // endRadius = 26;
        startRadius = Math.round(rulePR_Linear(d.source.rulePR)) || 26;
        endRadius = Math.round(rulePR_Linear(d.target.rulePR)) || 26;
        if (d.nodeA !== d.source.id) {
          deflection *= -1;
        }

        if (d.iiiindex !== middleRelationshipIndex) {
          var arc = new drawArc.arcdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
          return arc.textpos_y();
        } else {
          var arc = new drawArc.straightdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
          return arc.textpos_y();
        }
      });

    // 实现文字根据角度自动旋转适应的效果*********************************hth20160801
    swgraph.graph.svg.selectAll('text.ppt-link-text-relation')
      .attr('transform', function(d, i) {
        // hth20160810在上面一个函数中，d.naturalAngle已经定义过，添加进入d的属性中了，所以此处其实可以直接读取该值；
        /*
          dx = d.target.x-d.source.x;
          dy = d.target.y-d.source.y;
          angle = ((Math.atan2(dy, dx) / Math.PI * 180) + 360) % 360;
          d.naturalAngle = d.target === d.nodeA ? (angle + 180) % 360 : angle;
          */
        // hth20160810在上面一个函数中，d.naturalAngle已经定义过，添加进入d的属性中了，所以此处其实可以直接读取该值；
        var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
        middleRelationshipIndex = (d.ccccount - 1) / 2;
        numberOfSteps = d.iiiindex - 1;
        totalDeflection = defaultDeflectionStep * numberOfSteps;
        deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
        deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);
        startRadius = Math.round(rulePR_Linear(d.source.rulePR)) || 26;
        endRadius = Math.round(rulePR_Linear(d.target.rulePR)) || 26;
        if (d.nodeA !== d.source.id) {
          deflection *= -1;
        }
        // hth20160816由于node半径可能变化，此处增加函数获取起始节点和结束节点的半径作为参数传入弧形直线画法函数；

        if (d.iiiindex !== middleRelationshipIndex) {
          var arc = new drawArc.arcdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);

          if (d.naturalAngle < 90 || d.naturalAngle > 270) {
            return null;
          } else {
            return 'rotate(180 ' + arc.textpos_x() + ' ' + arc.textpos_y() + ')';
          }
        } else {
          var arc = new drawArc.straightdraw({'x': d.source.x, 'y': d.source.y}, {'x': d.target.x, 'y': d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);

          if (d.naturalAngle < 90 || d.naturalAngle > 270) {
            return null;
          } else {
            return 'rotate(180 ' + arc.textpos_x() + ' ' + arc.textpos_y() + ')';
          }
        }
      });
    // 实现文字根据角度自动旋转适应的效果*********************************hth20160801
  };

  // hth20160819
  /*
    swgraph.graph.end = function(){
      //console.log("force_end")

      var arrowWidth = 1/8;
      arrowWidth2 = arrowWidth*100;
      //箭头尖端宽度
      var headWidth = 6;
      headWidth2 = headWidth*6;
      //箭头尖端长度
      var headHeight = 6;
      headHeight2 = headHeight*4;

      //tick内部重复用到的参数在此处统一设置，下面重复的部分删除；
      var defaultDeflectionStep = 15;
      var maximumTotalDeflection = 150;
      //hth20160819
      var maxrulePR = Math.max.apply(this,rulePR_keeper);
      var minrulePR = Math.min.apply(this,rulePR_keeper);
      var rulePR_Linear = d3.scale.linear()
        .domain([minrulePR,maxrulePR])
        .range([5,50]);
      //deflection = 30;
      //hth20160819创建一个变量保存下面第一次创建的实例以供后面调用，避免多次创建重复实例；
      //var arc = null;
      //console.log(arc)

       swgraph.graph.svg.selectAll("#" + swgraph.graph.link.gID + " > g")
       .select("path")
       .attr("fill","gray")
       .attr("d",function(d){
       //console.log(d)
       var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
       middleRelationshipIndex = (d.ccccount - 1) / 2;
       numberOfSteps = d.iiiindex - 1;
       totalDeflection = defaultDeflectionStep * numberOfSteps;
       deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
       deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);
       startRadius = Math.round(rulePR_Linear(d.source.rulePR))||26;
       endRadius = Math.round(rulePR_Linear(d.target.rulePR))||26;
       //下面代码必须有，不然起点不同的箭头可能重叠；
       if (d.nodeA !== d.source.id) {
       deflection *= -1;
       }

       if(d.iiiindex !== middleRelationshipIndex){
       var arc=new drawArc.arcdraw({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
       return arc.outline(arc.textWidth(d));
       }else{
       var arc=new drawArc.straightdraw({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y}, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
       return arc.outline(arc.textWidth(d));
       }

       });

       //hth20160817添加新的path，加宽处理，便于鼠标选择！******************
       swgraph.graph.svg.selectAll("#linkOverlay")
       .attr("fill","gray")
       .attr("d",function(d){
       var middleRelationshipIndex, numberOfSteps, totalDeflection, deflectionStep;
       middleRelationshipIndex = (d.ccccount - 1) / 2;
       numberOfSteps = d.iiiindex - 1;
       totalDeflection = defaultDeflectionStep * numberOfSteps;
       deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
       deflection = deflectionStep * (d.iiiindex - middleRelationshipIndex);
       startRadius = Math.round(rulePR_Linear(d.source.rulePR))||26;
       endRadius = Math.round(rulePR_Linear(d.target.rulePR))||26;
       if (d.nodeA !== d.source.id) {
       deflection *= -1;
       }

       if(d.iiiindex !== middleRelationshipIndex){
       var arc=new drawArc.arcdraw({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y}, deflection, startRadius, endRadius, arrowWidth2, headWidth2, headHeight2);
       return arc.outline(arc.textWidth(d));
       }else{
       var arc=new drawArc.straightdraw({"x":d.source.x,"y":d.source.y},{"x":d.target.x,"y":d.target.y}, deflection, startRadius, endRadius, arrowWidth2, headWidth2, headHeight2);
       return arc.outline(arc.textWidth(d));
       }

       });
       //hth20160817添加新的path，加宽处理，便于鼠标选择！******************

    };
    */

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
    swgraph.graph.link.svgLinkElements = swgraph.graph.link.svgLinkElements.data(swgraph.graph.force.links(), function(d) {
      return d.id;
    });
  };
  swgraph.graph.link.removeElements = function () {
    swgraph.graph.link.svgLinkElements.exit().remove();
  };
  swgraph.graph.link.addNewElements = function () {
    var newLinkElements = swgraph.graph.link.svgLinkElements.enter().append('g')
      .attr('class', 'ppt-glink')

      // hth20160809开头就增加样式让links隐藏，效率更高！！！
      // attr为了一开始就将线段隐藏
      .attr('class', 'toggleby_communityrule')
      // classed控制线段隐藏，并且在展开新的子节点时，线段隐藏与否的状态会继承；
      .classed('toggleby_communityrule', function() {
        var flag = true,
          selection = d3.select('#' + swgraph.graph.link.gID).selectAll('g'),
          judgement = selection.classed('toggleby_communityrule');
        flag = judgement;
        return flag;
      })

      .on('mouseover', swgraph.graph.link.mouseOverLink)
      .on('mouseout', swgraph.graph.link.mouseOutLink)
      // hth20160817给links添加点击事件；
      .on('click', swgraph.graph.link.mouseClickLink)
      .call(swgraph.graph.force.drag);
      /*
       .filter(function(d){
       return d.properties.weight>1;
       }) */

    newLinkElements.append('path')
      .attr('id', function(d) {
        return 'path' + d.source.id;
      })
      .attr('stroke', '#ee4e10')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', '1');
    /* hth20160802//marker-end画法修改不在需要
        .filter(function(d){
          return !swgraph.graph.link.nodirection.has(d.relation);
        }).attr("marker-end","url(#arrow)");
        */

    newLinkElements.append('text')
      .attr('class', 'linetext')
      .attr('dy', '4')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('fill', '#68BDF6')
      .attr('font-size', '11px')
    // hth20160805正确写法;链接上的文字说明；
      .text(function(d) {
        // console.log(d)
        // console.log(d.properties.suport)
        // console.log(typeof(d.properties.suport))
        if (d.properties.suport) {
          y = Number(d.properties.suport)
          Result = y.toFixed(6);
          return Result;
        } else {
          return '值为空'
        }
      });

    // hth20160817添加新的path，加宽处理，便于鼠标选择！************
    newLinkElements.append('path')
      .attr('id', 'linkOverlay')
      .style('stroke', '#ee4e10')
      .style('fill', '#ee4e10')
      .attr('stroke-opacity', 1)
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mousemove', swgraph.graph.link.mouseMoveLink)
      // hth20160817添加新的path，加宽处理，便于鼠标选择！************

      /*
        .text(function(d){

          //hth20160810在添加新元素时，添加一个函数，用来遍历所有d——relationship，处理以后将在原始d中添加新的属性供后面画弧线使用；
          //***************************************************************
          //var arc=new drawArc.NodePairsGroups(d);
          //console.log(allRelationships)
          //***************************************************************

          var gx="";
          if(d.properties.gx){
            gx=d.properties.gx;
          }else{
            if(d.properties.weight){
              gx=d.properties.weight;
            }else{
              if(d.relation){
                switch (d.relation){
                  case "rclgx":
                    gx="人——车";
                    break;
                  case "rhgx":
                    gx="人——户";
                    break;
                  case "rygx":
                    gx="人——人";
                    break;
                  case "rzgx":
                    gx="人——住址";
                    break;
                  case "ragx":
                    gx="人——案";
                    break;
                  case "rcgx":
                    gx="人——事";
                    break;
                  case "TCC":
                    gx="同乘车";
                    break;
                  case "TZS":
                    gx="同住宿";
                    break;
                  case "TSW":
                    gx="同上网";
                    break;
                  case "ajAbd":
                    gx="案件-保单";
                    break;
                  case "ajAcl":
                    gx="案件-车辆";
                    break;
                  case "ajAdh":
                    gx="报案电话";
                    break;
                  case "ajAry":
                    gx="案件相关人员";
                    break;
                  case "bdAcl":
                    gx="保单-车辆";
                    break;
                  case "clAcz":
                    gx="车主";
                    break;
                  case "dhAry":
                    gx="机主";
                    break;
                  case "ryAbd":
                    gx="投保(受益)人";
                    break;
                  case "yhAry":
                    gx="银行账号";
                    break;
                  default:
                    gx=d.relation;
                    break;
                }
              }
              else{
                gx="未知";
              }
            }
          }
          return gx;
        });
      */

      /*
      //hth20160809给links的背景添加透明line方便选取*******************************************************
      //效果失败，弃用hth20160817
      newLinkElements.append("line")
        .attr("x1",
        function(d){
          //console.log(d)
          return d.source.x
        })
        .attr("y1",
        function(d){
          return d.source.y
        })
        .attr("x2",
        function(d){
          return d.target.x
        })
        .attr("y2",
        function(d){
          return d.target.y
        })
        .attr("class","path_overlay")
        .style("stroke","black")
        .style("stroke-width","20")
        .style("pointer-event","all")
        .style("opacity","0.0")
        .style("cursor","pointer")
        .on("mousemove", swgraph.graph.link.mouseMoveLink)
      //hth20160809*******************************************************
      */
  };

  swgraph.graph.link.updateElements = function () {
    swgraph.graph.link.svgLinkElements
      .attr('id', function (d) {
        return 'ppt-glink_' + d.id;
      });

    // hth20160817将selectAll改为select,这样不会修改第二条path的id，因此方便鼠标选择links；
    // swgraph.graph.link.svgLinkElements.selectAll("path")
    swgraph.graph.link.svgLinkElements.select('path')
      .attr('id', function (d) {
        return 'ppt-path_' + d.id
      })
      .attr('class', function (d) {
        if (d.type === swgraph.graph.link.LinkTypes.VALUE) {
          return 'ppt-link-value';
        } else {
          if (d.target.count == 0) {
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
          if (d.target.count == 0) {
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
    d3.select(this).select('path').classed('ppt-link-hover', true).transition().duration(200).attr('opacity', 0.6);
    d3.select(this).select('text').classed('ppt-link-hover', true);
    // 添加新的背景path效果
    d3.select(this).select('#linkOverlay').transition().duration(200).attr('opacity', 0.3);

    var hoveredLink = d3.select(this).data()[0];

    // hth20160809以下增加提示框显示相关代码
    var tooltip = d3.select('.tooltip');

    if (d.properties.hasOwnProperty('lift')) {
      var lift = Number(d.properties.lift);
      var confidence = Number(d.properties.confidence);
      var suport = Number(d.properties.suport);
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
    };

    /*
       if (swgraph.queryviewer.isActive) {
       swgraph.queryviewer.queryConstraintSpanElements.filter(function (d) {
       return d.ref === hoveredLink;
       }).classed("hover", true);
       swgraph.queryviewer.querySpanElements.filter(function (d) {
       return d.ref === hoveredLink;
       }).classed("hover", true);
       }

       if (swgraph.cypherviewer.isActive) {
       swgraph.cypherviewer.querySpanElements.filter(function (d) {
       return d.link === hoveredLink;
       }).classed("hover", true);
       }
       */
  };

  // hth20160809添加对于Link的鼠标移动事件
  swgraph.graph.link.mouseMoveLink = function(d) {
    d3.event.preventDefault();
    var tooltip = d3.select('.tooltip');
    tooltip.style('left', (d3.event.pageX) + 'px')
      .style('top', (d3.event.pageY + 30) + 'px')
  };
  // hth20160809添加对于Link的鼠标移动事件

  swgraph.graph.link.mouseOutLink = function () {
    d3.select(this).select('path').classed('ppt-link-hover', false).transition().duration(200).attr('opacity', 0.3);
    d3.select(this).select('text').classed('ppt-link-hover', false);
    // 添加新的背景path效果
    d3.select(this).select('#linkOverlay').transition().duration(500).attr('opacity', 0);

    var hoveredLink = d3.select(this).data()[0];

    // hth20160809以下增加提示框显示相关代码
    var tooltip = d3.select('.tooltip');
    tooltip.transition()
      .style('opacity', 0.0)
      .style('visibility', 'hidden');

    /*
       if (swgraph.queryviewer.isActive) {
       swgraph.queryviewer.queryConstraintSpanElements.filter(function (d) {
       return d.ref === hoveredLink;
       }).classed("hover", false);
       swgraph.queryviewer.querySpanElements.filter(function (d) {
       return d.ref === hoveredLink;
       }).classed("hover", false);
       }

       if (swgraph.cypherviewer.isActive) {
       swgraph.cypherviewer.querySpanElements.filter(function (d) {
       return d.link === hoveredLink;
       }).classed("hover", false);
       }
       */
  };

  // hth20160817添加link点击事件；
  swgraph.graph.link.mouseClickLink = function(d) {
    var toggle = d3.select(this).select('#linkOverlay').classed('linkChoosed');

    var rSource = d3.select('#swgraph-gnode_' + d.source.id + '').select('.ppt-g-node-background').selectAll('circle').attr('r');
    var rTarget = d3.select('#swgraph-gnode_' + d.target.id + '').select('.ppt-g-node-background').selectAll('circle').attr('r');

    var currentRSource = parseInt(rSource, 10)
    var currentRTarget = parseInt(rTarget, 10)
    // console.log(currentR);
    // console.log(typeof(currentR))
    var shaft = 8;

    // hth20160818以下添加选中链接后，两个对应端点的交互效果；
    if (toggle == false) {
      d3.select(this).select('#linkOverlay').classed('linkChoosed', true);
      d3.select(this).select('path').style('fill', '#ee4e10');
    } else {
      d3.select(this).select('#linkOverlay').classed('linkChoosed', false);
      d3.select(this).select('path').style('fill', 'gray');
    }
    // console.log(d.source.id)
    // console.log(d3.select("#swgraph-gnode_" +d.source.id+ ""))
    // var toggle = d3.select("#swgraph-gnode_" +d.source.id+ "").select(".ppt-g-node-background").selectAll("circle").style("fill-opacity")
    // console.log(toggle)

    d3.select('#swgraph-gnode_' + d.source.id + '')
      .select('.ppt-g-node-background')
      .selectAll('circle')
      .style('fill-opacity', function() {
        if (toggle == false) {
          return '1'
        } else {
          return '0'
        }
      })
      .transition()
      .duration(100)
      .attr('r', function() {
        if (toggle == false) {
          return currentRSource + shaft
        } else {
          return currentRSource
        }
      })
      .transition()
      .duration(300)
      .attr('r', function() {
        if (toggle == false) {
          return currentRSource
        } else {
          return currentRSource
        }
      });

    d3.select('#swgraph-gnode_' + d.target.id + '')
      .select('.ppt-g-node-background')
      .selectAll('circle')
      .style('fill-opacity', function() {
        if (toggle == false) {
          return '1'
        } else {
          return '0'
        }
      })
      .transition()
      .duration(100)
      .attr('r', function() {
        if (toggle == false) {
          return currentRTarget + shaft
        } else {
          return currentRTarget
        }
      })
      .transition()
      .duration(300)
      .attr('r', function() {
        if (toggle == false) {
          return currentRTarget
        } else {
          return currentRTarget
        }
      });
    // console.log(this)
  };

  swgraph.graph.link.isHasSvgRelElement = function(SvgLinkElement) {
    // var flag=false;
    var iflag = 1;
    swgraph.graph.force.links().forEach(function(item) {
      if (swgraph.graph.link.nodirection.has(item.relation)) {
        if ((SvgLinkElement.startNode == item.target.id && SvgLinkElement.endNode == item.source.id) || (SvgLinkElement.startNode == item.source.id && SvgLinkElement.endNode == item.target.id)) {
          // if (SvgLinkElement.startNode == item.source.id && SvgLinkElement.endNode == item.target.id) {
          if (SvgLinkElement.type == item.relation) {
            iflag = 0;
            return iflag;
          } else {
            iflag++;
          }
        }
      } else {
        if (SvgLinkElement.startNode == item.source.id && SvgLinkElement.endNode == item.target.id) {
          if (SvgLinkElement.type == item.relation) {
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
  swgraph.graph.link.isHasSvgLinkElement = function(edage) {
    var flag = false;
    swgraph.graph.force.links().forEach(function(item) {
      // alert(JSON.stringify(item));
      if (edage.id == item.id) {
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
  swgraph.graph.node.menu = [['移除', 1], ['选择', 1], ['社区', 1]];

  swgraph.graph.node.createMenu = function(clickedNode) {
    /* var clickedNode=d3.select(this).data()[0]; */
    var menuContainer = d3.select('#swgraph-gnode_' + clickedNode.id);
    // console.log(menuContainer.select(".swt-menu").length);
    if ($('.swt-menu').length > 0) {
      $('.swt-menu').remove();
    } else {
      // swgraph.graph.node.removeMenu();
      menuContainer.append('g')
        .attr('class', 'swt-menu')

      // hth20160809
        .on('mouseout', swgraph.graph.node.mouseOutMenu);

      var pie = d3.layout.pie().value(function (d) {
        return d[1];
      });
      var menuData = pie(swgraph.graph.node.menu);
      var arc = d3.svg.arc()
        .innerRadius(30)
        .outerRadius(60);
      var color = d3.scale.category20();
      var items = menuContainer
        .select('.swt-menu')
        .append('g')
        .attr('id', 'itemsContainer');
        /* .transition()
         .duration(400) */
      var ars = items.selectAll('g')
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
          var x = arc.centroid(d)[0];
          var y = arc.centroid(d)[1];
          return 'translate(' + x + ',' + y + ')';
        })
        .attr('text-anchor', 'middle')
        .text(function (d) {
          return d.data[0];
        })
    }
  };
  swgraph.graph.node.removeMenu = function() {
    // hth20160809以下效果改为用D3 transition写，效果更好；
    // $(".swt-menu").remove();
    d3.selectAll('.swt-menu').transition().delay(500).remove();

    // swtmenu.selectAll("*").remove();
  };

  swgraph.graph.node.attrMenu = function(clickedNode) {
    var menu = $('#swgraph-gnode_' + clickedNode.id + ' .swt-menu');
    if (!swgraph.graph.node.MenuOpen) {
      swgraph.graph.node.MenuOpen = true;
      $('.circledisplay').remove();
      $('.swt-menu').remove();
      createMenu();
    } else {
      swgraph.graph.node.MenuOpen = false;
      menu.attr('class', 'circledisplay');
    }
    function createMenu() {
      var menuContainer = d3.select('#swgraph-gnode_' + clickedNode.id);
      menuContainer.append('g')
        .attr('class', 'swt-menu')

        // hth20160809
        .on('mouseout', swgraph.graph.node.mouseOutMenu);

      var pie = d3.layout.pie().value(function(d) { return d[1]; });
      var menuData = pie(swgraph.graph.node.menu);

      var arc = d3.svg.arc()
        .innerRadius(30)
        .outerRadius(60);
      var color = d3.scale.category20();
      var items = menuContainer
        .select('.swt-menu')
        .append('g')
        .attr('id', 'itemsContainer');
        /* .transition()
         .duration(400) */
      var ars = items.selectAll('g')
        .data(menuData)
        .enter()
        .append('g')
        .attr('class', 'item')
        .attr('id', function(d, i) {
          return 'item-' + i;
        })
        .attr('data-svg-origin', '100 100')
        .on('click', function(d, i) {
          return swgraph.graph.node.menuClick(clickedNode, i);
        });

      ars.append('path')
        .transition()
        .duration(400)
        .attr('class', 'sector')
        .attr('d', function(d) {
          return arc(d);
        });
      ars.append('text')
        .transition()
        .duration(400)
        .attr('transform', function(d) {
          var x = arc.centroid(d)[0];
          var y = arc.centroid(d)[1];
          return 'translate(' + x + ',' + y + ')';
        })
        .attr('text-anchor', 'middle')
        .text(function(d) {
          return d.data[0];
        })
    }
  };

  swgraph.graph.node.generateInternalLabel = function(nodeLabel) {
    var label = nodeLabel.toLowerCase().replace(/ /g, '');
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
        swgraph.graph.node.svgNodeElements = swgraph.graph.svg.select("#" + swgraph.graph.node.gID).selectAll("g");
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
    var toRemove = swgraph.graph.node.svgNodeElements.exit().remove(); // 删除多余的元素
  };
  swgraph.graph.node.addNewElements = function () {
    var gNewNodeElements = swgraph.graph.node.svgNodeElements.enter()
      .append('g')
      .on('dblclick', swgraph.graph.node.nodedblClick)
      .on('click', swgraph.graph.node.nodeClick)
      .on('mouseover', swgraph.graph.node.mouseOverNode)
      .on('mouseout', swgraph.graph.node.mouseOutNode)
      // .on("click",swgraph.graph.node.createmenu)
      .on('mousedown', swgraph.graph.node.mouseDownNode)
      .on('contextmenu', swgraph.graph.node.clearSelection)

      // 增加鼠标移动时的监听hth20160809
      .on('mousemove', swgraph.graph.node.mouseMoveNode)

      .call(swgraph.graph.force.drag);

      // Add right click on all nodes except value
      /*
       gNewNodeElements.filter(function (d) {
       return d.type !== swgraph.graph.node.NodeTypes.VALUE;
       }).on("contextmenu", swgraph.graph.node.clearSelection);
       */
      // Disable right click context menu on value nodes
      /*
       gNewNodeElements.filter(function (d) {
       return d.type === swgraph.graph.node.NodeTypes.VALUE;
       }).on("contextmenu", function () {
       // Disable context menu on
       d3.event.preventDefault();
       });
       */
      // Most browser will generate a tooltip if a title is specified for the SVG element
      // TODO Introduce an SVG tooltip instead?

      // hth20160812以下屏蔽；取消默认鼠标移上的显示文字；
      // gNewNodeElements.append("title").attr("class", "ppt-svg-title");

      // Nodes are composed of 3 layouts and skeleton are created here.
    swgraph.graph.node.addBackgroundElements(gNewNodeElements);
    swgraph.graph.node.addMiddlegroundElements(gNewNodeElements);
    swgraph.graph.node.addForegroundElements(gNewNodeElements);
  };
  swgraph.graph.node.addBackgroundElements = function (gNewNodeElements) {
    var background = gNewNodeElements
      .append('g')
      .attr('class', 'ppt-g-node-background');
    background.append('circle')

    // hth20160809以下样式原本希望根据不同value值获取不同样式，目前来看是失效的，暂时定位固定class是否较好？
    /*
         .attr("class", function (d) {
         var y = d.rulePR;
         rulePR_keeper.push(y);
         var cssClass = "ppt-node-background-circle value";
         if (d.value !== undefined) {
         cssClass = cssClass + " selected-value";
         } else if (d.type === swgraph.graph.node.NodeTypes.ROOT) {
         cssClass = cssClass + " root";
         } else if (d.type === swgraph.graph.node.NodeTypes.CHOOSE) {
         cssClass = cssClass + " choose";
         } else if (d.type === swgraph.graph.node.NodeTypes.VALUE) {
         cssClass = cssClass + " value";
         } else if (d.type === swgraph.graph.node.NodeTypes.GROUP) {
         cssClass = cssClass + " group";
         }
         return cssClass;
         })
         */
      .attr('class', 'ppt-node-background-circle')
      .attr('stroke-width', '0')

      .style('fill-opacity', 0)
      .attr('fill', '#FFE599')
      .attr('r', swgraph.graph.node.BACK_CIRCLE_R);
  };
  swgraph.graph.node.addMiddlegroundElements = function (gNewNodeElements) {
    var middle = gNewNodeElements
      .append('g')
      .attr('class', 'ppt-g-node-middleground');
  };
  swgraph.graph.node.addForegroundElements = function (gNewNodeElements) {
    var foreground = gNewNodeElements
      .append('g')
      .attr('class', 'ppt-g-node-foreground');
    var gRelationship = foreground.append('g').attr('class', 'ppt-rel-plus-icon');
    /*
       gRelationship.append("title")
       .text("Add relationship");
       */

    // hth20160805暂时屏蔽！！！！！！！！！！！！！节点右上方+号
    /*
       gRelationship
       .append("circle")
       .attr("class", "ppt-rel-plus-background")
       .attr("cx", "23.5")
       .attr("cy", "-33")
       .attr("r", "11");
       gRelationship
       .append("path")
       .attr("class", "ppt-rel-plus-path")
       //.attr("d", "M 40,-45 35,-45 35,-50 30,-50 30,-45 25,-45 25,-40 30,-40 30,-35 35,-35 35,-40 40,-40 z");
       //.attr("d", "M 30,-35 25,-35 25,-40 20,-40 20,-35 15,-35 15,-30 20,-30 20,-25 25,-25 25,-30 30,-30 z");
       .attr("d", "M 28,-35 25,-35 25,-38 22,-38 22,-35 19,-35 19,-32 22,-32 22,-29 25,-29 25,-32 28,-32 z");
       */

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
    var gMinusRelationship = foreground.append('g').attr('class', 'ppt-rel-minus-icon');
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
    // .attr("d", "M 40,-45 25,-45 25,-40 40,-40 z");
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
      // hth20160819尝试给节点添加图形
      /*
        d3.select(this).append("image")
          .attr("width","28px")
          .attr("height","28px")
          .attr("x", d.x)
          .attr("y", d.y)
          .attr("xlink:href","http://localhost:5601"+imgUrl)
        //console.log(this)
*/

      return 'swgraph-gnode_' + d.id;
    })
    // hth20160808*****给每个点添加节点样式名称，以供过滤器使用。
    // .attr("class","gnode_hover")
    // .classed("gnode_hover",false)
    ;
    // hth20160809

    swgraph.graph.node.svgNodeElements
      .selectAll('.ppt-svg-title')
      .text(function (d) {
        // hth
        //         var y = d.rulePR;
        //         rulePR_keeper.push(y);

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
    // hth20160805
    var maxrulePR = Math.max.apply(this, rulePR_keeper);
    var minrulePR = Math.min.apply(this, rulePR_keeper);
    // console.log(rulePR_keeper)
    // Array.prototype.max = function() { return Math.max.apply({},this) } ;
    // Array.prototype.min = function() { return Math.min.apply({},this) };
    // console.log(rulePR_keeper.max());
    rulePR_Linear = d3.scale.linear()
      .domain([minrulePR, maxrulePR])
      .range([5, 50]);
    // hth20160805

    swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-background')
      .selectAll('.ppt-node-background-circle')

    // hth20160809以下样式原本希望根据不同value值获取不同样式，目前来看是失效的，暂时定位固定class是否较好？
    /*
         .attr("class", function (d) {
         var cssClass = "ppt-node-background-circle value";
         if (d.type === swgraph.graph.node.NodeTypes.VALUE) {
         cssClass = cssClass + " value";
         } else if (d.type === swgraph.graph.node.NodeTypes.GROUP) {
         cssClass = cssClass + " group";
         } else {
         if (d.value !== undefined) {
         if (d.type === swgraph.graph.node.NodeTypes.ROOT) {
         cssClass = cssClass + " selected-root-value";
         } else if (d.type === swgraph.graph.node.NodeTypes.CHOOSE) {
         cssClass = cssClass + " selected-value";
         }
         } else {
         if (d.count == 0) {
         cssClass = cssClass + " disabled";
         } else {
         if (d.type === swgraph.graph.node.NodeTypes.ROOT) {
         cssClass = cssClass + " root";
         } else if (d.type === swgraph.graph.node.NodeTypes.CHOOSE) {
         cssClass = cssClass + " choose";
         }
         }
         }
         }
         return cssClass;
         })
         */
      .attr('class', 'ppt-node-background-circle')
    // hth20160805*****************

      .attr('r', function(d) {
        if (d.hasOwnProperty('rulePR')) {
          // console.log(d)
          // console.log(Math.round(cirleRLinear(d.rulePR)))
          var x = Math.round(rulePR_Linear(d.rulePR)) + 10;
          return x;
        } else {
          return swgraph.graph.node.BACK_CIRCLE_R;
        }
      });
  };
  swgraph.graph.node.updateMiddlegroundElements = function () {
    // hth20160805
    var maxrulePR = Math.max.apply(this, rulePR_keeper);
    var minrulePR = Math.min.apply(this, rulePR_keeper);
    // console.log(maxrulePR)
    // Array.prototype.max = function() { return Math.max.apply({},this) } ;
    // Array.prototype.min = function() { return Math.min.apply({},this) };
    // console.log(rulePR_keeper.max());
    rulePR_Linear = d3.scale.linear()
      .domain([minrulePR, maxrulePR])
      .range([5, 50]);
    // hth20160805

    var middleG = swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-middleground');
    middleG.selectAll('*').remove();
    // 图片
    var imageMiddle = middleG.filter(function (d) {
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
      case swgraph.algorithm.type.TRIANGLE:
        // console.log("test"+swgraph.eventType);
        middleG.selectAll('circle').filter(function (d) {
          return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
        }).filter(function(d) {
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
        }).filter(function(d) {
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
        }).filter(function(d) {
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
      case swgraph.algorithm.type.GROUP:
        // console.log(swgraph.algorithm.SHORTPATH.hitNodes);
        middleG.selectAll('circle').filter(function (d) {
          return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
        }).filter(function(d) {
          for (var i = 0; i < swgraph.algorithm.GROUP.hitNodes.length; i++) {
            var item = swgraph.algorithm.GROUP.hitNodes[i];
            if (item.hasOwnProperty(d.id)) {
              return true;
            }
          }
          return false;
        }).attr('cx', 0)
          .attr('cy', 0)
          .attr('fill', function(d) {
            var hitnodes = swgraph.algorithm.GROUP.hitNodes[0];
            var icolor = parseInt(hitnodes[d.id]);
            icolor = icolor > 19 ? icolor % 20 : icolor;
            return swgraph.colors(icolor);
            /* var a = d3.rgb(255,115,115);
                var b = d3.rgb(255,191,255);
                var compute = d3.interpolate(a,b);
                var linear = d3.scale.linear()
                                      .domain([0,150])
                                      .range([0,1]);
                console.log(compute(linear(icolor)));
                return compute(linear(icolor)); */
          })
          .attr('stroke', '#5CA8DB')
          .attr('stroke-width', '2px')
          .style('fill-opacity', 1)
          .transition()
          .duration(200);
        break;
      default:
        middleG.selectAll('circle').filter(function (d) {
          return swgraph.provider.getNodeDisplayType(d) === swgraph.provider.NodeDisplayTypes.TEXT;
        })

        // hth
        /*
             .attr("fill",function(d){
             if(typeof(d.book_type)!="undefined"){
             switch (d.book_type) {
             case "经济":
             color = swgraph.colors(0);
             break;
             case "自动化技术计算机技术":
             color = swgraph.colors(1);
             break;
             case "政法":
             color = swgraph.colors(2);
             break;
             case "历史地理":
             color = swgraph.colors(3);
             break;
             case "哲学宗教":
             color = swgraph.colors(4);
             break;
             case "文化":
             color = swgraph.colors(5);
             break;
             case "艺术":
             color = swgraph.colors(6);
             break;
             case "数理化":
             color = swgraph.colors(7);
             break;
             case "生物科学":
             color = swgraph.colors(8);
             break;
             case "机械仪表工业":
             color = swgraph.colors(9);
             break;
             case "社科":
             color = swgraph.colors(10);
             break;
             case "文学":
             color = swgraph.colors(11);
             break;
             case "语文文学":
             color = swgraph.colors(12);
             break;
             case "电子技术":
             color = swgraph.colors(13);
             break;
             case "综合性图书":
             color = swgraph.colors(14);
             break;
             case "能量与动力工程":
             color = swgraph.colors(15);
             break;
             case "电子技术":
             color = swgraph.colors(16);
             break;
             case "天文地理":
             color = swgraph.colors(17);
             break;
             case "其他":
             color = swgraph.colors(18);
             break;
             default:
             color = swgraph.colors(19);
             break;
             }
             }else{
             //color = swgraph.colors(0);
             color=swgraph.provider.getCategoryColor(d.internalLabel);
             }
             return color;
             })
             */
          .attr('fill', function(d) {
            // var color = d3.scale.category10();hth20160805添加到此处无用，本地变量每次创建会自动替换不会更新，需要建在此函数外部；
            if (d.hasOwnProperty('communityrule1')) {
              var x = d.communityrule1;
              return color_com(x);
            } else {
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
                  case '电子技术':
                    color = swgraph.colors(16);
                    break;
                  case '天文地理':
                    color = swgraph.colors(17);
                    break;
                  case '其他':
                    color = swgraph.colors(18);
                    break;
                  default:
                    color = swgraph.colors(19);
                    break;
                }
              } else {
                // color = swgraph.colors(0);
                color = swgraph.provider.getCategoryColor(d.internalLabel);
              }
              return color;
            };
          })

          .attr('stroke', '#5CA8DB')
          .attr('stroke-width', '2px')
          .style('fill-opacity', 0.98)

        // hth以下讲固定值25修改为根据参数决定大小
          .attr('r', function(d) {
            if (d.hasOwnProperty('rulePR')) {
              // console.log(Math.round(cirleRLinear(d.rulePR)))
              return Math.round(rulePR_Linear(d.rulePR));
            } else {
              return '25'
            }
          });
    }

    var svgMiddle = middleG.filter(function (d) {
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
    var textMiddle = middleG.filter(function (d) {
      return swgraph.provider.isTextDisplayed(d);
    }).append('text')
      .attr('x', 0)
      .attr('y', swgraph.graph.node.TEXT_Y)
      .attr('font-size', '14px')
      .attr('font-family', 'Microsoft YaHei')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle');
    textMiddle
      .attr('y', swgraph.graph.node.TEXT_Y)
      .style('display', 'none')
      .attr('class', function (d) {
        switch (d.type) {
          case swgraph.graph.node.NodeTypes.CHOOSE:
            if (d.value === undefined) {
              if (d.count == 0) {
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
              if (d.count == 0) {
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
        // console.log(d)
        if (swgraph.provider.isTextDisplayed(d)) {
          // console.log(d)
          // console.log(swgraph.provider.getTextValue(d));
          // return d.label;
          // return swgraph.provider.getValueOrderByAttribute(d.label);
          // console.log(swgraph.provider.getConstraintAttribute(d.label));
          // return swgraph.provider.getConstraintAttribute(d.label);

          // hth20160822，应张老师要求，显示全称而非类别，稍作如下改动；
          // return swgraph.provider.getTextValue(d);
          return d.name_full;
        } else {
          return '';
        }
      });
  };
  swgraph.graph.node.updateForegroundElements = function () {
    /*
       var gArrows = swgraph.graph.node.svgNodeElements.selectAll(".ppt-g-node-foreground")
       .selectAll(".ppt-node-foreground-g-arrows");
       gArrows.classed("active", function (d) {
       return d.valueExpanded && d.data && d.data.length > swgraph.graph.node.PAGE_SIZE;
       });
       gArrows.selectAll(".ppt-larrow").classed("enabled", function (d) {
       return d.page > 1;
       });
       gArrows.selectAll(".ppt-rarrow").classed("enabled", function (d) {
       if (d.data) {
       var count = d.data.length;
       return d.page * swgraph.graph.node.PAGE_SIZE < count;
       } else {
       return false;
       }
       });
       var gForegrounds = swgraph.graph.node.svgNodeElements.selectAll(".ppt-g-node-foreground");
       gForegrounds.selectAll(".ppt-count-box").filter(function (d) {
       return d.type !== swgraph.graph.node.NodeTypes.CHOOSE;
       }).classed("root", true);

       gForegrounds.selectAll(".ppt-count-box").filter(function (d) {
       return d.type === swgraph.graph.node.NodeTypes.CHOOSE;
       }).classed("value", true);

       gForegrounds.selectAll(".ppt-count-box").classed("disabled", function (d) {
       return d.count == 0;
       });

       gForegrounds.selectAll(".ppt-count-text")
       .text(function (d) {
       if (d.count != null) {
       return d.count;
       } else {
       return "...";
       }
       })
       .classed("disabled", function (d) {
       return d.count == 0;
       });
       */
    // Hide/Show plus icon (set disabled CSS class) if node already has been expanded.
    var gForegrounds = swgraph.graph.node.svgNodeElements.selectAll('.ppt-g-node-foreground');
    gForegrounds.selectAll('.ppt-rel-plus-icon')
      .classed('disabled', function (d) {
        return d.expand == true;
      });
    gForegrounds.selectAll('.ppt-rel-minus-icon')
      .classed('disabled', function (d) {
        return d.expand == false;
      });
  };

  swgraph.graph.node.mouseOverNode = function (d) {
    d3.event.preventDefault();
    var hoveredNode = d3.select(this).data()[0];
    d3.select(this).select('.ppt-g-node-background').selectAll('circle').transition().style('fill-opacity', 0.5);
    /*
       if (swgraph.queryviewer.isActive) {
       // Hover the node in query
       swgraph.queryviewer.queryConstraintSpanElements.filter(function (d) {
       return d.ref === hoveredNode;
       }).classed("hover", true);
       swgraph.queryviewer.querySpanElements.filter(function (d) {
       return d.ref === hoveredNode;
       }).classed("hover", true);
       }
       if (swgraph.cypherviewer.isActive) {
       swgraph.cypherviewer.querySpanElements.filter(function (d) {
       return d.node === hoveredNode;
       }).classed("hover", true);
       }
       */

    // 以下尝试添加获取同一社区节点的办法hth20160809
    // console.log(d.communityrule1)
    // console.log(swgraph.graph.node.svgNodeElements.selectAll(".ppt-g-node-middleground"))
    if (d.hasOwnProperty('communityrule1')) {
      communityrule1_keeper.push(d.communityrule1);
      // console.log(communityrule1_keeper)
      d3.select('#' + swgraph.graph.node.gID).selectAll('circle').filter(function(dd) { return !(dd.communityrule1 == communityrule1_keeper[0]) }).transition().duration(250).style('opacity', 0.1);
    } else {
      // hth20160817下面一句不是很明白- -当初为啥定义undefined；
      // d.communityrule1 = undefined;
      // 下方return以后，tooltip相关后续语句将不会再执行！
      // return
    };

    var tooltip = d3.select('.tooltip');

    // hth20160809以下增加提示框显示相关代码
    if (d.hasOwnProperty('rulePR') && d.hasOwnProperty('communityrule1')) {
      tooltip.html(
        '名称:' + d.name_full + '<br/>' + '重要度:' + (d.rulePR).toFixed(6) + '<br/>' + '社区:' + d.communityrule1
      ).transition()
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY + 30) + 'px')
        .style('visibility', 'visible')
        .style('opacity', 1.0);
    } else {
      tooltip.html(
        '名称:' + d.book_name + '<br/>' + '重要度:' + '<br/>' + '社区:'
      ).transition()
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY + 30) + 'px')
        .style('visibility', 'visible')
        .style('opacity', 1.0);
    };

    // hth以下代码为了实现鼠标所在节点及其相邻节点之间高亮显示；
    // console.log(this.id)//确认绑定数据为node的数组
    // console.log("swgraph-gnode_"+d.id)
    // console.log(d3.select(this).data());
    // console.log(d3.selectAll(".gnode_hover"));
    // console.log(this.id == "swgraph-gnode_"+d.id)
    // d3.select(this).classed("gnode_hover",false)
    // d3.select("#"+swgraph.graph.node.gID).selectAll("g").filter(function(d){return d3.select(this).classed("gnode_hover")}).transition().style("fill-opacity",0.1);
  };

  // 增加鼠标移出环形菜单自身的事件
  // hth20160809添加鼠标移出时环形菜单自动关闭；
  swgraph.graph.node.mouseOutMenu = function(d) {
    // d3.event.preventDefault();
    swgraph.graph.node.removeMenu();
  };

  // 增加鼠标移动时的监听函数hth20160809***************
  swgraph.graph.node.mouseMoveNode = function(d) {
    d3.event.preventDefault();

    var tooltip = d3.select('.tooltip');
    tooltip.style('left', (d3.event.pageX) + 'px')
      .style('top', (d3.event.pageY + 30) + 'px')
  };
  // 增加鼠标移动时的监听函数hth20160809***************

  swgraph.graph.node.mouseDownNode = function() {
    d3.event.preventDefault();
    if (d3.event.button == 2) {
      // alert("你点了右键");
      var clickedNode = d3.select(this).data()[0];
      if (typeof (clickedNode) === 'undefined') {
        // d3.event.preventDefault();
        // console.log(11111111111);
        swgraph.graph.node.removeMenu();
      } else {
        // console.log(clickedNode);
        swgraph.graph.node.removeMenu();
        swgraph.graph.node.createMenu(clickedNode);
      }
    }
    /* else{
        swgraph.graph.node.removeMenu();
      } */
  };

  swgraph.graph.node.mouseOutNode = function (d) {
    d3.event.preventDefault();
    var hoveredNode = d3.select(this).data()[0];

    // hth将下面一行代码放到selection下面，即可解决外环鼠标移出以后不消失的问题！！！hth20160809
    // d3.select(this).select(".ppt-g-node-background").selectAll("circle").transition().style("fill-opacity", 0);

    // 以下尝试添加获取同一社区节点的办法hth20160809
    communityrule1_keeper = [];
    var selection = d3.select('#' + swgraph.graph.node.gID).selectAll('circle');

    // console.log(bol1)
    selection.transition().duration(500).style('opacity', 0.98);

    // 鼠标快速从一个node移出并且进入另一个node时，background圆环不会消失，被打断了。以下尝试添加打断事件以及定时器解决hth20160812；

    d3.select(this).select('.ppt-g-node-background').selectAll('circle')
      .transition()
    // 打断事件
    /*
          .each("interrupt",function(d,i){
            //console.log("interrupt")
            d3.selectAll(".ppt-g-node-background").selectAll("circle").style("fill-opacity", 0)
          })
            */
      .style('fill-opacity', 0);

    // hth20160809以下增加提示框显示相关代码
    var tooltip = d3.select('.tooltip');

    tooltip.transition()
      .style('opacity', 0.0)
      .style('visibility', 'hidden');
    // d3.select(this).classed("gnode_hover",true)
    // d3.select("#"+swgraph.graph.node.gID).selectAll("g").transition().style("fill-opacity",1);

    /*
       if (swgraph.queryviewer.isActive) {
       // Remove hover class on node.
       swgraph.queryviewer.queryConstraintSpanElements.filter(function (d) {
       return d.ref === hoveredNode;
       }).classed("hover", false);
       swgraph.queryviewer.querySpanElements.filter(function (d) {
       return d.ref === hoveredNode;
       }).classed("hover", false);
       }

       if (swgraph.cypherviewer.isActive) {
       swgraph.cypherviewer.querySpanElements.filter(function (d) {
       return d.node === hoveredNode;
       }).classed("hover", false);
       }
       */
  };
  swgraph.graph.node.nodedblClick = function() {
    var clickedNode = d3.select(this).data()[0]; // Clicked node data
    // console.log(clickedNode)
    swgraph.logger.debug('nodeClick (' + clickedNode.internalLabel + ')');
    clickedNode.expand = true;
    swgraph.graph.node.expandNode(clickedNode);
  };
  swgraph.graph.node.nodeClick = function() {
    var clickedNode = d3.select(this).data()[0];
    swgraph.result.updateResults(clickedNode);
    // swgraph.graph.node.createMenu(clickedNode);
    // swgraph.graph.node.attrMenu(clickedNode);
    // console.log(JSON.stringify(swgraph.algorithm.SHORTPATH.nodes));

    // 以下添加点击节点以后其他社区节点隐藏效果hth20160809——该功能合并到环形菜单中
    /*
       var selection = d3.select("#"+swgraph.graph.node.gID).selectAll("g")
       .filter(function(dd){return !(dd.communityrule1 == communityrule1_keeper[0])})
       //以下语段可以实现单击节点隐藏，再次单击显示其他社区节点效果。不过单击显示的事件增加到整个svg用户体验更好

       selection.filter(function(dd){return !(dd.communityrule1 == communityrule1_keeper[0])})
       .classed("toggleby_communityrule",function(){
       var bol = !selection.classed("toggleby_communityrule");
       return bol;
       });
       */
    // console.log(communityrule1_keeper[0])
    // console.log(dd.communityrule1)此处的dd相当于d，针对于其他节点而言···关键！
  };

  swgraph.graph.node.menuClick = function(clickedNode, i) {
    d3.event.preventDefault();
    var menu = $('#swgraph-gnode_' + clickedNode.id + ' .swt-menu');
    // menu.attr("class","circledisplay");
    swgraph.graph.node.MenuOpen = false;
    switch (i) {
      case 0 : // 移除
        swgraph.graph.node.removeNode(clickedNode, 0, 0);
        swgraph.update();
        // swgraph.selected.parseData(clickedNode);
        break;
      case 1 :// 选择
        // console.log("2");
        var len = swgraph.algorithm.SHORTPATH.nodes.length;
        if (len > 0) {
          if (swgraph.algorithm.SHORTPATH.nodes[len - 1] != clickedNode.id) {
            swgraph.algorithm.SHORTPATH.nodes.push(clickedNode.id);
          }
          if (swgraph.algorithm.SHORTPATH.nodes.length > 2) {
            swgraph.algorithm.SHORTPATH.nodes = swgraph.algorithm.SHORTPATH.nodes.slice(swgraph.algorithm.SHORTPATH.nodes.length - 2, swgraph.algorithm.SHORTPATH.nodes.length);
          }
        } else {
          swgraph.algorithm.SHORTPATH.nodes.push(clickedNode.id);
        }
        break;
      default:// break;

        // hthhthhthhth
        if (false) {
          // hth20160809以下将环形菜单关闭按钮更改为显示社区按钮
          var selection = d3.select('#' + swgraph.graph.node.gID).selectAll('g')
          // 以下语段可以实现单击节点隐藏，再次单击显示其他社区节点效果。不过单击显示的事件增加到整个svg用户体验更好

          selection.filter(function(dd) { return !(dd.communityrule1 == communityrule1_keeper[0]) })
            .classed('toggleby_communityrule', function() {
              var bol = !selection.classed('toggleby_communityrule');
              return bol;
            });
          // console.log(111);
        } else {
          break;
        }
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
        if ((n.type == swgraph.graph.node.NodeTypes.ROOT || n.type == swgraph.graph.node.NodeTypes.CHOOSE) && n.valueExpanded) {
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
          swgraph.logger.error(textStatus + ': error while accessing Neo4j server on URL:"' + swgraph.rest.CYPHER_URL + '" defined in "swgraph.rest.CYPHER_URL" property: ' + errorThrown);
        });
    }
  };

  swgraph.graph.node.parseResultData = function (data) {
    var results = [];
    for (var x = 0; x < data.results[0].data.length; x++) {
      var obj = {};
      for (var i = 0; i < data.results[0].columns.length; i++) {
        obj[data.results[0].columns[i]] = data.results[0].data[x].row[i];
      }
      results.push(obj);
    }
    return results;
  };
  swgraph.graph.computeParentAngle = function (node) {
    var angleRadian = 0;
    var r = 100;
    if (node.parent) {
      var xp = node.parent.x;
      var yp = node.parent.y;
      var x0 = node.x;
      var y0 = node.y;
      var dist = Math.sqrt(Math.pow(xp - x0, 2) + Math.pow(yp - y0, 2));

      var k = r / (dist - r);
      var xc = (x0 + (k * xp)) / (1 + k);

      var val = (xc - x0) / r;
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

  swgraph.graph.node.expandNode = function(clickedNode) {
    swgraph.rest.post(
      {
        'statements': [
          {
            'statement': 'start n= node(' + clickedNode.id + ') match (n)-[r]-(m) return n,r,m limit 50',
            'resultDataContents': ['graph']
          }]
      }).done(function (data) {
      // console.log(JSON.stringify(data));
      console.log(data);
      /*
          if(swgraph.graph.force.nodes().length>0){
            swgraph.graph.force.nodes().splice(0,swgraph.graph.force.nodes().length);
            swgraph.graph.force.links().splice(0,swgraph.graph.force.links().length);
            swgraph.update();
          }
          */

      if (data.results.length > 0) {
        swgraph.eventType = swgraph.algorithm.type.NONE;
        var mydata = data.results[0].data;
        var snodes = [];
        var edges = [];
        var linksMap = d3.map([]);
        var nodesMap = d3.map([]);

        // 此处目的在于清空rulePR_keeper；hth20160817；仅在start函数中需要，此处非第一次请求，不需要清空！！！！hth
        // rulePR_keeper = [];
        mydata.forEach(function(item) {
          var gnodes = item.graph.nodes;
          gnodes.forEach(function(node) {
            // hth20160816
            var y = node.properties.rulePR;
            if (y) { rulePR_keeper.push(y); }

            if (swgraph.graph.node.isHasSvgNodeElement(node) == false) {
              var subnode = node.properties;
              subnode['id'] = node.id;
              subnode['label'] = node.labels;
              subnode['status'] = 1;
              subnode['expand'] = false;
              subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
              subnode['internalLabel'] = node.labels[0];
              nodesMap.set(node.id, subnode);
            }
          });
        });
        // console.log(nodesMap);
        // console.log(swgraph.graph.force.nodes());

        nodesMap.forEach(function(key, value) {
          swgraph.graph.force.nodes().push(value);
        });

        // console.log(swgraph.graph.force.nodes());
        // console.log(JSON.stringify(swgraph.graph.force.nodes()));
        // console.log(mydata)
        mydata.forEach(function(item) {
          var relations = item.graph.relationships;
          relations.forEach(function(edge) {
            var nodeA = edge.startNode;
            var nodeB = edge.endNode;
            if (nodeA > nodeB) {
              nodeA = edge.endNode;
              nodeB = edge.startNode;
            }
            if (linksMap.has(nodeA + '-' + nodeB)) {
              var templist = linksMap.get(nodeA + '-' + nodeB);
              templist.push({
                'source': swgraph.graph.findNode(edge.startNode),
                'target': swgraph.graph.findNode(edge.endNode),
                // "source":swgraph.graph.findNode(edge.startNode),
                // "target":swgraph.graph.findNode(edge.endNode),
                'id': edge.id,
                'relation': edge.type,
                'relCommunity': nodesMap.findNode(edge.startNode).communityrule1,
                'properties': edge.properties,
                // hth20160817nodeA用于tick中判断不同起点箭头是否要反向；不然会重叠；
                'nodeA': nodeA
              });
              // console.log(nodeA+"-"+nodeB)
              linksMap.set(nodeA + '-' + nodeB, templist);
            } else {
              // console.log(nodeA+"-"+nodeB)
              linksMap.set(nodeA + '-' + nodeB, [{
                'source': swgraph.graph.findNode(edge.startNode),
                'target': swgraph.graph.findNode(edge.endNode),
                // "source":swgraph.graph.findNode(edge.startNode),
                // "target":swgraph.graph.findNode(edge.endNode),
                'id': edge.id,
                'relation': edge.type,
                'relCommunity': nodesMap.findNode(edge.startNode).communityrule1,
                'properties': edge.properties,
                // hth20160817nodeA用于tick中判断不同起点箭头是否要反向；不然会重叠；
                'nodeA': nodeA
              }])
            }
          });
        });
        // console.log(linksMap)
        // console.log(JSON.stringify(linksMap));
        linksMap.forEach(function(key, value) {
          // console.log(JSON.stringify(value));
          var len = value.length;
          for (var index = 0; index < len; index++) {
            var item = value[index];
            item['ccccount'] = len;
            item['iiiindex'] = index;
            swgraph.graph.force.links().push(item);
          }
        });
        // console.log(swgraph.graph.force.nodes())
        // console.log(swgraph.graph.force.links())
        swgraph.update();
      }
    })
  };

  swgraph.graph.node.expandNode1 = function (clickedNode) {
    // var lIndex = clickedNode.page * swgraph.graph.node.PAGE_SIZE;
    // var sIndex = lIndex - swgraph.graph.node.PAGE_SIZE;
    var dataToAdd = clickedNode.data.slice(sIndex, lIndex);
    var parentAngle = swgraph.graph.computeParentAngle(clickedNode);
    var i = 1;
    dataToAdd.forEach(function (d) {
      var angleDeg;
      if (clickedNode.parent) {
        angleDeg = (((360 / (dataToAdd.length + 1)) * i));
      } else {
        angleDeg = (((360 / (dataToAdd.length)) * i));
      }
      var nx = clickedNode.x + (100 * Math.cos((angleDeg * (Math.PI / 180)) - parentAngle)),
        ny = clickedNode.y + (100 * Math.sin((angleDeg * (Math.PI / 180)) - parentAngle));
      var node = {
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
    var clickedNode = d3.select(this).data()[0];
    clickedNode.expand = true;
    swgraph.graph.node.expandNode(clickedNode);
  };
  swgraph.graph.node.collapseRelationship = function () {
    d3.event.preventDefault();
    var clickedNode = d3.select(this).data()[0];
    clickedNode.expand = false;
    swgraph.graph.node.collapseNode(clickedNode);
  };
  /**
     * 删除节点
     * @param clickednode
     * @param type 删除节点方式，0：无向 1：有向
     * @flag  bool类型 true：清除没有连线的节点， false：保留没有连线的节点
     */
  swgraph.graph.node.removeNode = function(clickednode, type, flag) {
    var linksToDelete = [], childNodes = [clickednode];
    var remove = function(node) {
      var length = swgraph.graph.force.links().length;
      for (var i = length - 1; i >= 0; i--) {
        try {
          if (swgraph.graph.force.links()[i]['source'] == node) {
            var target = swgraph.graph.force.links()[i]['target'];
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
    if (type == 1) {
      childNodes.forEach(function(inode) {
        remove(inode);
      });
    } else {
      // swgraph.graph.force.nodes().splice(swgraph.graph.force.nodes().indexOf(clickednode), 1);
      var linksToRemove = swgraph.graph.force.links().filter(function (l) {
        return (l.source == clickednode || l.target == clickednode);
      });
        // Remove links from model
      for (var i = swgraph.graph.force.links().length - 1; i >= 0; i--) {
        if (linksToRemove.indexOf(swgraph.graph.force.links()[i]) >= 0) {
          swgraph.graph.force.links().splice(i, 1);
        }
      }
      swgraph.graph.force.nodes().splice(swgraph.graph.force.nodes().indexOf(clickednode), 1);
    }
    // 清除没有连线的节点
    if (flag == true) {
      for (var i = swgraph.graph.force.nodes().length - 1; i >= 0; i--) {
        var haveFoundNode = false;
        for (var j = 0, l = swgraph.graph.force.links().length; j < l; j++) {
          if ((swgraph.graph.force.links()[j]['source'] == swgraph.graph.force.nodes()[i] || swgraph.graph.force.links()[j]['target'] == swgraph.graph.force.nodes()[i]) || swgraph.graph.force.nodes()[i] == clickednode) {
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
    /* var clickedNode = d3.select(this).data()[0];
      swgraph.graph.force.nodes().forEach(function (n) {
        if ((n.type === swgraph.graph.node.NodeTypes.CHOOSE || n.type === swgraph.graph.node.NodeTypes.ROOT) && n.valueExpanded) {
          swgraph.graph.node.collapseNode(n);
        }
      });
      if (clickedNode.value != null && !clickedNode.immutable) {
        delete clickedNode.value;
        swgraph.result.hasChanged = true;
        swgraph.graph.hasGraphChanged = true;
        swgraph.update();
      } */
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
      var arcs=d3.select(this).append("g")
        .data(pie(dataset))
        .enter()
        .append("g")
        .attr("transform","translate("+outerRadius+","+outerRadius+")");
      arcs.append("path")
        .attr("fill",function(d,i){
          return color(i);
        })
        .attr("d",function(d){
          return arc(d);
        })
    }; */
  swgraph.graph.node.isHasSvgNodeElement = function(NodeElement) {
    var flag = false;
    swgraph.graph.force.nodes().forEach(function(item) {
      // alert(JSON.stringify(item));
      if (NodeElement.id == item.id) {
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
    var constraintAttr = swgraph.provider.getConstraintAttribute(label);
    var whereElements = [];
    var predefinedConstraints = swgraph.provider.getPredefinedConstraints(label);
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
    var matchElements = [];
    var whereElements = [];
    var rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';

    var rootPredefinedConstraints = swgraph.provider.getPredefinedConstraints(rootNode.label);

    rootPredefinedConstraints.forEach(function (predefinedConstraint) {
      whereElements.push(predefinedConstraint.replace(new RegExp('\\$identifier', 'g'), rootNode.internalLabel));
    });

    // Generate root node match element
    if (rootNode.value && (isConstraintNeeded || rootNode.immutable)) {
      var rootConstraintAttr = swgraph.provider.getConstraintAttribute(rootNode.label);
      if (rootConstraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
        matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`)');
        whereElements.push('ID(' + rootNode.internalLabel + ') = ' + rootNode.value.internalID);
      } else {
        var constraintValue = rootNode.value.attributes[rootConstraintAttr];

        if (typeof constraintValue === 'boolean' || typeof constraintValue === 'number') {
          matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`{`' + rootConstraintAttr + '`:' + constraintValue + '})');
        } else {
          matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`{`' + rootConstraintAttr + '`:"' + constraintValue + '"})');
        }
      }
    } else {
      matchElements.push('(' + rootNode.internalLabel + ':`' + rootNode.label + '`)');
    }

    // Generate match elements for each links
    links.forEach(function (l) {
      var sourceNode = l.source;
      var targetNode = l.target;
      var predefinedConstraints = swgraph.provider.getPredefinedConstraints(targetNode.label);
      predefinedConstraints.forEach(function (predefinedConstraint) {
        whereElements.push(predefinedConstraint.replace(new RegExp('\\$identifier', 'g'), targetNode.internalLabel));
      });

      if (targetNode.value && targetNode !== selectedNode && (isConstraintNeeded || rootNode.immutable)) {
        var constraintAttr = swgraph.provider.getConstraintAttribute(targetNode.label);
        var constraintValue = targetNode.value.attributes[constraintAttr];
        if (constraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
          matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`)');
          whereElements.push('ID(' + targetNode.internalLabel + ') = ' + targetNode.value.internalID);
        } else {
          if (typeof constraintValue === 'boolean' || typeof constraintValue === 'number') {
            matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`{`' + constraintAttr + '`:' + constraintValue + '})');
          } else {
            matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`{`' + constraintAttr + '`:"' + constraintValue + '"})');
          }
        }
      } else {
        matchElements.push('(' + sourceNode.internalLabel + ':`' + sourceNode.label + '`)-[:`' + l.label + '`]' + rel + '(' + targetNode.internalLabel + ':`' + targetNode.label + '`)');
      }
    });

    return {'matchElements': matchElements, 'whereElements': whereElements};
  };
  swgraph.query.getRelevantLinks = function (rootNode, targetNode, initialLinks) {
    var links = initialLinks.slice();
    var filteredLinks = [];
    var finalLinks = [];
    links.forEach(function (l) {
      if (l.target.value || l.target === targetNode) {
        filteredLinks.push(l);
      }
    });
    filteredLinks.forEach(function (l) {
      links.splice(links.indexOf(l), 1);
    });
    filteredLinks.forEach(function (fl) {
      var sourceNode = fl.source;
      var search = true;

      while (search) {
        var intermediateLink = null;
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
    var pathLinks = [];
    var targetNode = node;
    while (targetNode !== swgraph.graph.getRootNode()) {
      var nodeLink;
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
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
    var linksToRoot = swgraph.query.getLinksToRoot(targetNode, swgraph.graph.force.links());
    var queryElements = swgraph.query.generateQueryElements(swgraph.graph.getRootNode(), targetNode, linksToRoot, false);
    var matchElements = queryElements.matchElements,
      returnElements = [],
      whereElements = queryElements.whereElements,
      endElements = [];
    var rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
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
    var rootNode = swgraph.graph.getRootNode();
    var queryElements = swgraph.query.generateQueryElements(rootNode, rootNode, swgraph.query.getRelevantLinks(rootNode, rootNode, swgraph.graph.force.links()), true);
    var matchElements = queryElements.matchElements,
      returnElements = [],
      whereElements = queryElements.whereElements,
      endElements = [];
    var resultOrderByAttribute = swgraph.provider.getResultOrderByAttribute(rootNode.internalLabel);
    if (resultOrderByAttribute) {
      var order = swgraph.provider.isResultOrderAscending(rootNode.internalLabel) ? 'ASC' : 'DESC';
      endElements.push('ORDER BY ' + resultOrderByAttribute + ' ' + order);
    }
    endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
    var resultAttributes = swgraph.provider.getReturnAttributes(rootNode.internalLabel);
    var constraintAttribute = swgraph.provider.getConstraintAttribute(rootNode.internalLabel);
    for (var i = 0; i < resultAttributes.length; i++) {
      var attribute = resultAttributes[i];
      if (attribute === swgraph.query.NEO4J_INTERNAL_ID) {
        if (attribute == constraintAttribute) {
          returnElements.push('ID(' + rootNode.internalLabel + ') AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
        } else {
          returnElements.push('COLLECT(DISTINCT ID(' + rootNode.internalLabel + ')) AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
        }
      } else {
        if (attribute == constraintAttribute) {
          returnElements.push(rootNode.internalLabel + '.' + attribute + ' AS ' + attribute);
        } else {
          returnElements.push('COLLECT(DISTINCT ' + rootNode.internalLabel + '.' + attribute + ') AS ' + attribute);
        }
      }
    }
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
  };
  swgraph.query.generateResultCypherQueryCount = function () {
    var rootNode = swgraph.graph.getRootNode();
    var queryElements = swgraph.query.generateQueryElements(rootNode, rootNode, swgraph.query.getRelevantLinks(rootNode, rootNode, swgraph.graph.force.links()), true);
    var constraintAttribute = swgraph.provider.getConstraintAttribute(rootNode.internalLabel);
    var matchElements = queryElements.matchElements,
      returnElements = [],
      whereElements = queryElements.whereElements,
      endElements = [];
    if (constraintAttribute === swgraph.query.NEO4J_INTERNAL_ID) {
      returnElements.push('count(DISTINCT ID(' + rootNode.internalLabel + ')) AS count');
    } else {
      returnElements.push('count(DISTINCT ' + rootNode.internalLabel + '.' + constraintAttribute + ') AS count');
    }
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN ' + returnElements.join(', ') + (endElements.length > 0 ? ' ' + endElements.join(' ') : '');
  };
  swgraph.query.generateNodeCountCypherQuery = function (countedNode) {
    var queryElements = swgraph.query.generateQueryElements(swgraph.graph.getRootNode(), countedNode, swgraph.query.getRelevantLinks(swgraph.graph.getRootNode(), countedNode, swgraph.graph.force.links()), true);
    var matchElements = queryElements.matchElements,
      whereElements = queryElements.whereElements,
      returnElements = [];
    var countAttr = swgraph.provider.getConstraintAttribute(countedNode.internalLabel);
    if (countAttr === swgraph.query.NEO4J_INTERNAL_ID) {
      returnElements.push('count(DISTINCT ID(' + countedNode.internalLabel + ')) as count');
    } else {
      returnElements.push('count(DISTINCT ' + countedNode.internalLabel + '.' + countAttr + ') as count');
    }
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN ' + returnElements.join(', ');
  };
  swgraph.query.generateValueQuery = function (targetNode) {
    var rootNode = swgraph.graph.getRootNode();
    var queryElements = swgraph.query.generateQueryElements(rootNode, targetNode, swgraph.query.getRelevantLinks(rootNode, targetNode, swgraph.graph.force.links()), true);
    var matchElements = queryElements.matchElements,
      endElements = [],
      whereElements = queryElements.whereElements,
      returnElements = [];
    var valueOrderByAttribute = swgraph.provider.getValueOrderByAttribute(targetNode.internalLabel);
    if (valueOrderByAttribute) {
      var order = swgraph.provider.isValueOrderAscending(targetNode.internalLabel) ? 'ASC' : 'DESC';
      endElements.push('ORDER BY ' + valueOrderByAttribute + ' ' + order);
    }
    endElements.push('LIMIT ' + swgraph.query.VALUE_QUERY_LIMIT);
    var resultAttributes = swgraph.provider.getReturnAttributes(targetNode.internalLabel);
    var constraintAttribute = swgraph.provider.getConstraintAttribute(targetNode.internalLabel);
    for (var i = 0; i < resultAttributes.length; i++) {
      if (resultAttributes[i] === swgraph.query.NEO4J_INTERNAL_ID) {
        if (resultAttributes[i] == constraintAttribute) {
          returnElements.push('ID(' + targetNode.internalLabel + ') AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
        } else {
          returnElements.push('COLLECT (DISTINCT ID(' + targetNode.internalLabel + ')) AS ' + swgraph.query.NEO4J_INTERNAL_ID.queryInternalName);
        }
      } else {
        if (resultAttributes[i] == constraintAttribute) {
          returnElements.push(targetNode.internalLabel + '.' + resultAttributes[i] + ' AS ' + resultAttributes[i]);
        } else {
          returnElements.push('COLLECT(DISTINCT ' + targetNode.internalLabel + '.' + resultAttributes[i] + ') AS ' + resultAttributes[i]);
        }
      }
    }
    // Add count return attribute on root node
    var rootConstraintAttr = swgraph.provider.getConstraintAttribute(rootNode.internalLabel);
    if (rootConstraintAttr === swgraph.query.NEO4J_INTERNAL_ID) {
      returnElements.push('count(DISTINCT ID(' + rootNode.internalLabel + ')) AS count');
    } else {
      returnElements.push('count(DISTINCT ' + rootNode.internalLabel + '.' + rootConstraintAttr + ') AS count');
    }
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
  };

  /** ***************************************************Z S 修改于2016年5月24日  生成查询语句******************/
  /***
     * 获取label下的节点信息
     * @param label
     * @returns {string}
     */
  swgraph.query.generateNodesQuery = function(label) {
    var matchElements = [];
    var whereElements = [];
    var returnElements = [];
    var endElements = [];
    var rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
    if (label.length > 0) {
      matchElements.push('(n:`' + label + '`)');
    } else {
      matchElements.push('(n)');
    }
    returnElements.push('n');
    endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
  };
  swgraph.query.generateRelsQuery = function(label) {
    var matchElements = [];
    var whereElements = [];
    var returnElements = [];
    var endElements = [];
    var rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
    if (label.length > 0) {
      matchElements.push('(n:`' + label + '`)-' + ' [r]' + rel + ' (m:`' + label + '`)');
    } else {
      matchElements.push('(n)-[r]' + rel + '(m)');
    }
    returnElements.push('r');
    endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
  };

  swgraph.query.generateNodeIDsQuery = function(idlist, isrel, bol) {
    var matchElements = [];
    var whereElements = [];
    var returnElements = [];
    var endElements = [];
    var rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
    if (idlist.length > 0) {
      if (isrel == true) {
        matchElements.push('(n)-[r:rule]' + rel + '(m)');
        whereElements.push('id(n) in [' + idlist + '] and id(m) in [' + idlist + ']');
        returnElements.push('r');
      } else {
        matchElements.push('(n)');
        whereElements.push('id(n) in [' + idlist + ']');
        returnElements.push('n');
      }
    }
    // returnElements.push("r");
    endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
  };

  // hth20160825暂时新增一个点击门店节点时的事件；
  swgraph.query.generateRootNodeIDsQuery = function(id) {
    return 'match(n:' + id + ')-[r:rule]->(m:' + id + ') where n.communityrule1 is not null and m.communityrule1 is not null return r limit 800'
  };
  // hth新增没有返回数据时候的点击事件
  swgraph.query.generateRootNodeIDsQueryForNull = function(key) {
    return 'match(n:' + key + ') return n limit 500'
  };

  // objectID
  swgraph.query.generateNodeObjIDsQuery = function(Objidlist, label, isrel) {
    var matchElements = [];
    var whereElements = [];
    var returnElements = [];
    var endElements = [];
    var rel = swgraph.query.USE_RELATION_DIRECTION ? '->' : '-';
    if (Objidlist.length > 0) {
      if (isrel == true) {
        matchElements.push('(n:' + label + ')-' + '[r:`同时借`]' + rel + '(m)');
        whereElements.push('n.objectId in [' + Objidlist + ']');
        returnElements.push('r');
      } else {
        matchElements.push('(n:' + label + ')');
        whereElements.push('n.objectId in [' + Objidlist + ']');
        returnElements.push('n');
      }
    }
    // returnElements.push("r");
    endElements.push('LIMIT ' + swgraph.query.RESULTS_PAGE_SIZE);
    return 'MATCH ' + matchElements.join(', ') + ((whereElements.length > 0) ? ' WHERE ' + whereElements.join(' AND ') : '') + ' RETURN DISTINCT ' + returnElements.join(', ') + ' ' + endElements.join(' ');
  };

  /** *************************************************图算法*********************************************************/
  swgraph.algorithm = {};
  swgraph.algorithm.uri = 'http://192.168.0.171:8080/ShuWeiAlgorithm/services';
  swgraph.algorithm.type = Object.freeze({NONE: 0, PAGERANK: 1, TRIANGLE: 2, DEGREE: 3, INDEGREE: 4, OUTDEGREE: 5, SHORTPATH: 6, CHILDGRAPH: 7, FILTER: 8, GROUP: 9});
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

  swgraph.algorithm.GROUP = {};
  swgraph.algorithm.GROUP.hitNodes = [];

  swgraph.algorithm.restpost = function (data, type) {
    var strUrl = '';
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
      case swgraph.algorithm.type.GROUP:
        strUrl = swgraph.algorithm.uri + '/algorithm/computeModularity_define';
        break;
    }
    return $.ajax({
      type: 'POST',
      url: strUrl,
      contentType: 'text/plain; charset=UTF-8',
      async: false,
      data: JSON.stringify(data)
    })
  };

  /* TO-DO 图过滤 */
  swgraph.algorithm.filter = function(filterSql) {
    var st = swgraph.graph.force.nodes().filter(function(d) {
      var returenStr = [];
      var ss = filterSql.filter(function(dd) {
        return dd.type == 'node';
      });
      $.each(ss, function(item) {
        returenStr.push("d.internalLabel=='" + ss[item].label + "'");
        $.each(ss[item].attr, function(k, v) {
          returenStr.push('d.' + k + ' ' + v);
        })
      });
      if (returenStr.length > 0) {
        return !(eval(returenStr.join(' && ')));
      } else {
        return false;
      }
    });
      // swgraph.graph.force.nodes().splice(0,swgraph.graph.force.nodes().length);
    $.each(st, function(item) {
      swgraph.graph.node.removeNode(st[item], 0, false);
    });

    var sl = swgraph.graph.force.links().filter(function(d) {
      var returenStr = [];
      var ss = filterSql.filter(function(dd) {
        return dd.type == 'link';
      });
      $.each(ss, function(item) {
        // returenStr+="1==1";
        $.each(ss[item].attr, function(k, v) {
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
    for (var i = swgraph.graph.force.links().length - 1; i >= 0; i--) {
      if (sl.indexOf(swgraph.graph.force.links()[i]) >= 0) {
        swgraph.graph.force.links().splice(i, 1);
      }
    }
    if (sl.length > 0) {
      for (var i = swgraph.graph.force.nodes().length - 1; i >= 0; i--) {
        var haveFoundNode = false;
        for (var j = 0, l = swgraph.graph.force.links().length; j < l; j++) {
          if ((swgraph.graph.force.links()[j]['source'] == swgraph.graph.force.nodes()[i] || swgraph.graph.force.links()[j]['target'] == swgraph.graph.force.nodes()[i])) {
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
    var strData = JSON.stringify(neojson);
    // console.log(strData);
    swgraph.algorithm.restpost(
      neojson, swgraph.algorithm.type.TRIANGLE
    ).done(function(data) {
      swgraph.algorithm.Triangle.hitNodes = [];
      var dataSort = data.obj;
      // console.log(JSON.stringify(dataSort));
      $.each(dataSort, function(k, v) {
        if (parseInt(v.value) >= swgraph.algorithm.Triangle.Count) {
          // console.log(v.value);
          swgraph.algorithm.Triangle.hitNodes.push(v.key);
        }
      });
    }).fail(function(r) {
      console.log('error' + r);
    })
      .always(function() {
        // alert( "complete" );
      });
  };

  // PAGERANK算法请求
  swgraph.algorithm.updatePGNode = function (neojson) {
    swgraph.algorithm.restpost(
      neojson, swgraph.algorithm.type.PAGERANK
    ).done(function(data) {
      swgraph.algorithm.PAGERANK.hitNodes = [];
      // console.log(JSON.stringify(data));
      var dataSort = data[0].obj;
      var i = 0;
      $.each(dataSort, function(k, v) {
        if (i < 5) {
          swgraph.algorithm.PAGERANK.hitNodes.push(v.key);
        }
        i++;
      });
    }).fail(function(r) {
      console.log('error' + r);
    })
      .always(function() {
        // alert( "complete" );
      });
  };

  /**
     * 最短路径-图计算
     * @param neojson
     * @param startnodeid
     * @param endnodeid
     */
  swgraph.algorithm.shortpath = function(neojson, startnodeid, endnodeid) {
    // console.log(JSON.stringify({"data":neojson,"startid":startnodeid,"endid":endnodeid}));
    swgraph.algorithm.restpost(
      {'data': neojson, 'startid': startnodeid, 'endid': endnodeid}, swgraph.algorithm.type.SHORTPATH
    ).done(function(data) {
      swgraph.algorithm.SHORTPATH.hitNodes = [];
      // console.log(JSON.stringify(data));
      var dataSort = data[0].obj;
      var i = 0;
      $.each(dataSort, function(k, v) {
        if (i < 5) {
          swgraph.algorithm.SHORTPATH.hitNodes.push(v.key);
        }
        i++;
      });
    }).fail(function(r) {
      console.log('error' + r);
    })
      .always(function() {
        // alert( "complete" );
      });
  };

  swgraph.algorithm.shortpathByCyther = function(startnodeid, endnodeid) {
    swgraph.algorithm.SHORTPATH.hitNodes = [startnodeid, endnodeid];
    swgraph.rest.post({
      'statements': [
        {
          'statement': 'START a=node(' + startnodeid + '), x=node(' + endnodeid + ') MATCH p = shortestPath(a-[*]-x) RETURN p',
          'resultDataContents': ['graph']
        }]
    }).done(function(data) {
      // console.log(JSON.stringify(data));
      if (swgraph.graph.force.nodes().length > 0) {
        swgraph.graph.force.nodes().splice(0, swgraph.graph.force.nodes().length);
        swgraph.graph.force.links().splice(0, swgraph.graph.force.links().length);
        swgraph.update();
      }
      if (data.results.length > 0) {
        // console.log(type+"=="+swgraph.graph.type.CHILD);
        swgraph.eventType = swgraph.algorithm.type.SHORTPATH;
        var mydata = data.results[0].data;
        var snodes = [];
        var edges = [];
        mydata.forEach(function(item) {
          var gnodes = item.graph.nodes;
          var relations = item.graph.relationships;
          gnodes.forEach(function(node) {
            if (swgraph.graph.node.isHasSvgNodeElement(node) == false) {
              var subnode = node.properties;
              subnode['id'] = node.id;
              subnode['label'] = node.labels;
              subnode['status'] = 1;
              subnode['expand'] = false;
              subnode['type'] = swgraph.graph.node.NodeTypes.VALUE;
              subnode['internalLabel'] = node.labels[0];
              swgraph.graph.force.nodes().push(subnode);
            }
          });
          relations.forEach(function(edge) {
            if (swgraph.graph.link.isHasSvgLinkElement(edge) == false) {
              var icount = swgraph.graph.link.isHasSvgRelElement(edge);
              if (icount > 0) {
                swgraph.graph.force.links().push({
                  'source': swgraph.graph.findNode(edge.startNode),
                  'target': swgraph.graph.findNode(edge.endNode),
                  'id': edge.id,
                  'relation': edge.type,
                  'relCommunity': nodesMap.get(edge.startNode).communityrule1,
                  'count': icount++,
                  'properties': edge.properties
                });
              }
            }
          });
        });
        swgraph.update();
      }
    }).fail(function(r) {
      console.log('error' + r);
    }).always(function() {
      // alert( "complete" );
    });
  };

  swgraph.algorithm.degree = function(neojson) {
    swgraph.algorithm.restpost(
      neojson, swgraph.algorithm.type.DEGREE
    ).done(function(data) {
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
    }).fail(function(r) {
      console.log('error' + r);
    })
      .always(function() {
        // alert( "complete" );
      });
  };

  // GROUP算法请求
  swgraph.algorithm.GroupNodes = function (neojson) {
    swgraph.algorithm.restpost(
      neojson, swgraph.algorithm.type.GROUP
    ).done(function (data) {
      swgraph.algorithm.GROUP.hitNodes = data;
      // console.log(JSON.stringify(data));
      /* var dataSort = data[0].obj;
           var i=0;
           $.each(dataSort,function(k,v){
           if(i<5) {
           swgraph.algorithm.PAGERANK.hitNodes.push(v.key);
           }
           i++;
           });
           }).fail(function(r){
           console.log("error" +r);
           })
           .always(function(){
           //alert( "complete" );
           }); */
    });
  };

  /******************************************************************************************************************************************************************************/

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
    var results = [];
    if (data.results && data.results.length > 0) {
      for (var x = 0; x < data.results[0].data.length; x++) {
        var obj = {
          'resultIndex': x,
          'label': swgraph.graph.getRootNode().internalLabel,
          'attributes': {}
        };

        for (var i = 0; i < data.results[0].columns.length; i++) {
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
      // var results = d3.select("#" + swgraph.result.containerId).selectAll(".ppt-result").data([node]);
      //        results.exit().remove();
      // Update data
      results = d3.select('#' + swgraph.result.containerId).html('').selectAll('.ppt-result').data([node], function (d) {
        return d.id;
      });
      // Add new elements
      var spanElmt = results.enter()
        .append('span')
        .html(function(d) {
          var resHtml = '';
          // console.log(d);
          resHtml = "<p id='swgraph-result-" + d.id + "'>" + d.internalLabel + '</p>';
          jQuery.each(d, function(key, value) {
            // console.log(key);
            // console.log(value);
            resHtml += '<span class="attributeName">' + key + ':&nbsp;</span>';
            resHtml += '<span class="attributeValue">' + value + '</span>';
          });
          return resHtml;
        });

        // Generate results with providers
        // pElmt.each(function (d) {
        //	swgraph.provider.getDisplayResultFunction(d.label)(d3.select(this));
        // });
    }
  };

  /// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        // console.log(swgraph.provider.nodeProviders[label])
        // console.log(swgraph.provider.nodeProviders)
        return swgraph.provider.nodeProviders[label];
      } else {
        swgraph.logger.debug('No direct provider found for label ' + label);
        // Search in all children list definitions to find the parent provider.
        for (var p in swgraph.provider.nodeProviders) {
          if (swgraph.provider.nodeProviders.hasOwnProperty(p)) {
            var provider = swgraph.provider.nodeProviders[p];
            if (provider.hasOwnProperty('children')) {
              if (provider['children'].indexOf(label) > -1) {
                swgraph.logger.debug('No provider is defined for label (' + label + '), parent (' + p + ') will be used');
                // A provider containing the required label in its children definition has been found it will be cloned.
                var newProvider = {'parent': p};
                for (var pr in provider) {
                  if (provider.hasOwnProperty(pr) && pr != 'children' && pr != 'parent') {
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
        for (var prop in swgraph.provider.DEFAULT_PROVIDER) {
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
    // console.log(label)
    // console.log(name)
    var provider = swgraph.provider.getProvider(label);
    // console.log(provider)
    if (!provider.hasOwnProperty(name)) {
      var providerIterator = provider;
      // Check parents
      var isPropertyFound = false;
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
        swgraph.logger.debug('No "' + name + '" property found for node label provider (' + label + '), default value will be used');
        if (swgraph.provider.DEFAULT_PROVIDER.hasOwnProperty(name)) {
          provider[name] = swgraph.provider.DEFAULT_PROVIDER[name];
        } else {
          swgraph.logger.error('No default value for "' + name + '" property found for label provider (' + label + ')');
        }
      }
    }
    // hth20160822
    // console.log(provider[name])
    return provider[name];
  };
  swgraph.provider.getIsSearchable = function (label) {
    return swgraph.provider.getProperty(label, 'isSearchable');
  };
  swgraph.provider.getReturnAttributes = function (label) {
    var provider = swgraph.provider.getProvider(label);
    var attributes = {}; // Object is used as a Set to merge possible duplicate in parents
    if (provider.hasOwnProperty('returnAttributes')) {
      for (var i = 0; i < provider.returnAttributes.length; i++) {
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
        for (var j = 0; j < provider.returnAttributes.length; j++) {
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
      for (var k = 0; k < swgraph.provider.DEFAULT_PROVIDER.returnAttributes.length; k++) {
        if (swgraph.provider.DEFAULT_PROVIDER.returnAttributes[k] !== swgraph.query.NEO4J_INTERNAL_ID) {
          attributes[swgraph.provider.DEFAULT_PROVIDER.returnAttributes[k]] = true;
        }
      }
    }
    // Add constraint attribute in the list
    var constraintAttribute = swgraph.provider.getConstraintAttribute(label);
    if (constraintAttribute === swgraph.query.NEO4J_INTERNAL_ID) {
      attributes[swgraph.query.NEO4J_INTERNAL_ID.queryInternalName] = true;
    } else {
      attributes[constraintAttribute] = true;
    }
    // Add all in array
    var attrList = [];
    for (var attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        if (attr == swgraph.query.NEO4J_INTERNAL_ID.queryInternalName) {
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
    // console.log(node)
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
  swgraph.provider.getCategoryName = function(label) {
    return swgraph.provider.getProperty(label, 'categoryAttribute');
  };
  swgraph.provider.getCategoryColor = function(label) {
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
         * Default value is "count" attribute.
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
         * Default value is "null" to disable order by.
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
         * For example if the returned list contain ["$identifier.born > 1976"] for "Person" nodes everywhere in swgraph.js the generated Cypher query will add the constraint
         * "WHERE person.born > 1976"
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
         *  In this case the node will be drawn as an image and "getImagePath" function is required to return the node image path.
         *
         * swgraph.provider.NodeDisplayTypes.SVG
         *  In this case the node will be drawn as SVG paths and "getSVGPaths"
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
        var text;
        var constraintAttr = swgraph.provider.getProperty(node.internalLabel, 'constraintAttribute');
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
        var text;
        var constraintAttr = swgraph.provider.getProperty(node.internalLabel, 'constraintAttribute');
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
        var result = pElmt.data()[0];

        var returnAttributes = swgraph.provider.getReturnAttributes(result.label);

        var table = pElmt.append('table').attr('class', 'ppt-result-table');

        returnAttributes.forEach(function (attribute) {
          var attributeName = (attribute === swgraph.query.NEO4J_INTERNAL_ID) ? swgraph.query.NEO4J_INTERNAL_ID.queryInternalName : attribute;

          var tr = table.append('tr');
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

  return swgraph;
}());
