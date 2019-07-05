<template>
  <div class="app-wrapper">
    <div class="main-container">
      <div class="fixed-header">
        <navbar />
      </div>
      <breadcrumb />
      <appmain />
      <foot />
    </div>
  </div>
</template>

<script>
import navbar from '@/components/Base/Navbar'
import breadcrumb from '@/components/Base/Breadcrumb'
import appmain from '@/components/Base/AppMain'
import foot from '@/components/Footer'
// import fab from 'vue-fab'

export default {
  name: 'Home',
  components: {
    navbar,
    breadcrumb,
    appmain,
    foot
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
    background-color: #f2f2f2;
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
