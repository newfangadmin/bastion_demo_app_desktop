<template>
  <div class="loading" v-loading="loading" element-loading-background="rgba(255, 255, 255, 0.8)">
    <el-row>
      <el-col :span="4" style="padding-top: 12px; padding-bottom: 0px;">
        <div class="foldersHeading">Folders</div>
        <el-button class="backBtn smBtn" v-if="!nullParent" icon="el-icon-back" @click="handleBack()">BACK</el-button>
      </el-col>
    </el-row>
    <el-row :gutter="10" class="foldersContainer">
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
        <el-col :xs="8" :sm="8" :md="6" :lg="4" :xl="4" v-for="(folder, index) in folders" :key="folder._id" style="outline: none;" class="cardContainer">
          <el-card :body-style="{ padding: '0px' }" class="folderOptions" shadow="never">
            <el-col :span="15" style="padding-top: 8px; text-align: left">{{ folder.addDate | moment("Do MMM YY") }}</el-col>
            <el-col :span="9"><el-button @click="handleDelete(folder._id, folder.name, index)" class="secondaryBtn" style="padding: 0px; padding-top: 9px; font-size: 12px;" icon="el-icon-delete">Delete</el-button></el-col>
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
import { dbFetch, dbInsert, dbRemove } from '../api/db'
const Utils = require('../../../node_modules/newfang/newfang_utils').default

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
      working: false,
      folderDelArr: [],
      fileDelArr: []
    }
  },
  computed: {
  },
  methods: {
    validFolderLength (value) {
      if (value.length > 20) {
        return 'Folder Name cannot exceed 20 characters.'
      } else {
        return true
      }
    },

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
        localStorage.setItem('curParent', this.curFolderId)
        this.$router.push({name: 'Home', params: {fid: key, parentId: this.curFolderId}})
      } else {
        this.showMsgBox('error', 'Upload/Download in progress. Please wait.')
      }
    },

    handleAddFolder () {
      if (!this.working) {
        this.$prompt('Please enter the Folder Name', 'Add Folder', {
          confirmButtonText: 'Add',
          cancelButtonText: 'Cancel',
          inputPattern: /^(\w+\.?)*\w+$/,
          inputValidator: this.validFolderLength,
          inputErrorMessage: 'Invalid Folder Name'
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
        const id = localStorage.getItem('curParent')
        const params = { _id: id, uid: localStorage.getItem('uid'), type: 'folder' }
        const sort = null
        dbFetch(params, sort, (err, res) => {
          if (!err) {
            const parentCrumbId = res[0].parentId
            localStorage.setItem('curParent', parentCrumbId)
            this.$router.push({name: 'Home', params: {fid: id, parentId: parentCrumbId}})
          }
        })
      } else {
        this.showMsgBox('error', 'Upload/Download in progress. Please wait.')
      }
    },

    async handleDelete (folderId, folderName, index) {
      this.loading = true
      this.$root.$emit('fworking')
      this.folderDelArr = []
      this.fileDelArr = []
      const uid = localStorage.getItem('uid')
      await this.getFolderDelArray(folderId, uid)
      this.folderDelArr.push({
        id: folderId,
        name: folderName
      })
      const folderCount = this.folderDelArr.length
      const fileCount = this.fileDelArr.length
      var totalFileSize = 0
      this.fileDelArr.forEach(file => {
        totalFileSize += file.size
      })
      var nVal = 0
      var kVal = 1
      if (this.fileDelArr.length > 0) {
        nVal = this.fileDelArr[0].uri.split(':')[5]
        kVal = this.fileDelArr[0].uri.split(':')[4]
      }
      this.$confirm('You are about to delete:<br/><strong>' + folderCount + ' Folders</strong><br/><strong>' + fileCount + ' Files</strong><br/>Freeing up <strong>' + (totalFileSize / 1000000 * (nVal / kVal)).toFixed(2) + ' MB</strong>', 'Confirm Delete', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        dangerouslyUseHTMLString: true
      }).then(() => {
        const convergence = localStorage.getItem('convergence')
        var uploadParams
        this.fileDelArr.forEach(file => {
          uploadParams = {
            k: file.uri.split(':')[4],
            n: file.uri.split(':')[5]
          }

          const util = new Utils({
            convergence: convergence,
            uri: file.uri
          })
          util.remove((err, data) => {
            if (err) {
              this.$message({
                type: 'error',
                message: 'Delete unsuccessful. Please try again.'
              })
            } else {
              dbRemove(file.id, (err, res) => {
                if (!err) {
                  this.$message({
                    type: 'success',
                    message: 'Delete successful'
                  })
                } else {
                  console.log({err})
                }
              })
            }
          })
        })
        this.$root.$emit('removedFile', totalFileSize * (uploadParams.n / uploadParams.k))
        this.folderDelArr.forEach(folder => {
          dbRemove(folder.id, (err, res) => {
            if (err) {
              console.log(err)
            } else {
              this.folders.splice(index, 1)
            }
          })
        })
        this.loading = false
        this.$root.$emit('fidle')
      }).catch(() => {
        this.loading = false
        this.$root.$emit('fidle')
      })
    },

    getFolderDelArray (id, uid) {
      return new Promise(async (resolve, reject) => {
        await this.getFileDelArr(id, uid)
        const params = { parentId: id, uid: uid, type: 'folder' }
        const sort = null
        dbFetch(params, sort, async (err, res) => {
          if (!err) {
            if (res.length > 0) {
              for (var i = 0; i < res.length; i++) {
                this.folderDelArr.push({
                  id: res[i]._id,
                  name: res[i].name
                })
                await this.getFolderDelArray(res[i]._id, uid)
              }
            }
            resolve()
          } else {
            reject(err)
          }
        })
      })
    },

    getFileDelArr (folderId, uid) {
      return new Promise((resolve, reject) => {
        const params = { parentId: folderId, uid: uid, type: 'file' }
        const sort = null
        dbFetch(params, sort, (err, res) => {
          if (!err) {
            if (res.length > 0) {
              for (var i = 0; i < res.length; i++) {
                this.fileDelArr.push({
                  id: res[i]._id,
                  name: res[i].name,
                  uri: res[i].uri,
                  size: res[i].size
                })
              }
            }
            resolve()
          } else {
            reject(err)
          }
        })
      })
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
