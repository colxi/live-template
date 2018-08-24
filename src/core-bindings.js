/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-23 22:55:02
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
    iterators : {},
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
    render( placeholder , context ){
        //if(typeof context==='undefined')alert()
        console.log('render(): ', placeholder,context);

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
                            // check if cintext ===undefined before resolvj g
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

        const model = Keypath.resolveContext( Observer._enumerate_(), placeholder );

        // if model is an array... check if it has an iterator binder
        if( Array.isArray(model.context) ){

            let c = placeholder.split('.');
            let prop = c.splice(-1);
            c= c.join('.');

            //if( model.property === 'length')model.context.length = value
            if(Bindings.iterators.hasOwnProperty( c) && prop[0]==='length'){
                //let elements = Template._Bindings.iterators.get( model.context );
                console.log('..................')
                // todo: can be linked t many iterators! iterate iterators
                // .meanwhile.only the fisrt one i=0
                let i = Bindings.iterators[ c ]
                //console.log(elements);
                Directives.for.subscribe(i.element, c, ['for'])
            }else console.log('is member of an array but has no iteration Directive');
        }
    }
};

export { Bindings };
