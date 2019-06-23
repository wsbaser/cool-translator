'use strict';

import 'word-metadata.sass';

const TEMPLATE =
    '<span class="dictionary-form"></span>\
     <span class="word-sound"><i class="play"></i></span>\
     <span class="possible-languages"></span>';

export default class WordMetadata{
    constructor(rootSelector) {
        this.rootSelector = rootSelector;
        _createEl();
    }

    _createEl() {
        this.el = $(this.rootSelector);
        this.el.html(TEMPLATE);

        this.dictionaryFormEl = this.el.find('.dictionary-form');
        this.wordSoundEl = this.el.find('.word-sound');
        this.possibleLanguagesEl = this.el.find('.possible-languages');
    }

    _isInputDataEqual(data1, data2) {
        data1 = data1 || {};
        data2 = data2 || {};
        return data1.word == data2.word &&
            data1.sourceLang == data2.sourceLang &&
            data1.targetLang == data2.targetLang;
    }

    _setPosition(){

    }

    /***** PUBLIC *********************************************************************************************************/

    show(inputData, position){
        this.inputData = inputData;
        this.soundUrls=[];
        this.dictionaryForm=null;
        this.possibleLanguages = [];
        this._setPosition();
        this.el.show();
    }

    isInputDataEqual(inputData){
        return _isInputDataEqual(this.inputData, inputData);
    }

    addMetadata(metadata){
        if(metadata.soundUrls){
            if(this.soundUrls.length){

            }else{
               var newSoundUrls = metadata.soundUrls.filter(url=>this.soundUrls.indexOf(url)==-1);
               this.soundUrls= this.soundUrls.concat(newSoundUrls);
            }
        }
    }

    hide(){
        this.inputData=null;
        this.el.hide();
    }
}