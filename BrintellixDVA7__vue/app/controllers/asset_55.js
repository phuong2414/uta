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

    const actPU8_Brintellix_55 = localStorage.getItem('actPU8Sub_Brintellix_55');
    console.log("actPU8_Brintellix_55: ", actPU8_Brintellix_55);

    let tap55PU8 = null,
        tapTextButton = null;

    if (actPU8_Brintellix_55 === 'show_Brintellix_55_pu08Sub') {
        tap55PU8 = document.getElementById('co-image_9e40ee72');

        if (tap55PU8 !== null) {
            console.log("tap55PU8");
            // utils.dispathEvent(tap55PU8, 'tap');
            utils.dispathEvent(tap55PU8, 'auto');
            localStorage.setItem('actPU8Sub_Brintellix_55', '');
        }
    }

    let buttonBackOpenningPopup = localStorage.getItem('button_back_openning_popup') || "";
    if (buttonBackOpenningPopup !== "") {
        tapTextButton = document.getElementById(buttonBackOpenningPopup);
        utils.dispathEvent(tapTextButton, 'auto');
        localStorage.setItem('button_back_openning_popup', '');
    }
});

module.exports = function(scope) {
    scope.show_Brintellix_55 = function() {
        $('.tab_title').bind('click', function(event) {
            $($(this).addClass('act')).siblings('.tab_title').removeClass('act');
            if ($(this).hasClass('tab_title2')) {
                $('.tab_content2').fadeIn(300);
            } else {
                $('.tab_content2').fadeOut(300);
            }
        });
        $('.pu3_tab_title').bind('click', function(event) {
            $($(this).addClass('act')).siblings('.pu3_tab_title').removeClass('act');
            if ($(this).hasClass('pu3_tab_title2')) {
                $('.pu3_tab_content2').fadeIn(300);
                $('#co-container_88679ddd').fadeOut(300);
            } else {
                $('.pu3_tab_content2').fadeOut(300);
                $('#co-container_88679ddd').fadeIn(300);
            }
        });
        $('.go_down_btn').bind('click', function(event) {
            $('#co-container_7512a778').toggleClass('border_bot');
            $(this).stop().toggleClass('up');
            $('.scroll_content').stop().toggleClass('up');
        });
        $('.go_down_btn2').bind('click', function(event) {
            $(this).stop().toggleClass('up');
            $('#co-image_cc2ffe67').stop().toggleClass('up');
        });
        $('#co-image_c5f32624').bind('click', function(event) {
            $(this).stop().toggleClass('up');
            $('#co-container_83f10732').stop().toggleClass('up');
        });
    }

    // scope.show_Brintellix_55_pu08Sub = function(args) {
    //     console.log("show_Brintellix_55_pu08Sub tapped");
    //     console.log("args: ", args);

    //     scope.m[args].showOnSlideEnter = true;
    //     // scope.m["co-popup_b83a23ee"].visible = true;
    //     // scope.m["co-popup_b83a23ee"].showOnSlideEnter = true;
    //     // scope.m["co-popup_b83a23ee"].wasOpened = true;
    //     // console.log("scope:", scope);
    // }
    scope.hide_Brintellix_55_pu08Sub = function() {
        scope.m["co-popup_b83a23ee"].visible = false;
        scope.m["co-popup_b83a23ee"].showOnSlideEnter = false;
        // scope.m["co-popup_b83a23ee"].wasOpened = false;
    }

    scope.study_design_back_popup = function(args) {
        console.log("previous_asset");
        console.log("args: ", args);
        let localStorageData = args.split(',');
        nav.goto({
            slide: "Brintellix_70"
        });
        //setTimeout(function() {
        localStorage.setItem('previous_asset', localStorageData[0]);
        localStorage.setItem('button_back_openning_popup', localStorageData[1]);
        //}, 100);
    }
    scope.show_Brintellix_55_popup = function(args) {
        console.log("show_Brintellix_55_popup tapped");
        console.log("args: ", args);

        scope.m[args].showOnSlideEnter = true;
    }

    scope.study_design_back_popup3 = function(args) {
        console.log("previous_asset");
        console.log("args: ", args);
        let localStorageData = args.split(',');
        nav.goto({
            slide: "Brintellix_87"
        });
        //setTimeout(function() {
        localStorage.setItem('previous_asset', localStorageData[0]);
        localStorage.setItem('button_back_openning_popup', localStorageData[1]);
        //}, 100);
    }
    scope.show_Brintellix_55_popup3 = function(args) {
        console.log("show_Brintellix_55_popup tapped");
        console.log("args: ", args);
        scope.m[args].showOnSlideEnter = true;
    }
};