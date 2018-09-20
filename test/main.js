/*
* @Author: colxi
* @Date:   2018-08-14 22:58:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-19 00:45:43
*/

/* global Template */

window.onload = ()=>{

    Debug.showDebuger();

    // create Model
    window.myApp = new Template.Model('myApp', {
        upperCase : function(s){ return String(s).toUpperCase() },
        name : 'emma',
        phone:{
            prefix : '1234',
            number : '5678'
        },
        color:'red',
        address:{
            vacation:'my vacation home street',
            residential:'my residential home street',
        },
        currentCountry:'spain',
        getCurrentAddress:  x=>  x === 'spain' ? 'residential':'vacation'
    });

    // bind template
    Template.create('#view');

};
