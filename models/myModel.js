/*
* @Author: colxi.kl
* @Date:   2018-05-18 16:25:55
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-05-26 20:13:37
*/






// bug
// when change myColor removes the content of myModel.myContent input elementy
//

let model = new Model('myModel' , {});

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
