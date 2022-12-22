require([], function () {

	// extend defaults
	$.extend(drcom, {
		allSlides: {},
		currentFlowId: "singleFlow",
		playerReady: false,

		setFlow: function() {
			this.prepareAllSlides();
			if (!this.playerReady) {
				var player = this.config.player;
				if (this.isMultiFlow && this.currentFlowId === "singleFlow") {
					switch (player) {
						case "Veeva":
							this.getVeevaPresentationId(this.triggerFlow.bind(this));
							break;
						case "ShowImpact":
							this.getShowImpactPresentationId(this.triggerFlow.bind(this));
							break;
						case "Browser":
							var location = window.location;
								paths = location.pathname.split("/"),
								len = paths.length;
							this.triggerFlow(paths[len - 3]);
							break;
						case "Exploria":
							var flowId = null;
							if (this.isSlideInCommon()) flowId = this.storage.get('currentFlowId') || this.detectFlow();
							else flowId = this.detectFlow();
							this.triggerFlow(flowId);
							break;
						case "MI":
							var flowId = null;
							if (this.isSlideInCommon()) flowId = this.storage.get('currentFlowId') || this.detectFlow();
							else flowId = this.detectFlow();
							this.triggerFlow(flowId);
							break;
						case "OCE":
							var flowId = null;
							if (this.isSlideInCommon()) flowId = this.detectOCEFlow();
							else flowId = this.detectFlow();
							this.triggerFlow(flowId);
							break;
						default:
							this.triggerFlow();
							break;
					}
				} else this.triggerFlow();
			}
		},

		getOCEState: function () {
			var state = {}

			try {
				state = confgData && confgData.state ? confgData.state : "";
				state = JSON.parse(state)
			} catch (e) {
				console.log(e);
			}

			return state;
		},

		setOCEState: function (state) {
			try {
				state = JSON.stringify(state);
				confgData.state = state;
				CLMPlayer.saveState(state);
			} catch (e) {
				console.log(e);
			}

		},

		detectOCEFlow: function () {
			var state = this.getOCEState() || {};
			var flowId = state && state.currentFlowId ? state.currentFlowId : null;
			flowId = flowId || (window.confgData && confgData.presentations && confgData.presentations[confgData.presentationIndex].name);
			return flowId;
		},

		detectFlow: function() {
			for (var k in this.allSlides) {
				var slides = this.allSlides[k];
				for (var i = 0; i < slides.length; i++) {
					var slide = slides[i];
					if (slide.id === this.menuItem) {
						if (slide.presentation && slide.presentation !== "") 
							return slide.presentation;
						return k;
					}
				}
			}

			return null;
		},

		triggerFlow: function(flowId) {
			this.currentFlowId = flowId || "singleFlow";
			this.storage.set("currentFlowId", this.currentFlowId);

			// check player ready
			if (!this.isMultiFlow || this.currentFlowId !== "singleFlow") {
				this.playerReady = true;

				if (this.config.player === "Agnitio")
					this.saveAgSlideEnter();
			}
		},

		waitForPlayer: function(callback) {
			if (this.playerReady) callback();
			else {
				var onWait = function() {
					if (this.playerReady) {
						clearInterval(timer);
						timer = null;

						// do callback
						callback();
					}
				}
				var timer = setInterval(onWait.bind(this), 100);
			}
		},

		prepareAllSlides: function() {
			this.allSlides = {};
			if (this.isMultiFlow) {
				_.each(menudata, function (menu, flowId) {
					this.allSlides[flowId] = this._parseSlides(menu);
				}, this);
			} else {
				this.allSlides[this.currentFlowId] = this._parseSlides(menudata);
			}
		},

		getVeevaPresentationId: function(callback) {
			var player = this.config.player,
				flowId = this.currentFlowId || false,
				self = this;
			if (player === "Veeva") {
				com.veeva.clm.getDataForCurrentObject(
					"Presentation", 
					"Presentation_Id_vod__c", 
					function(result) {
						if (result.success) flowId = result.Presentation.Presentation_Id_vod__c;
						callback(flowId);
					}
				);
			} else callback(flowId);
		},

		getShowImpactPresentationId: function(callback) {
			var player = this.config.player,
				flowId = this.currentFlowId || false,
				self = this;
			if (player === "ShowImpact") {
				drcom.showimpact.clm.getPresentationId(function(result) {
					if (result.success) flowId = result.Presentation.Presentation_Id;
						callback(flowId);
					}
				);
			} else callback(flowId);
		},

		getCurrentSlide: function() {
			return this.getSlide(this.menuItem);
		},

		getSlidesOfFlow: function(flowId) {
			flowId = flowId || this.currentFlowId;
			return this.allSlides[flowId];
		},

		getRawSlidesOfFlow: function(flowId) {
			flowId = flowId || this.currentFlowId;
			return (flowId === "singleFlow" ? menudata : menudata[flowId]);
		},

		getSlide: function(slideId, flowId) {
			flowId = flowId || this.currentFlowId;
			var foundSlide = _.find(this.getSlidesOfFlow(flowId), function (slide) {
				return slide.id == slideId;
			});

			if (foundSlide != -1) return foundSlide;
			return false;
		},

		isSlideInCommon: function() {
			var id = this.menuItem,
				isCommon = false;
			if (this.isMultiFlow) {
				var count = 0;
				for (var k in this.allSlides) {
					var slides = this.allSlides[k];
					isCommon = _.some(slides, function (s) {
						return s.id === id;
					});
					if (isCommon) count++;
					if (count >= 2) return true;
				}
			}

			return false;
		},

		allFlowKeys: function() {
			return _.keys(this.allSlides);
		},

		_parseSlides: function(menuList) {
			var slides = [];

			var parseSub = function(menu, level) {
				var submenu = menu.submenu;
				if (submenu) {
					level++;
					_.each(submenu, function(subItem) {
						subItem.level = level;
						subItem.parent = menu;
						slides.push(subItem);

						parseSub(subItem, level);
					}, this);
				}
			};

			_.each(menuList, function(menu) {
				var level = 0;
				menu.level = level;
				slides.push(menu);

				parseSub(menu, level);
			}, this);

			return slides;
		},

		_savePrevSlide: function(slide) {
			var notAllowedIds = drcom.config.idsNotSaved || [];
			if (notAllowedIds.indexOf(slide) < 0)
				this.storage.set('prevSlide', this.menuItem);
		},

		gotoPresentation: function(slideName, presentationId) {
			if (presentationId) this.storage.set("currentFlowId", presentationId);

			slideName = this.getSlideName(slideName, presentationId);
			if (slideName) {
				$(document).trigger("beforeGotoSlide");
			
				//for old format
				var url = "../../" + presentationId + "/" + slideName + "/" + slideName + ".html";
				var me = this;
				me.check(url, function (isExisted) {
					if (isExisted)
						window.location.href = url;
					else {
						//for new format
						var urlNewFormat = "../../" + presentationId + "/" + slideName + "/index.html";
						me.check(urlNewFormat, function (isExisted) {
							if (isExisted)
								window.location.href = urlNewFormat;
							else {
								//if you are developing the OCE player on local
								var urlOCE = "../../" + presentationId + "/" + slideName + "/01_index.html";
								me.check(urlOCE, function (isExisted) {
									if (isExisted)
										window.location.href = urlOCE;
									else
										//default
										window.location.href = "../../" + presentationId + "/" + slideName + "/";
								});
							}
						});
					}

				});
			}
		},

		gotoSlide: function(slide) {
			var slideName = this.getSlideName(slide);
            
            if (slideName) {
				this._savePrevSlide(slide);

				$(document).trigger("beforeGotoSlide");
				//for old format
				var url = "../" + slideName + "/" + slideName + ".html";
				var me = this;
				me.check(url, function (isExisted) {
					if (isExisted)
						window.location.href = url;
					else {
						//for new format
						var urlNewFormat = "../" + slideName + "/index.html";
						me.check(urlNewFormat, function (isExisted) {
							if (isExisted)
								window.location.href = urlNewFormat;
							else {
								//if you are developing the OCE player on local
								var urlOCE = "../" + slideName + "/" + "01_index" + ".html";
								me.check(urlOCE, function (isExisted) {
									if (isExisted)
										window.location.href = urlOCE;
									else
										//default
										window.location.href = "../" + slideName + "/";
								});
							}
						});
					}

				});
			}
		},

		getSlideName: function(arg1, arg2) {
			if (typeof arg1 === "string") {
				if (/^\d+$/.test(arg1)) {
					arg1 = parseInt(arg1);
				} else return arg1;
			}

			if (typeof arg1 === "number") {
				slide = drcom.getSlide(arg1, arg2);
				return slide.name;
			}

			if (arg1.name) {
				return arg1.name;
			}

			return false;
		},

		prevSlide: function() {
			var slides = this.getSlidesOfFlow(),
				pos = _.indexOf(slides, this.getCurrentSlide()),
				slide = false;

			while (--pos >= 0) {
				if (!slides[pos].hideonslide) {
					slide = slides[pos];
					break;
				}
			}

			this.gotoSlide(slide);
		},

		nextSlide: function() {
			var slides = this.getSlidesOfFlow(),
				pos = _.indexOf(slides, this.getCurrentSlide()),
				slide = false;

			while (++pos < slides.length) {
				if (!slides[pos].hideonslide) {
					slide = slides[pos];
					break;
				}
			}

			this.gotoSlide(slide);
		},

		nextMainSlide: function() {
			var slides = this.getSlidesOfFlow(),
				current = this.getCurrentSlide(),
				currentId = current.parent ? current.parent.id : current.id,
				pos = _.indexOf(slides, this.getSlide(currentId)),
				slide = false;

			if (pos >= 0) {
				while (++pos < slides.length) {
					if (!slides[pos].parent && !slides[pos].hideonslide) {
						slide = slides[pos];
						break;
					}
				}
			}

			this.gotoSlide(slide);
		},

		prevMainSlide: function() {
			var slides = this.getSlidesOfFlow(),
				current = this.getCurrentSlide(),
				currentId = current.parent ? current.parent.id : current.id,
				pos = _.indexOf(slides, this.getSlide(currentId)),
				slide = false;

			if (pos >= 0) {
				while (--pos >= 0) {
					if (!slides[pos].parent && !slides[pos].hideonslide) {
						slide = slides[pos];
						break;
					}
				}
			}

			this.gotoSlide(slide);
		},

		nextSubSlide: function() {
			var slides = this.getSlidesOfFlow(),
				current = this.getCurrentSlide(),
				pos = _.indexOf(slides, current),
				slide = false;

			if (pos >= 0) {
				while (++pos < slides.length) {
					if (slides[pos].level == 0) break;
					if (slides[pos].level && !slides[pos].hideonslide) {
						slide = slides[pos];
						break;
					}
				}
			}

			this.gotoSlide(slide);
		},

		prevSubSlide: function() {
			var slides = this.getSlidesOfFlow(),
				current = this.getCurrentSlide(),
				pos = _.indexOf(slides, current),
				slide = false;

			if (pos >= 0) {
				while (--pos >= 0) {
					if (current.level && !slides[pos].hideonslide) {
						slide = slides[pos];
						break;
					}
				}
			}

			this.gotoSlide(slide);
		},

		check: function(url, callback) {
			$.ajax({
				type: 'HEAD',
				url: url,
				success: function() {
					if (callback) callback(true);
				},
				error: function() {
					if (callback) callback(false);
				}
			});
		}
	});

	var player = drcom.config.player;
	if (player === "Veeva") {
		$.extend(drcom, {
			gotoPresentation: function(slideName, presentationId) {
				this.storage.set("currentFlowId", presentationId);
				this.gotoSlide(slideName, presentationId);
			},

			gotoSlide: function(slide, presentationId) {
				var slideName = this.getSlideName(slide, presentationId);
				if (slideName) {
					this._savePrevSlide(slide);

					$(document).trigger("beforeGotoSlide");
					var args = arguments;
					args[0] = slideName + ".zip";
					com.veeva.clm.gotoSlide.apply(com.veeva.clm, args);
				}
			}
		});
	} else if (player === "ShowImpact") {
		$.extend(drcom, {
			gotoPresentation: function(slideName, presentationId) {
				this.storage.set("currentFlowId", presentationId);
				this.gotoSlide(slideName, presentationId);
			},

			gotoSlide: function(slide, presentationId, isNotGetAllLibraries) {
				var slideName = this.getSlideName(slide, presentationId);
				if (slideName) {
					this._savePrevSlide(slide);

					$(document).trigger("beforeGotoSlide");
					var args = arguments;
					args[0] = slideName;
					args[1] = presentationId;
					args[2] = isNotGetAllLibraries;
					drcom.showimpact.clm.gotoSlide.apply(drcom.showimpact.clm, args);
				}
			},

			openPdf: function(url) {
				var fileName = url.substring(url.lastIndexOf('/') + 1); //get file name
				fileName = fileName.slice(0, fileName.length - 4); //remove .pdf
				if (fileName) {
					var args = arguments;
					args[0] = fileName;
					drcom.showimpact.clm.openPdf.apply(drcom.showimpact.clm, args);
				}
			},

			openPopup: function(data) {
				if (data) {
					var args = arguments;
					args[0] = data;
					drcom.showimpact.clm.openPopup.apply(drcom.showimpact.clm, args);
				}
			},

			closePopup: function() {
				drcom.showimpact.clm.closePopup.apply(drcom.showimpact.clm);
			},

			openLinkExternal: function (url, type) {
				if (url) {
					var args = arguments;
					args[0] = url;
					args[1] = type || "_blank";
					drcom.showimpact.clm.openLinkExternal.apply(drcom.showimpact.clm, args);
				}
			}
		});
	} else if (player === "Browser") {
		$.extend(drcom, {
			openPdf: function(fileUrl) {
				var url = fileUrl;
                this.check(url, function(isExisted) {
                    if (isExisted){
						window.location.href = url;
					}
				});
			},
			
			openLinkExternal: function (url, type) {
				if (url) {
					window.open(url, type || "_blank");
				}
			}
		});
	} else if (player === "Engage") {
		$.extend(drcom, {
			gotoPresentation: function(slideName, presentationId) {},

			gotoSlide: function(slideId) {
				var slide = slideId;
				if (slide) {
					if (!slide.id) slide = this.getSlide(slide);
					if (slide && slide.guid && slide.docid) {
						var location = window.location;
						window.location.href = location.protocol + "//" + location.host + "/" + slide.guid + "/0000000/000000/000/" + slide.docid + "/production/" + slide.name + "/" + slide.name + ".html";
					}
				}
			}
		});
	} else if (player === "Agnitio") {
		$.extend(drcom, {
			gotoPresentation: function(slideName, presentationId) {},

			saveAgSlideEnter: function() {
				if (window.ag) {
					var params = this.agSlideData();
					setTimeout(function() {
						ag.submit.slide(params);
					}, 200);
				}
			},

			saveAgSlideExit: function() {
				if (window.ag) {
					var params = this.agSlideData();
					setTimeout(function() {
						ag.submit._slideExit(params);
					}, 200);
				}
			},

			agSlideData: function() {
				var slide = this.getCurrentSlide(),
					name = slide.name,
					title = slide.title,
					id = slide.id;
				return {
					name: title,
					id: id,
					chapter: name,
					chapterId: name.replace(/ /g, '_'),
					subChapter: name,
					subChapterId: name.replace(/ /g, '_'),
					path: this.config.presentationName + '/' + name
				};
			},
		});
	} else if (player === "HarVie") {
		$.extend(drcom, {
			gotoSlide: function(slide) {
				var slideName = this.getSlideName(slide);
				if (slideName) {
					this._savePrevSlide(slide);

					$(document).trigger("beforeGotoSlide");
					SystemBridge.goToSlide(slideName);
				}
			},
			enableSwipe: function() {
				SystemBridge.enableSwipeToPage();
			},
			disableSwipe: function() {
				SystemBridge.disableSwipeToPage();
			}
		});

		//disble swipe on element
		var drcom_disableswipe = $.fn.drcom_disableswipe;
		$.fn.drcom_disableswipe = function() {
			$(window).on("touchstart mousedown", $(this).selector, function() {
				return false;
			});
			drcom_disableswipe.apply(this, arguments);
		};
	} else if (player === "MI") {
		$(document.body).attr({
			"data-prevent-left-swipe": "true",
			"data-prevent-right-swipe": "true"
		});

		try {
			$.extend(drcom, {
				gotoSlide: function(slide) {
					//console.log("Go to Slide MI");
					
					var slideName = this.getSlideName(slide);
					console.log("SlideName:"+slideName);
					if (slideName) {
						this._savePrevSlide(slide);

						$(document).trigger("beforeGotoSlide");
						window.parent.navigateToSequence(slideName, 'noanimation');
					}
				},
				gotoPresentation: function(slide, presentationId) {
					if (presentationId) this.storage.set("currentFlowId", presentationId);

					var slideName = this.getSlideName(slide, presentationId);
					console.log("Presentation:"+presentationId+"||SlideName:"+slideName);
					if (slideName) {
						this._savePrevSlide(slide);

						$(document).trigger("beforeGotoSlide");
						window.parent.navigateToSequence(slideName, 'noanimation');
					}
				}
			});
		} catch(err) { console.log(err); }
	} else if (player === "OCE") {
		//Defines an area of the screen where the swiping action is ignored by the CLM player

		
		var OCESwipeConfig = drcom && drcom.config && drcom.config.OCESwipe ? drcom.config.OCESwipe : {};
		if (!OCESwipeConfig || !OCESwipeConfig.isEnable) {
			var element = OCESwipeConfig.element;
			var top = OCESwipeConfig.top;
			var left = OCESwipeConfig.left;
			var width = OCESwipeConfig.width;
			var height = OCESwipeConfig.height;

			window.CLMPlayer && window.CLMPlayer.defineNoSwipeRegion && window.CLMPlayer.defineNoSwipeRegion(element || 'container', top || 0, left || 0, width || 2048, height || 1536);
		}

		$.extend(drcom, {

			//get externalid from menu.json
			getSlideExternalid: function(arg1, arg2) {
				if (typeof arg1 === "string") {
					if (/^\d+$/.test(arg1)) {
						arg1 = parseInt(arg1);
					} else return arg1;
				}
	
				if (typeof arg1 === "number") {
					slide = drcom.getSlide(arg1, arg2);
					return slide.externalid;
				}
	
				if (arg1.externalid) {
					return arg1.externalid;
				}
	
				return false;
			},
			

			gotoPresentation: function (slide, presentationId, slideName) {
				this.gotoSlide(slide, presentationId, slideName);
			},

			gotoSlide: function (slide, presentationId, slideName) {
				var externalid = this.getSlideExternalid(slide, presentationId);
				if (externalid) {
					if (presentationId) { //save presentationId state when go to presentation 
						var state = this.getOCEState() || {};
						state.currentFlowId = presentationId;
						
						this.setOCEState(state);
						this.storage.set("currentFlowId", presentationId);
					}
					if (CLMPlayer && CLMPlayer.gotoSlide) {
						CLMPlayer.gotoSlide(externalid, (slideName || '01_index') + '.html');
					}
				}
			},

			openPdf: function (url) {
				// create <a> tag with href and append to <body>
				// trigger click on <a> tag
				// remove <a> tag from DOM

				var timer = new Date().getTime();
				$('<a class="oce-player-pdf-' + timer + '" href="' + url + '"></a>').appendTo($('body')).hide();
				$(".oce-player-pdf-" + timer)[0].click();
				$(".oce-player-pdf-" + timer).remove();
			}
		});
	} else if (player === "Exploria") {
		$.extend(drcom, {
			getGuid: function(arg1, arg2) {
				if (typeof arg1 === "string") {
					if (/^\d+$/.test(arg1)) {
						arg1 = parseInt(arg1);
					} else return arg1;
				}

				if (typeof arg1 === "number") {
					var slide = drcom.getSlide(arg1, arg2);
					return slide.guid;
				}

				if (arg1.guid) return arg1.guid;

				return false;
			},

			gotoPresentation: function(slide, presentationId) {
				this.storage.set("currentFlowId", presentationId);
				this.gotoSlide(slide, presentationId);
			},

			gotoSlide: function(slide, presentationId) {
				var guid = this.getGuid(slide, presentationId);
				if (guid && goToSlide) {
					this._savePrevSlide(slide);
					$(document).trigger("beforeGotoSlide");
					goToSlide(guid);
				}
			}
		});
	}

	drcom.setFlow();
});
