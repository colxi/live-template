/*
* @Author: colxi.kl
* @Date:   2018-06-03 03:29:45
* @Last Modified by:   colxi
* @Last Modified time: 2018-07-11 08:39:11
*/

window.onload =  ()=>{

    Template.bind();
	window.myApp = new Template.Model( 'myApp', {
        title : 'My First App',
        setSection1 : function(){ myApp.section = 'section1/main'},
        setSection2 : function(){ myApp.section = 'section2/main'},
        setSection3 : function(){ myApp.section = 'section3/main'},
        section : 'section1/main',
        arr : [ {a:1},{a:2},{a:3},{a:4},{a:5} ],
        r : i => myApp.arr.splice(i,1)

	});
}
