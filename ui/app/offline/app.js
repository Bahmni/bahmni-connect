'use strict';

angular.module('bahmni.offline', ['ui.router', 'httpErrorInterceptor', 'bahmni.common.uiHelper', 'bahmni.common.util', 'bahmni.common.i18n', 'bahmni.common.logging', 'bahmni.common.offline', 'bahmni.common.models', 'bahmni.common.appFramework', 'ngCookies'])
    .config(['$urlRouterProvider', '$stateProvider', '$bahmniTranslateProvider',
        function ($urlRouterProvider, $stateProvider, $bahmniTranslateProvider) {
            $urlRouterProvider.otherwise('/initScheduler');
        // @endif
            $stateProvider
                .state('initScheduler', {
                    url: '/initScheduler',
                    resolve: {
                        offlineDb: function (offlineDbInitialization, $state, offlineService) {
                            return offlineDbInitialization().catch(function (error) {
                                if (error === Bahmni.Common.Constants.offlineErrorMessages.dbNameConditionNotPresent) {
                                    offlineService.deleteItem("LoginInformation");
                                }
                                $state.go("error");
                            });
                        },
                        offlineConfigInitialization: function (offlineConfigInitialization, offlineDb, offlineService, offlineDbService, androidDbService, $q) {
                            var checkConfig = function () {
                                var allowMultipleLoginLocation = offlineService.getItem("allowMultipleLoginLocation");
                                return allowMultipleLoginLocation !== null && !allowMultipleLoginLocation;
                            };
                            if (offlineService.isAndroidApp()) {
                                offlineDbService = androidDbService;
                            }
                            return offlineDbService.getConfig("dbNameCondition").then(function (result) {
                                if (result || checkConfig()) {
                                    return $q.when();
                                }
                                else return offlineConfigInitialization();
                            });
                        },
                        offlineReferenceDataInitialization: function (offlineReferenceDataInitialization, offlineDbService, offlineService, androidDbService, $state, offlineConfigInitialization) {
                            if (offlineService.isAndroidApp()) {
                                offlineDbService = androidDbService;
                            }
                            return offlineDbService.getReferenceData("LoginLocations").then(function (result) {
                                if (result) {
                                    $state.go('login');
                                }
                                return offlineReferenceDataInitialization(false).then(function (response) {
                                    if (response.data) {
                                        offlineService.setItem("networkError", response.data);
                                    }
                                    $state.go('login');
                                });
                            });
                        }
                    }
                }).state('scheduler',
                {
                    url: '/scheduler',
                    params: {
                        preventResolve: false
                    },
                    resolve: {
                        offlineDb: function (offlineDbInitialization) {
                            return offlineDbInitialization();
                        },
                        testConfig: function (offlineDb, offlineService, offlineDbService, androidDbService, $state, $stateParams) {
                            if (offlineService.isAndroidApp()) {
                                offlineDbService = androidDbService;
                            }
                            return offlineDbService.getConfig("home").then(function (result) {
                                if (result && offlineService.getItem('eventLogCategories')) {
                                    $stateParams.preventResolve = true;
                                    $state.go('initSync');
                                }
                            });
                        },
                        offlineReferenceDataInitialization: function (offlineReferenceDataInitialization, offlineDb, testConfig, $state, $stateParams, $q) {
                            if ($stateParams.preventResolve) {
                                return $q.when();
                            }
                            return offlineReferenceDataInitialization(true, offlineDb, testConfig).catch(function () {
                                $state.go("error");
                            });
                        },
                        offlineLocationInitialization: function (offlineLocationInitialization, offlineReferenceDataInitialization, $stateParams, $q) {
                            if ($stateParams.preventResolve) {
                                return $q.when();
                            }
                            return offlineLocationInitialization(offlineReferenceDataInitialization);
                        },
                        offlineConfigInitialization: function (offlineConfigInitialization, offlineLocationInitialization, $stateParams, $q) {
                            if ($stateParams.preventResolve) {
                                return $q.when();
                            }
                            return offlineConfigInitialization(offlineLocationInitialization);
                        },
                        state: function ($state, offlineConfigInitialization) {
                            $state.go('initSync');
                        }
                    }
                }).state('initSync', {
                    templateUrl: 'views/initSync.html',
                    controller: 'InitSyncController',
                    url: '/initSync',
                    resolve: {
                        offlineDb: function (offlineDbInitialization) {
                            return offlineDbInitialization();
                        }
                    }
                }).state('error', {
                    url: "/error",
                    controller: function ($state, ngDialog, $scope, sessionService) {
                        $scope.logout = function () {
                            sessionService.destroy().then(
                                function () {
                                    $state.go('initScheduler');
                                }
                            );
                        };
                        ngDialog.open({
                            template: 'views/offlineSyncFailure.html',
                            class: 'ngdialog-theme-default',
                            closeByEscape: false,
                            closeByDocument: false,
                            showClose: false,
                            scope: $scope
                        });
                    }
                }).state('device', {
                    url: "/device/:deviceType",
                    controller: function ($stateParams, $rootScope, $state, offlineService, $http) {
                        if ($stateParams.deviceType === 'chrome-app' || $stateParams.deviceType === 'android') {
                            offlineService.setAppPlatform($stateParams.deviceType);
                            var syncStatus = offlineService.getItem("initialSyncStatus");
                            if (!(syncStatus instanceof Object)) {
                                var url = Bahmni.Common.Constants.globalPropertyUrl + "?property=allowMultipleLoginLocation";
                                $http.get(url).then(function (res) {
                                    offlineService.setItem("allowMultipleLoginLocation", res.data);
                                });
                            }
                            $state.go('initScheduler');
                        }
                    }
                }).state('login', {
                    controller: function () {
                        window.location.href = "../home/index.html#/login";
                    }
                }).state('dashboard', {
                    controller: function () {
                        window.location.href = "../home/index.html#/dashboard";
                    }
                });
            $bahmniTranslateProvider.init({app: 'offline', shouldMerge: true});
        }]).run(['$rootScope', '$templateCache', '$state', 'messagingService', function ($rootScope, $templateCache, $state, messagingService) {
    // Disable caching view template partials
            $rootScope.$on('$viewContentLoaded', function () {
                $templateCache.removeAll();
            });
            $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                messagingService.showMessage("error", error.stack || error);
                $state.go('error');
            });
        }]);
