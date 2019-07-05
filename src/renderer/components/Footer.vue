<template>
  <el-row class="footer">
    <img src="@/assets/newfang.svg" class="newfangLogo" @click="newfangClick()"/>
  </el-row>
</template>

<script>
const { shell } = require('electron')
export default {
  methods: {
    newfangClick () {
      shell.openExternal('http://newfang.io')
    }
  }
}
</script>

<style>
.footer {
  height: 20px;
  background-color: #d6d6d6;
  text-align: center;
  font-size: 12px;
}

.newfangLogo {
  margin-top: 3px;
  margin-right: 4px;
  height: 14px;
  cursor: pointer;
}

.material-icons.md-12 {
  font-size: 12px;
}
</style>
