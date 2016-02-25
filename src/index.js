var express = require('express')

module.exports = {
  create: function () {
    var server = express()
    server.set('json spaces', 2)
    return server
  },
  defaults: require('./defaults'),
  STATIC_FILES: /^(?!.*\.\w*(\?.*)?$).+$/,
  router: require('./router'),
  proxy: require('./proxy')
}