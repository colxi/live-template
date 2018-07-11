IN DEVELOPMENT, not ready for production!

Tiny ( <5Kb ) Reactive Templating Engine for JS (ES6)

- Declarative bindings (html attributes & placeholders)
- Reactive GUI ( Automatic UI refresh when the data model's changes)
- Templating system
- Dynamic load of Models and Views (as ES6 modules, and HTML files)
- MVVM capabilities
- **No dependencies**

## Usage example

View :
```
    <div pg-model="'myModel'"> 
        <input type="text" pg-value="myModel.msg">
        <div> Your message : ${myModel.msg} </div>
        <input type="button" pg-on-click="myModel.send"
    </div>
```

Model:
```
let myModel = new Template.Model('myModel' , {
    msg: '',
    send : e=>console.log( myModel.msg )
});
```


