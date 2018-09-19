/*
* @Author: colxi
* @Date:   2018-07-17 21:25:22
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-16 23:14:44
*/


const Util = {
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


