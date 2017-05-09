describe('PWA Utils', function () {
    describe('Uninstall', function () {
        var serviceWorkerRegistrations = [{unregister: jasmine.createSpy('unregister')}],
            cacheKeys = ['some cache key'],
            databaseNames = ['Bahmni_hustle', 'metaData'], angularDOMRoot, pwaUtils;

        beforeEach(function () {
            pwaUtils = Bahmni.Common.Util.PWAUtils;
            spyOn(navigator.serviceWorker, 'getRegistrations').and.returnValue(Promise.resolve(serviceWorkerRegistrations));

            spyOn(window.caches, 'keys').and.returnValue(Promise.resolve(cacheKeys));
            spyOn(window.caches, 'delete').and.returnValue(Promise.resolve(true));

            spyOn(document, 'getElementById').and.returnValue(angularDOMRoot);

            spyOn(indexedDB, 'deleteDatabase').and.callThrough();

            spyOn(window.sessionStorage, 'clear').and.callThrough();
            spyOn(window.localStorage, 'clear').and.callThrough();
        });

        it('should clear the service worker cache', function (done) {
            pwaUtils.uninstall(databaseNames).then(function () {
                expect(window.caches.keys).toHaveBeenCalled();
                expect(window.caches.delete.calls.argsFor(0)[0]).toEqual(cacheKeys[0]);
                done();
            });
        });

        it('should unregister service worker', function (done) {
            pwaUtils.uninstall(databaseNames).then(function () {
                expect(serviceWorkerRegistrations[0].unregister).toHaveBeenCalled();
                done();
            });
        });

        it('should delete all databases in indexedDB', function (done) {
            pwaUtils.uninstall(databaseNames).then(function () {
                expect(indexedDB.deleteDatabase.calls.argsFor(0)[0]).toEqual(databaseNames[0]);
                expect(indexedDB.deleteDatabase.calls.argsFor(1)[0]).toEqual(databaseNames[1]);
                done();
            });
        });

        it('should clear the session storage', function () {
            pwaUtils.uninstall(databaseNames).then(function () {
                expect(window.sessionStorage.clear).toHaveBeenCalled();
            });
        });
    });
});
