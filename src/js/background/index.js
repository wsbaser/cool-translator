'use strict';

import CTBackground from './ct-background';
import guid from 'guid';
import injectJQueryPlugins from 'jquery-plugins';
console.log($)
//injectJQueryPlugins();

// $.ajaxSetup({
//     headers: {"X-Requested-With":"XMLHttpRequest"}
// });

const ctBackground = new CTBackground();
ctBackground.run();