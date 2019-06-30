'use strict';

import 'word-metadata.sass';

const TEMPLATE =
    '<span class="dictionary-form" style="display:none !important"></span>\
     <span class="play-sound" style="display:none !important"></span>\
     <span class="possible-languages" style="display:none !important"></span>';

export default class WordMetadata{
    constructor(rootSelector) {
        this.rootSelector = rootSelector;
        this._createEl();
    }

    _createEl() {
        this.el = $(this.rootSelector);
        this.el.html(TEMPLATE);

        this.dictionaryFormEl = this.el.find('.dictionary-form');
        this.playSoundEl = this.el.find('.play-sound');
        this.possibleLanguagesEl = this.el.find('.possible-languages');

        this.playSoundEl.on('click', this.onPlaySoundClick.bind(this));
    }

    _isInputDataEqual(data1, data2) {
        data1 = data1 || {};
        data2 = data2 || {};
        return data1.word == data2.word &&
            data1.sourceLang == data2.sourceLang &&
            data1.targetLang == data2.targetLang;
    }

    _setPosition(position){
        this.el.css('left', position+75);
    }

    onPlaySoundClick(){
        let soundUrl = this.getNextSoundUrl();

        $("#audio-player").remove();
        $("body").prepend($("<audio id='audio-player'><source src='" + soundUrl + "' type='audio/mpeg'></audio>"));
        this.audioPlayer = $("#audio-player").get(0);
        this.audioPlayer.addEventListener('ended', this.audioPlayingDidFinish.bind(this));
        this.audioPlayer.addEventListener('playing', this.audioPlayingStarted.bind(this));
        this.audioPlayer.addEventListener('error', this.audioPlayingError.bind(this));
        this.audioPlayer.play();
    }

    audioPlayingStarted() {
        this.playSoundEl.addClass("playing");
    }
    
    audioPlayingDidFinish() {
        this.clearAudio(true);
    }
    
    audioPlayingError() {
        this.clearAudio(true);
    }

    clearAudio(){
        this.playSoundEl.removeClass("playing");
        $(this.audioPlayer).remove();
        this.audioPlayer = null ;
    }

    getNextSoundUrl(){
        let soundUrl = this.soundUrls[this.soundIndex];
        this.soundIndex = (this.soundIndex+1) % this.soundUrls.length;
        return soundUrl;
    }

    /***** PUBLIC *********************************************************************************************************/

    show(inputData, position){
        this.inputData = inputData;
        this.soundUrls=[];
        this.soundIndex=0;
        this.dictionaryForm=null;
        this.possibleLanguages = [];
        this._setPosition(position);
    }

    hide(){
        this.inputData=null;
        this.playSoundEl.hideImportant();
        this.dictionaryFormEl.hideImportant();
        this.possibleLanguagesEl.hideImportant();
    }

    isVisible(){
        return !!this.inputData;
    }

    isInputDataEqual(inputData){
        return this._isInputDataEqual(this.inputData, inputData);
    }

    addMetadata(metadata){
        this.addSounds(metadata.soundUrls);
        this.setDictionaryForm(metadata.dictionaryForm);
        this.setPossibleLanguages(metadata.possibleLanguages);
    }

    setDictionaryForm(){}

    setPossibleLanguages(){}

    addSounds(soundUrls){
        if(!soundUrls){
            return;
        }

        // .add sounds to the list
        var newSoundUrls = soundUrls.filter(url=>this.soundUrls.indexOf(url)==-1);
        this.soundUrls = this.soundUrls.concat(newSoundUrls);

        // .show Play button
        if(this.soundUrls.length){
            this.playSoundEl.showImportant();
        }
    }

}