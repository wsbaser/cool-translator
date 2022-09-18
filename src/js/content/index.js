'use strict';

import '../services/google/styles.sass';
import '../services/linguee/styles.sass';
import '../services/ll/styles.sass';
import '../services/multitran/styles.sass';
import '../services/tfd/styles.sass';
import '../services/fc/styles.sass';

import CTContent from './ct-content';

import LingueeHandlers from '../services/linguee/handlers';
import LLHandlers from '../services/ll/handlers';
import TFDHandlers from '../services/tfd/handlers';
import CommonHandlers from '../services/common/handlers';

import injectJQueryPlugins from 'jquery-plugins';

injectJQueryPlugins();
fetch("https://example.com").then((result)=>{
    console.log(result)
})

window.lingueeHandlers = new LingueeHandlers();
window.llHandlers = new LLHandlers();
window.tfdHandlers = new TFDHandlers();
window.commonHandlers = new CommonHandlers();

window.ctContent = new CTContent();
window.ctContent.init();