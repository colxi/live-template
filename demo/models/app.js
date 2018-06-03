/*
* @Author: colxi.kl
* @Date:   2018-06-03 03:29:45
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-06-03 07:06:31
*/

window.onload =  ()=>{
    Template.bind();

	window.myApp = new Template.Model( 'myApp', {
        title : 'My First App',
        setSection1 : function(){ myApp.section = 'section1/main'},
        setSection2 : function(){ myApp.section = 'section2/main'},
        setSection3 : function(){ myApp.section = 'section3/main'},
        section : undefined,
	});
}
