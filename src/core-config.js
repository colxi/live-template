/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-14 13:10:32
*/
import { Bindings } from './core-bindings.js';
import { Util } from './core-util.js';



/*
    const expresion = {
        tokenMatch : /"(.*?)"/g, // /\${[^{}]*}/g,     older: /(?<!\\)\${[^{}]*}/g,
        tokenReplace : '(?<!\\\\)\\${\\s*__TOKEN__\\s*}'
    };
*/


const Config = {
    directivePrefix         : 'pg',
    placeholderDelimitiers  : ['{' , '}'],
    modelsNamesExtension    : '.js',
    viewsNamesExtension     : '.html',
    modelsPath              : './models/',
    viewsPath               : './views/',
    _getPlaceholdersExp             : undefined,
    _replacePlaceholdersExpString   : undefined
};


const ConfigInterface = {
    // Getters
    get directivePrefix(){ return Config.directivePrefix},
    get placeholderDelimitiers(){ return Config.placeholderDelimitiers },
    get modelsNamesExtension(){ return Config.modelsNamesExtension },
    get viewsNamesExtension(){ return Config.viewsNamesExtension },
    get modelsPath(){ return Config.modelsPath },
    get viewsPath(){ return Config.viewsPath },
    get _getPlaceholdersExp(){ return Config._getPlaceholdersExp },
    get _replacePlaceholdersExpString(){  return Config._replacePlaceholdersExpString },


    // Setters
    set directivePrefix( value ){
        // value validation
        if( typeof value !== 'string' ) throw new Error('Config:directivePrefix : Value must be a String.');
        value = value.trim().toLowerCase();
        if( !value.length  ) throw new Error('Config:directivePrefix : Value can\'t be an empty String.');
        if( value.indexOf('-') !== -1 ) throw new Error('Config:directivePrefix : Value can\'t contain dashes ("-").');
        if( Util.stringHasSpaces( value ) ) throw new Error('Config:directivePrefix : Value can\'t contain spaces.');
        // done! accepted!
        Config.directivePrefix = value;
        return true;
    },
    set placeholderDelimitiers( value ){
        if( typeof value === 'string' ) value = [value, value];
        if( !Array.isArray( value ) ) throw new Error('Config:placeholderDelimitiers : Value must be an Array, or a String');
        if( value.length !== 2 ) throw new Error('Config:placeholderDelimitiers : Array must contain 2 keys.');
        if( typeof value[0] !== 'string' || typeof value[1] !== 'string' ) throw new Error('Config:placeholderDelimitiers : Array keys must be String.');
        // trim the strings
        value = value.map( v => v.trim() );
        if( !value[0].length || !value[1].length ) throw new Error('Config:placeholderDelimitiers: Values can\'t be empty Strings.');

        // allow delimiters change only if there are no active bindings
        if( Object.keys(Bindings.placeholders).length ) throw new Error('Config:placeholderDelimitiers: Unbind all active bindings first, to change the delimiters.');

        // done !
        Config.placeholderDelimitiers = value;

        // generate the regular expression string
        let _regExpMatch = '__LEFT_DELIMITER__(.*?)__RIGHT_DELIMITER__';
        _regExpMatch = _regExpMatch.replace( '__LEFT_DELIMITER__', Config.placeholderDelimitiers[0] );
        _regExpMatch = _regExpMatch.replace( '__RIGHT_DELIMITER__', Config.placeholderDelimitiers[1] );
        // generate the regular expression
        Config._getPlaceholdersExp  = new RegExp( _regExpMatch ,'g');

        // generate string to use in placeholder replacement regExps
        let _regExpReplace ='__LEFT_DELIMITER__(\\s*__PLACEHOLDER__\\s*)__RIGHT_DELIMITER__';
        _regExpReplace = _regExpReplace.replace( '__LEFT_DELIMITER__', Config.placeholderDelimitiers[0] );
        _regExpReplace = _regExpReplace.replace( '__RIGHT_DELIMITER__', Config.placeholderDelimitiers[1] );
        Config._replacePlaceholdersExpString = _regExpReplace;

        return true;
    },
    set modelsNamesExtension( value ){
        if( typeof value !== 'string' ) throw new Error('Config:modelsNamesExtension : Value must be a String.');
        value = value.trim();
        if( Util.stringHasSpaces( value ) ) throw new Error('Config:modelsNamesExtension : Value can\'t contain spaces.');
        // done! accepted!
        Config.modelsNamesExtension = value;
        return true;
    },
    set viewsNamesExtension( value ){
        if( typeof value !== 'string' ) throw new Error('Config:viewsNamesExtension : Value must be a String.');
        value = value.trim();
        if( Util.stringHasSpaces( value ) ) throw new Error('Config:viewsNamesExtension : Value can\'t contain spaces.');
        // done! accepted!
        Config.viewsNamesExtension = value;
        return true;
    },
    set modelsPath( value ){
        // value validation
        if( typeof value !== 'string' ) throw new Error('Config:modelsPath : Value must be a String.');
        value = value.trim();
        if( Util.stringHasSpaces( value ) ) throw new Error('Config:modelsPath : Value can\'t contain spaces.');
        if ( value.slice(-1) !== '/' ) value += '/';
        // done! accepted!
        Config.modelsPath = value;
        return true;
    },
    set viewsPath( value ){
        // value validation
        if( typeof value !== 'string' ) throw new Error('Config:viewsPath : Value must be a String.');
        value = value.trim();
        if( Util.stringHasSpaces( value ) ) throw new Error('Config:viewsPath : Value can\'t contain spaces.');
        if ( value.slice(-1) !== '/' ) value += '/';
        // done! accepted!
        Config.viewsPath = value;
        return true;
    }
};

// trigger the regular expression generate for the placeholder selector
ConfigInterface.placeholderDelimitiers = Config.placeholderDelimitiers;


export { Config, ConfigInterface };
