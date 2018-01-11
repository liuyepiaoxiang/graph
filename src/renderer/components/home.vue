<template>
    <div>
        <div class="header">
            <img src="./img/LOGO.png" alt="">
        </div>
        <div class="sidebar">
            <ul class="nav nav-tabs" role="tablist">
                <li role="presentation"><router-link role="tab" :to="{ name: 'data'}"><img src="./img/import.png" alt="">导入数据</router-link></li>
                <li role="presentation"><router-link aria-controls="profile" role="tab" :to="{ name: 'suggest'}"><img src="./img/value.png" alt="">价值建议</router-link></li>
                <li role="presentation"><router-link aria-controls="profile" role="tab"  :to="{ name: 'support'}"><img src="./img/support.png" alt="">客单提升</router-link></li>
            </ul>
        </div>
        <div class="content">
            <router-view></router-view>
        </div>
    </div>
</template>

<script>
    import 'element-ui'

    export default {
      name: 'topbar'
    }
</script>

<style>
    /* CSS */
    .header{
        width: 100vw;
        background-color: #1087ff;
    }
    .header img{
        height:12vh;
        padding:0 2vh;
    }
    .sidebar{
        float: left;
        height:83vh;
        width: 15vw;
        background-color: #29313e;
    }
    .content{
        display: flex;
        height:83vh;
        width: 83vw;
    }
    ul{
        margin: 0;
        padding: 0;
    }
    ul li{
        list-style: none;
        line-height: 10vh;
        padding: 20px;
    }
    ul li a{
        text-decoration-line: none;
        color: #ffffff;
    }
    ul li:hover{
        color: #2c3441;
        border: 1px solid #232b37;
        box-shadow: 1px 1px #2c3441;
    }
</style>
