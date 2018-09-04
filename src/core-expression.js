/*
* @Author: colxi
* @Date:   2018-09-02 14:51:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-03 12:19:17
*/
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
    parse: jsep,
    eval: evaluate,
    compile: compile,
    test : {
        outerscope  : 'window',

        getObservablePaths :    function(expression) {
            console.log('Parser.getPaths',expression);
            var ast = Expression.parse(expression);
            if (ast) {
                console.log('Parser.getPaths',ast);
                var paths = new Array();
                this.recurseObservablePaths(ast,paths);
                return paths;
            } else return false;
        },

        recurseObservablePaths  : function(tree,paths,path) {

            if (!tree || !paths) return false;
            if (tree.type =='Identifier') {

                // some sort of global
                console.log('Parser.recurseObservablePaths','adding identifier '+tree.name);
                paths.push({object:this.outerscope,path:tree.name});

            } else if (tree.type =='MemberExpression') {

                // member expression


                if (tree.property.type=='Identifier' || tree.property.type=='Literal') {

                    // like foo[bar][24].quz ; the property is 'quz'
                    // dabble down the object to get the path

                    if (tree.property.type=='Identifier') {
                        path = (path)?'.'+tree.property.name+path:'.'+tree.property.name;
                    } else {
                        path = (path)?'['+tree.property.raw+']'+path:'['+tree.property.raw+']';
                    }

                    if (tree.object.type=='Identifier') {

                        // like foo.bar ; were done with this path - push !
                        console.log('Parser.recurseObservablePaths','adding path '+tree.object.name+path);

                        if (path.indexOf('.')===0) {
                            paths.push({object:tree.object.name,path:path.substring(1)});
                        } else {
                            paths.push({object:this.outerscope,path:tree.object.name+path});
                        }

                    } else {
                        if (tree.object.type=='MemberExpression') {

                            // like foo.bar.quz ; recurse the object
                            console.log('Parser.recurseObservablePaths','recursing member expression ..');
                            this.recurseObservablePaths(tree.object,paths,path);

                        } else {

                            // like foo(bar).quz ; the object is something weird.
                            // ignore the property .. but recurse the object
                            this.recurseObservablePaths(tree.object,paths);

                        }
                    }
                } else {

                    // the property is some sort of thing itself:

                    if (tree.object.type=='Identifier') {

                        // like foo[bar.quz] - push the object, recurse the property
                        console.log('Parser.recurseObservablePaths','adding identifier '+tree.object.name);
                        paths.push({object:this.outerscope,path:tree.object.name});
                        this.recurseObservablePaths(tree.property);

                    } else {

                        // like foo.bar[quz(raz)] ; recurse both
                        console.log('Parser.recurseObservablePaths','recursing member expression ..');
                        this.recurseObservablePaths(tree.object,paths);
                        this.recurseObservablePaths(tree.property,paths);


                    }

                }

            } else if (tree.type=="CallExpression") {

                // like foo.bar(quz.baz) ; we only want the arguments
                this.recurseObservablePaths(tree.arguments,paths);

            } else if (tree.type=="AssignmentExpression") {

                // like foo.bar=baz*quz ; we only want the right hand
                this.recurseObservablePaths(tree.right,paths);

            } else {

                // unknown garbage. dig deeper.
                var props = Object.getOwnPropertyNames(tree);
                for (var pc=0; pc<props.length; pc++) {
                    var key = props[pc];
                    if (typeof tree[key] == 'object') {
                        if (Array.isArray(tree[key])) {
                            for (var kc=0;kc<tree[key].length;kc++) {
                                console.log('Parser.recurseObservablePaths','recursing '+key+':'+kc);
                                this.recurseObservablePaths(tree[key][kc],paths);
                            }
                        } else {
                            console.log('Parser.recurseObservablePaths','recursing '+key);
                            this.recurseObservablePaths(tree[key],paths);

                        }
                    } else {
                        console.log('Parser.recurseObservablePaths','ignoring '+key);
                    }

                }
            }

        }
    }
};

window.Expression= Expression;

export { Expression };
