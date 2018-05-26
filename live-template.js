/*
* @Author: colxi.kl
* @Date:   2018-05-18 03:45:24
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-05-26 06:01:25
*/


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

		console.log('importing Model' , url)
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			const loaderId = "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2);

			window[loaderId] = function( m ){
				resolve( m );
				delete window[loaderId];
				script.remove();
			};

			script.onerror = () => {
				reject(new Error("Failed to load module script with URL " + url));
				delete window[loaderId];
				script.remove();
			};

			script.type = "module";
			script.textContent = `import * as m from "${url}"; window.${loaderId}( m.default )`;

			document.documentElement.appendChild(script);
		});
	}

	let newModel = function(modelName){
		Model[modelName] = Model[modelName] || {};
		return Model[modelName];
	}


	function createModel( modelContents, keyPath){
		console.log(keyPath)
		let level =  new Proxy( {} , {
			set : function(model, tokenName, value){

				// if value to SET is an Object...
				if( value instanceof Object ){
					// and property in Model already exist and is an object, mix them...
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

				// bindingTables to Global Model (_root) are stored without the _root
				// keypath prefix. Remove it.
				if(keyPath === '_root.') keyPath = '';
				if( bindingTables.names.hasOwnProperty(keyPath+tokenName) ){
					bindingTables.names[keyPath+tokenName].forEach( element =>{
						// verificate that binded Element is still part of DOM
						if ( !garbageCollector(element) ) return;

						if(element.nodeType === element.TEXT_NODE){
							// if element is a textNode update it...
							element.textContent = applyStringTokens( bindingTables.elements.get(element), model) ;
						}else{
							// if it's not a textNode, asume bindingTables are set
							// in element attributes
							let attr_list = bindingTables.elements.get(element);
							for(let attr in attr_list){
								//
								if( isBinderAttribute(attr) ){
									_model = getModelAndBindName( attr_list[attr] );
									let bindingFn = attr.split('-')[1];
									binders[bindingFn].subscribe(element,_model.context,_model.key);
								}else{
									if( !attr_list.hasOwnProperty(attr) ) continue;
									if(attr !== 'textNode')  element.setAttribute( attr,  applyStringTokens( attr_list[attr], model ) );
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

		for(let p in modelContents){
			if( !modelContents.hasOwnProperty(p) ) continue;

			if( modelContents[p] instanceof Object ){
				console.log('level found')
				level[p] = createModel(modelContents[p] , keyPath+p+'.');
			}
			else level[p] = modelContents[p];
		}
		return level;
	}

	// Model is a proxy wich grants acces to the models stored internally
	Model = new Proxy( {} , {
		/**
		 * Generate a new Model
		 */
		set : function(obj, modelName, modelContents){
			// if value not object throw an error
			if( typeof modelContents !== 'object') throw new Error('new Model must be an object!')
			//
			if(obj[modelName]){
				Object.assign( obj[modelName], modelContents );
			}else obj[modelName] = createModel(modelContents, modelName+'.');
			return true;
		},
		/**
		 * Return Model
		 */
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

	/**
	 * [removeTemplateDelimiters description]
	 * @param  {[type]} bindName){              ( [description]
	 * @return {[type]}             [description]
	 */
	let removeTemplateDelimiters = function( token ){
		//
		return token.trim().slice(templateDelimiters[0].length, ( 0-templateDelimiters[1].length ) ).trim();
	}


	/**
	 * isBinderAttribute() : If the attribute name has a binder name syntax
	 * structure return the binder name, if not , return false
	 *
	 * @param  {[type]}  attrName [description]
	 * @return {Boolean}          [description]
	 */
	let isBinderAttribute = function( attrName ){
		//
		return ( attrName.substring(0, (prefix.length+1)) == prefix+"-") ? attrName.substring(3) : false;
	}


	/**
	 * getStringTokens(): Return an array with all the tokens found in the
	 * provided String. If no tokens are found returns an empty array.
	 *
	 * @param  {String}  string                 String to analyze
	 * @param  {Boolean} stripDelimiters 		Return tokens without delimiters
	 *
	 * @return {Array}                          Array of tokens
	 */
	let getStringTokens = function(string, stripDelimiters = false){
		let tokens =  string.match( expresion.tokenMatch );
		// remove duplicates!
		tokens = Array.from( new Set(tokens) );
		// if there are no results, return an empty array
		if( !tokens ) return [];
		// if strip delimiters has not been requested, return the tokens
		// in it's original form ( eg: "${token_name}" }
		if( !stripDelimiters ) return tokens;
		// strip delimiters from token...
		let tokensCleaned  = [];
		tokens.forEach( bindName => tokensCleaned.push( removeTemplateDelimiters(bindName) ) );
		return tokensCleaned;
	}


	getModelAndBindName= function(s){
		keyPath = s.split(".");
		bindName = keyPath.splice(-1,1);

		let obj = {}

		if( keyPath.length === 0 ){
			if( !Model['_root'] ) Model['_root']  = {};
			obj = { context : Model['_root'] , key : bindName[0] };
		}else{
			let m = Model;
			for(let i = 0; i<keyPath.length;i++){
				if( typeof m[ keyPath[i] ] === 'undefined' ) m[ keyPath[i] ] = {};
				m = m[ keyPath[i] ];
			}
			obj = { context : m , key : bindName[0] }
		}
		return obj;
	};


	/**
	 * [applyStringTokens description]
	 *
	 * @param  {[type]} string [description]
	 * @param  {[type]} model  [description]
	 *
	 * @return {[type]}        [description]
	 */
	let applyStringTokens = function(string /*, model */){
		// retrieve all the tokens container in the string
		let tokens = getStringTokens( string, true );
		// iterate each token
		tokens.forEach( token=>{
			let model = getModelAndBindName(token);
			// generate the search regular expresion with the current token
			let search = new RegExp( expresion.tokenReplace.replace('__TOKEN__', token) ,"g");
			// find te value of the Binding token, in the provided model, and
			// replace every token reference in the string, with it
			string = string.replace(search , (model.context[model.key] || ''));
		})
		// done! return parsed String
		return string;
	}

	/**
	 * [parseElement description]
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	let parseElement = function(element){
		// iterate each attribute of the element looking for templating tokens,
		// or attribute  binders ...
		let tokenizedAttributes = {};


		for(let attr in element.attributes){
			// block if attr is not a property
			if( !element.attributes.hasOwnProperty(attr) ) continue;

			let tokens;
			if( isBinderAttribute(element.attributes[attr].name) ){
				tokens = [ element.attributes[attr].value ];
			}else{
				// get all the tokens in attribute in an array
				tokens = getStringTokens(element.attributes[attr].value, true);
			}
			// iterate all tokens
			tokens.forEach( tokenName=>{
				//model = model || getBindingModel(element);

				let model = getModelAndBindName(tokenName);


				// register the attribute name and tokenized value
				tokenizedAttributes[ element.attributes[attr].name ] = element.attributes[attr].value;
				// bind the element with the token
				bind(element, tokenName);


				let binderName = element.attributes[attr].name.split('-');
				let binderPrefix = binderName[0];
				binderName = binderName[1];
				if(binderPrefix === prefix){
					if( !binders.hasOwnProperty(binderName) ) binders.default.bind(element,model.context, model.key,binderName);
					else binders[binderName].bind(element,model.context, model.key);
				}

			})
		}
		// if any attribute has been found, include it/them to the binding registry
		if( Object.keys(tokenizedAttributes).length ) bindingTables.elements.set(element,tokenizedAttributes );


		// iterate the text Nodes looking for templating tokens
		element.childNodes.forEach( childNode=>{
			// if the child is a textNode (ignore Script childs...)
		    if( childNode.nodeType === Node.TEXT_NODE &&
		    	childNode.parentNode.tagName !== 'SCRIPT' &&
		    	childNode.parentNode.tagName !== 'STYLE') {
				// get all the tokens from it textContent
				let tokens = getStringTokens(childNode.nodeValue, true);
				// iterate each token and perform the required binding
				tokens.forEach( tokenName=>{
					// model = model || getBindingModel(element);
					let model = getModelAndBindName(tokenName);


					// register the textNode in the bindingTables registry
					bindingTables.elements.set(childNode, childNode.nodeValue );
					// bind the element with the tokem
					bind(childNode, tokenName);
				})
		    }
		});


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
		let model = getModelAndBindName(tokenName);
		// TODO: add an observer to the element to track changes in its structure/bindingTables

		// When item is not linked with any Model (Model_root) create a
		// variable acces in the 'window' Object, to simulate global variable
		if( model.context === Model._root && !window.hasOwnProperty(model.key) ){
			// if variable already exist in window, delete it and assign again ?
			//
			Object.defineProperty(window, model.key, {
				set: function(value) {
					Model._root[model.key] = value
				},
				get: function() {
					return Model._root[model.key]
				}
			});
		}
	}


	/**
	 * [garbageCollector description]
	 * @param  {Boolean} element [description]
	 * @return {[type]}          [description]
	 */
	let garbageCollector = function(element=false){
		//
		// if element is provided perform garbage collection, only for
		// providedelement
		//
		if( element ){
			if( element.parentNode === null ){
				// If element is not part of the DOM must be removed from array,
				// to prevent a memory leak
				// remove element...
				return false;
			}else return true;
		}
		// TODO: Implement a garbage collector to clear all
		// references to elements that don't exist...not just
		// the only the ones related to the current binding
		//
	};



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
				// change in DOM must be setted to Model Object
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
			subscribe : function(element, model, key){
				if( model[key] ) element.removeAttribute('__hidden__');
				else element.setAttribute('__hidden__',true);
			},
		},
		model : {
			bind : function(element,model,key){},
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


	document.querySelectorAll('*').forEach( e => parseElement(e) );

//})();
