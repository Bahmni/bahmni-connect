'use strict';
angular.module('bahmni.common.uiHelper')
    .controller('AppUpdateController', ['$scope', 'ngDialog', 'appInfoStrategy', 'offlineService', '$http',
        function ($scope, ngDialog, appInfoStrategy, offlineService, $http) {
            $scope.isAndroid = false;
            $scope.isSelectiveSyncStrategy = false;

            var verifySelectiveSync = function () {
                $http.get('/openmrs/ws/rest/v1/eventlog/filter/globalProperty/', {
                    method: "GET",
                    params: { q: 'bahmniOfflineSync.strategy' },
                    withCredentials: true,
                    headers: { "Accept": "application/text", "Content-Type": "text/plain" }
                }).then((response) => {
                    let value = response.data;
                    if (value.includes("SelectiveSyncStrategy")) { $scope.isSelectiveSyncStrategy = true; }
                });
            };
            $scope.isUpdateAvailable = function () {
                var installedVersion = appInfoStrategy.getVersion();
                var appUpdateInfo = offlineService.getItem("appUpdateInfo");
                return appUpdateInfo && (installedVersion < _.max(appUpdateInfo.compatibleVersions));
            };

            $scope.update = function () {
                ngDialog.open({
                    template: '../common/ui-helper/views/appUpdatePopup.html',
                    className: 'test ngdialog-theme-default',
                    data: offlineService.getItem("appUpdateInfo") || {},
                    showClose: true
                });
            };
            var init = function () {
                verifySelectiveSync();
            };

            return init();
        }]);
