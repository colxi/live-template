/*
* @Author: colxi
* @Date:   2018-08-14 22:58:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-10 20:23:19
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
        }
    });

    // bind template
    Template.create('#view');

};
