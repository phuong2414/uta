(function () { 
    //var player = "MI"; 
var player = "Browser"; 
    window.drcom = window.drcom || {};
    drcom = {
        readyTmp: [],
        ready: function() {
            var args = Array.prototype.slice.call(arguments),
                len = args.length,
                required, func;
            
            switch (len) {
                case 1:
                    func = args[0];
                    required = [];
                    break;
                default:
                    required = args[0];
                    func = args[1];
                    break;
            }

            if (this.readyComplete) {
                require(required, func);
            } else {
                this.readyTmp.push({
                    func: func,
                    required: required
                });
            }
        },

        readyExecute: function() {
            this.readyComplete = true;
            var requiredList = [];
            for (var i = 0; i < this.readyTmp.length; i++) {
                requiredList = requiredList.concat(this.readyTmp[i].required);
            }
            
            require(requiredList, function() {
                var args = arguments;
                for (var i = 0; i < drcom.readyTmp.length; i++) {
                    drcom.readyTmp[i].func.apply(window, arguments);
                }
            });
        }
    };

    drcom.config = {
        presentationName: "STALLERGENES_DE_Merger_eDA_2021",
        visibleMeasure: false,
        debug: false,
        debugUrl: "http://192.168.1.15:8080",
        
        player: player,//Veeva,Browser,MI,HarVie
        disableJs: false,
        baseUrl: "global/js",
        root: "../../",
        useSystemSwipe: false,
        stopAnimationBeforeGotoSlide: true,
        storageType: "sessionStorage",
        swipeInFourDirections: true,
    
        externalScripts: ['../../javascript/main'],
        menu: {
            isShow: false,
            hasImage: true,
            useDoubleTap: true,
            tapRevert: true,
            thumbPath: 'global/images/thumb_navi',
            submenu: {
                isShow: true,
                hasImage: true,
                thumbPath: 'global/images/thumb_navi',
                layout: 'vertical'
            }
        },
		
        preloadFonts: [],
		
        
        sitemap: {
            isShow: false,
            isMultiFlows: false,
            showHome: false,
            panToZoom: true,
            zoomMin:0.7,
            zoomStart: 0.7
        },
        
        callSummary: {
            isShow: false,
            saveToVeevaAccount: false,
            slides: [2,3,4,5,6,7,8,9,10],
            customTemplate: '../../javascript/Call_Summary.html',
            submittedBtnText: "XÁC NHẬN"     
        },

        breadcrumb: {
            isShow: false,
            list_icon: { path: "", color: "#f7f7f7" },
            active_icon: { path: "global/images/breadcrumb/breadcrumb_active_icon.png", color: "#fff" },
            next_icon: { path: "", color: "#fff" },
            prev_icon: { path: "", color: "#fff" },
            down_icon: { path: "", color: "#fff" },
            container: { path: "", color: "#dadada" }
        },
        marker: {
            isShow: false,
            colors: ['#499442', '#006dd6', '#ea2920', '#f7ec5e', '#231f20', '#fff']
        },

        toolbar: {
            isShow: false,
            PI: [],
            approvedCode: ""
        }
    };
    
    drcom.menuItem = 24;
})();
