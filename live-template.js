/*
* @Author: colxi.kl
* @Date:   2018-05-18 03:45:24
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-13 18:37:36
*/
/* global _DEBUG_ */


import './src/colored-debug.js';
import './node_modules/deep-observer/src/deep-observer.js';
import { Config , ConfigInterface } from './src/core-config.js';
import { Bind } from './src/core-bind.js';
import { Unbind } from './src/core-unbind.js';
import { Bindings } from './src/core-bindings.js';
import { ObserverCallback } from './src/core-observer-callback.js';


let _DOM_OBSERVER_ = new MutationObserver( mutationsList => {
    for(let mutation of mutationsList){
        if (mutation.type !== 'childList') continue;
        // first process Removed Nodes
        mutation.removedNodes.forEach( x=>{
            console.log(x, x.parentNode );
            Unbind.placeholder(x);
        } );
        // and then Added Nodes
        mutation.addedNodes.forEach( Bind.element  );
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
Template.bind = function( root ){
    if(typeof root === 'undefined') root = document.documentElement;
    if( !(root instanceof HTMLElement) ) throw new Error('Only HTML Elements can be binded' );
    console.log('Start Binding')
    Bind.element(root);
    // observe the document topMost element
    _DOM_OBSERVER_.observe(root, { attributes: false, childList: true , subtree:true, characterData:false});
    console.log('Binding Complete')
};

Template.unbind = function(element = document.documentElement ){

    if( Bindings.elements.has(element) ){
        let value = Bindings.elements.get(element);
        console.log(value);
        if( element.nodeType === Node.TEXT_NODE ){
            element.textContent = value;
        }else{
            for(let attr in value){
                if( !value.hasOwnProperty(attr) ) continue;
                element.setAttribute( attr , value[attr] );
            }
        }
        Unbind.placeholder( element );
    }

    if( element.childNodes.length) element.childNodes.forEach( e=> Template.unbind(e) );

    if( element === document.documentElement) _DOM_OBSERVER_.disconnect();
};

/**
 * [Model description]
 * @param {[type]} modelName [description]
 * @param {Object} content   [description]
 */
Template.Model = function( modelName, content ){
    if(typeof content === 'undefined'){
        return Observer(modelName);
    }else{
        if( !(this instanceof Template.Model) ) throw new Error("Model Constructor must be called using 'new'.");
        return new Observer( content , ObserverCallback , {
            id: modelName ,
            observeConstruction: true,
            ignoreSameValueReassign : false
        } );
    }
};

/**
 * [View description]
 * @param {[type]} viewName [description]
 * @param {[type]} content  [description]
 */
Template.View = function( viewName, content){
    //
    //
};

/**
 * [loadModel description]
 * @param  {String} modelName [description]
 * @return {[type]}           [description]
 */
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

/**
 * [loadView description]
 * @param  {String} viewName [description]
 * @return {[type]}          [description]
 */
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

/**
 * [Util description]
 * @type {Object}
 */


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





window.Debug={
    showBindings : function(){
        console.log(Bindings);
    },
    showModels: function(){
        console.log( Observer._enumerate_() );
    }
}



