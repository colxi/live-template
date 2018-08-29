(function(){
    'use strict';

    const Config = {
        debugMode               : true,
        debugStyles             : {
            red     : '#ff5353',
            darkred     : '#af3333',
            green   : 'green',
            yellow  : 'yellow',
            darkyellow  : '#c9c91e',
            darkeryellow  : '#8a8a0c',
            orange  : 'orange',
            blue  : '#2196F3',
            lightblue  : '#03A9F4',
        },
    };

    const applyStyle = function(style, ...args){
        let items =[];
        if( typeof args[0] === 'string' ){
            items.push( '%c' + args[0] );
            items.push( style );
        }else items.push( args[0] );

        let tmp= Array.prototype.slice.call(args ,1);
        items = items.concat(tmp);

        _DEBUG_( ...items );
    };


    const _DEBUG_ = function( ...msg ){
        if( Config.debugMode ) console.log( ...msg );
    };
    _DEBUG_.level={
        binding : true,
        directive : true
    };


    _DEBUG_.activate = function(){ Config.debugMode = true };
    _DEBUG_.deactivate = function(){ Config.debugMode = false };


    _DEBUG_.binding = function(...args){ if( _DEBUG_.level.binding ) applyStyle( 'color:' + Config.debugStyles.yellow + ';' , ...args ) };
    _DEBUG_.binding.dark = function(...args){ if( _DEBUG_.level.binding ) applyStyle( 'color:' + Config.debugStyles.darkyellow + ';' , ...args ) };
    _DEBUG_.binding.darker = function(...args){ if( _DEBUG_.level.binding ) applyStyle( 'color:' + Config.debugStyles.darkeryellow + ';' , ...args ) };

    _DEBUG_.directive = function(...args){ if( _DEBUG_.level.directive ) applyStyle( 'color:' + Config.debugStyles.orange + ';' , ...args ) };

    _DEBUG_.red = function(...args){  applyStyle( 'color:' + Config.debugStyles.red + ';' , ...args )  };
    _DEBUG_.darkred = function(...args){  applyStyle( 'color:' + Config.debugStyles.darkred + ';' , ...args )  };
    _DEBUG_.green = function(...args){  applyStyle( 'color:' + Config.debugStyles.green + ';' , ...args )  };
    _DEBUG_.blue = function(...args){ applyStyle( 'color:' + Config.debugStyles.blue + ';' , ...args ) };
    _DEBUG_.lightblue = function(...args){ applyStyle( 'color:' + Config.debugStyles.lightblue + ';' , ...args ) };

    // done!
    if (typeof module !== 'undefined' && module.exports) module.exports = _DEBUG_;
    else window._DEBUG_ = _DEBUG_;

})();


