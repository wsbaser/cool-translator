'use strict';

import ContentTypes from '../common/content-types';

const rootDir = 'cooltranslator/js/thefreedictionary/';

export default {
    id: "tfd",
    name: "TheFreeDictionary.com",
    languages: {
        en: {
            id: 'en',
            targets: ['es', 'pt', 'fr', 'it', 'de', 'ru']
        },
        es: {
            id: 'es',
            targets: ['en', 'pt', 'fr', 'it', 'de', 'ru']
        },
        pt: {
            id: 'pt',
            targets: ['en', 'es', 'fr', 'it', 'de', 'ru']
        },
        fr: {
            id: 'fr',
            targets: ['en', 'es', 'pt', 'it', 'de', 'ru']
        },
        it: {
            id: 'it',
            targets: ['en', 'es', 'pt', 'fr', 'de', 'ru']
        },
        de: {
            id: 'de',
            targets: ['en', 'es', 'pt', 'fr', 'it', 'ru']
        },
        ru: {
            id: 'ru',
            targets: ['en', 'es', 'pt', 'fr', 'it', 'de']
        }
    },
    priority: 7,
    domain: "http://thefreedictionary.com/",
    path: {
        templatesDir: rootDir
    },
    ajax: {
        translate: "http://{sourceLangId}.thefreedictionary.com/{word}"
    },
    contentTypes: [ContentTypes.THESAURUS, ContentTypes.DEFINITIONS, ContentTypes.VERBTABLE]
}