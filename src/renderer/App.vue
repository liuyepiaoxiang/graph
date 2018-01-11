<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  import 'element-ui'
  export default {
    name: 'graph'
  }
</script>

<style>
  /* CSS */
  #app{
    overflow: scroll;
  }
  /* 滚动条样式 */
  ::-webkit-scrollbar{
    width:1px;
    height:1px;
  }
</style>
