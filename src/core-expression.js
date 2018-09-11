/*
* @Author: colxi
* @Date:   2018-09-02 14:51:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-07 23:51:46
*/

import { Config } from './core-config.js';
import './lib/jsep.js';

const jsep = window.jsep;
delete window.jsep;


/**
 * Evaluation code from JSEP project, under MIT License.
 * Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
 */

var binops = {
    '||':   (a, b) => a || b,
    '&&':   (a, b) => a && b,
    '|':    (a, b) => a | b,
    '^':    (a, b) => a ^ b,
    '&':    (a, b) => a & b,
    '==':   (a, b) => a == b,
    '!=':   (a, b) => a != b,
    '===':  (a, b) => a === b,
    '!==':  (a, b) => a !== b,
    '<':    (a, b) => a < b,
    '>':    (a, b) => a > b,
    '<=':   (a, b) => a <= b,
    '>=':   (a, b) => a >= b,
    '<<':   (a, b) => a << b,
    '>>':   (a, b) => a >> b,
    '>>>':  (a, b) => a >>> b,
    '+':    (a, b) => a + b,
    '-':    (a, b) => a - b,
    '*':    (a, b) => a * b,
    '/':    (a, b) => a / b,
    '%':    (a, b) => a % b
};

var unops = {
    '-' :  function (a) { return -a; },
    '+' :  function (a) { return a; },
    '~' :  function (a) { return ~a; },
    '!' :  function (a) { return !a; },
};

function evaluateArray ( list, context ) {
    return list.map(function (v) { return evaluate(v, context); });
}

function evaluateMember ( node, context ) {
    var object = evaluate(node.object, context);
    if ( node.computed ) {
        return [object, object[evaluate(node.property, context)]];
    } else {
        return [object, object[node.property.name]];
    }
}

function evaluate ( node, context ) {
    if(typeof node === 'string') node = Expression.parse(node);
    switch ( node.type ) {

        case 'ArrayExpression':
            return evaluateArray( node.elements, context );

        case 'BinaryExpression':
            return binops[ node.operator ]( evaluate( node.left, context ), evaluate( node.right, context ) );

        case 'CallExpression':
            var caller, fn, assign;
            if (node.callee.type === 'MemberExpression') {
                assign = evaluateMember( node.callee, context );
                caller = assign[0];
                fn = assign[1];
            } else {
                fn = evaluate( node.callee, context );
            }
            if (typeof fn  !== 'function') { return undefined; }
            return fn.apply( caller, evaluateArray( node.arguments, context ) );

        case 'ConditionalExpression':
            return evaluate( node.test, context )
                ? evaluate( node.consequent, context )
                : evaluate( node.alternate, context );

        case 'Identifier':
            return context[node.name];

        case 'Literal':
            return node.value;

        case 'LogicalExpression':
            return binops[ node.operator ]( evaluate( node.left, context ), evaluate( node.right, context ) );

        case 'MemberExpression':
            return evaluateMember(node, context)[1];

        case 'ThisExpression':
            return context;

        case 'UnaryExpression':
            return unops[ node.operator ]( evaluate( node.argument, context ) );

        default:
            return undefined;
    }

}

function compile (expression) {
    return evaluate.bind(null, jsep(expression));
}

const Expression = {
    getFromString: function(string){
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
    },
    parse: jsep,
    evaluate: evaluate,
    compile: compile,
    getKeypaths: (function(){
        let result = [];
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
                else if(node.property.type==='BinaryExpression'  || node.property.type==='LogicalExpression'){
                    result[id].unshift(node.property);
                    analyzeNode( node.property.left, newId());
                    analyzeNode( node.property.right, newId());
                }
                else console.warn('unexpected property type in MemberExpression',node.property.type);
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
                //analyzeNode( node.callee, id );
                result[id].unshift( node.callee );
                for(let i=node.arguments.length-1; i>=0; i--){
                    analyzeNode(node.arguments[i], newId() );
                }
            }
            else if(node.type === 'Compound'){
                for(let i=node.body.length-1; i>=0; i--){
                    analyzeNode(node.body[i],id);
                }
            }else console.warn('unexpected nodevtype',node.type);
        }


        return function getKeypaths(expression) {
            var ast;
            if(typeof expression === 'string') ast = Expression.parse(expression);
            else ast = expression;

            if (!ast) return false;

            //console.clear()
            console.log(expression)
            console.log('AST:',ast)
            console.log('---')

            result=[];
            idCounter=0;
            analyzeNode(ast, idCounter );
            console.table(result)
            return result;
            /*
            var paths = new Array();
            recurseObservablePaths(ast,paths);
            return paths;
            */
        };
    })()
};

window.Expression= Expression;

export { Expression };
