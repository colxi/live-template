/*
* @Author: colxi
* @Date:   2018-07-15 23:13:29
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-01 00:33:20
*/
import { Config } from './core-config.js';
import { Directive } from './core-directive.js';
import { Placeholder } from './core-placeholder.js';
import { Bindings } from './core-bindings.js';
import { Bind } from './core-bind.js';
import { Keypath } from './core-keypath.js';
import { Util } from './core-util.js';

const Directives = {};

/**
 * [value description]
 * @type {Object}
 */
Directives.value = {
    bind : function(element, keypath , directiveArgs ){
        _DEBUG_.directive('Directives.value.bind() : Bindng '+ keypath +' ->', {element});
        Bind.event( element, 'input', e=>this.publish(element, keypath , directiveArgs, e.target.value) );
    },
    subscribe : function(element , keypath , directiveArgs, value){
        // change in object must be reflected in DOM
        _DEBUG_.directive('Directives.value.subscribe() : Subscribe '+ keypath +' -> "'+value+'" to ', {element});
        element.value = value || '' ;
    },
    publish : function(element, keypath , directiveArgs, value){
        // change in DOM must be setted to _MODELS_ Object
        _DEBUG_.directive('Directives.value.pusblish() : Publish '+ value +' -> "'+keypath+'" from ', {element});
        if( Keypath.exist( keypath) ){
            let model = Keypath.resolveContext( keypath);
            model.context[ model.property ] = value;
        }else console.log('Keypath cant be resolved (model doesnt exist)');
    }
};


/**
 * [on description]
 * @type {Object}
 */
Directives.on = {
    bind : function(element, keypath, directiveArgs){
        Bind.event( element, directiveArgs[0], e=> this.publish(element, keypath, directiveArgs, e) );
    },
    publish : function(element , keypath , directiveArgs, value){
        Keypath.resolve( keypath)(value);
    }
};


/**
 * [if description]
 * @type {Object}
 */
Directives.if = {
    subscribe : function(element , keypath , directiveArgs, value){
        // handle "true" "false" strings and "0" and "1" stringss
        if(typeof value === 'string' && value.length===0) value = false;
        // show the element if value is True, or any other value not
        // interpreted as False (like null, undefined, 0 ...)
        if( value ){
            element.style.display = '';
        }else{
            element.style.setProperty('display', 'none', 'important');
        }
    }
};


/**
 * [for description]
 * @type {Object}
 */
Directives.for = {
    block : true,
    unbind : function(element, keypath){
        if( !Bindings.iterators.hasOwnProperty(keypath) ){
            throw new Error('Directive.for.unbind(): No iterator exists for the provided keypath: '+ keypath )
        }

        if( !Bindings.iterators[keypath].has(element) ){
            throw new Error('Directive.for.unbind(): This element has no iterator with the keypath: '+ keypath);
        }

        Bindings.iterators[keypath].delete(element);
        if( !Bindings.iterators[keypath].size) delete Bindings.iterators[keypath];

        while(element.firstChild){ element.firstChild.remove() }
    },
    bind : function(element, keypath , directiveArgs){
        _DEBUG_.directive('Directives.for.bind() : Bindng Iterator '+ keypath +' ->', {element});

        if( Keypath.exist( keypath) ){
            if( !Bindings.iterators.hasOwnProperty(keypath) ){
                Bindings.iterators[keypath] = new Map();
            }else{
                if( Bindings.iterators[keypath].has(element) ) throw new Error('Element has already an iteraor!');
            }

            Bindings.iterators[keypath].set( element, {
                keypath :  keypath,
                element:element,
                elementContent:element.firstElementChild.cloneNode(true),
                iterableCached : [],
                token:directiveArgs[0],
                //html:element.innerHTML,
                index:element.getAttribute( Config.directivePrefix + ':index' ),
                initiated :false
            });
            while(element.firstChild){ element.firstChild.remove() }

        }else throw new Error('Directives.for.bind(): model does not exist!!! '+keypath);
    },
    _iteratorNode : function(iterator, index, _element){
        if(!_element) _element = iterator.elementContent.cloneNode(true);

        let indexToken = iterator.index;
        let indexRegexp = new RegExp( Config._replacePlaceholdersExpString.replace('__PLACEHOLDER__', indexToken) ,'g');
        let attr = Array.from(_element.attributes);
        // attributes
        for(let a=0; a<attr.length; a++){
            let attrValue = attr[a].value;
            if(typeof iterator.index !== 'undefined'){
                attrValue = attrValue.replace( indexRegexp, index );
            }
            // if index placeholer {<indexToken>} has veen found, apply the
            // replacement and continue with next attribute
            if(attrValue !== attr[a].value){
                attr[a].value = attrValue;
                continue;
            }
            // else look for placeholders...
            let placeholders = [];
            // if its a Directive attribute...
            if( Directive.isDirectiveName( attr[a].name ) ){
                // is directive value is quotes, continue, nothing to do hre...
                if(Util.isStringQuoted(attr[a].value) ) continue;
                // else , asume the placeholder is the value of the attribute
                placeholders = [ attr[a].value.trim() ];
            }else placeholders = Placeholder.getFromString(attrValue);

            placeholders.forEach( placeholder =>{
                let pholderArray = Keypath.toArray(placeholder)
                if( pholderArray[0] !== iterator.token ) return;
                pholderArray[0] = iterator.keypath+ '.'+index;
                let adapted =  pholderArray.join('.') ;
                attrValue = attrValue.replace(new RegExp(placeholder, 'g'), adapted);
            })


            //attrValue = attrValue.replace(iterator.token, iterator.keypath + '.' + index);
            attr[a].value = attrValue;
        }
        // txetnodes
        let textNodes = Util.getElementTextNodes(_element);
        for(let a=0; a<textNodes.length; a++){
            let texNode =  textNodes[a];
            let textValue = texNode.textContent;
            if(typeof iterator.index !== 'undefined'){
                textValue = textValue.replace( indexRegexp, index );
            }

            let placeholders = Placeholder.getFromString(textValue);
            placeholders.forEach( placeholder =>{
                let pholderArray = Keypath.toArray(placeholder)
                if( pholderArray[0] !== iterator.token ) return;
                pholderArray[0] = iterator.keypath+ '.'+index;
                let adapted =  pholderArray.join('.');
                textValue = textValue.replace(new RegExp(placeholder, 'g'), adapted);
            })


            //textValue = textValue.replace(iterator.token, iterator.keypath + '.' + index);
            texNode.textContent = textValue;
        }
        // children nodes
        let children = Array.from(_element.children);
        for(let a=0; a<children.length; a++) Directives.for._iteratorNode( iterator, index, children[a] );
        return _element;
    },
    subscribe : function(element , keypath , directiveArgs, iterableObj){
        // Posible optimization :
        // Scenario : Only when iterator doesnt use the pg-index,
        // new created Array keys can be injected in the corresponding
        // position without the need of re-rendering everything else (cause
        // index changs are not relevant), and teratorNodes can be removed
        // safely when array keys   have been deleted.
        // Requwriment: an algoritm to detect wich are nw keys in the array,
        // wich are the deleted, and widh ones have just been displaced.

        _DEBUG_.directive('Directives.for.subscribe() : '+ keypath , {element} );

        const iterator = Bindings.iterators[keypath].get(element);
        console.log(iterator, element, keypath);
        // get cached ( before current modification ) array state
        // and set the new array state to cache
        const iterableCached = iterator.iterableCached;
        iterator.iterableCached = iterableObj.slice(0);

        // retrieve a list of all modifed keys
        const modifiedKeys = [];
        for(let i=0; i<iterableObj.length;i++){
            if( iterableObj[i] !== iterableCached[i] ) modifiedKeys.push(i);
        }

        // if new array has less elememts than the cached version, remove
        // surplus elements in the element.children tree (from the bottom)
        if(iterableCached.length > iterableObj.length ){
            const dif = iterableCached.length - iterableObj.length ;
            for(let i=0; i<dif; i++) element.lastElementChild.remove();
        }

        // retrieve a list of children elements in the iterator container
        const children = Array.from(element.children);

        // iterate the iterableObj modified keys list, and updatenits
        // representation in the DOM
        for( let i=0; i<modifiedKeys.length; i++ ){
            const index = modifiedKeys[i];

            // generate the new iterationNode
            const content = Directives.for._iteratorNode( iterator, index );
            // if already exists an iteration node, replace it wit the
            // updated  node (insert new & delte old). If iterationNode does
            // not exist it means is the bottom of the list, append element.
            if( children[ index ] ){
                children[ index ].parentNode.insertBefore(content, children[ index ].nextSibling);
                children[ index ].remove();
            }else element.appendChild( content );
        }


        // Because the directive FOR, it's a blocking directive (prevents
        // the binder process, from binding the contents of the iterator
        // container), the just generated iterationNodes must be binded
        // manually (only in the first Directive.for.subscribe() call after
        // Directive.for.bind() is execut3d )
        if( !iterator.initiated){
            let children = Array.from(element.children);
            for(let i=0; i<children.length; i++){
                console.warn( children[i] );
                Bind.element( children[i] );
            }
            iterator.initiated= true;
        }

        // done!
        return true;
    },
};

/*
model : {
    bind : function(element, model, key , value , directiveArgs){},
    unbind : function( element, model, key , value , directiveArgs ){},
    publish : function(element, model, key , value , directiveArgs){},
    subscribe : function(element , keyPath , directiveArgs, value){
        Template.loadModel( value );
    },
},
view : {
    bind : function(element, model, key , value , directiveArgs){},
    unbind : function(element, model, key , value , directiveArgs){  },
    publish : function(element, model, key , value , directiveArgs){},
    subscribe : function(element, keyPath , directiveArgs, value){
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
    bind : function(element, model, key , value , directiveArgs){
        //
        model[key] = element;

    },
    unbind : function(element, model, key , value , directiveArgs){
        model[key] = null;
        model[key] = undefined;
        return true;
    },
    publish : function(element, model, key , value , directiveArgs){},
    subscribe : function(element, model, key , value , directiveArgs){},
},


*/


export { Directives };
