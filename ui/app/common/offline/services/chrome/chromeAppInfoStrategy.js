'use strict';

angular.module('bahmni.common.offline')
    .service('appInfoStrategy', function () {
        var getVersion = function () {
            return Bahmni.Common.Constants.bahmniConnectVersion;
        };
        return {
            getVersion: getVersion
        };
    });
