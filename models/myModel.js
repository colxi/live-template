/*
* @Author: colxi.kl
* @Date:   2018-05-18 16:25:55
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-05-25 23:10:49
*/








let model = newModel('myModel' , {});

model.myContent = "__MYCONTENT__";
model.firstLevel = "__FIRSTLEVEL__";
model.secondLevel = "__SECONDLEVEL__";
model.thirdLevel = "__THIRDDLEVEL__";

model.getContext = function(){ console.log(this,self) }

model.fromOut = function(){ console.log(importModule) }


console.log('myModel loaded!');

export default model ;
//export a;
