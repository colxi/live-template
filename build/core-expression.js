import"./lib/jsep.js";const jsep=window.jsep;delete window.jsep;var binops={"||":(e,r)=>e||r,"&&":(e,r)=>e&&r,"|":(e,r)=>e|r,"^":(e,r)=>e^r,"&":(e,r)=>e&r,"==":(e,r)=>e==r,"!=":(e,r)=>e!=r,"===":(e,r)=>e===r,"!==":(e,r)=>e!==r,"<":(e,r)=>e<r,">":(e,r)=>e>r,"<=":(e,r)=>e<=r,">=":(e,r)=>e>=r,"<<":(e,r)=>e<<r,">>":(e,r)=>e>>r,">>>":(e,r)=>e>>>r,"+":(e,r)=>e+r,"-":(e,r)=>e-r,"*":(e,r)=>e*r,"/":(e,r)=>e/r,"%":(e,r)=>e%r},unops={"-":function(e){return-e},"+":function(e){return e},"~":function(e){return~e},"!":function(e){return!e}};function evaluateArray(e,r){return e.map(function(e){return evaluate(e,r)})}function evaluateMember(e,r){var t=evaluate(e.object,r);return e.computed?[t,t[evaluate(e.property,r)]]:[t,t[e.property.name]]}function evaluate(e,r){switch(e.type){case"ArrayExpression":return evaluateArray(e.elements,r);case"BinaryExpression":return binops[e.operator](evaluate(e.left,r),evaluate(e.right,r));case"CallExpression":var t,n,a;if("MemberExpression"===e.callee.type?(t=(a=evaluateMember(e.callee,r))[0],n=a[1]):n=evaluate(e.callee,r),"function"!=typeof n)return;return n.apply(t,evaluateArray(e.arguments,r));case"ConditionalExpression":return evaluate(e.test,r)?evaluate(e.consequent,r):evaluate(e.alternate,r);case"Identifier":return r[e.name];case"Literal":return e.value;case"LogicalExpression":return binops[e.operator](evaluate(e.left,r),evaluate(e.right,r));case"MemberExpression":return evaluateMember(e,r)[1];case"ThisExpression":return r;case"UnaryExpression":return unops[e.operator](evaluate(e.argument,r));default:return}}function compile(e){return evaluate.bind(null,jsep(e))}const Expression={parse:jsep,eval:evaluate,compile:compile,getIdentifiers:function(){const e=function(r,t,n=""){if(!r||!t)return!1;if("Identifier"===r.type)t.push({object:"window",path:r.name});else if("MemberExpression"===r.type)"Identifier"===r.property.type||"Literal"===r.property.type?(n="Identifier"===r.property.type?"."+r.property.name+n:"["+r.property.raw+"]"+n,"Identifier"==r.object.type?0===n.indexOf(".")?t.push({object:r.object.name,path:n.substring(1)}):t.push({object:"window",path:r.object.name+n}):"MemberExpression"==r.object.type?e(r.object,t,n):e(r.object,t)):"Identifier"==r.object.type?(t.push({object:"window",path:r.object.name}),e(r.property)):(e(r.object,t),e(r.property,t));else if("CallExpression"===r.type)e(r.arguments,t);else for(var a=Object.getOwnPropertyNames(r),o=0;o<a.length;o++){var s=a[o];if("object"==typeof r[s])if(Array.isArray(r[s]))for(var i=0;i<r[s].length;i++)e(r[s][i],t);else e(r[s],t);else console.log("Parser.recurseObservablePaths","ignoring "+s)}};return function(r){var t=Expression.parse(r);if(!t)return!1;var n=new Array;return e(t,n),n}}()};window.Expression=Expression;export{Expression};