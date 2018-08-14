/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-13 15:11:58
*/
import { Config } from './core-config.js';
import { Bindings } from './core-bindings.js';
import { Directives } from './core-directives.js';
import { Placeholder } from './core-placeholder.js';
import { Util } from './core-util.js';



const Unbind = {};

Unbind.element = function( element ){
    _DEBUG_.red('Unbinding ELEMENT :', eelement.nodeType === 3 ? element.parentNode : element );
    switch( element.nodeType ){
        case Node.TEXT_NODE : {
            let tokens = Placeholder.getFromTemplate( element );
            tokens.forEach( placeholder =>{
                //_unbindEvent_( element );
                Unbind.placeholder( element,placeholder );
            });
            break;
        }
        case Node.ELEMENT_NODE : {
            // get all children as Array instead of NodeList
            let all = Array.from( element.querySelectorAll('*') );
            // include in the array the Deleted root element
            all.push(element);
            all.forEach( child =>{

                for(let attr in child.attributes){
                    // block if attrName is not a property
                    if( !child.attributes.hasOwnProperty(attr) ) continue;

                    // if current attribute is a Custom Binder.. perform custom binding
                    if( Directives.validateName( child.attributes[attr].name , Config.directivePrefix) ){
                        if(Util.isStringQuoted( child.attributes[attr].value ) ) continue;

                        let model = Util.resolveKeyPath( child.attributes[attr].value );

                        if( !model ) console.log('Unbind.element() : model '+child.attributes[attr].value+' does mot exist')

                        let binderName = child.attributes[attr].name.split('-');
                        let binder = Directives.hasOwnProperty( binderName[1] ) ? Directives[ binderName[1] ] : Directives.default;
                        binder.unbind( child , child.attributes[attr].value , binderName.slice(1) );
                    }
                }





                // unbind all events
                //_unbindEvent_( child );
                let tokens = Placeholder.getFromTemplate(child);
                tokens.forEach( placeholder => Unbind.placeholder( child,placeholder ) );

                let textNodes = Util.getElementTextNodes( child );
                textNodes.forEach( Unbind.element );
                // TEXTCONTENT SEARCH (TEMPLATE)
                //Template.Util.forEachTextNodeToken(child, Unbind.placeholder , true)
                //
            });
            break;
        }
        default : {
            //_DEBUG_('onDOMChange() : Unimplemented type of Node : ' + element.nodeType.toString() ,element);
        }
    }
    return true;
};

Unbind.placeholder = function (element , placeholder){

    _DEBUG_.red('Unbinding PLACEHOLDER from element :', placeholder, element.nodeType === 3 ? element.parentNode :element );

    if( Bindings.placeholders.hasOwnProperty( placeholder ) ){
        let index = Bindings.placeholders[placeholder].indexOf(element);
        if (index !== -1) Bindings.placeholders[placeholder].splice(index, 1);
        if( !Bindings.placeholders[placeholder].length ){
            Bindings.placeholders[placeholder] = null;
            delete Bindings.placeholders[placeholder];
            //Bindings.elements.delete( element )
        }
    }
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


