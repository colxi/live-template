/*
* @Author: colxi
* @Date:   2018-08-24 10:58:42
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-08 00:01:38
*/

import { Config } from './core-config.js';
import { Expression } from './core-expression.js';
import { Keypath } from './core-keypath.js';
import { Bindings } from './core-bindings.js';
import { Directive } from './core-directive.js';
import { Directives } from './core-directives.js';
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
        Bindings.placeholders[placeholder].forEach( expression =>{
            console.log(expression)
            Bindings.expressions[expression].elements.forEach( element=>{
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
                        // if is a Directive...
                        if( Directive.isDirectiveName( attribute ) && Directive.exist( attribute )){
                            const directive = Directive.nameUnpack(attribute);

                            // todo :check if context ===undefined before resolving
                            const value = Keypath.resolve( placeholder );
                            if(Directives[directive.name].hasOwnProperty('subscribe')){
                                Directives[directive.name].subscribe(element, placeholder, directive.arguments, value );
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
                    // generate the search regular expresion with the current placeholder
                    let regExpExpression =  expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string

                    let search = new RegExp( Config._replacePlaceholdersExpString.replace('__PLACEHOLDER__', regExpExpression) ,'g');
                    // find te value of the Binding placeholder, in  the provided model, and
                    // replace every placeholder reference in the string, with it
                    let keypaths = Bindings.expressions[expression].keypaths;
                    console.log(keypaths)
                    let context ={}
                    for(let i=0;i<keypaths.length;i++){
                        context[keypaths[i][0]]= Template.Model(keypaths[i][0])
                    }
                    console.log(Bindings.expressions[expression].ast)
                    let value= Expression.evaluate(Bindings.expressions[expression].ast,context)

                    element.textContent = Bindings.elements.get(element).replace( search , value );

                    //element.textContent = Placeholder.populateString( Bindings.elements.get(element) ) ;

                }
            })
        });
    }

    const model = Keypath.resolveContext( placeholder );

    // if model is an array... check if it has an iterator binder
    if( Array.isArray(model.context) ){

        let keypath = placeholder.split('.');
        let prop = keypath.splice(-1);
        keypath= keypath.join('.');

        // if( model.property === 'length')model.context.length = value
        if(Bindings.iterators.hasOwnProperty( keypath ) && prop[0]==='length'){
            //let elements = Template._Bindings.iterators.get( model.context );
            // todo: can be linked t many iterators! iterate iterators
            // .meanwhile.only the fisrt one i=0

            Bindings.iterators[ keypath ].forEach( (value,element)=>Directives.for.subscribe(element, keypath, ['for'], model.context ) )
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

