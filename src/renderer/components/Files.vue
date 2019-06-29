<template>
  <div class="loading" v-loading="loading" element-loading-background="rgba(255, 255, 255, 0.7)">
    <el-row>
      <el-col :span="4" style="padding-top: 12px; padding-bottom: 12px;"><div class="filesHeading">Files</div></el-col>
    </el-row>
    <el-row :gutter="20" class="filesContainer">
      <el-col :span="4" style="outline: none;">
        <input type="file" ref="fileSelect" style="display: none" multiple=false v-on:change="handleFileSelect()">
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
          <el-col :span="4" v-for="(file, index) in files" :key="index" style="outline: none;">
            <el-tooltip placement="bottom">
              <div slot="content">{{ file.name }}<br/>{{ file.addDate | moment('Do MMMM YYYY, h:mm:ss a') }}</div>
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
            </el-tooltip>
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
  computed: {
  },
  methods: {
    getFiles () {
      const self = this
      self.$db.find({ uid: self.uid, type: 'file', parentId: self.curFolder }).sort({ addDate: -1 }).exec(function (err, docs) {
        self.loading = false
        if (!err) {
          if (docs.length > 0) {
            self.noFiles = false
            self.files = docs
            console.log(self.files)
          } else {
            self.noFiles = true
          }
        }
      })
    },

    handleFileBtnClick () {
      if (!this.uploading) {
        this.$refs.fileSelect.click()
      } else {
        this.$message({
          type: 'error',
          message: 'Upload in progress. Please wait.'
        })
      }
    },

    findIcon (type) {
      return this.fileIcons.filter(
        function (data) {
          return (data === type)
        }
      )
    },

    async handleFileSelect () {
      const file = this.$refs.fileSelect.files[0]
      if (file !== undefined) {
        if (file.size > 100000000) {
          this.$message({
            type: 'error',
            message: 'File size cannot exceed 100MB',
            duration: 6000
          })
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

          const res = await this.rpc.get_table_rows({
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
          const nodeName = res.rows[0].node_name
          console.log(nodeName)

          const reqId = this.makeReqId(12)

          await this.api.transact({
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
                file_size: file.size,
                request_type: 'upload'
              }
            }]
          }, {
            blocksBehind: 3,
            expireSeconds: 30
          }).then(function () {
          }).catch(function (err) {
            console.log(err)
          })

          const uploader = new Uploader({ filePath: file.path }, {
            convergence,
            k: 1,
            happy: 3,
            n: 3
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
            const self = this
            self.$db.insert(newFile, async function (err, newDoc) {
              if (!err) {
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
                      work_bytes: [Number(file.size), Number(file.size), Number(file.size)]
                    }
                  }]
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30
                }).then(function () {
                }).catch(function (err) {
                  console.log(err)
                })
                self.$message({
                  type: 'success',
                  message: 'Successfully uploaded file - ' + file.name,
                  duration: 5000
                })
                // setTimeout(self.uploadComp, 2000)
                self.files[0].fuploading = false
                self.files[0].fdownloading = false
                self.files[0]._id = newDoc._id
                self.files[0].size = newDoc.size
                self.files[0].uri = newDoc.uri
                console.log(self.files)
                self.uploadComplete = true
                self.uploading = false
                self.upPercentage = 0
              }
            })

            const fileSize = file.size * 3
            self.$root.$emit('uploadedFile', fileSize)
          })

          uploader.on('upload_progress', (percentage) => {
            console.log('upload progress: ', percentage + '%')
            this.upPercentage = parseFloat(percentage.toFixed(1))
          })

          uploader.start_upload()
        }
      } else {
        console.log('cancelled')
        this.$message({
          type: 'info',
          message: 'File upload aborted'
        })
      }
    },

    async handleFileDownload (id, name, size, uri, index) {
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
  margin-top: 10px !important;
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
