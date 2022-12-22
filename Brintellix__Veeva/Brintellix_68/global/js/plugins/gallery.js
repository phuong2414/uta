require([], function() {
	Drcom.Gallery = Drcom.SlideShow.extend({
		pluginName:"drcom_gallery",
		init:function(el,options) {
			this.super.init.apply(this,[el,options]);
			$.extend(this.options,{
				current:0,
				enableAnimation:true
			},this.options,options);
	    	
			
			var items=this.items;
			for(var i=0;i<items.length;i++)
			{
				$(items[i]).attr("index",i);
			}
			if(this.options.cycle==false)
			{
				for(var i=0;i<this.options.current;i++)
				{
					el.prepend($("<div style='display:none'></div>"));
				}	
			}
			else
			{
				for(var i=this.items.length-1;i>this.items.length-1-this.options.current;i--)
				{
					el.prepend(this.items[i]);
				}		
			}
			this.items=this.element.children();
		},
		_bindEvents:function()
		{
			var instance=this;
			this.bind(this.items,"tapone",function(ev){
				return instance._item_click($(this),ev);
			});

			this.super._bindEvents.apply(this,arguments);
		},
		getItemsIndex:function(current)
		{
			return $(this.items[current]).attr("index");
		},
		change:function(index)
		{

			if (this.blocked == true )
	            return false;
	        this.blocked = true;
	        
	        var current = this.current;
	      
	        this._trigger("onBeforeSelect", null, [this,this.getItemsIndex(current), this.getItemsIndex(index)]);
	        var instance=this;

	        function end()
	        {
	        	this._trigger("onAfterSelect", null, [this,this.getItemsIndex(current), this.getItemsIndex(index)]);
	        	this.items=this.element.children();
	        	this.blocked=false;	        	
	        }
            $(this.items[index]).bind("webkitTransitionEnd.Drcom_Gallery",function(){
            	$(this).unbind("webkitTransitionEnd.Drcom_Gallery");
            	end.apply(instance);
            });        	

	        if(index>current)
	        {
	        	var firsts=_.first(this.items,index-current);
	        	function apppend(i)
	        	{
	        		if(i==firsts.length)
	        			return false;
	        		instance.element.append(firsts[i]);
	        		apppend(i+1);			

	        	}
	        	apppend(0);

	        }
	        else
	        {
	        	var lasts=Array.prototype.slice.call(this.items,index-current);
	        	function prepend(i)
	        	{
	        		if(i<0)
	        			return false;
	        		instance.element.prepend(lasts[i]);
	        		prepend(i-1);			

	        	}
	        	prepend(lasts.length-1);
	        }
	    	
	        return true;
		},
		_item_click:function(el,ev){
			var counter=0;
			_.find(this.items,function(iterator){
				if(iterator==el[0])
					return true;
				counter++;
			});
			if(counter==this.current)
			{
				this._trigger("click", null, [this,this.getItemsIndex(this.current)]);
			}
			else
				this.change(counter);
		}
	});
	
	$.fn.drcom_gallery=function(options) {
		$(this).each(function(){
			new Drcom.Gallery($(this),options);
		});
		return $(this);
	};
});