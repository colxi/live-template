/*
* @Author: colxi  (colxi.kl@gmail.com)
* @Date:   2018-08-04 09:26:27
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-21 23:56:17
* @Webpage: https://www.npmjs.com/package/keypath-resolve
*
* keypath() :         Resolves a string representation of an object key path,
*                     using the provided object as a Context, the global scope
*                     context. Secondary methods allow keypath manipulation
*/
'use strict';

(function(){
    // Configuration
    let DEFAULT;
    // set  DEFAULT global context, according the enviroment
    try {
        if( Object.prototype.toString.call(global.process) === '[object process]' ){
            DEFAULT = global;
        }
    }catch(e) { DEFAULT = window }


    /**
     * keyPathToArray() : Converts a string keypath to an array of keys. It
     * accepts dot notation and brackets notation keypaths. Basic formating
     * validation is performed.
     *
     * @param       keyPath         String representing the keypath
     *
     * @return      Array|false
     */
    function keyPathToArray(keyPath){

        // block if keypath is not a string
        if(typeof keyPath !== 'string') return false;

        const keyRules = /\.|\[(.*?)\]/g;
        const result = [];
        let startIndex = 0;
        let match;
        let keyStr;

        // if keypath starts with a dot, return false
        if( keyPath[0] === '.' ) return false; // Unproperly formated keyStr

        // iterate all keys resulting from the keypath
        do{
            match = keyRules.exec(keyPath);
            if (match){
                // parse and validate the keyStr
                // if Unproperly formated keyStr return false
                keyStr = parseKey( keyPath.substring(startIndex, match.index) );
                if( keyStr === false ) return false;

                // Ignore the blank key found when keypath starts with a bracket
                if( match.index !==0 ) result.push( keyStr );
                startIndex = match.index;
            }
        }while(match);

        // process last key
        // if Unproperly formated keyStr return false
        keyStr = parseKey( keyPath.substring(startIndex) );
        if( keyStr === false ) return false;
        result.push( keyStr );

        // done!
        return result;
    }

    /**
     *
     * parseKey() : Proceses keys strings, and adds another validation layer
     * It can parse regular keys, keys starting with a dot, and keys represented
     * with the bracket notation. Returns a clean key name, or false if
     * inon properly formated key name.
     *
     * @param       keyStr        String  representing the key name
     *
     * @return                       Strung or false if fails
     *
     */
    function parseKey(keyStr){
        if(keyStr[0] === '.'){
            // if key starts with a dot, is a regular key.
            // Remove the dot
            // eg. ".myKey" -> "myKey"
            keyStr=keyStr.substring(1);
        }else if( keyStr[0]==='['){
            // If key starts with a bracket
            // remove brackets and trim the content
            // eg. "[ 'myKey' ]" -> " 'myKey' " -> "'myKey'"
            keyStr = keyStr.slice(1,-1).trim();

            // if key is not an Integer, must be quoted (single or double
            // quotes allowed), if is properly quoted, remove quotes.
            // Returnn false if not properly quoted
            if( keyStr !== String(parseInt(keyStr)) ){
                let first= keyStr[0];
                let last = keyStr.slice(-1);
                if( (first==='"' && last=== '"') ||  (first==='\'' && last=== '\'') ){
                    // remove quotes
                    keyStr= keyStr.slice(1,-1);
                }else return false; // unproperly quoted
            }
        }
        // validate : key string has length after the procesing.
        if( !keyStr.length ) return false; // invalid length

        // done!
        return keyStr;
    }

    /**
     *
     * keypath() : Resolves and manioulate Object and arrays keypaths.
     * This method will start the resolution in the provided context object, or
     * if not present, in the default scope (by default global/window scope)
     *
     *
     * @param  context          Optional. Object to use as scope context.
     *                          If is a string behaves as keypath, and default
     *                          scooe is used as context
     *
     * @param  kp               String representing keypath
     *
     * @param  config           Object (optional)
     *          - action        Accepts : resolve, assign, create, exist and
     *                          resolveContext.
     *          - assignValue   Required when action='assign'
     *
     * @return                  Resolved value, or object, with resolved context
     *                          and property name. Config action changes the
     *                          type of return.
     *
     */
    const Keypath = function( context , kp, config ){

        /*
         -----------------------------------------------------------------------
            Process arguments
         -----------------------------------------------------------------------
        */
        // default arguments values
        config = config || {};

        if(typeof context !== 'object'){
            // if string ... (context not provided)
            if(typeof context === 'string'){
                config = kp || {};
                kp = context;
            }
            context = DEFAULT;
        }

        if(typeof kp !== 'string') new Error('keypath() : Invalid "keyPath" type ("'+kp+'")');
        if(typeof config !== 'object') new Error('keypath() : Invalid "config" type ("'+config+'")');

        config.action = ['resolve','resolveContext', 'create','exist', 'assign'].indexOf(config.action) === -1 ? 'resolve' : config.action;


        /*
         -----------------------------------------------------------------------
            Prepare kp and convert it into an array of keys
         -----------------------------------------------------------------------
        */

        // convert into array of keys. Error if problems found
        let keys = keyPathToArray(kp);
        if(keys === false) throw new Error('keypath() : Invalid keyPath format ("'+kp+'")');



        /*
         -----------------------------------------------------------------------
            Perform keyPath resolution
         -----------------------------------------------------------------------
        */

        // extract the last item in keyoath keys
        let lastKey = ( keys.splice(-1,1) )[0];

        // if keypath conyains multiple keys...
        if( keys.length > 0 ){
            // iterate the keys to obtain each context
            for(let i = 0; i<keys.length;i++){
                // if key/prperty does not exist...
                if( !context.hasOwnProperty(  keys[i] ) ){
                    if(config.action === 'exist') return false;
                    else if(config.action === 'create'){
                        // if next key is a integer, asumemis an array index,
                        // create an array. If not an integer, asume is an object
                        // prooerty, craeate an object
                        if( keys[i+1] === String( parseInt( keys[i+1] ) ) ) context[ keys[i] ] = [];
                        else context[ keys[i] ] = {};
                    }
                    else throw new Error('keypath() : Cannot resolve keyPath "' + kp + '"');
                }
                // assign the currentContext
                context = context[ keys[i] ];
            }
        }

        if(config.action === 'assign') context[ lastKey ] = config.assignValue;
        else{
            // validate last key in keypath and perform appropiate action
            if( !context.hasOwnProperty(lastKey) ){
                if(config.action === 'exist') return false;
                else if(config.action === 'create') context[ lastKey ] = undefined;
                else throw new Error('keypath() : Cannot resolve last key in keyPath "' + kp + '"');
            }else if(config.action === 'exist') return true;
        }

        // done!
        // return value resolution or context (when requested)
        return (config.action==='resolveContext') ? { context : context , property: lastKey} : context[lastKey];
    };




    /*
     -----------------------------------------------------------------------
        PUBLIC API METHODS
     -----------------------------------------------------------------------
    */
    Keypath.defaultContext = function( c ){
        // getter
        if( typeof c === 'undefined') return DEFAULT;
        // setter
        if( typeof c !== 'object' ) throw new Error('Keypath.defaultContext() : Context must be a Object');
        else DEFAULT = c;
        return true;
    };

    Keypath.resolve = function( c , kp ){
        let a = {action : 'resolve'};
        return ( !kp ) ?
            Keypath( c , a ) :
            Keypath( c , kp, a );
    };

    Keypath.resolveContext = function( c , kp ){
        let a = {action : 'resolveContext'};
        return ( !kp ) ?
            Keypath( c , a ) :
            Keypath( c , kp, a );
    };

    Keypath.create = function( c , kp ){
        let a = {action : 'create'};
        return ( !kp ) ?
            Keypath( c , a ) :
            Keypath( c , kp, a );
    };

    Keypath.exist = function( c , kp ){
        let a = {action : 'exist'};
        return ( !kp ) ?
            Keypath( c , a ) :
            Keypath( c , kp, a );
    };

    Keypath.assign = function( c , kp , value){
        let a = {action : 'assign'};
        if( arguments.length === 3){
            a.assignValue = value;
            return Keypath( c , kp, a );
        }else{
            a.assignValue = kp;
            return Keypath( c , a );
        }
    };

    Keypath.toArray = function( kp ){
        return keyPathToArray( kp || '' );
    };

    // Export method if running in node module, or declare it in the
    // window global scope if not
    if (typeof module !== 'undefined' && module.exports ) module.exports = Keypath;
    else window.Keypath = Keypath;

})();
