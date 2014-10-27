'use strict';

var tessel = require('tessel');
var script = require.resolve('../../device');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var TesselAmbientTrigger = function(io){

	//------------------------------
	// Private Vars
	//------------------------------

	var io = io;
	var _self = this;
	var deviceConnected = false;
	var deviceErr = null;
	var _training = 0;
	var _trainedValues = [];
	var _mean;
	var soundLevel = null;	
	var deviceOptions = {
		stop:true,
		//serial number ('undeveind' picks the first one);
		serial:process.env.TESSEL_SERIAL
	}

	var tesselDevice;

	console.log('tesselAmbient constructor');

	//------------------------------
	// initializaiton
	//------------------------------

	function init(){
		_self.connect();
	}


	function listen(){

	    	initDeviceStdIo();

			// `device.on('message', function (msg) { ... })` receives an event
		    // when an object is received from Tessel.

		    tesselDevice.on('message', handleMessage);  

	}

	function initDeviceStdIo(){
		tesselDevice.stdout.resume();
    	tesselDevice.stdout.pipe(process.stdout);
    	tesselDevice.stderr.resume();
    	tesselDevice.stderr.pipe(process.stderr);
	}

	function _connect(callback){

		//console.log('_connect', deviceOptions, tessel);
		try {
			tessel.findTessel(deviceOptions, function(err, device){

				console.log('on_connect', err, device);

				if(err){ 
					handleConnectError(err);
					if(callback) { callback(err, false); }
					//throw err;
				}else{
					deviceConnected = true;
					tesselDevice = device;
				}

				// Once we've found a Tessel, we tell it to run our script. _self works just
			    tesselDevice.run(script, [], {}, listen);

			    // Exit cleanly on Ctrl+C.
			    process.on('SIGINT', function(){
			    	tesselDevice.stop();

			    	setTimeout(function () {
			          // But if that fails, just exit
			          console.log('Script aborted');
			          process.exit(131);
			        }, 200);

			    });

			    // When the script on Tessel exits, shut down
				// USB communications and exit
				tesselDevice.once('script-stop', function (code) {
					tesselDevice.close(function () {
						process.exit(code);
					});
				});

				handleConnect();
				if(callback) { callback(null, true); }
			});
		} catch(e){
			console.log('connect err', e);
		}
	}

	//------------------------------
	// Public Methods
	//------------------------------

	console.log('tesselAmbient conncet', _self);

	_self.connect = function(callback){

		if(!deviceConnected && !deviceErr){
			_connect(callback);
		}else if(deviceErr){
			callback(deviceErr, false);
		}else{
			if(callback) { callback(null, true); } 
		}

	}

	//------------------------------
	// Getters/Setters
	//------------------------------

	_self.isConnected = function(){
		return deviceConnected;
	}

	//------------------------------
	// Events
	//------------------------------

	function handleConnect(){
		deviceConnected = true;
		console.log('deviceConnect');
		io.emit('deviceConnect', true);
	}

	function handleConnectError(err){
		deviceErr = err;
		console.log('deviceConnectError');
		io.emit('deviceConnectError', err);
	}

	function handleMessage(message){
		switch(message.type){
			case 'trigger':
				handleTrigger(message.data);
				break;
			case 'soundLevel':
				handleSoundLevel(message.data);
				break;
			case 'soundLevelError':
				handleSoundError(message.err);
				break;
			case 'moduleError':
				handleModuleError(message.err);
				break;
			default:
				console.log('device message', message);
				break;
		}
	}

	function handleTrigger(data){
		io.emit('trigger', data);
	}

	function handleSpike(data){
		console.log('spike', io);
		io.sockets.emit('spike', data);
	}

	function handleSoundLevel(data){
		soundLevel = data;
		if(_training < 20){
			_trainedValues.push(data);
			_training++;
		}else if(_training == 20){

			
			_training++;

			var _trainingSum = 0;
			for(var i = 0; i<_trainedValues.length; i++){
				_trainingSum+=_trainedValues[i];
			}

			_mean = _trainingSum/_trainedValues.length;

			console.log('trained', _mean, _trainedValues);

		}else{

			if(data > _mean && (data-_mean > 0.001)){
				handleSpike(data);
			}

		}

		io.emit('soundLevel', data);
	}

	function handleSoundError(err){
		io.emit('soundLevelError', err);
	}

	function handleModuleError(err){
		io.emit('moduleError', err);
	}

	//------------------------------
	// Startup
	//------------------------------

	init();

}

console.log('tesselAmbient');

module.exports = function(io){ return new TesselAmbientTrigger(io) };
