'use strict';

var tessel = require('tessel');
var ambient = require('ambient-attx4').use(tessel.port.A);

ambient.on('ready', function () {
 
  // // Set a sound level trigger
  // // The trigger is a float between 0 and 1
  ambient.setSoundTrigger(0.0135);
  ambient.on('sound-trigger', function(data) {
      process.send({type:'trigger', data:data});
  });
      
    

  //   // Clear it
  //   ambient.clearSoundTrigger();

  //   //After 1.5 seconds reset sound trigger
  //   setTimeout(function () {

  //       ambient.setSoundTrigger(0.15);

  //   },500);

  // });

  setInterval(function(){

    ambient.getSoundLevel(function(err, data){

      if(!err){
        process.send({type:'soundLevel', data:data});
      }else{
        process.send({type:'soundLevelError', err:err});
      }

    });

  }, 300);
});

ambient.on('error', function (err) {
  process.send({type:'moduleError', err:err});
});
