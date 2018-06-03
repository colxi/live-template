/*
* @Author: colxi.kl
* @Date:   2018-05-18 03:45:24
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-06-03 07:51:45
*/
'use strict';

// inject CSS
const Template = (function(){

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
			if( !(modelContents instanceof Object) ) throw new Error('new Model must be an object!')
			// if model name already declared attach new properties, if not
			// exists yet, create it.
			if( obj[modelName] ) Object.assign( obj[modelName], modelContents );
			else obj[modelName] = _CREATE_MODEL_(modelContents, modelName+'.');
			// done !
			return true;
		},
		get : function(obj, modelName){
			return obj[modelName];
		}
	});


	/**
	 * [_CREATE_MODEL_ description]
	 * @param  {[type]} modelContents [description]
	 * @param  {[type]} keyPath       [description]
	 * @return {[type]}               [description]
	 */
	const _CREATE_MODEL_ = function( modelContents, keyPath){
		let level =  new Proxy( {} , {
			set : function(model, tokenName, value){

				// if value to SET is an Object...
				if( value instanceof Object && typeof value === 'object' && !(value instanceof HTMLElement) ){
					// and property in _MODELS_ already exist and is an object, mix them...
					if( model[tokenName] instanceof Object ) Object.assign( model[tokenName] , value);
					// if its not an object, generate another Level in the proxy
					else model[tokenName] = _CREATE_MODEL_(value , keyPath+tokenName+'.');
					// done!
					return true;
				}

				model[tokenName] = value;
				// check if exist any binded element wich value has to be updated
				//
				// iterate each registered binding for provided token, if exist
				// an entry in the binding names for the current binding name

				// bindingTables to Global _MODELS_ (_root) are stored without the _root
				// keypath _CONFIG_.binderPrefix. Remove it.
				if(keyPath === '_root.') keyPath = '';
				if( bindingTables.names.hasOwnProperty(keyPath+tokenName) ){
					bindingTables.names[keyPath+tokenName].forEach( element =>{
						if(element.nodeType === Node.TEXT_NODE){
							// if element is a textNode update it...
							element.textContent = Template.Util.populateStringPlaceholders( bindingTables.elements.get(element), model) ;
						}else{
							// if it's not a textNode, asume bindingTables are set
							// in element attributes
							let attr_list = bindingTables.elements.get(element);
							for(let attr in attr_list){
								//
								if( Template.Util.binderExists(attr) ){
									let _model = Template.Util.resolveKeyPath( attr_list[attr] );
									let bindingFn = attr.split('-')[1];
									binders[bindingFn].subscribe(element,_model.context,_model.key , _model.context[_model.key]);
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
				return model[tokenName]
			}
		} );

		// assign the properties to the level
		Object.assign( level, modelContents );
		return level;
	};


	let expresion = {
		tokenMatch :   /(?<!\\)\${[^{}]*}/g,
		tokenReplace : '(?<!\\\\)\\${\\s*__TOKEN__\\s*}'
	}


	let bindingTables = {
		// Contains a list of bindingNames, with an array linked containing
		// all the Elements where the binding has been linked. This array
		// is not weak referenced (cause needs to be iterated), so is
		// periodically cleared by a Garbage Collector.
		// When a binding value is modified, this list is cheked, to update
		// the new value on all the linked Elements
		names : {
			/*
			"myBindingName" :  [
				elementReference,
				elementReference,
				textNodeReference
				(...)
			],
			"anotherBindingName" :  [
				elementReference,
				textNodeReference,
				textNodeReference
				(...)
			]
			(...)
			*/
		},
		// Contains a weakMap with all the binded elements, with all the
		// element internal references to the binding. This lists prevents
		// the need of re-scan the whole Element when the value of the binding
		// needs to be updated.
		elements : new WeakMap()
		    /*
		    WeakMap{
				elementReference : {
					"attributeName_1" : "tokenizedValueString",
					"attributeName_2" : "tokenizedValueString",
					"textNode" 		  : true
				},
				textNodeReference : "tokenizedValueString",
				textNodeReference : "tokenizedValueString",
				elementReference : {
					"attributeName_1" : "tokenizedValueString",
					"attributeName_2" : "tokenizedValueString",
					(...)
				}
				(...)
			}
			*/
	};


	let removefromcollection = function (element , placeholder){
		if( bindingTables.names.hasOwnProperty( placeholder ) ){
			let index = bindingTables.names[placeholder].indexOf(element);
			if (index !== -1)  bindingTables.names[placeholder].splice(index, 1);
			if( !bindingTables.names[placeholder].length ){
				bindingTables.names[placeholder] = null;
				delete bindingTables.names[placeholder]
			}
		}
	}

	let getTemplatePlaceholders = function( element ){
		// inspect Attributes
		let placeholders = [];

		if( bindingTables.elements.has( element ) ){
			// get all stringTokens in current Element Attribute Template
			let attributes = bindingTables.elements.get( element );
			for(let currentAttr in attributes){
				if( !attributes.hasOwnProperty(currentAttr) ) continue;
				let placeholdersPartial = Template.Util.getPlaceholdersFromString(  attributes[currentAttr] , true ) ;

				if( Template.Util.binderExists( currentAttr ) && !placeholdersPartial.lenght ){
					// if value is quoted, call binder[bindername].subscribte
					// with the quoted value
					let v = attributes[currentAttr].trim();
					if( v.slice(0,1) === '\'' && v.slice(-1) === '\'') continue;
					// if is a Binder Attribute (eg: pg-model), extract the value
					else placeholdersPartial = [ v ];
				}
				placeholders = placeholders.concat( placeholdersPartial );
			}
		}
		return placeholders;
	}

	// Callback function to execute when mutations are observed
	let onDOMChange = function(mutationsList) {
	    for(let mutation of mutationsList){
	        if (mutation.type !== 'childList') continue;

            // first process REMOVED NODES
            mutation.removedNodes.forEach( e=>{
            	switch( e.nodeType ){
            		case Node.TEXT_NODE : {
            			let tokens = Template.Util.getTextNodeTokens(e,true);
	            		tokens.forEach( tokenName=> removefromcollection(e,tokenName) );
	            		break;
	            	}
            		case Node.ELEMENT_NODE : {
		            	// get all children as Array instead of NodeList
		            	let all = Array.from( e.querySelectorAll("*") );
		            	// include in the array the Deleted root element
		            	all.push(e);
		            	all.forEach( child =>{

		            		let tokens = getTemplatePlaceholders(child);
		            		tokens.forEach( tokenName=> removefromcollection(child,tokenName) );
							// TEXTCONTENT SEARCH (TEMPLATE)
		            		Template.Util.forEachTextNodeToken(child, removefromcollection , true)
		            	});
		            	break;
		            }
            		default : {
            			_DEBUG_('onDOMChange() : Unimplemented type of Node : ' + e.nodeType.toString() );
            		}
            	}
            });

            // CONTINUE WITH NEW ADDED NODES
            mutation.addedNodes.forEach( e=> parseElement(e) );
	    }
	    // done !
	};

	/**
	 * [parseElement description]
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	let parseElement = function(element){
		/*
			TWO DIFFERENT PARTS OF EACH ELEMENT CAN CONTAIN TEMPLATE TOKENS
			Those are : Element Attributes, and TextNodes. Analize first Element
			Attributes, perform necessary bindings, and continue analyzing the
			textNodes, and perform again the required bindings.
		 */

		// iterate each attribute of the element looking for templating tokens,
		// or attribute  binders ...

		let parsedTokenNames= [];
		for(let attr in element.attributes){
			// block if attrName is not a property
			if( !element.attributes.hasOwnProperty(attr) ) continue;

			// get all the tokens in attribute in an array
			let tokens = Template.Util.getPlaceholdersFromString(element.attributes[attr].value, true);

			if( Template.Util.binderExists( element.attributes[attr].name ) && !tokens.lenght ){
				// if value is quoted, call binder[bindername].subscribte
				// with the quoted value
				let v = element.attributes[attr].value.trim();
                if( v.slice(0,1) === '\'' && v.slice(-1) === '\''){
                    let binder = ( element.attributes[attr].name.split('-') )[1];
                    binders[binder].subscribe(element, undefined, undefined, v.slice(1, -1) )
				}
				// if is a Binder Attribute (eg: pg-model), extract the value
				else tokens = [ v ];
			}

			// iterate all tokens
			tokens.forEach( tokenName=>{
				let model = Template.Util.resolveKeyPath(tokenName);

				if( bindingTables.elements.has(element) ){
					let table = bindingTables.elements.get(element);
					table[ element.attributes[attr].name ] = element.attributes[attr].value;
					bindingTables.elements.set(element,table );
				}else bindingTables.elements.set(element , { [element.attributes[attr].name] : element.attributes[attr].value } );

				// bind the element with the token
				bind(element, tokenName);
				parsedTokenNames.push(tokenName);

				let binderName = element.attributes[attr].name.split('-');
				let binderPrefix = binderName[0];
				if(binderPrefix === _CONFIG_.binderPrefix){
					if( !binders.hasOwnProperty(binderName[1]) ) binders.default.bind(element,model.context, model.key, [ binderName[1] , binderName[2] ] );
					else binders[binderName[1]].bind(element,model.context, model.key,  [ binderName[1] , binderName[2] ] );
				}


			})
		}

		Template.Util.forEachTextNodeToken(element, (childNode, tokenName) =>{
			// register the textNode in the bindingTables registry
			bindingTables.elements.set(childNode, childNode.nodeValue );
			// bind the element with the tokem
			bind(childNode, tokenName);
			parsedTokenNames.push(tokenName);
		})

		parsedTokenNames.forEach( tokenName => {
			let model = Template.Util.resolveKeyPath(tokenName);
			model.context[model.key] =model.context[model.key]
		} )


		if( element.childNodes.length) element.childNodes.forEach( e=> parseElement(e) );
		return true;
	}



	let bind = function(element, tokenName){
		// block if element is not a HTMLElement intance
		if( !(element instanceof HTMLElement) && !(element instanceof Node) ) throw new Error('HTMLElement has to be provided');
		// block if no binding name has been provided
		if( tokenName.trim() === undefined ) throw new Error('Imposible to perform binding. Binding name not provided in Element');

		// if the tokenName has not been registered previously, generate an empty entry
		if( !bindingTables.names.hasOwnProperty(tokenName) ) bindingTables.names[tokenName] = [];
		// link the element with the tokenName in the bindingTables registry
		bindingTables.names[tokenName].push(element);

		// get the container model, if model was not provided
		let model = Template.Util.resolveKeyPath(tokenName);
		// TODO: add an observer to the element to track changes in its structure/bindingTables

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
					_MODELS_._root[model.key] = value
				},
				get: function() {
					return _MODELS_._root[model.key]
				},
                configurable : true,
                enumerable: true
			});

            // if variable existed previously reasign its original value
            if( typeof temp !== 'undefined' ) window[model.key] = temp;
		}

		// done!
		return true;
	}




	let binders = {
		// pg-value
		value : {
			bind : function(element,model,key){
				element.addEventListener("input", e=>{
					this.publish(element, model , key, e.target.value)
				});
			},
			unbind : function(){},
			publish : function(element, model, key, value){
				// change in DOM must be setted to _MODELS_ Object
				model[key] = value;
			},
			subscribe : function(element, model, key, value){
                // change in object must be reflected in DOM
				element.value = value || '' ;
			},
		},
		if : {
			bind : function(element,model,key){
			},
			unbind : function(){},
			publish : function(element, model, key, value){},
			subscribe : function(element, model, key, value){
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
			bind : function(element,model,key){},
			unbind : function(){},
			publish : function(element, model, key, value){},
			subscribe : function(element, model, key, value){
                Template.loadModel( value )
            },
		},
        view : {
            bind : function(element,model,key,value){
            },
            unbind : function(){},
            publish : function(element, model, key, value){},
            subscribe : function(element, model, key, value){
                element.innerHTML = '';
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
			bind : function(element,model,key){
				model[key] = element;
			},
			unbind : function(){},
			publish : function(element, model, key, value){},
			subscribe : function(element, model, key){},
		},
		on : {
			bind : function(element,model,key, attrName){
				element.addEventListener( attrName[1] , e=> model[key](e) )
			},
			unbind : function(){},
			publish : function(element, model, key, value){},
			subscribe : function(element, model, key, value){},
		},
		each : {},
		// pg-unknown :  undeclared binders perform default action...
		default : {
			bind: function(element,model,key,binderName){
				_DEBUG_('DEFAULT BINDER bind():',element,model,key,binderName)
			}
		}
	}

	return {
		/**
		 * [init description]
		 * @return {[type]} [description]
		 */
		bind : function(){
			parseElement(document.documentElement);
			// Create an observer instance linked to the callback function
			var observer = new MutationObserver( onDOMChange );
			// observe the document topMost element
			observer.observe(document.documentElement, { attributes: false, childList: true , subtree:true, characterData:false});
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
			// done. Promise will be resolved when model Module is loaded
			return true;
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

			stringHasSpaces: function(string){
				if( typeof string !== 'string'){
					throw new Error('Template.Util.stringHasSpaces() : Provided value is not a String');
				}
				return /\s/.test( string );
			},

			/**
			 * Template.Util.binderExists() : If the attribute name has a binder name syntax
			 * structure return the binder name, if not , return false
			 *
			 * @param  {[type]}  attrName [description]
			 * @return {Boolean}          [description]
			 */
			binderExists( attrName ){
				//
                let binderNameParts = attrName.split('-');
                if ( binderNameParts[0] !== _CONFIG_.binderPrefix ) return false;
                if( binders.hasOwnProperty( binderNameParts[1] ) ) return true;
                else return false;

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
			 * Template.Util.getPlaceholdersFromString(): Return an array with all the tokens found in the
			 * provided String. If no tokens are found returns an empty array.
			 *
			 * @param  {String}  string                 String to analyze
			 * @param  {Boolean} stripDelimiters 		Return tokens without delimiters
			 *
			 * @return {Array}                          Array of tokens
			 */
			getPlaceholdersFromString( string = '', stripDelimiters = false ){
				// extract all placeholders from string
				let placeholders =  string.match( expresion.tokenMatch ) || [];
				// remove duplicates!
				placeholders = Array.from( new Set(placeholders) );
				// if strip delimiters filter has been requested, strip delimiters
				if( stripDelimiters ) placeholders = placeholders.map( current => Template.Util.removePlaceholderDelimiters(current) );
				// strip delimiters from token...
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
				let placeholders = Template.Util.getPlaceholdersFromString( string, true );
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

			/**
			 * [forEachTextNodeToken description]
			 * @param  {[type]}   element  [description]
			 * @param  {Function} callback [description]
			 * @return {[type]}            [description]
			 */
			forEachTextNodeToken(element, callback, searchInTemplate=false){
				// ignore Script and Style contents...
				if( element.tagName === 'SCRIPT' && element.tagName === 'STYLE') return false;

				// iterate the childNodes of the element
				element.childNodes.forEach( childNode=>{
	    		    if( childNode.nodeType === Node.TEXT_NODE ) {
	    		    	let tokens = Template.Util.getTextNodeTokens( childNode , searchInTemplate);
						// execute the callback with  each found token
						tokens.forEach( tokenName=> callback(childNode, tokenName) )
						// done! ready, for search in the next element childNode
				    }
				});
				//done!
				return true;
			},

			getTextNodeTokens( texNode, searchInTemplate=false ){
				let tokens = [];
				// Scan only textNodes
		    	if(searchInTemplate){
	    			// if requested, search for tokens in the template
		    		if( bindingTables.elements.has(texNode) ){
		    			tokens = Template.Util.getPlaceholdersFromString( bindingTables.elements.get(texNode) , true);
		    		}
		    	}else{
					// ...or search for tokens in the textNode current value
					tokens = Template.Util.getPlaceholdersFromString(texNode.nodeValue, true);
				}
				return tokens;
			},

            exposeBindings: function(){
                console.log(bindingTables)
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



