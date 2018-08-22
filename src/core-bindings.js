/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-21 21:29:48
*/

/* global _DEBUG_ */

import { Directive  } from './core-directives.js';
import { Placeholder } from './core-placeholder.js';
import { Directives } from './core-directives.js';


// this file should be called collections
//
//

/**
 * Template._Bindings holds two indexes :
 * - An Array with the PLACEHOLDERS, associating each  placeholder token to
 * each element wich contains it,
 * - A Weak Map for the ELEMENTS, wich stores each the Element original value
 * with the placeholders strings (template tokens)
 */
const Bindings = {
    templates:  new Map(),
    // bindings.templatd should be a weakmap
    // elementReference : {
    //      observer : mutationobserverid //to allow disconnect it in tempkate destroy
    //      html: template inerHTML // to allow template reusage
    //      id : ¿integer?
    // }
    //
    placeholders : {
        /*
        "placeholder_1" :  [
            elementReference,
            elementReference,
            textNodeReference
            (...)
        ],
        "placeholder_2" :  [
            elementReference,
            textNodeReference,
            textNodeReference
            (...)
        ]
        (...)
        */
    },
    events : new Map(),
    iterators : new Map(),
    elements : new Map(),
    /*
        elementReference : {
            "attributeName_1" : "tokenizedValueString",
            "attributeName_2" : "tokenizedValueString",
        },
        textNodeReference : "tokenizedValueString",
        textNodeReference : "tokenizedValueString",
        elementReference : {
            "attributeName_1" : "tokenizedValueString",
            "attributeName_2" : "tokenizedValueString",
            (...)
        }
        (...)
    */

   // must be in core-subscribe.js
    render( placeholder ){
        // if placeholder it's been previously Binded to any element(s)
        if( Bindings.placeholders.hasOwnProperty(placeholder) ){
            // iterate each binded element to the placeholder...
            Bindings.placeholders[placeholder].forEach( element =>{

                // *************************************************************************
                // ELEMENT NODE
                // *************************************************************************
                //
                if( element.nodeType === Node.ELEMENT_NODE && element.hasAttributes() ){
                    // Is an element attribute(s)
                    // retrieve the element attributes with bindings
                    let bindedAttributes = Bindings.elements.get(element);
                    // iterate all binded attributes
                    for(let attribute in bindedAttributes){
                        if( !bindedAttributes.hasOwnProperty(attribute) ) continue;
                        //
                        if( Directive.isDirectiveName( attribute ) && Directive.exist( attribute )){
                            // is a Directive
                            const parts = attribute.split('-');
                            const directiveName = parts[1];
                            const directiveArgs = parts.slice(1);
                            const value = Keypath.resolve( Observer._enumerate_(), placeholder );
                            if(Directives[directiveName].hasOwnProperty('subscribe')){
                                Directives[directiveName].subscribe(element, placeholder, directiveArgs, value );
                            }
                        }else{
                            // is a regular attribute
                            _DEBUG_.lightblue('Bindings.render(): Updating placeholder in Attribute ...' , attribute+'='+bindedAttributes[attribute] );
                            element.setAttribute( attribute,  Placeholder.populateString( bindedAttributes[attribute] ) );
                        }
                    }
                }else{
                    // if element is a textNode update it...
                    _DEBUG_.lightblue('Bindings.render(): Updating placeholder in texNode...' , placeholder);
                    element.textContent = Placeholder.populateString( Bindings.elements.get(element) ) ;
                }

            });
        }
    }
};

export { Bindings };
