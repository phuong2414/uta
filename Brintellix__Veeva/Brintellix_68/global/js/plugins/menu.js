require([
	'text!plugins/template/mainmenu.html',
	'text!plugins/template/submenu.html',
	'text!plugins/template/submenu-vertical.html',
], function(mainTemplate, subTemplate, subVerticalTemplate) {
	var menuConf = drcom.config.menu || {};
	Drcom.Menu = Drcom.Controller.extend({
		pluginName: "drcom_menu",

		hasSubmenu: menuConf.submenu && menuConf.submenu.isShow,
		sublayout: menuConf.submenu ? (menuConf.submenu.layout || 'horizontal') : 'horizontal',
		
		init: function(el, options) {
			this.super.init.apply(this, arguments);
			drcom.waitForPlayer($.proxy(this.render, this));
		},

		render: function() {
			// disable swipe on this element
			this.element.drcom_disableswipe();

			this.renderMenu();
			this.bindEvents();

			this.applyScroll();
			this.tapCount = 0;
		},

		renderMenu: function() {
			var conf = drcom.config.menu,
				data = this._getMainData(),
				currSlide = drcom.getCurrentSlide(),
				currentId = currSlide.parent ? currSlide.parent.id : currSlide.id;

			this.element.find('.mainmenu').remove();
			this.element.append(_.template(mainTemplate)({
				data: data,
				conf: menuConf,
				currentId: currentId
			}));
		},

		bindEvents: function() {
			// event for main menu items
			var mainmenu = $('.mainmenu', this.element),
				list = mainmenu.find('li'),
				handler = $.proxy(this.onSelectMainMenu, this, list);
			mainmenu.on('tapone', 'li', handler);

			// event for control and menu
			var submenu = $('.submenu,.vertical-submenu-content', this.element),
				control = submenu.find('.handler'),
				list = submenu.find('li'),
				handler = $.proxy(this.onSelectSubMenu, this, list);
			control.on('tapone', this.onToggleSubmenu);
			submenu.on('tapone', 'li', handler);
		},

		applyScroll: function() {
			var mainContent = $('.mainmenu-content', this.element),
				subContent = $('.submenu-content', this.element),
				self = this,
				options = {
					scrollX: true,
					zoom: false,
					scrollbar: false,
					hideScrollbar: true,
					useTransfrom: true,
					bounce: true
				};

			var mainScroller = new IScroll(mainContent[0], options);
			mainScroller.on('beforeScrollStart', function() {
				$('.vertical-submenu').hide().removeClass('anim');
			});

			setTimeout(function() { 
				mainScroller.refresh(); 
				self._scrollToElement(mainContent, mainScroller);
			}, 100);

			if (this.hasSubmenu && this.layout === 'horizontal') {
				var subScroller = new IScroll(subContent[0], options);
				setTimeout(function() { 
					subScroller.refresh(); 
					self._scrollToElement(subContent, subScroller);
				}, 100);
				
			}
		},

		onToggleSubmenu: function() {
			$('.submenu').toggleClass('hide');
		},

		onSelectMainMenu: function(list, e) {
			var sender = $(e.currentTarget);
			if (menuConf.useDoubleTap) {
				this.tapCount++;
				if (!this.timer) {
					var h = $.proxy(this.onTimer, this, sender, list);
					this.timer = setTimeout(h, 200);
				}
			} else {
				var id = sender.attr('menu-id');
				if (id != drcom.menuItem) {
					var flowId = sender.attr('flow-id');
					if (flowId !== '') drcom.gotoPresentation(id, flowId)
					else drcom.gotoSlide(id);
				}
			}
		},

		_handleChangeSubmenu: function(sender, list, id, currId) {
			if (currId != id) {
				if (this.sublayout === 'vertical') 
					$('.vertical-submenu-content').empty();

				list.removeClass('selected');
				sender.addClass('selected');

				var slide = drcom.getSlide(id);
				if (this.hasSubmenu) {
					this._changeSubMenu(slide, sender);
				}
			} else {
				if (this.sublayout === 'vertical') 
					$('.vertical-submenu').show(0, function() {
						$(this).addClass('anim');
					});
			}
		},

		_handleGoto: function(sender, id) {
			if (id != drcom.menuItem) {
				var flowId = sender.attr('flow-id');
				if (flowId !== '') drcom.gotoPresentation(id, flowId)
				else drcom.gotoSlide(id);
			}
		},

		onTimer: function(sender, list) {
			var currActive = list.find('li.selected'),
				id = sender.attr('menu-id'),
				currId = currActive.attr('menu-id');

			if (menuConf.useDoubleTap) {
				if (menuConf.tapRevert) {
					switch (this.tapCount) {
						case 1: 
							this._handleGoto(sender, id);
							break;
						case 2: 
							this._handleChangeSubmenu(sender, list, id, currId);
							break;
					}
				} else {
					switch (this.tapCount) {
						case 1: 
							this._handleChangeSubmenu(sender, list, id, currId);
							break;
						case 2: 
							this._handleGoto(sender, id);
							break;
					}
				}
			} else this._handleGoto(sender, id);

			this.tapCount = 0;
			clearTimeout(this.timer);
			this.timer = null;
		},

		onSelectSubMenu: function(list, e) {
			var sender = $(e.currentTarget),
				id = sender.attr('menu-id');
			list.removeClass('selected');
			sender.addClass('selected');

			drcom.gotoSlide(id);
		},

		_scrollToElement: function(content, scroller) {
			var activeEl = content.find('li.selected');
			if (activeEl.length) {
				var w = activeEl.position().left + activeEl.outerWidth();
				if (w >= content.width()) {
					scroller.scrollToElement(activeEl[0], 0);
				}
			}
		},

		_changeSubMenu: function(mainSlide, activeMenuEl) {
			var submenu = mainSlide.submenu || [],
				options = {
					data: submenu,
					conf: menuConf,
					currentId: drcom.menuItem
				};
			if (this.sublayout === 'vertical') {
				$('.vertical-submenu-content').html(_.template(subVerticalTemplate)(options));

				var self = this;
				setTimeout(function() {
					var el = $('.vertical-submenu'),
						left = activeMenuEl.position().left,
						top = -el.height();
					el.css({top: top, left: left}).show(0, function() {
						el.addClass('anim');
					});
				}, 100);
			} else {
				var submenuEl = $('.submenu', this.element),
					content = submenuEl.find('.submenu-content');
				content.html(_.template(subTemplate)(options));

				var subScroller = new IScroll(content[0], options);
				setTimeout(function() { subScroller.refresh(); }, 100);
				this._scrollToElement(content, subScroller);
			}
			
		},

		_getMainData: function() {
			var slides = drcom.getSlidesOfFlow();
			return _.filter(slides, function(s) {
				return s.level == 0;
			});
		},
	});
	$.fn.drcom_menu = function(options) {
		$(this).each(function() {
			new Drcom.Menu($(this), options);
		});
		return $(this);
	};

	if (drcom.config.menu && drcom.config.menu.isShow) {
		var menu = $('#menu');
		if (!menu.length) {
			menu = $('<div id="menu"></div>').appendTo('#container');
		}

		menu.drcom_menu();
	}
});