/*
* @Author: colxi
* @Date:   2018-08-14 12:50:51
* @Last Modified by:   colxi
* @Last Modified time: 2018-09-18 19:41:17
*/
import { Bindings } from './../core-bindings.js';

let currentTab ='expressions';

const debugerUI =`
    <link rel="stylesheet" href="../src/debugger/style.css" id="ltd-styles" />
    <div class="ltd-menu">
        <span onclick="Debug.garbageCollector()" title="Garbarge Collector" class="ltd-menu-icon">&#x1F5D1;</span>
        <span onclick="console.clear()" title="Clean console" class="ltd-menu-icon">&#x1f6c7;</span>
        <span onclick="Debug.renderInConsole()" title="Dump in Console" class="ltd-menu-icon">&#10149;</span>
        <!--
        <span onclick="Debug.updateDebugerUI()" title="Refresh Tab" class="ltd-menu-icon">&#x21bb;</span>
        -->
        <span onclick="Template.create('#view')" title="Create Template" class="ltd-menu-icon ltd-menu-bind">&#8766;</span>
        <span onclick="Template.destroy('#view')" title="Destroy Template" class="ltd-menu-icon ltd-menu-unbind">&#8660;</span>
        <span onclick="Debug.loadTab('expressions')" id="ltd-menu-expressions" active>Expressions</span>
        <span onclick="Debug.loadTab('placeholders')" id="ltd-menu-placeholders" >Placeholders</span>
        <span onclick="Debug.loadTab('elements')" id="ltd-menu-elements">Elements</span>
        <!--
        <span onclick="Debug.loadTab('events')" id="ltd-menu-events">Events</span>
        <span onclick="Debug.loadTab('iterators')" id="ltd-menu-iterators">Iterators</span>
        <span onclick="Debug.loadTab('log')" id="ltd-menu-log">Log</span>
        -->
    </div>
    <div id ="ltd-tab-viewport"></div>
`;


let debuggerContainer        = document.createElement('div');
debuggerContainer.id         = 'ltd-container';
document.body.appendChild(debuggerContainer);

let debugComponent = debuggerContainer.attachShadow({mode: 'open'});
//debugComponent = document.getElementById('ltd-container').shadowRoot;
debugComponent.innerHTML  = debugerUI;

const Debug = {
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
        Array.from(menu.children).forEach(i=> i.removeAttribute('active') );
        menu.querySelectorAll('#ltd-menu-'+t)[0].setAttribute('active',true);
        Debug.tabs[t]();
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
                h +='       <td onmouseover="Debug.select(this)">'+type+'</td>';
                h +='       <td>'+JSON.stringify(v)+'</td>';
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
                h += '   <tr>';
                h += '       <td>'+i+'</td>';
                let hh = '';
                Bindings.placeholders[i].forEach(b=>{
                    hh += '<span>';
                    hh += b;
                    hh += '</span>';
                });
                h += '       <td>'+hh+'</td>';
                h += '   </tr>';
            };
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
                //let type = (i.e.nodeType === Node.TEXT_NODE) ?'textNode':'elementNode';
                h += '   <tr>';
                h += '       <td>'+i+'</td>';
                let hh = '';
                Bindings.expressions[i].elements.forEach(b=>{
                    hh += '<span>';
                    hh += (b.nodeType ===  Node.TEXT_NODE) ?'textNode':b.tagName.toLowerCase();
                    hh += '</span> ';
                })
                h += '       <td>'+hh+'</td>';
                h += '   </tr>';
            };
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
