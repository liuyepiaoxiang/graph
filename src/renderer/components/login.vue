<template>
    <div class="container content">
        <div class="grid-content bg-purple-light">
            <div class="login">
                <p class="center">零僧超市数据分析系统</p>
                <el-form>
                    <el-form-item label="用户名" >
                        <el-input type="text" v-model="userName" name="username" placeholder="请输入用户名">
                            <i slot="prefix" class="el-input__icon icon-user"></i>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="密码">
                        <el-input type="text" v-model="pwd" name="pwd" placeholder="请输入密码">
                            <i slot="prefix" class="el-input__icon icon-pwd"></i>
                        </el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="login();">立即登录</el-button>
                       <!-- <el-button type="primary" @click="register();">注册</el-button>
                        <el-button type="primary">忘记密码？</el-button>-->
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script>
export default{
  data: function () {
    return {
      userName: '',
      pwd: ''
    }
  },
  methods: {
    register () {
      this.$router.push({name: 'register'})
    },
    login () {
      console.log('login')
      this.$router.push({name: 'data'})
    }
  }
}
</script>

<style scoped>
.content{
    background: url('./img/background.png') no-repeat fixed center;
    background-size: 100%;
    height:97vh;
}
.login{
    width: 50vw;
    position  : absolute;
    top       : 50%;
    left      : 50%;
    transform : translate(-50%,-50%);
    margin:auto;
    vertical-align: middle;
    text-align: center;
    background-color: #949494;
    background-color: rgba(0,0,0,0.42);
    }
p {
    color: #ffffff;
    font-size: 24px;
}
    .el-form-item .el-form-item__label{
        color: #ffffff;
    }
    .icon-user{
        background: url('./img/user.png') no-repeat fixed center;
    }
</style>
