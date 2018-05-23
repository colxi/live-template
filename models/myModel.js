/*
* @Author: colxi.kl
* @Date:   2018-05-18 16:25:55
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-05-18 20:05:25
*/








let newModel = function(modelName){ return {} }




let model = newModel('myModel' , {

});

model.getContext = function(){ console.log(this,self) }

model.fromOut = function(){ console.log(importModule) }


export default model ;
//export a;
