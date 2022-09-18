'use strict';
import StringHelper from 'string-helper';

export default class DictionaryProvider {
    constructor(config) {
        this.config = config;
    }

    getCards(requestData) {		
        let cardPromises = {};
        let promise = this.requestTranslationsData(requestData);
        $.each(this.config.contentTypes, function(i, contentType) {
            cardPromises[contentType] = promise;
        });
        return cardPromises;
	}

    handleErrors(response) {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response;
    }

    getRequest(url){
        return fetch(url).then(handleErrors)
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

    resolveWithJQueryElement(resolve, data, selector) {
        let $element = $(data).find(selector);
        $element.find('img').each(function(i, itemEl){
            itemEl = $(itemEl);
            let src = itemEl.attr('src');
            if(src.startsWith('//')){
                itemEl.attr('src', 'https:' + src);
            }else if(src.startsWith('http')){
                itemEl.attr('src', 'https' + src.slice(4));
            }
        });
        resolve($element);
    }

    formatRequestUrl(url, data) {
        data = Object.create(data);
        let sourceLang = this.config.languages[data.sourceLang];
        let targetLang = this.config.languages[data.targetLang];
        data.sourceLangId = sourceLang && sourceLang.id;
        data.targetLangId = targetLang && targetLang.id;
        return StringHelper.format(url, data);
    }

    requestPage(urlTemplate, requestData, responseSelector) {
        return new Promise((resolve, reject)=>{
            let translateUrl = this.formatRequestUrl(urlTemplate, requestData);
            let xhr = new XMLHttpRequest();
            xhr.open('GET', translateUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send();
            xhr.onreadystatechange = function() {
                if (xhr.readyState != 4) return;
                if (xhr.status != 200) {
                    this.rejectWithStatusCode(reject, xhr);
                } else {
                    this.resolveWithJQueryElement(resolve, xhr.responseText, responseSelector);
                }
            }    
        })
    }

    getRequestName(contentType) {
        throw new Error('Not implemented');
    }
}