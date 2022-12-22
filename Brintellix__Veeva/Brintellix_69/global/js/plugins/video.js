require([], function() {
    Drcom.Video = Drcom.Controller.extend({
        pluginName: "drcom_video",
        init: function (el, options) {
            this.super.init.apply(this, arguments);
            $.extend(this.options, {
                loop: false,
                controls: false,
                autoplay: false,

                controlbar: "controlbar",
                playpause: "playpause",
                stop: "stop",
                fullscreen: "fullscreen",
                replay: "replay",
                time: "time",
                seek: "seek",
                prev: "prev",
                next: "next",
                remain: "remain",
                srt: null,
                slider: {},
                translate: 4096,
                seekList: [],
                delay: 0,
                onPlay: function () { },
                onPause: function () { }
            }, this.options, options);

            this.seeking = false;
            this.canFullScren = false;
            this.media = this._prepareElement();

            if (typeof this.options.controls == "string")
                this._createControls();

            this._bindEvents();
            this.media.load();

            if (this.options.srt != null) {
                var opt = {};
                if (typeof this.options.srt == "string")
                    opt.container = $(this.options.srt);
                $.extend(opt, this.options.srt);
                $(this.media).drcom_srt(opt);
            }
        },
        //--------------Begin:Events--------------
        ".{playpause} tapone": function () { this.playpause(); },
        ".{fullscreen} tapone": function () { this.fullscreen(); },
        ".{seek} slidestop": function () { this.seeking = false; },
        ".{replay} tapone": function () { this.replay(); },
        ".{stop} tapone": function () { this.stop(); },
        ".{prev} tapone": function () { this.prev(); },
        ".{next} tapone": function () { this.next(); },
        ".{seek} slide": function (el, ev, slider) {
            this.seeking = true;
            var value = slider.value * this.media.duration / 100;
            this.seek(value);
        },
        //--------------Begin:Public--------------
        getSeekList: function () {
            if (this.options.seekList.length > 0) {
                return this.options.seekList;
            }
            var seekList = [];
            for (var i = 0; i < 4; i++) {
                seekList.push(Math.ceil((this.media.duration / 4) * i));
            }
            seekList.push(Math.ceil(this.media.duration));
            return seekList;
        },
        next: function () {
            var currentTime = this.media.currentTime;
            var listCharter = this.getSeekList();
            for (var i = 0; i < listCharter.length; i++) {
                if (currentTime < listCharter[i]) {
                    currentTime = listCharter[i];
                    this.seek(currentTime);
                    break;
                }
            }
        },
        prev: function () {
            var currentTime = this.media.currentTime;
            var listCharter = this.getSeekList();
            for (var i = 0; i < listCharter.length; i++) {
                if (currentTime < listCharter[i] && i > 0) {
                    currentTime = listCharter[i - 2];
                    this.seek(currentTime);
                    break;
                }
            }
        },
        play: function () { this.media.play(); },
        pause: function () { this.media.pause(); },
        playpause: function () {
            if (this.media.paused == true)
                this.play();
            else
                this.pause();
        },
        stop: function () {
            this.media.pause();
            this.seek(0);
        },
        seek: function (pos) {
            this.media.currentTime = pos;
        },
        fullscreen: function () {
            if (this.media.webkitEnterFullScreen != null && this.canFullScren == true)
                this.media.webkitEnterFullScreen();
        },
        replay: function () {
            this.seek(0);
            this.play();
        },
        //--------------End:Public--------------

        _bindEvents: function () {

            //next,prev button
            this.on("tapone", this.element, "." + this.options.next, this.callbackEvent(".{next} tapone"));
            this.on("tapone", this.element, "." + this.options.prev, this.callbackEvent(".{prev} tapone"));

            this.on("tapone", this.element, "." + this.options.playpause, this.callbackEvent(".{playpause} tapone"));
            this.on("tapone", this.element, "." + this.options.stop, this.callbackEvent(".{stop} tapone"));
            this.on("tapone", this.element, "." + this.options.fullscreen, this.callbackEvent(".{fullscreen} tapone"));
            this.on("tapone", this.element, "." + this.options.replay, this.callbackEvent(".{replay} tapone"));

            //seek
            this.on("slide", this.element, "." + this.options.seek, this.callbackEvent(".{seek} slide"));
            this.on("slidestop", this.element, "." + this.options.seek, this.callbackEvent(".{seek} slidestop"));

            var instance = this;

            //loop
            this.bind(this.media, "ended", function () {
                if (instance.options.loop == true) {
                    instance.replay();
                }
            });

            if (typeof this.options.controls == "string") {
                //update seek control
                this.bind(this.media, "timeupdate", function (e) {
                    if (instance._checkControl("time") == true)
                        instance._updateTime();
                    if (instance.seeking == false && instance._checkControl("seek") == true)
                        instance._updateSeek(Math.floor(this.currentTime));
                });
            }

            this.bind(this.media, "loadeddata", function () {
                $(instance.media).bind("playing.canplay seeked.canplay", function () {
                    $(instance.media).unbind("playing.canplay seeked.canplay");
                    instance._canplay();
                });
                if (instance.options.autoplay == true) {
                    instance.play();
                }
            });

            this.bind(this.media, "play.playpause", function () {
                instance._onPlay();
                instance.canFullScren = true;
                if (instance._checkControl("playpause") == true)
                    instance.controls.playpause.removeClass("pause").addClass("play");
            });
            this.bind(this.media, "pause.playpause", function () {
                instance._onPause();
                if (instance._checkControl("playpause") == true)
                    instance.controls.playpause.removeClass("play").addClass("pause");
            });
        },
        _onPlay: function () {
            this.options.onPlay.apply(this);
        },
        _onPause: function () {
            this.options.onPause.apply(this);
        },
        _canplay: function () {
            var instance = this;
            setTimeout(function () {
                $(instance.media).css({ "-webkit-transform": "initial", "left": "initial" });
            }, this.options.delay);
        },
        _prepareElement: function () {
            var translateX = this.options.translate, 
			video = $("<video></video>");
            video.css({ "-webkit-transform": 'translateX('+translateX+'px)' });
            var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
            if (isAndroid)
                video.css({ "left": translateX });
            if ($('video', this.element).length > 0) {
                this.element.empty();
            }
			for (var i = 0; i < this.element[0].attributes.length; i++) {
                var attr = this.element[0].attributes[i];
                if (attr.name == "id" || attr.name == "class" || attr.name == "src")
                    continue;
                video.attr(attr.name, attr.value);
            }
            $("<source></source>").attr("src", this.element.attr("src") + ".mp4").attr("type", "video/mp4").appendTo(video);
            this.element.append(video);
            this.videoMask = $("<div style='position:absolute;left:0px;top:0px;width:100%;height:100%;z-index:2'></div>").appendTo(this.element);
            return video[0];
        },
        _checkControl: function (name) {
            if (typeof this.options.controls != "string")
                return false;
            var split = this.options.controls.split(" ");
            for (var i = 0; i < split.length; i++)
                if (split[i] == name)
                    return true;
            return false;
        },
        _createControls: function () {
            this.controls = {};
            this.controls.controlbar = $("<div class='" + this.options.controlbar + "'></div>");

            if (this._checkControl("playpause") == true) {
                this.controls.playpause = $("<div class='button " + this.options.playpause + " pause'></div>");
                this.controls.controlbar.append(this.controls.playpause);
            }

            if (this._checkControl("stop") == true) {
                this.controls.stop = $("<div class='button " + this.options.stop + "'></div>");
                this.controls.controlbar.append(this.controls.stop);
            }
            if (this._checkControl("replay") == true) {
                this.controls.replay = $("<div class='button " + this.options.replay + "'></div>");
                this.controls.controlbar.append(this.controls.replay);
            }
            if (this._checkControl("fullscreen") == true) {
                this.controls.fullscreen = $("<div class='button " + this.options.fullscreen + "'></div>");
                this.controls.controlbar.append(this.controls.fullscreen);
            }
            if (this._checkControl("time") == true) {
                this.controls.time = $("<span class='" + this.options.time + "'>00:00</span>");
                this.controls.controlbar.append(this.controls.time);
            }
            if (this._checkControl("remain") == true) {
                this.controls.remain = $("<span class='" + this.options.remain + "'>00:00</span>");
                this.controls.controlbar.append(this.controls.remain);
            }
            if (this._checkControl("seek") == true) {
                this.controls.seek = $("<div class='" + this.options.seek + "'></div>");
                this.controls.controlbar.append(this.controls.seek);
                this.controls.seek.slider(this.options.slider);
            }

            if (this._checkControl("prev") == true) {
                this.controls.prev = $("<div class='button " + this.options.prev + "'></div>");
                this.controls.controlbar.append(this.controls.prev);
            }

            if (this._checkControl("next") == true) {
                this.controls.next = $("<div class='button " + this.options.next + "'></div>");
                this.controls.controlbar.append(this.controls.next);
            }

            this.element.append(this.controls.controlbar);
        },
        _updateTime: function () {
            time = this.media.currentTime;
            time = Math.floor(time);
            if (parseFloat(this.controls.time.data("time")) == time)
                return;
            this.controls.time.data("time", time);
            var h = Math.floor(time / 3600);
            var m = Math.floor(time / 60);
            var s = Math.floor(time % 60);
            h = h < 10 ? "0" + h : h;
            m = m < 10 ? "0" + m : m;
            s = s < 10 ? "0" + s : s;
            var strTime = m + ":" + s;
            this.controls.time.html(strTime);


            var time = Math.floor(this.media.duration - this.media.currentTime);
            var h = Math.floor(time / 3600);
            var m = Math.floor(time / 60);
            var s = Math.floor(time % 60);
            h = h < 10 ? "0" + h : h;
            m = m < 10 ? "0" + m : m;
            s = s < 10 ? "0" + s : s;
            var strTime = m + ":" + s;
			
			if(this.controls.remain){
				this.controls.remain.html("-" + strTime);
			}            
        },
        _updateSeek: function (duration) {
            if (parseFloat(this.controls.seek.data("duration")) == duration)
                return;
            if (this.controls.seek.length > 0) {
                this.controls.seek.data("duration", duration);
                var value = duration * 100 / this.media.duration;
                this.controls.seek.slider("value", value);
            }
        },
        destroy: function () {
            this.media.pause();
            $(this.media).css({ "-webkit-transform": 'translateX('+this.options.translate+'px)' });
            this.element.remove();
        }
    });
    $.fn.drcom_video = function (options) {
        this.each(function () {
            new Drcom.Video($(this), options);
        });
        return this;
    };

})();