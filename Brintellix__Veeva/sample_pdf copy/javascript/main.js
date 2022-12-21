drcom.ready(function(){
    drcom.disableSwipeRight();
    
    $('#container').bind('swipeoneright',function(){
		drcom.gotoSlide(1);
	});

	$('.tap_1').bind('tapone', function(){
		drcom.gotoSlide(24);
	});	
	
    $('.tap_2').bind('tapone', function(){
		drcom.gotoSlide(26);
	});	
    
    $('.tap_3').bind('tapone', function(){
		drcom.gotoSlide(27);
	});	
    
    $('.tap_4').bind('tapone', function(){
		drcom.gotoSlide(28);
	});	

	

});
