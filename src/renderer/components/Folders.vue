<template>
  <div class="loading" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <el-row>
      <el-col :span="4" style="padding-top: 12px; padding-bottom: 12px;">
        <div class="foldersHeading">Folders</div>
        <el-button class="backBtn smBtn" v-if="!nullParent" icon="el-icon-back" @click="handleBack()">BACK</el-button>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="foldersContainer">
      <el-col :span="4">
        <el-card class="newFolderBtn" :body-style="{ padding: '0px' }" shadow="hover" @click.native="handleAddFolder()">
          <el-col :span="5" class="iconContainer">
            <i class="material-icons grey" style="line-height: 1.7">add_box</i>
          </el-col>
          <el-col :span="19" class="fileNameContainer">
            <div class="fileName grey">Add New Folder</div>
          </el-col>
        </el-card>
      </el-col>
        <div v-if="!noFolders">
          <transition-group name="fade-transform">
          <el-col :span="4" v-for="folder in folders" :key="folder._id">
            <el-card :body-style="{ padding: '0px' }" @click.native="handleClick(folder._id, folder.name)">
              <el-col :span="5" class="iconContainer">
                <span class="fiv-sqo fiv-icon-folder image"></span>
              </el-col>
              <el-col :span="19" class="fileNameContainer">
                <div class="fileName">{{ folder.name }}</div>
              </el-col>
            </el-card>
          </el-col>
          </transition-group>
        </div>
    </el-row>
  </div>
</template>

<script>

export default {
  components: {
  },
  data () {
    return {
      uid: null,
      loading: true,
      noFolders: true,
      folders: null,
      curFolderId: '',
      parentFolderId: '',
      nullParent: true
    }
  },
  computed: {
  },
  methods: {
    getFolders () {
      const self = this
      self.$db.find({ uid: self.uid, type: 'folder', parentId: self.curFolderId }).sort({ addDate: -1 }).exec(function (err, docs1) {
        self.loading = false
        if (!err) {
          if (docs1.length > 0) {
            self.noFolders = false
            self.folders = docs1
          } else {
            self.noFolders = true
          }
        }
      })
    },

    handleClick (key, name) {
      this.$router.push({name: 'Home', params: {fid: key, parentId: this.curFolderId}})
    },

    handleAddFolder () {
      this.$prompt('Please enter the Folder Name', 'Add Folder', {
        confirmButtonText: 'Add',
        cancelButtonText: 'Cancel'
      }).then(({ value }) => {
        var newFolder = {
          name: value,
          uid: localStorage.getItem('uid'),
          addDate: new Date(),
          type: 'folder',
          parentId: this.curFolderId
        }
        const self = this
        self.$db.insert(newFolder, function (err, newDoc1) {
          if (!err) {
            // self.$root.$emit('addedFolder')
            self.getFolders()
            self.$message({
              type: 'success',
              message: 'Successfully created folder with name - ' + value
            })
          }
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: 'Folder creation cancelled'
        })
      })
    },

    handleBack () {
      this.$router.go(-1)
    }
  },
  mounted () {
    this.uid = localStorage.getItem('uid')
    this.curFolderId = this.$route.params.fid
    this.parentFolderId = this.$route.params.parentId
    if (this.parentFolderId === 'null') {
      this.nullParent = true
    } else {
      this.nullParent = false
    }
    this.getFolders()
  }
}
</script>

<style lang="scss" scoped>
.noFolders {
  text-align: center;
  color: #888;
}

.foldersContainer {
  padding: 0px 16px 18px 16px;
  border-bottom: 1px solid #e6e6e6;
}

.material-icons.grey {
  color: rgba(136, 136, 136, 0.7);
}

.newFolderBtn {
  background: none;
  border: 1px dashed #888;
}

.foldersHeading {
  color: #888;
  margin-left: 12px;
  display: inline-block;
  font-size: 20px;
  font-weight: 200;
}

.el-card {
  text-align: center;
  cursor: pointer;
  margin-top: 10px;
}

.image {
  width: 24px;
  padding-top: 21px;
  padding-bottom: 4px;
}

.iconContainer {
  display: table !important;
  height: 40px;
}

.fileNameContainer {
  padding: 0px !important;
  padding-right: 10px !important;
}

.fileName {
  height: 40px;
  line-height: 40px;
  text-align: left; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.fileName.grey {
  color: #888;
  font-weight: 500;
}

.backBtn {
  display: inline-block;
  margin-left: 6px;
}

.material-icons.md-16 { 
  font-size: 16px;
  padding-top: 1px;
}
</style>
