(function () {
    'use strict';
    var W = 1920, H = 1080, canvas, ctx, raf = 0, last = 0, acc = 0, STEP = 1000 / 60;
    
    // Game States
    var STATE = {
        MENU: 0,
        SETTINGS_DISPLAY: 8,
        SETTINGS_AI: 9,
        ANALYSIS_VIEW: 10,
        PLAYING_AI: 1,
        PLAYING_LOCAL: 2,
        PLAYING_ONLINE: 3,
        SETTINGS: 4,
        GAME_OVER: 5,
        PAUSED: 7,
        MULTIPLAYER_MENU: 6
    };
    
    var currentState = STATE.MENU;
    var chess = null;
    
    // UI layout
    var BOARD_SIZE = 800;
    var BOARD_X = (W - BOARD_SIZE) / 2;
    var BOARD_Y = (H - BOARD_SIZE) / 2;
    var TILE_SIZE = BOARD_SIZE / 8;
    

    // Pointer and input
    var pointerX = W / 2;
    var pointerY = H / 2;
    var pointerRadius = 15;
    var isPointerDown = false;
    
    // Internal Mouse tracking
    function handleMouseMove(e) {
        var rect = canvas.getBoundingClientRect();
        var s = Math.min(window.innerWidth / W, window.innerHeight / H) * (window.devicePixelRatio || 1);
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        
        pointerX = (e.clientX - rect.left) * scaleX / (canvas.width / W);
        pointerY = (e.clientY - rect.top) * scaleY / (canvas.height / H);
    }

    function handleMouseDown(e) {
        mouseClicked = true;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);


    function startLoop() { 
        if (!raf) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } 
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Draw Free-Floating Pointer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, pointerRadius, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function stopLoop() { 
        if (raf) cancelAnimationFrame(raf); raf = 0; 
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }

        // Draw Free-Floating Pointer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, pointerRadius, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    MyPC.init({
        onInit: function (info) {
            canvas = document.getElementById('c'); ctx = canvas.getContext('2d');
            resize(); window.addEventListener('resize', resize);
            
            if (info.profile && info.profile.name) {
                profileName = info.profile.name;
            }
            
            myElo = MyPC.load('elo', 1200);
            var savedConfig = MyPC.load('config', null);
            if (savedConfig) {
                config.theme = savedConfig.theme || config.theme;
                config.show_legal_moves = savedConfig.show_legal_moves !== undefined ? savedConfig.show_legal_moves : config.show_legal_moves;
                config.ai_elo = savedConfig.ai_elo || config.ai_elo;
                config.piece_theme = savedConfig.piece_theme || config.piece_theme;
            }
            
            if (MyPC.app_config) {
                if (MyPC.app_config.theme) config.theme = MyPC.app_config.theme;
                if (MyPC.app_config.ai_elo) config.ai_elo = MyPC.app_config.ai_elo;
                if (MyPC.app_config.show_legal_moves !== undefined) config.show_legal_moves = MyPC.app_config.show_legal_moves;
                if (MyPC.app_config.piece_theme) config.piece_theme = MyPC.app_config.piece_theme;
            }
            
            updateSettingsMenuText();
            loadPieceImages();
            initStockfish();
        },
        onStart: function() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                loadAudio('move', 'assets/audio/move.ogg?v=1.0.0');
                loadAudio('capture', 'assets/audio/capture.ogg?v=1.0.0');
                loadAudio('check', 'assets/audio/check.ogg?v=1.0.0');
                loadAudio('end', 'assets/audio/end.ogg?v=1.0.0');
                
                fetch('assets/audio/music.ogg?v=1.0.0').then(function(res) { return res.arrayBuffer(); })
                  .then(function(buf) { return audioCtx.decodeAudioData(buf); })
                  .then(function(decoded) { 
                      var src = audioCtx.createBufferSource();
                      src.buffer = decoded;
                      src.loop = true;
                      src.connect(audioCtx.destination);
                      src.start(0);
                  }).catch(function(e){});
            }
            startLoop();
        },
        onPause: stopLoop,
        onResume: startLoop,
        onDestroy: function () { 
            stopLoop(); 
            window.removeEventListener('resize', resize); 
            if (audioCtx) {
                audioCtx.close();
                audioCtx = null;
            }
            if (onlineSession) {
                onlineSession.close();
                onlineSession = null;
            }
        },
        onInput: function (action, pressed, repeat) { 
        }

        // Draw Free-Floating Pointer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, pointerRadius, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
})();
