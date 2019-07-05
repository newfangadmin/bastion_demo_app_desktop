<template>
  <div class="loading" v-loading="loading" element-loading-background="rgba(255, 255, 255, 0.7)">
    <el-row>
      <el-col :span="4" style="padding-top: 12px;"><div class="filesHeading">Files</div></el-col>
    </el-row>
    <el-row :gutter="20" class="filesContainer">
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
            <el-card :body-style="{ padding: '0px' }" class="fileOptions" shadow="never">
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
import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import { dbFetch, dbInsert } from '../api/db'
const Uploader = require('../../../node_modules/newfang/dist/Uploader').default
const Downloader = require('../../../node_modules/newfang/dist/Downloader').default
const convergence = Uploader.generate_convergence()

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
      nodes: ['newfangnode1', 'newfangnode2', 'newfangnode3']
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
      if (!this.uploading) {
        this.$refs.fileSelect.click()
      } else {
        this.showMsgBox('error', 'Upload in progress. Please wait.')
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
          this.uploadComplete = false

          var fileType = file.type.split('/')[1]
          var fileIconType = 'blank'
          if (fileType === undefined) {
            var index = file.name.lastIndexOf('.')
            fileType = file.name.substr(index + 1)
          } else {
            fileIconType = this.findIcon(fileType)
            if (fileIconType.length === 0) {
              fileIconType = 'blank'
            } else {
              fileIconType = fileIconType[0]
            }
          }
          this.activeFileIcon = fileIconType
          if (this.files.length === 0) {
            this.noFiles = false
            this.files[0] = {fileIconType: fileIconType, name: file.name, fuploading: true, fdownloading: false}
          } else {
            this.files.unshift({fileIconType: fileIconType, name: file.name, fuploading: true, fdownloading: false})
          }

          const uploader = new Uploader({ filePath: file.path }, {
            convergence,
            k: 1,
            happy: 3,
            n: 3,
            appId: 'bastionapp11',
            userName: 'bastiondev11'
          })

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
                this.upPercentage = 0
              }
            })
            this.$root.$emit('uploadedFile', file.size * 3)
          })

          uploader.on('upload_progress', (percentage) => {
            console.log('upload progress: ', percentage + '%')
            this.upPercentage = parseFloat(percentage.toFixed(1))
          })

          uploader.start_upload()
        }
      } else {
        console.log('cancelled')
        this.showMsgBox('info', 'File upload aborted')
      }
    },

    async handleFileDownload (id, name, size, uri, index) {
      if ((size + localStorage.getItem('bUsage')) > localStorage.getItem('bCap')) {
        this.$message({
          type: 'error',
          message: 'Download file size cannot exceed your Bandwidth Cap(' + localStorage.getItem('bCap') / 1000000000 + 'GB)',
          duration: 6000
        })
      } else {
        const self = this
        this.$confirm('File name: <strong>' + name + '</strong><br/>File size: <strong>' + (size / 1000000).toFixed(4) + ' MB</strong>', 'Confirm Download', {
          confirmButtonText: 'Yes',
          cancelButtonText: 'Cancel',
          dangerouslyUseHTMLString: true
        }).then(async function ({ value }) {
          const { dialog } = require('electron').remote
          const res = dialog.showSaveDialog({
            defaultPath: name
          })

          const savePath = res.split('/').slice(0, -1).join('/')
          self.files[index].fdownloading = true

          const res1 = await self.rpc.get_table_rows({
            json: true,
            code: 'nebuloustest',
            scope: 'nebuloustest',
            table: 'nodestaba',
            table_key: 'node_qlength',
            index_position: 2,
            key_type: 'i64',
            limit: 1,
            reverse: false,
            show_payer: false
          })
          const nodeName = res1.rows[0].node_name
          const nodeIP = res1.rows[0].node_ip

          const reqId = self.makeReqId(12)

          await self.api.transact({
            actions: [{
              account: 'nebuloustest',
              name: 'initrequest',
              authorization: [{
                actor: 'nebuloustest',
                permission: 'active'
              }],
              data: {
                request_id: reqId,
                user_name: 'bastiondev11',
                app_name: 'bastionapp11',
                node_name: nodeName,
                file_id: 'file123',
                file_size: size,
                request_type: 'download'
              }
            }]
          }, {
            blocksBehind: 3,
            expireSeconds: 30
          }).then(function () {
          }).catch(function (err) {
            console.log(err)
          })
          const downloader = new Downloader(String(uri), {
            downloadPath: savePath,
            type: 'Download',
            helperUri: nodeIP
          })

          downloader.on('download_complete', async function () {
            console.log('download complete')
            await self.api.transact({
              actions: [{
                account: 'nebuloustest',
                name: 'closerequest',
                authorization: [{
                  actor: 'nebuloustest',
                  permission: 'active'
                }],
                data: {
                  user_name: 'bastiondev11',
                  app_name: 'bastionapp11',
                  request_id: reqId,
                  work_nodes: self.nodes,
                  work_bytes: [Number(size) / 3, Number(size) / 3, Number(size) / 3]
                }
              }]
            }, {
              blocksBehind: 3,
              expireSeconds: 30
            }).then(function () {
            }).catch(function (err) {
              console.log(err)
            })

            self.files[index].fdownloading = false
            self.downPercentage = 0
            self.$root.$emit('downloadedFile', size)
            self.$message({
              type: 'success',
              message: 'Successfully downloaded file - ' + name,
              duration: 5000
            })
          })

          downloader.on('download_progress', (percentage) => {
            console.log('download progress: ', percentage + '%')
            self.downPercentage = parseFloat(percentage.toFixed(1))
          })

          downloader.download(String(name))
        }).catch(() => {
          this.$message({
            type: 'info',
            message: 'File Download cancelled'
          })
        })
      }
    },

    handleDelete (id, name, size, uri) {
      this.$confirm('This will permanently delete the file. Continue?', 'Confirm', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: 'Delete completed'
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: 'Delete canceled'
        })
      })
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
    this.rpc = new JsonRpc('https://jungle2.cryptolions.io:443')
    const rpc = this.rpc
    // const privateKeyUser = '5Jwx6dwGmvuefoLwmRHw2cpgm53i3Qn1Foy71YtxSX9NCzuT3on'
    const privateKeyAdmin = '5JbaLfb7FMvSyogGuSgJhxLhNw26j5DjhC3EnUxsN9HfyBsdvgS'
    // const signatureProvider = new JsSignatureProvider([privateKeyUser])
    const signatureProvider = new JsSignatureProvider([privateKeyAdmin])
    this.api = new Api({ rpc, signatureProvider })
    // this.adminAPI = new Api({ rpc, signatureProvider2 })
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
