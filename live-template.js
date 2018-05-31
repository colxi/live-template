/*
* @Author: colxi.kl
* @Date:   2018-05-18 03:45:24
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-06-01 01:19:25
*/
'use strict';

// inject CSS
(function(){
	let css = '[__hidden__]{ display : none; }';
	let style = document.createElement('style');
	style.type = 'text/css';
	if (style.styleSheet)  style.styleSheet.cssText = css;
	else style.appendChild(document.createTextNode(css));
	document.getElementsByTagName('head')[0].appendChild(style);
})();



	let modelsPath = './models/';
	let prefix = 'pg';
	let templateDelimiters = ['${', '}'];

	let expresion = {
		tokenMatch :   /(?<!\\)\${[^{}]*}/g,
		tokenReplace : '(?<!\\\\)\\${\\s*__TOKEN__\\s*}'
	}


	function loadModel(url){
		url = modelsPath + url + '.js';

		console.log('importing _Model' , url)
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			const loaderId = "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2);

			window[loaderId] = function( m ){
				resolve( m );
				window[loaderId] = null;
				delete window[loaderId];
				script.remove();
			};

			script.onerror = () => {
				reject(new Error("Failed to load module script with URL " + url));
				window[loaderId] = null;
				delete window[loaderId];
				script.remove();
			};

			script.type = "module";
			script.textContent = `import * as m from "${url}"; window.${loaderId}( m.default )`;

			document.documentElement.appendChild(script);
		});
	}


	let Model = function(modelName, content = {} ){
		if( !(this instanceof Model) ) throw new Error("Model Constructor must be called using 'new' .")
		_Model[modelName] = content;
		return _Model[modelName];
	}


	function createModel( modelContents, keyPath){
		console.log(keyPath)
		let level =  new Proxy( {} , {
			set : function(model, tokenName, value){

				// if value to SET is an Object...
				if( value instanceof Object && typeof value === 'object' && !(value instanceof HTMLElement) ){
					// and property in _Model already exist and is an object, mix them...
					if( model[tokenName] instanceof Object ) Object.assign( model[tokenName] , value);
					// if its not an object, generate another Level in the proxy
					else model[tokenName] = createModel(value , keyPath+tokenName+'.');
					// done!
					return true;
				}

				model[tokenName] = value;
				// check if exist any binded element wich value has to be updated
				//
				// iterate each registered binding for provided token, if exist
				// an entry in the binding names for the current binding name

				// bindingTables to Global _Model (_root) are stored without the _root
				// keypath prefix. Remove it.
				if(keyPath === '_root.') keyPath = '';
				if( bindingTables.names.hasOwnProperty(keyPath+tokenName) ){
					bindingTables.names[keyPath+tokenName].forEach( element =>{
						if(element.nodeType === Node.TEXT_NODE){
							// if element is a textNode update it...
							element.textContent = Util.applyStringTokens( bindingTables.elements.get(element), model) ;
						}else{
							// if it's not a textNode, asume bindingTables are set
							// in element attributes
							let attr_list = bindingTables.elements.get(element);
							for(let attr in attr_list){
								//
								if( Util.isBinderAttribute(attr) ){
									let _model = Util.resolveBindingKeyPath( attr_list[attr] );
									let bindingFn = attr.split('-')[1];
									binders[bindingFn].subscribe(element,_model.context,_model.key , _model.context[_model.key]);
								}else{
									if( !attr_list.hasOwnProperty(attr) ) continue;
									if(attr !== 'textNode')  element.setAttribute( attr,  Util.applyStringTokens( attr_list[attr], model ) );
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
	}

	// _Model is a proxy wich grants acces to the models stored internally
	let _Model = new Proxy( {} , {
		set : function(obj, modelName, modelContents){
			// if value is not an Object throw an error
			if( !(modelContents instanceof Object) ) throw new Error('new _Model must be an object!')
			// if Model name already declared attach new properties, if not
			// exists yet, create it.
			if( obj[modelName] ) Object.assign( obj[modelName], modelContents );
			else obj[modelName] = createModel(modelContents, modelName+'.');
			// done !
			return true;
		},
		get : function(obj, modelName){
			return obj[modelName];
		}
	})



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

	let Util = {
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

		/**
		 * [Util.removeTemplateDelimiters description]
		 * @param  {[type]} bindName){              ( [description]
		 * @return {[type]}             [description]
		 */
		removeTemplateDelimiters( token ){
			//
			return token.trim().slice(templateDelimiters[0].length, ( 0-templateDelimiters[1].length ) ).trim();
		},

		/**
		 * Util.isBinderAttribute() : If the attribute name has a binder name syntax
		 * structure return the binder name, if not , return false
		 *
		 * @param  {[type]}  attrName [description]
		 * @return {Boolean}          [description]
		 */
		isBinderAttribute( attrName ){
			//
			return ( attrName.substring(0, (prefix.length+1)) == prefix+"-") ? attrName.substring(3) : false;
		},

		/**
		 * Util.getStringTokens(): Return an array with all the tokens found in the
		 * provided String. If no tokens are found returns an empty array.
		 *
		 * @param  {String}  string                 String to analyze
		 * @param  {Boolean} stripDelimiters 		Return tokens without delimiters
		 *
		 * @return {Array}                          Array of tokens
		 */
		getStringTokens( string, stripDelimiters = false ){
			// extract all tokens from string
			let tokens =  string.match( expresion.tokenMatch );
			// remove duplicates!
			tokens = Array.from( new Set(tokens) );
			// if there are no results, return an empty array
			if( !tokens ) return [];
			// if strip delimiters filter has not been requested, return the tokens
			// in it's original form ( eg: "${token_name}" }
			if( !stripDelimiters ) return tokens;
			// strip delimiters from token...
			let tokensCleaned  = [];
			tokens.forEach( bindName => tokensCleaned.push( Util.removeTemplateDelimiters(bindName) ) );
			return tokensCleaned;
		},


		/**
		 * [Util.applyStringTokens description]
		 *
		 * @param  {[type]} string [description]
		 *
		 * @return {[type]}        [description]
		 */
		applyStringTokens(string){
			// retrieve all the tokens contained in the string
			let tokens = Util.getStringTokens( string, true );
			// iterate each token
			tokens.forEach( token=>{
				let {context, key} = Util.resolveBindingKeyPath(token);
				// generate the search regular expresion with the current token
				let search = new RegExp( expresion.tokenReplace.replace('__TOKEN__', token) ,"g");
				// find te value of the Binding token, in the provided model, and
				// replace every token reference in the string, with it
				string = string.replace( search , (context[key] || '') );
			})
			// done! return parsed String
			return string;
		},

		/**
		 * [Util.resolveBindingKeyPath description]
		 * @param  {[type]} keyPath [description]
		 * @return {[type]}         [description]
		 */
		resolveBindingKeyPath( keyPath ){
			// split the string in the diferent path levels
			let parts = keyPath.split(".");
			// extract the last item (asume is the property)
			let bindName = ( parts.splice(-1,1) )[0];

			let result = {}

			if( parts.length === 0 ){
				//
				// if there are no keys to iterate, asume is a global binding (_root model)
				//
				// if _root Model does not exist create it
				if( !_Model['_root'] ) _Model['_root']  = {};
				// generate output object
				result = { context : _Model['_root'] , key : bindName };
			}else{
				//
				// keys are found, iterate them to generate the Model context
				//
				let context = _Model;
				for(let i = 0; i<parts.length;i++){
					// if Model context does not exist, create it
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
    		    	let tokens = Util.getTextNodeTokens( childNode , searchInTemplate);
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
	    			tokens = Util.getStringTokens( bindingTables.elements.get(texNode) , true);
	    		}
	    	}else{
				// ...or search for tokens in the textNode current value
				tokens = Util.getStringTokens(texNode.nodeValue, true);
			}
			return tokens;
		}

	}





	// Callback function to execute when mutations are observed
	let onDOMChange = function(mutationsList) {
	    for(let mutation of mutationsList) {
	        if (mutation.type !== 'childList') continue;

            // first process REMOVED NODES
            mutation.removedNodes.forEach( e=>{

            	switch( e.nodeType ){
            		case Node.TEXT_NODE : {
            			let tokens = Util.getTextNodeTokens(e,true);

	            		tokens.forEach( tokenName=>{
		            		if( bindingTables.names.hasOwnProperty( tokenName ) ){
								let index = bindingTables.names[tokenName].indexOf(e);
								if (index !== -1)  bindingTables.names[tokenName].splice(index, 1);
								if( !bindingTables.names[tokenName].length ){
									bindingTables.names[tokenName] = null;
									delete bindingTables.names[tokenName]
								}
							}
						});
	            		break;
	            	}
            		case Node.ELEMENT_NODE : {
            			//console.log('delete ', typeof e, ,  e)
		            	// get all children as Array instead of NodeList
		            	// include in the array the Deleted element
		            	let all = Array.from( e.querySelectorAll("*") );
		            	all.push(e);

		            	all.forEach( child =>{
		            		// inspect Attributes
		            		let tokens = [];

		            		// ATTRIBUTES SEARCH (in template)
		            		if( bindingTables.elements.has(child) ){
								// get all stringTokens in current Element Attribute Template
	            				let attributes = bindingTables.elements.get(child);
	            				for(let attr in attributes){
	            					if( !attributes.hasOwnProperty(attr) ) continue;
	            					let currentAttributeTokens = Util.getStringTokens(  attributes[attr] , true ) ;

									if( Util.isBinderAttribute( attr ) && !currentAttributeTokens.lenght ){
										// if value is quoted, call binder[bindername].subscribte
										// with the quoted value
										let v = attributes[attr].trim();
										if( v.slice(0,1) === '\'' && v.slice(-1) === '\'') continue;
										// if is a Binder Attribute (eg: pg-model), extract the value
										else currentAttributeTokens = [ v ];
									}
	            					tokens = tokens.concat( currentAttributeTokens );
	            				}
		            		}
		            		tokens.forEach( tokenName=>{
								if( bindingTables.names.hasOwnProperty( tokenName ) ){
									let index = bindingTables.names[tokenName].indexOf(child);
									if(index !== -1)  bindingTables.names[tokenName].splice(index, 1);
									if( !bindingTables.names[tokenName].length ){
										bindingTables.names[tokenName] = null;
										delete bindingTables.names[tokenName];
									}
								}
							})

							// TEXZTCONTENXT SEARCH (TEMPLATE)
		            		Util.forEachTextNodeToken(child, (childTextNode, tokenName) =>{
								if( bindingTables.names.hasOwnProperty( tokenName ) ){
									let index = bindingTables.names[tokenName].indexOf(childTextNode);
									if (index !== -1)  bindingTables.names[tokenName].splice(index, 1);
									if( !bindingTables.names[tokenName].length ){
										bindingTables.names[tokenName] = null;
										delete bindingTables.names[tokenName];
									}
								}
							}, true)

		            	});
		            	break;
		            }
            		default : {
            			console.warn('onDOMChange() : Unimplemented type of Node : ' + e.nodeType.toString() );
            		}
            	}
            });

            // CONTINUE WITH NEW ADDED NODES
            mutation.addedNodes.forEach( e=>{
            	parseElement(e);
            });
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
			let tokens = Util.getStringTokens(element.attributes[attr].value, true);

			if( Util.isBinderAttribute( element.attributes[attr].name ) && !tokens.lenght ){
				// if value is quoted, call binder[bindername].subscribte
				// with the quoted value
				let v = element.attributes[attr].value.trim();
				if( v.slice(0,1) === '\'' && v.slice(-1) === '\''){

				}
				// if is a Binder Attribute (eg: pg-model), extract the value
				else tokens = [ v ];
			}

			// iterate all tokens
			tokens.forEach( tokenName=>{
				let model = Util.resolveBindingKeyPath(tokenName);

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
				if(binderPrefix === prefix){
					if( !binders.hasOwnProperty(binderName[1]) ) binders.default.bind(element,model.context, model.key, [ binderName[1] , binderName[2] ] );
					else binders[binderName[1]].bind(element,model.context, model.key,  [ binderName[1] , binderName[2] ] );
				}


			})
		}

		Util.forEachTextNodeToken(element, (childNode, tokenName) =>{
			// register the textNode in the bindingTables registry
			bindingTables.elements.set(childNode, childNode.nodeValue );
			// bind the element with the tokem
			bind(childNode, tokenName);
			parsedTokenNames.push(tokenName);
		})

		parsedTokenNames.forEach( tokenName => {
			let model = Util.resolveBindingKeyPath(tokenName);
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
		let model = Util.resolveBindingKeyPath(tokenName);
		// TODO: add an observer to the element to track changes in its structure/bindingTables

		// When item is not linked with any _Model (Model_root) create a
		// variable acces in the 'window' Object, to simulate global variable
		if( model.context === _Model._root && !window.hasOwnProperty(model.key) ){
			// if variable already exist in window, delete it and assign again ?
			//
			Object.defineProperty(window, model.key, {
				set: function(value) {
					_Model._root[model.key] = value
				},
				get: function() {
					return _Model._root[model.key]
				}
			});
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
				// change in DOM must be setted to _Model Object
				console.log('pg-value publish BINDER: publishing!',model,key,value)
				model[key] = value;
			},
			subscribe : function(element, model, key){
				// change in object must be reflected in DOM
				console.log('pg-value update BINDER: subscribe!')
				element.value = model[ key ] || '' ;
			},
		},
		show : {
			bind : function(element,model,key){
			},
			unbind : function(){},
			publish : function(element, model, key, value){},
			subscribe : function(element, model, key, value){
				if( value || value === undefined) element.removeAttribute('__hidden__');
				else element.setAttribute('__hidden__',true);
			},
		},
		model : {
			bind : function(element,model,key){},
			unbind : function(){},
			publish : function(element, model, key, value){},
			subscribe : function(element, model, key){},
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
				console.log( model[key] )
				element.addEventListener( attrName[1] , e=> model[key](e) )
			},
			unbind : function(){},
			publish : function(element, model, key, value){},
			subscribe : function(element, model, key){},
		},
		each : {},
		// pg-unknown :  undeclared binders perform default action...
		default : {
			bind: function(element,model,key,binderName){
				console.log('DEFAULT BINDER bind():',element,model,key,binderName)
			}
		}
	}


let a;
	window.onload =  x=>{
		a = document.getElementById("container").innerHTML;

		parseElement(document.documentElement);

		//document.querySelectorAll('*').forEach( e => parseElement(e) );

		// Create an observer instance linked to the callback function
		var observer = new MutationObserver( onDOMChange );
		// observe the document topMost element
		observer.observe(document.documentElement, { attributes: false, childList: true , subtree:true, characterData:false});


		_Model.myModel.loadModel= function(){ loadModel('myModel') }
_Model.myModel.deleteBlock= function(){ _Model.myModel.container.remove() }
_Model.myModel.loadView= function(){ _Model.myModel.myView.innerHTML = a; }

	}

//})();
