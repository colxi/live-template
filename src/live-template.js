/*
* @Author: colxi.kl
* @Date:   2018-05-18 03:45:24
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-02 15:46:36
*/
/* global _DEBUG_ */

import './log.js';

import { Config , ConfigInterface } from './core-config.js';
import { Observer } from './core-observer.js';
import { Keypath } from './core-keypath.js';
import { Bind } from './core-bind.js';
import { Unbind } from './core-unbind.js';
import { Util } from './core-util.js';
import { Bindings } from './core-bindings.js';
import { Subscribe } from './core-subscribe.js';
import { Debug } from './debugger/debugger.js';


import { Expression } from './core-expression.js';


Keypath.defaultContext( Observer._enumerate_() );

let _DOM_OBSERVER_ = new MutationObserver( mutationsList => {
    for(let mutation of mutationsList){
        if (mutation.type !== 'childList') continue;
        // first unbind Removed Nodes
        console.log(mutation.removedNodes)
        //const elements = Array.from(mutation.removedNodes).filter( e => e.nodeType === Node.ELEMENT_NODE );
        //elements.forEach(  Unbind.element );
        Array.from(mutation.removedNodes).forEach( Unbind.element );
        // and then Added Nodes
        mutation.addedNodes.forEach( Bind.element );
        Debug.loadTab();
    }
    // done !
});



const Template = window.Template =  function( _binding ){
    /*
    new Template({
        target : document.getElementById(''),
        model : 'sample1',
        view : ´
            <div>
                {myModel.text}
            </div>
        ´,
    })
    */

};


/**
 * [init description]
 * @return {[type]} [description]
 */
Template.create = function( element ){
    // todo: should accept  element or string selector.
    // f element orf element resulting from string selector, is a child of a
    // element linked to a root binding , bunding is redundant and should be declined

    if(typeof element === 'string') element = document.querySelectorAll( element )[0];

    if(typeof element === 'undefined') element = document.documentElement;
    else if( !(element instanceof HTMLElement) ) throw new Error('Template.bind(): Invalid input');

    // block if he elmntmor any of its parents is already in use by a template
    if( Bindings.templates.has(element) || ( Util.getParents(element) ).filter( parent => Bindings.templates.has(parent) ).length ){
        console.log('An existing template is already using this element');
        return false;
    }

    // capture the original state of the elemnt before performing bindings
    const elementContent = element.innerHTML;
    const elementAttributes = [];
    Array.from( element.attributes ).forEach( a =>{
        elementAttributes.push( { name : a.name, value: a.value } );
    });


    console.log('Creating Template',element);
    Bind.element(element);
    // observe the document topMost element
    _DOM_OBSERVER_.observe(element, { attributes: false, childList: true , subtree:true, characterData:false});
    // store the templste data
    Bindings.templates.set(element , {
        content : elementContent,
        attributes: elementAttributes,
        observer: null,
        id:null
    });
    console.log('Template Complete');
    Debug.loadTab();

    return true; // should return a binding reference (view)
};

Template.destroy = function(element ){
    if(typeof element === 'string') element = document.querySelectorAll( element )[0];

    if(typeof element === 'undefined') element = document.documentElement;
    else if( !(element instanceof HTMLElement) ) throw new Error('Template.bind(): Invalid input');


    if( !Bindings.templates.has(element)){
        console.log('This Element is not the root of any Template.');
        return false;
    }

    console.log('Destroying Template', element);
    const template = Bindings.templates.get(element);

    // disable Mutation Observer (prevents triggering events when the Unbinding
    // changes the HTML ton its original value
    _DOM_OBSERVER_.disconnect();

    Unbind.element(element);

    // delete element current attributes
    Array.from(element.attributes).forEach( a => element.removeAttribute(a.name) );
    // restore element original attributes
    template.attributes.forEach( a => element.setAttribute(a.name, a.value) );
    // restre original html contnt
    element.innerHTML = template.content;

    // DONE, DELETE TEMPLATE ENTRY FROM CLLECTION
    Bindings.templates.delete(element);
    console.log('Template Destroyed');


    return true;
};


Template.Model = function( modelName, content ){
    if(typeof content === 'undefined'){
        return Observer(modelName);
    }else{
        if( !(this instanceof Template.Model) ) throw new Error("Model Constructor must be called using 'new'.");
        return new Observer( content , Subscribe.dom , {
            id: modelName ,
            observeConstruction: true,
            ignoreSameValueReassign : false
        } );
    }
};






Template.View = function( viewName, content){
    //
    //
};

Template.loadModel = /* async */ function( modelName = '' ){
    if( typeof modelName !== 'string' ) throw new Error('Template.loadModel() : Model name must be a String.');

    // prepare the pathname
    modelName = modelName.trim();
    modelName = Config.modelsPath + modelName;
    if( Config.modelsNamesExtension ) modelName = modelName + Config.modelsNamesExtension;

    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        let loaderId = "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2);

        // Handler to be executed when Module is loaded
        window[loaderId] = function( m ){
            resolve( m );
            // remove loader function and script element
            window[loaderId] = null;
            delete window[loaderId];
            script.remove();
            script = null;
        };
        // Handler to Errors on load
        script.onerror = () => {
            reject( new Error("Template.loadModel() : Failed to load model script with URL " + modelName));
            // remove loader function and script element
            window[loaderId] = null;
            delete window[loaderId];
            script.remove();
            script = null;
        };
        // configure the  Module Script Element ...
        script.type = "module";
        script.textContent = `import * as m from "${modelName}"; window.${loaderId}( m.default )`;
        // insert the Script element to trigger the module load
        document.documentElement.appendChild(script);
    });
};

Template.loadView = /*async*/ function( viewName = '' ){
    if( typeof viewName !== 'string' ) throw new Error("Template.loadView() : View name must be a String.");
    //
    return new Promise( function(resolve,reject){
        fetch(Config.viewsPath + viewName + Config.viewsNamesExtension)
            .then( response =>{
                resolve( (response.ok === true ) ? response.text() : false );
            });
    });
};





Object.defineProperty(Template , 'Config', {
    set( configObject ){
        if( typeof configObject !== 'object' ) throw new Error('Config : Provided value must be an Object.');
        for (let property in configObject){
            if( configObject.hasOwnProperty(property) ) this.Config[property] = configObject[property];
        }
        return true;
    },
    get(){
        return ConfigInterface;
    },
    enumerable: true,
    configurable: true
});






