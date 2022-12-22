require([
    'text!plugins/template/callsummary.html'
], function(template) {
    // Tracking objects
    var SummaryTracker = function() {
    };
    SummaryTracker.prototype = {
        options: {
            starttime: null,
            duration: 0
        },
        saveData: function() {
            var data = {},
                    storageData = drcom.storage.get('summaryData'),
                    slide = drcom.getCurrentSlide(),
                    k = slide.id,
                    flowId = drcom.currentFlowId,
                    ops = this.options;

            if (storageData)
                data = storageData[flowId] || {};
            data[k] = {
                name: slide.name,
                flow: flowId,
                starttime: ops.starttime,
                duration: ops.duration,
                topic: slide.topic
            };

            var sData = {};
            sData[flowId] = data;
            drcom.storage.set('summaryData', sData);
        },
        duration: function() {
            return ((new Date()) - this.options.starttime) / 1000;
        }
    };

    var PopupTracker = function() {
    };
    PopupTracker.prototype = {
        options: {
            topic: '',
            flow: drcom.currentFlowId,
            name: '',
            startTime: null,
            duration: 0
        },
        createData: function(el) {
            var el = $(el),
                    closePu = el.find('.close_pu'),
                    slide = drcom.getCurrentSlide(),
                    topic = el.attr('topic') || '',
                    startTime = new Date(),
                    ops = this.options;
            ops.startTime = startTime;
            ops.topic = topic;
            ops.name = slide.name;

            if (closePu.length) {
                closePu.bind('tapone', this.saveData.bind(this));
            }
        },
        saveData: function() {
            var ops = this.options;
            if (ops.topic.length < 1)
                return;

            ops.duration = (new Date() - ops.startTime) / 1000;
            var data = {}, sData = {},
                    flowId = drcom.currentFlowId;
            if (drcom.storage.get('popupData')) {
                data = drcom.storage.get('popupData')[flowId] || {};
                sData = drcom.storage.get('popupData');
            }
            data[ops.topic] = ops;
            sData[flowId] = data;
            drcom.storage.set('popupData', sData);
        }
    };
    window.PopupTrack = new PopupTracker();

    Drcom.CallSummary = Drcom.Controller.extend({
        pluginName: "drcom_callsummary",
        summaryTrack: new SummaryTracker(),
        popupTrack: PopupTrack,
        nextCall_text: '',
        init: function(el, options) {
            this.super.init.apply(this, [el, options]);
            drcom.waitForPlayer($.proxy(this.render, this));

            $(document).bind('beforeGotoSlide', $.proxy(this.onBeforeGotoSlide, this));
            drcom.ready($.proxy(this.onReady, this));
        },
        render: function() {
            if (this._isCallSummaryPage()) {
                // remove wrapper if any
                this.element.find('#wrapper').remove();

                // back button
                var backBtn = $('.backBtn');
                if (!backBtn.length) {
                    backBtn = $("<div class='backBtn'></div>").appendTo(this.element);
                }
                backBtn.bind('tapone', this.onBack);

                // render the page
                this._renderPage();
            } else
                this.startSavingSlide();
        },
        startSavingSlide: function() {
            if (!this.savingTimer) {
                var handler = $.proxy(this.onSavingSlide, this);
                this.savingTimer = setTimeout(handler, 5000);
            }
        },
        onBeforeGotoSlide: function() {
            var st = this.summaryTrack,
                    pt = this.popupTrack;
            st.options.duration = st.duration();
            st.saveData();

            $('#container').find('.popup').each(function() {
                if ($(this).css('display') == 'block')
                    pt.saveData();
            });
        },
        onReady: function() {
            this.summaryTrack.options.starttime = new Date();
        },
        onReload: function() {
            if (this._isCallSummaryPage()) {
                this.element.find('#wrapper').remove();
                this._renderPage();
            }
        },
        onSavingSlide: function() {
            var allPages = this._allTrackingPages();
            var visited = drcom.storage.get('visited') || {},
                    visitedSlides = visited[drcom.currentFlowId] || {},
                    currentSlide = drcom.getCurrentSlide();
            if (!currentSlide || $.inArray(currentSlide.id, allPages[drcom.currentFlowId]) < 0)
                return;

            var isExisted = _.some(visitedSlides, function(topic) {
                return topic == currentSlide.topic;
            });

            // if not existed, then save it
            if (!isExisted) {
                if (currentSlide.topic && currentSlide.topic !== "") {
                    visitedSlides[currentSlide.id] = {};
                    visitedSlides[currentSlide.id].topic = currentSlide.topic;
                    visitedSlides[currentSlide.id].name = currentSlide.name;
                    visited[drcom.currentFlowId] = visitedSlides;
                    drcom.storage.set('visited', visited);
                }
            }
        },
        onBack: function() {
            drcom.gotoSlide(drcom.storage.get("prevSlide") || drcom.menuItem);
        },
        onSelectTopic: function(e) {
            var sender = $(e.currentTarget);
            if (!this.submitBtn.hasClass('submitted')) {
                sender.toggleClass('active');
                if (this.rightContainer.find('li.active').length) {
                    this.submitBtn.addClass('chosen');
                    this.resetBtn.addClass('chosen');
                } else {
                    this.submitBtn.removeClass('chosen');
                    this.resetBtn.removeClass('chosen');
                }
            }
        },
        onSubmit: function() {
            var sender = this.submitBtn,
                    conf = drcom.config.callSummary,
                    self = this;
            if (sender.hasClass('chosen') && !sender.hasClass('submitted')) {
                var value = {"dr_CallSummary_vod__c": this._renderCallSummaryTopic()};
                this._storeSelected(function() {
                    var text = conf.submittedBtnText || "Submitted";
                    sender.addClass('submitted').html(text);
                    self.rightContainer.find('li.active').removeClass('active').addClass('submitted');
                    if (conf.saveToVeevaAccount) {
                        com.veeva.clm.getDataForCurrentObject('Account', 'ID', function(result) {
                            if (result.success) {
                                com.veeva.clm.updateRecord('Account', result.Account.ID, value, function(resp) {
                                    debug.log(resp);
                                });
                            }
                        });
                    }
                });
            }
        },
        onReset: function() {
            var conf = drcom.config.callSummary,
                    text = conf.submitBtnText || "Submit Selected";
            this.submitBtn.removeClass('chosen submitted').html(text);
            this.resetBtn.removeClass('chosen');
            this.rightContainer.find('li').removeClass('active submitted');
        },
        onSelectFlow: function(container, e) {
            var sender = $(e.currentTarget),
                    flowId = sender.attr('flow-id');
            sender.siblings().removeClass('actived');
            sender.addClass('actived');

            container.each(function() {
                var el = $(this);

                el.removeClass('actived');
                if (el.attr('flow-id') === flowId) {
                    el.addClass('actived');
                }
            });

            setTimeout($.proxy(this._refreshScroller, this, flowId), 10);
        },
        onScrollStart: function() {
            drcom.disableSwipe();
        },
        onScrollEnd: function() {
            drcom.enableSwipe();
        },
        /* HELPERS */
        _renderPage: function() {
            // prepare data
            var flows = false,
                    conf = drcom.config.callSummary;
            if (drcom.currentFlowId !== "singleFlow")
                flows = _.keys(conf.slides);

            this._prepareData();

            var popupData = drcom.storage.get('popupData') || {},
                    buttonCls = conf.buttonCls || [],
                    temp = this.options.template || template;
            this.element.append(_.template(temp)({
                flows: flows,
                visited: this.visited,
                notVisited: this.notVisited,
                popup: popupData,
                buttonCls: buttonCls,
                // text configs
                header: conf.header || "CALL SUMMARY",
                visitedTitle: conf.visitedTitle || "Today we<br>discussed",
                notVisitedTitle: conf.notVisitedTitle || "What would you like to<br>discuss next time?",
                submitBtnText: conf.submitBtnText || "Submit Selected",
                resetBtnText: conf.resetBtnText || "Reset"
            }));

            this.submitBtn = $('#submitSelected', this.element);
            this.resetBtn = $('#resetSelected', this.element);
            this.leftContainer = $('.leftCont', this.element);
            this.rightContainer = $('.rightCont', this.element);
            this.leftScrolls = {};
            this.rightScrolls = {};

            // apply iscroll
            var options = {
                zoom: false,
                scrollbar: false,
                hideScrollbar: true,
                useTransfrom: true,
                bounce: true
            }, self = this;
            this.leftContainer.find('.content').each(function() {
                self._scrollFor($(this), self.leftScrolls, options);
            });
            this.rightContainer.find('.content').each(function() {
                var el = $(this),
                        handler = self.onSelectTopic;
                self._scrollFor(el, self.rightScrolls, options);
                el.on('tapone', 'li', $.proxy(handler, self));
            });

            if (this.rightContainer.hasClass('actived') &&
                    this.rightContainer.find('li.active').length) {
                this.submitBtn.addClass('chosen');
                this.resetBtn.addClass('chosen');
            }

            this._bindEvents();
        },
        _prepareData: function() {
            var visited = drcom.storage.get('visited') || {},
                    notVisited = {},
                    allPages = this._allTrackingPages();

            _.each(allPages, function(ids, flowId) {
                notVisited[flowId] = {};
                if (!visited[flowId])
                    visited[flowId] = {};

                _.each(ids, function(id) {
                    var slide = drcom.getSlide(id, flowId);
                    if (slide) {
                        if (!visited[flowId][slide.id]) {
                            if (!this._isExistedForFlow(visited, slide.topic, flowId)) {
                                notVisited[flowId][slide.id] = {
                                    topic: slide.topic,
                                    name: slide.name
                                };
                            }
                        }
                    }
                }, this);
            }, this);

            this.visited = visited;
            this.notVisited = notVisited;
        },
        _bindEvents: function() {
            // bind event for button bars
            var topButtons = $('.flow_buttons_bar.top_buttons', this.element),
                    bottomButtons = $('.flow_buttons_bar.bottom_buttons', this.element),
                    handler = this.onSelectFlow;
            topButtons.on('tapone', '.flow_btn', $.proxy(handler, this, this.leftContainer));
            bottomButtons.on('tapone', '.flow_btn', $.proxy(handler, this, this.rightContainer));

            // bind event for submit button
            this.submitBtn.bind('tapone', $.proxy(this.onSubmit, this));
            this.resetBtn.bind('tapone', $.proxy(this.onReset, this));
        },
        _scrollFor: function(el, scrolls, options) {
            var ul = el.find('ul'),
                    h = this._heightForEl(ul, el.parent()),
                    flowId = el.parent().attr('flow-id');

            ul.height(h + 50);
            var scroller = new IScroll(el[0], options);
            scroller.on('scrollStart', $.proxy(this.onScrollStart, this));
            scroller.on('scrollEnd', $.proxy(this.onScrollEnd, this));
            scrolls[flowId] = scroller;
        },
        _refreshScroller: function(flowId) {
            this.leftScrolls[flowId].refresh();
            this.rightScrolls[flowId].refresh();
        },
        _heightForEl: function(el, parentEl) {
            parentEl.show();
            var h = el.height();
            parentEl.removeAttr('style');
            return h;
        },
        _storeSelected: function(callback) {
            var self = this;
            setTimeout(function() {
                var content = self._mapData();
                self._saveData(content, callback);
            }, 0);
        },
        _saveData: function(selected, callback) {
            var _self = this;
            if (drcom.config.player === "Veeva" && selected !== "") {
                var clickStream = {
                    Question_vod__c: "Call Summary",
                    Track_Element_Description_vod__c: "Slides that user has visited.",
                    Answer_vod__c: selected,
                    Survey_Type_vod__c: "freetext"
                };
                com.veeva.clm.createRecord("Call_Clickstream_vod__c", clickStream, function(result) {
                    com.veeva.clm.updateCurrentRecord("Call", {"Next_Call_Notes_vod__c": _self.nextCall_text}, callback);
                });
            } else callback && callback();
        },
        _allTrackingPages: function() {
            var allPages = [];
            if (drcom.currentFlowId === "singleFlow") {
                allPages = {
                    singleFlow: drcom.config.callSummary.slides || []
                };
            } else {
                allPages = drcom.config.callSummary.slides || {};
            }

            return allPages;
        },
        _isCallSummaryPage: function() {
            var slide = drcom.getCurrentSlide();
            return (slide && slide.name.toLowerCase().indexOf("callsummary") >= 0);
        },
        _isExistedForFlow: function(visited, topic, flowId) {
            flowId = flowId || drcom.currentFlowId;
            var arr = visited[flowId] || {};
            return _.some(arr, function(item) {
                return item.topic === topic;
            });
        },
        _mapData: function() {
            var summaryData = drcom.storage.get('summaryData') || {};
            var visitedData = drcom.storage.get('visited') || {};
            var popupData = drcom.storage.get('popupData') || {};
            var text = 'Slides: ';
            for (var flow in visitedData) {
                if (summaryData[flow]) {
                    var list = visitedData[flow];
                    for (var key in list) {
                        if (summaryData[flow][key])
                            list[key] = summaryData[flow][key];
                        text += 'Topic: ' + list[key].topic + ', Asset name: ' + list[key].name + ', Flow id: ' + list[key].flow + ', Duration: ' + list[key].duration + ', Start time: ' + list[key].starttime + '; ';
                    }
                }
            }
            var arr = [];
            $('.rightCont li.active').each(function(i, el) {
                arr.push($(el).text());
            });
            if (arr.length > 0) {
                text += ' Not visited: ' + arr.join("--") + ';';

                //update Next_Call_Notes_vod__c value after finish call summary
                var next_call = 'Chosen topics: ' + arr.join("--");
                this.nextCall_text = next_call;
            }
            if (drcom.storage.get('popupData'))
                text += 'Popup: ';
            for (var flow in popupData) {
                var pulist = popupData[flow];
                for (var p in pulist) {
                    text += 'Topic:' + p + ', Asset name: ' + pulist[p].name + ', Flow id: ' + pulist[p].flow + ', Duration: ' + pulist[p].duration + ', Start time: ' + pulist[p].startTime + '; ';
                }
            }
            return text;
        },
        _renderCallSummaryTopic: function() {
            var text = '';
            if (drcom.config.callSummary.urlList) {
                var list = drcom.config.callSummary.urlList;
                $('.rightCont li.active').each(function(i, el) {
                    var topic = $(el).html();
                    if (list[topic])
                        text += topic + '==' + list[topic] + ';';
                });
            }
            if (text.length > 0)
                text = text.substring(0, text.length - 1);
            return text;
        }
    });
    $.fn.drcom_callsummary = function(options) {
        $(this).each(function() {
            new Drcom.CallSummary($(this), options);
        });
        return $(this);
    };

    var conf = drcom.config.callSummary;
    if (conf && conf.isShow) {
        var container = $('#container');
        if (conf.customTemplate) {
            var path = 'text!' + conf.customTemplate;
            require([path], function(customTemplate) {
                container.drcom_callsummary({
                    template: customTemplate
                });
            });
        } else
            container.drcom_callsummary();
    }
})