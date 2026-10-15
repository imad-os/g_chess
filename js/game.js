(function () {
    'use strict';
    var W = 1920, H = 1080, canvas, ctx, raf = 0, last = 0, acc = 0, STEP = 1000 / 60;
    
    // Game States
    var STATE = {
        MENU: 0,
        PLAYING_AI: 1,
        PLAYING_LOCAL: 2,
        PLAYING_ONLINE: 3,
        SETTINGS: 4,
        GAME_OVER: 5,
        MULTIPLAYER_MENU: 6
    };
    
    var currentState = STATE.MENU;
    var chess = null;
    
    // UI layout
    var BOARD_SIZE = 800;
    var BOARD_X = (W - BOARD_SIZE) / 2;
    var BOARD_Y = (H - BOARD_SIZE) / 2;
    var TILE_SIZE = BOARD_SIZE / 8;
    
    // Pre-allocated objects for loop allocation reduction
    var cursorObj = {x: 0, y: 0};
    var FILES = "abcdefgh";
    
    // Cursors and selections
    var cursor = { x: 4, y: 6 }; // x: file (0=a), y: rank (0=8)
    var selectedSquare = null;
    var validMoves = []; // target squares for selected piece
    
    var audioCtx = null;
    var sounds = {};
    var assets = { pieces: {} };
    var loadedPieces = 0;
    
    var profileName = "Player 1";
    var remotePlayerName = "Player 2";
    var myElo = 1200;
    
    // Config
    var config = {
        show_legal_moves: true,
        theme: "dark",
        ai_elo: 1000,
        piece_theme: "classic" // classic for now, just to show setting
    };
    
    // Menus
    var mainMenu = ["Play vs AI", "Couch Play", "Online", "Settings"];
    var menuIndex = 0;
    
    var mpMenu = ["Host Game", "Join Game", "Back"];
    var mpIndex = 0;
    
    var settingsMenu = ["Theme: Dark", "Pieces: Classic", "Show Moves: On", "AI Elo: 1000", "Back"];
    var settingsIndex = 0;
    
    var lastInputTime = 0;
    
    var isWhiteTurn = true;
    var playerColor = 'w';
    
    // Networking
    var onlineSession = null;
    var isHost = false;

    function startMultiplayerHost() {
        if (!MyPC.multiplayer || !MyPC.multiplayer.supported) return;
        MyPC.multiplayer.host({ max: 1 }).then(function (session) {
            isHost = true;
            onlineSession = session;
            session.onPeer(function (peer) {
                playerColor = 'w';
                remotePlayerName = peer.name || "Guest";
                startNewGame(STATE.PLAYING_ONLINE);
                peer.onMessage(handleNetworkMessage);
                peer.onClose(handleNetworkClose);
                peer.send({ type: 'start', fen: chess.fen() });
            });
        }, function (he) {
            // Cancelled or error
        });
    }

    function startMultiplayerJoin() {
        if (!MyPC.multiplayer || !MyPC.multiplayer.supported) return;
        MyPC.multiplayer.join().then(function (host) {
            isHost = false;
            onlineSession = host;
            remotePlayerName = host.name || "Host";
            playerColor = 'b';
            startNewGame(STATE.PLAYING_ONLINE);
            host.onMessage(handleNetworkMessage);
            host.onClose(handleNetworkClose);
        }, function (e) {
            // Cancelled or error
        });
    }

    function handleNetworkMessage(msg) {
        if (msg.type === 'move') {
            var move = chess.move(msg.move);
            if (move) {
                if (move.flags.includes('c') || move.flags.includes('e')) {
                    playSound('capture');
                } else {
                    playSound('move');
                }
                if (chess.in_check()) playSound('check');
                
                if (chess.game_over()) {
                    playSound('end');
                    currentState = STATE.GAME_OVER;
                    handleGameOver();
                }
            }
        } else if (msg.type === 'start') {
            chess.load(msg.fen);
        }
    }

    function handleNetworkClose() {
        onlineSession = null;
        if (currentState === STATE.PLAYING_ONLINE) {
            currentState = STATE.MENU;
        }
    }

    function resize() {
        var s = Math.min(window.innerWidth / W, window.innerHeight / H) * (window.devicePixelRatio || 1);
        canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }
    
    function loadAudio(name, url) {
        if (!audioCtx) return;
        fetch(url).then(function(res) { return res.arrayBuffer(); })
                  .then(function(buf) { return audioCtx.decodeAudioData(buf); })
                  .then(function(decoded) { sounds[name] = decoded; })
                  .catch(function(e) { console.log('Audio load error', e); });
    }
    
    function playSound(name) {
        if (!audioCtx || !sounds[name]) return;
        var src = audioCtx.createBufferSource();
        src.buffer = sounds[name];
        src.connect(audioCtx.destination);
        src.start(0);
    }
    
    function loadPieceImages() {
        var p = ['p', 'n', 'b', 'r', 'q', 'k'];
        var c = ['l', 'd'];
        for (var i=0; i<p.length; i++) {
            for (var j=0; j<c.length; j++) {
                var name = p[i] + c[j];
                var img = new Image();
                img.src = 'assets/pieces/' + name + '.svg?v=1.0.0';
                assets.pieces[name] = img;
                img.onload = function() {
                    loadedPieces++;
                    MyPC.progress(loadedPieces / 12);
                    if (loadedPieces === 12) MyPC.ready();
                };
                img.onerror = function() {
                    console.log("Failed to load piece", name);
                    loadedPieces++;
                    if (loadedPieces === 12) MyPC.ready();
                };
            }
        }
    }
    
    function startNewGame(state) {
        chess = new Chess();
        currentState = state;
        selectedSquare = null;
        validMoves = [];
        cursor.x = 4;
        cursor.y = 6;
        playerColor = 'w';
    }
    
    function getSquareFromCursorFast(x, y) {
        return FILES[x] + String(8 - y);
    }
    
    function makeMove(moveObj) {
        var move = chess.move(moveObj);
        if (move) {
            if (move.flags.includes('c') || move.flags.includes('e')) {
                playSound('capture');
            } else {
                playSound('move');
            }
            if (chess.in_check()) playSound('check');
            
            selectedSquare = null;
            validMoves = [];
            
            if (chess.game_over()) {
                playSound('end');
                currentState = STATE.GAME_OVER;
                handleGameOver();
            } else if (currentState === STATE.PLAYING_AI && chess.turn() === 'b') {
                setTimeout(makeAIMove, 100);
            } else if (currentState === STATE.PLAYING_ONLINE) {
                if (onlineSession) {
                    var peer = isHost ? onlineSession.peers[0] : onlineSession;
                    if (peer && peer.send) peer.send({ type: 'move', move: moveObj });
                }
            }
        }
        return move;
    }
    
    function makeAIMove() {
        if (currentState !== STATE.PLAYING_AI || chess.game_over()) return;
        var moveSan = AI.calculateBestMove(chess, config.ai_elo);
        if (moveSan) {
            makeMove(moveSan);
        }
    }
    
    function handleGameOver() {
        if (currentState === STATE.PLAYING_AI) {
            var eloChange = 0;
            if (chess.in_checkmate()) {
                if (chess.turn() === 'b') { eloChange = 15; } 
                else { eloChange = -15; }
            }
            myElo += eloChange;
            if (myElo < 400) myElo = 400;
            MyPC.save('elo', myElo);
            MyPC.submitScore(myElo, { player: profileName });
        }
    }
    
    function handleInput() {
        var now = performance.now();
        if (now - lastInputTime < 150) return;
        
        var dX = 0, dY = 0;
        if (MyPC.isDown('left', true)) dX = -1;
        if (MyPC.isDown('right', true)) dX = 1;
        if (MyPC.isDown('up', true)) dY = -1;
        if (MyPC.isDown('down', true)) dY = 1;
        
        var confirm = MyPC.isDown('confirm') || MyPC.isDown('jump');
        var cancel = MyPC.isDown('cancel');
        
        if (currentState === STATE.MENU) {
            if (dY !== 0) {
                menuIndex = (menuIndex + dY + mainMenu.length) % mainMenu.length;
                lastInputTime = now;
            } else if (confirm) {
                lastInputTime = now;
                if (menuIndex === 0) startNewGame(STATE.PLAYING_AI);
                else if (menuIndex === 1) startNewGame(STATE.PLAYING_LOCAL);
                else if (menuIndex === 2) {
                    currentState = STATE.MULTIPLAYER_MENU;
                }
                else if (menuIndex === 3) {
                    currentState = STATE.SETTINGS;
                    updateSettingsMenuText();
                }
            }
        } else if (currentState === STATE.MULTIPLAYER_MENU) {
            if (cancel) {
                lastInputTime = now;
                currentState = STATE.MENU;
            } else if (dY !== 0) {
                mpIndex = (mpIndex + dY + mpMenu.length) % mpMenu.length;
                lastInputTime = now;
            } else if (confirm) {
                lastInputTime = now;
                if (mpIndex === 0) startMultiplayerHost();
                else if (mpIndex === 1) startMultiplayerJoin();
                else if (mpIndex === 2) currentState = STATE.MENU;
            }
        } else if (currentState === STATE.SETTINGS) {
            if (dY !== 0) {
                settingsIndex = (settingsIndex + dY + settingsMenu.length) % settingsMenu.length;
                lastInputTime = now;
            } else if (confirm) {
                lastInputTime = now;
                if (settingsIndex === 0) {
                    config.theme = config.theme === "dark" ? "light" : "dark";
                    updateSettingsMenuText();
                } else if (settingsIndex === 1) {
                    config.piece_theme = config.piece_theme === "classic" ? "modern" : "classic";
                    updateSettingsMenuText();
                } else if (settingsIndex === 2) {
                    config.show_legal_moves = !config.show_legal_moves;
                    updateSettingsMenuText();
                } else if (settingsIndex === 3) {
                    config.ai_elo = config.ai_elo === 1000 ? 1500 : (config.ai_elo === 1500 ? 500 : 1000);
                    updateSettingsMenuText();
                } else if (settingsIndex === 4) {
                    MyPC.save('config', config);
                    currentState = STATE.MENU;
                }
            } else if (cancel) {
                lastInputTime = now;
                MyPC.save('config', config);
                currentState = STATE.MENU;
            }
        } else if (currentState === STATE.PLAYING_AI || currentState === STATE.PLAYING_LOCAL || currentState === STATE.PLAYING_ONLINE) {
            if (cancel) {
                lastInputTime = now;
                currentState = STATE.MENU;
                if (onlineSession) {
                    onlineSession.close();
                    onlineSession = null;
                }
            } else if (dX !== 0 || dY !== 0) {
                var cX = cursor.x;
                var cY = cursor.y;
                if (playerColor === 'b' && currentState === STATE.PLAYING_ONLINE) {
                    cX -= dX;
                    cY -= dY;
                } else {
                    cX += dX;
                    cY += dY;
                }
                cursor.x = Math.max(0, Math.min(7, cX));
                cursor.y = Math.max(0, Math.min(7, cY));
                lastInputTime = now;
            } else if (confirm) {
                lastInputTime = now;
                
                if (currentState === STATE.PLAYING_ONLINE && chess.turn() !== playerColor) return;
                
                var sq = getSquareFromCursorFast(cursor.x, cursor.y);
                var piece = chess.get(sq);
                
                if (selectedSquare) {
                    var isMoveValid = false;
                    for(var i=0; i<validMoves.length; i++) {
                        if (validMoves[i].to === sq) { isMoveValid = true; break; }
                    }
                    if (isMoveValid) {
                        makeMove({ from: selectedSquare, to: sq, promotion: 'q' });
                    } else if (piece && piece.color === chess.turn()) {
                        selectedSquare = sq;
                        validMoves = chess.moves({ square: sq, verbose: true });
                    } else {
                        selectedSquare = null;
                        validMoves = [];
                    }
                } else {
                    if (piece && piece.color === chess.turn()) {
                        selectedSquare = sq;
                        validMoves = chess.moves({ square: sq, verbose: true });
                    }
                }
            }
        } else if (currentState === STATE.GAME_OVER) {
            if (confirm || cancel) {
                lastInputTime = now;
                currentState = STATE.MENU;
            }
        }
    }
    
    function updateSettingsMenuText() {
        settingsMenu[0] = "Theme: " + (config.theme === "dark" ? "Dark" : "Light");
        settingsMenu[1] = "Pieces: " + (config.piece_theme === "classic" ? "Classic" : "Modern");
        settingsMenu[2] = "Show Moves: " + (config.show_legal_moves ? "On" : "Off");
        settingsMenu[3] = "AI Elo: " + config.ai_elo;
    }
    
    function update() {
        handleInput();
    }
    
    function draw() {
        var bg = config.theme === 'dark' ? '#1e1e1e' : '#f0f0f0';
        var textCol = config.theme === 'dark' ? '#fff' : '#000';
        var lightSq = config.theme === 'dark' ? '#556b2f' : '#f0d9b5';
        var darkSq  = config.theme === 'dark' ? '#8b4513' : '#b58863';
        
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        
        if (currentState === STATE.MENU || currentState === STATE.SETTINGS || currentState === STATE.MULTIPLAYER_MENU) {
            ctx.fillStyle = textCol;
            ctx.font = '80px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("MyPC Chess", 960, 200);
            
            ctx.font = '50px sans-serif';
            var m = mainMenu;
            var idx = menuIndex;
            
            if (currentState === STATE.SETTINGS) { m = settingsMenu; idx = settingsIndex; }
            else if (currentState === STATE.MULTIPLAYER_MENU) { m = mpMenu; idx = mpIndex; }
            
            for (var i = 0; i < m.length; i++) {
                ctx.fillStyle = (i === idx) ? '#ffcc00' : textCol;
                ctx.fillText(m[i], 960, 400 + i * 80);
            }
            
            ctx.fillStyle = textCol;
            ctx.font = '30px sans-serif';
            ctx.fillText(profileName, 960, 1030);
            return;
        }
        
        var rx, ry, px, py, isLight, sq, piece, cName, pName, img;
        for (var y = 0; y < 8; y++) {
            for (var x = 0; x < 8; x++) {
                isLight = (x + y) % 2 === 0;
                ctx.fillStyle = isLight ? lightSq : darkSq;
                
                rx = x;
                ry = y;
                if (playerColor === 'b' && currentState === STATE.PLAYING_ONLINE) {
                    rx = 7 - x;
                    ry = 7 - y;
                }
                
                px = BOARD_X + rx * TILE_SIZE;
                py = BOARD_Y + ry * TILE_SIZE;
                
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                
                sq = getSquareFromCursorFast(x, y);
                if (sq === selectedSquare) {
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }
                
                piece = chess ? chess.get(sq) : null;
                if (piece) {
                    cName = piece.color === 'w' ? 'l' : 'd';
                    pName = piece.type + cName;
                    img = assets.pieces[pName];
                    if (img) {
                        ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
                    }
                }
                
                if (config.show_legal_moves && validMoves.length > 0) {
                    for(var vi=0; vi<validMoves.length; vi++) {
                        if (validMoves[vi].to === sq) {
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                            ctx.beginPath();
                            ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/6, 0, 2*Math.PI);
                            ctx.fill();
                            break;
                        }
                    }
                }
                
                if (cursor.x === x && cursor.y === y) {
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 6;
                    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                }
            }
        }
        
        ctx.fillStyle = textCol;
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'left';
        
        if (currentState === STATE.GAME_OVER) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 440, W, 200);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = '60px sans-serif';
            var txt = "Game Over!";
            if (chess.in_checkmate()) {
                txt = (chess.turn() === 'w' ? "Black" : "White") + " wins by checkmate!";
            } else if (chess.in_draw() || chess.in_stalemate()) {
                txt = "Draw!";
            }
            ctx.fillText(txt, 960, 560);
            ctx.font = '30px sans-serif';
            ctx.fillText("Press OK to return to menu", 960, 620);
        } else {
            var msgStr = " to move";
            if (currentState === STATE.PLAYING_ONLINE) {
                var p1 = playerColor === 'w' ? profileName : remotePlayerName;
                var p2 = playerColor === 'b' ? profileName : remotePlayerName;
                msgStr = (chess.turn() === 'w' ? p1 + " (White)" : p2 + " (Black)") + msgStr;
            } else {
                msgStr = (chess.turn() === 'w' ? "White" : "Black") + msgStr;
            }
            ctx.fillText(msgStr, 50, 100);
        }
    }
    
    function frame(ts) {
        raf = requestAnimationFrame(frame);
        if (!last) last = ts;
        acc += Math.min(250, ts - last); last = ts;
        while (acc >= STEP) { update(); acc -= STEP; }
        draw();
    }
    
    function startLoop() { 
        if (!raf) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } 
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
    
    function stopLoop() { 
        if (raf) cancelAnimationFrame(raf); raf = 0; 
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
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
    });
})();
