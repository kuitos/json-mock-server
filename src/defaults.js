var fs = require('fs')
var express = require('express')
var logger = require('morgan')
var cors = require('cors')
var errorhandler = require('errorhandler')

var arr = []

// Logger
arr.push(logger('dev', {
  skip: function(req, res) { return req.path === '/favicon.ico' }
}))

// CORS
arr.push(cors({ origin: true, credentials: true }))

if (process.env.NODE_ENV === 'development') {
  // only use in development
  arr.push(errorhandler())
}

module.exports = arr