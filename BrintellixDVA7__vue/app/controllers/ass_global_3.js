var $ = require("jquery");

module.exports = function(scope) {
    const article = document.querySelector('article');
    article.addEventListener('popupleave', function(e) {
        console.log(e.detail.id);
        if (e.detail.id == "co-popup_1c8f2327")
            scope.m["co-video_bba12d98"].playing = false;
    });

    scope.show_Brintellix_58 = function() {
        $('#co-image_474f2d6e').bind('click', function() {
            $('#co-container_0e2786f1, #kja6ihlqImage').show();
            $('#co-container_51782315, #co-image_474f2d6e').hide();
            $('#co-text_d7e42221 > span > div').css('color', '#000 !important');
        });
        $('#kja6ihlqImage').bind('click', function() {
            $('#co-container_0e2786f1, #kja6ihlqImage').hide();
            $('#co-container_51782315, #co-image_474f2d6e').show();
        });
        $('.tap01').bind('click', function() {
            $('#co-container_0e2786f1, #kja6ihlqImage').show();
            $('#co-container_51782315, #co-image_474f2d6e').hide();
            $('#co-text_d7e42221 > span > div').addClass('ff1 fc2');
            $('#co-text_d7e42221 > span > div').removeClass('ff2 fc0');
            $('#co-text_4c4ea557 > span > div').removeClass('ff1 fc2');
            $('#co-text_4c4ea557 > span > div').addClass('ff2 fc0');
        });
        $('.tap02').bind('click', function() {
            $('#co-container_0e2786f1, #kja6ihlqImage').hide();
            $('#co-container_51782315, #co-image_474f2d6e').show();
            $('#co-text_4c4ea557 > span > div').addClass('ff1 fc2');
            $('#co-text_4c4ea557 > span > div').removeClass('ff2 fc0');
            $('#co-text_d7e42221 > span > div').removeClass('ff1 fc2');
            $('#co-text_d7e42221 > span > div').addClass('ff2 fc0');
        });
    }

    scope.show_Brintellix_66 = function() {
        $('#kja6ipsmImage').bind('click', function() {
            $('#kja6ipsgImage').fadeIn(300);
            $('#kja6iptcText').fadeIn(300);
        });
    }

    scope.show_Brintellix_67 = function() {
        $('#kja6iqusImage').bind('click', function() {
            $('#kja6iqujImage').fadeIn(300);
            $('#kja6iqvoText').fadeIn(300);
        });
    }

    scope.show_Brintellix_68 = function() {
        $('#kja6irz0Image').bind('click', function() {
            $('#kja6iryyImage').fadeIn(300);
            $('#kja6irzyText').fadeIn(300);
        });
    }

    scope.show_Brintellix_69 = function() {
        $('#kja6it4nImage').bind('click', function() {
            $('#kja6it4dImage').fadeIn(300);
            $('#kja6it5iText').fadeIn(300);
        });
    }
};