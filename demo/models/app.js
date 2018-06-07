/*
* @Author: colxi.kl
* @Date:   2018-06-03 03:29:45
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-06-03 20:49:48
*/

window.onload =  ()=>{

    Template.bind();
	window.myApp = new Template.Model( 'myApp', {
        title : 'My First App',
        setSection1 : function(){ myApp.section = 'section1/main'},
        setSection2 : function(){ myApp.section = 'section2/main'},
        setSection3 : function(){ myApp.section = 'section3/main'},
        section : 'section1/main',
        collection : [
        	{ name: 'Fiodor' , surname : 'Dovstoyevsky' },
        	{ name: 'Albert' , surname : 'Camus' },
        	{ name: 'Frank' , surname : 'Kafka' }
        ],
	});
}
