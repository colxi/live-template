/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-24 10:07:48
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
        bind : function(element, keypath , binderType ){
            Bind.event( element, 'input', e=>this.publish(element, keypath , binderType, e.target.value) );
        },
        subscribe : function(element , keypath , binderType, value){
            // change in object must be reflected in DOM
            element.value = value || '' ;
        },
        publish : function(element, keypath , binderType, value){
            // change in DOM must be setted to _MODELS_ Object
            let model = Keypath.resolveContext( Observer._enumerate_() , keypath);
            if(model) model.context[ model['property'] ] = value;
            else console.log('model or property does mot exist');
        }
    },
    on : {
        bind : function(element, keypath, binderType){
            Bind.event( element, binderType[1], e=> this.publish(element, keypath, binderType, e) );
        },
        publish : function(element , keypath , binderType, value){
            Keypath.resolve(Observer._enumerate_(), keypath)(value)
        }
    },
    if : {
        subscribe : function(element , keypath , binderType, value){
            // handle "true" "false" strings and "0" and "1" stringss
            if(typeof value === 'string' && value.length===0) value = false;
            // show the element if value is True, or any other value not
            // interpreted as False (like null, undefined, 0 ...)
            if( value ){
                element.style.display = '';
            }else{
                element.style.setProperty("display", "none", "important");
            }
        }
    },
    for : {
        block : true,
        bind : function(element, keypath , binderType){
            console.log('binding for-'+binderType[1] );

            if( Keypath.exist(Observer._enumerate_(), keypath) ){
                Bindings.iterators[keypath] = {
                    element:element,
                    token:binderType[1],
                    html:element.innerHTML,
                    index:element.getAttribute( Config.directivePrefix + ':index' )
                };
                element.innerHTML = '';
            }else throw new Error('directives.for(): model does not exist!!! '+placeholder)

        },
        subscribe : function(element , keypath , binderType, value){
            _DEBUG_.orange( 'SUBSCRIBE for-'+binderType[1], value );
            element.innerHTML='';
            // recover the element binding
            //let elementBindings = Bindings.elements.get(element);
            // find the keypath
            //let keyPath = elementBindings[ Config.directivePrefix + '-for-' +binderType[1] ];
            value = Keypath.resolve(Observer._enumerate_(),keypath)

            let iteratorBinding = Bindings.iterators[keypath]
            //console.log(keyPath , iteratorBinding );
            let html='';
            console.warn('item length', value.length)
            for( let i=0; i< value.length; i++){
                let tmp = iteratorBinding.html;
                if(typeof iteratorBinding.index !== 'undefined'){
                    console.log(Config._replacePlaceholdersExpString)
                    let search = new RegExp( Config._replacePlaceholdersExpString.replace('__PLACEHOLDER__', iteratorBinding.index) ,'g');
                    tmp = tmp.replace( search ,i );
                }
                html += tmp.replace(iteratorBinding.token, keypath + '.' + i);
            }
            console.log(html)
            element.innerHTML= html;
        },
    },
    /*
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
    */
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
