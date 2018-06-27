/*
* @Author: colxi.kl
* @Date:   2018-06-03 04:50:24
* @Last Modified by:   colxi
* @Last Modified time: 2018-06-25 13:57:38
*/

console.log('--------------------')
let model = new Template.Model('section2' , {
    name: 'demo',
    addItem : function(i){ model.collection.push({name:model.name}) },
    removeItem : function(i){  },

    collection : [
        { name: 'Fiodor' , surname : 'Dovstoyevsky' },
        { name: 'Albert' , surname : 'Camus' },
        { name: 'Frank' , surname : 'Kafka' }
    ],
});




export default model ;
