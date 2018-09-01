"use strict";!function(){let t;try{"[object process]"===Object.prototype.toString.call(global.process)&&(t=global)}catch(e){t=window}function e(t){if("string"!=typeof t)return!1;const e=/\.|\[(.*?)\]/g,r=[];let o,i,s=0;if("."===t[0])return!1;do{if(o=e.exec(t)){if(!1===(i=n(t.substring(s,o.index))))return!1;0!==o.index&&r.push(i),s=o.index}}while(o);return!1!==(i=n(t.substring(s)))&&(r.push(i),r)}function n(t){if("."===t[0])t=t.substring(1);else if("["===t[0]&&(t=t.slice(1,-1).trim())!==String(parseInt(t))){let e=t[0],n=t.slice(-1);if(!('"'===e&&'"'===n||"'"===e&&"'"===n))return!1;t=t.slice(1,-1)}return!!t.length&&t}const r=function(n,r,o){o=o||{},"object"!=typeof n&&("string"==typeof n&&(o=r||{},r=n),n=t),"string"!=typeof r&&new Error('keypath() : Invalid "keyPath" type ("'+r+'")'),"object"!=typeof o&&new Error('keypath() : Invalid "config" type ("'+o+'")'),o.action=-1===["resolve","resolveContext","create","exist","assign"].indexOf(o.action)?"resolve":o.action;let i=e(r);if(!1===i)throw new Error('keypath() : Invalid keyPath format ("'+r+'")');let s=i.splice(-1,1)[0];if(i.length>0)for(let t=0;t<i.length;t++){if(!n.hasOwnProperty(i[t])){if("exist"===o.action)return!1;if("create"!==o.action)throw new Error('keypath() : Cannot resolve keyPath "'+r+'"');i[t+1]===String(parseInt(i[t+1]))?n[i[t]]=[]:n[i[t]]={}}n=n[i[t]]}if("assign"===o.action)n[s]=o.assignValue;else if(n.hasOwnProperty(s)){if("exist"===o.action)return!0}else{if("exist"===o.action)return!1;if("create"!==o.action)throw new Error('keypath() : Cannot resolve last key in keyPath "'+r+'"');n[s]=void 0}return"resolveContext"===o.action?{context:n,property:s}:n[s]};r.defaultContext=function(e){if(void 0===e)return t;if("object"!=typeof e)throw new Error("Keypath.defaultContext() : Context must be a Object");return t=e,!0},r.resolve=function(t,e){let n={action:"resolve"};return e?r(t,e,n):r(t,n)},r.resolveContext=function(t,e){let n={action:"resolveContext"};return e?r(t,e,n):r(t,n)},r.create=function(t,e){let n={action:"create"};return e?r(t,e,n):r(t,n)},r.exist=function(t,e){let n={action:"exist"};return e?r(t,e,n):r(t,n)},r.assign=function(t,e,n){let o={action:"assign"};return 3===arguments.length?(o.assignValue=n,r(t,e,o)):(o.assignValue=e,r(t,o))},r.toArray=function(t){return e(t||"")},"undefined"!=typeof module&&module.exports?module.exports=r:window.Keypath=r}();