'use strict';

import 'translation-dialog.sass';

import WordMetadata from './word-metadata';
import LangSelector from './language-selector';
import LangSwitcher from './language-switcher';
import LoginForm from './login-form';
import SelectBook from './select-book';
import NotificationPopup from './notification-popup';
import Vocabulary from '../services/vocabulary';
import AddTranslation from './add-translation';
import Reactor from 'reactor';
import SelectionHelper from 'selection-helper';
import StringHelper from 'string-helper';

const ACTIVE_CLASS = 'ctr-active';

const TEMPLATE =
  '<div id="ctr_dialog">\
    <div id="ctr_header">\
        <div id="ctr_header_bg"></div>\
        <div class="ctr_header_buttons" style="display:none !important">\
          <span id="ctr_info">Press F1 to see hot keys</span>\
          <span id="ctr_settings_icon"/>\
          <span id="ctr_closeBtn" title="Close (Esc)">Esc</span>\
        </div>\
        <form id="ctr_wordInputForm">\
            <div id="sourceLangSelector"></div>\
            <input type="text" id="ctr_wordInput" maxlength="255" value="" placeholder="Type word for translation" autocomplete="off" class="ctr-input">\
            <div id="wordMetadata"></div>\
            <div id="targetLangSelector"></div>\
        </form>\
        <div id="ctr_sources"></div>\
        <div class="ctr_hSplitter"></div>\
    </div>\
    <div style="position:relative !important;">\
        <div class="popover-container" style="display:none !important;">\
        </div>\
        <div id="ctr_source_content"></div>\
    </div>\
    <div id="ctr_notification">\
        <div class="ctr-ntfTitle"></div>\
        <div class="ctr-ntfBody"></div>\
    </div>\
</div>';

export default class TranslationDialog {
  constructor(allSources, vocabulary, langDetector) {
    var self = this;
    this.allSources = allSources;
    this.vocabulary = vocabulary;
    this.langDetector = langDetector;
    this.sourceLangSelector = null;
    this.targetLangSelector = null;
    this.langSwitcher = null;
    this.allSupportedLangs = this._getAllSupportedLangs(allSources);
    this.detectedLanguages = {};

    this.el = null;
    this.headerEl = null;
    this.navigationEl = null;
    this.sourceContentEl = null;
    this.notificationEl = null;

    this.sources = null;
    this.activeSource = null;
    this.sourceWithActiveLink = null;
    this.lastRequestData = null;
    this.loginForm = null;
    this.selectionBackup = null;
    this.firstShow = true;
    this.isActive = false;

    this.reactor = new Reactor();
    this.reactor.registerEvent(TranslationDialog.LANG_PAIR_CHANGED);
    this.reactor.registerEvent(TranslationDialog.ON_HIDDEN);

    /* BIND EVENTS */

    this.vocabulary.addEventListener(Vocabulary.CHECK_AUTH_END, this._onCheckAuthEnd.bind(this));
    function bindMetadataReceivedEvent(source){
      source.addMetadataReceivedListener(self.showMetadata.bind(self));
    }
    function bindAddTranslationEvents(tab){
      if(tab.addTranslation){
        tab.addTranslation.addEventListener(AddTranslation.SHOW_LOGIN, self.showLoginForm.bind(self));
        tab.addTranslation.addEventListener(AddTranslation.SHOW_SELECT_BOOK, self.showSelectBook.bind(self));
        tab.addTranslation.addEventListener(AddTranslation.SHOW_NOTIFICATION, self.showNotification.bind(self));
        tab.addTranslation.addEventListener(AddTranslation.SHOW_ERROR, self.showError.bind(self));
      }
    }
    for(var id in this.allSources){
      bindMetadataReceivedEvent(this.allSources[id]);
      this.allSources[id].tabs.forEach(bindAddTranslationEvents);
    }
  }
  //***** STATIC ****************************************************************************************************

  static get LANG_PAIR_CHANGED(){
      return 'langPairChanged';
  }

  static get ON_HIDDEN(){
      return 'onhide';
  }

  //*****************************************************************************************************************
  
  _onCheckAuthEnd(){
    if(this.vocabulary.user){
      this.hideLoginForm();
    }
  }

  _getAllSupportedLangs(allSources) {
    let langs = [];
    $.each(allSources, function(i, source) {
      for (let lang in source.config.languages) {
        if (langs.indexOf(lang) === -1)
          langs.push(lang);
      }
    });
    return langs;
  }

  _selectNeighbourSource(right) {
    if (!this.activeSource)
      return; // no sources to select
    let index = this.sources.indexOf(this.sourceWithActiveLink);
    index = right ?
      (index + 1) % this.sources.length :
      (index || this.sources.length) - 1;

    // . activate new source link
    this._activateSourceLink(this.sources[index]);
  }

  _activateSourceLink(source) {
    $.each(this.headerEl.find('.ctr-source-link'),
      function(i, itemEl) {
        source && itemEl === source.linkEl[0] ?
          source.linkEl.addClass(ACTIVE_CLASS) :
          $(itemEl).removeClass(ACTIVE_CLASS);
      });
    this.sourceWithActiveLink = source;
  }

  _activateSource(source) {
    // . deactivate old source link
    this._activateSourceLink(source);
    // . show new source content
    this._showSourceContent(source);
    // . activate new source link
    this.activeSource = source;
  }

  _showSourceContent(source) {
    if (this.activeSource)
      this.activeSource.hide();
    if (source)
      source.show();
  }


  _isInputDataEqual(data1, data2) {
    data1 = data1 || {};
    data2 = data2 || {};
    return data1.word == data2.word &&
        data1.sourceLang == data2.sourceLang &&
        data1.targetLang == data2.targetLang;
}

  /*
   * @param force - update even if data has not changed
   * */
  _updateSourcesContent(force) {
    if (!this.isActive)
      return;
    let self = this;
    // . do not update content if data not changed and current tab is loading
    let inputData = this.getInputData();
    if (!inputData.word)
      return;
    if (this._isInputDataEqual(inputData, this.lastRequestData) && !force)
      return;
    this.hideLoginForm();
    this.lastRequestData = inputData;

    if (this.isExtension) {
       self._detectLanguageAndLoadAll(inputData);
    } else {
      self._loadAll(inputData);
    }

    // . but show only active
    this.blurInput();
  }

  _showLoadingForAll(inputData) {
    // . load data for all sources simultaneously
    $.each(this.sources, function(key, source) {
      source.showTabsLoading(inputData);
    });
  }

  _detectLanguageAndLoadAll(inputData) {
    let self = this;
    var languages = this._getDetectedLanguages(inputData, function(languages) {
      languages = self._filterSupportedLanguages(languages);
      if(!self.setDetectedLangPair(inputData, languages)){
        self._loadAll(inputData);
      }
    });
  }

  _filterSupportedLanguages(languages){
    if(languages){
      return languages.filter(l=> this.allSupportedLangs.indexOf(l)!==-1); 
    }
  }

  _getDetectedLanguages(inputData, callback){
    var self = this;
    var languages = this.detectedLanguages[inputData.word];
    if(languages){
      callback(languages);
    }
    else{
      // . detect language
      this._showLoadingForAll(inputData);
      this.langDetector.detect(inputData.word, function(promise) {
        promise.done(function(languages){
          if(languages && languages.length){
            self.detectedLanguages[inputData.word] = languages;
            callback(languages);
          }
          else{
            callback();
          }
        }).fail(function() {
          callback()
        });
      });
    }
  }

  setDetectedLangPair(inputData, languages){
    if (languages && languages.length && languages.indexOf(inputData.sourceLang) == -1) {
      // . languages detected and sourceLang is WRONG
      if (languages.indexOf(inputData.targetLang) !== -1) {
        // . SWITCH languages
        this.langSwitcher.switch();
        return true;
      }

      // // . languages detected and sourceLang is WRONG
      // if (languages.indexOf(inputData.targetLang) !== -1) {
      //   // . SWITCH languages
      //   this.langSwitcher.switch();
      //   return true;
      // } else {
      //   // . sourceLang and targetLang are WRONG
      //   if(languages.length===1){
      //     // . sourceLang is NOT AMBIGUOUS
      //     var langPair = this.createLangPair(languages[0], 'ru'); //window.navigator.language);
      //     this.setLangPair(langPair);
      //     return true;
      //   }
      //   else{
      //     // . sourceLang is AMBIGUOUS
      //     //   user should select correct source language
      //     this._showDetectedLanguages(languages);
      //   }
      // }
    }
    return false;
  }

  _showDetectedLanguages(languages) {
    // . NOT IMPLEMENTED
  }

  _loadAll(inputData) {
    // . load data for all sources simultaneously
    $.each(this.sources, function(key, source) {
      source.loadAndShow(inputData);
    });
  }

  // Show only sources which support selected languages pair
  _updateSourcesList() {
    let self = this;
    let lp = this.getLangPair();
    // . filter sources for current language pair
    this.sources = [];
    $.each(this.allSources, function(id, source) {
      if (source.supportsLanguagePair(lp))
        self.sources.push(source);
    });
    // . generate source links
    this.sourceLinksEl.empty();
    $(this.sources).each(function(i, source) {
      source.linkEl = $('<a/>', {
        id: source.linkId(),
        'class': 'ctr-source-link',
        'title': source.config.name,
        html: '<span class="ctr-source-icon"/>'
      });
      source.linkEl.data('sourceId', source.config.id);
      self.sourceLinksEl.append(source.linkEl);
      source.linkEl.on('click', self._onSelectSource.bind(self));
    });
    if (!this.sourceWithActiveLink || !this.sourceWithActiveLink.supportsLanguagePair(lp))
      this._activateSourceLink(this.sources[0]);
  }

  _appendSourcesContent() {
    $.each(this.allSources, function(id, source) {
      source.hide();
      this.sourceContentEl.append(source.rootEl);
    }.bind(this));
  }

  // Create and Show dialog
  _create() {
    if (this.el) {
      return;
    }
    // . create element from HTML and add to DOM
    let ctrRootEl = $('<div id="ctr_root"/>');
    ctrRootEl.append(TEMPLATE);
    $('body').append(ctrRootEl);
    // . retrieve links to DOM elements
    this.el = $('#ctr_dialog');
    this.sourceLinksEl = $('#ctr_sources');
    this.sourceContentEl = $('#ctr_source_content');
    this.headerEl = $('#ctr_header');
    this.notificationPopup = new NotificationPopup('#ctr_notification');
    this.loginForm = new LoginForm('.popover-container');
    this.selectBook = new SelectBook('.popover-container');
    this.inputFormEl = $('#ctr_wordInputForm');
    this.inputEl = $('#ctr_wordInput');
    this.inputEl.bind('focus', this._onFocusInput.bind(this));
    this.inputFormEl.bind('submit', this._submitInputData.bind(this));
    $('#ctr_closeBtn').bind('click', this.hide);
    //$('#ctr_settings_icon').bind('click', this.openSettings);
    $('#ctr_header_bg').show();
    $('#ctr_header_buttons').show();

    this._initLangSelectors();
    this._initWordMetadata();
    this._appendSourcesContent();
    this._updateSourcesList();
    this.activateSourceWithActiveLink();
    if (this.langPair) {
      this.setLangPair(this.langPair);
    }
    //$(window).on('resize', this.hide.bind(this));
    document.addEventListener('mousedown', this._onMouseDown.bind(this));
  }

  _setLangDirection() {
    if (this.inputEl) {
      let langPair = this.getLangPair();
      let RTL_LANGUAGES = [];
      if (RTL_LANGUAGES.indexOf(langPair.sourceLang) !== -1) {
        this.inputEl.addClass('rtl');
      } else {
        this.inputEl.removeClass('rtl');
      }
    }
  }

  _initWordMetadata(){
    this.wordMetadata = new WordMetadata('#wordMetadata');
  }

  _initLangSelectors() {
    // .initialize Lang Selectors
    let self = this;
    let options = {
      onLangChange: self._updateSourcesList.bind(self),
      onLangAccepted: function() {
        self.activateSourceWithActiveLink();
        self._updateSourcesContent();
        self._setLangDirection();
        self.reactor.dispatchEvent(TranslationDialog.LANG_PAIR_CHANGED, self.getLangPair());
      },
      onLoseFocus: self.focusInput.bind(self)
    };
    this.sourceLangSelector = new LangSelector('#sourceLangSelector', this.allSupportedLangs, this, options);
    this.targetLangSelector = new LangSelector('#targetLangSelector', this.allSupportedLangs, this, options);
    this.langSwitcher = new LangSwitcher(this.sourceLangSelector, this.targetLangSelector);
  }

  show(word) {
    // this.vocabulary.checkAuthentication();
    if (!this.isActive) {
      this.el.removeClass('ctr-hide');
      this.el.addClass('ctr-show');
      this.isActive = true;
    }
    if (word)
      this.inputEl.val(word);
    else
      this.focusInput();
    this._setLangDirection();
    this.languageDetectionInProgress = false;
    this._updateSourcesContent();
  };

  hide() {
    let self = this;
    if (this.isActive) {
      this.hideLoginForm();
      this.hideSelectBook();
      this.wordMetadata.hide();
      this.el.removeClass('ctr-show');
      this.el.addClass('ctr-hide');

      if (this.selectionBackup) {
        var word = this.inputEl.val();
        setTimeout(function(){
          if(!self.isActive){
            SelectionHelper.restoreSelection(self.selectionBackup); 
            self.selectionBackup = null;
          }
        },777);
      }
      this.inputEl.val('');
      // . clean up content
      this.lastRequestData = null;
      $.each(this.allSources, function(id, source) {
        source.clear();
      });
      this.isActive = false;
      setTimeout(function(){
        self.reactor.dispatchEvent(TranslationDialog.ON_HIDDEN);
      }, 300);

      return true;
    }
    return false;
  }

  _attach() {
    if(this.attachBlockEl.is(":visible")){
      this.attachBlockEl[0].scrollIntoViewIfNeeded();
      let l, t;
      // .attach to element bottom
      let GAP = 2;
      let rect = this.attachBlockEl[0].getBoundingClientRect();
      t = window.scrollY + rect.top + this.attachBlockEl[0].offsetHeight + GAP;
      l = window.scrollX + rect.left;
      this.el[0].style.setProperty('width', this.attachBlockEl[0].offsetWidth + 'px', 'important');
      this.el[0].style.setProperty('left', l + 'px', 'important');
      this.el[0].style.setProperty('top', t + 'px', 'important');
    }
  }

  _submitInputData() {
    this._updateSourcesContent(true);
    return false;
  }


  //***** HANDLERS ****************************************************************************************************

  _onSelectSource(e) {
    let linkEl = e.target.closest('a');
    let targetSourceId = $.data(linkEl, 'sourceId');
    if (targetSourceId === this.activeSource.config.id)
      return; // source is already displayed
    this._activateSource(this.allSources[targetSourceId])
  };


  _onMouseDown(e) {
    if (!this.isActive ||
      $.contains(this.el[0], e.target) ||
      (!this.isExtension && $.contains(this.attachBlockEl[0], e.target)))
      return;
    this.hide();
    //e.preventDefault();
    //return false;
  }

  _onFocusInput(){
    if(this.wordMetadata){
      this.wordMetadata.hide();
    }
    return false;
  }

  //***** PUBLIC ******************************************************************************************************

  showForExtension(word) {
    this._create();
    this.el[0].removeAttribute('style');
    this.el.removeClass('ctr-site');
    this.el.addClass('ctr-extension');
    this.inputFormEl.showImportant();
    this.isExtension = true;
    this.selectionBackup = SelectionHelper.saveSelection();
    this.show(word);
  }

  showForSite(langPair, attachBlockSelector, word, bookId, user) {
    this._create();
    this.setLangPair(langPair);
    this.attachBlockEl = $(attachBlockSelector);
    this.vocabulary.setBook(bookId, true);
    this.inputEl = this.attachBlockEl.find('input');
    this._attach();
    this.el.removeClass('ctr-extension');
    this.el.addClass('ctr-site');
    this.inputFormEl.hideImportant();
    this.isExtension = false;
    this.show(word);
  }

  setLangPair(langPair) {
    this.langPair = langPair;
    if (this.el) {
      this.sourceLangSelector.setSelectedLang(this.langPair.sourceLang, null, true);
      this.targetLangSelector.setSelectedLang(this.langPair.targetLang);
    }
  }

  getLangPair() {
    return this.createLangPair(this.sourceLangSelector.getSelectedLang(),this.targetLangSelector.getSelectedLang());
  }

  createLangPair(sourceLang, targetLang){
    return {
      sourceLang,
      targetLang
    }
  }

  selectNextSource() {
    this._selectNeighbourSource(true);
  }

  selectPrevSource() {
    this._selectNeighbourSource(false);
  }

  getInputData() {
    let lp = this.getLangPair();
    return {
      word: StringHelper.trimText(this.inputEl.val()),
      sourceLang: lp.sourceLang,
      targetLang: lp.targetLang
    };
  }

  showError(bodyHtml) {
    this.notificationPopup.showError(bodyHtml);
  }

  showNotification(title, bodyHtml) {
    this.notificationPopup.show(title, bodyHtml);
  }

  showLoginForm(loginCallback) {
    this.loginForm.show(this.vocabulary, loginCallback);
  }

  hideLoginForm() {
    this.loginForm.hide();
  }

  showSelectBook(inputData, translation, callback) {
    let self = this;
    if (this.vocabulary.bookRemembered) {
      callback();
    } else {
      function canBeUpdated(book) {
        return book.userId === book.authorId;
      }
      var languageData = this.vocabulary.user.languagesData[inputData.sourceLang]; 
      let books = languageData.books.filter(function(item) {
        return canBeUpdated(item);
      });
      if (books.length) {
        this.selectBook.show(books, inputData.word, translation, this._getMaxPopoverHeight(), function(bookId, remember) {
          self.vocabulary.setBook(bookId, remember);
          self.hideSelectBook();
          callback();
        });
      } else {
        callback();
      }
    }
  }

  _measureInputText() {
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    var txtWidth = ctx.measureText(this.inputEl.val()).width;

    return txtWidth;
  }

  showMetadata(inputData, metadata){
    if(!this.wordMetadata.isVisible()){
      this.wordMetadata.show(inputData, this._measureInputText());
    }
    else if(!this.wordMetadata.isInputDataEqual(inputData)){
      // .invalid input data
      return;
    }
    this.wordMetadata.addMetadata(metadata);
  }

  _getMaxPopoverHeight(){
    return this.el.height() - this.headerEl.height() - 80;
  }

  hideSelectBook() {
    this.selectBook.hide();
  }

  isInputFocused() {
    return document.activeElement === this.inputEl[0];
  }

  focusInput() {
    setTimeout(function(){
      this.inputEl.select();
      this.inputEl.focus();
    }.bind(this),100);
  }

  blurInput() {
    this.inputEl.blur();
  }


  addLangPairChangedListener(callback) {
    this.reactor.addEventListener(TranslationDialog.LANG_PAIR_CHANGED, callback);
  }

  addOnHiddenListener(callback) {
    this.reactor.addEventListener(TranslationDialog.ON_HIDDEN, callback);
  }


  activateSourceWithActiveLink() {
    this._activateSource(this.sourceWithActiveLink);
  }
}