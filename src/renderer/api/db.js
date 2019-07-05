// import userDB from './userData'
import fileDB from '../fileData'

const fetch = function (params, sort) {
  fileDB.find(params).sort(sort).exec(function (err, docs) {
    console.log(params)
    if (!err) {
      return docs
    } else {
      return {
        err: err
      }
    }
  })
}

export default { fetch }
