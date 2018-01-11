/**
 * Created by Administrator on 2017/5/10 0010.
 * 该文件专门用来获取，处理d3需要用到的数据
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars */
import Vue from 'vue';

const nodes = [
  { id: 'Alice' },
  { id: 'Bob' },
  { id: 'Carol' },
  { id: 'David' }
];

const nodes2 = [
  { id: 'Alice2' },
  { id: 'Bob2' },
  { id: 'Carol2' },
  { id: 'David2' },
  { id: 'Fred2' }
];

const links = [
  { source: 0, target: 1, name: 'Alice → Bob' }, // Alice → Bob
  { source: 1, target: 2, name: 'Bob → Carol' }, // Bob → Carol
  { source: 0, target: 3, name: 'Alice → David' } // Alice → David
];

const links2 = [
  { source: 0, target: 2 },
  { source: 2, target: 3 },
  { source: 3, target: 1 },
  { source: 1, target: 0 }
];

/**
 * 创建一个vue实例专门用来处理http请求
 * */
const http = new Vue({
  data: {
    storage: null
  },
  methods: {
    /**
     * 通用http函数
     * @param {String} path 请求路径
     * @param {String} method 'GET' 'POST' etc 请求方式
     * @param {Object} data 数据
     * @param {Object} options 参数
     * */
    getRelation(path, method, data, options) {
      // console.log(this);
      // return false;
      return this.$http[method](path, data, options);
      /* .then((response) => {
          console.log('success');

         if (!response.body.data) {
            this.$layer.msg('未获取到数据');
          }

          if (!response.body.data) {
            //this.$layer.msg('未获取到数据');
          }
          // this.storage = response.body;
          return response;
        }, (response) => {
          console.log('err', response);
          this.$layer.msg('获取数据失败');
          return response;
        }); */
    }
  }
});

export { http };
export default http;
