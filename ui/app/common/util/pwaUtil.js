'use strict';

Bahmni.Common.Util.PWAUtils = (function () {
    var uninstall = function (dbNames) {
        var clearCacheStorage = function () {
            return window.caches.keys().then(function (keys) {
                return Promise.all(_.map(keys, function (key) {
                    return window.caches.delete(key);
                }));
            });
        };

        var unregisterServiceWorker = function () {
            return navigator.serviceWorker.getRegistrations().then(function (registrations) {
                return Promise.all(_.map(registrations, function (registration) {
                    return registration.unregister();
                }));
            });
        };

        var clearIndexedDb = function () {
            var deleteIDBDatabase = function (dbNames) {
                _.each(dbNames, function (dbName) {
                    indexedDB.deleteDatabase(dbName);
                });
            };
            var databaseNames = ['Bahmni_hustle', 'metaData'];
            databaseNames = databaseNames.concat(dbNames);
            return deleteIDBDatabase(databaseNames);
        };

        var clearSessionStorage = function () {
            window.sessionStorage.clear();
            window.localStorage.clear();
        };

        return clearCacheStorage()
            .then(clearIndexedDb)
            .then(clearSessionStorage)
            .then(unregisterServiceWorker);
    };
    return {
        uninstall: uninstall
    };
})();
