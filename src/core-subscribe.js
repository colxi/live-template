/*
* @Author: colxi
* @Date:   2018-08-24 10:58:42
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-28 22:54:31
*/

import { Keypath } from './core-keypath.js';
import { Bindings } from './core-bindings.js';
import { Directive, Directives } from './core-directives.js';
import { Placeholder } from './core-placeholder.js';

// fil should be core-dom
// dom.publish
// dom.subscribe

const Subscribe= {};

Subscribe.model= function( placeholder , context ){
    //if(typeof context==='undefined')alert()
    console.log('Subscribe.model(): ', placeholder);

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
                        const value = Keypath.resolve( placeholder );
                        if(Directives[directiveName].hasOwnProperty('subscribe')){
                            Directives[directiveName].subscribe(element, placeholder, directiveArgs, value );
                        }
                    }else{
                        // is a regular attribute
                        _DEBUG_.lightblue('Subscribe.model(): Updating placeholder in Attribute ...' , attribute+'='+bindedAttributes[attribute] );
                        element.setAttribute( attribute,  Placeholder.populateString( bindedAttributes[attribute] ) );
                    }
                }
            }else{
                // if element is a textNode update it...
                _DEBUG_.lightblue('Subscribe.model(): Updating placeholder in texNode...' , placeholder);
                element.textContent = Placeholder.populateString( Bindings.elements.get(element) ) ;
            }

        });
    }

    const model = Keypath.resolveContext( placeholder );

    // if model is an array... check if it has an iterator binder
    if( Array.isArray(model.context) ){

        let c = placeholder.split('.');
        let prop = c.splice(-1);
        c= c.join('.');

        //if( model.property === 'length')model.context.length = value
        if(Bindings.iterators.hasOwnProperty( c ) && prop[0]==='length'){
            //let elements = Template._Bindings.iterators.get( model.context );
            // todo: can be linked t many iterators! iterate iterators
            // .meanwhile.only the fisrt one i=0
            let i = Bindings.iterators[ c ]
            Directives.for.subscribe(i.element, c, ['for'], model.context )
        };
    }
}




Subscribe.dom= function( changes ){
    console.log( 'Subscribe.dom():', 'Element('+ changes.action+'ed)'       , changes.keyPath )
    switch(changes.action){
        case 'add':
        case 'update': {
            //debugger;
            Subscribe.model( changes.keyPath, changes.object)
            break;
        }
        default:{}
    }
}

export { Subscribe }

