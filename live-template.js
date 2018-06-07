/*
* @Author: colxi.kl
* @Date:   2018-05-18 03:45:24
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-06-04 12:49:27
*/


// inject CSS
const Template = (function(){
	"use strict";

	const _DEBUG_ = function( ...msg ){
		if( _CONFIG_.debugMode ) console.log( ...msg );
	};


	const _CONFIG_ = {
		debugMode 				: true,
		binderPrefix 			: 'pg',
		placeholderDelimitiers  : ['${' , '}'],
		modelsNamesExtension 	: '.js',
		viewsNamesExtension 	: '.html',
		modelsPath 				: './models/',
		viewsPath 				: './views/'
	};


	let _OBSERVER_ = new MutationObserver( mutationsList => {
	    for(let mutation of mutationsList){
	        if (mutation.type !== 'childList') continue;
            // first process Removed Nodes
            mutation.removedNodes.forEach( _unbindElement_ );
            // and then Added Nodes
            mutation.addedNodes.forEach(  _bindElement_  );
	    }
	    // done !
	});

	/**
	 * _MODELS_ is a proxy wich grants acces to the models stored internally
	 * @param {[type]} obj                       [description]
	 * @param {[type]} modelName                 [description]
	 * @param {[type]} modelContents)
	 * @param {[type]}
	 */
	const _MODELS_ = new Proxy( {} , {
		set : function(obj, modelName, modelContents){
			// if value is not an Object throw an error
			if( !(modelContents instanceof Object) ) throw new Error('new Model must be an object!');
			// if model name already declared attach new properties, if not
			// exists yet, create it.
			if( obj[modelName] ) Object.assign( obj[modelName], modelContents );
			else obj[modelName] = _createModel_(modelContents, modelName+'.');
			// done !
			return true;
		},
		get : function(obj, modelName){
			return obj[modelName];
		}
	});

	/**
	 * _BINDINGS_ holds two indexes :
	 * - An Array with the PLACEHOLDERS, associating each  placeholder token to
	 * each element wich contains it,
	 * - A Weak Map for the ELEMENTS, wich stores each the Element original value
	 * with the placeholders strings (template tokens)
	 */
	let _BINDINGS_ = {
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
		elements : new WeakMap()
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
	};

	/**
	 * [_createModel_ description]
	 * @param  {[type]} modelContents [description]
	 * @param  {[type]} keyPath       [description]
	 * @return {[type]}               [description]
	 */
	const _createModel_ = function( modelContents, keyPath){
		let level =  new Proxy( {} , {
			set : function(model, tokenName, value){

				// if value to SET is an Object...
				if( value instanceof Object && typeof value === 'object' && !(value instanceof HTMLElement) ){
					// and property in _MODELS_ already exist and is an object, mix them...
					if( model[tokenName] instanceof Object ) Object.assign( model[tokenName] , value);
					// if its not an object, generate another Level in the proxy
					else model[tokenName] = _createModel_(value , keyPath+tokenName+'.');
					// done!
					return true;
				}

				model[tokenName] = value;
				// check if exist any binded element wich value has to be updated
				//
				// iterate each registered binding for provided token, if exist
				// an entry in the binding names for the current binding name

				// _BINDINGS_ to Global _MODELS_ (_root) are stored without the _root
				// keypath _CONFIG_.binderPrefix. Remove it.
				if(keyPath === '_root.') keyPath = '';
				if( _BINDINGS_.placeholders.hasOwnProperty(keyPath+tokenName) ){
					_BINDINGS_.placeholders[keyPath+tokenName].forEach( element =>{
						if(element.nodeType === Node.TEXT_NODE){
							// if element is a textNode update it...
							element.textContent = Template.Util.populateStringPlaceholders( _BINDINGS_.elements.get(element), model) ;
						}else{
							// if it's not a textNode, asume _BINDINGS_ are set
							// in element attributes
							let attr_list = _BINDINGS_.elements.get(element);
							for(let attr in attr_list){
								//
								if( Template.Util.isCustomBinder(attr) ){
									let _model = Template.Util.resolveKeyPath( attr_list[attr] );
									let bindingFn = attr.split('-');
									binders[ bindingFn[1] ].subscribe(element, _model.context, _model.key , _model.context[_model.key] , bindingFn.slice(1) );
								}else{
									if( !attr_list.hasOwnProperty(attr) ) continue;
									if(attr !== 'textNode')  element.setAttribute( attr,  Template.Util.populateStringPlaceholders( attr_list[attr], model ) );
								}
							}
						}



					});
				}
				return true;
			},

			get : function(model, tokenName){
				return model[tokenName];
			}
		} );

		// assign the properties to the level
		Object.assign( level, modelContents );
		return level;
	};


	const  _bindElement__customBinder_ = function( element , customBinderName ){
		// get the value of the customBinder attribute
		let stringValue = element.getAttribute( customBinderName ).trim();
		// split the customBinder Name in tokens  -> 'pg-on-click' = ['pg','on', 'click']
		let customBinder = customBinderName.split('-');

	    if( Template.Util.isStringQuoted( stringValue ) ){
			// if value is quoted, call binder[customBinder].subscribte
			// with the quoted value (quotes stripped)
	        binders[ customBinder[1] ].subscribe( element, undefined, undefined, stringValue.slice(1, -1) , customBinder.slice(1));
	        // TODO...
	        // don't perform BINDING! (there is no variable value to bind)
		}
		else{
			// TODO: stringValue can contain multiple placeHolders... right now it
			// only takes and proces the first one.. MUST HANDLE AS MANY AS DETECTED!
			let placeholder = stringValue;

			_bindPlaceholder_(element, placeholder);
			_bindElement__addAttribute_( element , customBinderName , stringValue)


			// get placeholder model context
			let model = Template.Util.resolveKeyPath(placeholder);

			// determine the apropiate binder (if requested binder does not exist call default one)
			let binder = binders.hasOwnProperty(customBinder[1]) ? binders[customBinder[1]] : binders.default;
			// bind and subscribe
			binder.bind(element,model.context, model.key, model.context[model.key] ,  customBinder.slice(1) );
			binder.subscribe( element, model.context, model.key, model.context[model.key], customBinder.slice(1) );
		}
		return true;
	}

	const _bindElement__addAttribute_ = function( element, attribute, value){
		// if current Element already has attribute bindings...
		if( _BINDINGS_.elements.has(element) ){
			// update the entry for the current element in the
			// Bindings Element index with the new attribute and its Template String
			let bindedAttributes = _BINDINGS_.elements.get(element);
			bindedAttributes[ attribute ] = value;
			_BINDINGS_.elements.set(element,bindedAttributes );
		}else{
			// if it's not yet in the Bindings Element index, add
			// a new entry with the attribute name and value
			_BINDINGS_.elements.set(element , { [ attribute ] : value } );
		}
		return true;
	}

	/**
	 * [_bindElement_ description]
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	const _bindElement_ = function( element ){
		// container to store all detected bindings, to initialize them when
		// the binding is completed (it can't be done on the fly because it could
		// destroy the template, before is stored)
		let uninitializedPlaceholders = [];

		let blockBindingNested = false;

		if( element.nodeType === Node.ELEMENT_NODE ){
			// Iterate each Element attribute
			for(let attr in element.attributes){
				// block if attrName is not a property
				if( !element.attributes.hasOwnProperty(attr) ) continue;

				// collect all the placeholders from the attribute in an array
				let placeholders = Template.Util.getStringPlaceholders( element.attributes[attr].value );
				// and store them to in the list of placeholders to initialize
				uninitializedPlaceholders = uninitializedPlaceholders.concat( placeholders )

				// if current attribute is a Custom Binder.. perform custom binding
				if( Template.Util.isCustomBinder( element.attributes[attr].name ) ){
					_bindElement__customBinder_( element , element.attributes[attr].name );
					let customBinder = element.attributes[attr].name.split('-')[1];
					if( binders.hasOwnProperty(customBinder) && binders[customBinder].block === true ) blockBindingNested = true;
					continue;
				}

				// iterate all placeholders detected in the attribute value
				// and perform the binding of each one
				placeholders.forEach( placeholder=>{
					let model = Template.Util.resolveKeyPath(placeholder);
					_bindElement__addAttribute_( element , element.attributes[attr].name , element.attributes[attr].value );
					// bind the element with the placeholder
					_bindPlaceholder_(element, placeholder);
				});
			}
		};
		if( !blockBindingNested ){
			// get all the textNodes (if current node is a textNode only operate with
			// it), retrieve the placeholder within, and bind them to the element
			Template.Util.getElementTextNodes( element ).forEach( textNode =>{
				Template.Util.getTextNodePlaceholders( textNode ).forEach( placeholder =>{
					 uninitializedPlaceholders.push( placeholder )

					_BINDINGS_.elements.set(textNode, textNode.nodeValue );
					_bindPlaceholder_(textNode, placeholder);
				});
			});

			// if element has childnodes and are Element Nodes (text nodes have already
			// been binded), bind them recursively
			if( element.childNodes.length) element.childNodes.forEach( childNode =>{
				if( childNode.nodeType === Node.ELEMENT_NODE ) _bindElement_( childNode )
			});
		}

		// no more tasks pending! initialize placeholders in element!
		uninitializedPlaceholders.forEach( placeholder => {
			let model = Template.Util.resolveKeyPath(placeholder);
			model.context[model.key] =model.context[model.key];
		} );
		// done!
		return true;
	};


	/**
	 * [_bindPlaceholder_ description]
	 * @param  {[type]} element     [description]
	 * @param  {[type]} placeholder [description]
	 * @return {[type]}             [description]
	 */
	const _bindPlaceholder_ = function( element , placeholder ){
		// block if no binding name has been provided
		if( placeholder.trim() === undefined ) throw new Error('Imposible to perform binding. Binding name not provided in Element');

		// if the tokenName has not been registered previously, generate an empty entry
		if( !_BINDINGS_.placeholders.hasOwnProperty(placeholder) ) _BINDINGS_.placeholders[placeholder] = [];
		// link the element with the placeholder in the _BINDINGS_ registry
		_BINDINGS_.placeholders[placeholder].push(element);

		// get the container model, if model was not provided
		let model = Template.Util.resolveKeyPath(placeholder);
		// TODO: add an observer to the element to track changes in its structure/_BINDINGS_

		// When item is not linked with any _MODELS_ (Model_root) create a
		// variable acces in the 'window' Object, to simulate global variable
		if( model.context === _MODELS_._root ){

			// if variable already exist in window, delete it and assign again
            // later, after creating the getter and setter
            let temp;
            if( window.hasOwnProperty(model.key) ){
                temp = window[model.key];
                delete window[model.key];
            }

			Object.defineProperty(window, model.key, {
				set: function(value) {
					_MODELS_._root[model.key] = value;
				},
				get: function() {
					return _MODELS_._root[model.key];
				},
                configurable : true,
                enumerable: true
			});

            // if variable existed previously reasign its original value
            if( typeof temp !== 'undefined' ) window[model.key] = temp;
		}

		// done!
		return true;
	};

	const _bindEvent_ = function(element, type, handler){
		let bindedEvents = {};
		// check if element has other events bindings
		if( _BINDINGS_.events.has( element ) ){
			// it does! get the event bindings list
			bindedEvents = _BINDINGS_.events.get( element );
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
		_BINDINGS_.events.set( element, bindedEvents );
		// Create the DOM event listener
		element.addEventListener(type, handler);
		// done!
		return true;
	};


	/**
	 * [_unbindElement_ description]
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	const _unbindElement_ = function( element ){
		switch( element.nodeType ){
    		case Node.TEXT_NODE : {
    			let tokens = Template.Util.getTextNodePlaceholders(element,true);
        		tokens.forEach( placeholder =>{
	            	//_unbindEvent_( element );
        			_unbindPlaceholder_( element,placeholder );
        		});
        		break;
        	}
    		case Node.ELEMENT_NODE : {
            	// get all children as Array instead of NodeList
            	let all = Array.from( element.querySelectorAll("*") );
            	// include in the array the Deleted root element
            	all.push(element);
            	all.forEach( child =>{

            		for(let attr in child.attributes){
						// block if attrName is not a property
						if( !child.attributes.hasOwnProperty(attr) ) continue;

						// if current attribute is a Custom Binder.. perform custom binding
						if( Template.Util.isCustomBinder( child.attributes[attr].name ) ){
							if( Template.Util.isStringQuoted( child.attributes[attr].value ) ) continue;

							let model = Template.Util.resolveKeyPath( child.attributes[attr].value );

							let binderName = child.attributes[attr].name.split('-');
							let binder = binders.hasOwnProperty( binderName[1] ) ? binders[ binderName[1] ] : binders.default;
							binder.unbind( child , model.context , model.key, model.context[ model.key ], binderName.slice(1) );
						}
					}





	            	// unbind all events
	            	//_unbindEvent_( child );
	            	let tokens = Template.Util.getTemplatePlaceholders(child);
            		tokens.forEach( placeholder => _unbindPlaceholder_( child,placeholder ) );

            		let textNodes = Template.Util.getElementTextNodes( child );
            		textNodes.forEach( _unbindElement_ );
					// TEXTCONTENT SEARCH (TEMPLATE)
            		//Template.Util.forEachTextNodeToken(child, _unbindPlaceholder_ , true)
            		//
            	});
            	break;
            }
    		default : {
    			_DEBUG_('onDOMChange() : Unimplemented type of Node : ' + element.nodeType.toString() ,element);
    		}
    	}
    	return true;
	};

	const _unbindPlaceholder_ = function (element , placeholder){
		if( _BINDINGS_.placeholders.hasOwnProperty( placeholder ) ){
			let index = _BINDINGS_.placeholders[placeholder].indexOf(element);
			if (index !== -1)  _BINDINGS_.placeholders[placeholder].splice(index, 1);
			if( !_BINDINGS_.placeholders[placeholder].length ){
				_BINDINGS_.placeholders[placeholder] = null;
				delete _BINDINGS_.placeholders[placeholder];
				//_BINDINGS_.elements.delete( element )
			}
		}
	}

	const _unbindEvent_ = function( element , event = '' ){
		// if element has event bindings...
		if( _BINDINGS_.events.has(element) ){
			// get the list of bindings and iterate it
			let eventBindings  = _BINDINGS_.events.get( element );
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
			if( Object.keys( eventBindings ).length ) _BINDINGS_.events.set( element , eventBindings );
			// else, delete Event Bindings entry for element
			else _BINDINGS_.events.delete( element );
		}
		// done!
		return true;
	}



	let expresion = {
		tokenMatch :   /(?<!\\)\${[^{}]*}/g,
		tokenReplace : '(?<!\\\\)\\${\\s*__TOKEN__\\s*}'
	}



	let binders = {
		// pg-value
		value : {
			bind : function(element, model, key , value , binderType){
				console.log("binding FOR: pg-value")
				_bindEvent_( element, 'input', e=>this.publish(element, model , key, e.target.value) );
			},
			unbind : function( element, model, key , value , binderType){
				console.log("unbinding FOR: pg-value")
				_unbindEvent_( element , 'input' );
			},
			publish : function(element, model, key , value , binderType){
				// change in DOM must be setted to _MODELS_ Object
				model[key] = value;
			},
			subscribe : function(element, model, key , value , binderType){
                // change in object must be reflected in DOM
				element.value = value || '' ;
			},
		},
		if : {
			bind : function(element, model, key , value , binderType){},
			unbind : function( element, model, key , value , binderType ){},
			publish : function(element, model, key , value , binderType){},
			subscribe : function(element, model, key , value , binderType){
				// handle "true" "false" strings and "0" and "1" stringss
                if(value) value = JSON.parse(value);
                // show the element if value is True, or any other value not
                // interpreted as False (like null, undefined, 0 ...)
                if( value || value === undefined){
                    element.style.display = '';
                }else{
                    element.style.setProperty("display", "none", "important")
                }
			},
		},
		model : {
			bind : function(element, model, key , value , binderType){},
			unbind : function( element, model, key , value , binderType ){},
			publish : function(element, model, key , value , binderType){},
			subscribe : function(element, model, key , value , binderType){

                Template.loadModel( value )
            },
		},
        view : {
            bind : function(element, model, key , value , binderType){},
            unbind : function(element, model, key , value , binderType){  },
            publish : function(element, model, key , value , binderType){},
            subscribe : function(element, model, key , value , binderType){
                console.log('subscribe view', value)
                //element.innerHTML = '';
                while(element.firstChild){
				    element.removeChild(element.firstChild);
				}

                if( value && value.length ){
                    Template.loadView( value ).then( html =>{
                        if(html !== false) element.innerHTML = html;
                        else{
                            if(_CONFIG_.debugMode){
                                element.innerHTML = "<div style='color:white; background:red;padding:5px'>Unable to load View " + _CONFIG_.viewsPath + value + _CONFIG_.viewsNamesExtension +'</div>';
                            }
                        }
                    });
                }
            },
        },
		select : {
			bind : function(element, model, key , value , binderType){
				//
				model[key] = element;

			},
			unbind : function(element, model, key , value , binderType){
				model[key] = null;
				model[key] = undefined;
				return true;
			},
			publish : function(element, model, key , value , binderType){},
			subscribe : function(element, model, key , value , binderType){},
		},
		on : {
			bind : function(element, model, key , value , binderType){
				console.log("binding FOR on-"+binderType[1], model[key])
				_bindEvent_( element, binderType[1], e=>model[key](e) );
			},
			unbind : function(element, model, key , value , binderType){
				console.log("unbinding FOR on-"+binderType[1]);
				_unbindEvent_( element , binderType[1] );

			},
			publish : function(element, model, key , value , binderType){},
			subscribe : function(element, model, key , value , binderType){},
		},
		for : {
			block : true,
			bind : function(element, model, key , value , binderType){
				console.log('binding FOR for-'+binderType[1]);
				let content = element.innerHTML;
				element.innerHTML = '';
				window.asd = content;
			},
			unbind : function( element, model, key , value , binderType ){},
			publish : function(element, model, key , value , binderType){},
			subscribe : function(element, model, key , value , binderType){
				console.log( "susbscribe FOR for-"+binderType[1] );
				for( let i=0; i< Object.keys(value).length; i++){
					element.innerHTML += window.asd.replace(binderType[1], 'myApp.collection.'+i);
				}
			},
		},
		// pg-unknown :  undeclared binders perform default action...
		default : {
			bind: function(element, model, key , value , binderType){
				_DEBUG_('DEFAULT BINDER bind():',element,model,key,binderType)
			}
		}
	}

	return {
		/**
		 * [init description]
		 * @return {[type]} [description]
		 */
		bind : function(){
			_bindElement_(document.documentElement);
			// observe the document topMost element
			_OBSERVER_.observe(document.documentElement, { attributes: false, childList: true , subtree:true, characterData:false});
		},

		unbind : function(element = document.documentElement ){

			if( _BINDINGS_.elements.has(element) ){
				let value = _BINDINGS_.elements.get(element);
				console.log(value)
				if( element.nodeType === Node.TEXT_NODE ){
					element.textContent = value;
				}else{
					for(let attr in value){
						if( !value.hasOwnProperty(attr) ) continue;
						element.setAttribute( attr , value[attr] )
					}
				}
				_unbindElement_( element );
			}

			if( element.childNodes.length) element.childNodes.forEach( e=> Template.unbind(e) );

			if( element === document.documentElement) _OBSERVER_.disconnect();
		},

		/**
		 * [Model description]
		 * @param {[type]} modelName [description]
		 * @param {Object} content   [description]
		 */
		Model : function(modelName, content = {} ){
			if( !(this instanceof Template.Model) ) throw new Error("Model Constructor must be called using 'new'.");
			_MODELS_[modelName] = content;
			return _MODELS_[modelName];
		},

		/**
		 * [View description]
		 * @param {[type]} viewName [description]
		 * @param {[type]} content  [description]
		 */
		View : function( viewName, content){
			//
            //
		},

		/**
		 * [loadModel description]
		 * @param  {String} modelName [description]
		 * @return {[type]}           [description]
		 */
		loadModel : /* async */ function( modelName = '' ){
			if( typeof modelName !== 'string' ) throw new Error("Template.loadModel() : Model name must be a String.");

			// prepare the pathname
			modelName = modelName.trim();
			modelName = _CONFIG_.modelsPath + modelName;
			if( _CONFIG_.modelsNamesExtension ) modelName = modelName + _CONFIG_.modelsNamesExtension;

			return new Promise((resolve, reject) => {
				let script = document.createElement("script");
				let loaderId = "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2);

				// Handler to be executed when Module is loaded
				window[loaderId] = function( m ){
					resolve( m );
					// remove loader function and script element
					window[loaderId] = null;
					delete window[loaderId];
					script.remove();
					script = null;
				};
				// Handler to Errors on load
				script.onerror = () => {
					reject( new Error("Template.loadModel() : Failed to load model script with URL " + modelName));
					// remove loader function and script element
					window[loaderId] = null;
					delete window[loaderId];
					script.remove();
					script = null;
				};
				// configure the  Module Script Element ...
				script.type = "module";
				script.textContent = `import * as m from "${modelName}"; window.${loaderId}( m.default )`;
				// insert the Script element to trigger the module load
				document.documentElement.appendChild(script);
			});
		},

		/**
		 * [loadView description]
		 * @param  {String} viewName [description]
		 * @return {[type]}          [description]
		 */
		loadView : /*async*/ function( viewName = '' ){
            if( typeof viewName !== 'string' ) throw new Error("Template.loadView() : View name must be a String.");
			//
            return new Promise( function(resolve,reject){
                fetch(_CONFIG_.viewsPath + viewName + _CONFIG_.viewsNamesExtension)
                .then( response =>{
                    resolve( (response.ok === true ) ? response.text() : false );
                });
            })
        },

		/**
		 * [Util description]
		 * @type {Object}
		 */
		Util : {
			/**
			 * [inDOM description]
			 * @param  {[type]} el [description]
			 * @return {[type]}    [description]
			 */
			DOMContains( el ) {
				if( !el ) return false;
				while ( el = el.parentNode ) if ( el === document ) return true;
				return false;
			},

			getElementTextNodes : function(element){
				let textNodes = [];
				// if element is a TextNode return itself inside an aeeay
				if( element.nodeType === Node.TEXT_NODE ) textNodes.push( element );
				else{
					// is element is a Scrip or Style return empty array (don't analyze them)
					if( element.tagName === 'SCRIPT' && element.tagName === 'STYLE') return textNodes;
					// else... insert all textnodes inside the array
					element.childNodes.forEach( childNode=>{
		    		    if( childNode.nodeType === Node.TEXT_NODE ) textNodes.push( childNode );
					});
				}
				return textNodes;
			},
			/**
			 * [stringHasSpaces description]
			 * @param  {[type]} string [description]
			 * @return {[type]}        [description]
			 */
			stringHasSpaces: function(string){
				if( typeof string !== 'string'){
					throw new Error('Template.Util.stringHasSpaces() : Provided value is not a String');
				}
				return /\s/.test( string );
			},

			isStringQuoted: function( string ){
				string = string.trim();
				let firstChar 	= string.slice(0,1);
				let lastChar 	= string.slice(-1);

			  	if( ( firstChar === '\'' && lastChar === '\'') || ( firstChar === '"' && lastChar === '"') 	) return true;
			  	else return false;
			},

			/**
			 * Template.Util.isCustomBinder() : If the attribute name has a binder name syntax
			 * structure return the binder name, if not , return false
			 *
			 * @param  {[type]}  attrName [description]
			 * @return {Boolean}          [description]
			 */
			isCustomBinder( attrName ){
				//
                let binderNameParts = attrName.split('-');
                if ( binderNameParts[0] !== _CONFIG_.binderPrefix ) return false;
                else return true;

				//return ( attrName.substring(0, (_CONFIG_.binderPrefix.length+1)) == _CONFIG_.binderPrefix + "-") ? attrName.substring(3) : false;
			},

			/**
			 * [Template.Util.removePlaceholderDelimiters description]
			 * @param  {[type]} bindName){              ( [description]
			 * @return {[type]}             [description]
			 */
			removePlaceholderDelimiters( placeholder = '' ){
				//
				placeholder = placeholder.trim()
				placeholder = placeholder.slice( _CONFIG_.placeholderDelimitiers[0].length, ( 0-_CONFIG_.placeholderDelimitiers[1].length ) )
				return placeholder.trim();
			},

			/**
			 * Template.Util.getStringPlaceholders(): Return an array with all the tokens found in the
			 * provided String. If no tokens are found returns an empty array.
			 *
			 * @param  {String}  string                 String to analyze
			 * @param  {Boolean} stripDelimiters 		Return tokens without delimiters
			 *
			 * @return {Array}                          Array of tokens
			 */
			getStringPlaceholders( string = '' ){
				// extract all placeholders from string
				let placeholders =  string.match( expresion.tokenMatch ) || [];
				// remove duplicates!
				placeholders = Array.from( new Set(placeholders) );
				placeholders = placeholders.map( current => Template.Util.removePlaceholderDelimiters(current) );
				// strip delimiters from token...
				return placeholders;
			},

			/**
			 * [getTemplatePlaceholders description]
			 * @param  {[type]} element [description]
			 * @return {[type]}         [description]
			 */
			getTemplatePlaceholders : function( element ){
				// inspect Attributes
				let placeholders = [];

				if( _BINDINGS_.elements.has( element ) ){
					// get all stringTokens in current Element Attribute Template
					let attributes = _BINDINGS_.elements.get( element );
					for(let currentAttr in attributes){
						if( !attributes.hasOwnProperty(currentAttr) ) continue;
						let placeholdersPartial = Template.Util.getStringPlaceholders(  attributes[currentAttr] ) ;

						if( Template.Util.isCustomBinder( currentAttr ) && !placeholdersPartial.lenght ){
							// if value is quoted, call binder[bindername].subscribte
							// with the quoted value
							let v = attributes[currentAttr].trim();
							if( Template.Util.isStringQuoted( v ) )continue;
							// if is a Binder Attribute (eg: pg-model), extract the value
							else placeholdersPartial = [ v ];
						}
						placeholders = placeholders.concat( placeholdersPartial );
					}
				}
				return placeholders;
			},

			/**
			 * [Template.Util.populateStringPlaceholders description]
			 *
			 * @param  {[type]} string [description]
			 *
			 * @return {[type]}        [description]
			 */
			populateStringPlaceholders( string = ''){
				// retrieve all the placeholders contained in the string
				let placeholders = Template.Util.getStringPlaceholders( string );
				// iterate each placeholder
				placeholders.forEach( placeholder=>{
					let model = Template.Util.resolveKeyPath( placeholder );
					// generate the search regular expresion with the current placeholder
                    let search = new RegExp( expresion.tokenReplace.replace('__TOKEN__', placeholder) ,"g");
                    // find te value of the Binding placeholder, in the provided model, and
                    // replace every placeholder reference in the string, with it
					string = string.replace( search , (model.context[model.key] || '') );
				})
				// done! return parsed String
				return string;
			},

			/**
			 * [Template.Util.resolveKeyPath description]
			 * @param  {[type]} keyPath [description]
			 * @return {[type]}         [description]
			 */
			resolveKeyPath( keyPath ){
				// split the string in the diferent path levels
				let parts = keyPath.split(".");
				// extract the last item (asume is the property)
				let bindName = ( parts.splice(-1,1) )[0];
				let result;

				if( parts.length === 0 ){
					//
					// if there are no keys to iterate, asume is a global binding (_root model)
					//
					// if _root model does not exist create it
					if( !_MODELS_['_root'] ) _MODELS_['_root']  = {};
					// generate output object
					result = { context : _MODELS_['_root'] , key : bindName };
				}else{
					//
					// keys are found, iterate them to generate the model context
					//
					let context = _MODELS_;
					for(let i = 0; i<parts.length;i++){
						// if model context does not exist, create it
						if( typeof context[ parts[i] ] === 'undefined' ) context[ parts[i] ] = {};
						// assign the context
						context = context[ parts[i] ];
					}
					// generate the output object
					result = { context : context , key : bindName }
				}
				// done!
				return result;
			},

			getTextNodePlaceholders( texNode, searchInTemplate=false ){
				let placeholders = [];
				// Scan only textNodes
		    	if(searchInTemplate){
	    			// if requested, search for placeholders in the template
		    		if( _BINDINGS_.elements.has(texNode) ){
		    			placeholders = Template.Util.getStringPlaceholders( _BINDINGS_.elements.get(texNode) );
		    		}
		    	}else{
					// ...or search for placeholders in the textNode current value
					placeholders = Template.Util.getStringPlaceholders(texNode.nodeValue );
				}
				return placeholders;
			},

            exposeBindings: function(){
                console.log(_BINDINGS_)
            }
		},


		/** CONFIGURATION */
		set Config( configObject ){
			if( typeof configObject !== 'object' ) throw new Error('Template.Config : Provided value must be an Object.')
			for (let property in configObject){
				if( !configObject.hasOwnProperty(property) ) continue;
				this.Config[property] = configObject[property];
			}
			return true;
		},
		get Config(){
			return {
				// Getters
				get debugMode(){ return _CONFIG_.debugMode},
				get binderPrefix(){ return _CONFIG_.binderPrefix},
				get	placeholderDelimitiers(){ return _CONFIG_.placeholderDelimitiers },
				get modelsNamesExtension(){ return _CONFIG_.modelsNamesExtension },
				get viewsNamesExtension(){ return _CONFIG_.viewsNamesExtension },
				get	modelsPath(){ return _CONFIG_.modelsPath },
				get	viewsPath(){ return _CONFIG_.viewsPath },
				// Setters
				set debugMode( value  ){
					_CONFIG_.debugMode = value ? true : false;
					return true;
				},
				set binderPrefix( value ){
					// value validation
					if( typeof value !== 'string' ) throw new Error('Template.Config.binderPrefix : Value must be a String.');
					value = value.trim().toLowerCase();
					if( !value.length  ) throw new Error('Template.Config.binderPrefix : Value can\'t be an empty String.');
					if( value.indexOf('-') !== -1 ) throw new Error('Template.Config.binderPrefix : Value can\'t contain dashes ("-").');
					if( Template.Util.stringHasSpaces( value ) ) throw new Error('Template.Config.binderPrefix : Value can\'t contain spaces.');
					// done! accepted!
					_CONFIG_.binderPrefix = value;
					return true;
				},
				set placeholderDelimitiers( value ){
					if( !Array.isArray( value ) ) throw new Error('Template.Config.placeholderDelimitiers : Value must be an Array.');
					if( value.length !== 2 ) throw new Error('Template.Config.placeholderDelimitiers : Array must contain 2 keys.');
					if( typeof value[0] !== 'string' || typeof value[1] !== 'string' ) throw new Error('Template.Config.placeholderDelimitiers : Array keys must be String.');
					value = value.map( v => v.trim() );
					if( !value[0].length || !value[1].length ) throw new Error('Template.Config.placeholderDelimitiers: Values can\'t be empty Strings.');
					// done ! accepted!
					_CONFIG_.placeholderDelimitiers = value;
					return true;
				},
				set modelsNamesExtension( value ){
					if( typeof value !== 'string' ) throw new Error('Template.Config.modelsNamesExtension : Value must be a String.');
					value = value.trim();
					if( Template.Util.stringHasSpaces( value ) ) throw new Error('Template.Config.modelsNamesExtension : Value can\'t contain spaces.');
					// done! accepted!
					_CONFIG_.modelsNamesExtension = value;
					return true;
				},
				set viewsNamesExtension( value ){
					if( typeof value !== 'string' ) throw new Error('Template.Config.viewsNamesExtension : Value must be a String.');
					value = value.trim();
					if( Template.Util.stringHasSpaces( value ) ) throw new Error('Template.Config.viewsNamesExtension : Value can\'t contain spaces.');
					// done! accepted!
					_CONFIG_.viewsNamesExtension = value;
					return true;
				},
				set modelsPath( value ){
					// value validation
					if( typeof value !== 'string' ) throw new Error('Template.Config.modelsPath : Value must be a String.');
					value = value.trim();
					if( Template.Util.stringHasSpaces( value ) ) throw new Error('Template.Config.modelsPath : Value can\'t contain spaces.');
					if ( value.slice(-1) !== '/' ) value += '/';
					// done! accepted!
					_CONFIG_.modelsPath = value;
					return true;
				},
				set viewsPath( value ){
					// value validation
					if( typeof value !== 'string' ) throw new Error('Template.Config.viewsPath : Value must be a String.');
					value = value.trim();
					if( Template.Util.stringHasSpaces( value ) ) throw new Error('Template.Config.viewsPath : Value can\'t contain spaces.');
					if ( value.slice(-1) !== '/' ) value += '/';
					// done! accepted!
					_CONFIG_.viewsPath = value;
					return true;
				},

			}
		},

	};


})();



