// import userDB from './userData'
import fileDB from '../fileData'

const dbFetch = function (params, sort, callback) {
  fileDB.find(params).sort(sort).exec(function (err, docs) {
    if (!err) {
      callback(null, docs)
    } else {
      callback(err)
    }
  })
}

const dbInsert = function (doc, callback) {
  fileDB.insert(doc, function (err, newDoc) {
    if (!err) {
      callback(null, newDoc)
    } else {
      callback(err)
    }
  })
}

export { dbFetch, dbInsert }
