'use strict';

angular.module('bahmni.common.offline')
    .service('appInfoStrategy', function () {
        var getVersion = function () {
            var manifest = chrome.app.getDetails();
            return manifest ? manifest.version: 2;
        };
        return {
            getVersion: getVersion
        };
    });
