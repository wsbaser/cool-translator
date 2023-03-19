'use strict';

import MessageTypes from '../message-types';


const LANG_PAIR_STORAGE_KEY = 'langpair'
const defaultLangPair={
    sourceLang: chrome.i18n.getUILanguage()==='en'?'es':'en',
    targetLang: chrome.i18n.getUILanguage()
};

export default class ExtensionContentServer{
    _loadLangPair(callback){          
        chrome.storage.local.get([LANG_PAIR_STORAGE_KEY]).then((result) => {
            console.log("Value currently is ", result[LANG_PAIR_STORAGE_KEY]);
            const langPair = result[LANG_PAIR_STORAGE_KEY]??defaultLangPair            
            callback(langPair)
        });
        // let langPair = null;
        // // if (localStorage.langPair){
        // //     try{
        // //         let obj = JSON.parse(localStorage.langPair)
        // //         if(obj.sourceLang && obj.targetLang)
        // //             langPair = obj;
        // //     }
        // //     catch(e){
        // //     }
        // // }
        // return langPair ||
        //     {
        //         sourceLang: chrome.i18n.getUILanguage()==='en'?'es':'en',
        //         targetLang: 'ru'//chrome.i18n.getUILanguage()
        //     };
    }

    _saveLangPair(langPair){
        const objToStore = {}
        objToStore[LANG_PAIR_STORAGE_KEY] = langPair
        chrome.storage.local.set(objToStore).then(() => {
            console.log("Set lang pair to", langPair);
        });
    }

    _onMessage(message, sender, callback){
        switch(message.type){
            case MessageTypes.LoadInitializationData:
                this._loadLangPair((langPair)=>{
                    callback({
                        langPair
                    });    
                })
                break;
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