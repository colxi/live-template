import{Config}from"./core-config.js";import{Directives}from"./core-directives.js";const Directive={isDirectiveName:function(i){let e=i.split("-");return!(e.length<2)&&e[0]===Config.directivePrefix},nameUnpack:function(i){if(!Directive.isDirectiveName(i))throw new Error("Directive.nameUnpack() : Invalid directive name ("+i+")");const e=i.split("-");return{prefix:e[0],name:e[1],arguments:e.splice(2)}},isBlocking:function(i){const e=i.split("-"),r=e[0]===Config.directivePrefix?e[1]:i;if(!Directive.exist(r))throw new Error("Directive.isBlocking() : Directive does nit exist ("+i+")");return!0===Directives[r].block},exist:function(i){const e=i.split("-"),r=e[0]===Config.directivePrefix?e[1]:i;return Directives.hasOwnProperty(r)}};export{Directive};