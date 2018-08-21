/*
* @Author: colxi
* @Date:   2018-08-14 22:58:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-21 15:22:30
*/

var  cardHTML;

var cards = [
    {
        name:'Albert',
        color:'blue',
        phone:{
            prefix:'+41',
            number: '707-545-23-66'
        }
    },
    {
        name:'Roger',
        color:'pink',
        phone:{
            prefix:'+21',
            number: '232-453-63-44'
        }
    },
    {
        name:'Joseph',
        color:'green',
        phone:{
            prefix:'+31',
            number: '444-216-12-88'
        }
    },
    {
        name:'Francis',
        color:'red',
        phone:{
            prefix:'+1',
            number: '707-223-12-23'
        }
    },
    {
        name:'Frederich',
        color:'black',
        phone:{
            prefix:'+4',
            number: '888-345-11-63'
        }
    }
];


function newCard(){
    destroyCard()
    let i = parseInt( Math.floor( Math.random()*5) );
    console.log('random card id',i)
    document.getElementById('view').innerHTML = cardHTML;
    Template.Model('myApp').name = cards[i].name;
    Template.Model('myApp').color = cards[i].color;
    Template.Model('myApp').phone.prefix = cards[i].phone.prefix;
    Template.Model('myApp').phone.number = cards[i].phone.number;
}

function destroyCard(){
    document.getElementById('view').innerHTML = '';
}

window.onload = ()=>{
    cardHTML = document.getElementById('view').innerHTML;
    Debug.showDebuger();
    myApp = new Template.Model('myApp', {
        name : '',
        age:11,
        color : '',
        phone:{
            prefix : '',
            number : ''
        },
        alert : function(){ alert('hi '+ myApp.name) }
    });
};
