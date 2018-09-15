/*
* @Author: colxi
* @Date:   2018-08-14 22:58:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-15 14:14:51
*/

/* global Template */

window.onload = ()=>{

    Debug.showDebuger();

    // create Model
    const myApp = new Template.Model('myApp', {
        upperCase : function(s){ return s.toUpperCase() },
        name : 'testname',
        phone:{
            prefix : '1234',
            number : '5678'
        },
        address:{
            vacation:'my street',
            residential:'my spain street',
        },
        currentCountry:'spain',
        getCurrentAddress:  x=>  x === 'spain' ? 'residential':'vacation'
    });

    // bind template
    Template.create('#view');

};
