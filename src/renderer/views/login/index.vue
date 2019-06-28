<template>
  <div class="viewContainer loading" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <el-row class="loginContainer">
      <el-col :span="12" :offset="6" class="logoContainer">
        <img class="logo" src="~@/assets/logo.svg" />
      </el-col>
      <el-col :span="6" :offset="9" class="signupBtnContainer">
        New to Bastion?<span class="signupBtn"><el-button @click="handleSignup()" class="secondaryBtn">SignUp</el-button></span>
      </el-col>
      <el-col :span="6" :offset="9" class="formContainer">
        <el-form :model="ruleForm" status-icon :rules="rules" ref="ruleForm" class="demo-ruleForm">
          <el-form-item
            prop="email"
            :rules="[
              { required: true, message: 'Please input email address', trigger: 'blur' },
              { type: 'email', message: 'Please input correct email address', trigger: ['blur', 'change'] }
            ]"
          >
            <el-input placeholder="Email" v-model="ruleForm.email"></el-input>
          </el-form-item>
          <el-form-item prop="pass">
            <el-input type="password" placeholder="Password" v-model="ruleForm.pass" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item style="float: right;">
            <el-button @click="resetForm('ruleForm')" class="secondaryBtn">Reset</el-button>
            <el-button type="primary" @click="submitForm('ruleForm')">Login</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>

<script>

export default {
  components: {
  },
  data () {
    var validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please input the password'))
      } else if (value !== this.ruleForm.pass) {
        callback(new Error('Two inputs don\'t match!'))
      } else {
        callback()
      }
    }
    return {
      ruleForm: {
        email: 'test4@user.com',
        pass: '12345'
      },
      rules: {
        pass: [
          { validator: validatePass, trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  computed: {
  },
  methods: {
    submitForm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.loading = true
          const self = this
          this.$db.find({ email: this.ruleForm.email }, function (err, docs) {
            if (!err) {
              self.loading = false
              if (docs.length > 0) {
                if (docs[0].pass === self.ruleForm.pass) {
                  localStorage.setItem('uid', docs[0]._id)
                  self.$db.find({ uid: docs[0]._id, type: 'folder', parentId: 'null' }, function (err, docs1) {
                    if (!err) {
                      localStorage.setItem('curFolderId', docs1[0]._id)
                      localStorage.setItem('curFolderName', docs1[0].name)
                      self.$router.push({name: 'Home', params: {fid: docs1[0]._id, parentId: 'null'}})
                    }
                  })
                } else {
                  self.$message({
                    type: 'error',
                    message: 'Invalid Email or Password! Please try again',
                    duration: 5000
                  })
                }
              } else {
                self.$message({
                  type: 'error',
                  message: 'Invalid Email or Password! Please try again',
                  duration: 5000
                })
              }
            } else {
              self.loading = false
              self.$message({
                type: 'error',
                message: err,
                duration: 5000
              })
            }
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },

    resetForm (formName) {
      this.$refs[formName].resetFields()
    },

    handleSignup () {
      this.$router.push({name: 'Signup'})
    }
  },
  mounted () {
  }
}
</script>

<style lang="scss" scoped>
.viewContainer {
  height: 100vh;
  width: 100%;
  background: #222;
  display: table;
}

.loginContainer {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
}

.formContainer {
  color: #888;
  margin-top: 20px;
}

.signupBtnContainer {
  color: #888;
  border: 1px solid #888;
  border-radius: 6px;
  margin-top: 20px;
}
</style>
