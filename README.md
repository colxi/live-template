## Live Template v0.0.6 alpha

Tiny ( less than 10Kb gzipped ) Reactive Templating Engine for JS (ES6)

- Declarative bindings (html attributes & placeholders)
- Reactive GUI ( Automatic UI refresh when the data models changes)
- Templating system
- MVVM capabilities
- **No dependencies**


## Usage example

View :

```html
    <div id="myView"> 
        Name: <input type="text" lt-value="myModel.name">
        <div> Your name is : {{myModel.name}} </div>
        <input type="button" lt-on-click="myModel.sayHi()">
    </div>
```

Model:
```javascript
    let myModel = new Template.Model('myModel' , {
        name: '',
        sayHi : e=> alert( 'Hi '+ myModel.name )
    });

    Template.create('#myView')
```

## Reactive
The two way data binding  automatically performed in the models,when declared, allows automatic updates in the DOM in real time.

Any change in the DOM, will be reflected also, to the model(s), when necessary. 

## Available Directives

### lt-for-*

```html
    <div lt-for-item="myModel.items" lt:index="myIndex"> 
        <div> {{myIndex}} - {{item.name}} </div>
    </div>
```
Performs iteration to the provided model iterable, and renders the contents of the block as many times as iterations can be eprformed. The usage of the `:index` directive modifier, allows to use an index key.

### lt-if
```html
    <div lt-if="myModel.visible" > 
        If you see this is because myModel.visible=true
    </div>
```
Shows/hides the element if the model prooerty evaluates to true/false
###  lt-on-*
```html
    <div lt-on-click="myModel.sayHi()" > 
        Click me to trigger an action!
    </div>
```
Adds an event listener to the element with the provided callback.

### lt-value
```html
    <input type="text" lt-value="myModel.name">
```
Performs a (two way) data binding with the provded model prooerty
