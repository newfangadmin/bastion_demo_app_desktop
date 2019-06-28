<template>
  <div>
    <folders />
    <files />
  </div>
</template>

<script>
import folders from '@/components/Folders'
import files from '@/components/Files'

export default {
  components: {
    folders,
    files
  },
  data () {
    return {
      curFolderName: '',
      curFolderId: ''
    }
  },
  computed: {
  },
  methods: {
  },
  mounted () {
  }
}
</script>

<style lang="scss" scoped>
.fab-main-container {
  right: 5% !important;
  z-index: 2000 !important;
}
</style>
