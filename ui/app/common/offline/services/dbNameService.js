'use strict';

angular.module('bahmni.common.offline')
    .service('dbNameService', ["offlineService", "offlineDbService", "androidDbService", "$q", "messagingService",
        function (offlineService, offlineDbService, androidDbService, $q, messagingService) {
            var loadDbNameService = function () {
                var isOfflineApp = offlineService.isOfflineApp();
                if (isOfflineApp) {
                    var defer = $q.defer();
                    if (offlineService.isAndroidApp()) {
                        offlineDbService = androidDbService;
                    }
                    offlineDbService.getConfig("dbNameCondition").then(function (config) {
                        if (!config || !config.value) {
                            messagingService.showMessage("error", "dbNameCondition.json is not present in config");
                            return defer.reject();
                        }
                        var script = config.value['dbNameCondition.js'];
                        eval(script); // eslint-disable-line no-eval
                        return defer.resolve();
                    });
                }
                return defer.promise;
            };

            var getDbName = function (provider, loginLocation) {
                if (!offlineService.getItem("allowMultipleLoginLocation")) {
                    return $q.when(Bahmni.Common.Constants.defaultBahmniConnectDb);
                }
                return loadDbNameService().then(function () {
                    return Bahmni.Common.Offline.dbNameCondition.get(provider, loginLocation) + "_db";
                });
            };

            return {
                getDbName: getDbName
            };
        }]);
