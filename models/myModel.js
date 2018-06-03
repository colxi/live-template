/*
* @Author: colxi.kl
* @Date:   2018-05-18 16:25:55
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-06-03 04:50:16
*/






// bug
// when change myColor removes the content of myModel.myContent input elementy
//


/*
TODO:  use classes to generate Models

let myModel =  class myModel extends Model {
    constructor(name, level, spell) {
        // Chain constructor with super
        super(name, level);

        // Add a new property
        this.spell = spell;
    }
}

*/

let model = new Template.Model('myModel' , {});

model.ID = "#3245245"
model.type = {} ;
model.type.profile = 'Premium';
model.secondName = 'Pottie';
model.firstName = 'Emma';
model.Address = {};
model.Address.Number = '453';
model.Address.Street = 'Redwood Dr.';
model.Address.City = 'Garberville';
model.Address.State = 'California';

currentStatus ='online'


model.getContext = function(){ console.log(this,self) }

model.fromOut = function(){ console.log(importModule) }


console.log('myModel loaded!');

export default model ;
//export a;
