<template>
  <div class="navbar">
    <el-row :gutter="20">
      <el-col :span="2" class="logoContainer">
        <img class="logo" src="~@/assets/logo.svg" />
      </el-col>
      <el-col :span="12" :offset="0">
        <el-row>
          <el-col :span="20" style="padding-top: 8px;">
            <el-row style="padding-top: 4px;">
              <el-col :span="9" class="usageType" style="">STORAGE<span class="usageDetails">( {{ (sUsage/(1000000)).toFixed(1) }}MB of {{ sCap/(1000000) }}MB )</span></el-col>
              <el-col :span="15">
                <el-progress :percentage="sPercent" :color="usageColor1"></el-progress>
              </el-col>
            </el-row>
            <el-row style="padding-top: 4px;">
              <el-col :span="9" class="usageType" style="">BANDWIDTH<span class="usageDetails">( {{ bUsage/(1000000) }}MB of {{ bCap/(1000000) }}MB )</span></el-col>
              <el-col :span="15">
                <el-progress :percentage="bPercent" :color="usageColor2"></el-progress>
              </el-col>
            </el-row>
          </el-col>
          <!-- <el-col :span="4" style="padding-top: 17px;">
            <el-button class="smBtn">Upgrade</el-button>
          </el-col> -->
        </el-row>
      </el-col>
      <el-col :span="1" :offset="9">
        <el-row class="right-menu">
          <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
            <avatar username="Jane Doe" :size="32" background-color="#222" color="#00a8ff" />
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>
                <span style="display:block;" @click="logout">Account</span>
              </el-dropdown-item>
              <el-dropdown-item>
                <span style="display:block;" @click="logout">Logout</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Avatar from 'vue-avatar'

export default {
  components: {
    Avatar
  },
  data () {
    return {
      usageColor1: '#ffa801',
      usageColor2: '#44bd32',
      sCap: 0,
      bCap: 0,
      sUsage: 0,
      bUsage: 0,
      sPercent: 0,
      bPercent: 0
    }
  },
  computed: {
  },
  methods: {
    format () {
      return '5.32GB of 10GB'
    },

    updateStorageUsage (fileSize) {
      const newUsage = Number(this.sUsage) + Number(fileSize)
      const self = this
      this.$db.update({ _id: localStorage.getItem('uid') }, { $inc: { sUsage: fileSize } }, function (err, numReplaced) {
        if (!err) {
          self.sUsage = Number(parseFloat(newUsage).toFixed(1))
          self.sPercent = Number(parseFloat((self.sUsage / self.sCap) * 100).toFixed(1))
        }
      })
    },

    updateBandwidthUsage (fileSize) {
      const newUsage = Number(this.bUsage) + Number(fileSize)
      const self = this
      this.$db.update({ _id: localStorage.getItem('uid') }, { $inc: { bUsage: fileSize } }, function (err, numReplaced) {
        if (!err) {
          self.bUsage = Number(parseFloat(newUsage).toFixed(1))
          self.bPercent = Number(parseFloat((self.bUsage / self.bCap) * 100).toFixed(1))
        }
      })
    },

    logout () {
      this.$router.push({name: 'Login'})
    }
  },
  mounted () {
    const self = this
    this.$db.find({ _id: localStorage.getItem('uid') }, function (err, docs) {
      if (!err) {
        self.sCap = Number(parseFloat(docs[0].storageCap))
        self.bCap = Number(parseFloat(docs[0].bandwidthCap))
        self.sUsage = Number(parseFloat(docs[0].sUsage).toFixed(1))
        self.bUsage = Number(parseFloat(docs[0].bUsage).toFixed(1))
        self.sPercent = Number(parseFloat((self.sUsage / self.sCap) * 100).toFixed(1))
        self.bPercent = Number(parseFloat((self.bUsage / self.bCap) * 100).toFixed(1))
      }
    })

    this.$root.$on('uploadedFile', (data) => {
      this.updateStorageUsage(data)
    })

    this.$root.$on('downloadedFile', (data) => {
      this.updateBandwidthUsage(data)
    })
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  overflow: hidden;
  position: relative;
  background: #222;
  color: #f2f2f2;
  border-bottom: 1px solid #e6e6e6;

  .logoContainer {
  }

  .logo {
    display: inline-block;
    text-align: center;
    height: 32px;
    margin: 14px;
    margin-left: 10px;
    color: #fff;
    font-weight: 600;
    line-height: 50px;
    font-size: 14px;
    vertical-align: middle;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;
    width: 100%;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      height: 100%;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .avatar-container {
      margin-right: 10px;
      margin-top: 13px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }
      }
    }
  }

  .vue-avatar--wrapper {
    font-family: 'Source Sans Pro', 'sans-serif' !important;
    font-weight: 700 !important;
    border: 1px solid #00a8ff;
  }

  .el-progress {
    font-family: 'Source Sans Pro', 'sans-serif' !important;
  }

  .usageDetails, .usageType {
    text-align: left;
    padding-right: 6px;
    font-size: 12px;
    color: #888;
    padding-left: 6px;
    padding-top: 1px;
  }

  .usageType {
    text-align: right;
  }
}
</style>
