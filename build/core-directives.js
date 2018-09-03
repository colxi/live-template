import{Config}from"./core-config.js";import{Directive}from"./core-directive.js";import{Placeholder}from"./core-placeholder.js";import{Bindings}from"./core-bindings.js";import{Bind}from"./core-bind.js";import{Keypath}from"./core-keypath.js";import{Util}from"./core-util.js";const Directives={};Directives.value={bind:function(e,t,i){_DEBUG_.directive("Directives.value.bind() : Bindng "+t+" ->",{element:e}),Bind.event(e,"input",r=>this.publish(e,t,i,r.target.value))},subscribe:function(e,t,i,r){_DEBUG_.directive("Directives.value.subscribe() : Subscribe "+t+' -> "'+r+'" to ',{element:e}),e.value=r||""},publish:function(e,t,i,r){if(_DEBUG_.directive("Directives.value.pusblish() : Publish "+r+' -> "'+t+'" from ',{element:e}),Keypath.exist(t)){let e=Keypath.resolveContext(t);e.context[e.property]=r}else console.log("Keypath cant be resolved (model doesnt exist)")}},Directives.on={bind:function(e,t,i){Bind.event(e,i[0],r=>this.publish(e,t,i,r))},publish:function(e,t,i,r){Keypath.resolve(t)(r)}},Directives.if={subscribe:function(e,t,i,r){"string"==typeof r&&0===r.length&&(r=!1),r?e.style.display="":e.style.setProperty("display","none","important")}},Directives.for={block:!0,unbind:function(e,t){if(!Bindings.iterators.hasOwnProperty(t))throw new Error("Directive.for.unbind(): No iterator exists for the provided keypath: "+t);if(!Bindings.iterators[t].has(e))throw new Error("Directive.for.unbind(): This element has no iterator with the keypath: "+t);for(Bindings.iterators[t].delete(e),Bindings.iterators[t].size||delete Bindings.iterators[t];e.firstChild;)e.firstChild.remove()},bind:function(e,t,i){if(_DEBUG_.directive("Directives.for.bind() : Bindng Iterator "+t+" ->",{element:e}),!Keypath.exist(t))throw new Error("Directives.for.bind(): model does not exist!!! "+t);if(Bindings.iterators.hasOwnProperty(t)){if(Bindings.iterators[t].has(e))throw new Error("Element has already an iteraor!")}else Bindings.iterators[t]=new Map;for(Bindings.iterators[t].set(e,{keypath:t,element:e,elementContent:e.firstElementChild.cloneNode(!0),iterableCached:[],token:i[0],index:e.getAttribute(Config.directivePrefix+":index"),initiated:!1});e.firstChild;)e.firstChild.remove()},_iteratorNode:function(e,t,i){i||(i=e.elementContent.cloneNode(!0));let r=e.index,n=new RegExp(Config._replacePlaceholdersExpString.replace("__PLACEHOLDER__",r),"g"),o=Array.from(i.attributes);for(let i=0;i<o.length;i++){let r=o[i].value;if(void 0!==e.index&&(r=r.replace(n,t)),r!==o[i].value){o[i].value=r;continue}let l=[];if(Directive.isDirectiveName(o[i].name)){if(Util.isStringQuoted(o[i].value))continue;l=[o[i].value.trim()]}else l=Placeholder.getFromString(r);l.forEach(i=>{let n=Keypath.toArray(i);if(n[0]!==e.token)return;n[0]=e.keypath+"."+t;let o=n.join(".");r=r.replace(new RegExp(i,"g"),o)}),o[i].value=r}let l=Util.getElementTextNodes(i);for(let i=0;i<l.length;i++){let r=l[i],o=r.textContent;void 0!==e.index&&(o=o.replace(n,t)),Placeholder.getFromString(o).forEach(i=>{let r=Keypath.toArray(i);if(r[0]!==e.token)return;r[0]=e.keypath+"."+t;let n=r.join(".");o=o.replace(new RegExp(i,"g"),n)}),r.textContent=o}let s=Array.from(i.children);for(let i=0;i<s.length;i++)Directives.for._iteratorNode(e,t,s[i]);return i},subscribe:function(e,t,i,r){_DEBUG_.directive("Directives.for.subscribe() : "+t,{element:e});const n=Bindings.iterators[t].get(e);console.log(n,e,t);const o=n.iterableCached;n.iterableCached=r.slice(0);const l=[];for(let e=0;e<r.length;e++)r[e]!==o[e]&&l.push(e);if(o.length>r.length){const t=o.length-r.length;for(let i=0;i<t;i++)e.lastElementChild.remove()}const s=Array.from(e.children);for(let t=0;t<l.length;t++){const i=l[t],r=Directives.for._iteratorNode(n,i);s[i]?(s[i].parentNode.insertBefore(r,s[i].nextSibling),s[i].remove()):e.appendChild(r)}if(!n.initiated){let t=Array.from(e.children);for(let e=0;e<t.length;e++)console.warn(t[e]),Bind.element(t[e]);n.initiated=!0}return!0}};export{Directives};