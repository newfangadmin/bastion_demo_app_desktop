<template>
  <div class="app-wrapper">
    <div class="main-container">
      <div class="fixed-header">
        <navbar />
      </div>
      <breadcrumb />
      <appmain />
      <!-- <fab
        :position="position"
        :bg-color="bgColor"
        :actions="fabActions"
        @cache="cache"
        icon-size="small"
      ></fab> -->
    </div>
  </div>
</template>

<script>
import navbar from '@/components/Base/Navbar'
import breadcrumb from '@/components/Base/Breadcrumb'
import appmain from '@/components/Base/AppMain'
// import fab from 'vue-fab'

export default {
  name: 'Home',
  components: {
    navbar,
    breadcrumb,
    appmain
    // fab
  },
  data () {
    return {
      bgColor: '#fbc531',
      position: 'bottom-right',
      fabActions: [
        {
          name: 'cache',
          icon: 'backup',
          tooltip: 'Upload Video'
        }
      ]
    }
  },
  methods: {
    cache () {
      console.log('Cache Cleared')
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "~@/styles/variables.scss";

  .app-wrapper {
    position: relative;
    height: 100%;
    width: 100%;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: 100%;
    transition: width 0.28s;
  }
</style>
