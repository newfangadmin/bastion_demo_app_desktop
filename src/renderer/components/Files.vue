<template>
  <div class="loading" v-loading="loading" element-loading-background="rgba(255, 255, 255, 0.7)">
    <el-row>
      <el-col :span="4" style="padding-top: 12px;"><div class="filesHeading">Files</div></el-col>
    </el-row>
    <el-row :gutter="10" class="filesContainer">
      <el-col :xs="8" :sm="8" :md="6" :lg="4" :xl="4" style="outline: none; margin-top: 18px;">
        <input type="file" ref="fileSelect" style="display: none" v-on:change="handleFileUpload()">
        <el-card class="newFileBtn" :body-style="{ padding: '0px' }" shadow="hover" @click.native="handleFileBtnClick()">
          <el-col :span="5" class="iconContainer">
            <i class="material-icons grey" style="line-height: 1.7">cloud_upload</i>
          </el-col>
          <el-col :span="19" class="fileNameContainer">
            <div class="fileName grey">Upload New File<span class="subtext">( upto 100MB )</span></div>
          </el-col>
        </el-card>
      </el-col>
      <div v-if="!noFiles">
        <transition-group name="fade-transform" mode="out-in">
          <el-col :xs="8" :sm="8" :md="6" :lg="4" :xl="4" v-for="(file, index) in files" :key="index" style="outline: none;" class="cardContainer">
            <el-card v-if="!file.fuploading" :body-style="{ padding: '0px' }" class="fileOptions" shadow="never">
              <el-col :span="15" style="padding-top: 8px; text-align: left">{{ file.size | sizeFilter }} | {{ file.addDate | moment("Do MMM YY") }}</el-col>
              <el-col :span="9"><el-button @click="handleDelete(file._id, file.name, file.size, file.uri, index)" class="secondaryBtn" style="padding: 0px; padding-top: 9px; font-size: 12px;" icon="el-icon-delete">Delete</el-button></el-col>
            </el-card>
            <el-card :body-style="{ padding: '0px' }" @click.native="handleFileDownload(file._id, file.name, file.size, file.uri, index)">
              <el-col :span="5" class="iconContainer">
                <span class='fiv-sqo image' :class="['fiv-icon-' + file.fileIconType]"></span>
              </el-col>
              <el-col :span="19" class="fileNameContainer">
                <transition name="fade-transform" mode="out-in">
                  <el-progress v-if="file.fuploading" class="uploadProgress" :percentage="upPercentage" :color="uploadColor"></el-progress>
                  <el-progress v-else-if="file.fdownloading" class="downloadProgress" :percentage="downPercentage" :color="uploadColor"></el-progress>
                  <div v-else class="fileName">{{ file.name }}</div>
                </transition>
              </el-col>
            </el-card>
          </el-col>
        </transition-group>
      </div>
    </el-row>
  </div>
</template>

<script>
import icons from '../assets/icons.json'
import { dbFetch, dbInsert, dbRemove } from '../api/db'
const Uploader = require('../../../node_modules/newfang/newfang_uploader').default
const Downloader = require('../../../node_modules/newfang/newfang_downloader').default
const Utils = require('../../../node_modules/newfang/newfang_utils').default
const path = require('path')

export default {
  components: {
  },
  data () {
    return {
      noFiles: true,
      files: [],
      loading: true,
      uploadColor: '#00a8ff',
      uploading: false,
      downloading: false,
      uploadComplete: true,
      upPercentage: 0,
      downPercentage: 0,
      newFileName: '',
      fileIcons: icons,
      activeFileIcon: 'blank',
      uid: '',
      curFolder: '',
      rpc: null,
      api: null,
      userAPI: null,
      adminAPI: null,
      nodes: ['newfangnode1', 'newfangnode2', 'newfangnode3'],
      fworking: false
    }
  },
  filters: {
    sizeFilter (value) {
      return (value / 1000000).toFixed(2) + 'MB'
    }
  },
  computed: {
  },
  methods: {
    getFileMeta (file, fileExt) {
      var fileIconType = 'blank'
      if (fileExt === undefined) {
        var index = file.name.lastIndexOf('.')
        fileExt = file.name.substr(index + 1)
      } else {
        fileIconType = this.findIcon(fileExt)
        if (fileIconType.length === 0) {
          fileIconType = 'blank'
        } else {
          fileIconType = fileIconType[0]
        }
      }
      return { fileExt, fileIconType }
    },

    findIcon (type) {
      return this.fileIcons.filter(
        function (data) {
          return (data === type)
        }
      )
    },

    showMsgBox (type, message) {
      this.$message({
        type: type,
        message: message,
        duration: 5000
      })
    },

    getFiles () {
      const params = { uid: this.uid, type: 'file', parentId: this.curFolder }
      const sort = { addDate: -1 }
      dbFetch(params, sort, (err, res) => {
        this.loading = false
        if (err === null) {
          if (res.length > 0) {
            this.noFiles = false
            this.files = res
          } else {
            this.noFiles = true
          }
        }
      })
    },

    handleFileBtnClick () {
      if (!this.uploading && !this.downloading && !this.fworking) {
        this.$refs.fileSelect.click()
      } else {
        this.showMsgBox('error', 'Work in progress. Please wait.')
      }
    },

    handleFileUpload () {
      const file = this.$refs.fileSelect.files[0]
      if (file !== undefined) {
        if (file.size > 100000000) {
          this.showMsgBox('error', 'File size cannot exceed 100MB')
        } else if (Number(file.size) + Number(localStorage.getItem('sUsage')) > localStorage.getItem('sCap')) {
          this.showMsgBox('error', 'File size cannot exceed your Storage Cap(' + localStorage.getItem('sCap') / 1000000000 + 'GB)')
        } else {
          this.uploading = true
          this.$root.$emit('working')
          this.uploadComplete = false
          var fileExt = file.type.split('/')[1]
          let { fileType, fileIconType } = this.getFileMeta(file, fileExt)
          this.activeFileIcon = fileIconType
          if (this.files.length === 0) {
            this.noFiles = false
            this.files[0] = {fileIconType: fileIconType, name: file.name, fuploading: true, fdownloading: false}
          } else {
            this.files.unshift({fileIconType: fileIconType, name: file.name, fuploading: true, fdownloading: false})
          }

          const convergence = localStorage.getItem('convergence')
          const uploader = new Uploader({ filePath: file.path, convergence: convergence }, { pure: false })
          const uploadParams = uploader.get_encoding_params()

          uploader.on('upload_complete', (uri) => {
            console.log('upload complete: ', uri)
            this.newFileName = file.name
            var newFile = {
              name: file.name,
              uid: localStorage.getItem('uid'),
              addDate: new Date(),
              type: 'file',
              parentId: this.curFolder,
              size: file.size,
              uri: uri,
              fileType: fileType,
              fileIconType: fileIconType,
              fuploading: false,
              fdownloading: false
            }
            dbInsert(newFile, (err, res) => {
              if (err === null) {
                this.showMsgBox('success', 'Successfully uploaded file - ' + file.name)
                this.files[0].fuploading = false
                this.files[0].fdownloading = false
                this.files[0]._id = res._id
                this.files[0].size = res.size
                this.files[0].uri = res.uri
                this.files[0].addDate = res.addDate
                this.uploadComplete = true
                this.uploading = false
                this.$root.$emit('idle')
                this.upPercentage = 0
                this.$refs.fileSelect.value = ''
              }
            })
            this.$root.$emit('uploadedFile', file.size * (uploadParams.n / uploadParams.k))
          })

          uploader.on('error', (e) => {
            console.log({e})
            this.uploading = false
            this.$root.$emit('idle')
          })

          uploader.on('upload_progress', (percentage) => {
            console.log('upload progress: ', percentage + '%')
            this.upPercentage = parseFloat(percentage.toFixed(1))
          })

          uploader.start_upload()
        }
      } else {
        this.showMsgBox('info', 'File upload aborted')
      }
    },

    handleFileDownload (id, name, size, uri, index) {
      if (!this.downloading && !this.uploading && !this.fworking) {
        if ((Number(size) + Number(localStorage.getItem('bUsage'))) > localStorage.getItem('bCap')) {
          this.showMsgBox('error', 'Download file size cannot exceed your Bandwidth Cap(' + localStorage.getItem('bCap') / 1000000000 + 'GB)')
        } else {
          this.$confirm('File name: <strong>' + name + '</strong><br/>File size: <strong>' + (size / 1000000).toFixed(2) + ' MB</strong>', 'Confirm Download', {
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            dangerouslyUseHTMLString: true
          }).then(() => {
            this.downPercentage = 0
            this.downloading = true
            this.$root.$emit('working')
            const { dialog } = require('electron').remote
            const res = dialog.showSaveDialog({
              defaultPath: name
            })

            const savePath = path.dirname(res)
            this.files[index].fdownloading = true

            const downloader = new Downloader(String(uri), {
              downloadPath: savePath,
              type: 'stream',
              pure: false
            })

            downloader.on('download_progress', (percentage) => {
              console.log('download progress: ', percentage + '%')
              this.downPercentage = parseFloat(percentage.toFixed(1))
            })

            downloader.on('download_complete', () => {
              console.log('download complete')
              this.files[index].fdownloading = false
              this.$root.$emit('downloadedFile', size)
              this.showMsgBox('success', 'Successfully downloaded file - ' + name)
              this.downloading = false
              this.$root.$emit('idle')
            })

            const saveFileName = path.basename(res)
            downloader.start_download(String(saveFileName))
          }).catch(() => {
            this.showMsgBox('info', 'File Download cancelled')
            this.downloading = false
          })
        }
      } else {
        this.showMsgBox('error', 'Work in progress. Please wait.')
      }
    },

    handleDelete (id, name, size, uri, index) {
      if (!this.downloading && !this.uploading && !this.fworking) {
        this.$confirm('This will permanently delete the file. Continue?', 'Confirm', {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          const convergence = localStorage.getItem('convergence')
          const uploadParams = {
            k: uri.split(':')[4],
            n: uri.split(':')[5]
          }

          const util = new Utils({
            convergence: convergence,
            uri: uri,
            pure: false
          })
          util.start_delete((err, data) => {
            if (err) {
              this.$message({
                type: 'error',
                message: 'Delete unsuccessful. Please try again.'
              })
            } else {
              dbRemove(id, (err, res) => {
                if (!err) {
                  this.files.splice(index, 1)
                  this.$message({
                    type: 'success',
                    message: 'Delete successful'
                  })
                  this.$root.$emit('removedFile', size * (uploadParams.n / uploadParams.k))
                }
              })
            }
          })
        }).catch((e) => {
          console.log(e)
          this.$message({
            type: 'info',
            message: 'Delete cancelled'
          })
        })
      } else {
        this.showMsgBox('error', 'Work in progress. Please wait.')
      }
    },

    makeReqId (length) {
      var result = ''
      var characters = 'abcdefghijklmnopqrstuvwxyz12345'
      var charactersLength = characters.length
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
    }
  },
  mounted () {
    this.uid = localStorage.getItem('uid')
    this.curFolder = this.$route.params.fid
    this.getFiles()
    this.$root.$on('fworking', () => {
      this.fworking = true
    })
    this.$root.$on('fidle', () => {
      this.fworking = false
    })
  }
}
</script>

<style lang="scss" scoped>
.el-card {
  outline: none !important;
}

.loading {
  height: 100%;
}

.noFiles {
  text-align: center;
  color: #888;
}

.material-icons.grey {
  color: rgba(136, 136, 136, 0.7);
}

.newFileBtn {
  background: none;
  border: 1px dashed #888;
}

.filesContainer {
  padding: 0px 16px 18px 16px;
}

.filesHeading {
  color: #888;
  margin-left: 12px;
  display: inline-block;
  font-size: 20px;
  font-weight: 200;
}

.el-card {
  text-align: center;
  cursor: pointer;
  position: relative;
  z-index: 10;
}

.cardContainer {
  position: relative;
  margin-top: 18px;
  margin-bottom: 18px;
}

.fileOptions {
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

.cardContainer:hover .fileOptions {
  // display: block;
  // opacity: 1;
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
  display: table;
}

.subtext {
  font-size: 8px;
  padding-left: 2px;
  display: table-cell;
  vertical-align: middle;
}

.uploadProgress, .downloadProgress {
  height: 40px;
  line-height: 36px;
  text-align: left;
  padding-left: 6px;
}
</style>
