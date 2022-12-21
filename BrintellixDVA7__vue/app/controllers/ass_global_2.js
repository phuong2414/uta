var $ = require("jquery");
var nav = require("nav");
var rivets = require('rivets');
var utils = require('utils');

rivets.configure({
    // extracted from: https://github.com/mikeric/rivets/issues/258#issuecomment-52489864
    // This configuration allows for on- handlers to receive arguments
    // so that you can onclick="steps.go" data-on-click="share"
    handler: function(target, event, binding) {
        var eventType = binding.args[0];
        var arg = target.getAttribute('data-on-' + eventType);

        if (arg) {
            this.call(binding.model, arg);
        } else {
            // that's rivets' default behavior afaik
            this.call(binding.model, event, binding);
        }
    }
});

nav.onready(function(params) {
    console.log("nav onready");
    console.log("params: ", params);

    const actTab_Brintellix_40 = localStorage.getItem('actTab_Brintellix_40');
    console.log("actTab_Brintellix_40: ", actTab_Brintellix_40);

    const actPU8Sub_Brintellix_55 = localStorage.getItem('actPU8Sub_Brintellix_55');
    console.log("actPU8Sub_Brintellix_55: ", actPU8Sub_Brintellix_55);

    const actPU8Sub_Brintellix_48 = localStorage.getItem('actPU8Sub_Brintellix_48');
    console.log("actPU8Sub_Brintellix_48: ", actPU8Sub_Brintellix_48);


    let tapText = null,
        tap55PU8 = null,
        tap48PU8 = null;

    if (actTab_Brintellix_40 === 'show_Brintellix_40_1') {
        tapText = document.getElementById('co-text_5802f57b');
    }
    if (actPU8Sub_Brintellix_55 === 'show_Brintellix_55_pu08Sub') {
        tap55PU8 = document.getElementById('co-image_9e40ee72');
    }
    if (actPU8Sub_Brintellix_48 === 'show_Brintellix_48_pu08Sub') {
        tap48PU8 = document.getElementById('kj8tweveImage');
    }


    if (tapText !== null) {
        utils.dispathEvent(tapText, 'tap');
        localStorage.setItem('actTab_Brintellix_40', '');
    }
    if (tap55PU8 !== null) {
        utils.dispathEvent(tap55PU8, 'tap');
        localStorage.setItem('actPU8Sub_Brintellix_55', '');
    }
    if (tap48PU8 !== null) {
        utils.dispathEvent(tap48PU8, 'auto');
        localStorage.setItem('actPU8Sub_Brintellix_48', '');
    }
});

module.exports = function(scope) {
    scope.actTab_Brintellix_40 = function(args) {
        console.log("actTab_Brintellix_40");
        console.log("args: ", args);

        nav.goto({
            slide: "Brintellix_40"
        });

        setTimeout(function() {
            localStorage.setItem('actTab_Brintellix_40', args);
        }, 100);
    }

    scope.actPU8Sub_Brintellix_55 = function(args) {
        console.log("actPU8Sub_Brintellix_55");
        console.log("args: ", args);
        nav.goto({
            slide: "Brintellix_55"
        });

        localStorage.setItem('actPU8Sub_Brintellix_55', args);
    }

    scope.actPU8Sub_Brintellix_48 = function(args) {
        console.log("actPU8Sub_Brintellix_48");
        console.log("args: ", args);
        nav.goto({
            slide: "Brintellix_48"
        });

        localStorage.setItem('actPU8Sub_Brintellix_48', args);
    }

    scope.show_Brintellix_48_popup = function(args) {
        console.log("show_Brintellix_48_popup tapped");
        console.log("args: ", args);

        scope.m[args].showOnSlideEnter = true;
    }

    scope.show_Brintellix_31 = function() {
        $('.tab_title').bind('click', function(event) {
            $($(this).addClass('act')).siblings('.tab_title').removeClass('act');
            if ($(this).hasClass('tab_title2')) {
                $('.tab_content2').fadeIn(300);
            } else {
                $('.tab_content2').fadeOut(300);
            }
        });
        $('.go_down_btn').bind('click', function(event) {
            $(this).stop().toggleClass('up');
            $('.scroll_content').stop().toggleClass('up');
        });
    }
    scope.show_Brintellix_32 = function() {
        $('.go_down_btn').bind('click', function(event) {
            $(this).stop().toggleClass('up');
            $('.scroll_content').stop().toggleClass('up');
        });
    }
    scope.show_Brintellix_33 = function() {
        $('#kj8tvungImage').bind('click', function(event) {
            $('#co-container_b36d3ba7').css('left', '338px');
            $('#co-image_4a1ba05f').show(0);
        });
        $('#co-image_4a1ba05f').bind('click', function(event) {
            $('#co-container_b36d3ba7').css('left', '0');
            $('#co-image_4a1ba05f').hide(0);
        });
    }
    scope.show_Brintellix_39 = function() {
        $('.tab_title').bind('click', function(event) {
            $($(this).addClass('act')).siblings('.tab_title').removeClass('act');
            if ($(this).hasClass('tab_title2')) {
                $('.tab_content2').fadeIn(300);
            } else {
                $('.tab_content2').fadeOut(300);
            }
        });
    }

    scope.show_Brintellix_40 = function() {
        $('#co-text_0a8afdcf').addClass('act');
        $('#co-text_5802f57b').removeClass('act');
        $('.tab_content1').show();
        $('.tab_content2').hide();
    }
    scope.show_Brintellix_40_1 = function() {
        $('#co-text_0a8afdcf').removeClass('act');
        $('#co-text_5802f57b').addClass('act');
        $('.tab_content1').hide();
        $('.tab_content2').show();
    }

    scope.show_Brintellix_44 = function() {
        $('.tab_title').bind('click', function(event) {
            $($(this).addClass('act')).siblings('.tab_title').removeClass('act');
            $('.tab_content').removeClass('act').fadeOut(300);
            $('.' + $(this).data('tab')).addClass('act').fadeIn(300);
        });
    }
    scope.show_Brintellix_48 = function() {
        $('.go_down_btn').bind('click', function(event) {
            $(this).stop().toggleClass('up');
            $('.scroll_content').stop().toggleClass('up');
        });
    }

    scope.study_design = function(args) {
        console.log("previous_asset");
        console.log("args: ", args);
        let localStorageData = args.split(',');
        nav.goto({
            slide: localStorageData[1]
        });
        localStorage.setItem('previous_asset', localStorageData[0]);
        // setTimeout(function() {
        // localStorage.setItem('previous_asset', localStorageData[0]);
        // }, 100);
    }
    scope.study_design_back = function() {
        let backAsset = localStorage.getItem('previous_asset') || "";
        if (backAsset !== "") {
            //setTimeout(function() {
            localStorage.setItem('previous_asset', "");
            //}, 100);
            nav.goto({
                slide: backAsset
            });
        }
    }

};