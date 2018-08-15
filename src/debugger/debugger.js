/*
* @Author: colxi
* @Date:   2018-08-14 12:50:51
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-14 21:37:22
*/
import { Bindings } from './../core-bindings.js';

let currentTab ='elements';

const debugerUI =`
    <div id="ltd-container">
        <div class="ltd-menu">
            <span onclick="Debug.updateDebugerUI()" title="Refresh Tab" class="ltd-menu-icon">&#x21bb;</span>
            <span onclick="Debug.renderInConsole()" title="Dump in Console" class="ltd-menu-icon">&#10149;</span>
            <span onclick="Template.bind('#view')" title="Bind all" class="ltd-menu-icon">&#8766;</span>
            <span onclick="Template.unbind('#view')" title="Unbind All" class="ltd-menu-icon">&#8660;</span>
            <span active onclick="Debug.loadTab('elements')" id="ltd-menu-elements">Elements</span>
            <span onclick="Debug.loadTab('placeholders')" id="ltd-menu-placeholders">Placeholders</span>
            <span onclick="Debug.loadTab('events')" id="ltd-menu-events">Events</span>
            <span onclick="Debug.loadTab('iterators')" id="ltd-menu-iterators">Iterators</span>
            <span onclick="Debug.loadTab('models')" id="ltd-menu-models">Models</span>
        </div>
        <div id ="ltd-tab-viewport"></div>
    </div>
`;

const Debug = {
    showDebuger: function(){
        if( !document.getElementById('ltd-styles') ){
            // debugger UI styles are not injected
            let s = document.createElement('link');
            s.rel='stylesheet';
            s.href='../src/debugger/style.css';
            s.id='ltd-styles';
            document.head.appendChild(s);
        }
        document.body.innerHTML+=debugerUI;
    },

    updateDebugerUI: function(){ Debug.loadTab(currentTab) },

    loadTab: function(t){
        t = t || currentTab;
        currentTab = t;
        let menu = document.querySelectorAll('#ltd-container > .ltd-menu')[0];
        Array.from(menu.children).forEach(i=> i.removeAttribute('active') );
        menu.querySelectorAll('#ltd-menu-'+t)[0].setAttribute('active',true);
        Debug.tabs[t]();
    },

    renderInConsole: function(){
        console.log('************************************')
        console.log('Dumping Bindings - '+currentTab)
        if(currentTab==='elements') console.log(Bindings.elements)
        else if(currentTab==='placeholders') console.log(Bindings.placeholders)
        else if(tcurrentTabab==='events') console.log(Bindings.events)
        else if(currentTab==='iterators') console.log(Bindings.iterators)
        console.log('************************************')
    },
    tabs:{
        /**
         * [elements description]
         * @return {[type]} [description]
         */
        elements: function(){
            let r = [];
            let els = document.querySelectorAll('*');
            // iterate all document elements
            els.forEach( e =>{
                // if element has a binding add it ti results array
                if ( Bindings.elements.has( e ) ){
                    r.push( {e: e,  v: JSON.stringify(Bindings.elements.get( e )) })
                }
                // get element childnodes
                let childNodes = Array.from(e.childNodes);
                // filrer onky the text nodes
                childNodes  = childNodes.filter(child=> child.nodeType === Node.TEXT_NODE );
                // iterate textnodes
                childNodes.forEach( child =>{
                    // if textnode has binding add jt ti results
                    if ( Bindings.elements.has( child ) ){
                        r.push( {e: child,  v:Bindings.elements.get( child ) });
                    }
                });

            });

            // render Element bindings in a table
            let h='';
            h += '<div id="ltd-tab-elements">';
            h += '  <table>';
            r.forEach( i =>{
                let type = (i.e.nodeType === Node.TEXT_NODE) ?'textNode':'elementNode';
                h +='   <tr>';
                h +='       <td>'+type+'</td>';
                h +='       <td>'+i.v+'</td>';
                h +='   </tr>';
            });
            h += '  </table>';
            h +='</div>';
            document.getElementById('ltd-tab-viewport').innerHTML = h;
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
                    hh += (b.nodeType ===  Node.TEXT_NODE) ?'textNode':'elementNode';
                    hh += '</span>';
                })
                h += '       <td>'+hh+'</td>';
                h += '   </tr>';
            };
            h +='   </table>';
            h +='</div>';
            document.getElementById('ltd-tab-viewport').innerHTML = h;
        }
    },

};

window.Debug = Debug;
export { Debug };
