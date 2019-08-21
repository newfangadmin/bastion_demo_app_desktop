<template>
  <div class="viewContainer loading" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <el-row class="loginContainer">
      <el-col :span="12" :offset="6" class="logoContainer">
        <img class="logo" src="~@/assets/logo.svg" />
      </el-col>
      <el-col :span="6" :offset="9" class="loginBtnContainer">
        Existing User?<span class="loginBtn"><el-button @click="handleLogin()" class="secondaryBtn">Login</el-button></span>
      </el-col>
      <el-col :span="6" :offset="9" class="formContainer">
        <el-form :model="ruleForm" status-icon :rules="rules" ref="ruleForm" class="demo-ruleForm">
          <el-form-item prop="first">
            <el-input type="text" placeholder="First Name" v-model="ruleForm.first" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item prop="last">
            <el-input type="text" placeholder="Last Name" v-model="ruleForm.last" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item
            prop="email"
            :rules="[
              { required: true, message: 'Please input email address', trigger: 'blur' },
              { type: 'email', message: 'Please input a valid email address', trigger: ['blur', 'change'] }
            ]"
          >
            <el-input placeholder="Email" v-model="ruleForm.email"></el-input>
          </el-form-item>
          <el-form-item prop="pass">
            <el-input type="password" placeholder="Password" v-model="ruleForm.pass" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item style="float: right;">
            <el-button @click="resetForm('ruleForm')" class="secondaryBtn">Reset</el-button>
            <el-button type="primary" @click="submitForm('ruleForm')">Signup</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>

<script>
const Uploader = require('../../../../node_modules/newfang/newfang_uploader').default

export default {
  components: {
  },
  data () {
    var validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please enter the password'))
      } else if (value !== this.ruleForm.pass) {
        callback(new Error('Password Mismatch'))
      } else {
        callback()
      }
    }
    var validateName = (rule, value, callback) => {
      if (value.trim() === '') {
        callback(new Error('Please enter a value'))
      } else {
        callback()
      }
    }
    return {
      ruleForm: {
        email: '',
        pass: '',
        first: '',
        last: ''
      },
      rules: {
        pass: [
          { validator: validatePass, trigger: 'blur' }
        ],
        first: [
          { validator: validateName, trigger: 'blur' },
          { max: 20, message: 'Length should not exceed 20 characters', trigger: 'blur' }
        ],
        last: [
          { validator: validateName, trigger: 'blur' },
          { max: 20, message: 'Length should not exceed 20 characters', trigger: 'blur' }
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
          const conv = Uploader.generate_convergence()
          var newuser = {
            firstName: this.ruleForm.first,
            lastName: this.ruleForm.last,
            email: this.ruleForm.email,
            pass: this.ruleForm.pass,
            addDate: new Date(),
            storageCap: 1000000000,
            bandwidthCap: 1000000000,
            sUsage: 0,
            bUsage: 0,
            convergence: conv
          }
          const self = this
          this.$udb.insert(newuser, function (err, newDoc) {
            if (!err) {
              var homeFolder = {
                name: 'home',
                uid: newDoc._id,
                addDate: new Date(),
                type: 'folder',
                parentId: 'null'
              }
              self.$db.insert(homeFolder, function (err, newDoc1) {
                if (!err) {
                  self.loading = false
                  self.$message({
                    type: 'success',
                    message: 'Signup successful! Proceed to Login.',
                    duration: 5000
                  })
                  self.$refs[formName].resetFields()
                }
              })
            } else {
              self.$message({
                type: 'error',
                message: 'Signup Failed! Please try again',
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

    handleLogin () {
      this.$router.push({name: 'Login'})
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

.loginBtnContainer {
  color: #888;
  border: 1px solid #888;
  border-radius: 6px;
  margin-top: 20px;
}
</style>
