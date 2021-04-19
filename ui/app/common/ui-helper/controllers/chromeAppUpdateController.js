'use strict';
angular.module('bahmni.common.uiHelper')
    .controller('AppUpdateController', ['$scope', 'ngDialog', 'appInfoStrategy', 'offlineService', 'globalPropertyService',
        function ($scope, ngDialog, appInfoStrategy, offlineService, globalPropertyService) {
            $scope.isAndroid = false;
            $scope.isSelectiveSyncStrategy = false;
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
                globalPropertyService.verifySelectiveSync('bahmniOfflineSync.strategy', $scope);
            };

            return init();
        }]);
