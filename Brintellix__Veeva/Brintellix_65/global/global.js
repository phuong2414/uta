drcom.ready([], function () {
	var OralairFlow = [1,2,3,4,5,6,7,8,9,10,12,11,13,150],
		StaloralFlow = [15,16,17,18,19,20,21,22,23,24,25,26,27,28,151];
	var currIdAss = drcom.getCurrentSlide().id;
	var curIdPrez = drcom.currentFlowId;
	
    require(['text!../nav_main.html', 'text!../nav_main1.html'],
	function(MAIN_temp, MAIN1_temp){
		console.log('=====:', curIdPrez);
        console.log('=====:', MAIN_temp);
		if(OralairFlow.includes(currIdAss)){
			$('#menu').append(MAIN_temp);
		} else if(StaloralFlow.includes(currIdAss)){
			$('#menu').append(MAIN1_temp);
		}		
	});	
	
	$('.btn_sitemap').bind('tapone', function(){
		var curr_flow = drcom.storage.get('curr_flow');	
        $('.btn_sitemap').addClass('active');
		//drcom.storage.set('prevSlide', prevSlide);
		if(OralairFlow.includes(currIdAss)){
			gotoPrez('OralairFlow',150);
		} else if(StaloralFlow.includes(currIdAss)){
			gotoPrez('StaloralFlow',151);
		}			 
	});
    
    $('.icon_lf1').bind('tapone', function(){
		drcom.gotoSlide(2);		
	});
    
    $('.icon_lf4').bind('tapone', function(){
		drcom.gotoSlide(15);		
	});
	
    $('.btn_home').bind('tapone', function(){
		drcom.gotoSlide(1);		
	});
    
    $(".btn_note").bind('tapone', function() {
        $(".btn_note").toggleClass('act');
        $('.bg_note').toggle();
    });
    
    $(".btnSty").bind('tapone', function() {
        $('.sty_container').fadeIn(500);
    });
    
    $(".sty_close").bind('tapone', function() {
        $('.sty_container').fadeOut(500);
    });
    

    /*pdf*/    
    $('.staloral_flow .btn_smpc').bind('tapone',function(){			
		if( !$(this).hasClass('act') ){
			drcom.disableSwipe();
			$(this).addClass('act');
			$('.pi_wrapper').stop().fadeIn(300);
			
		}else{
			drcom.enableSwipe();
			$(this).removeClass('act');
			$('.pi_wrapper').stop().fadeOut(300);
		}
	});    
    $('.staloral_flow .pi_subnav >div').bind('click', function(){
        var linkPdf = $(this).attr('data-pdf');

        if(linkPdf==undefined || linkPdf=='' || linkPdf==null)
            return;

        try {
            window.location.href = "global/pdfs/" + linkPdf;
        } catch (e) {}
    });
	
	/**/
	$('.oralair_flow .btn_smpc').bind('click', function(){
        var linkPdf = $(this).attr('data-pdf');

        if(linkPdf==undefined || linkPdf=='' || linkPdf==null)
            return;

        try {
            window.location.href = "global/pdfs/" + linkPdf;
        } catch (e) {}
    });
    
    $('.staloral_flow .btn_res').bind('click', function(){
        var linkPdf = $(this).attr('data-pdf');

        if(linkPdf==undefined || linkPdf=='' || linkPdf==null)
            return;

        try {
            window.location.href = "global/pdfs/" + linkPdf;
        } catch (e) {}
    });
    
	 
	/*-------ref scroll-------*/
	
    if ($('.ref_content').length > 0){		
        $(".btn_ref").bind('tapone', function() {
            showRef();
        });
	}	
    else{
        $(".btn_ref").addClass('disable_ref');
	}
	
    $(".ref_close").bind('tapone', function () {
        closeRef();
    });
    
	
    $(".disable_ref").unbind("tapone");
	$(".ref_container").drcom_disableswipe();
});

(function() {
    $("#container").delegate(".scroll_ref .close",'tapone',closeRef);
    $(document).bind("beforeGotoSlide",function(){
        closeRef();
    });
})();

function closeRef() {
    drcom.button.deactive("ref");
    $(".ref_container").css('display','none');
    $(".btn_ref").removeClass('active');
}

function showRef() {
    var content=$(".ref_container");
    if(content.is(":visible")) {
        closeRef();
    } else {
        drcom.button.active("ref");
        $(".ref_container").stop().fadeIn(); 
        $(".btn_ref").addClass('active');
    }
}

function gotoPrez(flow_name,slideid){
	if( !flow_name || !slideid)
		return;
	drcom.storage.set('curr_flow',flow_name);
	drcom.gotoSlide(slideid);
};
    


