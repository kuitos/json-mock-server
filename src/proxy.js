/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2015-12-01
 */

var proxy = require('express-http-proxy');
var url = require('url')

module.exports = function (proxyHost, proxyPort) {

  return proxy(proxyHost, {
    forwardPath: function (req, res) {
      return url.parse(req.originalUrl).path;
    },

    port: proxyPort
  })

};