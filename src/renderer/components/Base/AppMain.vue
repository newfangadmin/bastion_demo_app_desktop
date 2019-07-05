<template>
  <section class="app-main">
    <transition name="fade-transform" mode="out-in">
      <router-view :key="key"></router-view>
    </transition>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    key () {
      return this.$route.path
    }
  },
  mounted () {
  }
}
</script>

<style lang="scss" scoped>

.app-main {
  /* 50= navbar  50  */
  min-height: calc(100vh - 107px);
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f2f2f2 !important;
}

.fixed-header+.app-main {
  padding-top: 87px;
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
