(function(){
    'use strict';

    /**
     * OBSERVED Object contains all the Observable generated proxies. The generated
     * or provided ID NAME is used as the index
     */
    const OBSERVED = {};

    /**
     * OBSERVED_WS WeakSet containing all the weak references to all the active
     * Observables (and inner observed Objects and Arrays). This lets detect when a
     * reference to something already observed be reused
     */
    const OBSERVED_WS = new WeakSet();

    /**
     * isObjLiteralOrArray : Modified version to include arrays, taken from :
     * https://stackoverflow.com/questions/1173549/]
     * Arguments:
     *     _obj        : Item to analyze
     *
     * Return: Boolean
     *
     */
    const isObjLiteralOrArray = function(_obj){
        var _test  = _obj;
        return (  typeof _obj !== 'object' || _obj === null ?
            false :
            (
                (function () {
                    if( Array.isArray(_obj) ) return true;
                    while (!false) {
                        if (  Object.getPrototypeOf( _test = Object.getPrototypeOf(_test)  ) === null) {
                            break;
                        }
                    }
                    return Object.getPrototypeOf(_obj) === _test;
                })()
            )
        );
    };


    /**
     * createObserver
     * @param  {[createObservertype]}   modelContents [description]
     * @param  {[type]}   keyPath       [description]
     * @param  {Function} callback      [description]
     * @return {[type]}                 [description]
     */
    const createObserver = function( value, callback, keyPath, config, CONSTRUCTION_STAGE , CURRENT_DEPTH){
        let result;
        let constructionCallbacks = [];

        if( OBSERVED_WS.has(value) ){
            // IGNORE ASIGNEMENT
            // provided item is a reference of somthing already observed.
            // return the same item, instead of a new one
            result = value;
        }else{
            // PERFORM ASIGNEMENT
            // item is a new reference not yet observed, create new proxy

            //
            let _target =  Array.isArray(value) ? []:{};

            let ProxyObject =  new Proxy( _target , {
                set : function(target, property, value){
                    // save old value and detect action type
                    let oldValue = target[property];
                    let action = target.hasOwnProperty(property) ? 'update' : 'add';

                    // if performing an update and new value equals old value,
                    // no action is required, becacause no changes are being applied
                    // ( configrable behavior )
                    if( config.ignoreSameValueReassign &&
                        action === 'update' &&
                        oldValue===value ) return true;

                    // generae a new observer if value if an ibject or array,
                    // unless depth restriction has beenn provided and
                    // CURRENT_DEPTH is greater than it
                    if( isObjLiteralOrArray(value) && (!config.depth || CURRENT_DEPTH < config.depth) ){
                        // if value to SET is an Object or Array, create a new
                        // proxy, with updated keypath
                        let newObserver = createObserver(value , callback, keyPath+'.'+property, config, true , CURRENT_DEPTH+1);
                        // if callbacks executions are returned, attch them to the queue
                        constructionCallbacks = constructionCallbacks.concat( newObserver.callbacks );
                        // assignnthe new observer level
                        target[property] = newObserver.observer;
                    }else{
                        // anything else, set the new value
                        target[property] = value;
                    }

                    // callbacks...
                    if( !CONSTRUCTION_STAGE ){
                        // if its not in construction stage, execute callback
                        callback( {action:action, keyPath:keyPath+'.'+property, object: target, name:property, oldValue : oldValue} );
                        //  iterate callback queue and execute them
                        if( constructionCallbacks.length ) constructionCallbacks.forEach( i=> callback(i) );
                        // clear the callbacks queue
                        constructionCallbacks.splice(0)
                    }else if( CONSTRUCTION_STAGE && config.observeConstruction ){
                        // if is in construction stage but construction observation
                        // has been requested ad callback to the queue.
                        constructionCallbacks.push( {action:action, keyPath:keyPath+'.'+property, object: target, name:property, oldValue : oldValue} );
                    }
                    // done !
                    return true;
                },

                deleteProperty(target, property) {
                    let oldValue = target[property];
                    delete target[property];
                    // invoke the callback
                    callback({action:'delete', keyPath:keyPath+'.'+property, object: target, name:property, oldValue : oldValue});
                    return true;
                },

                get : function(target, property){
                    //
                    return  target[property];
                }
            });

            // assign the properties to the ProxyObject
            ProxyObject = Object.assign( ProxyObject, value );
            // add the object to the observed objects
            OBSERVED_WS.add(ProxyObject);

            result = ProxyObject;
        }

        CONSTRUCTION_STAGE = false;

        return { observer: result , callbacks :  constructionCallbacks.splice(0) };
    };

    /**
     * Observer() has two behaviors:
     *  1. Constructor : When at least two arguments are passed to `Observer()` ,
     *     it behaves as a Constructor. Arguments :
     *       object     : Object to observe
     *       callback   : Function to be invoked on object changes
     *       config     : (optional) Object containing advanced config parameters.
     *           id         : String to use as identifier to the  Observable.
     *                        (if not provided is generated automatically)
     *           observeConstruction   : Boolean. If true callback will be executed
     *                        also in construction stage.
     *           depth      : Integer. Sets the observing depth limit. When set
     *                        to 0, no limit is applied ( default : 0 )
     *           ignoreSameValueReassign : Boolean. If false, trigger callback
     *                        even when same value is reassgned ( default true )
     *
     *  2. Getter : When only a String is provided  to `Observer()` it behaves
     *     as a getter. Arguments :
     *       ìd         : String provided previously in the constructor
     *
     * Return : Observable (Proxy).
     */
    const Observer = function( object={} , callback= new Function() , _config={} ){

        // validate config object
        if( typeof _config !== 'object' ) throw new Error('Third argument (config) must be an object');
        // build config object
        const config = {
            id : _config.id || 'OBSERVED-'+Math.floor( Math.random()* Date.now() ),
            observeConstruction : !_config.observeConstruction ? false : true,
            depth : Number(_config.depth) > 0 ? Number(_config.depth) : 0,
            ignoreSameValueReassign : _config.ignoreSameValueReassign ? true : false
            // batchNotifications : false
        };

        // if callback are provided, behave as a setter
        if(arguments.length > 1){
            // validate input
            if( !(this instanceof Observer) ) throw new Error('Constructor Observer requires \'new\'');
            if( !isObjLiteralOrArray(object) ) throw new Error('First argument must be an Object or an Array');
            if( typeof callback !== 'function' ) throw new Error('Second argument (callback) must be a function.');

            // create Observer
            let newObserver = createObserver(object, callback, config.id, config, true, 0);
            OBSERVED[config.id] = newObserver.observer;

            newObserver.callbacks.forEach(i=> callback(i));
        }else{
            // if only one argument is passed assume is an id
            config.id = object;
        }

        return OBSERVED[config.id];
    };

    // debuggng method
    Observer._enumerate_= function(){ return OBSERVED };


    // done!
    if (typeof module !== 'undefined' && module.exports) module.exports = Observer;
    else window.Observer = Observer;

})();

