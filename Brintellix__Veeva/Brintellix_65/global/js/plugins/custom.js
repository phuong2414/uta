drcom.ready(function () {
	var cus = drcom.config.customPlugin;

	if (cus && cus.isShow) {
		var src = [];
		var paths = cus.template;
		var pos = cus.positionAppend;

		if(paths.length){
			paths.forEach(function(path, i) {
				var temp = require([path], function(content) {
					src.push(content);
					console.log(pos[i])					
					if(pos[i])
						$(pos[i]).append(content);
					else 
						$('#container').append(content)
				});
			});
			console.log(src);
		} else {
			console.log('empty');
		}
	}
});