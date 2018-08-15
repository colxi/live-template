/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-14 13:07:21
*/

/* global _DEBUG_ */

import { Directives } from './core-directives.js';
import { Placeholder } from './core-placeholder.js';


/**
 * Template._Bindings holds two indexes :
 * - An Array with the PLACEHOLDERS, associating each  placeholder token to
 * each element wich contains it,
 * - A Weak Map for the ELEMENTS, wich stores each the Element original value
 * with the placeholders strings (template tokens)
 */
const Bindings = {
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
    events : new WeakMap(),
    iterators : new WeakMap(),
    elements : new WeakMap(),
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
    render( placeholder ){
        // if placeholder it's been previously Binded to any element(s)
        if( Bindings.placeholders.hasOwnProperty(placeholder) ){
            // iterate each binded element to the placeholder...
            Bindings.placeholders[placeholder].forEach( element =>{

                if(element.nodeType === Node.TEXT_NODE){
                    // if element is a textNode update it...
                    _DEBUG_.lightblue('Bindings.render(): Updating placeholder in texNode...' , placeholder);
                    element.textContent = Placeholder.populateString( Bindings.elements.get(element) ) ;
                }else{
                    // Is an element attribute(s)
                    // retrieve the element attributes with bindings
                    let attr_list = Bindings.elements.get(element);
                    // iterate all binded attributes
                    for(let attr in attr_list){
                        //
                        if( Directives.validateName( attr ) ){
                            // is a Directive
                            console.log('placeholder.render(): addapt & uncomment following code');
                            //let context = Util.resolveKeyPath( attr_list[attr] );
                            //let binderType = attr.split('-');
                            //Directives[ binderType[1] ].subfscribe(element, attr_list[attr] , binderType.slice(1), context.model[context.key] );
                        }else{
                            if( !attr_list.hasOwnProperty(attr) ) continue;
                            if(attr !== 'textNode'){
                                _DEBUG_.lightblue('Bindings.render(): Updating placeholder in Attribute ...' , attr_list[attr] );
                                element.setAttribute( attr,  Placeholder.populateString( attr_list[attr] ) );
                            }
                        }
                    }
                }

            });
        }
    }
};

export { Bindings };
