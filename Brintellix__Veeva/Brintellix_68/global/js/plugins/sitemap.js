require([
    'text!plugins/template/sitemap.html',
    'text!plugins/template/sitemap_multiflows.html'
], function(template, template_multiflows) {
    if (drcom.isPhantom) return;

    if (drcom.isMultiFlow) {
        // multi flows
        Drcom.SiteMap = Drcom.Controller.extend({
            pluginName: "drcom_sitemap",
            init: function (el, options) {
                options.iscrollOptions = $.extend({}, {
                    zoom: true,
                    
                    scrollX: true,

                    scrollbars: "custom",
                    bounce: false,
                    hideScrollbar: false,
                    fixedScrollbar: true,
                    enableDoubleTap: false,
                    useTransform: true,

                    zoomStartOverride: {scope: this, fn: this.zoomStartOverride},
                    zoomOverride: {scope: this, fn: this.zoomOverride},
                    zoomEndOverride: {scope: this, fn: this.zoomEndOverride},

                    zoomEnd: this.callbackEvent('onZoomEnd'),
                }, options.iscrollOptions);

                this.super.init.apply(this, [el, options]);
                this.currentMenuId = drcom.storage.get("prevSlide") || drcom.menuItem;
                drcom.waitForPlayer($.proxy(this.render, this));
            },

            bindEvents: function () {
                this.on("tapone", $('.tabs .content', this.element), "li:not(.disabled)", this.callbackEvent("li:not(.disabled) tapone"));
                this.on("tapone", this.element, ".tab-btn", this.callbackEvent("tab tapone"));
            },

            "li:not(.disabled) tapone": function (el, ev) {
                var toFlowId = this.currentFlow, 
                    slide = drcom.getSlide(el.attr("menu-id"), toFlowId);
                drcom.gotoPresentation(slide.name, toFlowId);
                ev.stopImmediatePropagation();
            },

            "tab tapone": function(el) {
                el = $(el);
                var flowId = el.attr('flow-id'),
                    flows = drcom.allFlowKeys();
                if (flowId === flows[0] && !conf.showHome) {
                    var slide = drcom.getSlide(1, flowId);
                    drcom.gotoPresentation(slide.name, flowId);
                } else {
                    if (flowId !== this.currentTabBtn.attr('flow-id')) {
                        el.addClass('actived');
                        this.currentTabBtn.removeClass('actived');
                        this.currentTabBtn = el;

                        this.currentFlow = flowId;
                        this._switchSitemap();
                    }
                }
            },

            render: function () {
                this.currentFlow = drcom.currentFlowId;

                if (this._needRender()) {
                    this.element.append(_.template(template_multiflows)({
                        data: menudata
                    }));
                }

                // current tab and update sitemap view (for static)
                this.currentTab = this.getTabOfFlow(this.currentFlow);
                this.headersHeight = this.currentTab.find('.headers').height();
                this._updateSitemapView();

                // add tap event for tab button + sitemap
                this.bindEvents();

                var allContents = $('.tabs .content', this.element),
                    allHeaders = $('.tabs .headers-content', this.element),
                    op = this.options.iscrollOptions,
                    scaledHeight = this.headersHeight*op.zoomStart,
                    style = '-webkit-transform-origin: 0px 0px; -webkit-transform: translate(0px, 0px) scale(' + op.zoomStart + ') translateZ(0px);';

                allHeaders.attr('style', style);
                allHeaders.parent().height(scaledHeight);

                if (!this.allScrolls) {
                    this.allScrolls = {};
                    var count = 0,
                        flows = drcom.allFlowKeys();
                    _.each(flows, function(flowId) {
                        var tab = this.getTabOfFlow(flowId);
                        tab.show();

                        var options = $.extend({headerEl: $(allHeaders[count])}, op);
                        sitemapScroll = new IScroll(allContents[count], options);
                        sitemapScroll.zoom(op.zoomStart || 1, 629, 442, 0);

                        // hide other tabs
                        if (flowId !== this.currentFlow) tab.hide();

                        // keep track of all iscrolls
                        this.allScrolls[flowId] = sitemapScroll;
                        count++;
                    }, this);
                }

                // show the current tab
                this.currentTab.show();

                // update current active slide
                this._updateCurrentSlide();
                this._updateScrollBar();
            },

            getActiveScroll: function() {
                return this.allScrolls[this.currentFlow];
            },

            getActiveHeaders: function() {
                return this.currentTab.find('.tab-content .headers-content');
            },

            getActiveContent: function() {
                return this.currentTab.find('.tab-content .content');
            },

            getTabOfFlow: function(flowId) {
                return $('.tabs .tab[flow-id=' + flowId + ']', this.element);
            },

            zoomStartOverride: function(e) {
                var touch1 = e.touches[0],
                    touch2 = e.touches[1];
                this.dist = this._distance({
                    x: touch1.pageX,
                    y: touch1.pageY
                }, {
                    x: touch2.pageX,
                    y: touch2.pageY
                });
            },

            zoomOverride: function(e) {
                if (this.customZoom) return;

                var touch1 = e.touches[0],
                    touch2 = e.touches[1];

                var dist = this._distance({
                    x: touch1.pageX,
                    y: touch1.pageY
                }, {
                    x: touch2.pageX,
                    y: touch2.pageY
                });

                var diff = dist - this.dist,
                    diffAbs = Math.abs(diff),
                    scroll = this.getActiveScroll(),
                    current = this.currentTab.find('.content .current'),
                    active = current.length ? current[0] : null,
                    time = 500;
                
                if (diffAbs >= 20) {
                    this.customZoom = true;
                    if (diff > 0) {
                        // alert(diff);
                        if (active && scroll.scale != scroll.options.zoomMax) {
                            scroll.zoomToElement(active, scroll.options.zoomMax, time, true);
                        } else {
                            scroll.zoom(scroll.options.zoomMax, 0, 0, time);
                        }
                    } else {
                        if (active && scroll.scale != scroll.options.zoomMin) {
                            scroll.zoomToElement(active, scroll.options.zoomMin, time, true);
                        } else {
                            scroll.zoom(scroll.options.zoomMin, 0, 0, time);
                        }
                    }
                    
                    this.onZoomEnd();

                    var self = this;
                    setTimeout(function() {
                        self.customZoom = false;
                    }, 400);
                }
            },

            zoomEndOverride: function() {},

            onZoomEnd: function() {
                this._updateZoomBtnState();

                this._updateScrollBar();
                this._updateHeaderStyle(true);
                this._updateHeaderParentHeight(true);
            },

            // HELPERS
            _needRender: function() {
                if (!$('.tabs', this.element).length) return true;

                var allContents = this.element.find('.content'),
                    length = drcom.allFlowKeys().length;
                if (allContents.length < length) {
                    return true;
                }

                return false;
            },

            _distance: function(p1, p2) {
                return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
            },

            _updateSitemapView: function() {
                // update tab button
                var tabBtns = $('.tab-btn-bar .tab-btn', this.element),
                    keys = drcom.allFlowKeys();
                _.each(tabBtns, function(el, i) {
                    var flowId = keys[i];
                    $(el).attr('flow-id', flowId).removeClass('actived');
                    if (flowId === this.currentFlow) {
                        this.currentTabBtn = $(el);
                        this.currentTabBtn.addClass('actived');
                    }
                }, this);

                // remove scrollbars if any
                $('.iScrollLoneScrollbar,.iScrollVerticalScrollbar,.iScrollHorizontalScrollbar', this.element).remove();
            },

            _updateScrollBar: function() {
                $('.tab-content').each(function(i, el) {
                    el = $(el);
                    var content = el.find('.content');
                    if ($('.iScrollLoneScrollbar', content).length) {
                        $('.iScrollLoneScrollbar', content).insertAfter(content);
                    }
                    
                    if ($('.iScrollVerticalScrollbar', content).length) {
                        $('.iScrollVerticalScrollbar', content).insertAfter(content);
                    }

                    if ($('.iScrollHorizontalScrollbar', content).length) {
                        $('.iScrollHorizontalScrollbar', content).insertAfter(content);
                    }
                });
            },

            _updateCurrentSlide: function() {
                var menuId = this.currentMenuId;
                
                if (this.currentTab.length) {
                    var activeContent = this.getActiveContent(),
                        activeHeaders = this.getActiveHeaders(),
                        contentLi = activeContent.find('>ul>li'),
                        headerLi = activeHeaders.find('>li'),
                        scroller = this.allScrolls[this.currentFlow];

                    for (var i = 0; i < contentLi.length; i++) {
                        var el = $(contentLi[i]);
                        if (el.attr('menu-id') == menuId) {
                            el.addClass('current');
                            $(headerLi[i]).addClass('current');
                            scroller.zoomToElement(el[0], scroller.scale, 0, false);
                            break;
                        } else {
                            var subLi = el.find('ul>li');
                            if (subLi.length) {
                                var found = false;
                                for (var j = 0; j < subLi.length; j++) {
                                    var subel = $(subLi[j]);
                                    if (subel.attr('menu-id') == menuId) {
                                        found = true;
                                        subel.addClass('current');
                                        $(headerLi[i]).addClass('current');
                                        scroller.zoomToElement(subel[0], scroller.scale, 0, false);
                                        break;
                                    }
                                }

                                if (found) break;
                            }
                        }
                    }
                }
            },

            _updateHeaderStyle: function(shouldUpdatePosition) {
                var styleObj = this._styleForHeader(),
                    activeHeaders = this.getActiveHeaders();
                activeHeaders.attr('style', styleObj.style);
                if (shouldUpdatePosition) {
                    activeHeaders.parent().css({
                        '-webkit-transform': 'translate(0, ' + styleObj.translateY + 'px)'
                    });
                }
            },

            _updateHeaderParentHeight: function(withTransition) {
                var scale = this.getActiveScroll().scale,
                    activeHeaders = this.getActiveHeaders();
                activeHeaders.parent().css({
                    '-webkit-transition': (withTransition ? '400ms' : 'none'),
                    height: scale*this.headersHeight
                });
            },

            _resetHeaderParentPosition: function() {
                var activeHeaders = this.getActiveHeaders();
                activeHeaders.parent().css({
                    '-webkit-transition': '400ms',
                    '-webkit-transform': 'translate(0, 0)'
                });
            },

            _styleForHeader: function() {
                var scroll = this.getActiveScroll(),
                    style = scroll.scroller.getAttribute('style'),
                    strToFind = "translate(";

                if (style.indexOf(strToFind) >= 0) {
                    var firstIndex = style.indexOf(strToFind),
                        endIndex = -1;

                    for (var i = firstIndex; i < style.length; i++) {
                        if (style.charAt(i) === ")") {
                            endIndex = i;
                            break;
                        }
                    }

                    if (endIndex >= 0) {
                        var translates = style.substring(firstIndex + strToFind.length, endIndex).split(", "),
                            translateX = translates[0],
                            translateY = parseInt(translates[1], 10);
                        translateY = translateY < 0 ? 0 : translateY;

                        var part1 = style.substring(0, firstIndex),
                            part2 = " translate(" + translateX + ", 0)",
                            part3 = style.substring(endIndex + 1, style.length);
                        return {
                            style: part1 + part2 + part3,
                            translateY: translateY
                        };
                    }
                }

                return "";
            },

            _switchSitemap: function() {
                this.currentTab.hide();
                this.currentTab = this.getTabOfFlow(this.currentFlow);
                this.currentTab.show();

                this._updateZoomBtnState();
            },

            _updateZoomBtnState: function() {
                if (this.zoomBtn) {
                    var scroll = this.getActiveScroll();
                    if (scroll.scale > scroll.options.zoomMin) {
                        this.zoomBtn.addClass('zoom-in');
                    } else {
                        this.zoomBtn.removeClass('zoom-in');
                    }
                }
            },
        });
    } else {
        // single flow
        Drcom.SiteMap = Drcom.Controller.extend({
            pluginName: "drcom_sitemap",
            init: function (el, options) {
                options.iscrollOptions = $.extend({}, {
                    zoom: true,
                    
                    scrollX: true,

                    scrollbars: "custom",
                    bounce: false,
                    hideScrollbar: false,
                    fixedScrollbar: true,
                    enableDoubleTap: false,
                    useTransform: true,

                    zoomStartOverride: {scope: this, fn: this.zoomStartOverride},
                    zoomOverride: {scope: this, fn: this.zoomOverride},
                    zoomEndOverride: {scope: this, fn: this.zoomEndOverride},

                    zoomEnd: this.callbackEvent('onZoomEnd'),
                }, options.iscrollOptions);

                this.currentMenuId = drcom.storage.get("prevSlide") || drcom.menuItem;
                
                this.super.init.apply(this, [el, options]);
                this.render();
            },
            bindEvents: function () {
                this.on("tapone", this.content, "li:not(.disabled)", this.callbackEvent("li:not(.disabled) tapone"));
            },
            "li:not(.disabled) tapone": function (el, ev) {
                drcom.gotoSlide(el.attr("menu-id"));
                ev.stopImmediatePropagation();
                return false;
            },
            render: function () {
                if (this._needRender()) {
                    // remove if any
                    $('.content-wrapper', this.element).remove();
                    this.element.append(_.template(template)({
                        data: menudata
                    }));
                }

                this.headers = $('.headers-content', this.element);
                this.content = $('.content', this.element);
                this.headersHeight = $('.headers', this.element).height()/this.options.iscrollOptions.zoomStart;

                this._calculateContentWidth();
                this.bindEvents();

                var op = this.options.iscrollOptions,
                    style = '-webkit-transform-origin: 0px 0px; -webkit-transform: translate(0px, 0px) scale(' + op.zoomStart + ') translateZ(0px);';

                this.headers.attr('style', style);

                this.sitemapIscroll = new IScroll(this.content[0], $.extend({headerEl: this.headers}, op));
                if (op.zoomStart) {
                    this.sitemapIscroll.zoom(op.zoomStart, 629, 442, 0);
                }
                
                this._updateCurrentSlide();
                this._updateScrollBar();
            },

            zoomStartOverride: function(e) {
                var touch1 = e.touches[0],
                    touch2 = e.touches[1];

                this.dist = this._distance({
                    x: touch1.pageX,
                    y: touch1.pageY
                }, {
                    x: touch2.pageX,
                    y: touch2.pageY
                });
            },

            zoomOverride: function(e) {
                if (this.customZoom) return;

                var touch1 = e.touches[0],
                    touch2 = e.touches[1];

                var dist = this._distance({
                    x: touch1.pageX,
                    y: touch1.pageY
                }, {
                    x: touch2.pageX,
                    y: touch2.pageY
                });

                var diff = dist - this.dist,
                    diffAbs = Math.abs(diff),
                    scroll = this.sitemapIscroll,
                    active = this.content.find('.active');
                if (!active.length) active = this.content.find('li');
                active = active[0];

                if (diffAbs >= 20) {
                    this.customZoom = true;
                    if (diff > 0) {
                        if (scroll.scale < scroll.options.zoomMax)
                            scroll.zoomToElement(active, scroll.options.zoomMax, 400, true);
                    } else {
                        if (scroll.scale > scroll.options.zoomMin)
                            scroll.zoomToElement(active, scroll.options.zoomMin, 400, true);
                    }

                    this.onZoomEnd();

                    var self = this;
                    setTimeout(function() {
                        self.customZoom = false;
                    }, 400);
                }
            },

            zoomEndOverride: function() {},

            onZoomEnd: function() {
                if (this.sitemapIscroll.scale > this.sitemapIscroll.options.zoomMin) {
                    $('.zoom-btn').addClass('zoom-in');
                } else {
                    $('.zoom-btn').removeClass('zoom-in');
                }

                this._updateScrollBar();
                this._updateHeaderStyle();
                this._updateHeaderParentHeight(true);
            },

            /* HELPERS */
            _calculateContentWidth: function() {
                var ul = this.content.find('>ul'),
                    li = ul.find('>li'),
                    width = 0;
                li.each(function() {
                    var el = $(this),
                        mr = parseInt(el.css('margin-right')),
                        mf = parseInt(el.css('margin-left')),
                        pr = parseInt(el.css('padding-right')),
                        pf = parseInt(el.css('padding-left'));
                    width += el.width() + mr + mf + pr + pf;
                });
                ul.width(width);
            },

            _distance: function(p1, p2) {
                return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
            },

            _needRender: function() {
                if (!$('.content-wrapper .content', this.element).length) return true;
                if (!$('.content-wrapper .content li', this.element).length) return true;

                return false;
            },

            _updateScrollBar: function() {
                if ($('.iScrollVerticalScrollbar', this.content).length) {
                    $('.iScrollVerticalScrollbar').insertAfter(this.content);
                }

                if ($('.iScrollHorizontalScrollbar', this.content).length) {
                    $('.iScrollHorizontalScrollbar').insertAfter(this.content);
                }
            },

            _updateCurrentSlide: function() {
                var menuId = this.currentMenuId,
                    contentLi = this.content.find('>ul>li'),
                    headerLi = this.headers.find('>li'),
                    scroller = this.sitemapIscroll;

                for (var i = 0; i < contentLi.length; i++) {
                    var el = $(contentLi[i]);
                    if (el.attr('menu-id') == menuId) {
                        el.addClass('current');
                        $(headerLi[i]).addClass('current');
                        scroller.zoomToElement(el[0], scroller.scale, 0, false);
                        //scroller.scrollToElement(el[0], 0);
                        break;
                    } else {
                        var subLi = el.find('ul>li');
                        if (subLi.length) {
                            var found = false;
                            for (var j = 0; j < subLi.length; j++) {
                                var subel = $(subLi[j]);
                                if (subel.attr('menu-id') == menuId) {
                                    found = true;
                                    subel.addClass('current');
                                    $(headerLi[i]).addClass('current');
                                    scroller.zoomToElement(subel[0], scroller.scale, 0, false);
                                    //scroller.scrollToElement(subel[0], 0);
                                    break;
                                }
                            }

                            if (found) break;
                        }
                    }
                }
            },

            _updateHeaderStyle: function() {
                var style =  this._styleForHeader();
                this.headers.attr('style', this._styleForHeader());
            },

            _updateHeaderParentHeight: function(withTransition) {
                this.headers.parent().css({
                    '-webkit-transition': (withTransition ? 'all 0.4s' : 'none'),
                    height: this.sitemapIscroll.scale*this.headersHeight
                });
            },

            _resetHeaderParentPosition: function() {
                this.headers.parent().css({
                    '-webkit-transition': 'all 0.15s',
                    '-webkit-transform': 'translate(0, 0)'
                });
            },

            _styleForHeader: function() {
                var style = this.sitemapIscroll.scroller.getAttribute('style'),
                    strToFind = "translate(";

                if (style.indexOf(strToFind) >= 0) {
                    var firstIndex = style.indexOf(strToFind),
                        endIndex = -1;

                    for (var i = firstIndex; i < style.length; i++) {
                        if (style.charAt(i) === ")") {
                            endIndex = i;
                            break;
                        }
                    }

                    if (endIndex >= 0) {
                        var translates = style.substring(firstIndex + strToFind.length, endIndex).split(", "),
                            translateX = translates[0],
                            translateY = parseInt(translates[1], 10);
                        translateY = translateY < 0 ? 0 : translateY;

                        var part1 = style.substring(0, firstIndex),
                            part2 = " translate(" + translateX + ", 0)",
                            part3 = style.substring(endIndex + 1, style.length);
                        return part1 + part2 + part3;
                    }
                }

                return "";
            }
        });
    }
    $.fn.drcom_sitemap = function (options) {
        this.each(function () {
            new Drcom.SiteMap($(this), options);
        });
        return this;
    };

    // init sitemap if config has it
    var conf = drcom.config.sitemap;
    if (conf && conf.isShow) {
        drcom.disableSwipe();

        // create elements if not any
        var sitemapEl = $('#sitemap'),
            backBtn = $('.backBtn'),
            container = $('#container');

        if (!sitemapEl.length) {
            sitemapEl = $("<div id='sitemap' class='transition'></div>").appendTo(container);
        }

        // back button
        if (!backBtn.length) {
            backBtn = $("<div class='backBtn'></div>").appendTo(container);
        }
        backBtn.bind('tapone', function () {
            drcom.gotoSlide(drcom.storage.get("prevSlide") || drcom.menuItem);
        });

        // create sitemap controller
        var options = {
            zoomMin: conf.zoomMin || 0.4,
            zoomMax: conf.zoomMax || 1,
            zoomStart: conf.zoomStart || 0.4,
        }
        if (!conf.panToZoom) {
            options = $.extend(options, {
                zoomStartOverride: false,
                zoomOverride: false,
                zoomEndOverride: false,
                zoom: false
            });
        }
        if (options.zoomStart < options.zoomMin) options.zoomStart = options.zoomMin;
        if (options.zoomStart > options.zoomMax) options.zoomStart = options.zoomMax;
        
        drcom.sitemap = sitemapEl.drcom_sitemap({
            iscrollOptions: options
        }).controller();

        if (drcom.toolbar) { // if toolbar has initialized
            // zoom btn listener
            var onZoomBtnPressed = function() {
                var ctrl = drcom.sitemap,
                    scroll = ctrl.getActiveScroll ? ctrl.getActiveScroll() : ctrl.sitemapIscroll,
                    current = ctrl.currentTab ? ctrl.currentTab.find('.content .current') : ctrl.element.find('.content .current'),
                    active = current.length ? current[0] : null,
                    time = 500;
                
                if (scroll.scale <= 1 && scroll.scale != scroll.options.zoomMin) {
                    if (active) {
                        scroll.zoomToElement(active, scroll.options.zoomMin, time, true);
                    } else {
                        scroll.zoom(scroll.options.zoomMin, 0, 0, time);
                    }
                } else if (scroll.scale != scroll.options.zoomMax) {
                    if (active) {
                        scroll.zoomToElement(active, scroll.options.zoomMax, time, true);
                    } else {
                        scroll.zoom(scroll.options.zoomMax, 0, 0, time);
                    }
                }
                
                ctrl.onZoomEnd();
            };

            // assign zoom button for sitemap controller
            drcom.sitemap.zoomBtn = drcom.toolbar.addButton("zoom-btn btn", "", onZoomBtnPressed);
        }
    }
});