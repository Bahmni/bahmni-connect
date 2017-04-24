'use strict';

describe('offlineLocationInitialization', function () {
    var offlineDbServiceMock, androidDbServiceMock, eventLogServiceMock, $q, deferred, scope;

    var markers, addressLevels, providerData, loginInformation, loginLocationAddress, categoryFilterMap;

    beforeEach(module('bahmni.common.offline'));

    beforeEach(module(function ($provide) {
        androidDbServiceMock = jasmine.createSpyObj('androidDbService', ['getMarker', 'insertMarker', 'getReferenceData']);
        offlineDbServiceMock = jasmine.createSpyObj('offlineDbService', ['getMarker', 'insertMarker', 'getReferenceData']);
        eventLogServiceMock = jasmine.createSpyObj('eventLogService', ['getAddressForLoginLocation', 'getFilterForCategoryAndLoginLocation', 'getEventCategoriesToBeSynced']);
        $provide.value('androidDbService', androidDbServiceMock);
        $provide.value('offlineDbService', offlineDbServiceMock);
        $provide.value('eventLogService', eventLogServiceMock);
    }));

    var offlineLocationInitialization, offlineService;

    beforeEach(inject(function (_offlineService_) {
        offlineService = _offlineService_;
    }));

    beforeEach(inject(function (_offlineLocationInitialization_, _$q_, $rootScope) {
        offlineLocationInitialization = _offlineLocationInitialization_;
        $q = _$q_;
        deferred = _$q_.defer();
        scope = $rootScope.$new();
    }));

    beforeEach(function () {
        loginInformation = {
            "currentLocation": {
                "uuid": "location-uuid",
                "display": "location-name",
                "name": "location-name",
                "stateProvince": "AP",
                "district": "medhak"
            }
        };
        providerData = {
            "results": [{
                "uuid": "provider-uuid",
                "display": "superman - Super Man",
                "name": "Super Man"
            }]
        };
        addressLevels = [
            {
                addressField: "stateProvince",
                name: "State",
                required: false
            },
            {
                addressField: "district",
                name: "district",
                required: false
            },
            {
                addressField: "city",
                name: "city",
                required: false
            }
        ];
        loginLocationAddress = [{
            name: "Bilaspur",
            parent: {
                name: "AP",
                userGeneratedId: null,
                uuid: "state-uuid"
            },
            uuid: "district-uuid"
        }];
        markers = {
            filters: ['SEM'],
            lastReadEventUuid: "last-read-uuid",
            lastReadTime: 1491459550810,
            markerName: "encounter"
        };

        categoryFilterMap = {
            "encounter":["SEM"],
            "offline-concepts": [],
            "patient":['SEM']
        };

        offlineService.setItem('LoginInformation', loginInformation);
        offlineService.setItem('eventLogCategories', ["patient", "addressHierarchy", "offline-concepts", "encounter"]);
        offlineService.setItem('providerData', providerData);

        offlineDbServiceMock.getReferenceData.and.returnValue(specUtil.respondWithPromise($q, {data: addressLevels}));
        offlineDbServiceMock.getMarker.and.returnValue(specUtil.simplePromise(markers));
        offlineDbServiceMock.insertMarker.and.returnValue(specUtil.simplePromise());
        eventLogServiceMock.getFilterForCategoryAndLoginLocation.and.returnValue(specUtil.simplePromise({data:categoryFilterMap}));
        eventLogServiceMock.getAddressForLoginLocation.and.returnValue(specUtil.respondWithPromise($q, {data: loginLocationAddress}));
        eventLogServiceMock.getEventCategoriesToBeSynced.and.returnValue(specUtil.createFakePromise(["patient", "addressHierarchy", "offline-concepts"]));
    });

    it('should insert markers to all categories', function (done) {
        offlineLocationInitialization().then(function() {
            var initSyncFilter = offlineService.getItem("initSyncFilter");
            expect(initSyncFilter).toEqual(['SEM']);
            expect(eventLogServiceMock.getFilterForCategoryAndLoginLocation).toHaveBeenCalledWith("provider-uuid", "district-uuid", "location-uuid");
            expect(offlineDbServiceMock.insertMarker).toHaveBeenCalledWith("encounter", "last-read-uuid", ['SEM']);
            expect(offlineDbServiceMock.insertMarker).toHaveBeenCalledWith("patient", "last-read-uuid", ['SEM']);
            done();
        });
        scope.$digest();
    });

    it('should get filters if login location does not have address and strategy does not need address', function (done) {
        var loginInfo = {
            "currentLocation": {
                "uuid": "location-uuid",
                "display": "location-name",
                "name": "location-name"
            }
        };
        offlineService.setItem('LoginInformation', loginInfo);
        offlineLocationInitialization().then(function() {
            expect(eventLogServiceMock.getFilterForCategoryAndLoginLocation).toHaveBeenCalledWith("provider-uuid", null, "location-uuid");
            expect(offlineDbServiceMock.insertMarker).toHaveBeenCalled();
            done();
        });
        scope.$digest();
    });

    it('should get filters if addressHierarchy levels are not present and strategy does not need address', function (done) {
        offlineDbServiceMock.getReferenceData.and.returnValue(specUtil.respondWithPromise($q, {data: undefined}));
        offlineLocationInitialization().then(function() {
            expect(eventLogServiceMock.getFilterForCategoryAndLoginLocation).toHaveBeenCalledWith("provider-uuid", null, "location-uuid");
            expect(offlineDbServiceMock.insertMarker).toHaveBeenCalled();
            done();
        });
        scope.$digest();
    });

    it('should send address uuid to get filters if login location address has no parent', function (done) {
        var loginLocationAddress = [{
            name: "Bilaspur",
            uuid: "district-uuid"
        }];
        eventLogServiceMock.getAddressForLoginLocation.and.returnValue(specUtil.respondWithPromise($q, {data: loginLocationAddress}));
        offlineLocationInitialization().then(function() {
            expect(eventLogServiceMock.getFilterForCategoryAndLoginLocation).toHaveBeenCalledWith("provider-uuid", "district-uuid", "location-uuid");
            expect(offlineDbServiceMock.insertMarker).toHaveBeenCalled();
            done();
        });
        scope.$digest();
    });

    it('should get correct address uuid by matching parent if there are two address for login location', function (done) {
        var address2 = {
            name: "Bandpur",
            parent: {
                name: "Telangana",
                userGeneratedId: null,
                uuid: "state-uuid"
            },
            uuid: "bandpur-uuid"
        };
        loginLocationAddress.push(address2);
        eventLogServiceMock.getAddressForLoginLocation.and.returnValue(specUtil.respondWithPromise($q, {data: loginLocationAddress}));
        offlineLocationInitialization().then(function() {
            expect(eventLogServiceMock.getFilterForCategoryAndLoginLocation).toHaveBeenCalledWith("provider-uuid", 'district-uuid', "location-uuid");
            expect(offlineDbServiceMock.insertMarker).toHaveBeenCalled();
            done();
        });
        scope.$digest();
    });

    it("should reject proise if network calls fails", function (done) {
        var defered = $q.defer();
        var promise = defered.promise;
        defered.reject();
        eventLogServiceMock.getEventCategoriesToBeSynced.and.returnValue(promise);
        offlineLocationInitialization().then(function () {
            throw new Error("offlineLocationInitialization should reject the promise");
        }, function () {
            done();
        });
        scope.$digest();
    });
});