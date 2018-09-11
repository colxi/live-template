/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-07 20:49:12
*/

/* global _DEBUG_ */



// this file should be called collections
//
//


const Bindings = {
    templates:  new Map(),
    // bindings.templatd should be a weakmap
    // elementReference : {
    //      observer : mutationobserverid //to allow disconnect it in tempkate destroy
    //      html: template inerHTML // to allow template reusage
    //      id : ¿integer?
    // }
    //
    expressions : {
        /*
        "javascript-expression" : {
            // elements containing the expresion
            elements : [ node, node, node, node, textNode,...],
            // jses generated abstract syntaxt tree*
            ast : {},
            // keypaths
            keypaths : {}
        },
        ...
        */
    },
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
    events : new Map(),
    iterators : {},
    elements : new Map(),
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
}
export { Bindings };
