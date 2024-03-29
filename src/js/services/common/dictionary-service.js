'use strict';
import StringHelper from 'string-helper';

export default class DictionaryService {
	constructor(config, connection){
	    this.config = config;
	    this.connection = connection;
		this.requestCache = {};
		this.cacheResponseData = false;
		this.singleCacheObject = false;
	}

	makeCall(method, params, callback){
		this.connection.makeRequest(this.config.id, method, params, callback);
	}

	getCards(requestData, callback){
    	this.makeCall('getCards', [requestData], function(cardPromises) {
			const callbackPromises={}
            $.each(cardPromises, (contentType, promise)=>{
				let deferred = $.Deferred();
                callbackPromises[contentType] = deferred.promise();
                promise.done((data)=>{
						var card = this.generateCard(contentType, data);
						this.saveToCache(requestData, contentType, this.cacheResponseData ? data : card);
						deferred.resolve({
							inputData: requestData,
							cards: card,
							prompts: this.generatePrompts(contentType, data),
							metadata: this.getMetadata(requestData)
						});
                    })
                    .fail((error)=>{
						deferred.reject({
							inputData: requestData,
							error: error
						});
                    });
            });
			callback(callbackPromises)
        }.bind(this));
	}

	getCardHash(requestData, contentType) {
		var hash = '';
		for (var key in requestData) {
			hash += key + ':' + requestData[key] + ',';
		}
		contentType = this.singleCacheObject ? '' : contentType;
		return contentType + ':' + hash.substr(0, hash.length - 1);
	}

	getCachedCard(requestData, contentType) {
		var hash = this.getCardHash(requestData, contentType);
		return this.requestCache[hash];
	}

	saveToCache(requestData, contentType, card) {
		var requestHash = this.getCardHash(requestData, contentType);
		this.requestCache[requestHash] = card;
	}

	getRootEl(html, rootSelector){
		const rootEl = $(html).find(rootSelector)
		rootEl.find('img').each(function(i, itemEl){
            itemEl = $(itemEl);
            let src = itemEl.attr('src');
            if(src.startsWith('//')){
                itemEl.attr('src', 'https:' + src);
            }else if(src.startsWith('http')){
                itemEl.attr('src', 'https' + src.slice(4));
            }
        });
		return rootEl;
	}

	generateCard(contentType, data) {
		var methodName = 'generate' + StringHelper.capitalizeFirstLetter(contentType) + 'Card';
		var method = this[methodName];
		if (method == null)
			throw new Error('Content type not supported');
		return this[methodName](data);
	}

	getMetadata(inputData){
		return {
			soundUrls: this.getSoundUrls(inputData)
		};
	}

	/* If service did not recognized word it can provide prompts with similar words */
	generatePrompts(contentType, data) {
		var methodName = 'generate' + StringHelper.capitalizeFirstLetter(contentType) + 'Prompts';
		var method = this[methodName];
		if (this[methodName] == null)
			return null;
		return this[methodName](data);
	}

	getCachedCards(requestData) {
		if (this.singleCacheObject)
			return this.getCachedCard(requestData);
		else {
			var self = this;
			var cards = {};
			$.each(this.config.contentTypes, function(i, contentType) {
				cards[contentType] = self.getCachedCard(requestData, contentType);
			});
			return cards;
		}
	}

	/* HELPERS */

	makeStylesImportant(rootEl, selector) {
		rootEl.find(selector).each(function(i, itemEl) {
			var itemStyle = itemEl.style;
			for (var key in itemStyle) {
				if (itemStyle.hasOwnProperty(key) && itemStyle[key]) {
					itemStyle.setProperty(key, itemStyle[key], "important");
				}
			}
		});
	}

	deactivateLinks(rootEl, selector) {
		rootEl.find(selector).each(function(i, itemEl) {
			itemEl = $(itemEl);
			itemEl.attr('href', 'javascript:void(0)');
		});
	}

	removeScripts(rootEl) {
		rootEl.find('script').each(function(i, itemEl) {
			$(itemEl).remove();
		});
	}

	addTranslateContentEvent(rootEl, selector) {
		rootEl.find(selector).each(function(i, itemEl) {
			this.addEventData($(itemEl), 'click', 'commonHandlers.show_dialog_for_content', 'this');
		}.bind(this));
	}

	set1pxAsSrc(rootEl, className) {
		rootEl.find('.' + className).each(function(i, el) {
			$(el).attr('src', "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=");
		});
	}

	addEventData(el, event, method, params) {
		var eventParams = Array.prototype.slice.call(arguments, 1, arguments.length);
		el.attr('data-event', eventParams.join('|'))
	}

	/* GET DATA FUNCTIONS */

	getPronunciation(inputData) {
		return null;
	}

	getSoundUrls(inputData) {
		return [];
	}

	getPictureUrls(inputData) {
		return [];
	}

	getTranslations(inputData) {
		return null;
	}
}