'use strict';

import 'netflix-subtitles.sass';
import Netflix from './netflix';

class SubtitlesConverter {
    constructor() {
        this.rootSelector = '[data-uia=player]'
		this.netflix = Netflix($);
        this.observer = new MutationObserver(function(e) {
            e.forEach(function(e) {
                "childList" === e.type && this._processAddedNodes(e.addedNodes);
            }.bind(this));
        }.bind(this));
    }

    init(){
		this.netflix.player.on("ready", this.start.bind(this));
        window.addEventListener("message", this._onMessage.bind(this), false);
        $("body").on("contextmenu", ".nf-big-play-pause,.player-timedtext", function(e){
            console.log(e.target);
            if(this.netflix.player.isPaused()){
                this.netflix.player.play();
            }else{
                this.netflix.player.pause();
            }
        }.bind(this));

        $("body").on("click", ".ctr-sub-word", function(e){
            // $(".ctr-sub-word").map(function(i, e){
            //     e.classList.remove("ctr-selected");
            // });
            // e.target.classList.add("ctr-selected");
            this.showTranslation(e.target.textContent);
            e.stopPropagation()
        }.bind(this));

        document.addEventListener('keydown', function(e){
            let isCommandKeyPressed = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
            if (!isCommandKeyPressed && e.keyCode === 32) {
                this._hideDialog();
            }
        }.bind(this), true);
    }

    _hideDialog(){
        window.postMessage({
            type: "HIDE_DIALOG"
        }, "*");
    }

    _onMessage(event){
        if(event.source!==window){
            return;
        }
        if (event.data && (event.data.type=="FOCUS_NETFLIX_PLAYER")) {
            $(this.rootSelector).trigger('focus');
        }
    }

    showTranslation(text){
        this.netflix.player.pause();
        window.postMessage({
            type: "SHOW_DIALOG",
            text: text
        }, "*");
    }

    start(){
        $(".player-timedtext").appendTo(this.rootSelector);
        this._injectCtrIframe();
        this.observer.observe(document.querySelector(".player-timedtext"), {
            subtree: !0,
            childList: !0,
            characterData: !1
        });
    }

    _injectCtrIframe(){
        window.postMessage({
            type: "INJECT_IFRAME_TO",
            rootSelector: this.rootSelector
        }, "*");
    }

    _processAddedNodes(addedNodes){
    	for (var i = 0; i < addedNodes.length; i++) {
            this._processAddedNode(addedNodes[i]);
        }
    }

    _processAddedNode(addedNode){
    	if( 3 !== addedNode.nodeType && "string" == typeof addedNode.className){
    		if(addedNode.className.indexOf("player-timedtext-text-container") !== -1){
				this._processTimedtextContainerNode(addedNode);
    		}
    	}
    }

    _processTimedtextContainerNode(nodeEl) {
        let $nodeEl = $(nodeEl);
        let $parentNodeEl = $nodeEl.parent();
        let nodeText = $parentNodeEl.text();
        if (nodeText) {
            var convertedSubtitlesHtml = this._getConvertedSubtitlesHtml(nodeEl);
            $nodeEl.find(">span").map(function(index, spanEl) {
            	if(index==0){
					spanEl.innerHTML = convertedSubtitlesHtml;
                    spanEl.style.fontSize='33px'
            	}else{
					$(spanEl).remove();
            	}
            });
        }
    }

    _getConvertedSubtitlesHtml(e) {
        for (var t = e.innerText, n = t.match(new RegExp('[\\s.,!?:"*><()]+',"g")) || [], i = t.split(new RegExp('[\\s.,!?:"*><()]+')).map(function(e) {
            if (!e)
                return "";
            var t = "";
            return 0 === e.indexOf("-") && (t = "-",
            e = e.replace("-", "")),
            t + '<span class="ctr-sub-word" style="line-height:normal;font-weight:normal;color:#ffffff;text-shadow:#000000 0px 0px 7px;font-family:Netflix Sans,Helvetica Nueue,Helvetica,Arial,sans-serif;font-weight:bolder">' + e + "</span>"      
        }), o = "", r = 0, s = i.length; r < s; r++)
            o += i[r],
            n[r] && (o += n[r]);
        return o = o.replace(/\r?\n/, "<br/>")
    }
}

let subtitlesConverter = new SubtitlesConverter();
subtitlesConverter.init();
