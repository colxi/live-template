import{Keypath}from"./core-keypath.js";import{Bindings}from"./core-bindings.js";import{Directive,Directives}from"./core-directives.js";import{Placeholder}from"./core-placeholder.js";const Subscribe={model:function(e,i){console.log("Subscribe.model(): ",e),Bindings.placeholders.hasOwnProperty(e)&&Bindings.placeholders[e].forEach(i=>{if(i.nodeType===Node.ELEMENT_NODE&&i.hasAttributes()){let t=Bindings.elements.get(i);for(let r in t)if(t.hasOwnProperty(r))if(Directive.isDirectiveName(r)&&Directive.exist(r)){const t=r.split("-"),o=t[1],s=t.slice(1),l=Keypath.resolve(e);Directives[o].hasOwnProperty("subscribe")&&Directives[o].subscribe(i,e,s,l)}else _DEBUG_.lightblue("Subscribe.model(): Updating placeholder in Attribute ...",r+"="+t[r]),i.setAttribute(r,Placeholder.populateString(t[r]))}else _DEBUG_.lightblue("Subscribe.model(): Updating placeholder in texNode...",e),i.textContent=Placeholder.populateString(Bindings.elements.get(i))});const t=Keypath.resolveContext(e);if(Array.isArray(t.context)){let i=e.split("."),t=i.splice(-1);if(i=i.join("."),Bindings.iterators.hasOwnProperty(i)&&"length"===t[0]){console.log("..................");let e=Bindings.iterators[i];Directives.for.subscribe(e.element,i,["for"])}}},dom:function(e){switch(console.log("Subscribe.dom():","Element("+e.action+"ed)",e.keyPath),e.action){case"add":case"update":Subscribe.model(e.keyPath,e.object)}}};export{Subscribe};