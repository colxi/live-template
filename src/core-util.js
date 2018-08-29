/*
* @Author: colxi
* @Date:   2018-07-17 21:25:22
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-24 11:33:01
*/


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

    getParents ( el ) {
        if( !el ) return false;
        let p=[];
        while ( el = el.parentNode ) p.push(el)
        return p;
    },
    /**
     * [getElementTextNodes description]
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */
    getElementTextNodes : function(element){

        //
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

    unquoteString: function( string ){
        if( Util.isStringQuoted(string) ){
            string = string.trim();
            return string.substring( 1, string.length-1 );
        }else return string;
    }

}

export { Util };


