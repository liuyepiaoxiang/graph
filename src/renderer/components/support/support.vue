<template>
    <div class="support">
       <p>客单提升</p>
        <div class="table">
            <table>
                <thead>
                <tr>
                    <td>商品名称</td>
                    <td>重要度</td>
                    <td>搭配推荐</td>
                    <td>提升度</td>
                    <td>输入自选商品</td>
                    <td>提升度</td>
                </tr>
                </thead>
                <tbody>
                <tr v-for="table in tableData">
                    <td>{{ table.row[0]}}</td>
                    <td></td>
                    <td>{{ table.row[2] }}</td>
                    <td>{{ table.row[1].lift.substr(0,4) || '--' }}</td>
                    <td></td>
                    <td></td>
                </tr>
                </tbody>
            </table>
        </div>

    </div>
</template>

<script>
  import 'element-ui'
  import { ipcRenderer } from 'electron'

  export default {
    name: 'support',
    data () {
      return {
        tableData: []
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
      }
    }
  }
</script>

<style>
    /* CSS */
    .support{
        height:70vh;
        width:90vw;
        padding: 40px;
    }
    .table{
        overflow: scroll;
        height: 60vh;
    }
    table tr td{
        border:1px solid #ececec;
        text-align: center;
    }
    tr:nth-child(odd) {
        background-color: #ececec;
    }
</style>
