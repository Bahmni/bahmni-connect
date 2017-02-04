'use strict';

angular.module('bahmni.common.offline')
    .service('appInfoStrategy', function () {
        var getVersion = function () {
            var manifest = 2;
            return manifest.version;
        };
        return {
            getVersion: getVersion
        };
    });
