'use strict';

angular.module('bahmni.common.offline')
    .service('appInfoStrategy', function () {
        var getVersion = function () {
            var manifestVersion = 2;
            return manifestVersion;
        };
        return {
            getVersion: getVersion
        };
    });
