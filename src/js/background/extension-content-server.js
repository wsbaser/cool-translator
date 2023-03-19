'use strict';

import MessageTypes from '../message-types';


const LANG_PAIR_STORAGE_KEY = 'langPair'
const defaultLangPair={
    sourceLang: chrome.i18n.getUILanguage()==='en'?'es':'en',
    targetLang: chrome.i18n.getUILanguage()==='en'?'en':'es'
};

export default class ExtensionContentServer{
    _loadLangPair(callback){          
        chrome.storage.local.get([LANG_PAIR_STORAGE_KEY]).then((result) => {
            const langPair = result[LANG_PAIR_STORAGE_KEY]??defaultLangPair
            callback({langPair})
        });
    }

    _saveLangPair(langPair){
        chrome.storage.local.set({[LANG_PAIR_STORAGE_KEY]:langPair})
    }

    _onMessage(message, sender, callback){
        switch(message.type){
            case MessageTypes.LoadInitializationData:
                this._loadLangPair(callback)
                return true
            case MessageTypes.SaveLangPair:
                this._saveLangPair(message.langPair)
                break;
            default:
                console.error('Unknown message type:' + message.type);
                break;
        }
    }

    listen(){
        chrome.runtime.onMessage.addListener(this._onMessage.bind(this));
    }
}