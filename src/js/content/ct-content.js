'use strict';

import MessageTypes from '../message-types';
import ServiceProvider from './service-provider';

export default class CTContent {
    constructor() {
        this.isMac = window.navigator.userAgent.toLowerCase().indexOf('macintosh') > -1;
        this.dataFromSite = null;
        this.serviceProvider = new ServiceProvider();
        this.dialog = this.serviceProvider.getDialog();
    }

    init() {
        let self = this;
        this._addInstalledMarker();
        this._loadInitializationData(function(data) {
            self.dialog.setLangPair(data.langPair);
            self.dialog.addLangPairChangedListener(self._onLangPairChanged.bind(self));
        });
        this.dialog.addOnHiddenListener(this._onDialogHidden);
        this._listenBackground();
        this._bindEventHandlers();
    }

    _onDialogHidden(){
        window.top.postMessage({ 
            type: "DIALOG_HIDDEN"
        }, "*");
    }

    _listenBackground() {
        chrome.runtime.onMessage.addListener(this._onMessage.bind(this));
    }

    _onMessage(message, sender, sendResponse) {
        switch (message.type) {
            case MessageTypes.InitSiteDialog:
                this.initSiteDialog(message.langPair, message.attachBlockSelector, message.bookId);
                break;
            case MessageTypes.OAuthSuccess:
                let vocabulary = this.serviceProvider.getVocabulary();
                vocabulary.authenticate(message.user);
                break;
        }
    }

    _addInstalledMarker() {
        $('body').append('<div id="ctr_is_installed_' + chrome.runtime.id + '"></div>');
    }

    _onLangPairChanged(langPair) {
        chrome.runtime.sendMessage({
            type: MessageTypes.SaveLangPair,
            langPair: langPair
        });
    }

    /* Load from local storage */
    _loadInitializationData(callback) {
        chrome.runtime.sendMessage({
            type: MessageTypes.LoadInitializationData
        }, callback);
    }

    _bindEventHandlers() {
        window.addEventListener("message", function(event) {
          // We only accept messages from the top window containing our iframe
          if (event.source != window.top)
            return;

          if (event.data.type && (event.data.type == "SHOW_DIALOG")) {
            this.dialog.showForExtension(event.data.text);
            this._showDialogForCurrentSelection(null, true);
          }
        }.bind(this), false);

        document.addEventListener('keydown', this.keyDown.bind(this), true);
        document.addEventListener('keyup', this.keyUp.bind(this));
    }

    //***** HANDLERS *******************************************************************************************************

    keyUp(e) {
        if (!this.dialog || !this.dialog.isActive)
            return;
        if (e.keyCode == 17 && this.dialog.sourceWithActiveLink !== this.dialog.activeSource)
            this.dialog.activateSourceWithActiveLink();
    }

    keyDown(e) {
        function cancelEvent(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // . shift for Mac
        // . ctrl for PC
        let isCommandKeyPressed = ((this.isMac && e.shiftKey && !e.ctrlKey) ||
            (!this.isMac && e.ctrlKey && !e.shiftKey)) && !e.altKey && !e.metaKey;

        if (this.dialog && this.dialog.isActive && !this.dialog.loginForm.isVisible()) {
            // . this.dialog is Visible
            let langSelectorIsActive = this.dialog.sourceLangSelector.isActive || this.dialog.targetLangSelector.isActive;
            if (e.keyCode === 27 && !langSelectorIsActive) { // Esc + language selectors are't active
                this.dialog.hide();
                return cancelEvent(e);
            }
            if (this.dialog.isInputFocused() || langSelectorIsActive) {
                if (isCommandKeyPressed) {
                    if (e.keyCode === 13) { // Ctrl + Enter
                        this.dialog.langSwitcher.switch(this.dialog.focusInput.bind(this.dialog));
                        return cancelEvent(e);
                    }
                    if (e.keyCode === 37) { // Ctrl + Left
                        this.dialog.targetLangSelector.hideList();
                        this.dialog.sourceLangSelector._showList();
                        return cancelEvent(e);
                    }
                    if (e.keyCode === 39) { // Ctrl + Right
                        this.dialog.sourceLangSelector.hideList();
                        this.dialog.targetLangSelector._showList();
                        return cancelEvent(e);
                    }
                }
            } else {
                if (isCommandKeyPressed) {
                    if (e.keyCode === 37) { // Ctrl + Left
                        this.dialog.selectPrevSource();
                        return cancelEvent(e);
                    }
                    if (e.keyCode === 39) { // Ctrl + Right
                        this.dialog.selectNextSource();
                        return cancelEvent(e);
                    }
                }
                if (this.dialog.activeSource) {
                    if (e.keyCode === 37) { // Left
                        this.dialog.activeSource.selectPrevNavigationItem();
                        return cancelEvent(e);
                    }
                    if (e.keyCode === 39) { // Right
                        this.dialog.activeSource.selectNextNavigationItem();
                        return cancelEvent(e);
                    }
                }
            }

            if (isCommandKeyPressed && e.keyCode === 32) { // Ctrl + Space
                this.dialog.focusInput();
                return cancelEvent(e);
            }
        }

        // else {
        //     // this.dialog is Hidden
        //     if (isCommandKeyPressed && e.keyCode === 32) { // Ctrl + Space
        //         if (this.dataFromSite &&
        //             $(this.dataFromSite.attachBlockSelector).length)
        //             this.showDialogForSite();
        //         else
        //             this._showDialogForCurrentSelection(null, true);
        //         return cancelEvent(e);
        //     }
        // }
    }

    //***** PUBLIC ********************************************************************************************************

    showDialogForSite(word) {
        this.dialog.showForSite(this.dataFromSite.langPair,
            this.dataFromSite.attachBlockSelector,
            word,
            this.dataFromSite.bookId);
    }

    initSiteDialog(langPair, attachBlockSelector, bookId) {
        let self = this;
        this.dataFromSite = {
            langPair: langPair,
            attachBlockSelector: attachBlockSelector,
            bookId: bookId
        };
        let attachBlockEl = $(attachBlockSelector);
        attachBlockEl.on('submit', function(event) {
            self.showDialogForSite(attachBlockEl.find('input').val());
            return false;
        });
    }
}