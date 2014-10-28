jQuery(function($){

    //------------------------------------
    //  Properties
    //------------------------------------
    
    //services
    var socket;
    var _connectionstatus;
    var soundLevel = 0;

    var outputEl = $('#output');
    var videoEl = $('#video');
    var $player;
    var player;
    
    //controllers
    var actions = {
      remote:{
        'spike' : handleSpike,
        'moduleError' : handleModuleError,
        'handleSoundLevelError' : handleSoundLevelError,
        'soundLevel' : handleSoundLevel
      }
    }

    //------------------------------------
    //  Initialization
    //------------------------------------

      function init(){
        initVideo();
        bindSocket();
        bindWindow();
        resize();
      }

      function initVideo(){

        player = document.createElement('video');
        $player = $(player);

        $player.attr({
          src: './vid/demo.mov',
          autoPlay:false,
          controls:false,
          loop:false
        });


        $player.on('ended', handleVideoEnd);
        videoEl.append($player);

        $player.hide();

      }

    //------------------------------------
    //  Logic
    //------------------------------------

    /*
    * Establish Socket connection and fallbacks for errors
    */
    function bindSocket(pairid){
      
      socket = io.connect(SOCKET, {'force new connection': true, 'reconnect': false,'sync disconnect on unload': true,});
      socket.on("connecting", connecting);
      socket.on("connect", bindRemoteActions);
      socket.on("error", connectError);
      socket.on("connect_failed", connectFail);

    }

    function bindWindow(){

      $(window).on('resize', resize);
      $(window).on('keyup', function(evt){
          if(evt.keyCode == 32){
            handleSpacePress(evt);
          }
      });

    }

    /*
    * On connection listen for events broadcast from socket
    */
    function bindRemoteActions(){
      
      draw('connected');
      socket.on("disconnect", disconnect);
      socket.on("socket_invalid", connectError);
      $.each(actions.remote, registerRemoteAction);

    }

    function registerRemoteAction(path, action){
       socket.on(path, function(data){ action(data); });
    }

    //------------------------------------
    //  Control
    //------------------------------------

    /*
    * Connection Management
    */
    
    function connecting(){
       draw('connecting...');
    }

    function disconnect(){
      if(_connectionstatus != 'erred'){
        _connectionstatus = 'disconnected';
        draw('disconnected');
      }
    }

    function connectError(err){
      console.log(err);
      _connectionstatus = 'erred';
      draw('erred');
    }

    function connectFail(){
      _connectionstatus = 'failed';
      draw('failed')
    }

    function emit(event, data){
      console.log('emit :: ' + event + " : " + data);
      if(socket) socket.emit(event, data);
    }



    //------------------------------------
    //  View States
    //------------------------------------

    

    //-------------------------------------
    //  Render
    //-------------------------------------

    function draw(output){
      
      outputEl.html(output);

    }

    function resize(){
      var w = $(window).width();
      var h = $(window).height();

      outputEl.css({
        top: (h - outputEl.height())/2,
        left: (w - outputEl.width())/2,
      });

      videoEl.css({
        width:w,
        height:h
      });

      player.videoWidth = player.width = w;
      player.videoHeight = player.height = h;

    }

    //------------------------------
    // Events
    //------------------------------

    function handleSpike(data){
      if(!player.playing){
        draw('spike' + data);
        $player.fadeIn();
        player.play();
      }
    }

    function handleTrigger(data){
      draw('trigger' + data);
    }

    function handleSoundLevel(data){
      soundLevel = data;
      draw('level' + data);
    }

    function handleSoundLevelError(err){
      draw('level error' + err);
    }

    function handleModuleError(err){
      draw('module error' + err);
    }

    function handleConnected(err){
      if(err){
        draw('connect err');
      }else{
        listen();
      }
    }

    function handleVideoEnd(){
      $player.fadeOut();
      player.pause();
      player.currentTime = 0;
    }

    function handleSpacePress(evt){
      socket.emit('retrain', {});
      handleVideoEnd();
    }

    //-------------------------------------
    //  Startup
    //-------------------------------------
      init();

});
