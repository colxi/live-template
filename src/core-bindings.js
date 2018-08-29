/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-24 11:16:46
*/

/* global _DEBUG_ */



// this file should be called collections
//
//

/**
 * Template._Bindings holds two indexes :
 * - An Array with the PLACEHOLDERS, associating each  placeholder token to
 * each element wich contains it,
 * - A Weak Map for the ELEMENTS, wich stores each the Element original value
 * with the placeholders strings (template tokens)
 */
const Bindings = {
    templates:  new Map(),
    // bindings.templatd should be a weakmap
    // elementReference : {
    //      observer : mutationobserverid //to allow disconnect it in tempkate destroy
    //      html: template inerHTML // to allow template reusage
    //      id : ¿integer?
    // }
    //
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
