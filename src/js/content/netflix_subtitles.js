'use strict';

import 'netflix-subtitles.sass';
import Netflix from './netflix';

class SubtitlesConverter {
    constructor() {
		this.netflix = Netflix($);
        this.observer = new MutationObserver(function(e) {
            e.forEach(function(e) {
                "childList" === e.type && this._processAddedNodes(e.addedNodes);
            }.bind(this));
        }.bind(this));
    }

    init(){
		this.netflix.player.on("ready", this.start.bind(this));
        window.addEventListener("message", this._onMessage, false);
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
            // let $tofocus = $(".button-nfplayerPlay");
            // let focused;
            // while(window.document.activeElement!=focused && $tofocus[0]){
            //     focused = $tofocus[0];
            //     console.log(focused);
            //     focused.focus();
            //     $tofocus=$tofocus.parent().closest(":visible");
            // }
            // console.log(window.document.activeElement);

            $(".nf-player-container").focus();

            var mouseMoveEvent = document.createEvent("MouseEvents");
            mouseMoveEvent.initMouseEvent(
                       "mousemove", //event type : click, mousedown, mouseup, mouseover, mousemove, mouseout.  
                       true, //canBubble
                       false, //cancelable
                       window, //event's AbstractView : should be window 
                       1, // detail : Event's mouse click count 
                       50, // screenX
                       50, // screenY
                       50, // clientX
                       50, // clientY
                       false, // ctrlKey
                       false, // altKey
                       false, // shiftKey
                       false, // metaKey 
                       0, // button : 0 = click, 1 = middle button, 2 = right button  
                       null // relatedTarget : Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
            );

            document.dispatchEvent(mouseMoveEvent)
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
        $(".player-timedtext").appendTo(".PlayerControlsNeo__layout");
        this._injectCtrIframe();
        this.observer.observe(document.querySelector("body"), {
            subtree: !0,
            childList: !0,
            characterData: !1
        });
    }

    _injectCtrIframe(){
        window.postMessage({
            type: "INJECT_IFRAME_TO",
            rootSelector: ".PlayerControlsNeo__layout"
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
            t + '<span class="ctr-sub-word">' + e + "</span>"
        }), o = "", r = 0, s = i.length; r < s; r++)
            o += i[r],
            n[r] && (o += n[r]);
        return o = o.replace(/\r?\n/, "<br/>")
    }
}

let subtitlesConverter = new SubtitlesConverter();
subtitlesConverter.init();
