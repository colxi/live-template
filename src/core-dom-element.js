/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-16 23:28:25
*
* @Description : Collection of methods and utilities required for common
* HTML Element manipulation and interaction.
*
*/

import { Config } from './core-config.js';

const DOMElement = {};


/**
 * [getParents description]
 * @param  {[type]} el [description]
 * @return {[type]}    [description]
 */
DOMElement.getParents = function( el ) {
    if( !el ) return false;
    let p=[];
    while ( (el = el.parentNode) ) p.push(el);
    return p;
};


/**
 * [getTextNodes description]
 * @param  {[type]} element [description]
 * @return {[type]}         [description]
 */
DOMElement.getTextNodes = function(element){
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
};


/**
 * [spawnExpressionNodes description]
 * @param  {[type]} element [description]
 * @return {[type]}         [description]
 */
DOMElement.spawnExpressionNodes = function(element){
    let expressionNodes = [];
    // if element is a txtNode, DOMElement.getTextNodes will return an array
    // with a single textnode item (itself), otherwise, an array with all the
    // element textnodes.
    DOMElement.getTextNodes( element ).forEach( textNode => {
        while(true){
            const match =  Config._getPlaceholdersExp.exec(textNode.nodeValue);
            if(match === null) break;
            textNode = textNode.splitText( match.index );
            expressionNodes.push(textNode);
            textNode = textNode.splitText( match[0].length );
        }
    });
    return expressionNodes;
};


/*
// not used
DOMElement.isChildOf = function( el , root ) {
    if( !el ) return false;
    while ( (el = el.parentNode) ) if ( el === root ) return true;
    return false;
};
*/

export { DOMElement };

