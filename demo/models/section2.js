/*
* @Author: colxi.kl
* @Date:   2018-06-03 04:50:24
* @Last Modified by:   colxi
* @Last Modified time: 2018-07-10 23:34:28
*/

//console.log('--------------------')
let model = new Template.Model('section2' , {
    name: 'demo',
    addItem : function(){ model.collection.push({name:model.name}) },
    removeItem : function(e){
        model.collection.splice( Number(e.target.dataset.index),1 );
        //console.log('...........................',model.collection)
    },

    collection : [
        { name: 'Fiodor' , surname : 'Dovstoyevsky' },
        { name: 'Albert' , surname : 'Camus' },
        { name: 'Frank' , surname : 'Kafka' }
    ],
});




export default model ;
