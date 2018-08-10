/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-09 19:53:57
*/
import { Config } from './core-config.js';
import { Bindings } from './core-bindings.js';
import { Directives } from './core-directives.js';
import { Placeholder } from './core-placeholder.js';
import { Util } from './core-util.js';
import { ObserverCallback } from './core-observer-callback.js';


const Bind = {};

Bind.element = function( element ){
    _DEBUG_.yellow('Bind.Element(): Scanning Element :', element );

    // container to store all detected bindings, to initialize them when
    // the binding is completed (it can't be done on the fly because it could
    // destroy the template, before is stored)
    let uninitializedPlaceholders = [];
    let blockBindingNested = false;

    //
    //
    // Allowed : Node.ELEMENT_NODE , Node.TEXT_NODE
    //
    //

    // element_node
    if( element.nodeType === Node.ELEMENT_NODE ){
        if( element.tagName === 'SCRIPT' || element.tagName === 'STYLE'){
            _DEBUG_.darkyellow('Bind.Element(): Element type ('+ element.tagName + ') is not Bindable. Ignore' );
            return false;
        }
        // Iterate each Element attribute
        for(let attr in element.attributes){
            // block if attrName is not a property
            if( !element.attributes.hasOwnProperty(attr) ) continue;

            // collect all the placeholders from the attribute in an array
            const placeholders = Placeholder.getFromString( element.attributes[attr].value );

            if( placeholders.length) _DEBUG_.darkyellow('Bind.Element(): Placeholder(s) found in attribute :',  element.attributes[attr].name, '=','"'+element.attributes[attr].value+'"' );

            // and store them to in the list of placeholders to initialize
            uninitializedPlaceholders = uninitializedPlaceholders.concat( placeholders );

            // if current attribute is a Custom Binder.. perform custom binding
            if( Util.isDirectiveName( element.attributes[attr].name , Config.binderPrefix) ){
                _DEBUG_.darkyellow('Bind.Element(): Directive found in elemnt :',  element.attributes[attr].name, '=','"'+element.attributes[attr].value+'"' );

                Bind.elementDirective( element , element.attributes[attr].name );
                let customBinder = element.attributes[attr].name.split('-')[1];
                if( Directives.hasOwnProperty(customBinder) && Directives[customBinder].block === true ) blockBindingNested = true;
                continue; // ¿ WHY CONTINUE ?
            }

            // iterate all placeholders detected in the attribute value
            // and perform the binding of each one
            placeholders.forEach( placeholder=>{
                Bind.elementAttribute( element , element.attributes[attr].name , element.attributes[attr].value );
                // bind the element with the placeholder
                Bind.placeholder(element, placeholder);
            });
        }
    }

    if( !blockBindingNested ){
        // get all the textNodes (if current node is a textNode only operate with
        // it), retrieve the placeholder within, and bind them to the element
        Util.getElementTextNodes( element ).forEach( textNode =>{
            const textNodePlaceholders = Placeholder.getFromString( textNode.nodeValue );
            if(textNodePlaceholders.length){
                _DEBUG_.darkyellow('Bind.Element(): Placeholder(s) found in textNode :', textNodePlaceholders );

                textNodePlaceholders.forEach( placeholder =>{
                    uninitializedPlaceholders.push( placeholder );

                    Bind.textNode( textNode, textNode.nodeValue );
                    Bind.placeholder(textNode, placeholder);
                });
            }
        });

    }

    // no more tasks pending! initialize placeholders in element!
    if( uninitializedPlaceholders.length){
        _DEBUG_.darkyellow('Bind.Element(): Interpolating Placeholder(s)' );
        uninitializedPlaceholders.forEach( placeholder => {
            let model = Util.resolveKeyPath(placeholder);

            ObserverCallback( {action: 'update' , keyPath:placeholder } );
            if(model) model.context[model.key] = model.context[model.key];
            else  console.log('Bind.elemnet() : todo->set undeclared placeholder to empty value. Affected :', placeholder);
        });
    }else{
        _DEBUG_.darkyellow('Bind.Element(): Nothing to Bind in element.');
    }

    if( !blockBindingNested ){
        // if element has childnodes and are Element Nodes (text nodes have already
        // been binded), bind them recursively
        if( element.childNodes.length){
            _DEBUG_.darkyellow('Bind.Element(): Element has children...' );
            element.childNodes.forEach( childNode =>{
                if( childNode.nodeType === Node.ELEMENT_NODE ) Bind.element( childNode );
            });
        }
    }
};

Bind.textNode = function( textNode , value ){
    Bindings.elements.set( textNode, value );
    return true;
};


Bind.elementDirective = function( element , customBinderName ){
    // get the value of the customBinder attribute
    let stringValue = element.getAttribute( customBinderName ).trim();

    _DEBUG_.green('Binding DIRECTIVE to element :', customBinderName, stringValue, element );

    // split the customBinder Name in tokens  -> 'pg-on-click' = ['pg','on', 'click']
    let customBinder = customBinderName.split('-');

    if( Util.isStringQuoted( stringValue ) ){
        // if value is quoted, call binder[customBinder].subscribte
        // with the quoted value (quotes stripped)
        Directives[ customBinder[1] ].subscribe( element, undefined , customBinder.slice(1),  stringValue.slice(1, -1) );
        // TODO...
        // don't perform BINDING! (there is no variable value to bind)
    }else{
        // TODO: stringValue can contain multiple placeHolders... right now it
        // only takes and proces the first one.. MUST HANDLE AS MANY AS DETECTED!
        let placeholder = stringValue;

        Bind.placeholder(element, placeholder);
        Bind.elementAttribute( element , customBinderName , stringValue);


        // get placeholder model context
        //let model = Util.resolveKeyPath(placeholder);

        // determine the apropiate binder (if requested binder does not exist call default one)
        let binder = Directives.hasOwnProperty(customBinder[1]) ? Directives[customBinder[1]] : Directives.default;
        // bind and subscribe
        binder.bind(element, placeholder , customBinder.slice(1) );
        //binder.bind(element, model.context, model.key, model.context[model.key] ,  customBinder.slice(1) );
        let model = Util.resolveKeyPath(placeholder);

        if( !model ) console.log('Bind.elementdirective() : model ' + placeholder + ' or prperty does mot exist')
        binder.subscribe( element, placeholder, customBinder.slice(1) , model ? model.context[model.key] : '');
    }
    return true;
};

Bind.elementAttribute = function( element, attribute, value){
    // if current Element already has attribute bindings...
    if( Bindings.elements.has(element) ){
        // update the entry for the current element in the
        // Bindings Element index with the new attribute and its Template String
        let bindedAttributes =  Bindings.elements.get(element);
        bindedAttributes[ attribute ] = value;
        Bindings.elements.set(element,bindedAttributes );
    }else{
        // if it's not yet in the Bindings Element index, add
        // a new entry with the attribute name and value
        Bindings.elements.set(element , { [ attribute ] : value } );
    }
    return true;
};

Bind.placeholder = function( element , placeholder ){
    // block if no binding name has been provided
    if( placeholder.trim() === undefined ) throw new Error('Imposible to perform binding. Binding name not provided in Element');

    _DEBUG_.green('Binding PLACEHOLDER to element :', placeholder, element.nodeType === 3 ? element.parentNode :element);

    // if the tokenName has not been registered previously, generate an empty entry
    if( !Bindings.placeholders.hasOwnProperty(placeholder) ) Bindings.placeholders[placeholder] = [];
    // link the element with the placeholder in the Bindings registry
    Bindings.placeholders[placeholder].push(element);

    // TODO: add an observer to the element to track changes in its structure/Bindings

    // done!
    return true;
};

Bind.event = function(element, type, handler){
    let bindedEvents = {};
    // check if element has other events bindings
    if( Bindings.events.has( element ) ){
        // it does! get the event bindings list
        bindedEvents = Bindings.events.get( element );
        // iterate all the element binded events to ensure the same event
        // has not been binded previously
        for( let event in bindedEvents ){
            if( !bindedEvents.hasOwnProperty(event) ) continue;
            // already binded! Error!
            // TODO : handle situation
            if( event === type ) throw new Error('Element has already another event of the same type binded! Unexpected!');
        }
    }
    // Include the the event to the element binded events object
    bindedEvents[type] = handler;
    Bindings.events.set( element, bindedEvents );
    // Create the DOM event listener
    element.addEventListener(type, handler);
    // done!
    return true;
};


export { Bind };


