// ShowImpact JavaScript Library version 0.0.2
// https://drcomgroup.com
// Last modified: 2019-11-26

drcom = drcom || {};
if (drcom.showimpact == undefined)
    drcom.showimpact = {};

var origin = 'showimpact';
// to pass back to react native app

drcom.showimpact.clm = {
    gotoSlide: function(keyMessage, presentation, isNotGetAllLibraries) {
        var request = {
            origin: origin,
            type: 'gotoSlide',
            data: {
                keyMessage: keyMessage,
                presentation: presentation,
                isNotGetAllLibraries: isNotGetAllLibraries || false
            }
        }

        if (!drcom.showimpact.clm.testMode) {
            drcom.showimpact.clm.runAPIRequest(JSON.stringify(request));
        }
    },

    openPdf: function(fileName) {
        var request = {
            origin: origin,
            type: 'openPdf',
            data: {
                fileName: fileName
            }
        }

        if (!drcom.showimpact.clm.testMode) {
            drcom.showimpact.clm.runAPIRequest(JSON.stringify(request));
        }
    },

    openPopup: function(data) {
        var request = {
            origin: origin,
            type: 'openPopup',
            data: data
        }

        if (!drcom.showimpact.clm.testMode) {
            drcom.showimpact.clm.runAPIRequest(JSON.stringify(request));
        }
    },

    closePopup: function() {
        var request = {
            origin: origin,
            type: 'closePopup'
        }

        if (!drcom.showimpact.clm.testMode) {
            drcom.showimpact.clm.runAPIRequest(JSON.stringify(request));
        }
    },

    sendEmail: function (subject, mailFrom, mailTo, mailCc, mailBody, attachment) {
        var request = {
            origin: origin,
            type: 'sendEmail',
            data: {
                subject: subject || '',
                mailFrom: mailFrom || '',
                mailTo: mailTo || '',
                mailCc: mailCc || '',
                mailBody: mailBody || '',
                attachment: attachment || ''
            }
        }

        if (!drcom.showimpact.clm.testMode) {
            drcom.showimpact.clm.runAPIRequest(JSON.stringify(request));
        }
    },

    openLinkExternal: function(url, type) {
        var request = {
            origin: origin,
            type: 'openLinkExternal',
            data: {
                url: url,
                type: type
            }
        }

        if (!drcom.showimpact.clm.testMode) {
            drcom.showimpact.clm.runAPIRequest(JSON.stringify(request));
        }
    },

    getPresentationId: function(callback) {
        drcom.showimpact.clm.getDataForCurrentObject("Presentation", "Presentation_Id", function(result) {
            if (result.success)
                flowId = result.Presentation.Presentation_Id;
            callback(flowId);
        });
    },

    getDataForCurrentObject: function(object, field, callback) {
        //check function callback
        var ret = this.checkCallbackFunction(callback);
        if (ret.success == false)
            return ret;

        // check arguments
        ret = this.checkArgument("object", object);
        if (ret.success == false) {
            return ret;
        }

        ret = this.checkArgument("field", field);
        if (ret.success == false) {
            return ret;
        }

        //send data

        if (!drcom.showimpact.clm.testMode) {
            var request = {
                origin: origin,
                type: 'getDataForObject',
                data: {
                    object: object,
                    field: field
                }
            }

            if (!drcom.showimpact.clm.testMode) {
                drcom.showimpact.clm.runAPIRequest(JSON.stringify(request), callback);
            }
        }
    },

    runAPIRequest: function(request, callback) {
        if (drcom.showimpact.clm.isShowImpact()) {
            drcom.showimpact.clm.showimpactAPIRequest(request, callback);
        }
    },

    isShowImpact: function() {
        // passed from react native app to webview via injectedJavaScript
        if (window.isShowImpact || localStorage.isShowImpact) {
            return true;
        }
        return false;
    },

    showimpactAPIRequest: function(request, callback) {
        if (drcom.showimpact.clm.showimpactHasListener === false) {
            drcom.showimpact.clm.showimpactHasListener = true;
            drcom.showimpact.clm.showimpactCallbackId = 0;

            function receiveMessage(event) {
                try {
                    var data = JSON.parse(event.data);
                    var callbackId = data.callbackId;
                    if (data.origin == origin && callbackId !== undefined && callbackId !== null) {
                        var callbackFunc = drcom.showimpact.clm.showimpactCallbackList[callbackId];
                        if (callbackFunc !== undefined && callbackFunc !== null) {
                            callbackFunc.call(null, data);
                            // don't want to splice because that would change the length
                            // of the array and could affect the index based access
                            delete drcom.showimpact.clm.showimpactCallbackList[callbackId];
                        }
                    }
                } catch (e) {
                    console.log(e)
                }

            }

            document.addEventListener("message", receiveMessage, false);

        }
        setTimeout(function() {
            drcom.showimpact.clm.showimpactCallbackId += 1;
            var callbackId = drcom.showimpact.clm.showimpactCallbackId;
            drcom.showimpact.clm.showimpactCallbackList[callbackId] = callback;
            request = JSON.parse(request);
            request.callbackId = callbackId
            if (drcom.showimpact.clm.isShowImpact()) {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(request));
                } else {
                    window.parent.postMessage(JSON.stringify(request), "*");
                }
            }
        }, 1);
    },

    checkArgument: function(name, value) {
        ret = {};
        ret.success = true;
        if (value == undefined || value == null || value == "") {
            ret.success = false;
            ret.code = 2002;
            ret.message = name + " is empty";
        }

        return ret;
    },

    checkCallbackFunction: function(toCheck) {
        // check arguments
        ret = {};
        if (toCheck == undefined) {
            ret.success = false;
            ret.code = 2000
            ret.message = "callback is missing";
            return ret;
        }

        if (this.isFunction(toCheck) == false) {
            ret.success = false;
            ret.code = 2001;
            ret.message = "callback is not a JavaScript function";
        } else {
            ret.success = true;
        }

        return ret;
    },

    isFunction: function(toCheck) {
        var getType = {};
        return toCheck && getType.toString.call(toCheck) === '[object Function]';
    },

    showimpactHasListener: false,
    showimpactCallbackId: null,
    showimpactCallbackList: [],
    testMode: false

};

drcom.showimpact.clm.initialize = function initializeshowimpact() {
}


drcom.showimpact.clm.initialize();
