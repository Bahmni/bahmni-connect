'use strict';
angular.module('bahmni.common.uiHelper')
    .controller('AppUpdateController', ['$scope', 'ngDialog', 'offlineService', 'appInfoStrategy', '$http',
        function ($scope, ngDialog, offlineService, appInfoStrategy, $http) {
            $scope.isAndroid = true;
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

            $scope.update = function (url) {
                if (!url) {
                    url = offlineService.getItem("appUpdateInfo").latestAndroidAppUrl;
                }
                AppUpdateService.updateApp(url);
                ngDialog.close();
            };

            var init = function () {
                verifySelectiveSync();
            };

            return init();
        }]);
