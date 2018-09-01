/*
* @Author: colxi
* @Date:   2018-07-17 15:55:37
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-01 00:03:34
*/

import { Keypath } from './core-keypath.js';
import { Config } from './core-config.js';
import { Bindings } from './core-bindings.js';
import { Util } from './core-util.js';
import { Directive } from './core-directive.js';


const Placeholder = {};


/**
 * [Template.Util.removePlaceholderDelimiters description]
 * @param  {[type]} bindName){              ( [description]
 * @return {[type]}             [description]
 */
Placeholder.removeDelimiters = function( placeholder = '' ){
    //
    placeholder = placeholder.trim();
    placeholder = placeholder.slice( Config.placeholderDelimitiers[0].length, ( 0-Config.placeholderDelimitiers[1].length ) );
    return placeholder.trim();
};


/**
 * Template.Util.getFromString(): Return an array with all the tokens found in the
 * provided String. If no tokens are found returns an empty array.
 *
 * @param  {String}  string                 String to analyze
 * @param  {Boolean} stripDelimiters        Return tokens without delimiters
 *
 * @return {Array}                          Array of tokens
 */
Placeholder.getFromString = function( string = '' ){
    // extract all placeholders from string
    let placeholders = string.match( Config._getPlaceholdersExp ) || [];
    // remove duplicates!
    placeholders = Array.from( new Set(placeholders) );
    // remove delimiters (it trims the resulting values too)
    placeholders = placeholders.map( p => Placeholder.removeDelimiters(p) );
    // remove empty strings
    placeholders = placeholders.filter( p => p.length ? true : false );

    return placeholders;
};


/**
 * [getPFromTemplate description]
 * @param  {[type]} element [description]
 * @return {[type]}         [description]
 */
Placeholder.getFromTemplate = function( element ){
    // inspect Attributes
    let placeholders = [];

    if( Bindings.elements.has( element ) ){
        if( element.nodeType === Node.TEXT_NODE ){
            placeholders = Placeholder.getFromString( Bindings.elements.get(element) );
        }else{
            // get all stringTokens in current Element Attribute Template
            let attributes = Bindings.elements.get( element );
            for(let currentAttr in attributes){
                if( !attributes.hasOwnProperty(currentAttr) ) continue;
                let placeholdersPartial = Placeholder.getFromString(  attributes[currentAttr] ) ;

                if( Directive.isDirectiveName( currentAttr ) && !placeholdersPartial.lenght ){
                    // if value is quoted, call binder[bindername].subscribte
                    // with the quoted value
                    let v = attributes[currentAttr].trim();
                    if( Util.isStringQuoted( v ) )continue;
                    // if is a Binder Attribute (eg: pg-model), extract the value
                    else placeholdersPartial = [ v ];
                }
                placeholders = placeholders.concat( placeholdersPartial );
            }
        }
    }
    return placeholders;
};


/**
 * [Template.Util.populateStringPlaceholders description]
 *
 * @param  {[type]} string [description]
 *
 *
 *  @return {[type]}        [description]
 */
Placeholder.populateString = function( string = ''){
    // retrieve all the placeholders contained in the string
    let placeholders = Placeholder.getFromString( string );
    // iterate each placeholder
    placeholders.forEach( placeholder=>{
        let value;
        try{
            let model = Keypath.resolveContext( placeholder );
            value = model.context[model.property];
        }catch(e){
            value = '';
            //console.warn('Placeholder.populatestring(): Model' , placeholder,'does not exist');
        }

        // generate the search regular expresion with the current placeholder
        let search = new RegExp( Config._replacePlaceholdersExpString.replace('__PLACEHOLDER__', placeholder) ,'g');
        // find te value of the Binding placeholder, in  the provided model, and
        // replace every placeholder reference in the string, with it
        string = string.replace( search , value );
    });
    // done! return parsed String
    return string;
};


export { Placeholder };
