'use strict';

import '../services/abby/styles.sass';
import '../services/google/styles.sass';
import '../services/linguee/styles.sass';
import '../services/ll/styles.sass';
import '../services/multitran/styles.sass';
import '../services/tfd/styles.sass';
import '../services/fc/styles.sass';


import CTContent from './ct-content';

import AbbyHandlers from '../services/abby/handlers';
import LingueeHandlers from '../services/linguee/handlers';
import LLHandlers from '../services/ll/handlers';
import TFDHandlers from '../services/tfd/handlers';
import CommonHandlers from '../services/common/handlers';

import injectJQueryPlugins from 'jquery-plugins';

injectJQueryPlugins();

window.abbyHandlers = new AbbyHandlers();
window.lingueeHandlers = new LingueeHandlers();
window.llHandlers = new LLHandlers();
window.tfdHandlers = new TFDHandlers();
window.commonHandlers = new CommonHandlers();

window.ctContent = new CTContent();
window.ctContent.init();