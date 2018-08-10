/*
* @Author: colxi
* @Date:   2018-07-15 23:07:07
* @Last Modified by:   colxi
* @Last Modified time: 2018-07-17 08:19:00
*/


/**
 * Template._Bindings holds two indexes :
 * - An Array with the PLACEHOLDERS, associating each  placeholder token to
 * each element wich contains it,
 * - A Weak Map for the ELEMENTS, wich stores each the Element original value
 * with the placeholders strings (template tokens)
 */
const Bindings = {
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

export { Bindings }
