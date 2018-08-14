/*
* @Author: colxi
* @Date:   2018-07-17 21:25:22
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-13 15:11:42
*/

import { Config } from './core-config.js';
import '../node_modules/deep-observer/src/deep-observer.js';

const Util = {
    /**
     * [inDOM description]
     * @param  {[type]} el [description]
     * @return {[type]}    [description]
     */
    DOMContains( el ) {
        if( !el ) return false;
        while ( el = el.parentNode ) if ( el === document ) return true;
        return false;
    },
    /**
     * [getElementTextNodes description]
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */
    getElementTextNodes : function(element){
        let textNodes = [];
        // if element is a TextNode return itself inside the array
        if( element.nodeType === Node.TEXT_NODE ) textNodes.push( element );
        else{
            // is element is a Script or Style return empty array (don't analyze them)
            if( element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return textNodes;
            // else... insert all textnodes inside the array
            element.childNodes.forEach( childNode=>{
                if( childNode.nodeType === Node.TEXT_NODE ) textNodes.push( childNode );
            });
        }
        return textNodes;
    },
    /**
     * [stringHasSpaces description]
     * @param  {[type]} string [description]
     * @return {[type]}        [description]
     */
    stringHasSpaces: function(string){
        if( typeof string !== 'string'){
            throw new Error('Template.Util.stringHasSpaces() : Provided value is not a String');
        }
        return /\s/.test( string );
    },
    /**
     * [isStringQuoted description]
     * @param  {[type]}  string [description]
     * @return {Boolean}        [description]
     */
    isStringQuoted: function( string ){
        string = string.trim();
        let firstChar   = string.slice(0,1);
        let lastChar    = string.slice(-1);

        if( ( firstChar === '\'' && lastChar === '\'') || ( firstChar === '"' && lastChar === '"')  ) return true;
        else return false;
    },
    /**
     * Template.Directives.validateName() : If the attribute name has a binder name syntax
     * structure return the binder name, if not , return false
     *
     * @param  {[type]}  attrName [description]
     * @return {Boolean}          [description]
     */
    /*
    moved to to Directives.validateName()
    isDirectiveName( attrName, directivePrefix ){
        //
        let binderNameParts = attrName.split('-');
        if ( binderNameParts[0] !== directivePrefix ) return false;
        else return true;

        //return ( attrName.substring(0, (Config.directivePrefix.length+1)) == Config.directivePrefix + "-") ? attrName.substring(3) : false;
    },
    */
    /**
     * [Template.Util.resolveKeyPath description]
     * @param  {[type]} keyPath [description]
     * @return {[type]}         [description]
    resolveKeyPath( keyPath ){
        // split the string in the diferent path ObserbableObjects
        let parts = keyPath.split('.');
        // extract the last item (asume is the property)
        let bindName = ( parts.splice(-1,1) )[0];

        let result;

        if( parts.length === 0 ){
            console.warn('Util.resolveKeyPath() : At least one property must be passed', keyPath)
            return false;
        }else{
            //
            // keys are found, iterate them to generate the model context
            //
            let context = Observer(parts[0]);

            if(typeof context === 'undefined' ){
                //console.warn('Model does not exist', parts[0] );
                return false;
            }

            for(let i = 1; i<parts.length;i++){
                if( !context.hasOwnProperty(  parts[i] ) ){
                    //console.warn('property does not exist in  model', keyPath, parts[i] );
                    return false;
                    // if model context does not exist, create it
                    //context[ parts[i] ] = {};
                }
                // assign the context
                context = context[ parts[i] ];
            }
            if( !context.hasOwnProperty( bindName ) ){
                console.warn('property does not exist in  model', keyPath, bindName );
                return false;
            }
            // generate the output object
            result = { context : context , key : bindName };
        }
        // done!
        return result;
    }
         */

}

export { Util };


