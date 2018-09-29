'use strict';

import 'common.sass';
import 'popup.sass';

import DEPopup from './de-popup';
import injectJQueryPlugins from 'jquery-plugins';

injectJQueryPlugins();

window.onload = function() {
    let dePopup = new DEPopup();
    let bgWindow = chrome.extension.getBackgroundPage();
    dePopup.show(bgWindow.ctBackground.serviceProvider.cv.user);
};