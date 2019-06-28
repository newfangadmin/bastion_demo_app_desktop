<template>
  <div class="loading" v-loading="loading" element-loading-background="rgba(255, 255, 255, 0.7)">
    <el-row>
      <el-col :span="4" style="padding-top: 12px; padding-bottom: 12px;"><div class="filesHeading">Files</div></el-col>
    </el-row>
    <el-row :gutter="20" class="filesContainer">
      <el-col :span="4">
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
          <el-col :span="4" v-for="(file, index) in files" :key="index">
            <el-tooltip placement="bottom">
              <div slot="content">{{ file.name }}<br/>{{ file.addDate | moment('Do MMMM YYYY, h:mm:ss a') }}</div>
              <el-card :body-style="{ padding: '0px' }" @click.native="handleFileDownload(file._id, file.name, file.size, file.uri)">
                <el-col :span="5" class="iconContainer">
                  <span class='fiv-sqo image' :class="['fiv-icon-' + file.fileIconType]"></span>
                </el-col>
                <el-col :span="19" class="fileNameContainer">
                  <transition name="fade-transform" mode="out-in">
                    <el-progress v-if="file.fuploading" class="uploadProgress" :percentage="upPercentage" :color="uploadColor"></el-progress>
                    <div v-if="!file.fuploading" class="fileName">{{ file.name }}</div>
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
// import { setTimeout } from 'timers'
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
      newFileName: '',
      fileIcons: icons,
      activeFileIcon: 'blank',
      uid: '',
      curFolder: ''
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

    handleFileSelect () {
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
            this.files[0] = {fileIconType: fileIconType, name: file.name, fuploading: true}
          } else {
            this.files.unshift({fileIconType: fileIconType, name: file.name, fuploading: true})
          }

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
              fuploading: false
            }
            const self = this
            self.$db.insert(newFile, function (err, newDoc) {
              if (!err) {
                // self.getFolders()
                self.$message({
                  type: 'success',
                  message: 'Successfully uploaded file with name - ' + file.name
                })
                // setTimeout(self.uploadComp, 2000)
                self.files[0].fuploading = false
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

    handleFileDownload (id, name, size, uri) {
      this.$confirm('File name: <strong>' + name + '</strong><br/>File size: <strong>' + (size / 1000000).toFixed(4) + ' MB</strong>', 'Confirm Download', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        dangerouslyUseHTMLString: true
      }).then(({ value }) => {
        console.log(uri)
        const downloader = new Downloader(uri, {
          downloadPath: '/Users/mayur/Downloads',
          type: 'Download',
          helperUri: '139.59.3.234'
        })

        downloader.on('download_complete', () => {
          console.log('download complete')
          // inform your app
          self.$root.$emit('downloadedFile', size)
        })

        downloader.on('download_progress', (percentage) => {
          console.log('download progress: ', percentage + '%')
          // inform your app
        })

        console.log(String(name))

        downloader.download(String(name))
      }).catch(() => {
        this.$message({
          type: 'info',
          message: 'File Download cancelled'
        })
      })
    }
  },
  mounted () {
    this.uid = localStorage.getItem('uid')
    this.curFolder = this.$route.params.fid
    this.getFiles()
  }
}
</script>

<style lang="scss" scoped>
.el-card {
  margin-top: 10px !important
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

.uploadProgress {
  height: 40px;
  line-height: 36px;
  text-align: left;
  padding-left: 6px;
}
</style>
