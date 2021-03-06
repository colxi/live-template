/*
* @Author: colxi
* @Date:   2018-08-14 22:58:05
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-03 15:16:25
*/

/* global Template */

var  cardHTML;
var  myApp;

var cards = [
    {
        name:'Albert',
        color:'blue',
        phone:{
            prefix:'+41',
            number: '707-545-23-66'
        },
        address :[
            {
                street:'pi i margall',
                num: 43,
                public:true
            },
            {
                street:'pujades',
                num: 222,
                public:true
            },
            {
                street:'fraternitat',
                num: 18,
                public:false
            },
            {
                street:'sant bertran',
                num: 33,
                public:false
            },
            {
                street:'pedreres',
                num: 14,
                public:true
            }
        ]
    },
    {
        name:'Roger',
        color:'pink',
        phone:{
            prefix:'+21',
            number: '232-453-63-44'
        },
        address :[
            {
                street:'aparici',
                num: 3
            },
            {
                street:'santo domingo',
                num: 82
            },
            {
                street:'major',
                num: 1
            },
            {
                street:'montserrat',
                num: 833
            }
        ]
    },
    {
        name:'Joseph',
        color:'green',
        phone:{
            prefix:'+31',
            number: '444-216-12-88'
        },
        address :[
            {
                street:'bush',
                num: 49
            },
            {
                street:'clinton',
                num: 92
            },
            {
                street:'trump',
                num: 8
            },
            {
                street:'obama',
                num: 3
            }
        ]
    },
    {
        name:'Francis',
        color:'red',
        phone:{
            prefix:'+1',
            number: '707-223-12-23'
        },
        address :[
            {
                street:'corrientes',
                num: 113
            },
            {
                street:'abasto',
                num: 98
            },
            {
                street:'salvadiror',
                num: 1
            }
        ]
    },
    {
        name:'Frederich',
        color:'black',
        phone:{
            prefix:'+4',
            number: '888-345-11-63'
        },
        address :[
            {
                street:'flatt road',
                num: 8
            },
            {
                street:'miat av',
                num: 76
            },
            {
                street:'george w.',
                num: 22
            }
        ]
    }
];


function newCard(){
    //destroyCard()
    let i = parseInt( Math.floor( Math.random()*5) );
    console.log('random card id',i);
    //document.getElementById('view').innerHTML = cardHTML;
    Template.Model('myApp').name = cards[i].name;
    Template.Model('myApp').color = cards[i].color;
    Template.Model('myApp').phone.prefix = cards[i].phone.prefix;
    Template.Model('myApp').phone.number = cards[i].phone.number;
    Template.Model('myApp').address = cards[i].address;
}

function destroyCard(){
    Template.Model('myApp').name = '';
    Template.Model('myApp').color ='';
    Template.Model('myApp').phone.prefix = '';
    Template.Model('myApp').phone.number = '';
    Template.Model('myApp').address = [];
}



window.onload = ()=>{
    Template.Config.debugMode = false

    cardHTML = document.getElementById('view').innerHTML;
    Debug.showDebuger();
    myApp = new Template.Model('myApp', {
        name : '',
        color : '',
        phone:{
            prefix : '',
            number : ''
        },
        address:[],
        newAddress : '',
        alert : function(){ alert('hi '+ myApp.name) },
        deleteAddress : function(e){
            let index = e.target.dataset.index;
            myApp.address.splice(index,1);
        },
        addAddress: function(){
            myApp.address.push({street:myApp.newAddress,num:88});
        }
    });
};
