/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-28 22:55:17
*/

import { Config } from './core-config.js';
import { Bindings } from './core-bindings.js';
import { Bind } from './core-bind.js';
import { Keypath } from './core-keypath.js';
import { Util } from './core-util.js';

/*
* @Author: colxi
* @Date:   2018-07-15 23:13:29
* @Last Modified by:   colxi
* @Last Modified time: 2018-07-17 15:14:21
*/
const Directives = {
    value : {
        bind : function(element, keypath , binderType ){
            _DEBUG_.directive('Directives.value.bind() : Bindng '+ keypath +' ->', {element});
            Bind.event( element, 'input', e=>this.publish(element, keypath , binderType, e.target.value) );
        },
        subscribe : function(element , keypath , binderType, value){
            // change in object must be reflected in DOM
            _DEBUG_.directive('Directives.value.subscribe() : Subscribe '+ keypath +' -> "'+value+'" to ', {element});
            element.value = value || '' ;
        },
        publish : function(element, keypath , binderType, value){
            // change in DOM must be setted to _MODELS_ Object
            _DEBUG_.directive('Directives.value.pusblish() : Publish '+ value +' -> "'+keypath+'" from ', {element});
            if( Keypath.exist( keypath) ){
                let model = Keypath.resolveContext( keypath);
                model.context[ model.property ] = value;
            }else console.log('Keypath cant be resolved (model doesnt exist)');
        }
    },
    on : {
        bind : function(element, keypath, binderType){
            Bind.event( element, binderType[1], e=> this.publish(element, keypath, binderType, e) );
        },
        publish : function(element , keypath , binderType, value){
            Keypath.resolve( keypath)(value)
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
        unbind : function(element, keypath){
            while(element.firstChild){ element.firstChild.remove() };
            delete Bindings.iterators[keypath];
        },
        bind : function(element, keypath , binderType){
            _DEBUG_.directive('Directives.for.bind() : Bindng Iterator '+ keypath +' ->', {element});

            if( Keypath.exist( keypath) ){
                Bindings.iterators[keypath] = {
                    element:element,
                    elementContent:element.firstElementChild.cloneNode(true),
                    state : [],
                    token:binderType[1],
                    //html:element.innerHTML,
                    index:element.getAttribute( Config.directivePrefix + ':index' ),
                    initiated :false
                };
                while(element.firstChild){ element.firstChild.remove() };

                /*
                Directives.for.subscribe(element, keypath , binderType, Keypath.resolve(keypath));

                */

            }else throw new Error('Directives.for.bind(): model does not exist!!! '+keypath);


        },
        subscribe : function(element , keypath , binderType, value){
            _DEBUG_.directive('Directives.for.subscribe() : '+ keypath , {element} );
            // recover the element binding
            //let elementBindings = Bindings.elements.get(element);
            // find the keypath
            //let keyPath = elementBindings[ Config.directivePrefix + '-for-' +binderType[1] ];


            let iteratorBinding = Bindings.iterators[keypath];
            element = iteratorBinding.element;

            let state = iteratorBinding.state;
            iteratorBinding.state = value.slice(0);

            // make a list of all modifed keys
            let changes= new Set();
            for(let i =0; i<value.length;i++) if( value[i] !== state[i] ) changes.add(i)



            if(state.length > value.length ){
                let dif = state.length - value.length ;
                for(let i=0; i<dif;i ++) element.lastElementChild.remove();
            }

            let children = Array.from(element.children)

            for( let i=0; i<value.length; i++ ){
                if( !changes.has(i) ) continue;

                let content = iteratorBinding.elementContent.cloneNode(true);
                prepare( iteratorBinding.index, i, content )

                if( !children[ i ] ) element.appendChild( content  );
                else{
                    children[i].parentNode.insertBefore(content, children[i].nextSibling);
                    children[ i ].remove();
                }
            }

            if( !iteratorBinding.initiated){
                let children = Array.from(element.children);
                for(let i=0; i<children.length; i++){
                    console.warn( children[i] );
                    Bind.element( children[i] );
                }
                iteratorBinding.initiated= true;
            }



            function prepare(indexToken, index, element){
                let indexRegexp = new RegExp( Config._replacePlaceholdersExpString.replace('__PLACEHOLDER__', indexToken) ,'g');
                let attr = Array.from(element.attributes);
                // attributes
                for(let a=0; a<attr.length; a++){
                    let attrValue = attr[a].value;
                    if(typeof iteratorBinding.index !== 'undefined'){
                        attrValue = attrValue.replace( indexRegexp, index );
                    }
                    attrValue = attrValue.replace(iteratorBinding.token, keypath + '.' + index);
                    attr[a].value = attrValue;
                }
                // txetnodes
                let textNodes = Util.getElementTextNodes(element);
                for(let a=0; a<textNodes.length; a++){
                    let texNode =  textNodes[a];
                    let textValue = texNode.textContent;
                    if(typeof iteratorBinding.index !== 'undefined'){
                        textValue = textValue.replace( indexRegexp, index );
                    }
                    textValue = textValue.replace(iteratorBinding.token, keypath + '.' + index);
                    texNode.textContent = textValue;
                }
                // children nodes
                let children = Array.from(element.children);
                for(let a=0; a<children.length; a++) prepare( indexToken, index, children[a] );
            }


            /*
            let html='';
            element.innerHTML= '';

            if(changes.length === 1 && changes[0] === value.length-1){
                let i= changes[0]
                let tmp = iteratorBinding.html;
                if(typeof iteratorBinding.index !== 'undefined'){
                    let search = new RegExp( Config._replacePlaceholdersExpString.replace('__PLACEHOLDER__', iteratorBinding.index) ,'g');
                    tmp = tmp.replace( search ,i );
                }
                html += tmp.replace(iteratorBinding.token, keypath + '.' + i);
                //element.innerHTML += html;
                element.appendChild( document.createElement('div') ).innerHTML = html;
            }else{
                // element.innerHTML='';
                for( let i=0; i< value.length; i++){
                    let tmp = iteratorBinding.html;
                    if(typeof iteratorBinding.index !== 'undefined'){
                        let search = new RegExp( Config._replacePlaceholdersExpString.replace('__PLACEHOLDER__', iteratorBinding.index) ,'g');
                        tmp = tmp.replace( search ,i );
                    }
                    html += tmp.replace(iteratorBinding.token, keypath + '.' + i);
                }
                element.innerHTML= html;
            // end elseif
            // }
            */
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
