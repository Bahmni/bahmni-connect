"use strict";


describe("dbNameService", function () {
    describe("getDbName", function () {
        var dbNameService, offlineDbService, offlineService, messagingService;
        var injectDependency = function (config) {
            module('bahmni.common.offline');
            module(function ($provide) {
                $provide.value('$q', Q);
                $provide.value("offlineDbService", {
                    getConfig: function () {
                        return {
                            then: function (callback) {
                                callback(config);
                            }
                        }
                    }
                });
                $provide.value("offlineService", jasmine.createSpyObj('offlineService', ['isOfflineApp', 'getItem', 'isAndroidApp']));
                $provide.value('messagingService', jasmine.createSpyObj('messagingService', ["showMessage"]));
            });
            inject(['dbNameService', "offlineDbService", "offlineService", "messagingService",
                function (dbNameServiceInjected, offlineDbServiceInjected, offlineServiceInjected, messagingServiceInjected) {
                dbNameService = dbNameServiceInjected;
                offlineDbService = offlineDbServiceInjected;
                offlineService = offlineServiceInjected;
                messagingService = messagingServiceInjected;
            }]);

        };

        it("should give loginLocation as db name", function (done) {
            injectDependency({
                value: {"dbNameCondition.js": "Bahmni.Common.Offline.dbNameCondition.get = function (provider, loginLocation) {return loginLocation;};"}
            });

            spyOn(offlineDbService, "getConfig").and.callThrough();
            offlineService.isOfflineApp.and.returnValue(true);
            offlineService.getItem.and.returnValue(true);
            dbNameService.getDbName("provider", "loginLocation").then(function (dbName) {
                expect(dbName).toBe("loginLocation");
                done();
            });
            expect(offlineDbService.getConfig.calls.count()).toBe(1);
            expect(offlineService.getItem.calls.count()).toBe(1);
            expect(offlineService.getItem).toHaveBeenCalledWith("allowMultipleLoginLocation");
            expect(messagingService.showMessage.calls.count()).toBe(0);
        });

        it("should give loginLocation as db name", function (done) {
            injectDependency({
                value: {"dbNameCondition.js": "Bahmni.Common.Offline.dbNameCondition.get = function (provider, loginLocation) {return provider;};"}
            });

            spyOn(offlineDbService, "getConfig").and.callThrough();
            offlineService.isOfflineApp.and.returnValue(true);
            offlineService.getItem.and.returnValue(true);
            dbNameService.getDbName("provider", "loginLocation").then(function (dbName) {
                expect(dbName).toBe("provider");
                done();
            });
            expect(offlineDbService.getConfig.calls.count()).toBe(1);
            expect(offlineService.getItem.calls.count()).toBe(1);
            expect(offlineService.getItem).toHaveBeenCalledWith("allowMultipleLoginLocation");
        });

        it("should give default DB name 'Bahmni Connect' if allowMultipleLoginLocation is set to false", function (done) {
            var config = {
                value: {"dbNameCondition.js": "Bahmni.Common.Offline.dbNameCondition.get = function (provider, loginLocation) {return provider;};"}
            };
            injectDependency(config);
            offlineService.isOfflineApp.and.returnValue(true);
            offlineService.getItem.and.returnValue(false);

            spyOn(offlineDbService, "getConfig").and.callThrough();

            dbNameService.getDbName("provider", "loginLocation").then(function (dbName) {
                expect(dbName).toBe("Bahmni Connect");
                done();
            });
            expect(offlineService.getItem.calls.count()).toBe(1);
            expect(offlineService.getItem).toHaveBeenCalledWith("allowMultipleLoginLocation");
            expect(offlineDbService.getConfig.calls.count()).toBe(0);
            expect(messagingService.showMessage.calls.count()).toBe(0);
        });

        it("should show message when dbNameCondition config is not present and allowMultipleLoginLocation is set to true", function () {
            injectDependency();
            offlineService.isOfflineApp.and.returnValue(true);
            offlineService.getItem.and.returnValue(true);
            spyOn(offlineDbService, "getConfig").and.callThrough();
            dbNameService.getDbName("provider", "loginLocation");
            expect(offlineService.getItem.calls.count()).toBe(1);
            expect(offlineService.getItem).toHaveBeenCalledWith("allowMultipleLoginLocation");
            expect(offlineDbService.getConfig.calls.count()).toBe(1);
            expect(messagingService.showMessage.calls.count()).toBe(1);
            expect(messagingService.showMessage).toHaveBeenCalledWith("error", "dbNameCondition.json is not present in config");

        });
    });
});
