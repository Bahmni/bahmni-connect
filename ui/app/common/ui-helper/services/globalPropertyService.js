'use strict';

angular.module('bahmni.common.uiHelper')
    .factory('globalPropertyService', ['$http', function ($http) {
        var verifySelectiveSync = function (propertyKey, $scope) {
            $http.get('/openmrs/ws/rest/v1/eventlog/filter/globalProperty/', {
                method: "GET",
                params: { q: propertyKey },
                withCredentials: true,
                headers: { "Accept": "application/text", "Content-Type": "text/plain" }
            }).then((response) => {
                let value = response.data;
                if (value.includes(Bahmni.Common.Constants.syncStrategy)) {
                    if ($scope) { $scope.isSelectiveSyncStrategy = true; } }
            });
        };
        return {
            verifySelectiveSync: verifySelectiveSync
        };
    }]);
