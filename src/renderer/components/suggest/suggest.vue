<template>
    <div class="suggest">
            <el-tabs v-model="first">
                <el-tab-pane label="陈列建议" name="first">
                    <p>历史数据</p>
                    <div class="block">
                        <el-pagination
                                @size-change="handleSizeChange"
                                @current-change="handleCurrentChange"
                                :current-page.sync="currentPage"
                                :page-size="100"
                                layout="prev, pager, next, jumper"
                                :total="1000">
                        </el-pagination>
                    </div>
                    <p>陈列建议</p>
                    <div class="table">
                    <table >
                        <thead>
                        <tr>
                            <td>序列编号</td>
                            <td>商品名称</td>
                            <td>搭配推荐</td>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(table,index) in tableData">
                            <td>{{ index }}</td>
                            <td>{{ table.row[0] }}</td>
                            <td>{{ table.row[2] }}</td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="淘汰建议" name="second">

                </el-tab-pane>
            </el-tabs>
    <div>
    </div>
    </div>
</template>

<script>
  import 'element-ui'
  import { ipcRenderer } from 'electron'

  export default {
    name: 'suggest',
    data () {
      return {
        first: 'first',
        tableData: [],
        graphList: [],
        currentPage: 1
      }
    },
    created () {
      this.getSupport()
    },
    methods: {
      getSupport () {
        const cypher = 'match (n) -[r]-(m) return n.skuname as startname ,r,m.skuname as endname order by r.lift desc limit 100'
        ipcRenderer.send('search-graph', cypher)
        ipcRenderer.on('graph-reply', (event, data) => {
          console.log('data', data)
          if (data.body.results[0]) {
            this.tableData = data.body.results[0].data
          }
        })
      },
      handleClick (row) {
        console.log(row)
      },
      handleSizeChange (val) {
        console.log(`每页 ${val} 条`)
      },
      handleCurrentChange (val) {
        console.log(`当前页: ${val}`)
      }
    }
  }
</script>

<style>
    /* CSS */
    .suggest{
        height:70vh;
        width:90vw;
        padding: 40px;
    }
    .table{
        overflow: scroll;
        height: 40vh;
    }
    table tr td{
        border:1px solid #ececec;
        text-align: center;
    }
    tr:nth-child(odd) {
        background-color: #ececec;
    }
</style>
