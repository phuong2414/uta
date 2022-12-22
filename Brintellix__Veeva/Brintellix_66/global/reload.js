(function () {
	var myReload = {
		config : {
			actionName : '',
			content : '',
			selector : '#main_container',
			timeout : 70
		},
		init : function (params) {
			$.extend( this.config, params);
			this.saveContainer(this.config.selector);
		},
		saveContainer : function() {
			if(this.config.content !='') 
				return;
			this.config.content = $(this.config.selector).html();
		},
		action : function() {
			if( this.config.content == '') {
				console.log('have no content');
				return;
			}
			$(this.config.selector).html( this.config.content );
			var actionName = this.config.actionName;
			if( actionName == '' ) return;
			setTimeout(function(){
				actionName();
			}, this.config.timeout);
		}
	}
	window.drcom.reload = $.extend(true, {}, myReload);
	window.drcom.reload.init();
})();