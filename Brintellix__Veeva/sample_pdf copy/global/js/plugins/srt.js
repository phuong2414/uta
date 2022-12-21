require([], function() {
	Drcom.Srt = Drcom.Controller.extend({
		pluginName:"drcom_srt",
		init: function(video, options){
			this.super.init.apply(this,arguments);
			
	        this.video = video;
	        this.setOptions(options);
			this.container=$(this.options['container']);
	        var instance = this;
	        var srt = video.attr("srt");
	        this.load(srt, function(data){
	        	instance.playSubtitles(data);
	        });
	    },
	    setOptions: function(options){
	        var defaultOptions = {
	            container: null,
	            delay: 200,
				duration:500,
	            callback: function(id,text, during,subtitles){
	            
	            }
	        };
	        this.options = $.extend(false, defaultOptions, options);
	    },
	    load: function(srt, callback){
	        return $.get(srt, callback);
	    },
	    toSeconds: function(t){
	        var s = 0.0
	        if (t) {
	            var p = t.split(':');
	            for (i = 0; i < p.length; i++) 
	                s = s * 60 + parseFloat(p[i].replace(',', '.'))
	        }
	        return s;
	    },
	    strip: function(s){
	        return s.replace(/^\s+|\s+$/g, "");
	    },
	    setSubtitle: function(id,text){

			if(id==-1)
			{
				$("div",this.container).hide();
				return;
			}
			var newsub=$("#sub"+id,this.container);
			$("div",this.container).not(newsub).hide();
	        newsub.show("fade",this.options.duration);

		},
	    /**
	     * Element display, data
	     * @param {Object} subtitleElement
	     * @param {Object} srt
	     */
	    playSubtitles: function(srt){
	    
	        var options = this.options;
	        var me = this;
	        
	       // var videoId = this.video.attr("id");
		   var video=this.video[0];
	        srt = srt.replace(/\r\n|\r|\n/g, '\n')
	        var subtitles = [];
	        srt = this.strip(srt);
	        var srt_ = srt.split('\n\n');
	        var s = 0;
	        for (s in srt_) {
	            st = srt_[s].split('\n');
	            if (st.length >= 2) {
	                n = st[0];
	                i = this.strip(st[1].split(' --> ')[0]);
	                o = this.strip(st[1].split(' --> ')[1]);
	                t = st[2];
	                if (st.length > 2) {
	                    for (j = 3; j < st.length; j++) 
	                        t += '\n' + st[j];
	                }
	                is = this.toSeconds(i);
	                os = this.toSeconds(o);
	                subtitles.push({
						id:n,
	                    i: i,
	                    o: o,
	                    t: t,
	                    is: is
	                });
	            }
	        }
			if(this.container!=null)
			{
				for(var i=0;i<subtitles.length;i++)
				{
					var div=$("<div style='display:none' id='sub"+subtitles[i].id+"'>"+subtitles[i].t+"</div>");
					this.container.append(div);
				}
				
			}

	        var currentSubtitle = -1;
	        this.timer = setInterval(function(){
	            var currentTime = video.currentTime;//document.getElementById(videoId).currentTime;
	            currentTime = parseFloat(currentTime);
	            var subtitle = null;
	            for (var i = subtitles.length - 1; i >= 0; i--) {
	                var s = subtitles[i];
	                if (s.is < currentTime) {
	                    subtitle = s;
	                    break;
	                }
	                
	            }
	            if (subtitle != null) {
	            
	                if (subtitle.is != currentSubtitle) {
	                    var text = subtitle.t;
	                    
	                    me.setSubtitle(subtitle.id,text);
	                    currentSubtitle = subtitle.is;
	                    options['callback'].apply(this, [parseFloat(subtitle.id),text, subtitle.is,subtitles])

	                }
	            }
	            else {
	               // me.setSubtitle(-1,video.tagName);
	            }
	        }, this.options['delay']);
	    },
	    destroy:function(){
	    	clearInterval(this.timer);
	    	this.super.destroy.apply(this,arguments);
	    }
	});
	
	$.fn.drcom_srt = function(options) {
		$(this).each(function(){
			new Drcom.Srt($(this),options);
		});
		return $(this);
	};

})();