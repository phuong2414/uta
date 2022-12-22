require([], function(template) {
	Drcom.StyleMenu = Drcom.Controller.extend({
		pluginName: "drcom_stylemenu",

		currMainMenuId: null,
		scrolls: (drcom.config.stylemenu ? drcom.config.stylemenu.scrolls || [] : []),
		scrollOps: {
			scrollX: true,
			zoom: false,
			scrollbar: false,
			hideScrollbar: true,
			useTransfrom: true,
			bounce: true
		},

		init: function(el, options) {
			this.super.init.apply(this, arguments);
			drcom.waitForPlayer($.proxy(this.setup, this));
		},

		setup: function() {
			this.element.on('tapone', 'div.menuitem', $.proxy(this.onSelectMenu, this));
			this._renderView();
		},

		/* HANDLERS */
		onSelectMenu: function(e) {
			drcom.disableSwipe();

			var el = $(e.currentTarget),
				menuid = parseInt(el.data('menuid')),
				slide = drcom.getSlide(menuid),
				level = parseInt(el.parents('.stylemenu').data('level')) + 1,
				submenuEl = this._findMenuByLevel(level);

			if (!el.hasClass('current') || !submenuEl) {
				this.overlayEl.fadeIn(250);
				el.siblings('.current').removeClass('current');
				el.addClass('current');

				submenuEl = this._findMenuByLevel(level, true);
				this._renderMenu(submenuEl, slide.submenu, level);
			}

			if (!slide.submenu || !slide.submenu.length) drcom.gotoSlide(menuid);
		},

		onOverlayTap: function() {
			drcom.enableSwipe();

			this._removeAllSubmenu(0);
			this.overlayEl.fadeOut(250);
			this._updateActiveMenu();
		},

		/* HELPERS */
		_findMenuByLevel: function(level, shouldCreate) {
			var submenuEl = $('.stylemenu.level-' + level);
			if (submenuEl.length) return submenuEl;

			if (shouldCreate) return $('<div class="stylemenu level-' + level + '" data-level="' + level + '"></div>').appendTo(this.element);

			return false;
		},

		_findMenuElWithId: function(id) {
			return this.element.find('div.menuitem[data-menuid=' + id + ']');
		},

		_updateActiveMenu: function() {
			var slide = drcom.getCurrentSlide();
			$('div.menuitem', this.element).removeClass('current');
			while (slide.parent) {
				slide = slide.parent;
			}
			var el = this._findMenuElWithId(slide.id);
			el.addClass('current');
		},

		_calWidth: function(el) {
			var items = el.find('div.menuitem'),
				width = 0;
			items.each(function() {
				var el = $(this);
				width += el.outerWidth();
			});
			return width;
		},

		_removeAllSubmenu: function(level) {
			var submenuEl = this._findMenuByLevel(++level);
			while (submenuEl) {
				submenuEl.remove();
				submenuEl = this._findMenuByLevel(++level);
			}
		},

		_renderView: function() {
			this.overlayEl = $('<div class="styleoverlay"></div>').appendTo(this.element);
			this.overlayEl.on('tapone', $.proxy(this.onOverlayTap, this));

			var mainmenuEl = $('<div class="stylemenu level-0" data-level="0"></div>').appendTo(this.element);
			this._renderMenu(mainmenuEl, this._getMainData());

			mainmenuEl.drcom_disableswipe();
			mainmenuEl.find('>div').width(this._calWidth(mainmenuEl));
			this._updateActiveMenu();
			var scroller = new IScroll(mainmenuEl[0], this.scrollOps),
				activeEl = mainmenuEl.find('div.menuitem.current');
			if (activeEl[0]) scroller.scrollToElement(activeEl[0], 0);
		},

		_renderMenu: function(el, data, level) {
			if (level) this._removeAllSubmenu(level);

			var text = '';
			if (data) {
				var currId = drcom.menuItem;
				text += '<div class="stylemenu-content">';
				data.forEach(function(item) {
					if (!item.hideonmenu) {
						var cls = (currId === item.id ? ' current' : '');
						text += '<div class="menuitem' + cls + '" data-menuid="' + item.id + '"><span>' + item.title + '<span></div>';
					}
				});
				text += '</div>';
			}
			el.html(text);
		},

		_getMainData: function() {
			var slides = drcom.getSlidesOfFlow();
			return _.filter(slides, function(s) {
				return s.level == 0;
			});
		},
	});

	$.fn.drcom_stylemenu = function(options) {
		$(this).each(function() {
			new Drcom.StyleMenu($(this), options);
		});
		return $(this);
	};

	if (drcom.config.stylemenu && drcom.config.stylemenu.isShow) {
		var menu = $('#menu');
		if (!menu.length) {
			menu = $('<div id="menu"></div>').appendTo('body');
		}

		menu.drcom_stylemenu();
	}
});