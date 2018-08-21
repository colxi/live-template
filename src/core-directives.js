/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-21 15:24:12
*/

import { Config } from './core-config.js';
import { Bindings } from './core-bindings.js';
import { Bind } from './core-bind.js';
import { Unbind } from './core-unbind.js';
import '../node_modules/keypath-resolve/src/keypath-resolve.js';

/*
* @Author: colxi
* @Date:   2018-07-15 23:13:29
* @Last Modified by:   colxi
* @Last Modified time: 2018-07-17 15:14:21
*/
const Directives = {
    value : {
        bind : function(element, keyPath , binderType ){
            Bind.event( element, 'input', e=>this.publish(element, keyPath , binderType, e.target.value) );
        },
        subscribe : function(element , keyPath , binderType, value){
            // change in object must be reflected in DOM
            element.value = value || '' ;
        },
        publish : function(element, keyPath , binderType, value){
            // change in DOM must be setted to _MODELS_ Object
            let model = Keypath.resolveContext( Observer._enumerate_() , keyPath);
            if(model) model.context[ model['property'] ] = value;
            else console.log('model or property does mot exist');
        }
    },
    on : {
        bind : function(element, keyPath, binderType){
            Bind.event( element, binderType[1], e=> this.publish(element, keyPath, binderType, e) );
        },
        publish : function(element , keyPath , binderType, value){
            Keypath.resolve(Observer._enumerate_(), keyPath)(value)
        }
    },
    if : {
        subscribe : function(element , keyPath , binderType, value){
            // handle "true" "false" strings and "0" and "1" stringss
            if(value) value = JSON.parse(value);
            console.log('***********************',value)
            // show the element if value is True, or any other value not
            // interpreted as False (like null, undefined, 0 ...)
            if( value || value === undefined){
                element.style.display = '';
            }else{
                element.style.setProperty("display", "none", "important");
            }
        }
    },
    model : {
        bind : function(element, model, key , value , binderType){},
        unbind : function( element, model, key , value , binderType ){},
        publish : function(element, model, key , value , binderType){},
        subscribe : function(element , keyPath , binderType, value){
            Template.loadModel( value );
        },
    },
    view : {
        bind : function(element, model, key , value , binderType){},
        unbind : function(element, model, key , value , binderType){  },
        publish : function(element, model, key , value , binderType){},
        subscribe : function(element, keyPath , binderType, value){
            console.log('subscribe view', value)
            //element.innerHTML = '';
            while(element.firstChild){
                element.removeChild(element.firstChild);
            }

            if( value && value.length ){
                Template.loadView( value ).then( html =>{
                    if(html !== false) element.innerHTML = html;
                    else{
                        if(Config.debugMode){
                            element.innerHTML = "<div style='color:white; background:red;padding:5px'>Unable to load View " + Config.viewsPath + value + Config.viewsNamesExtension +'</div>';
                        }
                    }
                });
            }
        },
    },
    /*
    select : {
        bind : function(element, model, key , value , binderType){
            //
            model[key] = element;

        },
        unbind : function(element, model, key , value , binderType){
            model[key] = null;
            model[key] = undefined;
            return true;
        },
        publish : function(element, model, key , value , binderType){},
        subscribe : function(element, model, key , value , binderType){},
    },

    for : {
        block : true,
        bind : function(element, model, key , value , binderType){
            console.log('--------------------')
            console.log('binding FOR for-'+binderType[1] , element, model, key , value , binderType);
            if( typeof model[key] === 'undefined'){
                console.log('binding interatorr value not exists', model[key])
                model[key] = [];
                value = model[key]; // reassign value to returned proxy
            }
            console.log('created array...',model[key], value)
            Bindings.iterators.set( value, [{
                element:element,
                binderType:binderType,
                html:element.innerHTML,
                index:element.getAttribute( Config.directivePrefix + ':index' )
            }] );
            element.innerHTML = '';
        },
        unbind : function( element, model, key , value , binderType ){},
        publish : function(element, model, key , value , binderType){},
        subscribe : function(element, model, key , value , binderType){
            _DEBUG_.orange( 'SUBSCRIBE for-'+binderType[1], value );
            element.innerHTML='';
            // recover the element binding
            let elementBindings = Bindings.elements.get(element);
            // find the keypath
            let keyPath = elementBindings[ Config.directivePrefix + '-for-' +binderType[1] ];
            let iteratorBinding = Bindings.iterators.get(value).find(x => x.element === element)
            //console.log(keyPath , iteratorBinding );
            let html='';
            console.warn('item length', value.length)
            for( let i=0; i< value.length; i++){
                let tmp = iteratorBinding.html;
                if(typeof iteratorBinding.index !== 'undefined'){
                    let search = new RegExp( expresion.tokenReplace.replace('__TOKEN__', iteratorBinding.index) ,'g');
                    tmp = tmp.replace( search ,i );
                }
                html += tmp.replace(binderType[1], keyPath + '.' + i);
            }
            console.log(html)
            element.innerHTML= html;
        },
    },
    // pg-unknown :  undeclared binders perform default action...
    */

};

/**
 *
 * Directive.isDirectiveName() : If the directiveName has appropiate structure
 * (starts with ) return the binder name, if not , return false
 *
 * @param  {[type]}  attrName [description]
 * @return {Boolean}          [description]
 *
 */

const Directive ={};

Directive.isDirectiveName = function( directiveName ){
    //
    let parts = directiveName.split('-');
    if ( parts[0] !== Config.directivePrefix ) return false;
    else return true;

    //return ( attrName.substring(0, (Config.directivePrefix.length+1)) == Config.directivePrefix + "-") ? attrName.substring(3) : false;
};


Directive.isBlocking = function( directiveName ){
    const parts = directiveName.split('-');
    const name = ( parts[0] === Config.directivePrefix ) ? parts[1] : directiveName;
    if( !name.length ) throw new Error('Directive.isBlocking() : Directive does nit exist ('+directiveName+')');
    return Directives[name].block === true ? true : false;
};

Directive.exist = function( directiveName ){
    const parts = directiveName.split('-');
    const name = ( parts[0] === Config.directivePrefix ) ? parts[1] : directiveName;
    if( !name.length ) return false;
    return Directives.hasOwnProperty(name);
};

export { Directive, Directives }
