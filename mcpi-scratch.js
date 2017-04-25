
(function (ext) {
      
    //constants
    var DEFAULT_HOST = "localhost";
    var DEFAULT_PORT = 4715;
    var MC_EVENTS_POLL_INTERVAL_IN_MS = 2000;

    //init vars
    var blockHits = false;
    var host = DEFAULT_HOST;
    var port = DEFAULT_PORT;
    var status = { status:2, msg:'Ready' }; // status must be always ready. Otherwise the block with the server address will not be executed.
    var isConnecteds = false;
    var logConsole = console;

    ext.changeToServer = function( srvaddr ){
      var address = srvaddr.split(":");
      host = address[0];
      port = ( address[1] ? address[1] : DEFAULT_PORT );
    };
    
    function log(msg){
      logConsole.log(msg);
    }

    ext.postToChat = function(str) {
      execCmd( "postToChat", [str]);
    };

    ext.playerPosToChat = function() {
      execCmd( "playerPosToChat", []);
    };

    ext.setPlayerPos = function(x, y, z) {
      execCmd( "setPlayerPos", [ x, y, z ]);
    };

    ext.setBlock = function(x, y, z, blockType, blockData, posType) {
      execCmd( "setBlock", [ x, y, z, blockType, blockData, posType ]);
    };

    ext.setBlocks = function(x1, y1, z1, x2, y2, z2, blockType, blockData) {
      execCmd( "setBlocks", [ x1, y1, z1, x2, y2, z2, blockType, blockData ]);
    }

    ext.setLine = function(x1, z1, x2, z2, y, blockType, blockData) {
      execCmd( "setLine", [ x1, z1, x2, z2, y, blockType, blockData ]);
    }

    ext.setCircle = function(x, z, r, y, blockType, blockData) {
      execCmd( "setCircle", [ x, z, r, y, blockType, blockData ]);
    };
    
    // get one coord (x, y, or z) for playerPos
    ext.getPlayerPos = function(posCoord, callback) {
      execCmd( "getPlayerPos", [ posCoord ], callback);
    };

    ext.getBlock = function(x, y, z, posType, callback) {
      execCmd( "getBlock", [ x, y, z, posType ], callback);
    }
    
    function execCmd( cmd , params, callback ){
        var cmdUrl = "http://" + host + ":" + port + "/" + cmd + "/" + params.join("/");
        $.ajax({
            type: "GET",
            url: cmdUrl,
            //dataType: "jsonp", // hack for the not origin problem - replace with CORS based solution
            success: function(data) {
                console.log( cmd + " success ", data.trim());
                if(callback){
                  callback(data.trim());
                }
            },
            error: function(jqxhr, textStatus, error) { // have to change this coz jasonp parse error
                console.log("Error " + cmd + ": ", error);
                if(callback){
                  callback(null);
                }
            }
        }); 
    }

    // get one coord (x, y, or z) for playerPos



    function checkMC_Events() {
        var cmdUrl = "http://" + host + ":" + port + "/pollBlockHit/";
        $.ajax({
            type: "GET",
            url: cmdUrl,
            //dataType: "jsonp", // hack for the not origin problem - replace with CORS based solution
            success: function(data) {
                console.log("checkMC_Events success ", data.trim());
                if (parseInt(data) == 1)
                    blockHits = true;
                else
                    blockHits = false;
                isConnected = true;
            },
            error: function(jqxhr, textStatus, error) { // have to change this coz jasonp parse error
                console.log("Error checkMC_Events: ", error);
                //callback(null);
                isConnected = false;
            }
        }); 
    }

    ext.whenBlockHit = function(str) {
        if (!blockHits)
            return;
        else
            return true;
    };


    ext._getStatus = function() {
      if( isConnected ){
        status =  { status:2, msg:'Ready' };
      } else {
        if( status.status === 2 ){
          status =  { status:0, msg:'Connecting' };
        } else {
          status =  { status:2, msg:'Ready' };
        }
      }
      return status;
    };

    ext._shutdown = function() {
        if (poller) {
          clearInterval(poller);
          poller = null;
        }
    };
    
    ext.serverIsConnected = function(){
      return isConnected;
    };
    
    var TRANSLATIONS = {
        en: {
            changeToServer: 'change to server %s',
            serverIsConnected: 'is server connected?',
            postToChat: 'post to chat %s',
            playerPosToChat: "post Player.pos chat",
            setPlayerPos: "set Player pos to x:%n y:%n z:%n",
            setBlock: "set block pos x:%n y:%n z:%n to type %n data %n %m.blockPos",
            setBlocks: "set blocks pos x1:%n y1:%n z1:%n to x2:%n y2:%n z2:%n to type %n data %n",
            setLine: "set line pos x1:%n z1:%n to x2:%n z2:%n height y:%n to type %n data %n",
            setCircle: "set circle center x1:%n z1:%n radius r:%n at height y:%n to type %n data %n",
            getPlayerPos:"get player pos %m.pos",
            getBlock:"get block pos x:%n y:%n z:%n %m.blockPos", 
            whenBlockHit: "when blockHit",
            message:"message"
        },
        pt: {
            changeToServer: 'muda para o servidor: %s',
            serverIsConnected: 'o servidor está ligado?',
            postToChat: "escreve no chat %s",
            playerPosToChat: "escreve posição do jogador no chat",
            setPlayerPos: "muda a pos do Jogador para x:%n y:%n z:%n",
            setBlock: "muda o bloco na pos x:%n y:%n z:%n para o tipo %n subtipo %n %m.blockPos",
            setBlocks: "coloca blocos da pos x1:%n y1:%n z1:%n até x2:%n y2:%n z2:%n do tipo %n subtipo %n",
            setLine: "desenha linha da pos x1:%n z1:%n até x2:%n z2:%n à altura de y:%n com blocos tipo %n subtipo %n",
            setCircle: "desenha circulo com centro x1:%n z1:%n, raio r:%n à altura y:%n com blocos tipo %n subtipo %n",
            getPlayerPos:"posição do Jogador no eixo do %m.pos",
            getBlock:"bloco na pos x:%n y:%n z:%n %m.blockPos", 
            whenBlockHit: "quando bloco atingido",
            message:"mensagem"
        },
    };

    function getTranslationForLang( lang ){
        switch (lang){
          case "pt":
          case "pt-PT":
          case "pt-BR":
            return TRANSLATIONS.pt;
          default:
            return TRANSLATIONS.en;
            
        }
    }

   // how which language translation is chosen (increasing priority):
   //   1 - explicit 'lang' parameter in the url (e.g: http://scratchx.org/?url=https://paulolc.neocities.org/mcpi-scratch/mcpi-scratch.js&lang=pt#scratch)
   //   2 - browser first preferred language (navigator.languages[0])
   //   3 - default (english)
 
    var urlParams = new URLSearchParams(window.location.search);
    var lang = urlParams.get('lang') || navigator.languages[0];
    var translate = getTranslationForLang(lang);

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [" ", translate.changeToServer,"changeToServer",host ],
            ["r", translate.serverIsConnected,"serverIsConnected"],
            ['',  translate.postToChat, "postToChat",  translate.message],
            [" ", translate.playerPosToChat,"playerPosToChat"],
            [" ", translate.setPlayerPos,"setPlayerPos", 0, 0, 0],
            [" ", translate.setBlock,"setBlock", 0, 0, 0, 1, -1],
            [" ", translate.setBlocks,"setBlocks", 0, 0, 0, 0, 0, 0, 1, -1],
            [" ", translate.setLine,"setLine", 0, 0, 0, 0, 0, 1, -1],
            [" ", translate.setCircle,"setCircle", 0, 0, 0, 0, 0, 1, -1],
            ["R", translate.getPlayerPos,"getPlayerPos", 'x'],
            ["R", translate.getBlock,"getBlock", 0, 0, 0],
            ["h", translate.whenBlockHit,'whenBlockHit'],
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel']
        }
    };

    // Register the extension
    ScratchExtensions.register('MCPI-Scratch', descriptor, ext);

    checkMC_Events();
    var poller = setInterval(checkMC_Events, MC_EVENTS_POLL_INTERVAL_IN_MS );

})({});
