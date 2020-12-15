'use strict';

angular.module('bahmni.registration')
    .controller('NavigationController', ['$scope', '$rootScope', '$location', 'sessionService', '$window', 'appService', '$sce', 'offlineService', 'schedulerService', '$http',
        function ($scope, $rootScope, $location, sessionService, $window, appService, $sce, offlineService, schedulerService, $http) {
            $scope.extensions = appService.getAppDescriptor().getExtensions("org.bahmni.registration.navigation", "link");
            $scope.isOfflineApp = offlineService.isOfflineApp();
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
            $scope.goTo = function (url) {
                $location.url(url);
            };

            $scope.htmlLabel = function (label) {
                return $sce.trustAsHtml(label);
            };

            $scope.logout = function () {
                $rootScope.errorMessage = null;
                sessionService.destroy().then(
                    function () {
                        $window.location = "../home/";
                    }
                );
            };

            $scope.sync = function () {
                schedulerService.sync(Bahmni.Common.Constants.syncButtonConfiguration);
            };

            var cleanUpListenerSchedulerStage = $scope.$on("schedulerStage", function (event, stage, restartSync) {
                $scope.isSyncing = (stage !== null);
                if (restartSync) {
                    schedulerService.stopSync();
                    schedulerService.sync();
                }
            });

            var init = function () {
                verifySelectiveSync();
            };
            $scope.$on("$destroy", cleanUpListenerSchedulerStage);
            return init();
        }]);
