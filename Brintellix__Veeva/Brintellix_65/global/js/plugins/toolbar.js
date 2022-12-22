require([], function() {
    Drcom.Toolbar = Drcom.Controller.extend({
        pluginName: "drcom_toolbar",
        config: drcom.config.toolbar,

        init: function (el, options) {
            this.super.init.apply(this, arguments);
            $.extend(this.options, {
                icon: true,
                piListCls: 'pi-list',
                alwayShowPiSubmenu : false
            }, options);
        },

        addAlertButton: function(className) {
            if (this.config.alert) {
                var btn = this.addButton(className, ""),
                    sound = this.config.alert.sound || 'global/images/alert/bell-ringing.mp3';
                btn.bind('tapone', this.onAlert.bind(this, btn));
                btn.bind('webkitAnimationEnd', this.onRingEnded.bind(this, btn));

                // init bell sound
                this.sound = $('<audio><source src="' + sound + '" type="audio/mpeg"></audio>').appendTo('body');
                this.sound.css({
                    position: 'absolute',
                    top: -99999,
                    left: -99999
                });
            }
        },

        onAlert: function(sender) {
            if (!this.alertTimer) {
                this.alertCount = 0;
                var endTime = (this.config.alert.time || 300)*1000
                    beforeEndTime = endTime - 30000;

                // 30s before ending and ending timer
                var handler = this.ringTheBell.bind(this, sender);
                setTimeout(handler, beforeEndTime);
                this.alertTimer = setTimeout(handler, endTime);
            }
        },

        onRingEnded: function(sender) {
            this.alertCount++;
            sender.removeClass('active');

            if (this.alertCount >= 2) {
                clearTimeout(this.alertTimer);
                this.alertTimer = null;
            }
        },

        playSound: function() {
            var sound = this.sound;
            if (sound) {
                sound = sound[0];

                sound.currentTime = 0;
                sound.play();
                setTimeout(function() {
                    sound.currentTime = 0;
                    sound.play();
                }, 6000);
            }
        },

        ringTheBell: function(el) {
            this.playSound();
            el.addClass('active');
        },

        addPiButton: function (className) {
            if (this.config.PI && this.config.PI.length) {
                var piList = $('.' + this.options.piListCls);
                if (piList.length) {
                    // just bind actions for item only
                    piList.find('div.piItem').bind('tapone', function() {
                        drcom.gotoSlide($(this).data('id'));
                    });
                }

                var self = this;
                this.addButton(className, "", function() {
                    var piList = $('.' + self.options.piListCls);
                    if (!piList.length) {
                        piList = self._addPIList();
                        self._reposition(piList, $(this));
                    }
                    
                    // show the pi list if length > 1
                    // else go to the slide directly
                    if (self.config.PI.length) {
                        if (self.config.PI.length > 1 || 
                            (self.config.alwayShowPiSubmenu === true)) {
                            if (piList.css('display') == "block") piList.hide();
                            else piList.show();
                        } else {
                            drcom.gotoSlide(self.config.PI[0].gotoSlide);
                        }
                    }
                });
            }
        },

        addApprovedCode: function(className) {
            var active = this.config.approvedCode && this.config.approvedCode !== "",
                cls = '.' + className.split(" ").join(".");
            
            var btn = $(cls),
                popup = $('.approved-popup'),
                self = this;
            if (!btn.length) {
                btn = $('<div class="' + className + '"></div>').appendTo(this.element);
            }
            if (!popup.length) {
                popup = $('<div class="approved-popup"></div>').appendTo(this.element);
            }

            if (active) {
                btn.addClass('active');

                var text = this.config.approvedCode,
                    popupContent = $('.popup-content', popup);
                if (!popupContent.length) {
                    popupContent = $('<div class="popup-content">' + text + '</div>');
                    popup.append(popupContent);
                }

                this._calculateTextWidth(text, popupContent, function(width) {
                    if (width > 575) width = 575;
                    popup.width(width);
                    
                    self._reposition(popup, btn);

                    btn.bind('tapone', function() {
                        popup.toggle();
                    });
                });
                
            } else {
                btn.unbind('tapone');
            }
        },

        addButton: function (className, label, callback) {
            var btn = $('.' + className);
            if (!btn.length) {
                label = this.options.icon ? '' : label;
                btn = $("<div class='" + className + "'>" + label + "</div>").appendTo(this.element);
            }

            if (callback) btn.bind("tapone", callback);
            return btn;
        },

        _addPIList: function() {
            var list = $("<div class='" + this.options.piListCls + "'></div>"),
                subItems = $('<div class="coverPiItems"></div>'),
                pis = this.config.PI,
                items = [];

            // add container
            this.element.append(list.append(subItems));

            // sub items
            var maxText = pis[0].title;
            _.each(pis, function(obj) {
                var item = $('<div class="piItem" data-id="' + obj.gotoSlide + '">' + obj.title + '</div>');

                // add item to sub container
                subItems.append(item);

                // bind tap event for each item
                item.bind('tapone', function() {
                    drcom.gotoSlide($(this).data('id'));
                });
                items.push(item);

                if (obj.title.length > maxText.length) maxText = obj.title;
            }, this);

            // set dynamic width for items
            this._calculateTextWidth(maxText, items[0], function(width) {
                _.each(items, function(item) {
                    item.width(width);
                });
            });

            return list;
        },

        _reposition: function(el, compareEl) {
            var top = parseInt(compareEl.css('top'), 10),
                h = compareEl.height(),
                lh = el.height(),
                av = -((lh-h)/2);

            el.css({
                top: top + av
            });
        },

        _calculateTextWidth: function(text, forEl, callback) {
            var span = $('<span style="visibility: hidden; white-space: nowrap;">' + text + '</span>');
            $(document.body).append(span);

            var oldWidth = span.width(),
                timeout = 1000,
                hasResized = false,
                self = this;

            span.resize(function(e, w, h) {
                if (oldWidth != w) {
                    hasResized = true;
                    var returnWidth = w + self._getMarginsAndPaddings(forEl);
                    span.remove();

                    if (callback) callback(returnWidth);
                }
            });

            span.css({
                'font-family': forEl.css('font-family'),
                'font-size': forEl.css('font-size'),
                'font-weight': forEl.css('font-weight')
            });

            setTimeout(function() {
                if (!hasResized) {
                    hasResized = true;
                    var returnWidth = span.width() + self._getMarginsAndPaddings(forEl);
                    if (callback) callback(returnWidth);
                }
                span.remove();
            }, timeout);
        },

        _getMarginsAndPaddings: function(forEl) {
            var marginRight = parseInt(forEl.css('margin-right'), 10),
                marginLeft = parseInt(forEl.css('margin-left'), 10),
                paddingRight = parseInt(forEl.css('padding-right'), 10),
                paddingLeft = parseInt(forEl.css('padding-left'), 10),
                mp = marginRight + marginLeft + paddingRight + paddingLeft;

            return mp;
        },
    });
    $.fn.drcom_toolbar = function (options) {
        $(this).each(function () {
            new Drcom.Toolbar($(this), options);
        });
        return $(this);
    };

    // if show then create it
    if (drcom.config.toolbar && drcom.config.toolbar.isShow) {
        var toolbar = $('.toolbar');
        if (!toolbar.length) toolbar = $("<div class='toolbar'></div>").appendTo('#container');
        drcom.toolbar = toolbar.drcom_toolbar().controller();

        // add all neccesary buttons
        drcom.toolbar.addPiButton("pi-btn btn");
        drcom.toolbar.addApprovedCode('approved-code-btn btn');
        drcom.toolbar.addAlertButton('alert-btn btn');
    }
});