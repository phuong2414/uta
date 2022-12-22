require([], function() {
	Drcom.SwitchTransition = Drcom.Controller.extend({
		pluginName:"drcom_switchtransition",
        init: function (el, options) {
        	this.super.init.apply(this,arguments);
			$.extend(this.options,{
				duration: 1000,
	            type: "switchEffect",//switchEffect,switchEffectCircle
	            onBeforeSwitch:function(ui,current,index){},
	            onBeforeShow:function(ui,current,index){},
	            onShow:function(ui,current,index){},
	            click: function(ui,current){}
			},this.options,options);
	    	

			
			this.block = false;
            this.current = 0;
            this.items = this.element.children();
            this.cols = [];
            this._bindEvents();
          
           this._savezIndex();
		},
		_savezIndex: function() {
            _.each(this.items, function(item) {
                item = $(item)
                item.attr("zIndex", item.css("z-index"));
            }, this);
		},
        _bindEvents: function() {
            var instance = this;
            _.each(this.items, function(item) {
                this.cols.push(item);
                this.bind(item, "tapone", this.itemHandler);
            }, this);
        },
        itemHandler: function() {
            for (var j = 0; j < instance.cols.length; j++)  {
                if (instance.cols[j] == this && j == instance.current) {
                    //instance.block = false;
                    instance.options.click.apply(this, [instance,instance._getItemsIndex(j)]);
                    return;
                }
                if (instance.cols[j] == this) instance.select(j);
            }
        },
        animationEnd: function(current,index) {
            this.block = false;
            this._savezIndex();
            this.onShow(this._getItemsIndex(current),this._getItemsIndex(index));
        },
        select: function(index) {
            if (!this.block) {
                this.block = true;
                this.items.removeClass("active");
                $(this.items[index]).addClass("active");

                var current = this._getItemsIndex(this.current);
                var itemsIndex = this._getItemsIndex(index);
                this.onBeforeSwitch(current,itemsIndex);
                this.onBeforeShow(current,itemsIndex);
                this["_" + this.options.type](index);
            }
        },
        _getItemsIndex: function(index) {
            var compareItem = this.cols[index];
            return _.indexOf(this.items, function(item) {
                return compareItem == item;
            });
        },
        _switchEffect: function(index) {
            var instance = this;
            var current = this.current;
            this._switchbox({
                element1: $(this.cols[current]),
                element2: $(this.cols[index])
            }, this.options.duration, function(){
                instance.animationEnd(current,index);
                //swap cols
                var temp = instance.cols[current];
                instance.cols[current] = instance.cols[index];
                instance.cols[index] = temp;
            });
        },
        _switchEffectCircle: function(index) {
            var instance = this,
                current = this.current,
                count = 0;
            function getPosition(pos, distance, total) {
                pos = pos - distance;//-2;
                if (pos < 0)  pos += total;
                return pos;
            }
            function _callback() {
                count = count + 1;
                if (count == this.cols.length)  {
                     this.animationEnd(current, index);

                    //save pos
                    var colstemp = this.cols.slice(0);//clone
                    _.each(this.cols, function(col, i) {
                        var pos = getPosition(i, index, this.cols.length);
                         this.cols[pos] = colstemp[i];
                    }, this);
                }
            }

            for (var i = this.cols.length-1; i>= index; i--) {
           	 	var zIndex=$(this.cols[this.cols.length-i-1]).attr("zIndex");
           	 	$(this.cols[this.cols.length-1+index-i]).data("zIndex", zIndex);
            }
            
            for (var i = 0; i < index; i++) {
            	var zIndex=$(this.cols[this.cols.length-i-1]).attr("zIndex");
                $(this.cols[index-i-1]).data("zIndex", zIndex);
            }

            _.each(this.cols, function(col, i) {
                var pos = getPosition(i, index, this.cols.length);
                
                var to = $(this.cols[pos]);
                $(col).animate({
                    transform: to.css("-webkit-transform"),
                    "z-index": $(col).data("zIndex")
                }, this.options.duration, function() {
                    _callback.apply(instance);
                });
            }, this);
        },
        _switchbox: function(options, duration, callback) {
            var box1 = options.element1,
                box2 = options.element2,
                save = ['transform', "z-index"],
                pro1 = {}, pro2 = {};

            _.each(save, function(s) {
                pro1[s] = box1.css(s);
                pro2[s] = box2.css(s);
            });

            var counter = 0;
            function end() {
            	if (++counter >= 2) callback();
            }
            box1.animate(pro2, duration, end);
            box2.animate(pro1, duration, end);
        },
        onBeforeSwitch: function(current,index) {
            this.options.onBeforeSwitch.apply(this.items[index],[this,current,index]);
        },
        onBeforeShow: function(current,index) {
            this.options.onBeforeShow.apply(this.items[index],[this,current,index]);
        },
        onShow: function(current,index) {
            this.options.onShow.apply(this.items[index],[this,current,index]);
        },
        destroy: function() {
            this._super(); //make sure you call super!
        }
    });
	$.fn.drcom_switchtransition = function(options) {
		$(this).each(function() {
			new Drcom.SwitchTransition($(this),options);
		});
		return $(this);
	};
});