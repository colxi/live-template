/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-12 20:49:37
*/

/* global _DEBUG_ */



import { Bindings } from './core-bindings.js';
import { Directive } from './core-directive.js';
import { Directives } from './core-directives.js';
import { Placeholder } from './core-placeholder.js';
import { Subscribe } from './core-subscribe.js';
import { Util } from './core-util.js';
import { Keypath } from './core-keypath.js';
import { Expression } from './core-expression.js';




const Bind = {};

/**
 * [element description]
 * @param  {[type]} element [description]
 * @return {[type]}         [description]
 */
Bind.element = function( element ){
    // *************************************************************************
    // INPUT VALIDATION
    // *************************************************************************
    //
    // block if element is not an HTMLElement or a TEXT_NODE
    if( !(element instanceof HTMLElement || element instanceof Text) ){
        _DEBUG_.binding.dark('Bind.element() : Only HTMLElements and TextNodes are allowed' );
        return false;
    }
    // Block if element is a SCRIPT or STYLE
    if( element.nodeType === Node.ELEMENT_NODE){
        if( element.tagName === 'SCRIPT' || element.tagName === 'STYLE' ){
            _DEBUG_.binding.dark('Bind.Element(): Script and Style Elements can\'t be binded.' );
            return false;
        }
    }


    // uninitializedPlaceholders (Set) : all detected unique placeholders will
    // be stored in this Set. This set will be used in the last step of binding :
    // the placeholders values initialization.
    const uninitializedPlaceholders = new Set();

    // some Directives can block the binding of the Element Contents and child.
    // This flag will be set the true if a blocking Directive is found.
    let hasBlockingDirective = false;

    _DEBUG_.binding('Bind.Element(): Scanning Element :', {element });


    // *************************************************************************
    // ATTRIBUTES SCAN
    // *************************************************************************
    //
    // If it's an Element Node, start analyzing it's attributes and collecting
    // and binding the placeholders within. If a Directive attribute is found,
    // the corresponding Directive Binding will be performed too.
    if( element.nodeType === Node.ELEMENT_NODE && element.hasAttributes() ){
        // Iterate each Element attribute
        const count = element.attributes.length;
        for( let i=0 ; i < count; i++ ){
            // get current attribute
            const attribute = element.attributes[i];

            // if current attribute is a Directive attribute, check if directive
            // name has been registered. If directive exists, perform the
            // directive binding, and set the hasBlockingDirective flag ( when
            // directive requires )
            if( Directive.isDirectiveName( attribute.name ) ){
                if( Directive.exist(attribute.name) ){
                    //_DEBUG_.binding.dark('Bind.Element(): Directive Attribute found in element :',  attribute.name, '=','"'+attribute.value+'"' );
                    //
                    _bind_Directive( element , attribute.name , attribute.value.trim() );
                    if( !hasBlockingDirective && Directive.isBlocking(attribute.name) ) hasBlockingDirective = true;
                }else _DEBUG_.binding.dark('Bind.Element(): Unregistered Directive attribute found('+attribute.name+'). Ignored.' );

                // TODO : allow placeholders in directives...meanwhile, continue
                // with next attribute...
                continue;
            }

            // get an array with all the placeholders declared inside the
            // current attribute value
            const placeholders = Placeholder.getFromString( attribute.value );
            if( placeholders.length) _DEBUG_.binding.dark('Bind.Element(): Placeholder(s) found in attribute :',  attribute.name, '=','"'+attribute.value+'"' );

            // iterate each found placeholder, perform the corresponding
            // bindings, and include the placeholder in the uninitialized list
            placeholders.forEach( placeholder => {
                // add placeholder to the list of placeholders to initialize
                uninitializedPlaceholders.add(placeholder);
                // bind the attribute ( to Bindings.elements )
                // bind the placeholder ( to Bindings.placeholders )
                _bind_Attribute( element , attribute.name , attribute.value );
                _bind_Placeholder(element, placeholder);
            });
        }
    }


    // *************************************************************************
    // TEXTNODES SCAN
    // *************************************************************************
    //
    // if hasBlockingDirective flag has not been set by any Directive,
    // scan for children text nodes
    if( !hasBlockingDirective ){
        // get all the textNodes from the element (if element is a textNode ,
        // the resulting array will contain only the textnode )
        Util.getElementTextNodes( element ).forEach( textNode =>{
            // extract the expressions from the current textNode, and continue
            // to next textNode if nothing is found in current
            const expressions = Expression.getFromString( textNode.nodeValue );
            if( !expressions.length ) return false;
            //
            _DEBUG_.binding.dark('Bind.Element(): Expressions(s) found in textNode :', expressions );
            // iterate each found expression...
            expressions.forEach( expression =>{
                // if expression  was not binded previously, generate an entry
                if(typeof Bindings.expressions[expression] === 'undefined' ){
                    let ast = Expression.parse(expression)
                    Bindings.expressions[expression] ={
                        elements : [],
                        keypaths: Expression.getKeypaths(ast),
                        ast: ast
                    };
                }
                // bind current element to the expression binding entry
                Bindings.expressions[expression].elements.push( textNode );


                let placeholders = Bindings.expressions[expression].keypaths;

                placeholders.forEach( placeholder=>{

                    placeholder=placeholder.join('.');
                    // add placeholder to the list of placeholders to initialize
                    uninitializedPlaceholders.add(placeholder);
                    // bind the textnode ( to Bindings.elements )
                    // bind the placeholder ( to Bindings.placeholders )
                    _bind_TextNode( textNode, textNode.nodeValue );

                    //_bind_Placeholder(textNode, placeholder);
                    // if the tokenName has not been registered previously, generate an empty entry
                    if( !Bindings.placeholders.hasOwnProperty(placeholder) ) Bindings.placeholders[placeholder] = [];
                    // link the element with the placeholder in the Bindings registry
                    Bindings.placeholders[placeholder].push(expression);

                })
            });
        });

    }


    // *************************************************************************
    // INITIALIZE PLACEHOLDERS VALUES
    // *************************************************************************
    //
    // Render in the DOM the current value of each detected placeholder
    if( uninitializedPlaceholders.size) _DEBUG_.binding.dark('Bind.Element(): Interpolating Placeholder(s)' );

    uninitializedPlaceholders.forEach( placeholder => Subscribe.model( placeholder ) );


    // *************************************************************************
    // BIND CHILDREN NODES
    // *************************************************************************
    //
    // If no hasBlockingDirective flag has been set, and element is an
    // element Node, get all children Nodes (textnodes excluded) and call
    // recursively this Binding function, for each one.
    if( !hasBlockingDirective && element.nodeType === Node.ELEMENT_NODE){
        // if element has children nodes (Element Nodes) bind them recursively
        const childNodes = Array.from(element.children);
        if( childNodes.length) _DEBUG_.binding.dark('Bind.Element(): Element has child Nodes...');
        childNodes.forEach( child => Bind.element(child) );
    }


    Debug.loadTab();

    return true;
};


const _bind_TextNode = function( textNode , value ){
    Bindings.elements.set( textNode, value );
    return true;
};

const _bind_Attribute = function( element, attribute, value){
    // if current Element already has attribute bindings...
    if( Bindings.elements.has(element) ){
        // update the entry for the current element in the
        // Bindings Element index with the new attribute and its Template String
        const bindedAttributes =  Bindings.elements.get(element);
        bindedAttributes[ attribute ] = value;
        Bindings.elements.set(element,bindedAttributes );
    }else{
        // if it's not yet in the Bindings Element index, add
        // a new entry with the attribute name and value
        Bindings.elements.set(element , { [ attribute ] : value } );
    }
    return true;
};

const _bind_Placeholder = function( element , placeholder ){
    _DEBUG_.binding.darker('Binding PLACEHOLDER to element :', placeholder +' ->', element.tagName || 'TEXT_NODE');

    // if the tokenName has not been registered previously, generate an empty entry
    if( !Bindings.placeholders.hasOwnProperty(placeholder) ) Bindings.placeholders[placeholder] = [];
    // link the element with the placeholder in the Bindings registry
    Bindings.placeholders[placeholder].push(element);

    // done!
    return true;
};

const _bind_Directive = function( element , attributeName, value){

    _DEBUG_.binding.darker('Binding DIRECTIVE to element :', attributeName+'="'+value+'" ->', element.tagName );

    // split the directive string in tokens
    const directive = Directive.nameUnpack(attributeName);

    // if Directive attribute is quoted, its content behaves as an immutable value
    // (constant), and it's not considered a placeholder, then no Element
    // binding needs to be performed. However then Directive .subscribe
    // method must be called, to trigger the Directive action.
    if( Util.isStringQuoted( value ) ){
        _DEBUG_.binding.darker('_bind_Directive() : Directive value is a constant. Skipping Binding.');
        if( Directives[ directive.name ].hasOwnProperty('subscribe') ){
            Directives[ directive.name ].subscribe( element, undefined , directive.arguments, Util.unquoteString( value ) );
        }
    }else{
        const placeholder = value;
        //  Bind the element to the placeholder (Bindings.placeholder)
        //  and bind the placeholder to the element (Bindings.element)
        _bind_Placeholder( element, placeholder );
        _bind_Attribute( element , attributeName , placeholder);

        // Execute then <Directive>.bind method
        if( Directives[directive.name].hasOwnProperty('bind') ){
            Directives[directive.name].bind(element, placeholder , directive.arguments );
        }
        // Execute then <Directive>.subscribe method. If th placeholder Keypath
        // can't be resolved, call subscribe with an empty value.
        if( Directives[directive.name].hasOwnProperty('subscribe') ){
            if( Keypath.exist( placeholder ) ){
                const model = Keypath.resolveContext( placeholder);
                Directives[directive.name].subscribe( element, placeholder, directive.arguments , model.context[model.property] );
            }else{
                _DEBUG_.binding.darker('_bind_Directive() : Model or model property does mot exist. ('+placeholder+')');
                Directives[directive.name].subscribe( element, placeholder, directive.arguments ,  '');
            }
        }
    }
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

