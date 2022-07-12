'use strict';
angular.module('bahmni.common.uiHelper')
    .controller('AppUpdateController', ['$scope', 'ngDialog', 'offlineService', 'appInfoStrategy', 'globalPropertyService',
        function ($scope, ngDialog, offlineService, appInfoStrategy, globalPropertyService) {
            $scope.isAndroid = true;
            $scope.isSelectiveSyncStrategy = false;

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
                globalPropertyService.verifySelectiveSync('bahmniOfflineSync.strategy', $scope);
            };

            return init();
        }]);
