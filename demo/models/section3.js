/*
* @Author: colxi.kl
* @Date:   2018-06-03 04:50:24
* @Last Modified by:   colxi.kl
* @Last Modified time: 2018-06-03 07:07:28
*/

let model = new Template.Model('section3' , {});

model.loadModel = function(){ window.myModel = Template.loadModel('myModel') };
model.deleteBlock = function(){ myApp.container.remove() };
model.loadView = async function(){ myApp.myView.innerHTML = await Template.loadView('section3/gallery') }

export default model ;
