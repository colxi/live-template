/*
* @Author: colxi
* @Date:   2018-08-14 22:58:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-06 22:51:33
*/

/* global Template */

window.onload = ()=>{

    Debug.showDebuger();

    // load the cards data
    let cards;
    fetch('cards.json').then( response=> response.json() ).then( d=> cards = d );

    // create Model
    const myApp = new Template.Model('myApp', {
        name : '',
        color : '',
        phone:{
            prefix : '',
            number : ''
        },
        address:[],
        newAddress : '',
        cleanCard : function(){
            myApp.name = '';
            myApp.color ='';
            myApp.phone.prefix = '';
            myApp.phone.number = '';
            myApp.newAddress = '';
            myApp.address = [];
        },
        loadCard : function(){
            let i = parseInt( Math.floor( Math.random()*5) );
            myApp.newAddress = '';
            myApp.name = cards[i].name;
            myApp.color = cards[i].color;
            myApp.phone.prefix = cards[i].phone.prefix;
            myApp.phone.number = cards[i].phone.number;
            myApp.address = cards[i].address;
        },
        alert : function(){ alert('hi '+ myApp.name) },
        deleteAddress : function(e){
            let index = e.target.dataset.index;
            myApp.address.splice(index,1);
        },
        addAddress: function(){
            myApp.address.push({street:myApp.newAddress,num:88});
        }
    });

    // bind template
    Template.create('#view');

};
