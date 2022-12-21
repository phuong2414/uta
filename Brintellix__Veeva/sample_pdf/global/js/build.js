({
    shim: {
        underscore: {
            exports: '_'
        },

        setup: ['jquery', 'underscore', 'webfont', 'veeva', 'showimpact'],
        drcom: ['setup'],
        controller: ['drcom'],
        player: ['drcom'],

        //jqueryui.effects
        'jquery.ui.effect': ['jquery'],
        'jquery.ui.effect-slide': ['jquery.ui.effect'],
        'jquery.ui.effect-fade': ['jquery.ui.effect'],
        'jquery.ui.effect-blind': ['jquery.ui.effect'],

        //effects
        'effects': ['jquery.ui.effect'],
        'effects.slidein': ["effects"],
        'effects.show': ["jquery.ui.effect"],

        'jquery.ui.core': ['jquery'],
        'jquery.ui.widget': ['jquery', 'jquery.ui.core'],
        'jquery.ui.mouse': ['jquery', 'jquery.ui.widget'],
        'jquery.ui.slider': ['jquery', 'jquery.ui.mouse'],
        'jquery.ui.draggable': ['jquery', 'jquery.ui.mouse'],
        'jquery.ui.droppable': ['jquery', 'jquery.ui.mouse'],

        breadcrumb: ['controller', 'player'],
        toolbar: ['controller', 'player'],
        marker: ['controller', 'player'],
        sitemap: ['controller', 'player', 'toolbar', 'iscrollv5'],
        button: ['controller', 'player'],
        drawing: ['controller', 'player'],
        circle: ['controller', 'player', 'svg'],
        increasenumber: ['controller', 'player'],
        slideshow: ['controller', 'player'],
        coverflow: ['controller', 'player', 'slideshow'],
        popup: ['controller', 'player'],
        srt: ['controller', 'player'],
        video: ['controller', 'player', 'jquery.ui.slider'],
        callsummary: ['controller', 'player', 'iscrollv5'],
        survey: ['controller', 'player'],
        menu: ['controller', 'player'],
        stylemenu: ['controller', 'player'],
        ref: ['controller', 'player', 'iscrollv5']
    },
    paths: {
        // vendors
        jquery: "vendor/jquery",
        underscore: "vendor/underscore",
        veeva: 'vendor/veeva',
        showimpact: 'vendor/showimpact',
        agnitio: 'vendor/agnitio',
        text: 'vendor/text',
        iscroll: 'vendor/iscroll',
        iscrollv5: 'vendor/iscrollv5',
        webfont: 'vendor/webfont',
        svg: 'vendor/svg',

        //jquery ui effects
        'jquery.ui.effect': "jqueryui/jquery.ui.effect.min",
        'jquery.ui.effect-slide': "jqueryui/jquery.ui.effect-slide.min",
        'jquery.ui.effect-blind': "jqueryui/jquery.ui.effect-blind.min",
        'jquery.ui.effect-fade': "jqueryui/jquery.ui.effect-fade.min",

        "effects": "effects/effects",
        "effects.slidein": "effects/slidein",
        "effects.show": "effects/show",

        //jquery ui wiget
        'jquery.ui.core': "jqueryui/jquery.ui.core.min",
        'jquery.ui.widget': 'jqueryui/jquery.ui.widget.min',
        'jquery.ui.mouse': "jqueryui/jquery.ui.mouse.min",
        'jquery.ui.slider': "jqueryui/jquery.ui.slider.min",
        'jquery.ui.draggable': "jqueryui/jquery.ui.draggable.min",
        'jquery.ui.droppable': "jqueryui/jquery.ui.droppable.min",

        // global
        drcom: 'drcom',

        // lib
        controller: 'lib/controller',
        setup: 'lib/setup',
        player: 'lib/player',

        // plugins
        breadcrumb: 'plugins/breadcrumb',
        toolbar: 'plugins/toolbar',
        circle: 'plugins/circle',
        marker: 'plugins/marker',
        sitemap: 'plugins/sitemap',
        button: 'plugins/button',
        drawing: 'plugins/drawing',
        increasenumber: 'plugins/increasenumber',
        slideshow: 'plugins/slideshow',
        coverflow: 'plugins/coverflow',
        popup: 'plugins/popup',
        srt: 'plugins/srt',
        video: 'plugins/video',
        callsummary: 'plugins/callsummary',
        survey: 'plugins/survey',
        menu: 'plugins/menu',
        stylemenu: 'plugins/stylemenu',
        ref: 'plugins/ref',
		custom: 'plugins/custom',
        requireLib: 'vendor/require'
    },

    baseUrl : ".",
    name: "loader",
    out: "dist/production.js",
    removeCombined: true,
    preserveLicenseComments: false,
    include: ["requireLib"]
})