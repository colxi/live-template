/*
* @Author: colxi
* @Date:   2018-07-16 00:57:13
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-13 18:41:27
*/
import { Config } from './core-config.js';
import { Bindings } from './core-bindings.js';
import { Placeholder } from './core-placeholder.js';
import { Directives } from './core-directives.js';
import { Util } from './core-util.js';


const ObserverCallback = function( changes ){
    console.log( 'ObserverCallback(): Change event: ', changes )
    switch(changes.action){
        case 'add':
        case 'update': {
            //debugger;
            Bindings.render( changes.keyPath, changes.object)

        }
        default:
    }
    /*
    let result;
    if( prox.has(modelContents) ){
        console.log('aaaaaaaaaaaaaaalready has it', modelContents)
        result =  modelContents;
    }else{
        console.log('nooooot have it has it', modelContents)
        let model =  Array.isArray(modelContents) ? []:{};

        let ObserbableObject =  new Proxy( model , {
            set : function(___model, tokenName, value){
                // if value to SET is an Object...
                _DEBUG_.darkyellow( '- Setting an value to Model' , keyPath+tokenName , ',' ,  value );
                if( value instanceof Object && typeof value === 'object' && !(value instanceof HTMLElement) ){
                    // and property in _MODELS_ already exist and is an object, mix them...
                    let oldBinding;
                    if( model[tokenName] instanceof Object ){

                        //console.log('Object already exists...' );
                        if( Template._Bindings.iterators.has( model[tokenName] ) ){
                            //console.log('has a iterator binding');
                            oldBinding = Template._Bindings.iterators.get( model[tokenName] );
                            //console.log('old binding',oldBinding);
                            Template._Bindings.iterators.delete( model[tokenName] );
                        }//else console.log('hassss noooooo binding iterator');
                        //Object.assign( model[tokenName] , value);
                    }
                    model[tokenName] = _createModel_(value , keyPath+tokenName+'.');
                    if(oldBinding){
                        //console.log('reasigning old iterator binding t new object',oldBinding);
                        let _model =Template.Util.resolveKeyPath(keyPath+tokenName );
                        Template._Bindings.iterators.set( model[tokenName] , oldBinding);
                        let elements = Template._Bindings.iterators.get( _model.context[_model.key]);
                        let i = 0;
                        Template._Directives.for.subscribe(elements[i].element, _model.context, _model.key, _model.context[_model.key], elements[i].binderType);
                    }
                }else{
                    model[tokenName] = value;
                    // check if exist any binded element wich value has to be updated
                    //
                    // iterate each registered binding for provided token, if exist
                    // an entry in the binding names for the current binding name


                    if( Template._Bindings.placeholders.hasOwnProperty(keyPath+tokenName) ){
                        Template._Bindings.placeholders[keyPath+tokenName].forEach( element =>{
                            if(element.nodeType === Node.TEXT_NODE){
                                // if element is a textNode update it...
                                element.textContent = Template.Placeholder.populateString( Template._Bindings.elements.get(element), model) ;
                            }else{
                                // if it's not a textNode, asume Template._Bindings are set
                                // in element attributes
                                let attr_list = Template._Bindings.elements.get(element);
                                for(let attr in attr_list){
                                    //
                                    if( Template.Directives.validateName(attr) ){
                                        let _model = Template.Util.resolveKeyPath( attr_list[attr] );
                                        let binderType = attr.split('-');
                                        Template._Directives[ binderType[1] ].subscribe(element, _model.context, _model.key , _model.context[_model.key] , binderType.slice(1) );
                                    }else{
                                        if( !attr_list.hasOwnProperty(attr) ) continue;
                                        if(attr !== 'textNode')  element.setAttribute( attr,  Template.Placeholder.populateString( attr_list[attr], model ) );
                                    }
                                }
                            }
                        });
                    }
                }

                // if model is an array... check if it has an iterator binder
                if( Array.isArray(model) ){
                    // element, model, key , value , binderType
                    let _model =Template.Util.resolveKeyPath(keyPath.slice(0,-1) );

                    if( tokenName === 'length'){
                        //console.warn('-------------------------------------')
                        //console.warn('is length!!',value)
                        model.length = value
                        //console.warn('-------------------------------------')
                    }
                    if(Template._Bindings.iterators.has( _model.context[_model.key]) ){
                        let elements = Template._Bindings.iterators.get( _model.context[_model.key]);
                        // todo: can be linked t many iterators! iterate iterators
                        // .meanwhile.only the fisrt one i=0
                        let i = 0;
                        //console.log(elements);
                        Template._Directives.for.subscribe(elements[i].element, _model.context, _model.key, _model.context[_model.key], elements[i].binderType)
                    }else console.log('is member of an array but has no iteration Directive');
                }
                return true;
            }
        } );


    }
    return result;
    */
};

export { ObserverCallback };
