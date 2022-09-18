'use strict';
import StringHelper from 'string-helper';

export default class DictionaryProvider {
    constructor(config) {
        this.config = config;
    }

    getCards(requestData) {		
        let cardPromises = {};
        let promise = this.requestTranslationsData(requestData);
        this.config.contentTypes.forEach((contentType) => {
            cardPromises[contentType] = promise;
        });
        return cardPromises;
	}

    handleErrors(response) {
        if (!response.ok) {
            return Promise.reject(`Error occured while loading data (${response.status})`)
        }
        return response;
    }

    getJson(url){
        return fetch(url,{
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(this.handleErrors)
        .then((response)=>response.json())
    }

    getHtml(url){
        return fetch(url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(this.handleErrors)
        .then((response)=>response.text())
    }

    postRequest(url, body){
        return fetch(url, {
            method: 'POST',
            body: body?JSON.stringify(body):''
        }).then(this.handleErrors)
    }

    checkIfContentTypeSupported(contentType) {
        if (this.config.contentTypes.indexOf(contentType) === -1)
            throw new Error("Content type " + contentType + ' not supported.');
    }

    rejectWithStatusCode(reject, xhr) {
        let statusText = xhr.statusText || 'error';
        reject(statusText + '. Status(' + xhr.status + ')');
    }

    rejectWithResponseText(reject, xhr) {
        switch (xhr.status) {
            case 500:
            case 0:
                this.rejectWithStatusCode(reject, xhr);
                break;
            default:
                if(xhr.responseText){
                    reject(xhr.responseText);
                }else{
                    this.rejectWithStatusCode(reject, xhr);
                }
                break;
        }
    }

    formatRequestUrl(url, data) {
        data = Object.create(data);
        let sourceLang = this.config.languages[data.sourceLang];
        let targetLang = this.config.languages[data.targetLang];
        data.sourceLangId = sourceLang && sourceLang.id;
        data.targetLangId = targetLang && targetLang.id;
        return StringHelper.format(url, data);
    }

    requestPage(urlTemplate, requestData) {
        let translateUrl = this.formatRequestUrl(urlTemplate, requestData);
        return this.getHtml(translateUrl)
    }
}