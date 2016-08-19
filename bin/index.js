#!/usr/bin/env node
var updateNotifier = require('update-notifier')
var _db = require('underscore-db')
var yargs = require('yargs')
var chalk = require('chalk')
var got = require('got')
var pkg = require('../package.json')
var jsonServer = require('../src')
var fs = require('fs')

updateNotifier({packageName: pkg.name, packageVersion: pkg.version}).notify()

// Parse arguments
var argv = yargs
	.usage('$0 <source>')
	.help('help').alias('help', 'h')
	.version(pkg.version, 'version').alias('version', 'v')
	.options({
		port: {
			alias: 'p',
			description: 'Set port',
			default: 3000
		},
		host: {
			alias: 'H',
			description: 'Set host',
			default: '0.0.0.0'
		},
		'static': {
			alias: 's',
			description: 'Set static file server directory',
			default: 'public'
		},
		'context': {
			alias: 'c',
			description: 'Set static file server context',
			default: '/'
		},
		'api-prefix': {
			alias: 'ap',
			description: 'Set your rest api prefix',
			default: ''
		},
		'proxy-host': {
			alias: 'ph',
			description: 'Set proxy server host',
			default: ''
		},
		'proxy-port': {
			alias: 'pp',
			description: 'Set proxy server port'
		},
		'limit': {
			alias: 'l',
			description: 'body entity limit(mb)'
		}
	})
	.example('$0 db.json', '')
	.example('$0 file.js', '')
	.example('$0 http://example.com/db.json', '')
	//.require(1, 'Missing <source> argument')
	.argv

if (!argv._[0]) {

	if (argv['proxy-host'] || argv['proxy-port']) {
		if (!argv['proxy-port']) {
			yargs.require(1, 'Missing proxy-port argument').argv
		}

		if (!argv['proxy-host']) {
			yargs.require(1, 'Missing proxy-host argument').argv
		}

	} else {
		yargs.require(1, 'Missing <source> argument').argv
	}
}

// Start server function
function start(object, filename) {
	var port = process.env.PORT || argv.port
	var hostname = argv.host === '0.0.0.0' ? 'localhost' : argv.host
	var apiPrefix = argv['api-prefix'] || ''

	for (var prop in object) {
		console.log(chalk.gray('  http://' + hostname + ':' + port + '/') + chalk.cyan(prop))
	}

	console.log(
		'\nYou can now go to ' + chalk.gray('http://' + hostname + ':' + port + '/\n')
	)

	console.log(
		'Enter ' + chalk.cyan('`s`') + ' at any time to create a snapshot of the db\n'
	)

	process.stdin.resume()
	process.stdin.setEncoding('utf8')
	process.stdin.on('data', function (chunk) {
		if (chunk.trim().toLowerCase() === 's') {
			var file = 'db-' + Date.now() + '.json'
			_db.save(object, file)
			console.log('\nSaved snapshot to ' + chalk.cyan(file) + '\n')
		}
	})

	if (filename) {
		var router = jsonServer.router(apiPrefix, filename)
	} else {
		var router = jsonServer.router(apiPrefix, object)
	}

	var server = jsonServer.create()

	// Serve static files
	var staticDir = argv.static || 'public'
	if (fs.existsSync(process.cwd() + staticDir)) {
		staticDir = process.cwd() + staticDir
	} else {
		staticDir = __dirname + staticDir
	}

	server.use(argv['context'] || '/', jsonServer.defaults({static: staticDir}))

	// if u has config proxy host, use proxy server to power your api
	// else we use db.json to mock api
	if (argv['proxy-host']) {

		if (!argv['proxy-port']) {
			throw new Error('pls config proxy host port');
		} else {

			var proxyServer = jsonServer.proxy(argv['proxy-host'], argv['proxy-port'], {
				limit: argv['limit']
			});

			if (apiPrefix.trim()) {
				server.use(apiPrefix + '/**', proxyServer);
			} else {
				server.use(jsonServer.NON_STATIC_FILE, proxyServer);
			}

		}

	} else {
		server.use(router)
	}

	server.listen(port, argv.host)
}

// Set file and port
var source = argv._[0]

// Say hi, load file and start server
console.log(chalk.cyan('{^_^} Hi!\n'))
console.log('Loading database from ' + chalk.cyan(source))

if (/\.json$/.test(source)) {
	var filename = process.cwd() + '/' + source
	var object = require(filename)
	start(object, filename)
}

if (/\.js$/.test(source)) {
	var object = require(process.cwd() + '/' + source)()
	start(object)
}

if (/^http/.test(source)) {
	got(source, function (err, data) {
		if (err) throw err
		var object = JSON.parse(data)
		start(object)
	})
}

if (!source) {
	start({})
}
