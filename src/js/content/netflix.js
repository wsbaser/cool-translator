/**

The MIT License (MIT)

Copyright (c) 2016 Avi Goldman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

export default function Netflix(jq) {

  if (typeof jq !== 'undefined') {
    var $ = jq;
  }
  else if (typeof jQuery !== 'undefined') {
    var $ = jQuery;
  }
  else {
    throw new Error("jQuery is required for netflix.js");
  }


  var netflix = {
    // Constants
    _version: '0.2',
    // Pages
    page: {
      _path: window.location.pathname,
      BROWSE: 'browse',
      PLAYER: 'watch',
      TITLE: 'title',
      SEARCH: 'search',
      SETTINGS: 'settings',
      UNKNOWN: 'unknown'
    },
    // Util functions
    util: {},
    // Elements
    _elements: {},
    // Browse
    browse: {},
    // Player
    player: {},
    uiVersion: 'default'
  };

  // Setup
  netflix.setup = function() {
    switch (netflix.page.getPage()) {
      case netflix.page.PLAYER:
        netflix.player.setup();
        break;
    }
  };

  // Netflix.js functions

  netflix.getVersion = function() {
    return netflix._version;
  };

  // Location
  netflix.page.getPage = function() {
    var page = netflix.page._path.substring(1);
        page = page.substring(0, (page.indexOf('/') >= 0) ? page.indexOf('/') : page.length);

    var pages = [
      netflix.page.BROWSE,
      netflix.page.PLAYER,
      netflix.page.TITLE,
      netflix.page.SEARCH
    ];

    for (var i = 0; i < pages.length; i++) {
      if (pages[i] == page)
        return pages[i];
    }

    // Custom case to account for all the different settings pages
    var settingPages = ['ManageProfiles', 'YourAccount', 'email', 'password', 'phonenumber', 'YourAccountPayment', 'BillingActivity', 'ChangePlan', 'Subscribe', 'EmailPreferences', 'pin', 'DoNotTest', 'Activate', 'ManageDevices', 'EditProfiles', 'LanguagePreferences', 'HdToggle', 'SubtitlePreferences', 'MyListOrder', 'viewingactivity', 'MoviesYouveSeen', 'Reviews'];
    for (var i = 0; i < settingPages.length; i++) {
      if (window.location.href.indexOf('/'+settingPages[i]+'/') > 0)
        return netflix.page.SETTINGS;
    }

    // if page is not found return unknown
    return netflix.page.UNKNOWN;
  };

  netflix.page.isBrowse = function() {
    return netflix.page.getPage() == netflix.page.BROWSE;
  };

  netflix.page.isPlayer = function() {
    return netflix.page.getPage() == netflix.page.PLAYER;
  };

  netflix.page.isTitle = function() {
    return netflix.page.getPage() == netflix.page.TITLE;
  }

  netflix.page.isSearch = function() {
    return netflix.page.getPage() == netflix.page.SEARCH;
  };

  netflix.page.isSettings = function() {
    return netflix.page.getPage() == netflix.page.SETTINGS;
  };

  // Location events
  Eventable(netflix.page, $);
  netflix.page.registerEvent('change', function() {
    var changed = netflix.page._path != window.location.pathname;

    if (changed)
      netflix.page._path = window.location.pathname;

    return changed;
  }).listen();
  netflix.page.registerEvent('load', {element: window, event: 'load'}).listen();

  // Until functions
  /**
   * Simulate mouse on element
   */
  netflix.util.jiggleMouse = function(el) {
    var event = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        currentTarget: el[0],
        // clientX: 100,
        // clientY: 100
    });
    return el.length > 0 && el[0].dispatchEvent(event);
  };

  /**
   * Simulate mouse on element
   */
  netflix.util.triggerHover = function(el) {
    var event = new MouseEvent("mouseover", {
        bubbles: true,
        cancelable: true,
        currentTarget: el[0]
    });
    return el.length > 0 && el[0].dispatchEvent(event);
  };

  /**
   * Simulate clicking on element at given points and then moving mouse out
   */
  netflix.util.triggerClick = function(el, internalOffset) {
    var offset = el.offset();

    // Set defaults
    internalOffset   = $.isPlainObject(internalOffset) ? internalOffset   : {};
    internalOffset.x = internalOffset.x != null        ? internalOffset.x : 0;
    internalOffset.y = internalOffset.y != null        ? internalOffset.y : el.height()/2;

    // Set the clicking position
    var clientX = offset.left + internalOffset.x;
    var clientY = offset.top + internalOffset.y;

    var mousedown = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: clientX,
      clientY: clientY
    });

    el[0].dispatchEvent(mousedown);

    setTimeout(function() {
      var mouseup = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clientX,
        clientY: clientY
      });

      el[0].dispatchEvent(mouseup);

      setTimeout(function() {
        var click = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: clientX,
          clientY: clientY
        });

        el[0].dispatchEvent(click);

        setTimeout(function() {
          var mouseout = new MouseEvent("mouseout", {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: 0,
            clientY: 0
          });

          el[0].dispatchEvent(mouseout);
        }, 0);
      }, 0);
    }, 0);
  };

  // Player Setup
  netflix.player.setup = function() {

    netflix.player.on('ready', function() {
      if (netflix.uiVersion === 'default') {
        netflix._elements = {
          player: $('#netflix-player'),
          video: $('#netflix-player video')[0],
          playPauseButton: $('.player-control-button.player-play-pause'),
          slider: {
            timeLeft: $('section.player-slider > label'),
            progressCompleted: $('.player-scrubber-progress-completed'),
            bar: $('#scrubber-component'),
          },
          fullscreenButton: $('.player-control-button.player-fill-screen'),
          volume: {
            bar: $('#player-menu-volume > div > div'),
            button: $('.player-control-button.volume'),
          }
        };
      }
      else if (netflix.uiVersion === 'nf') {
        netflix._elements = {
          player: $('.nf-player-container'),
          video: $('.nf-player-container video')[0],
          playPauseButton: $('.nfp-button-control.button-nfplayerPlay, .nfp-button-control.button-nfplayerPause'),
          slider: {
            timeLeft: $('.time-remaining .time'),
            progressCompleted: $('.current-progress'),
            bar: $('.scrubber-bar .track'),
          },
          fullscreenButton: $('.nfp-button-control.player-fill-screen'),
          volume: {
            bar: $('#player-menu-volume > div > div'),
            button: $('.nfp-button-control.volume'),
          }
        };
      }else if(netflix.uiVersion === '22'){
        netflix._elements = {
          player: $('[data-uia=player]'),
          video: $('[data-uia=player] video')[0],
          playPauseButton: $('[data-uia=control-play-pause-pause], [data-uia=control-play-pause-play]'),
          slider: {
            timeLeft: $('[data-uia=controls-time-remaining]'),
            // progressCompleted: $('.current-progress'),
            bar: $('[data-uia=timeline-bar]'),
          },
          fullscreenButton: $('[data-uia=control-fullscreen-enter]'),
          volume: {
            bar: $('[data-uia-scrubber-rail]'),
            button: $('[data-uia=control-volume-medium]'),
          }
        };
      }

      // Setup player events' condition
      netflix.player.setCondition('play', {element: netflix._elements.video, event: 'play'}).listen();
      netflix.player.setCondition('playing', {element: netflix._elements.video, event: 'playing'}).listen();
      netflix.player.setCondition('pause', {element: netflix._elements.video, event: 'pause'}).listen();
      netflix.player.setCondition('timeupdate', {element: netflix._elements.video, event: 'timeupdate'}).listen();
      netflix.player.setCondition('buffering', function() {
        if (!netflix.player.isBuffering())
          netflix.player._buffered = false;

        // only buffer once per buffer session
        if (netflix.player.isBuffering()
            && netflix.player._buffered == false) {

          netflix.player._buffered = true;

          return true;
        }

        return false;
      }).listen();
      netflix.player.setCondition('ended', {element: netflix._elements.video, event: 'ended'}).listen();
      netflix.player.setCondition('postplay', function() {
        return netflix._elements.player.hasClass('player-postplay');
      }).listen();
      netflix.player.setCondition('seeked', {element: netflix._elements.video, event: 'seeked'}).listen();
      netflix.player.setCondition('volumechange', {element: netflix._elements.video, event: 'volumechange'}).listen();
    });

    netflix.player.listen('ready');
  };

  // Player Events
  Eventable(netflix.player, $);
  // Player Event conditions are defined in player.setup()
  netflix.player.registerEvent('ready', function() {
    var oldUI = $("#netflix-player").length && $("#netflix-player .player-play-pause").length && $("#netflix-player video").length;
    var newUI = $(".nf-player-container").length && $(".nf-player-container video").length;
    var UI22 = $("[data-uia=player]").length && $("[data-uia=player] video").length;
    if (newUI) netflix.uiVersion = 'nf';
    if(UI22) netflix.uiVersion = '22';
    return oldUI || newUI || UI22;
  }, true);
  netflix.player.registerEvent('play');
  netflix.player.registerEvent('playing');
  netflix.player.registerEvent('pause');
  netflix.player.registerEvent('timeupdate');
  netflix.player.registerEvent('buffering');
  netflix.player.registerEvent('ended');
  netflix.player.registerEvent('postplay', function(){return false}, true);
  netflix.player.registerEvent('seeked');
  netflix.player.registerEvent('volumechange');

  // Player Controls
  netflix.player.play = function() {
      if (netflix.player.isPaused()) {
        netflix._elements.playPauseButton.click();
      }
  };

  netflix.player.pause = function() {
    if (netflix.player.isPlaying()) {
      netflix._elements.playPauseButton.click();
    }
  };

  netflix.player.isPlaying = function() {
    if (netflix.page.isPlayer()) {
      return netflix._elements.playPauseButton.attr('aria-label') == 'Pause';
    }
    return false;
  };

  netflix.player.isPaused = function() {
    if (netflix.page.isPlayer()) {
      return !netflix.player.isPlaying();
    }
    return false;
  };

  netflix.player.isBuffering = function() {
    return $("#player-playback-buffering").hasClass('player-active');
  };

  netflix.player.seekTo = function(seconds) {
    if (netflix.page.isPlayer()) {
      if (typeof seconds !== "undefined") {
        netflix.util.jiggleMouse(netflix._elements.slider.bar);
        var pixelsPerSeconds = netflix._elements.slider.bar.width()/netflix.player.getDuration();
        var pixels = seconds * pixelsPerSeconds;
        setTimeout(function() {
          netflix.util.triggerClick(netflix._elements.slider.bar, {x: pixels});
        }, 0);
      }
    }
  };

  netflix.player.getCurrentTime = function() {
    if (!netflix._elements.video) return 0;
    return netflix._elements.video.currentTime;
  };

  netflix.player.getDuration = function() {
    return netflix._elements.video.duration;
  };

  netflix.player.isMuted = function() {
    return netflix.player.getVolume() == 0;
  };

  netflix.player.mute = function() {
    if (!netflix.player.isMuted()) {
      netflix.util.triggerClick(netflix._elements.volume.button);
      return true;
    }
    return false;
  };

  netflix.player.unMute = function() {
    if (netflix.player.isMuted()) {
      netflix.util.triggerClick(netflix._elements.volume.button);
      return true;
    }
    return false;
  };

  netflix.player.getVolume = function() {
    return netflix._elements.video.volume;
  };

  netflix.player.setVolume = function(volume) {
    if (typeof volume !== "undefined") {
      // add a ceil of 1 and a floor of 0
      volume = (volume < 0) ? 0 : ((volume > 1) ? 1 : volume);

      netflix.util.triggerHover(netflix._elements.volume.button);
      setTimeout(function() {
        var pixelsInBar = netflix._elements.volume.bar.height();
        var pixels = pixelsInBar - volume * pixelsInBar; // calculate offset from top
        netflix.util.triggerClick(netflix._elements.volume.bar, {y: pixels});
      }, 100);
    }
  };

  netflix.player.nextEpisode = function() {
    var button = $('.nfp-button-control.player-next-episode');
        button = button.length > 0 ? button : $('.postplay-still-container.uitracking-state-visible');

    netflix.util.triggerClick(button);
  };

  netflix.player.backToBrowse = function() {
    var button = $('.nf-player-container > a.player-back-to-browsing');
        button = button.length > 0 ? button : $('.button.back-to-browsing');

    netflix.util.triggerClick(button);
  };

  netflix.player.isFullscreen = function() {
    return netflix._elements.fullscreenButton.attr('aria-label') == "Exit Fullscreen";
  };

  netflix.player.toggleFullscreen = function() {
    netflix._elements.fullscreenButton.click();
    return netflix.player.isFullscreen();
  };

  // Player Information
  netflix.player.getId = function() {
    return netflix.page._path.replace('/watch/', '');
  };

  netflix.player.getTitle = function() {
     var label = $('.nf-player-container span.player-status-main-title');
         label = label.length > 0 ? label : $('.nf-player-container h1.player-postplay-show-title');
    return label.text();
  };

  netflix.player.isShow = function() {
    return ($(".player-episode-selector").length > 0 && !$(".player-episode-selector").hasClass('player-hidden')) || $(".player-postplay-show-autoplay").length > 0
  };

  netflix.player.isMovie = function() {
    return !netflix.player.isShow();
  };

  netflix.player.getSeason = function() {
    if (netflix.player.isShow()) {
      var label = $('.nf-player-container div.playback-longpause-container .content h3:nth-child(3)');

      var regex = /Season (\d+): Ep. (\d+)/;


      return (label.length > 0) ? parseInt(regex.exec(label.text())[1]) : null;
    }
    else {
      return null;
    }
  };

  netflix.player.getEpisode = function() {
    if (netflix.player.isShow()) {
      var label = $('.nf-player-container div.playback-longpause-container .content h3:nth-child(3)');

      var regex = /Season (\d+): Ep. (\d+)/;


      return (label.length > 0) ? parseInt(regex.exec(label.text())[2]) : null;
    }
    else {
      return null;
    }
  };

  netflix.player.getEpisodeTitle = function() {
    if (netflix.player.isShow()) {
      var label = $('.nf-player-container div.playback-longpause-container .content h3:nth-child(4)');

      return (label.length > 0) ? label.text() : null;
    }
    else {
      return null;
    }
  };

  netflix.player.getEpisodeDescription = function() {
    if (netflix.player.isShow()) {
      var label = $('.nf-player-container div.playback-longpause-container .content p').last();

      return (label.length > 0) ? label.text() : null;
    }
    else {
      return null;
    }
  };

  netflix.player.getMovieDescription = function() {
    if (netflix.player.isMovie()) {
      var label = $('.nf-player-container div.playback-longpause-container .content p').last();

      return (label.length > 0) ? label.text() : null;
    }
    else {
      return null;
    }
  };

  netflix.player.getMovieRating = function() {
    if (netflix.player.isMovie()) {
      var label = $('.nf-player-container div.playback-longpause-container .content h3 span:nth-child(2)');

      return (label.length > 0) ? label.text() : null;
    }
    else {
      return null;
    }
  };

  netflix.player.getMovieYear = function() {
    if (netflix.player.isMovie()) {
      var label = $('.nf-player-container div.playback-longpause-container .content h3 span:nth-child(1)');

      return (label.length > 0) ? label.text() : null;
    }
    else {
      return null;
    }
  };

  netflix.page.on('load', function(event) {
    netflix.setup();
  });
  netflix.page.on('change', function(event) {
    netflix.setup();
  });


  return netflix;
}

function Eventable(element, $) {

  /**
   * registers a blank event if the given event does not exist
   */
  var defaultTheEvent = function(event) {
    if (!eventExists(event))
      element.registerEvent(event);
  }

  var eventExists = function(event) {
    return element._events.hasOwnProperty(event);
  }

  element._events = {};

  element.registerEvent = function(event, condition, single) {
    // console.log(event, condition, single);
    if (eventExists(event)) {
      element._events[event].setCondition(condition);
      element._events[event].setSingle(single);
    }
    else {
      element._events[event] = CustomEvent(event, condition, single);
    }

    return element._events[event];
  };

  element.setCondition = function(event, condition) {
    defaultTheEvent(event);

    return element._events[event].setCondition(condition);
  }

  element.setSingle = function(event, single) {
    defaultTheEvent(event);

    return element._events[event].setSingle(single);
  }

  element.on = function(event, fn) {
    defaultTheEvent(event);

    return element._events[event].on(fn);
  };

  element.one = function(event, fn) {
    defaultTheEvent(event);

    return element._events[event].one(fn);
  };

  element.off = function(event, fn) {
    if (eventExists(event))
      return element._events[event].off(fn);
    else
      return false;
  };

  element.trigger = function(event, e) {
    defaultTheEvent(event);

    return element._events[event].trigger(e);
  };

  element.listen = function(event) {
    if (eventExists(event))
      return element._events[event].listen();
    else
      return false;
  };

  element.kill = function(event) {
    if (eventExists(event))
      return element._events[event].kill();
    else
      return false;
  };



  /**
   * Returns an object for handling custom made, locally managed events
   *
   */
  function CustomEvent(name, condition, single) {

    var event = {
      name: name,
      _condition: null,
      _intervalRate: 250,
      _interval: false,
      _handlers: [],
      _single: null
    };


    event.setCondition = function(condition) {
      // set default condition
      var defaultCondition = function() {return false;};
      condition = condition ? condition : defaultCondition;

      var listening = event.isListening();

      if (listening)
        event.kill();
      event._condition = condition;
      if (listening)
        event.listen();

      return event;
    };

    event.setSingle = function(single) {
      single = (typeof single !== 'undefined') ? single : false;
      event._single = single;

      return event;
    };

    /**
     * Add a function to be fired when the event happens
     *
     * @param fn Function - the function to be fired
     */
    event.on = function(fn) {

      event._handlers.push(fn);

      return fn;
    };

    /**
     * Add a function to be fired once when the event happens
     *
     * @param fn Function - the function to be fired
     */
    event.one = function(fn) {
      var removableFn = function(e) {
        fn(e);
        event.off(removableFn);
      };

      return event.on(removableFn);
    };

    /**
     * Remove a function
     *
     * @param fn Function - the function to be removed
     */
    event.off = function(fn) {
      // if no function is given remove all the event handlers
      if (typeof fn == 'undefined') {
        event._handlers = [];

        return true;
      }

      // if its a function get the index of it and remove it
      if($.isFunction(fn)) {
        var index = event._handlers.indexOf(fn);

        if (index < 0)
          return false;

        event._handlers.splice(index, 1);
        return true;
      }

      return false;
    };

    /**
     * Fire the event
     *
     * loop through the handlers and fire them with the event data passed in
     * @param e - data to be passed to the handler
     */
    event.trigger = function(e) {
      // if the event should only be fired once then turn off listening
      if (event._single) {
        event.kill();
      }

      for (var index = event._handlers.length - 1; index >= 0; index--) {
        event._handlers[index](e);
      }

      return true;
    };

    /**
     * Listen for the event condition to be met
     *
     */
    event.listen = function() {
      // if its already listening return true
      if (event.isListening())
        return true;

      // if the condition is a function for a custom event
      if($.isFunction(event._condition)) {
        event._interval = setInterval(function() {
          var condition = event._condition();
          if (condition != false)
            event.trigger(condition);
        }, event._intervalRate);

        return true;
      }

      // if the condition is an object for just wrapping an element's event
      if($.isPlainObject(event._condition)
          && event._condition.hasOwnProperty('element')
          && event._condition.hasOwnProperty('event')) {

        event._condition.method = function(e) {
          event.trigger(e);
        };

        event._condition.element.addEventListener(event._condition.event, event._condition.method);
        event._interval = true;

        return true;
      }

      return false;
    };

    event.isListening = function() {
      return event._interval != false;
    }

    /**
     * Stop listening for the event condition
     *
     */
    event.kill = function() {
      // if the condition is a function for a custom event
      if($.isFunction(event._condition)) {
        clearInterval(event._interval);

        event._interval = false;
        return true;
      }

      // if the condition is an object for just wrapping an element's event
      if($.isPlainObject(event._condition)
          && event._condition.hasOwnProperty('element')
          && event._condition.hasOwnProperty('event')) {
        event._condition.element.removeEventListener(event._condition.event, event._condition.method);

        event._interval = false;
        return true;
      }

      return false;
    };

    // Set the condition and single from the params passe d into the constructor using the above delcared functions
    event.setCondition(condition);
    event.setSingle(single);

    return event;
  }
}


