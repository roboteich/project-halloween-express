jQuery(function($){

    //------------------------------------
    //  Properties
    //------------------------------------
    
    //data
    var scares = [
      'broccoli.jpg',
      'broken_ipads.jpg',
      'zuchinni.jpg',
      // 'Stinky Cheese',
       'homework.jpg',
      // 'mondays',
       'braces.jpg',
      // 'cooties',
       'the_dentist.jpg',
      // 'cool parents',
       'cheek_pinches.jpg',
      // 'cough syrup',
      // 'bugs',
      // 'paper cuts',
      // 'pea soup',
      // 'tests',
      // 'getting clothes for your birthday',
       'too_much_tickling.jpg'
      // 'no tv',
      // 'no ipads',
      // 'no video games',
      // 'no minecraft',
      // 'no adventuretime',
    ]


    //services
    var socket;
    var _connectionstatus;
    var soundLevel = 0;

    var $output;
    var imageEl = $('#image');
    var videoEl = $('#video');
    var $player;
    var player;
    var $image;
    var running = false;
    
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
        initImage();
        initOutput();
        bindSocket();
        bindWindow();
        resize();
      }

      function initVideo(){

        player = document.createElement('video');
        $player = $(player);

        $player.attr({
          src: './vid/boo.m4v',
          autoPlay:false,
          controls:false,
          loop:false
        });


        $player.on('ended', handleVideoEnd);
        videoEl.append($player);

        $player.hide();

      }

      function initImage(){

        var image = document.createElement('img');
        $image = $(image);

        imageEl.append($image);

        $image.attr({
          src: './img/broccoli.jpg'
        });

        $image.addClass('tossing');

        $image.hide();

      }

      function initOutput(){

         for(var i =0 ; i<10; i++){
            var span = $('<span class="output" style="-webkit-animation-delay:'+((i-10)/20)+'s">');
            $(document.body).append(span);
        }

        $output = $(document.body).find('span');
    
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
            //handleSpike();
          }
      });

    }

    /*
    * On connection listen for events broadcast from socket
    */
    function bindRemoteActions(){
      
      draw('connected');
      $output.hide();
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
      
      $output.html(output);

    }

    function resize(){
      var w = $(window).width();
      var h = $(window).height();

      videoEl.css({
        width:w,
        height:h,
      });

      imageEl.css({
        width:w/2,
        height:h
      });

      $image.css({
        width:w/2,
        height:h
      });

      player.videoWidth = player.width = w;
      player.videoHeight = player.height = h;

    }

    //------------------------------
    // Events
    //------------------------------

    function handleSpike(data){
      if(!running){

        var ranIndex = Math.floor((Math.random() * scares.length));

        var scare = scares[ranIndex]

        draw(scare.replace(/_/g, " ").replace(".jpg", ""));
        $image.attr('src', 'img/'+scare);
        $player.fadeIn();
        $image.delay(8000).fadeIn();
        $output.delay(8000).fadeIn();
        player.play();
        running = true;
      }
    }

    function handleTrigger(data){
      //draw('trigger' + data);
    }

    function handleSoundLevel(data){
      soundLevel = data;
      //draw('level' + data);
    }

    function handleSoundLevelError(err){
      //draw('level error' + err);
    }

    function handleModuleError(err){
      //draw('module error' + err);
    }

    function handleConnected(err){
      if(err){
        //draw('connect err');
      }else{
        listen();
      }
    }

    function handleVideoEnd(){
      $player.fadeOut();
      $image.fadeOut();
      $output.fadeOut();
      player.pause();
      player.currentTime = 0;
      setTimeout(function(){
        running = false;
      }, 5000);
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
