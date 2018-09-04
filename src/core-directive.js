/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-01 00:40:05
*/

import { Config } from './core-config.js';
import { Directives } from './core-directives.js';


const Directive = {};


/**
 * Directive.isDirectiveName() : Performs a check on the string provided, to
 * determinate if it matches to the Directive name syntactical pattern :
 * <prefix>-directiveName-*
 *
 * @param  {String}     directiveName       String to test
 *
 * @return {Boolean}                        Result of the test
 */
Directive.isDirectiveName = function( directiveName ){
    // Split the string in each found dash (-) char
    let parts = directiveName.split('-');

    // at least 2 portions should be detected
    if ( parts.length  < 2 ) return false;
    // in order to be a directive name, first ortion of the name must match with
    // the value of Config.directivePrefix
    if ( parts[0] !== Config.directivePrefix ) return false;

    return true;
};


/**
 * Directive.nameUnpack() : Returns an object containing the prefix, the name,
 * and the arguments of the directive
 *
 * @param  {String}         directiveName       String containing the name
 *
 * @return {Object}
 */
Directive.nameUnpack = function( directiveName ){
    if( !Directive.isDirectiveName(directiveName) ) throw new Error('Directive.nameUnpack() : Invalid directive name ('+directiveName+')');

    const parts = directiveName.split('-');

    // return an object with the parts
    return {
        prefix    : parts[0],
        name      : parts[1],
        arguments : parts.splice(2)
    };
};


/**
 * Directive.isBlocking() : Directives can block the directive Container children
 * to be binded, when the 'block' property is set to true in the directive
 * registration stage. Check if the provded directve is a blicking one.
 * Note: accepts directiveName arg to be prefixed, or not.
 *
 * @param  {String}         directiveName       String containing the name
 *
 * @return {Boolean}                            Result of the test
 */
Directive.isBlocking = function( directiveName ){
    // try to extract the prefix. if it fails assume the unprefixed
    // representation of the directive name  has been provided
    const parts = directiveName.split('-');
    const name = ( parts[0] === Config.directivePrefix ) ? parts[1] : directiveName;
    // throw error ifdirective does not exist
    if( !Directive.exist(name) ) throw new Error('Directive.isBlocking() : Directive does nit exist ('+directiveName+')');

    return (Directives[name].block === true) ? true : false;
};


/**
 * Directive.exist() :Test if directivename has been registered.
 * Note: accepts directiveName arg to be prefixed, or not.
 *
 * @param  {String}         directiveName       String containing the name
 *
 * @return {Boolean}                            Result of the test
 */
Directive.exist = function( directiveName ){
    // try to extract the prefix. if it fails assume the unprefixed
    // representation of the directive name has been provided
    const parts = directiveName.split('-');
    const name = ( parts[0] === Config.directivePrefix ) ? parts[1] : directiveName;
    // test to check if directive name exists
    return Directives.hasOwnProperty(name);
};



export { Directive };
