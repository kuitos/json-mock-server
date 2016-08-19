/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2015-12-01
 */

var proxy = require('express-http-proxy');
var url = require('url')
var assign = require('object-assign');

module.exports = function(proxyHost, proxyPort, otherOptions) {

	return proxy(proxyHost, assign({
		forwardPath: function(req, res) {
			console.log('%s %s is redirecting to %s:%s', req.method, req.originalUrl, proxyHost, proxyPort);
			return url.parse(req.originalUrl).path;
		},

		port: proxyPort
	}, otherOptions))

};