/**
 * Module dependencies.
 */
var express = require('express'),
    fs = require('fs'),
    sio = require('socket.io');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

//Load configurations
//if test env, load example file
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('./config/config');


var app = express(),
    port = process.env.PORT || config.port,
    http = require('http'),
    server = http.createServer(app).listen(port),
    io = sio.listen(server),
    ambientSocket = require('./app/models/tesselAmbient.js')(io);
    

//express settings
require('./config/express')(app);

//Bootstrap routes
require('./config/routes')(app, io);

//Start the app by listening on <port>
console.log('Express app started on port ' + port);

//expose app
exports = module.exports = app;
