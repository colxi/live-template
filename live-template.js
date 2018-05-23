/*
* @Author: colxi.kl
* @Date:   2018-05-18 03:45:24
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-05-23 15:28:34
*/

/*
	Addapted from  :
	https://github.com/tc39/proposal-dynamic-import
*/
function importModule(url) {
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

_Model = {}

window.Model = new Proxy( _Model , {
	set : function(obj, modelName, modelContents){
		//console.log(obj,prop, value)

		// if(value not object error)


		obj[modelName] = new Proxy( modelContents , {
			set : function(obj, prop, value){
				obj[prop] = value
				// check in bindings
				if( bindings.name.indexOf() !== -1){

				}
			},
			get : function(obj, prop){
				return obj[prop]
			}
		} );


		return obj[modelName];

	},
	get : function(obj, modelName){
		return obj[prop]
	}
})

//(function(){
	window._data = {};

	let prefix = 'pg';

	let formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'DATALIST', 'OUTPUT' ];

	let templateDelimiters = ['${', '}'];

	let expresion = {
		tokenMatch : /(?<!\\)\${[^{}]*}/g,
		tokenReplace : '(?<!\\\\)\\${\\s*__TOKEN__\\s*}'
	}

	let binders = {
		default : {

		},
		value : {

			update : function(element, value){
				console.log('updating!')
				element.value = value;
			},

		}
	}

	let bindings = {
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
		return token.trim().slice(2,-1).trim();
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
	 * [getBindingModel description]
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	let getBindingModel = function(element){
		if(element.nodeType === element.TEXT_NODE) element = element.parentNode;
		let model = element.closest('['+prefix+'-model]');
		if( model === null) model = window;
		else{}
		return model;
	};

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

	/**
	 * [applyStringTokens description]
	 *
	 * @param  {[type]} string [description]
	 * @param  {[type]} model  [description]
	 *
	 * @return {[type]}        [description]
	 */
	let applyStringTokens = function(string, model){
		// retrieve all the tokens container in the string
		let tokens = getStringTokens( string, true );
		// iterate each token
		tokens.forEach( token=>{
			// generate the search regular expresion with the current token

			let search = new RegExp( expresion.tokenReplace.replace('__TOKEN__', token) ,"g");
			// find te value of the Binding token, in the provided model, and
			// replace every token reference in the string, with it
			string = string.replace(search , (model._data[token] || ''));
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
				// register the attribute name and tokenized value
				tokenizedAttributes[ element.attributes[attr].name ] = element.attributes[attr].value;
				// bind the element with the token
				bind(element, tokenName);

				if(element.attributes[attr].name === 'pg-value'){
					element.addEventListener("input", function(e) {
						window[tokenName] = e.target.value;
					});
				}
			})
		}
		// if any attribute has been found, include it/them to the binding registry
		if( Object.keys(tokenizedAttributes).length ) bindings.elements.set(element,tokenizedAttributes );


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
					// register the textNode in the bindings registry
					bindings.elements.set(childNode, childNode.nodeValue );
					// bind the element with the tokem
					bind(childNode, tokenName);
				})
		    }
		});


		return true;
	}


	let bind = function(element, tokenName){
		// block if element is not a HTMLElement intance
		//console.log(element,tokenName)
		if( !(element instanceof HTMLElement) && !(element instanceof Node) ) throw new Error('HTMLElement has to be provided');
		// block if no binding name has been provided
		if( tokenName.trim() === undefined ) throw new Error('Imposible to perform binding. Binding name not provided in Element');

		// get the container model
		let model = getBindingModel(element);
		// if the tokenName has not been registered previously, generate an empty entry
		if( !bindings.names.hasOwnProperty(tokenName) ) bindings.names[tokenName] = [];
		// link the element with the tokenName in the bindings registry
		bindings.names[tokenName].push(element);

		// TODO: add an observer to the element to track changes in its structure/bindings
		// TODO : what happens when model , already has a variable with the tokenName?

		//console.log("the model is", model)
		// Create the binded variable in the corresponding model
		if( !model.hasOwnProperty(tokenName) ){
			Object.defineProperty(model, tokenName, {
				set: function(value) {
					// store the ew provided value
					model._data[tokenName] = value;
					// iterate each registered binding for provided token
					bindings.names[tokenName].forEach( element =>{
						// verificate that binded Element is still part of DOM
						if ( !garbageCollector(element) ) return;

						if(element.nodeType === element.TEXT_NODE){
							// if element is a textNode update it...
							element.textContent = applyStringTokens( bindings.elements.get(element), model) ;
						}else{
							// if it's not a textNode, asume bindings are set
							// in element attributes
							let attr_list = bindings.elements.get(element);
							for(let attr in attr_list){
								if( isBinderAttribute(attr) ){
									element.value = model[attr_list[attr]]
								}else{
									if( !attr_list.hasOwnProperty(attr) ) continue;
									if(attr !== 'textNode')  element.setAttribute( attr,  applyStringTokens( attr_list[attr], model ) );
								}
							}
						}
					});
					//x.value = value;
				},
				get: function() {
					return model._data[tokenName]
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



	document.querySelectorAll('*').forEach( e => parseElement(e) );

//})();
