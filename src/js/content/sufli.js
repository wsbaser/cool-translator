var Helpers = function() {
    return {
        injectInlineJS: function(e, n) {
            n || (n = []),
            n = n.map(function(e) {
                return '"' + e + '"'
            });
            var t = document.createElement("script");
            t.textContent = "(" + e + ")(" + n.join(",") + ")",
            (document.head || document.documentElement).appendChild(t),
            t.parentNode.removeChild(t)
        }
    }
}();
var Prefix = function() {
    var n = ""
      , r = function(r) {
        n = r
    }
      , t = function(r) {
        return n + "-" + r
    };
    return {
        init: r,
        _: t,
        get: t,
        id: function(n) {
            return "#" + t(n)
        },
        cc: function(n) {
            return "." + t(n)
        },
        data: function(r) {
            return n + "_" + r.replace(/-/g, "_")
        }
    }
}();
var Widget = function() {
    return function(t) {
        this.prefix = t.prefix,
        this.id = t.id || "",
        this.src = t.src,
        this.parent = t.parent || document.body,
        this.$root = null,
        this.$iframe = null,
        this.onReady = t.onReady
    }
}();
Widget.prototype.inject = function() {
    this.$root = $("<div/>").attr("id", this.id).appendTo($(this.parent)),
    this.$iframe = $("<iframe/>").attr("src", this.src).appendTo(this.$root)
}
,
Widget.prototype.show = function() {
    this.$root ? this.$root.show() : (this.inject(),
    this.$root.show())
}
,
Widget.prototype.hide = function() {
    this.$root && this.$root.hide()
}
,
Widget.prototype.remove = function() {
    this.$root && this.$root.remove()
}
,
Widget.prototype.resize = function(t) {
    t.width && this.$iframe.css({
        width: t.width
    }),
    t.height && this.$iframe.css({
        height: t.height
    })
}
,
Widget.prototype.post = function(t, i) {
    if (!this.$iframe)
        return void console.error("Iframe not found");
    this.$iframe[0].contentWindow.postMessage({
        cmd: this.prefix + t,
        data: i
    }, "*")
}
,
Widget.prototype.onMessage = function(t, i) {
    this.prefix || console.log("Prefix is not set. Aborting to avoid collision"),
    t = t.replace(this.prefix, ""),
    "widget.ready" === t ? "function" == typeof this.onReady && this.onReady() : "widget.resize" === t ? this.resize(i) : "widget.close" === t && this.hide()
}
;
var UI = function() {
    var t, e, i, o, n = 20, r = function(t) {
        i = t.getTranslation,
        o = t.exportTranslation,
        a(t),
        s(t),
        c()
    }, s = function() {
        t = $(Prefix.cc("translator-root")),
        t[0] && t.remove(),
        t = $("<div>", {
            class: Prefix.get("translator-root")
        }).appendTo("body")
    }, a = function(t) {
        $historyRoot = $(Prefix.cc("history-root")),
        $historyRoot[0] && $historyRoot.remove(),
        $historyRoot = $("<div>", {
            class: Prefix.get("history-root")
        }).appendTo("body"),
        $("<div>", {
            class: Prefix.get("history-overlay")
        }).appendTo($historyRoot),
        $("<div>", {
            class: Prefix.get("history-container")
        }).appendTo($historyRoot)
    }, c = function() {
        d(),
        e = new Widget({
            prefix: Prefix.get(""),
            src: chrome.extension.getURL("/html/settings.html"),
            id: Prefix.get("settings-root"),
            className: Prefix.get("hidden"),
            parent: $("body")[0],
            onReady: function() {
                this.$root.removeClass(Prefix.get("hidden"))
            }
        })
    }, d = function() {
        window.addEventListener("message", function(t) {
            var i = t.data;
            if ("object" == typeof i) {
                var o = i.cmd
                  , n = i.data;
                o && (o.match(/-widget\./) && e ? e.onMessage(o, n) : "iframe.close" === o && $iframeRoot.remove())
            }
        }, !1)
    }, f = function(e) {
        if (e.rect) {
            var i = document.documentElement.clientHeight
              , o = document.documentElement.clientWidth
              , n = "up";
            i / 2 > e.rect.top && (n = "down");
            var r, s;
            "up" === n ? s = i - e.rect.top : "down" === n && (r = e.rect.bottom);
            var a = t.outerWidth()
              , c = e.rect.left + e.rect.width / 2 - a / 2;
            c > o - a && (c = o - a),
            c < 0 && (c = 0),
            t.css({
                top: r || "auto",
                bottom: s || "auto",
                left: c
            })
        }
        t.html(e.html).show(),
        l(e)
    }, l = function(e) {
        t.find(Prefix.cc("translator-btn")).click(function(e) {
            var o = this.dataset.service
              , n = this.parentNode.dataset.text;
            t.find(Prefix.cc("translation-spinner")).removeClass(Prefix.get("hidden")),
            i({
                service: o,
                text: n
            }, function(e) {
                t.html(e.html),
                l()
            })
        }),
        t.find(Prefix.cc("export-btn")).click(function(e) {
            var i = $(this)
              , n = i.closest(Prefix.cc("translation-item"))
              , r = t.find(Prefix.cc("translator-btns")).data("text");
            n.find(Prefix.cc("original"))[0] && (r = n.find(Prefix.cc("original"))[0].textContent);
            var s = t.find(Prefix.cc("translator-btn-active")).data("service")
              , a = n.find(Prefix.cc("translation-text")).text();
            i.addClass(Prefix.get("rotate")),
            o({
                service: s,
                text: r,
                translation: a
            }, function(t) {
                i.removeClass(Prefix.get("rotate"));
                var e = Prefix.get("export-success")
                  , o = Prefix.get("export-error");
                t.error ? (i.addClass(o),
                p(t.data)) : i.addClass(e),
                setTimeout(function() {
                    i.removeClass(e + " " + o)
                }, 2e3)
            })
        })
    }, h = function(t, e) {
        if (t.length < 2)
            return "";
        for (var i = 5, o = $("<div>"), n = "up" === e ? "prepend" : "append", r = t.length - 2; r >= 0; r--) {
            item = t[r];
            var s = $("<div>", {
                class: Prefix.get("history-item")
            });
            if (item.lines.map(function(t) {
                s.append("<div>" + t + "</div>")
            }),
            $("<span>", {
                class: Prefix.get("goto-btn")
            }).attr("data-time", item.time).appendTo(s),
            o[n](s),
            !--i)
                break
        }
        return o.html()
    }, p = function(e) {
        var i = $("<div>", {
            class: Prefix.get("status")
        }).css("display", "none").appendTo(t);
        i.text(e).slideDown(),
        setTimeout(function() {
            i.slideUp(function() {
                i.remove()
            })
        }, 2e3)
    };
    return {
        init: r,
        showTranslation: f,
        hideTranslation: function() {
            t.hide()
        },
        showHistory: function(t) {
            var e = t.flix
              , i = document.documentElement.clientHeight
              , o = "up";
            i / 2 > t.subtitleRect.top && (o = "down");
            var r, s;
            "up" === o ? (r = t.playerRect.top,
            s = t.subtitleRect.top) : "down" === o && (r = t.subtitleRect.bottom,
            s = t.playerRect.bottom);
            var a = parseInt(t.playerRect.height / 22.3);
            a ? n = a : a = n;
            var c = h(t.history, o);
            $historyRoot.css({
                top: r,
                height: s - r,
                width: "60%",
                "font-size": a + "px"
            }).find(Prefix.cc("history-container")).removeClass(Prefix.get("history-up")).removeClass(Prefix.get("history-down")).addClass(Prefix.get("history-" + o)).html(c),
            c && $historyRoot.show(),
            $historyRoot.find(Prefix.cc("goto-btn")).click(function() {
                "nf" === e.uiVersion ? Helpers.injectInlineJS(function(t) {
                    if (!((t = Math.floor(1e3 * t)) < 1)) {
                        var e = netflix.appContext.state.playerApp.getAPI().videoPlayer
                          , i = netflix.appContext.state.playerApp.getAPI().videoPlayer.getAllPlayerSessionIds()[0]
                          , o = e.getVideoPlayerBySessionId(i);
                        o.seek(t),
                        o.play()
                    }
                }, [this.dataset.time]) : Helpers.injectInlineJS(function(t) {
                    for (var e = netflix.cadmium.UiEvents.events.resize[1].scope.events.dragend, i = 0, o = e.length; i < o; i++) {
                        var n = e[i];
                        n.handler.toString().match("seek") && n.handler({}, {
                            value: t,
                            pointerEventData: {
                                playing: !0
                            }
                        })
                    }
                }, [this.dataset.time])
            })
        },
        hideHistory: function() {
            $historyRoot.hide()
        },
        showSettings: function() {
            e.show()
        },
        hideSettings: function() {}
    }
}();
Prefix.init("sfl");


(function() {
    var e, t, n = {}, i = [], o = "google", r = [], s = null, 

    a = function() {
        c(),
        d({
            onReady: function() {
                "nf" === e.uiVersion && $(".player-timedtext").appendTo(".controls"),
                UI.init({
                    getTranslation: y,
                    exportTranslation: P
                })
            },
            onSeeked: function() {
                i = []
            }
        }),
        $(document).ready(function() {
            l(function(e) {
                f(),
                w()
            })
        })
    }

    , c = function() {
        chrome.runtime.onMessage.addListener(function(e, t, i) {
            var o = e.cmd
              , r = e.data;
            (t.tab || {}).id;
            "settings.update" === o && (n = r)
        })
    },

     l = function(e) {
        chrome.runtime.sendMessage({
            cmd: "settings.get"
        }, function(t) {
            n = t,
            e(n)
        })
    }, d = function(t) {
        e = Netflix($),
        e.player.on("ready", function(e) {
            t.onReady && t.onReady()
        }),
        e.player.on("seeked", function(e) {
            t.onSeeked && t.onSeeked()
        })
    }, f = function() {
        $("body").on("click", "video, .player-timedtext, .nf-big-play-pause", function(t) {
            var n = t.toElement;
            "VIDEO" !== n.tagName && n.className.indexOf("player-timedtext") === -1 && n.className.indexOf("nf-big-play-pause") === -1 || (e.player.isPlaying() ? (u(),
            UI.showHistory({
                history: i,
                playerRect: p(),
                subtitleRect: m(),
                flix: e
            })) : (x(),
            UI.hideHistory()))
        }),
        $("body").on("click", Prefix.cc("sub-word"), function(e) {
            u(),
            r = [],
            t = "",
            $(Prefix.cc("selected")).removeClass(Prefix.get("selected")),
            h({
                text: this.textContent,
                rect: this.getBoundingClientRect(),
                pos: {
                    x: e.clientX,
                    y: e.clientY
                }
            })
        }),
        $("body").on("contextmenu", Prefix.cc("sub-word"), function(e) {
            e.preventDefault(),
            e.stopPropagation(),
            u(),
            h({
                text: v($(this)),
                rect: this.getBoundingClientRect(),
                pos: {
                    x: e.clientX,
                    y: e.clientY
                }
            })
        }),
        $("body").on("mouseenter", ".player-timedtext-text-container", function(t) {
            n.enabled && (u(),
            UI.showHistory({
                history: i,
                playerRect: p(),
                subtitleRect: m(),
                flix: e
            }))
        }),
        $("body").on("mouseleave", ".player-timedtext-text-container", function(e) {
            if (n.enabled) {
                var t = e.toElement
                  , i = $(t);
                i.closest(Prefix.cc("history-overlay"))[0] || i.closest(Prefix.cc("translator-root"))[0] || i.closest(".player-timedtext-text-container")[0] || (x(),
                UI.hideTranslation(),
                UI.hideHistory())
            }
        }),
        $("body").on("mouseout", [Prefix.cc("history-overlay"), Prefix.cc("history-container"), Prefix.cc("translator-root")].join(","), function(e) {
            if (n.enabled && e.toElement) {
                var t = $(e.toElement)
                  , i = $(e.target);
                if (t.closest(Prefix.cc("history-root"))[0])
                    return void ((t.hasClass(Prefix.get("history-overlay")) || i.hasClass(Prefix.get("translator-root"))) && UI.hideTranslation());
                t.closest(Prefix.cc("translator-root"))[0] || t.closest(".player-timedtext-text-container")[0] || t.hasClass(Prefix.get("sub-word")) || (x(),
                UI.hideTranslation(),
                UI.hideHistory())
            }
        })
    }, u = function() {
        e.player.pause(),
        s && clearInterval(s),
        s = setInterval(function() {
            "nf" !== e.uiVersion && e.util.jiggleMouse(e._elements.slider.bar)
        }, 1e3)
    }, x = function() {
        clearInterval(s),
        s = null,
        e.player.play()
    }, p = function(e) {
        var t = $(".player-timedtext");
        return t[0] ? t[0].getBoundingClientRect() : {}
    }, m = function() {
        var e = 1 / 0
          , t = 0
          , n = 1 / 0
          , i = 0;
        return $(".player-timedtext-text-container").map(function(o, r) {
            var s = r.getBoundingClientRect();
            s.left < e && (e = s.left),
            s.right > t && (t = s.right),
            s.top < n && (n = s.top),
            s.bottom > i && (i = s.bottom)
        }),
        {
            left: e,
            right: t,
            top: n,
            bottom: i,
            width: t - e,
            height: i - n
        }
    }, h = function(e) {
        g(e),
        y({
            text: e.text
        }, function(t) {
            t || (t = {
                html: "<h4>Oops... Something went wrong.</h4>"
            }),
            UI.showTranslation({
                text: e.text,
                html: t.html
            })
        })
    }, g = function(e) {
        chrome.runtime.sendMessage({
            cmd: "translation.render",
            data: {
                service: o,
                text: e.text
            }
        }, function(t) {
            e.html = t.html,
            UI.showTranslation(e)
        })
    }, y = function(e, t) {
        e.service && (o = e.service),
        chrome.runtime.sendMessage({
            cmd: "translate",
            data: {
                service: o,
                text: e.text
            }
        }, function(e) {
            t(e)
        })
    }, v = function(e) {
        var n = "add";
        e.hasClass(Prefix.get("selected")) && (n = "remove"),
        e.toggleClass(Prefix.get("selected"), "add" === n);
        var i = e.closest([".player-timedtext", Prefix.cc("history-item")].join(","));
        i.text() !== t && (r = [],
        t = i.text());
        var o = i.find(Prefix.cc("sub-word")).index(e[0]);
        "add" === n && r.indexOf(o) === -1 ? (r.push(o),
        r.sort()) : "remove" === n && r.indexOf(o) !== -1 && r.splice(r.indexOf(o), 1);
        var s = [];
        return i.find(Prefix.cc("sub-word")).map(function(e, t) {
            r.indexOf(e) >= 0 && s.push(t.textContent)
        }),
        s = s.join(" ")
    }, P = function(e, t) {
        b(e, function(e) {
            if (!e.match(/^https?:\/\/.*/))
                return void t({
                    error: !0,
                    data: 'Bad URL. Please check "Export URL" in the settings.'
                });
            var n = e.replace(/^(https?:\/\/[^\/]+)\/?.*/, "$1");
            chrome.runtime.sendMessage({
                cmd: "permissions.request",
                data: {
                    domain: n
                }
            }, function(n) {
                if (!n)
                    return void t({
                        error: !0,
                        data: "Not permitted"
                    });
                chrome.runtime.sendMessage({
                    cmd: "ajax.get",
                    data: e
                }, function(e) {
                    t(e)
                })
            })
        })
    }, b = function(e, t) {
        chrome.runtime.sendMessage({
            cmd: "settings.get"
        }, function(i) {
            n = i;
            var o = n.exportURL || "";
            e.from = n.direction.from,
            e.to = n.direction.to;
            for (var r in e) {
                var s = new RegExp("{{" + r + "}}","g")
                  , a = e[r];
                void 0 === a && (a = ""),
                a = encodeURIComponent(a),
                o = o.replace(s, a)
            }
            o = o.replace(/{{\w+}}/, ""),
            t(o)
        })
    }, w = function() {
        var e = document.querySelector("body")
          , t = new MutationObserver(function(e) {
            e.forEach(function(e) {
                "childList" === e.type && C(e.addedNodes)
            })
        }
        )
          , n = {
            subtree: !0,
            childList: !0,
            characterData: !1
        };
        t.observe(e, n)
    }, C = function(e) {
        for (var t = 0, n = e.length; t < n; t++) {
            I(e[t])
        }
    }, I = function(e) {
        3 !== e.nodeType &&
         "string" == typeof e.className && 
         (e.className.indexOf("player-timedtext-text-container") !== -1 ? 
            R(e) : 
            e.className.indexOf("PlayerControls") !== -1 ? O() : e.className.indexOf("PlayerControls") !== -1 && O())
    }, R = function(t) {
        // обновили player-timedtext-text-container
        if (n.enabled) {
            var o = $(t)
              , r = o.parent()
              , s = r.text();
            // if subtitles not empty
            if (s) {
                var a = i[i.length - 1];
                if (!a || a.text !== s) {
                    // save history
                    a = {
                        text: s,
                        lines: [],
                        nLines: r.find(".player-timedtext-text-container").length,
                        time: e.player.getCurrentTime()
                    },
                    i.push(a),
                    i.length > 5 && i.shift()
                }
                var c = U(t);
                a.nLines > a.lines.length && a.lines.push(c),
                o.find(">span").map(function(e, t) {
                    0 === e ? t.innerHTML = c : $(t).remove()
                }),
                T(r)
            }
        }
    }, U = function(e) {
        for (var t = e.innerText, n = t.match(new RegExp('[\\s.,!?:"*><()]+',"g")) || [], i = t.split(new RegExp('[\\s.,!?:"*><()]+')).map(function(e) {
            if (!e)
                return "";
            var t = "";
            return 0 === e.indexOf("-") && (t = "-",
            e = e.replace("-", "")),
            t + '<span class="' + Prefix.get("sub-word") + '">' + e + "</span>"
        }), o = "", r = 0, s = i.length; r < s; r++)
            o += i[r],
            n[r] && (o += n[r]);
        return o = o.replace(/\r?\n/, "<br/>")
    }, T = function(e) {
        e.text() === t && e.find(Prefix.cc("sub-word")).map(function(e, t) {
            r.indexOf(e) >= 0 && $(t).addClass(Prefix.get("selected"))
        })
    }, O = function() {
        // обновили PlayerControls - inject settings icon
        if (!$(Prefix.cc("controls"))[0]) {
            var e = $("<div>", {
                class: Prefix.get("controls")
            })
              , t = ($("<a>", {
                class: Prefix.get("settings")
            }).html('<span>SUFLI</span> <img width="15px" height="15px" src="' + chrome.extension.getURL("img/settings.png") + '"/>').appendTo(e).click(function() {
                UI.showSettings()
            }),
            $(".player-controls-wrapper"))
              , n = t.height();
            $(".PlayerControls--bottom-controls")[0] && (t = $(".PlayerControls--bottom-controls"),
            n = t.height + $(".PlayerControls--progress-control-row").height(),
            e.addClass(Prefix.get("controls-nf"))),
            setTimeout(function() {
                e.css("top", n + "px").css("display", "none").fadeIn()
            }, 1e3),
            e.appendTo(t)
        }
    };
    return {
        init: a
    }
}
)().init();
