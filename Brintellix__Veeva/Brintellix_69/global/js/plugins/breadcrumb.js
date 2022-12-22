require([
	'text!plugins/template/breadcrumb.html'
], function (template) {
	// prevent script from running phantomjs
	// if it is a common slide
	if (drcom.isSlideInCommon() && drcom.isPhantom) return;

	Drcom.BreadCrumb = Drcom.Controller.extend({
		pluginName: "drcom_breadcrumb",

		init: function (el, options) {
			this.super.init.apply(this, [el, options]);
			drcom.waitForPlayer($.proxy(this.render, this));
		},

		render: function() {
			if (this._needRender()) {
				var data = this._prepareData();
				this.element.append(_.template(template)({
					data: data
				}));
			}
			this.bindEvents();
		},

		bindEvents: function() {
			this.bind(this.element, "tapone", this.callbackEvent(".breadcrumb tapone"));
		},
		
		".breadcrumb tapone": function () {
			var id = this._findSitemapId();
			if (id >= 0) drcom.gotoSlide(id);
		},

		// helpers
		_needRender: function() {
			return !$('.column', this.element).length;
		},
		_findSitemapId: function () {
			var sitemapSlide = _.find(drcom.getSlidesOfFlow(), function (slide) {
				return slide.name.toLowerCase().indexOf("sitemap") >= 0;
			});
			return (sitemapSlide ? sitemapSlide.id : -1);
		},
		_prepareData: function() {
			try {
				this._filteredData();
				this._setUpAllVariable();
				return this._getData();
			} catch (e) {
				return [];
			}
		},
		_setUpAllVariable: function() {
			this.mainMax = 0, this.mainMin = 0,
			this.mainMaxPath = 0,
			this.subMaxPath = 0,
			this.subMax = 0, this.subMin = 0,
			this.currentMainPath = 0, this.currentSubPath = 0,
			this.ignoreRange = 0;

			var currentItem = drcom.getCurrentSlide();
			if (currentItem) {
				var slides = this.slides;

				// get current path
				this.currentMainPath = parseFloat(currentItem.path.split(".")[0]);
				this.currentSubPath = parseFloat(currentItem.path.split(".")[1]);

				// get subMin
				this.subMin = 1;

				_.each(slides, function (item, index) {
					item.path = index + ".0";
					if (item.submenu) {
						var submenu = item.submenu;
						_.each(submenu, function (subItem, subIndex) {
							subItem.path = index + '.' + (parseFloat(subIndex) + 1);
						}, this);

						if (this.currentMainPath == index && submenu.length > this.subMaxPath) {
							this.subMaxPath = submenu.length; // get subMax
						}
					}
				}, this);

				// get maxPath
				this.mainMaxPath = parseFloat(slides[slides.length - 1].path.split(".")[0]);

				this._getMainLimit();
				this._getSubLimit();
			}
		},
		_filteredData: function() {
			this.slides = [];

			var currentId = drcom.currentFlowId,
				slide = drcom.getRawSlidesOfFlow();

			this.slides = _.filter(slide, function (item) {
				return (!item.hideonslide && !item.hideonmenu) || item.id == currentId;
			});

			_.each(this.slides, function (slide, i) {
				slide.submenu = _.filter(slide.submenu, function (item) {
					return (!item.hideonslide && !item.hideonmenu) || item.id == currentId;
				});
			}, this);
		},
		_getMainLimit: function() {
			var mainPath = this.currentMainPath,
				minMain = 0, maxMain = 0,
				maxPath = this.mainMaxPath;

			minMain = mainPath - 3; // get min main by minus 3 from main point

			if (minMain < 0) {
				maxMain = -minMain;
				minMain = 0;
			}

			maxMain = maxMain + mainPath + 3;

			if (maxPath - maxMain < 0) {
				minMain = minMain - Math.abs(maxPath - maxMain);
				maxMain = maxPath;
				minMain = minMain < 0 ? 0 : minMain;
			}

			this.mainMin = minMain;
			this.mainMax = maxMain;
		},
		_getSubLimit: function() {
			var subPath = this.currentSubPath,
				minSub = 0, maxSub = 0,
				maxPath = this.subMaxPath, dif = 0;

			if (maxPath > 6) {
				minSub = subPath - 2;

				if (minSub < 0) {
					dif = Math.abs(minSub);
					minSub = 1;
				}
				if (minSub == 0) {
					dif = 1;
				}

				maxSub = subPath + 3 + dif;

				if (maxSub > maxPath) {
					var maxDif = maxSub - maxPath;
					maxSub = maxPath;
					minSub -= maxDif;
					if (minSub - 3 >= 0) {
						this.ignoreRange = minSub;
						++minSub;
					} else {
						if (minSub - 2 == 0) {
							this.ignoreRange = minSub;
							++minSub;
						}
						else { }
						//this.ignoreRange = minSub;
					}
				} else {
					if (minSub > 1) {
						this.ignoreRange = 1;
						++minSub;
					}

				}
			} else {
				minSub = 1;
				maxSub = 6;
			}

			this.subMin = minSub;
			this.subMax = maxSub;
		},
		_getData: function() {
			var tempData = [],
				slides = this.slides,
				minMain = this.mainMin,
				maxMain = this.mainMax,
				minSub = this.subMin,
				maxSub = this.subMax;

			_.each(slides, function (item, i) {
				var cols = [],
					itemMainPath = parseFloat(item.path.split(".")[0]),
					itemSubPath = parseFloat(item.path.split(".")[1]);

				// get item in range left and right
				if (minMain <= itemMainPath && itemMainPath <= maxMain) {

					var mainTemp = _.clone(item), haveMoreNode = false;

					if (itemMainPath == minMain)
						haveMoreNode = slides[i - 1] == undefined ? false : true;
					else if (itemMainPath == maxMain)
						haveMoreNode = slides[i + 1] == undefined ? false : true;

					if (haveMoreNode) {
						mainTemp.haveMoreNode = true;
						mainTemp.haveMoreNodeDir = "";
						if (this.currentMainPath > itemMainPath) mainTemp.haveMoreNodeDir = "prev";
						else mainTemp.haveMoreNodeDir = "next";
					}
					this._addRenderProperty(mainTemp);
					cols.push(mainTemp);

					if (item.submenu) {
						var subMenu = item.submenu;
						_.each(subMenu, function (subItem, j) {
							var subItemPath = parseFloat(subItem.path),
								subItemSubPath = parseFloat(subItem.path.split(".")[1]);

							if (minSub <= subItemSubPath && subItemSubPath <= maxSub) {
								var subTemp = _.clone(subItem);

								var haveMoreSub = false;
								if (subItemSubPath == maxSub)
									haveMoreSub = subMenu[j + 1] != undefined ? true : false;

								if (haveMoreSub) {
									subTemp.haveMoreNode = true;
									subTemp.haveMoreNodeDir = "down";
								}
								this._addRenderProperty(subTemp);
								cols.push(subTemp);
							} else if (this.ignoreRange == subItemSubPath) {
								var subTemp = _.clone(subItem);
								subTemp.ignoreItem = true;
								cols.push(subTemp);
							}

						}, this);
					}

					tempData.push(cols);
				}
			}, this);

			return tempData;
		},
		_addRenderProperty: function(obj) {
			var breadcrumb = drcom.config.breadcrumb,
				styles = "";
			obj.propertyStyle = "";
			obj.propertyValue = "";
			obj.classValue = "";

			function checkPath(cls) {
				var icon = breadcrumb,
					icon = cls == "next" ? icon.next_icon : (cls == "prev" ? icon.prev_icon : (cls == "active" ? icon.active_icon : (cls == "normal" ? icon.list_icon : icon.down_icon))),
					val = [];
				if (icon.path.toLowerCase().indexOf(".png") != -1 || icon.path.toLowerCase().indexOf(".jpg") != -1) {
					val.push("background-image");
					val.push("url(" + icon.path + ")");
				}
				else {
					switch (cls) {
						case "prev":
							val.push("border-right-color");
							break;
						case "next":
							val.push("border-left-color");
							break;
						case "down":
							val.push("border-top-color");
							break;
						default:
							val.push("background-color");
							break;
					}

					val.push(icon.color);
					val.push(cls);
				}

				return val;
			}


			if (obj.id == drcom.getCurrentSlide().id) {
				style = checkPath('active');
			} else if (obj.haveMoreNode) {
				style = checkPath(obj.haveMoreNodeDir);
			} else {
				style = checkPath('normal');
			}

			obj.propertyStyle = style[0];
			obj.propertyValue = style[1];
			obj.classValue = style[2];
		}
	});

	$.fn.drcom_breadcrumb = function(options) {
		$(this).each(function() {
			new Drcom.BreadCrumb($(this), options);
		});
		return $(this);
	};

	// if show breadcrumb then create it
	if (drcom.config.breadcrumb && drcom.config.breadcrumb.isShow) {
		var body = $('#container'),
			breadcrumb = $('.breadcrumb'),
			breadcrumbBg = $('.breadcrumb_bg');
		if (!breadcrumb.length) {
			breadcrumb = $("<div class='breadcrumb transition'></div>");
			body.append(breadcrumb);
		}

		if (!breadcrumbBg.length) {
			breadcrumbBg = $("<div class='breadcrumb_bg transition'></div>");
			body.append(breadcrumbBg);

			var options = drcom.config.breadcrumb.container,
				value = "",
				property = "";
			if (options.path != undefined &&
				options.path.toLowerCase().indexOf(".png") != -1 ||
				options.path.toLowerCase().indexOf(".jpg") != -1) {

				property = "background-image";
				value = "url(" + options.path + ")";
			} else {
				property = "background-color";
				value = options.color;
			}

			breadcrumbBg.css(property, value);
		}

		drcom.breadcrumb = breadcrumb.drcom_breadcrumb().controller();
	}
});

