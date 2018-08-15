/*
* @Author: colxi
* @Date:   2018-07-17 15:55:37
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-14 19:19:46
*/

import { Config } from './core-config.js';
import { Bindings } from './core-bindings.js';
import { Util } from './core-util.js';
import { Directives } from './core-directives.js';
import '../node_modules/deep-observer/src/deep-observer.js';
import '../node_modules/keypath-resolve/src/keypath-resolve.js';


const Placeholder = {
    /**
     * [Template.Util.removePlaceholderDelimiters description]
     * @param  {[type]} bindName){              ( [description]
     * @return {[type]}             [description]
     */
    removeDelimiters( placeholder = '' ){
        //
        placeholder = placeholder.trim();
        placeholder = placeholder.slice( Config.placeholderDelimitiers[0].length, ( 0-Config.placeholderDelimitiers[1].length ) );
        return placeholder.trim();
    },
    /**
     * Template.Util.getFromString(): Return an array with all the tokens found in the
     * provided String. If no tokens are found returns an empty array.
     *
     * @param  {String}  string                 String to analyze
     * @param  {Boolean} stripDelimiters        Return tokens without delimiters
     *
     * @return {Array}                          Array of tokens
     */
    getFromString( string = '' ){
        // extract all placeholders from string
        let placeholders = string.match( Config._getPlaceholdersExp ) || [];
        // remove duplicates!
        placeholders = Array.from( new Set(placeholders) );
        placeholders = placeholders.map( current => Placeholder.removeDelimiters(current) );
        // strip delimiters from token...
        return placeholders;
    },
    /**
     * [getPFromTemplate description]
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */
    getFromTemplate : function( element ){
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

                    if( Directives.validateName( currentAttr ) && !placeholdersPartial.lenght ){
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
    },
    /**
     * [Template.Util.populateStringPlaceholders description]
     *
     * @param  {[type]} string [description]
     *
     *
     *  @return {[type]}        [description]
     */
    populateString( string = ''){
        // retrieve all the placeholders contained in the string
        let placeholders = Placeholder.getFromString( string );
        // iterate each placeholder
        placeholders.forEach( placeholder=>{
            let value;
            try{
                let model = Keypath.resolveContext( Observer._enumerate_(),  placeholder );
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
    }

};

export { Placeholder };
