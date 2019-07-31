<template>
  <div class="loading" v-loading="loading" element-loading-background="rgba(255, 255, 255, 0.8)">
    <el-row>
      <el-col :span="4" style="padding-top: 12px; padding-bottom: 0px;">
        <div class="foldersHeading">Folders</div>
        <el-button class="backBtn smBtn" v-if="!nullParent" icon="el-icon-back" @click="handleBack()">BACK</el-button>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="foldersContainer">
      <el-col :xs="8" :sm="8" :md="6" :lg="4" :xl="4" style="outline: none; margin-top: 18px;">
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
        <el-col :xs="8" :sm="8" :md="6" :lg="4" :xl="4" v-for="folder in folders" :key="folder._id" style="outline: none;" class="cardContainer">
          <el-card :body-style="{ padding: '0px' }" class="folderOptions" shadow="never">
            <el-col :span="15" style="padding-top: 8px; text-align: left">{{ folder.addDate | moment("Do MMM YY") }}</el-col>
            <el-col :span="9"><el-button @click="handleDelete(folder._id)" class="secondaryBtn" style="padding: 0px; padding-top: 9px; font-size: 12px;" icon="el-icon-delete">Delete</el-button></el-col>
          </el-card>
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
import { dbFetch, dbInsert } from '../api/db'

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
      nullParent: true,
      working: false
    }
  },
  computed: {
  },
  methods: {
    showMsgBox (type, message) {
      this.$message({
        type: type,
        message: message,
        duration: 5000
      })
    },

    getFolders () {
      const params = { uid: this.uid, type: 'folder', parentId: this.curFolderId }
      const sort = { addDate: -1 }
      dbFetch(params, sort, (err, res) => {
        this.loading = false
        if (!err) {
          if (res.length > 0) {
            this.noFolders = false
            this.folders = res
          } else {
            this.noFolders = true
          }
        }
      })
    },

    handleClick (key, name) {
      if (!this.working) {
        this.$router.push({name: 'Home', params: {fid: key, parentId: this.curFolderId}})
      } else {
        this.showMsgBox('error', 'Upload/Download in progress. Please wait.')
      }
    },

    handleAddFolder () {
      if (!this.working) {
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
          dbInsert(newFolder, (err, res) => {
            if (!err) {
              this.getFolders()
              this.showMsgBox('success', 'Successfully created folder with name - ' + value)
            }
          })
        }).catch(() => {
          this.showMsgBox('info', 'Folder creation cancelled')
        })
      } else {
        this.showMsgBox('error', 'Upload/Download in progress. Please wait.')
      }
    },

    handleBack () {
      if (!this.working) {
        this.$router.go(-1)
      } else {
        this.showMsgBox('error', 'Upload/Download in progress. Please wait.')
      }
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
    this.$root.$on('working', () => {
      this.working = true
    })
    this.$root.$on('idle', () => {
      this.working = false
    })
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
  outline: none !important;
  position: relative;
  z-index: 10;
}

.cardContainer {
  position: relative;
  margin-top: 18px;
  margin-bottom: 18px;
}

.folderOptions {
  position: absolute;
  top: 5px;
  left: 5.4%;
  width: 88%;
  height: 30px;
  background-color:#e0e0e0;
  border: 1px solid #dddddd;
  border-radius: 0px 0px 4px 4px;
  transition: all 0.4s;
  z-index: 9;
  // opacity: 0;
  padding: 0px !important;
  cursor:default;
  font-size: 11px;
  text-align: left;
  padding-top: 12px;
  color: #8b8b8b;
}

.cardContainer:hover .folderOptions {
  transform: translateY(36px);
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
