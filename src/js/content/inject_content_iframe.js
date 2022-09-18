'use strict';

import 'content-iframe.sass';
import StringHelper from 'string-helper';
import SelectionHelper from 'selection-helper';

window.isMac = window.navigator.userAgent.toLowerCase().indexOf('macintosh') > -1;

injectIframeTo('body');

function injectIframeTo(rootSelector){
    if(window.iframe){
        window.iframe.remove()
        //window.iframe.parentNode.removeChild(window.iframe);
    }
    window.iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('content_iframe.html');;
    iframe.id="ctr";
    iframe.style.display='none';
    document.querySelector(rootSelector).appendChild(iframe);
}

// let f = function(){
//     if($('.controls')[0]){
//         $('.controls').append(iframe);
//     }
//     else{
//         setTimeout(f,500);
//     }
// };
// setTimeout(f,500);


window.addEventListener("message", onMessage, false);

document.addEventListener('keydown', function(e){
    function cancelEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    // . shift for Mac
    // . ctrl for PC
    let isCommandKeyPressed = ((window.isMac && e.shiftKey && !e.ctrlKey) ||
		(!window.isMac && e.ctrlKey && !e.shiftKey)) && !e.altKey && !e.metaKey;

    // this.dialog is Hidden
    if (isCommandKeyPressed && e.keyCode === 32) { // Ctrl + Space
        let text = getSelectedText();
    	sendShowDialogMessage(text);
        return cancelEvent(e);
    }
}, true);

document.addEventListener('dblclick', function dblClick(event) {
    if (event.shiftKey || event.altKey || event.metaKey) {
        // . do not show dialog if any command key pressed
        return;
    }
    if(event.ctrlKey ){
        // . show dialog only if Ctrl is pressed
        let inputElement = null;
        if (typeof event.target.tagName !== 'undefined' &&
            (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea')) {
            inputElement = event.target;
        }
        let text = getSelectedText(inputElement);
        if(text){
            sendShowDialogMessage(text);
            return false;
        }
    }
});

function getSelectedText(inputElement){
    let text;
    if (inputElement) {
        if(inputElement.getAttribute && inputElement.getAttribute('type') === 'password'){
            return;
        }
        text = inputElement.type === 'checkbox' ?
            '' :
            inputElement.value.substring(inputElement.selectionStart, inputElement.selectionEnd);
    } else {
        text = SelectionHelper.getSelection().toString();
    }
    text = StringHelper.trimText(text);

    if (/^\D+$/g.test(text) && text.split(' ').length <= 3) {
        return text;
    }
};

function sendShowDialogMessage(text){
    iframe.style.display='block';

    // .send show dialog message to iframe
    iframe.contentWindow.postMessage({
        type: "SHOW_DIALOG",
        text: text
    }, "*");
}

function sendHideDialogMessage(){
    iframe.contentWindow.postMessage({
        type: "HIDE_DIALOG"
    }, "*");
}

function onMessage(event){
    if (event.source == iframe.contentWindow){
        // ctr iframe
        if (event.data && (event.data.type=="DIALOG_HIDDEN")) {
            iframe.style.display='none';
            window.focus();
            // if(isNetflix){
                window.postMessage({
                    type: "FOCUS_NETFLIX_PLAYER"
                }, "*");
            // }
        }
    }else if(event.source==window){
        // top window
        if (event.data) {
            switch(event.data.type){
                case "INJECT_IFRAME_TO":
                    injectIframeTo(event.data.rootSelector);
                    break;
                case "SHOW_DIALOG":
                    sendShowDialogMessage(event.data.text);
                    break;
                case "HIDE_DIALOG":
                    sendHideDialogMessage();
                    break;
            }
        }
    }
}