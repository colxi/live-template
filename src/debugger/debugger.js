/*
* @Author: colxi
* @Date:   2018-08-14 12:50:51
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-19 19:11:29
*/
import { Bindings } from './../core-bindings.js';

let currentTab ='expressions';

const debugerUI =`
    <link rel="stylesheet" href="../src/debugger/style.css" id="ltd-styles" />
    <div class="ltd-menu">
        <span class="menu-shortcuts">
            <span class="menu-element ltd-menu-icon" onclick="Debug.garbageCollector()" title="Garbarge Collector" >&#x1F5D1;</span>
            <span class="menu-element ltd-menu-icon" onclick="console.clear()" title="Clean console" >&#x1f6c7;</span>
            <span class="menu-element ltd-menu-icon" onclick="Debug.renderInConsole()" title="Dump in Console" >&#10149;</span>
            <!--
            <span class="menu-element ltd-menu-icon" onclick="Debug.updateDebugerUI()" title="Refresh Tab" >&#x21bb;</span>
            -->
            <span class="menu-element ltd-menu-icon ltd-menu-bind" onclick="Template.create('#view')" title="Create Template" >&#8766;</span>
            <span class="menu-element ltd-menu-icon ltd-menu-unbind"  onclick="Template.destroy('#view')" title="Destroy Template" >&#8660;</span>
        </span>
        <span class="menu-tabs">
            <span class="menu-element" onclick="Debug.loadTab('expressions')" id="ltd-menu-expressions" active>Expressions</span>
            <span class="menu-element" onclick="Debug.loadTab('placeholders')" id="ltd-menu-placeholders" >Identifiers</span>
            <span class="menu-element" onclick="Debug.loadTab('elements')" id="ltd-menu-elements">Elements</span>
            <span class="menu-element" onclick="Debug.loadTab('events')" id="ltd-menu-events">Events</span>
            <span class="menu-element" onclick="Debug.loadTab('iterators')" id="ltd-menu-iterators">Iterators</span>
            <span class="menu-element" onclick="Debug.loadTab('log')" id="ltd-menu-log">Log</span>
        </span>
        <span id="menu-tabs-compressed">
            <span id="menu-tabs-dialog-button">»</span>
            <span id="menu-tabs-compressed-dialog"></span>
            <div id="menu-tabs-compressed-dialog-background"></div>
        </span>
        <span id="menu-fold">▼</span>
    </div>
    <div id ="ltd-tab-viewport"></div>
`;

const debuggerResizerCss = `
    left: 0px;
    right: 0px;
    top: 0;
    background: transparent;
    height: 5px;
    cursor: ns-resize;
    position: relative;
    border-bottom:2px solid #01ea01
`;

const debuggerContainerCss = `
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    height: 200px;
    transition: 0s;
`;

const debuggerContainer = document.createElement('div');
debuggerContainer.setAttribute('color','red');
debuggerContainer.setAttribute('color','red');
debuggerContainer.id  = 'ltd-container';
debuggerContainer.style  = debuggerContainerCss;
debuggerContainer.innerHTML += '<div id="ltd-resizer" style="'+debuggerResizerCss+'"></div>';
debuggerContainer.innerHTML += '<div id="ltd-viewport"></div>';
document.body.appendChild(debuggerContainer);

const debugComponent = document.getElementById('ltd-viewport').attachShadow({mode: 'open'});
debugComponent.innerHTML  = debugerUI;

document.documentElement.style='height:100%;'; // html elememt
document.body.style='height:100%; margin: 0px;'; // body elememt




 var isResizing = false;

var handle = document.getElementById("ltd-resizer");
var container = debuggerContainer.parentElement;

handle.onmousedown = function(e) {
    // remove transition effect, and set panel as open
    debuggerContainer.style.transition='0s';
    debuggerPanelStatus=1;
    menu.querySelectorAll('#menu-fold')[0].innerHTML='▼ ';


    isResizing = true;
};

document.onmousemove = function(e) {
    if (!isResizing) return;
    let cursorY= (e.clientY < -6) ? -6 : e.clientY ;
    var offsetTop = container.clientHeight - (cursorY - container.offsetTop);
    debuggerContainer.style.height = offsetTop + "px";
};

document.onmouseup = function(e){ isResizing = false; }


const menu = debugComponent.querySelectorAll('.ltd-menu')[0];
menu.querySelectorAll('#menu-tabs-compressed-dialog-background')[0].onclick= function(e){
    menu.querySelectorAll('#menu-tabs-compressed-dialog-background')[0].style.display='none';
    menu.querySelectorAll('#menu-tabs-compressed-dialog')[0].style.display='none';
};


menu.querySelectorAll('#menu-tabs-dialog-button')[0].onclick= function(e){

    const menuTabsCompressecDialog = menu.querySelectorAll('#menu-tabs-compressed-dialog')[0];

    var style = window.getComputedStyle(menuTabsCompressecDialog);
    if(style.display === 'none'){
        menuTabsCompressecDialog.style.display='block';
        menu.querySelectorAll('#menu-tabs-compressed-dialog-background')[0].style.display='block';
    }

}


let debuggerPanelStatus=1;
var debuggerPanelLastHeight = 0;

menu.querySelectorAll('#menu-fold')[0].onclick= function(e){
    debuggerContainer.style.transition='.5s';
    if(debuggerPanelStatus===1){
        menu.querySelectorAll('#menu-fold')[0].innerHTML='▲ ';
        debuggerPanelLastHeight = debuggerContainer.offsetHeight;
        debuggerContainer.style.height='41px'
        debuggerPanelStatus=0;
    }else{
        menu.querySelectorAll('#menu-fold')[0].innerHTML='▼ ';
        debuggerContainer.style.height= debuggerPanelLastHeight+'px';
        debuggerPanelStatus=1;
    }
}


setTimeout( e=> Debug.adjustMenu() ,1000);
window.onresize = e=> Debug.adjustMenu();

const Debug = {
    adjustMenu: function(e){

        const menu = debugComponent.querySelectorAll('.ltd-menu')[0];
        const menuTabsContainer = menu.querySelectorAll('.menu-tabs')[0];
        const menuTabsCompressecDialog = menu.querySelectorAll('#menu-tabs-compressed-dialog')[0];
        console.log(menuTabsCompressecDialog)
        Array.from(menuTabsCompressecDialog.children).forEach(i=>{
            menuTabsContainer.appendChild(i)
        })

        let width = menu.offsetWidth;
        let shortcutsWidth=  menu.querySelectorAll('.menu-shortcuts')[0].offsetWidth;
        let availableWidth = width - shortcutsWidth - 120;


        let menuTabs = Array.from( menuTabsContainer.children );
        menuTabs.forEach(i=>{
            availableWidth= availableWidth - i.offsetWidth;
            if( availableWidth < 0)  menuTabsCompressecDialog.appendChild(i);
            //else i.style.display = 'inline-block';
        });
    },
    select: function(el){
        let target= null;
        if(el.nodeType===Node.ELEMENT_NODE) target= el;
        else if(el.nodeType=== Node.TEXT_NODE) target= el.parentNode;
        target.setAttribute('ltd-selected',true)
    },
    garbageCollector(){
        if( typeof window.gc !== 'function' ){
            console.log('Garbage Collector API is not available!')
            console.log('Relaunch Chrome using : chrome.exe --js-flags="--expose-gc"')
            return false;
        }
        console.log('Running Garbage Collector...')
        console.log('( Console  must be clean to garantee suucces )')
        window.gc();
        return true;
    },
    showDebuger: function(){

        //document.body.innerHTML+=debugerUI;


    },

    updateDebugerUI: function(){
        Debug.loadTab(currentTab)
    },

    loadTab: function(t){

        t = t || currentTab;
        currentTab = t;
        let menu = debugComponent.querySelectorAll('.ltd-menu')[0];
        let menuItes =  menu.querySelectorAll('.menu-element');

        Array.from(menuItes).forEach(i=> i.removeAttribute('active') );
        menu.querySelectorAll('#ltd-menu-'+t)[0].setAttribute('active',true);
        Debug.tabs[t]();

          menu.querySelectorAll('#menu-tabs-compressed-dialog-background')[0].style.display='none';
        menu.querySelectorAll('#menu-tabs-compressed-dialog')[0].style.display='none';
    },

    renderInConsole: function(){
        console.log('************************************')
        console.log('Dumping Bindings - '+currentTab)
        if(currentTab==='elements') console.log(Bindings.elements)
        else if(currentTab==='placeholders') console.log(Bindings.placeholders)
        else if(currentTab==='events') console.log(Bindings.events)
        else if(currentTab==='iterators') console.log(Bindings.iterators)
        console.log('************************************')
    },
    tabs:{
        /**
         * [elements description]
         * @return {[type]} [description]
         */
        elements: function(){
            // render Element bindings in a table
            let h='';
            h += '<div id="ltd-tab-elements">';
            h += '  <table>';
            Bindings.elements.forEach( (v,e)=>{
                let type = (e.nodeType === Node.TEXT_NODE) ?'textNode':e.tagName.toLowerCase();
                h +='   <tr>';
                h +=        '<td>';
                h +=            '<span class="lt-type-element">'+type+'</span>';
                h +=        '</td>';
                h +=        '<td>';
                if( typeof v==='string'){
                    h +=        '<span class="lt-type-nodeValue"></span>';
                    h +=        '<span class="lt-type-text">'+v+'</span>';
                }else{
                    Object.keys(v).forEach(function(key) {
                        h +=    '<span class="lt-type-attribute">'+key+' =</span>';
                        h +=    '<span class="lt-type-text">'+v[key]+'</span>';
                        h +=    '<br>';
                    });
                }
                h +=        '</td>';
                h +='   </tr>';
            });
            h += '  </table>';
            h +='</div>';
            debugComponent.getElementById('ltd-tab-viewport').innerHTML = h;
        },
        /**
         * [placeholders description]
         * @return {[type]} [description]
         */
        placeholders: function(){
            // render Placeholder Bindings in a table
            let h='';
            h += '<div id="ltd-tab-placeholders">';
            h += '   <table>';
            for(let i in Bindings.placeholders){
                //let type = (i.e.nodeType === Node.TEXT_NODE) ?'textNode':'elementNode';
                h += '<tr>';
                h +=    '<td>';
                h+=         '<span class="lt-type-identifier">'+i+'</span>';
                h+=     '</td>';
                let hh = '';
                Bindings.placeholders[i].forEach(b=>{
                    hh += '<span class="lt-type-expression">';
                    hh += b;
                    hh += '</span><br>';
                });
                h += '       <td>'+hh+'</td>';
                h += '   </tr>';
            }
            h +='   </table>';
            h +='</div>';
            debugComponent.getElementById('ltd-tab-viewport').innerHTML = h;
        },
        expressions: function(){
            // render Placeholder Bindings in a table
            let h='';
            h += '<div id="ltd-tab-expressions">';
            h += '   <table>';
            for(let i in Bindings.expressions){
                h += '   <tr>';
                h += '       <td><span class="lt-type-expression">'+i+'</span></td>';
                let hh = '';
                Bindings.expressions[i].elements.forEach(b=>{
                    hh += '<span class="lt-type-element">';
                    hh += (b.nodeType ===  Node.TEXT_NODE) ?'textNode':b.tagName.toLowerCase();
                    hh += '</span>';
                });
                h += '       <td>'+hh+'</td>';
                h += '   </tr>';
            }
            h +='   </table>';
            h +='</div>';
            debugComponent.getElementById('ltd-tab-viewport').innerHTML = h;
        },
        events: function(){
            // render Element bindings in a table
            let h='';
            h += '<div id="ltd-tab-events">';
            h += '  <table>';
            Bindings.events.forEach( (v,e)=>{
                let type = (e.nodeType === Node.TEXT_NODE) ?'textNode':elementNode.tagName;
                h +='   <tr>';
                h +='       <td>'+type+'</td>';
                h +='       <td>';
                Object.keys(v).forEach(b=>{
                    h += '     <span>on-'+b+'</span>';
                })
                h +='       </td>';
                h +='   </tr>';
            });
            h += '  </table>';
            h +='</div>';
            debugComponent.getElementById('ltd-tab-viewport').innerHTML = h;
        },
        iterators: function(){
            console.log(Bindings.iterators)
            return;
            // render Element bindings in a table
            let h='';
            h += '<div id="ltd-tab-events">';
            h += '  <table>';
            Bindings.iterators.forEach( (v,e)=>{
                h +='   <tr>';
                h +='       <td>'+elementNode.tagName+'</td>';
                h +='       <td>';
                v.forEach(b=>{
                    h += '     <span>'+b.keypath+'</span>';
                })
                h +='       </td>';
                h +='   </tr>';
            });
            h += '  </table>';
            h +='</div>';
            debugComponent.getElementById('ltd-tab-viewport').innerHTML = h;
        },
        log: function(){
            let h='';
            h += '<div id="ltd-tab-events">';
            h +=    '<input type="checkbox" id="log-bindings" checked><label for="log-bindings">Bindings</label><br>';
            h +=    '<input type="checkbox" id="log-unbindings" checked><label for="log-unbindings">Unbindings</label><br>';
            h +=    '<input type="checkbox" id="log-directives" checked><label for="log-directives">Directives</label><br>';
            h +=    '<input type="checkbox" id="log-subsriptions" checked><label for="log-subsriptions">Subsriptions</label><br>';
            h += '</div>';
            debugComponent.getElementById('ltd-tab-viewport').innerHTML = h;
        }
    }

};

window.Debug = Debug;
export { Debug };
