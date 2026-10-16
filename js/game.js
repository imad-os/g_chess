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
        ai_depth: 10,
        ai_time: 1000,
        piece_theme: "classic" // classic for now, just to show setting
    };

    var stockfishWorker = null;
    var stockfishReady = false;

    function initStockfish() {
        stockfishWorker = new Worker('js/stockfish.js');
        stockfishWorker.onmessage = function(event) {
            var line = event.data;
            if (line === 'uciok') {
                stockfishReady = true;
            } else if (line.indexOf('bestmove') === 0) {
                var match = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
                if (match && match[1]) {
                    // Match looks like 'e2e4' or 'e7e8q'
                    var from = match[1].substring(0, 2);
                    var to = match[1].substring(2, 4);
                    var promotion = match[1].length > 4 ? match[1][4] : undefined;
                    
                    var moveObj = { from: from, to: to };
                    if (promotion) moveObj.promotion = promotion;
                    
                    if (currentState === STATE.PLAYING_AI) {
                        makeMove(moveObj);
                    }
                }
            }
        };
        stockfishWorker.postMessage('uci');
    }
    
    function requestAIMove() {
        if (!stockfishWorker || !stockfishReady) {
            // Wait for worker to load
            setTimeout(requestAIMove, 500);
            return;
        }
        
        // Update skill level 0-20 mapped from 400-3000 Elo loosely
        var eloRange = 2600;
        var skill = Math.max(0, Math.min(20, Math.round(((config.ai_elo - 400) / eloRange) * 20)));
        stockfishWorker.postMessage('setoption name Skill Level value ' + skill);
        stockfishWorker.postMessage('setoption name UCI_LimitStrength value true');
        stockfishWorker.postMessage('setoption name UCI_Elo value ' + config.ai_elo);

        stockfishWorker.postMessage('position fen ' + chess.fen());
        stockfishWorker.postMessage('go depth ' + config.ai_depth + ' movetime ' + config.ai_time);
    }

    
    // Menus
    var mainMenu = ["Play vs AI", "Couch Play", "Online", "Settings"];
    var menuIndex = 0;
    
    var mpMenu = ["Host Game", "Join Game", "Back"];
    
    var pauseMenu = ["Resume", "Restart", "Quit to Menu"];
    var pauseIndex = 0;
    var stateBeforePause = STATE.MENU;
    var mpIndex = 0;
    
    var settingsMenu = ["Theme: Dark", "Pieces: Classic", "Show Moves: On", "AI Elo: 1000", "AI Depth: 10", "AI Time(ms): 1000", "Back"];
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
                setTimeout(requestAIMove, 100);
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
        // Obsolete, see requestAIMove
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
            if (dX !== 0) {
                // If pressing left/right on menu, change AI elo to showcase setting easily for testing
                if (menuIndex === 0) {
                    config.ai_elo += dX * 100;
                    if (config.ai_elo < 400) config.ai_elo = 400;
                    if (config.ai_elo > 3000) config.ai_elo = 3000;
                    updateSettingsMenuText();
                    lastInputTime = now;
                }
            }
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
                    // Handled by dX logic below for Settings
                } else if (settingsIndex === 4) {
                    // Handled by dX logic
                } else if (settingsIndex === 5) {
                    // Handled by dX logic
                } else if (settingsIndex === 6) {
                    MyPC.save('config', config);
                    currentState = STATE.MENU;
                }
            } else if (dX !== 0) {
                if (settingsIndex === 3) {
                    config.ai_elo += dX * 100;
                    if (config.ai_elo < 400) config.ai_elo = 400;
                    if (config.ai_elo > 3000) config.ai_elo = 3000;
                    updateSettingsMenuText();
                    lastInputTime = now;
                } else if (settingsIndex === 4) {
                    config.ai_depth += dX;
                    if (config.ai_depth < 1) config.ai_depth = 1;
                    if (config.ai_depth > 20) config.ai_depth = 20;
                    updateSettingsMenuText();
                    lastInputTime = now;
                } else if (settingsIndex === 5) {
                    config.ai_time += dX * 100;
                    if (config.ai_time < 100) config.ai_time = 100;
                    if (config.ai_time > 10000) config.ai_time = 10000;
                    updateSettingsMenuText();
                    lastInputTime = now;
                }
            } else if (cancel) {
                lastInputTime = now;
                MyPC.save('config', config);
                currentState = STATE.MENU;
            }
        } else if (currentState === STATE.PLAYING_AI || currentState === STATE.PLAYING_LOCAL || currentState === STATE.PLAYING_ONLINE) {
            if (cancel) {
                lastInputTime = now;
                stateBeforePause = currentState;
                pauseIndex = 0;
                currentState = STATE.PAUSED;
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
        } else if (currentState === STATE.PAUSED) {
            if (cancel) {
                lastInputTime = now;
                currentState = stateBeforePause;
            } else if (dY !== 0) {
                pauseIndex = (pauseIndex + dY + pauseMenu.length) % pauseMenu.length;
                lastInputTime = now;
            } else if (confirm) {
                lastInputTime = now;
                if (pauseIndex === 0) {
                    // Resume
                    currentState = stateBeforePause;
                } else if (pauseIndex === 1) {
                    // Restart
                    if (stateBeforePause === STATE.PLAYING_ONLINE) {
                        // For online, restart isn't trivial without sending a restart network request.
                        // We will just fall back to menu for online restart for now, or just send a fen reset.
                        // Sending fen reset to start a new game:
                        startNewGame(STATE.PLAYING_ONLINE);
                        if (onlineSession && isHost) {
                            onlineSession.peers[0].send({ type: 'start', fen: chess.fen() });
                        }
                    } else {
                        startNewGame(stateBeforePause);
                    }
                } else if (pauseIndex === 2) {
                    // Quit to Menu
                    currentState = STATE.MENU;
                    if (onlineSession) {
                        onlineSession.close();
                        onlineSession = null;
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
        settingsMenu[4] = "AI Depth: " + config.ai_depth;
        settingsMenu[5] = "AI Time(ms): " + config.ai_time;
    }
    
    function update() {
        handleInput();
    }
    
    function drawRoundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.arcTo(x+w, y,   x+w, y+h, r);
        ctx.arcTo(x+w, y+h, x,   y+h, r);
        ctx.arcTo(x,   y+h, x,   y,   r);
        ctx.arcTo(x,   y,   x+w, y,   r);
        ctx.closePath();
    }

    function draw() {
        var isDark = config.theme === 'dark';
        var bgGradient = ctx.createLinearGradient(0, 0, W, H);
        if (isDark) {
            bgGradient.addColorStop(0, '#0f172a'); // slate-900
            bgGradient.addColorStop(1, '#020617'); // slate-950
        } else {
            bgGradient.addColorStop(0, '#f8fafc'); // slate-50
            bgGradient.addColorStop(1, '#e2e8f0'); // slate-200
        }
        
        var textCol = isDark ? '#f8fafc' : '#0f172a';
        var textMuted = isDark ? '#94a3b8' : '#64748b';
        var accentCol = '#3b82f6'; // blue-500
        
        // Modern board colors
        var lightSq = isDark ? '#cbd5e1' : '#f1f5f9'; // slate-300 / slate-100
        var darkSq  = isDark ? '#475569' : '#64748b'; // slate-600 / slate-500
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, W, H);
        
        if (currentState === STATE.MENU || currentState === STATE.SETTINGS || currentState === STATE.MULTIPLAYER_MENU) {
            // Title
            ctx.fillStyle = textCol;
            ctx.font = 'bold 90px "Segoe UI", Roboto, Helvetica, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("MyPC Chess", 960, 220);
            
            ctx.font = 'bold 45px "Segoe UI", Roboto, Helvetica, sans-serif';
            var m = mainMenu;
            var idx = menuIndex;
            
            if (currentState === STATE.SETTINGS) { m = settingsMenu; idx = settingsIndex; }
            else if (currentState === STATE.MULTIPLAYER_MENU) { m = mpMenu; idx = mpIndex; }
            
            var menuStartY = 420;
            var btnWidth = 500;
            var btnHeight = 80;
            
            for (var i = 0; i < m.length; i++) {
                var btnY = menuStartY + i * 110;
                
                if (i === idx) {
                    // Selected button background
                    ctx.fillStyle = accentCol;
                    drawRoundRect(960 - btnWidth/2, btnY - 55, btnWidth, btnHeight, 16);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                } else {
                    // Unselected button background
                    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff'; // slate-800 / white
                    drawRoundRect(960 - btnWidth/2, btnY - 55, btnWidth, btnHeight, 16);
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1'; // border
                    ctx.stroke();
                    ctx.fillStyle = textCol;
                }
                ctx.fillText(m[i], 960, btnY);
            }
            
            // Player info at bottom
            ctx.fillStyle = textMuted;
            ctx.font = '30px "Segoe UI", sans-serif';
            ctx.fillText(profileName, 960, 1030);
            return;
        }
        
        // Draw Board Background / Border
        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
        drawRoundRect(BOARD_X - 20, BOARD_Y - 20, BOARD_SIZE + 40, BOARD_SIZE + 40, 12);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.stroke();
        
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
                
                // Selection Highlight
                if (sq === selectedSquare) {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; // blue-500 with opacity
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }
                
                // Draw piece
                piece = chess ? chess.get(sq) : null;
                if (piece) {
                    cName = piece.color === 'w' ? 'l' : 'd';
                    pName = piece.type + cName;
                    img = assets.pieces[pName];
                    if (img) {
                        // slight shadow for pieces to make them pop
                        ctx.shadowColor = "rgba(0,0,0,0.3)";
                        ctx.shadowBlur = 4;
                        ctx.shadowOffsetY = 2;
                        ctx.drawImage(img, px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                        ctx.shadowColor = "transparent";
                    }
                }
                
                // Valid moves indicator (modern dot)
                if (config.show_legal_moves && validMoves.length > 0) {
                    for(var vi=0; vi<validMoves.length; vi++) {
                        if (validMoves[vi].to === sq) {
                            if (piece) {
                                // If it's a capture, draw a ring instead of a dot
                                ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // red-500
                                ctx.lineWidth = 6;
                                ctx.beginPath();
                                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/2.5, 0, 2*Math.PI);
                                ctx.stroke();
                            } else {
                                // Normal move dot
                                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                                if (isDark) ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                                ctx.beginPath();
                                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/8, 0, 2*Math.PI);
                                ctx.fill();
                            }
                            break;
                        }
                    }
                }
                
                // TV Cursor (modern stroke)
                if (cursor.x === x && cursor.y === y) {
                    ctx.strokeStyle = accentCol;
                    ctx.lineWidth = 6;
                    drawRoundRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6, 8);
                    ctx.stroke();
                }
            }
        }
        
        // UI Side Panels (Player info)
        ctx.textAlign = 'left';
        ctx.font = 'bold 36px "Segoe UI", sans-serif';
        
        var msgStr = " to move";
        var topName = (playerColor === 'w') ? "Black" : "White";
        var bottomName = (playerColor === 'w') ? "White" : "Black";
        
        if (currentState === STATE.PLAYING_ONLINE) {
            topName = (playerColor === 'w') ? remotePlayerName : profileName;
            bottomName = (playerColor === 'w') ? profileName : remotePlayerName;
        } else if (currentState === STATE.PLAYING_AI) {
            topName = "AI (Elo " + config.ai_elo + ")";
            bottomName = profileName;
        } else if (currentState === STATE.PLAYING_LOCAL) {
            topName = "Player 2";
            bottomName = profileName;
        }
        
        // Top Player (Opponent)
        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
        drawRoundRect(BOARD_X, BOARD_Y - 100, 300, 60, 10);
        ctx.fill();
        ctx.fillStyle = textCol;
        ctx.fillText(topName, BOARD_X + 20, BOARD_Y - 58);
        
        // Bottom Player (You)
        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
        drawRoundRect(BOARD_X, BOARD_Y + BOARD_SIZE + 40, 300, 60, 10);
        ctx.fill();
        ctx.fillStyle = textCol;
        ctx.fillText(bottomName, BOARD_X + 20, BOARD_Y + BOARD_SIZE + 82);
        
        // Turn indicator
        ctx.fillStyle = textMuted;
        ctx.font = '28px "Segoe UI", sans-serif';
        var isMyTurn = (chess.turn() === playerColor);
        if (currentState !== STATE.PLAYING_ONLINE) isMyTurn = true; // For local/AI, always show turn dynamically
        
        if (chess.turn() === 'w') {
            ctx.fillText("White to move", BOARD_X + BOARD_SIZE - 200, BOARD_Y + BOARD_SIZE + 80);
        } else {
            ctx.fillText("Black to move", BOARD_X + BOARD_SIZE - 200, BOARD_Y - 60);
        }

        // Game Over Overlay
        if (currentState === STATE.GAME_OVER || currentState === STATE.PAUSED) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, W, H);
            
            if (currentState === STATE.GAME_OVER) {
                ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
                drawRoundRect(W/2 - 350, H/2 - 200, 700, 400, 20);
                ctx.fill();
                
                ctx.fillStyle = textCol;
                ctx.textAlign = 'center';
                ctx.font = 'bold 70px "Segoe UI", sans-serif';
                
                var txt = "Game Over!";
                var subTxt = "";
                if (chess.in_checkmate()) {
                    txt = (chess.turn() === 'w' ? "Black" : "White") + " Wins!";
                    subTxt = "by checkmate";
                } else if (chess.in_draw() || chess.in_stalemate()) {
                    txt = "It's a Draw!";
                }
                
                ctx.fillText(txt, W/2, H/2 - 20);
                ctx.fillStyle = textMuted;
                ctx.font = '30px "Segoe UI", sans-serif';
                if (subTxt) ctx.fillText(subTxt, W/2, H/2 + 30);
                
                // OK Button hint
                ctx.fillStyle = accentCol;
                drawRoundRect(W/2 - 150, H/2 + 80, 300, 60, 12);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 28px "Segoe UI", sans-serif';
                ctx.fillText("Press OK", W/2, H/2 + 120);
            } else if (currentState === STATE.PAUSED) {
                ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
                drawRoundRect(W/2 - 300, H/2 - 250, 600, 500, 20);
                ctx.fill();
                
                ctx.fillStyle = textCol;
                ctx.textAlign = 'center';
                ctx.font = 'bold 60px "Segoe UI", sans-serif';
                ctx.fillText("Paused", W/2, H/2 - 130);
                
                ctx.font = 'bold 40px "Segoe UI", sans-serif';
                var btnWidthP = 400;
                var btnHeightP = 70;
                for (var pi = 0; pi < pauseMenu.length; pi++) {
                    var btnYP = (H/2 - 40) + pi * 90;
                    if (pi === pauseIndex) {
                        ctx.fillStyle = accentCol;
                        drawRoundRect(W/2 - btnWidthP/2, btnYP - 50, btnWidthP, btnHeightP, 12);
                        ctx.fill();
                        ctx.fillStyle = '#ffffff';
                    } else {
                        ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
                        drawRoundRect(W/2 - btnWidthP/2, btnYP - 50, btnWidthP, btnHeightP, 12);
                        ctx.fill();
                        ctx.fillStyle = textCol;
                    }
                    ctx.fillText(pauseMenu[pi], W/2, btnYP);
                }
            }
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
    });
})();
