'use strict';

describe('formService', function () {
    var forms = [
        {
            "name": "test_form",
            "version": "1",
            "uuid": "e5e763aa-31df-4931-bed4-0468ddf63aab",
            "resources": [
                {
                    "value": "{'name':'test_form','id':1,'uuid':'e5e763aa-31df-4931-bed4-0468ddf63aab','controls':[],'events':{}}"
                }
            ]
        },
        {
            "name": "demo_form",
            "version": "1",
            "uuid": "80b7273d-eea0-48d0-abae-b3d3bf7e96f1",
            "resources": [
                {
                    "value": "{'name':'demo_form','id':2,'uuid':'80b7273d-eea0-48d0-abae-b3d3bf7e96f1','controls':[],'events':{}}"
                }
            ]
        },
        {
            "name": "test_form",
            "version": "2",
            "uuid": "7635fcda-cf1b-4d30-9ea9-595d7d34c7d9",
            "resources": [
                {
                    "value": "{'name':'one','id':6,'uuid':'7635fcda-cf1b-4d30-9ea9-595d7d34c7d9','controls':[],'events':{}}"
                }
            ]
        }
    ];
    var formService, $q = Q;
    var offlineService, androidDbService, offlineDbService;
    beforeEach(module('bahmni.common.conceptSet'));
    beforeEach(module('bahmni.common.appFramework'));

    beforeEach(module(function ($provide) {
        offlineService = jasmine.createSpyObj('offlineService', ['isAndroidApp']);
        offlineDbService = jasmine.createSpyObj('offlineDbService', ['getFormByUuid', 'getAllForms', 'getEncounterByEncounterUuid']);
        androidDbService = jasmine.createSpyObj('androidDbService', ['getFormByUuid', 'getAllForms', 'getEncounterByEncounterUuid']);
        offlineService.isAndroidApp.and.returnValue(false);

        $provide.value('offlineService', offlineService);
        $provide.value('offlineDbService', offlineDbService);
        $provide.value('$q', $q);
        $provide.value('androidDbService', androidDbService);
    }));

    beforeEach(inject(['formService', function (formServiceInjected) {
        formService = formServiceInjected;
    }]));

    it('should give the form detail for given uuid', function (done) {
        var uuid = "e5e763aa-31df-4931-bed4-0468ddf63aab";
        offlineDbService.getFormByUuid.and.returnValue(specUtil.respondWithPromise($q, forms[0]));
        formService.getFormDetail(uuid).then(function (form) {
            expect(uuid).toEqual(form.data.uuid);
            expect("test_form").toEqual(form.data.name);
            expect("1").toEqual(form.data.version);

            expect(offlineDbService.getFormByUuid).toHaveBeenCalledWith(uuid);
            expect(offlineDbService.getFormByUuid.calls.count()).toBe(1);
            done();
        });
    });

    it('should give all the latest form if given encounter uuid is null', function (done) {
        offlineDbService.getAllForms.and.returnValue(specUtil.respondWithPromise($q, forms));
        formService.getFormList().then(function (response) {
            var latestForms = response.data;
            expect(2).toEqual(latestForms.length);
            expect("7635fcda-cf1b-4d30-9ea9-595d7d34c7d9").toEqual(latestForms[0].uuid);
            expect("test_form").toEqual(latestForms[0].name);
            expect("2").toEqual(latestForms[0].version);

            expect("80b7273d-eea0-48d0-abae-b3d3bf7e96f1").toEqual(latestForms[1].uuid);
            expect("demo_form").toEqual(latestForms[1].name);
            expect("1").toEqual(latestForms[1].version);

            expect(offlineDbService.getAllForms.calls.count()).toBe(1);
            done();
        });
    });

    it('should give all the forms', function (done) {
        offlineDbService.getAllForms.and.returnValue(specUtil.respondWithPromise($q, forms));
        formService.getAllForms().then(function (response) {
            var latestForms = response.data;
            expect(3).toEqual(latestForms.length);
            expect("e5e763aa-31df-4931-bed4-0468ddf63aab").toEqual(latestForms[0].uuid);
            expect("test_form").toEqual(latestForms[0].name);
            expect("1").toEqual(latestForms[0].version);

            expect("80b7273d-eea0-48d0-abae-b3d3bf7e96f1").toEqual(latestForms[1].uuid);
            expect("demo_form").toEqual(latestForms[1].name);
            expect("1").toEqual(latestForms[1].version);

            expect("7635fcda-cf1b-4d30-9ea9-595d7d34c7d9").toEqual(latestForms[2].uuid);
            expect("test_form").toEqual(latestForms[2].name);
            expect("2").toEqual(latestForms[2].version);

            expect(offlineDbService.getAllForms.calls.count()).toBe(1);
            done();
        });
    });

    it("should give all the latest form if given encounter uuid does not hold any form data", function (done) {
        offlineDbService.getAllForms.and.returnValue(specUtil.respondWithPromise($q, forms));
        offlineDbService.getEncounterByEncounterUuid.and.returnValue(specUtil.respondWithPromise($q, {encounter: {observations: []}}));
        formService.getFormList("test-encounter-uuid").then(function (response) {
            var latestForms = response.data;
            expect(2).toEqual(latestForms.length);
            expect("7635fcda-cf1b-4d30-9ea9-595d7d34c7d9").toEqual(latestForms[0].uuid);
            expect("test_form").toEqual(latestForms[0].name);
            expect("2").toEqual(latestForms[0].version);

            expect("80b7273d-eea0-48d0-abae-b3d3bf7e96f1").toEqual(latestForms[1].uuid);
            expect("demo_form").toEqual(latestForms[1].name);
            expect("1").toEqual(latestForms[1].version);

            expect(offlineDbService.getAllForms.calls.count()).toBe(1);
            expect(offlineDbService.getEncounterByEncounterUuid).toHaveBeenCalledWith("test-encounter-uuid");
            done();
        });
    });

    it("should replace latest form with older version of form if given encounter holds any form data", function (done) {
        offlineDbService.getAllForms.and.returnValue(specUtil.respondWithPromise($q, forms));
        offlineDbService.getEncounterByEncounterUuid.and.returnValue(specUtil.respondWithPromise($q, {encounter: {observations: [{formFieldPath: "test_form.1/2-0"}]}}));
        formService.getFormList("test-encounter-uuid").then(function (response) {
            var latestForms = response.data;
            expect(2).toEqual(latestForms.length);
            expect("e5e763aa-31df-4931-bed4-0468ddf63aab").toEqual(latestForms[0].uuid);
            expect("test_form").toEqual(latestForms[0].name);
            expect("1").toEqual(latestForms[0].version);

            expect("80b7273d-eea0-48d0-abae-b3d3bf7e96f1").toEqual(latestForms[1].uuid);
            expect("demo_form").toEqual(latestForms[1].name);
            expect("1").toEqual(latestForms[1].version);

            expect(offlineDbService.getAllForms.calls.count()).toBe(1);
            expect(offlineDbService.getEncounterByEncounterUuid).toHaveBeenCalledWith("test-encounter-uuid");
            done();
        });
    });
});