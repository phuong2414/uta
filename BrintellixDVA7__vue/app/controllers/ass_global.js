var $ = require("jquery");
var nav = require("nav");
var rivets = require('rivets');
var slide = require('slide');
var structure = require('structure');

// returns thingA when thingB is true, otherwise returns null.
rivets.formatters['check-item'] = function(valueA, valueB) {
    return valueA === valueB;
}

rivets.formatters['check-homepage'] = function(valueA, valueB, valueC, valueD) {
    return valueA === valueB || valueC === valueD;
}

module.exports = function(scope) {
    scope.activeItem = slide.sid;
    for (let obj in structure.chapters) {
        if (structure.chapters[obj].content.includes(slide.id))
            scope.activeNavItem = structure.chapters[obj].id;
    }
    console.log("activeNavItem: ", scope.activeNavItem);

    scope.openSM = function() {        
        $("#co-container_0772c8f4").toggleClass('aniShowSM');
        $('.left_navi .nav_item').on('tap', function() {
            $('.left_navi .nav_item').removeClass('act');
            $(this).addClass('act');
            $('.thumb_wrap').removeClass('act');
            $('.thumb_wrap.' + $(this).data('thumb')).addClass('act');
            $('.dots .nav_item').removeClass('opacity05');
        });
        $('.dots .nav_item').on('tap', function() {
            $(this).removeClass('opacity05');
            $(this).siblings('div').addClass('opacity05');
        });
    }

    scope.show_Brintellix_5 = function() {
        $('#co-text_76673b60').bind('click', function() {
            showTab1();
            hideTab2();
            hideTab3();
            hideTab4();
            hideTab5();
        });

        $('#co-text_42f597dc').bind('click', function() {
            showTab2();
            hideTab1();
            hideTab3();
            hideTab4();
            hideTab5();
        });

        $('#co-text_76858a41').bind('click', function() {
            showTab3();
            hideTab1();
            hideTab2();
            hideTab4();
            hideTab5();
        });

        $('#co-text_97fceed1').bind('click', function() {
            showTab4();
            hideTab1();
            hideTab2();
            hideTab3();
            hideTab5();
        });

        $('#co-text_cbe811e9').bind('click', function() {
            showTab5();
            hideTab1();
            hideTab2();
            hideTab3();
            hideTab4();
        });

        function showTab1() {
            $('#co-text_76673b60').addClass('active');
            $('#co-image_8aa2b879').hide();
            $('#co-container_db68670e').show();
        }

        function hideTab1() {
            $('#co-text_76673b60').removeClass('active');
            $('#co-image_8aa2b879').show();
            $('#co-container_db68670e').hide();
        }

        function showTab2() {
            $('#co-text_42f597dc').addClass('active');
            $('#co-image_b2b782fa').hide();
            $('#co-container_11f19fd5').show();
        }

        function hideTab2() {
            $('#co-text_42f597dc').removeClass('active');
            $('#co-image_b2b782fa').show();
            $('#co-container_11f19fd5').hide();
        }

        function showTab3() {
            $('#co-text_76858a41').addClass('active');
            $('#co-image_8a957228').hide();
            $('#co-container_720bed1a').show();
        }

        function hideTab3() {
            $('#co-text_76858a41').removeClass('active');
            $('#co-image_8a957228').show();
            $('#co-container_720bed1a').hide();
        }

        function showTab4() {
            $('#co-text_97fceed1').addClass('active');
            $('#co-image_8aa53f1c').hide();
            $('#co-container_7cb92960').show();
        }

        function hideTab4() {
            $('#co-text_97fceed1').removeClass('active');
            $('#co-image_8aa53f1c').show();
            $('#co-container_7cb92960').hide();
        }

        function showTab5() {
            $('#co-text_cbe811e9').addClass('active');
            $('#co-image_91d5b722').hide();
            $('#co-container_4d1814a8').show();
        }

        function hideTab5() {
            $('#co-text_cbe811e9').removeClass('active');
            $('#co-image_91d5b722').show();
            $('#co-container_4d1814a8').hide();
        }
    }

    scope.show_Brintellix_21 = function() {
        $('#co-text-button_5381ac37').bind('click', function() {
            $(this).addClass('act').removeClass('de_act');
            $('#co-text-button_bcea6724').removeClass('act').addClass('de_act');
            $('#co-image_b5cb3cb6').removeClass('act').addClass('de_act');
            $('#co-container_bc96b3c9').fadeIn(300);
            $('#co-container_2dfb5531').fadeOut(300);
            $('#co-image_3734a346').fadeIn(300);
            $('#co-image_b5cb3cb6').fadeOut(300);
            $('#co-text-button_1de549f4').hide();
            $('#co-text-button_5774123f').show();
        });
        $('#co-text-button_bcea6724').bind('click', function() {
            $(this).addClass('act').removeClass('de_act');
            $('#co-text-button_5381ac37').removeClass('act').addClass('de_act');
            $('#co-image_3734a346').removeClass('act').addClass('de_act');
            $('#co-container_bc96b3c9').fadeOut(300);
            $('#co-container_2dfb5531').fadeIn(300);
            $('#co-image_3734a346').fadeOut(300);
            $('#co-image_b5cb3cb6').fadeIn(300);
            $('#co-text-button_1de549f4').show();
            $('#co-text-button_5774123f').hide();
        });
        $('#co-image_3734a346').bind('click', function() {
            $(this).toggleClass('ani');
            $('#co-container_bc96b3c9').toggleClass('ani');
        });
        $('#co-image_b5cb3cb6').bind('click', function() {
            $(this).toggleClass('ani');
            $('#co-container_2dfb5531').toggleClass('ani');
        });
    }

    scope.show_Brintellix_24 = function() {
        $('#kihkd5coImage').bind('click', function() {
            $(this).toggleClass('ani');
            $('#co-container_c7345d6b').toggleClass('ani');
        });
    }

    scope.show_Brintellix_25 = function() {
        $('#co-image_ad7ecfd7').bind('click', function() {
            $(this).toggleClass('ani');
            $('#co-container_f4f299f0').toggleClass('ani');
        });
    }

    scope.show_Brintellix_26 = function() {
        $('#co-image_d98abb8a').bind('click', function() {
            $(this).toggleClass('ani');
            $('#co-container_915961ae').toggleClass('ani');
        });
    }

    scope.show_Brintellix_28 = function() {
        $('#kihkdan2Image').bind('click', function() {
            $(this).toggleClass('aniArr');
            $('#co-container_116606ea').toggleClass('ani');
        });
    }
};