<template>
  <div id="my-timeLine" class="resize">
    <div class="clearfix border" id="time" hidden>
      <div class="col-md-2 margin" id="check" v-show="checks.length" >
          <div v-for="v in checks" v-if="v.type !== undefined" :key="v">
            <div class="col-md-7 align">
              <input type="checkbox" name="type" v-bind:value="v.type" v-model="v.checked" @click="check" :checked="v.ckecked">
              <span class='marginLeft'>{{v.type}}</span></div>
              <span class="colorblock" v-bind:style="{ background: getTypeColor(v.type)}"></span>
            <div class="col-md-5 left"></div>
          </div>
      </div>
    <div id="timelineContainer" class="col-md-9" ></div>
    </div>
    <div id="finance" hidden></div>
  </div>
</template>

<script type="text/ecmascript-6">
  /* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
  import setTimeline from '../timeLine/generateTimeline';
  import timelineTransform from '../dataRelated/timelineDataDealer';
  import httpReq from '../dataRelated/dataTransfer';
  import { nodes, checkFilter } from '../forceSimulation/createForceSimulation';
  import { checkData } from '../Arc/ArcMenuGenerator';
  import { checkFilterTimeSeries, getTypeColor } from '../timeLine/generateTimeSeries';

  export default {
    props: [],
    name: 'my-timeLine',
    data() {
      return {
        timelineData: null,
        checks: checkData,
        checktype: [],
      };
    },
    methods: {
      setTimeline(response) {
        // setTimeline(timelineTransform());
        setTimeline(timelineTransform(response));
        /* httpReq.getRelation('/graph/timers', 'post')
          .then((response) => {
            console.log(response);
            this.timelineData = response;
            setTimeline(timelineTransform(response));
          }); */
      },
      getChecks() {
        httpReq.getRelation('/graph/typeres', 'post', { id: Array.from(nodes, d => d.id) })
          .then((response) => {
            console.log('response types');
            console.log(response);
            // this.checks.push(...response.body);
          });
      },
      gettype() {
        checkData.forEach((v, i) => {
          if (v.type !== undefined) {
            this.checktype[i] = v.type;
            console.log(this.checktype);
          }
        });
      },
      check() {
        console.log(this.checks);
        const type = new Set();
        this.checks.forEach((v, i) => {
          if (v.type !== undefined && v.checked === false) {
            type.add(v.type);
          }
        });
        checkFilter(type);
        checkFilterTimeSeries(type);
      },
      analysisModalClose() {
        /*  点击删除模态框关闭按钮触发事件 */
        $('#analysisModal').hide();
      },
      getTypeColor(d) {
        return getTypeColor(d);
      },
    },
  };
</script>

<style scoped>
  #my-timeLine {
    resize: vertical;
    background-color: white;
    position:absolute;
    bottom: 0;
    width: 100%;
    border-top: 1px solid #ccc;
  }
  .resize{
    resize: vertical;
    overflow: auto;
  }
  #timelineContainer{
    overflow-x:hidden;
    margin-left: 20px;
  }
  #finance{
    min-height: 250px;
  }
  li{
    list-style-type:none;
  }
  .close{
    width:16px;
    height:16px;
    float:right;
    margin-right:10px;
    padding-top:0px;
    background:url('/src/renderer/components/img/close.png') no-repeat 0px 0px;
  }
  .border{
    margin-right: 20px;
    -webkit-box-shadow:0 0 10px #ececec;
    -moz-box-shadow:0 0 10px #ececec;
    box-shadow:0 0 10px #ececec;
  }
  .colorblock{
    margin: auto;
    width: 10px;
    height: 10px;
    display: inline-block;
    line-height: 22px;
    border-radius:5px;
    opacity:0.6
  }
  .margin{
    margin-top: 60px;
  }
  .align{
    text-align: left;
    padding-left: 20px;
  }
  .marginLeft{
    margin:0 10px;
  }
  .left{
    padding-left: 40px;
    text-align: left;
  }
</style>
