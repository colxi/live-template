/*
* @Author: colxi
* @Date:   2018-09-02 14:51:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-15 14:37:23
*/

import { Config } from './core-config.js';
import './lib/jsep.js';

const jsep = window.jsep;
delete window.jsep;




const Expression = {};

Expression.parse = jsep;

Expression.getFromString = function(string){
    // extract all placeholders from string
    let placeholders = string.match( Config._getPlaceholdersExp ) || [];
    // remove duplicates!
    placeholders = Array.from( new Set(placeholders) );
    // remove delimiters (it trims the resulting values too)
    placeholders = placeholders.map( p =>{
        p = p.slice( Config.placeholderDelimitiers[0].length, ( 0-Config.placeholderDelimitiers[1].length ) );
        return p.trim();
    } );
    // remove empty strings
    placeholders = placeholders.filter( p => p.length ? true : false );

    return placeholders;
};

Expression.evaluate = (function(){
    /* Modified version of : https://github.com/donmccurdy/expression-eval/ */
    const binaryOperators = {
        '||' : (a, b) => a || b,
        '&&' : (a, b) => a && b,
        '|'  : (a, b) => a | b,
        '^'  : (a, b) => a ^ b,
        '&'  : (a, b) => a & b,
        '==' : (a, b) => a == b,
        '!=' : (a, b) => a != b,
        '===': (a, b) => a === b,
        '!==': (a, b) => a !== b,
        '<'  : (a, b) => a < b,
        '>'  : (a, b) => a > b,
        '<=' : (a, b) => a <= b,
        '>=' : (a, b) => a >= b,
        '<<' : (a, b) => a << b,
        '>>' : (a, b) => a >> b,
        '>>>': (a, b) => a >>> b,
        '+'  : (a, b) => a + b,
        '-'  : (a, b) => a - b,
        '*'  : (a, b) => a * b,
        '/'  : (a, b) => a / b,
        '%'  : (a, b) => a % b
    };
    const unaryOperators = {
        '-' :  a=> -a,
        '+' :  a=> a,
        '~' :  a=> ~a,
        '!' :  a=> !a,
    };
    const evaluateArray = function( list, context ) {
        //
        return list.map( v=> Expression.evaluate(v, context) );
    };
    const evaluateMember = function( node, context ) {
        const object = Expression.evaluate(node.object, context);
        if ( node.computed ) return [object, object[Expression.evaluate(node.property, context)]];
        else return [object, object[node.property.name]];
    };
    return function( node, context ) {
        if(typeof node === 'string') node = Expression.parse(node);
        switch ( node.type ) {
            case 'ArrayExpression':
                return evaluateArray( node.elements, context );
            case 'BinaryExpression':
                return binaryOperators[ node.operator ]( Expression.evaluate( node.left, context ), Expression.evaluate( node.right, context ) );
            case 'CallExpression':{
                let caller, fn, assign;
                if (node.callee.type === 'MemberExpression') {
                    assign = evaluateMember( node.callee, context );
                    caller = assign[0];
                    fn = assign[1];
                }else fn = Expression.evaluate( node.callee, context );
                if (typeof fn !== 'function') return undefined;
                return fn.apply( caller, evaluateArray( node.arguments, context ) );
            }
            case 'ConditionalExpression':
                return Expression.evaluate( node.test, context )
                    ? Expression.evaluate( node.consequent, context )
                    : Expression.evaluate( node.alternate, context );
            case 'Identifier':
                return context[node.name];
            case 'Literal':
                return node.value;
            case 'LogicalExpression':
                return binaryOperators[ node.operator ]( Expression.evaluate( node.left, context ), Expression.evaluate( node.right, context ) );
            case 'MemberExpression':
                return evaluateMember(node, context)[1];
            case 'ThisExpression':
                return context;
            case 'UnaryExpression':
                return unaryOperators[ node.operator ]( Expression.evaluate( node.argument, context ) );
            default:
                return undefined;
        }
    };
})();

Expression.getKeypaths = (function(){
    const result = [];
    let idCounter = 0;

    function newId(){ return ++idCounter }

    function analyzeNode(node, id){
        if(typeof result[id] === 'undefined') result[id] = [];

        if(node.type === 'MemberExpression'){
            if(node.property.type==='Identifier')  result[id].unshift( node.property.name );
            else if(node.property.type==='Literal')  result[id].unshift( node.property.value );
            else if(node.property.type==='UnaryExpression'){
                result[id].unshift(node.property);
                analyzeNode( node.property.argument, newId() );
            }
            else if(node.property.type==='BinaryExpression' || node.property.type==='LogicalExpression'){
                result[id].unshift(node.property);
                analyzeNode( node.property.left, newId());
                analyzeNode( node.property.right, newId());
            }
            else if(node.property.type === 'CallExpression'){
                console.log(node.property);
                analyzeNode(node.property.callee, newId() );
                for(let i=node.property.arguments.length-1; i>=0; i--){
                    if(node.property.arguments[i].type !== 'Literal') analyzeNode(node.property.arguments[i], newId() );
                }
            }
            else console.warn('unexpected property type in MemberExpression :',node.property.type);
            analyzeNode( node.object,  id);
        }
        else if(node.type === 'Identifier') result[id].unshift( node.name );
        else if(node.type === 'UnaryExpression') analyzeNode( node.argument, id );
        else if(node.type === 'BinaryExpression' || node.type === 'LogicalExpression'){
            if(node.left.type !== 'Literal') analyzeNode( node.left, id);
            if(node.right.type !== 'Literal'){
                if(node.left.type !== 'Literal') analyzeNode( node.right, newId() );
                else analyzeNode( node.right, id );
            }
        }
        else if(node.type === 'CallExpression'){
            result[id].unshift( node.callee );
            for(let i=node.arguments.length-1; i>=0; i--){
                analyzeNode(node.arguments[i], newId() );
            }
        }
        else if(node.type === 'Compound'){
            for(let i=node.body.length-1; i>=0; i--){
                analyzeNode(node.body[i],id);
            }
        }else console.warn('Unexpected node type : ',node.type);
    }


    return function getKeypaths(expression) {
        let ast;
        if(typeof expression === 'string') ast = Expression.parse(expression);
        else ast = expression;

        if (!ast) return false;

        result.length = 0;
        idCounter=0;
        analyzeNode(ast, idCounter );

        for(let i=0; i<result.length; i++){
            if(typeof result[i][0] === 'object' ){
                let node = result.splice(i,1)[0][0];
                analyzeNode(node , idCounter );
            }
        }

        console.table(result)
        return result;
    };
})()


window.Expression= Expression;

export { Expression };
