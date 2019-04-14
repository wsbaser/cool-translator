'use strict';

import ContentTypes from '../common/content-types';

const rootDir = 'cooltranslator/js/freecollocation/';

export default {
    id: "fc",
    name: "FreeCollocation.com",
    languages: {
        en: {
            id: 'en',
            targets: ['es', 'pt', 'fr', 'it', 'de', 'ru', 'ar', 'pl']
        }
    },
    priority: 8,
    domain: "http://www.freecollocation.com/",
    path: {
        templatesDir: rootDir
    },
    ajax: {
        translate: "http://www.freecollocation.com/search?word={word}"
    },
    contentTypes: [ContentTypes.COLLOCATIONS]
}