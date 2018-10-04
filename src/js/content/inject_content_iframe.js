'use strict';

import 'content-iframe.sass';

let url    = decodeURIComponent('chrome-extension://' + EXTENSION_ID + '/content_iframe.html');
let iframe = document.createElement('iframe');
iframe.src = url;
iframe.id="ctr";
document.body.appendChild(iframe);