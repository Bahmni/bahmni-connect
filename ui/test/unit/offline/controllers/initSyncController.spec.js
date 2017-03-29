'use strict';

describe('initSyncController', function () {
    var $aController, scopeMock, ngDialogMock, state, offlinePullMock, sessionServiceMock, q,  offlineLocationInitializationMock, dbNameServiceMock, userData, syncStatus, loginInformation;

    beforeEach(module('bahmni.common.offline'));

    beforeEach(function () {
        state = jasmine.createSpyObj('$state',['go']);
        sessionServiceMock = jasmine.createSpyObj('sessionService', ['destroy']);
        dbNameServiceMock = jasmine.createSpyObj('dbNameService', ['getDbName']);
        ngDialogMock = jasmine.createSpyObj('ngDialog', ['open']);
        offlinePullMock = function () {
            return specUtil.createFakePromise();
        };
        offlineLocationInitializationMock = function () {
            return specUtil.createFakePromise();
        };

    });

    var createController = function(){
        return $aController('InitSyncController', {
            $scope: scopeMock,
            ngDialog: ngDialogMock,
            $state: state,
            offlineService: offlineService,
            offlinePull: offlinePullMock,
            sessionService: sessionServiceMock,
            $q: q,
            offlineLocationInitialization: offlineLocationInitializationMock,
            dbNameService: dbNameServiceMock
        });
    };

    beforeEach(inject(function ($controller, $rootScope, $q) {
        $aController = $controller;
        scopeMock = $rootScope.$new();
        q = $q;
    }));

    beforeEach(inject(['offlineService', function (offlineServiceInjected) {
        offlineService = offlineServiceInjected;
    }]));

    describe('initSyncController', function () {
        beforeEach(function () {
            userData = {"results": [{"username": "superman"}]};
            syncStatus = {"location-name_db": {"location-uuid": "complete"}};
            loginInformation = {
                "currentLocation": {
                    "uuid": "location-uuid",
                    "display": "location-name",
                    "name": "location-name"
                }
            };
            offlineService.setItem('LoginInformation', loginInformation);
            offlineService.setItem('userData', userData);
            dbNameServiceMock.getDbName.and.returnValue(specUtil.simplePromise("location-name_db"));
        });

        it("should go to dashboard if initial sync is completed for current location", function () {
            offlineService.setItem('initialSyncStatus', syncStatus);
            createController();
            expect(state.go).toHaveBeenCalledWith('dashboard');
        });

        it("should initialize data sync if initial sync is  not completed", function () {
            offlineService.setItem('initialSyncStatus', {"location-name_db": {"location-uuid": undefined}});
            createController();
            expect(offlineService.getItem("initialSyncStatus")).toEqual(syncStatus);
        });
    });
});