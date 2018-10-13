'use strict';

import 'content-iframe.sass';
import StringHelper from 'string-helper';
import SelectionHelper from 'selection-helper';

window.isMac = window.navigator.userAgent.toLowerCase().indexOf('macintosh') > -1;
let url = chrome.extension.getURL('content_iframe.html');

// .inject iframe
let iframe = document.createElement('iframe');
iframe.src = url;
iframe.id="ctr";
iframe.style.display='none';
document.body.appendChild(iframe);

window.addEventListener("message", onDialogHidden, false);

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
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        // . do not show dialog if any command key pressed
        return;
    }
    let inputElement = null;
    if (typeof event.target.tagName !== 'undefined' &&
        (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea')) {
        inputElement = event.target;
    }
    let text = getSelectedText(inputElement);
    sendShowDialogMessage(text);
    return false;
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

function onDialogHidden(event){
  // We only accept messages from ctr iframe
  if (event.source != iframe.contentWindow)
    return;

  if (event.data.type && (event.data.type == "DIALOG_HIDDEN")) {
    iframe.style.display='none';
    window.focus();
  }
}

