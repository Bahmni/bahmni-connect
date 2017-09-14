'use strict';

describe('formDbService', function () {
    var formDbService;
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
        }
    ];

    beforeEach(function () {
        module('bahmni.common.offline');
    });

    beforeEach(inject(['formDbService', function (formDbServiceInjected) {
        formDbService = formDbServiceInjected
    }]));

    it("should insert and retrieve forms", function (done) {
        var schemaBuilder = lf.schema.create('formMetadata', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.Form);
        schemaBuilder.connect().then(function (db) {
            formDbService.init(db);
            formDbService.insertForm(forms[0]).then(function () {
                formDbService.insertForm(forms[1]).then(function () {
                    formDbService.getAllForms().then(function (allForms) {
                        expect(2).toEqual(allForms.length);
                        expect("e5e763aa-31df-4931-bed4-0468ddf63aab").toEqual(allForms[0].uuid);
                        expect("80b7273d-eea0-48d0-abae-b3d3bf7e96f1").toEqual(allForms[1].uuid);
                        done();
                    })
                });
            })
        });
    });

    it("should retrieve form by uuid", function (done) {
        var schemaBuilder = lf.schema.create('formMetadata', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.Form);
        schemaBuilder.connect().then(function (db) {
            formDbService.init(db);
            formDbService.insertForm(forms[0]).then(function () {
                formDbService.insertForm(forms[1]).then(function () {
                    formDbService.getFormByUuid("80b7273d-eea0-48d0-abae-b3d3bf7e96f1").then(function (form) {
                        expect("80b7273d-eea0-48d0-abae-b3d3bf7e96f1").toEqual(form.uuid);
                        expect("demo_form").toEqual(form.name);
                        expect("1").toEqual(form.version);
                        done();
                    })
                });
            })
        });
    });

});