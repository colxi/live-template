/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-31 23:56:05
*/

/* global _DEBUG_ */

import { Debug } from './debugger/debugger.js';
import { Bindings } from './core-bindings.js';
import { Directive } from './core-directive.js';
import { Directives } from './core-directives.js';
import { Placeholder } from './core-placeholder.js';
import { Util } from './core-util.js';


const Unbind = {};

/**
 * [element description]
 * @param  {[type]} element [description]
 * @return {[type]}         [description]
 */
Unbind.element = function( element ){

    // *************************************************************************
    // INPUT VALIDATION
    // *************************************************************************
    //
    // block if element is not an HTMLElement or a TEXT_NODE
    if( !(element instanceof HTMLElement || element instanceof Text) ){
        _DEBUG_.red('Unbind.element() : Only HTMLElements and TextNodes are allowed',element );
        return false;
    }
    // Block if element is a SCRIPT or STYLE
    if( element.nodeType === Node.ELEMENT_NODE){
        if( element.tagName === 'SCRIPT' || element.tagName === 'STYLE' ){
            _DEBUG_.red('Unbind.Element(): Script and Style Elements are ignored.' );
            return false;
        }
    }


    _DEBUG_.red('Unbind.element() : Unbinding ELEMENT :',  {element} );

    // Prepare array whith children elements, before any other action,
    // (eg .Directive.unbind) modifies the children tree
    // ( if is a textNode, a empty array will be generated )
    const childrenElements = Array.from( element.children  || [] );


    // *************************************************************************
    // ATTRIBUTES SCAN
    // *************************************************************************
    //
    // If it's an Element Node, scan for Directive attributes, and
    // perform the corresponding <Directive>.unbid method call for each valid
    // directive attribute found
    if( element.nodeType === Node.ELEMENT_NODE && element.hasAttributes() ){
        const count = element.attributes.length;
        for( let i=0 ; i < count; i++ ){
            // get current attribute
            const attribute = element.attributes[i];
            // if current attribute is not an directive or is an undwclared
            // directive, contniue, to next attribute...
            if( !Directive.isDirectiveName(attribute.name) || !Directive.exist(attribute.name) ) continue;
            // if Directive attribute value is quoted, it behaves as a
            // constant, and no effective binding was performed, for that
            // reasons can be skipped
            if(Util.isStringQuoted( attribute.value ) ) continue;

            // retrieve the directive name and arguments parts, from
            // the attribute name
            const directive = Directive.nameUnpack(attribute.name);

            // call the Directive unbindng method
            if( typeof Directives[directive.name].unbind  === 'function' ){
                Directives[ directive.name ].unbind( element , attribute.value , directive.arguments );
            }
            // If Directive registered events in the element, retrieve
            // them, and iterate to unregister
            if( Bindings.events.has( element ) ){
                const events = Bindings.events.get( element );
                Object.keys(events).forEach( e => Unbind.event(element,e) );
            }
        }
    }


    // *************************************************************************
    // BUILD COLLECTION OF NODES TO UNBIND
    // *************************************************************************
    //
    // prepare collection of items to unbind. if provided element is a TextNode,
    // only add itself to the collection, but if its an element node, add
    // itself and also the direct child textnodes.
    let nodes = [];
    if( element.nodeType === Node.ELEMENT_NODE ){
        // retrieve all the  element textnodes
        nodes = Util.getElementTextNodes( element );
        nodes.push( element );
    }else nodes.push( element );



    // *************************************************************************
    // UNBIND & RESTORE NODES ORIGINAL VALUES
    // *************************************************************************
    //
    // iterate the array to perform unbindings
    nodes.forEach( node =>{
        // get the placeholders from the current item
        Placeholder.getFromTemplate(node).forEach( placeholder =>{
            // if placeholder exist in the bindings collection
            if( Bindings.placeholders.hasOwnProperty( placeholder ) ){
                // check if current item is binded to placeholder, and remove
                // it if found
                const index = Bindings.placeholders[placeholder].indexOf(node);
                if (index !== -1) Bindings.placeholders[placeholder].splice(index, 1);
                // if placeholder has no more bindngs, remove placeholder
                // binding reference
                if( !Bindings.placeholders[placeholder].length ){
                    delete Bindings.placeholders[placeholder];
                }
            }
        } );
        Bindings.elements.delete( node );
    });


    // *************************************************************************
    // UNBIND CHILDREN NODES
    // *************************************************************************
    //
    childrenElements.forEach( Unbind.element );


    Debug.loadTab();
    return true;
};





Unbind.event = function( element , event = '' ){
    // if element has event bindings...
    if( Bindings.events.has(element) ){
        // get the list of bindings and iterate it
        let eventBindings  = Bindings.events.get( element );
        for( let eventType in eventBindings ){
            if( !eventBindings.hasOwnProperty( eventType) ) continue;
            // if current eventName matches provided eventName, or all
            // event bindings have been requested to be removed (event='')...
            if( eventType === event || event === '' ){
                // remove the event listener
                element.removeEventListener( eventType, eventBindings[eventType] );
                // and remove event from binded events list
                delete eventBindings[eventType];
            }
        }
        // if not all events have been removed, update Element Event Bindings
        if( Object.keys( eventBindings ).length ) Bindings.events.set( element , eventBindings );
        // else, delete Event Bindings entry for element
        else Bindings.events.delete( element );
    }
    // done!
    return true;
};


export { Unbind };


