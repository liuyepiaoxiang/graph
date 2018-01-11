<template>
    <div class="container">
        <div class="import">
            <!--<div><img src="static/img/welcome.png" alt=""></div>-->
            <el-row>
                <el-input type="text" class="fileName" disabled v-model="file[0]"></el-input>
                <i class="el-icon-plus addFile" @click="imgClick"></i>
                <el-button type="warning" @click="uploadFile">上传<i class="el-icon-upload el-icon--right"></i></el-button>
            </el-row>
        <div>
        <div class="import">
           <!-- <div><img src="static/img/welcome.png" alt=""></div>
            <div class="importButton">
                <img src="static/img/import.png" alt="" @click="imgClick">
            </div>-->
            <div v-show="percentage">
                <el-progress :percentage="percentage" :stroke-width="18" type="line" :status="progressStatus" :text-inside="true"></el-progress>
                <p>{{ message }}</p>
            </div>
            <!--<div id="graph" class="graph"> -->
                <div id="svgContainer" @contextmenu.prevent = "" class="graph">
                </div>
            <el-dialog title="提示" :visible.sync="dialogVisible" size="big" >
                <p>未匹配到商品号或者单号，请手工选择</p>
                <el-form ref="form" label-width="80px">
                    <el-form-item label="商品编号">
                        <el-select v-model="skuName" placeholder="请选择商品编号">
                            <el-option :label="title" v-for="title in titles" :key="title" :value="title"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="商品名称">
                        <el-select v-model="skuInfo" placeholder="请选择商品名称">
                            <el-option :label="title" v-for="title in titles" :key="title" :value="title"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="小票单号">
                        <el-select v-model="billName" placeholder="请选择小票单号">
                            <el-option :label="title" v-for="title in titles" :key="title" :value="title"></el-option>
                        </el-select>
                    </el-form-item>
                </el-form>
                <span slot="footer" class="dialog-footer">
                    <el-button @click="dialogVisible = false" v-bind:disabled="calculateFlag">取 消</el-button>
                    <el-button type="primary" @click="dealData" v-bind:disabled="calculateFlag">确 定</el-button>
                </span>
            </el-dialog>
        </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { ipcRenderer, remote } from 'electron'
    import { AprioriFun } from '../apriori_basic'
    import XLSX from 'xlsx'
    import * as _ from 'lodash'
    import { start, stopSimulation } from '../d3Related/forceSimulation/createForceSimulation'
    import dataTransform from '../d3Related/dataRelated/neo4jDataDealer'
    // import { infoData } from './d3Related/Arc/ArcMenuGenerator'
    export default{
      data () {
        return {
          file: [],
          progress: false,
          progressStatus: '',
          percentage: 0,
          message: '',
          skuName: '',
          billName: '',
          skuInfo: '',
          dialogVisible: false,
          titles: [],
          excelArry: [],
          billForApriori: {},
          disableFlag: true,
          writeExcelData: []
        }
      },
      computed: {
        calculateFlag () {
          if (this.skuName && this.skuInfo && this.billName) {
            return false
          } else {
            return true
          }
        }
      },
      created () {
        this.getGraph()
      },
      methods: {
        imgClick () {
          const o = remote.dialog.showOpenDialog({
            title: '选择一个文件',
            filters: [{
              name: 'Excel文档',
              extensions: 'xls|xlsx|xlsm|xlsb|xml|xlw|xlc|csv|txt|dif|sylk|slk|prn|ods|fods|uos|dbf|wks|123|wq1|qpw|htm|html'.split('|')
            }],
            properties: ['openFile']
          })
          // const filename = o[0].slice(o[0].lastIndexOf('\\') + 1, o[0].length - 1)
          this.file = o
          // console.log(o[0])
        },
        uploadFile () {
          if (this.file.length > 0) {
            this.progress = true
            this.status(10, `正在读取文件：${this.file[0]}`)
            const excel = XLSX.readFile(this.file[0])
            // 读取Excel内的每个sheet内的数据，XLSX读取后面的sheet也会存空数据进去，仅读取第一个sheet
            excel.SheetNames.forEach((sheetName, i) => {
              if (i === 0) {
                this.excelArray = XLSX.utils.sheet_to_json(excel.Sheets[sheetName])
              }
              console.log('1', this.excelArray)
            })
            console.log('2', this.excelArray[0])
            this.getName(this.excelArray[0])
          } else {
            this.$message({
              showClose: true,
              message: '警告，请选择一个文件后再上传',
              type: 'warning'
            })
          }
        },
        getName (v) {
          /* eslint-disable no-extra-boolean-cast */
          this.status(14, '正在读取后台配置')
          const arg = ipcRenderer.sendSync('send-name')
          const skus = arg.skus
          const bills = arg.bills
          const skuInfos = arg.skuInfos
          this.status(15, '读取配置文件成功，正在匹配文件内容')
          console.log('skus', skus)
          console.log('v', v)
          console.log('skus', skus)
          skus.forEach((sku) => {
            if (!!v[sku]) {
              this.skuName = sku
            }
          })
          bills.forEach((bill) => {
            if (!!v[bill]) {
              this.billName = bill
            }
          })
          skuInfos.forEach((skuInfo) => {
            if (!!v[skuInfo]) {
              this.skuInfo = skuInfo
            }
          })
          console.log('编号', this.skuName, this.billName)
          if (!this.skuName || !this.billName || !this.skuInfo) {
            this.status(18, '匹配失败，等待用户选择')
            this.titles = Object.keys(v)
            this.dialogVisible = true
          } else {
            this.status(18, '匹配成功，正在处理数据中，该步骤耗时较长，请耐心等待')
            this.dealData()
          }
        },
        dealData () {
          // billIDSet和skuIDSet分别用于存储bill和sku的唯一ID
          this.status(20, '匹配成功，正在处理数据中，该步骤耗时较长，请耐心等待')
          this.dialogVisible = false
          const billIDSet = new Set()
          const skuIDSet = new Set()
          const nodeArr = []
          let billIDArray = []
          /* eslint-disable no-unused-vars */
          let skuIDArray = []
          this.excelArray.forEach((ea) => {
            if (ea[this.billName]) {
              billIDSet.add(ea[this.billName])
            }
            if (ea[this.skuName]) {
              skuIDSet.add(ea[this.skuName])
            }
          })
          billIDArray = [...billIDSet]
          skuIDArray = [...skuIDSet]
          // 对数据中的所有bill进行遍历，将相同bill的sku放入一个数组
          billIDArray.forEach((bill) => {
            this.excelArray.forEach((ea) => {
              if (ea[this.billName] === bill) {
                this.billForApriori[`'${bill}'`] = this.billForApriori[`'${bill}'`] || []
                this.billForApriori[`'${bill}'`].push(ea[this.skuName])
                _.uniq(this.billForApriori[`'${bill}'`])
              }
            })
          })
          // 获取节点信息 TODO:还缺PageRank算法算出节点权重
          skuIDArray.forEach((sku) => {
            const node = {}
            this.excelArray.forEach((ea) => {
              if (ea[this.skuName] === sku) {
                node.skuid = sku
                node.skuName = ea[this.skuInfo]
              }
            })
            nodeArr.push(node)
          })
          console.log('节点信息', nodeArr)
          ipcRenderer.send('insert-node', nodeArr)
          ipcRenderer.on('node-reply', (event, arg) => {
            this.status(20 + arg.percentage, arg.message)
          })
          // Apriori算法
          console.log(this.billForApriori)
          let aprioriData = []
          Object.keys(this.billForApriori).forEach((b) => {
            aprioriData.push(this.billForApriori[b])
          })
          console.log('ap', aprioriData)
          const linkData = AprioriFun(aprioriData)
          ipcRenderer.send('open-item', linkData)
          ipcRenderer.send('insert-relation', linkData)
          ipcRenderer.on('relation-reply', (event, arg) => {
            this.status(60 + arg.percentage, arg.message)
          })
          // Excel数据生成
          // this.writeExcelData
        },
        status (percentage, message) {
          this.percentage = percentage
          this.message = message
          if (this.percentage === 100 && this.message === '导入完成') {
            this.progressStatus = 'success'
            this.getGraph()
          }
          if (this.percentage === 100 && this.message !== '导入完成') {
            this.progressStatus = 'exception'
          }
        },
        userCancel () {
          this.status(100, '用户取消')
          this.billName = ''
          this.skuInfo = ''
          this.skuName = ''
        },
        getGraph () {
          const cypher = 'match (n)-[r]-() return r limit 25'
          ipcRenderer.send('search-graph', cypher)
          ipcRenderer.on('graph-reply', (event, data) => {
            console.log(data)
            if (data.body.results) {
              const graphData = dataTransform(data)
              const node = graphData.node
              const link = graphData.link
              start(node, link)
            } else {
              this.$message('后台连接错误')
            }
          })
        }
      },
      destroyed () {
        stopSimulation()
      }
    }
</script>

<style scoped>
.import{
    height:70vh;
    width:90vw;
    padding: 20px 40px 0;
}
.fileName{
    width: 70%;
    height:36px;
}
.addFile{
    padding: 9px;
    top: 1px;
    border:1px solid #ececec;
    border-radius: 4px;
}
.graph{
    margin-top: 40px;
    background: top url('./img/progress.png') no-repeat;
    height:60vh;
    width:80%;
    border: 2px solid rgba(143,123,11,1);
}
.importButton{
    cursor: pointer;
}
    .hidden{
        display: none;
    }
</style>
