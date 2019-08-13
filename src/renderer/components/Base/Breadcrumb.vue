<template>
  <section class="bcrumb">
  <transition name="fade-transform" mode="out-in">
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item v-for="crumb in crumbs" :key="crumb.id" @click.native="handleCrumbClick(crumb.id)">{{ crumb.name }}</el-breadcrumb-item>
    </el-breadcrumb>
  </transition>
  </section>
</template>

<script>

export default {
  components: {
  },
  watch: {
    $route (to, from) {
      this.getCrumbs()
    }
  },
  data () {
    return {
      crumbs: [{'name': '', 'id': ''}],
      curCrumbId: ''
    }
  },
  computed: {
  },
  methods: {
    getCrumbs () {
      this.crumbs = []
      this.curCrumbId = this.$route.params.fid
      this.curParentCrumbId = this.$route.params.parentId
      this.setCrumbs(this.curCrumbId, localStorage.getItem('uid'))
    },

    setCrumbs (crumbId, uid) {
      const self = this
      this.$db.find({ _id: crumbId, uid: uid, type: 'folder' }, function (err, docs) {
        if (!err) {
          if (docs.length === 1) {
            if (docs[0].parentId !== 'null') {
              self.crumbs.unshift({'name': docs[0].name, 'id': docs[0]._id})
              self.setCrumbs(docs[0].parentId, uid)
            } else {
              self.crumbs.unshift({'name': docs[0].name, 'id': docs[0]._id})
            }
          }
        }
      })
    },

    handleCrumbClick (id) {
      const self = this
      this.$db.find({ _id: id, uid: localStorage.getItem('uid'), type: 'folder' }, function (err, docs) {
        if (!err) {
          const parentCrumbId = docs[0].parentId
          localStorage.setItem('curParent', parentCrumbId)
          self.$router.push({name: 'Home', params: {fid: id, parentId: parentCrumbId}})
        }
      })
    }
  },
  mounted () {
    this.getCrumbs()
  }
}
</script>

<style lang="scss" scoped>
.bcrumb {
  /* 50= navbar  50  */
  min-height: 24px;
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f2f2f2 !important;
  padding-top: 50px;
}

.el-breadcrumb {
  height: 24px;
  padding: 6px;
  padding-left: 16px;
  border-bottom: 1px solid #e6e6e6;
}

.el-breadcrumb__item {
  line-height: 24px;
  font-size: 12px;
  cursor: pointer;
}

/* fade-transform */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .5s;
}

.fade-transform-enter {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
