'use strict';

import DictionaryProvider from '../common/dictionary-provider';

export default class LLProvider extends DictionaryProvider {
    constructor(config){
        super(config);
    }

    _isTextTooLong(text) {
        return text.replace(/ |\t|\r|\n/igm, '').length > this.config.maxTextLengthToTranslate;
    }

    requestTranslationsData(requestData) {
        return new Promise((resolve, reject)=>{
            if (this._isTextTooLong(requestData.word))
                reject('Text too long.');
            else {
                let translateUrl = this.config.api + this.config.ajax.getTranslations;
                this.postRequest(translateUrl, {
                    word: requestData.word,
                    include_media: 1,
                    add_word_forms: 1,
                    port: this.config.serverPort
                }).then(function(response) {
                    const data = response.json()
                    if (data.error_msg){
                        reject(data.error_msg);
                    }
                    else{
                        resolve({
                            ...data,
                            inputData: requestData,
                            inDictionary: null //result.is_user, //todo: fix this later
                        });
                    }
                }).catch(function(jqXHR) {
                    this.rejectWithStatusCode(deferred, jqXHR);
                });
            }
        })
    }

    //adds new translation when user clicks on translateion or enters custom translation
    addTranslation(originalText, translatedText) {
        return new Promise((resolve, reject)=>{
            this.postRequest(this.config.api + this.config.ajax.addWordToDict, {
                word: originalText,
                tword: translatedText,
                context: '',
                context_url: '',
                context_title: ''
            }).then(function(data) {
                if (data && data.error_msg) {
                    if (this._isNotAuthenticatedError(data))
                        reject({
                            notAuthenticated: true
                        });
                    else
                        reject(data.error_msg);
                } else{
                    resolve(data);
                }
            }).catch(function(jqXHR) {
                this.rejectWithStatusCode(reject, jqXHR);
            });    
        })
    }

    _isNotAuthenticatedError(result) {
        return result && result.error_code === 401;
    }

    checkAuthentication() {
        let jqXHR = this.postRequest(this.config.api + this.config.ajax.isAuthenticated);
        jqXHR.done(function(data) {
            console.log(data);
        });
        return jqXHR;
    }

    login(username, pass) {
        return new Promise((resolve, reject)=>{
            this.postRequest(this.config.ajax.login, {
                email: username,
                password: pass
            }).then(function(data) {
                if (data.error_msg){
                    reject(data.error_msg);
                }
                else{
                    resolve(data);
                }
            }).catch(function(jqXHR) {
                this.rejectWithStatusCode(reject, jqXHR);
            });    
        })
    }
}