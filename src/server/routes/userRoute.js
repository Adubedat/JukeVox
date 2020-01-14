'use strict'

const userController = require('../controller/userController')

module.exports = function (app) {
  app.route('/user')
    .all(function (req, res, next) {
      console.log("Hey ! I'm a happy Dadley")
      next()
    })
    .post(userController.createUser)
}
