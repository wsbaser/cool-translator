'use strict';

import DictionaryProvider from '../common/dictionary-provider';
import StringHelper from 'string-helper';

export default class GoogleProvider extends DictionaryProvider{
    constructor(config){
        super(config);
    }
    
    detectLanguage(word) {
        return new Promise((resolve, reject)=>{
            let detectUrl = StringHelper.format(this.config.ajax.detectLanguage, {
                word: word
            });
            this.getJson(detectUrl).then((data)=>{
                resolve(this.getDetectedLanguages(data));
            }).catch((error)=>{
                reject(error)
            });
        })
    }

    getDetectedLanguages(data) {
        return data && data.ld_result && data.ld_result.srclangs ?
            data.ld_result.srclangs :
            null;
    }

    processTranslationsResponse(response) {
        let jsonObject = {};
        try {
            if (response.ld_result.srclangs.indexOf(response.src) != -1) {
                jsonObject.word = response.alternative_translations[0].raw_src_segment;
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }

        // .TRANSLATIONS
        try {
            jsonObject.translations = {};
            if (response.dict) {
                let translations = response.dict;
                for (let i = translations.length - 1; i >= 0; i--) {
                    let sp = translations[i].pos;
                    jsonObject.translations[sp] = translations[i].entry;
                };
            } else {
                let alternative = response.alternative_translations[0].alternative[0];
                if (alternative.word_postproc) {
                    let sp = response.synsets && response.synsets[0] && response.synsets[0].pos ?
                        response.synsets[0].pos :
                        'unknown';
                    jsonObject.translations[sp] = [{
                        word: alternative.word_postproc,
                        reverse_translation: null,
                        score: 0
                    }];
                }
            }
        } catch (e) {
            return null;
        }

        // .DEFINITIONS
        try {
            jsonObject.definitions = {};
            let definitions = response.definitions || [];
            for (let i = definitions.length - 1; i >= 0; i--) {
                let sp = definitions[i].pos;
                let definitionsArr = definitions[i].entry.map(function(item) {
                    return {
                        definition: item.gloss,
                        example: item.example
                    };
                }).filter(function(item) {
                    return item.definition && item.definition.length > 10;
                });
                if (definitionsArr.length) {
                    jsonObject.definitions[sp] = definitionsArr;
                }
            };
        } catch (e) {
            console.error(e);
        }

        // .EXAMPLES
        try {
            let examples = response.examples && response.examples.example ?
                response.examples.example : [];
            jsonObject.examples = examples.map(function(item) {
                return item.text;
            }).filter(function(item) {
                return item && item.length > 10;
            });
        } catch (e) {
            jsonObject.examples = [];
            console.error(e);
        }
        return jsonObject;
    }

    requestTranslationsData(requestData) {
        return new Promise((resolve, reject)=>{
            let translateUrl = this.formatRequestUrl(this.config.ajax.translate, requestData);
            this.getJson(translateUrl).then((data)=>{
                try {
                    resolve(this.processTranslationsResponse(data));
                } catch (e) {
                    reject(e.message);
                }
            }).catch((error)=>{
                reject(error)
            });    
        })
    }
}

// GoogleProvider.prototype.TL = function(a) {
//     let SL = null;
//     let QL = function(a) {
//             return function() {
//                 return a;
//             };
//         };
//     let RL = function(a, b) {
//       let t ='a',Tb='+';
//         for (let c = 0; c < b.length - 2; c += 3) {
//             let d = b.charAt(c + 2);
//             d = d >= t ? d.charCodeAt(0) - 87 : Number(d);
//             d = b.charAt(c + 1) == Tb ? a >>> d : a << d;
//             a = b.charAt(c) == Tb ? a + d & 4294967295 : a ^ d;
//         }
//         return a;
//     };
//     let b, c,
//         cb='&',
//         k='',
//         mf='=',
//         Vb="+-a^+6",
//         Ub='+-3^+b+-f',
//         dd='.';
//     if (null  === SL) {
//         c = QL(String.fromCharCode(84));
//         b = QL(String.fromCharCode(75));
//         c = [c(), c()];
//         c[1] = b();
//         SL = Number(window[c.join(b())]) || 0;
//     }
//     b = SL;
//     d = QL(String.fromCharCode(116)); 
//     c =QL(String.fromCharCode(107));
//     d = [d(), d()];
//     d[1] = c();
//     for (c = cb + d.join(k) + mf, d = [], e = 0, f = 0; f < a.length; f++) {
//         let g = a.charCodeAt(f);
//         if(128 > g){ 
//            d[e++] = g; 
//         }else{
//           if(2048 > g){
//             d[e++] = g >> 6 | 192; 
//           }
//           else{ 
//             if(55296 == (g & 64512) && f + 1 < a.length && 56320 == (a.charCodeAt(f + 1) & 64512)){
//               g = 65536 + ((g & 1023) << 10) + (a.charCodeAt(++f) & 1023);
//               d[e++] = g >> 18 | 240;
//               d[e++] = g >> 12 & 63 | 128;
//             }
//             else{
//               d[e++] = g >> 12 | 224;
//               d[e++] = g >> 6 & 63 | 128;
//               d[e++] = g & 63 | 128;
//             }
//           }
//         }
//     }
//     a = b || 0;
//     for (e = 0; e < d.length; e++){
//         a += d[e];
//         a = RL(a, Vb);
//     }
//     a = RL(a, Ub);
//     if(0 > a){
//       a = (a & 2147483647) + 2147483648;
//     }
//     a %= 1E6;
//     return (a.toString() + dd + (a ^ b));
// };