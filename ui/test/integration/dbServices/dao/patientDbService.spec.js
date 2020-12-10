'use strict';

describe('patientDbService tests', function () {
    var patientDbService;

    var mockHttp = jasmine.createSpyObj('$http', ['get']);

    beforeEach(function () {
        module('bahmni.common.offline');
        module(function ($provide) {
            $provide.value('$http', mockHttp);
        });
    });

    beforeEach(inject(['patientDbService', function (patientDbServiceInjected) {
        patientDbService = patientDbServiceInjected
    }]));

    it("insert patient and get from lovefield database", function(done){
        var schemaBuilder = lf.schema.create('BahmniTest', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.SchemaDefinitions.Patient);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var patientJson = JSON.parse(readFixtures('patient.json'));
        schemaBuilder.connect().then(function(db){
            patientDbService.insertPatientData(db, patientJson).then(function(){
                var uuid = 'e34992ca-894f-4344-b4b3-54a4aa1e5558';
                patientDbService.getPatientByUuid(db, uuid).then(function(result){
                    expect(result.patient.uuid).toBe(uuid);
                    done();
                });
            });
        });
    });

    it("insert patient and should not get if the patient is voided from lovefield database", function(done){
        var schemaBuilder = lf.schema.create('BahmniTest', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.SchemaDefinitions.Patient);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var patientJson = JSON.parse(readFixtures('patient.json'));
        patientJson.patient.voided = true;
        schemaBuilder.connect().then(function(db){
            patientDbService.insertPatientData(db, patientJson).then(function(){
                var uuid = 'e34992ca-894f-4344-b4b3-54a4aa1e5558';
                patientDbService.getPatientByUuid(db, uuid).then(function(result){
                    expect(result).toBeUndefined();
                    done();
                });
            });
        });
    });

    it("get count of patients from patient table from database", function(done){
        var schemaBuilder = lf.schema.create('BahmniTest', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.SchemaDefinitions.Patient);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var patientJson = JSON.parse(readFixtures('patient.json'));
        patientJson.patient.voided = true;
        schemaBuilder.connect().then(function(db){
            patientDbService.insertPatientData(db, patientJson).then(function(){
                patientDbService.getPatientsCount(db).then(function(result){
                    expect(result).toBe(1);
                    done();
                });
            });
        });
    });

    it("should clear all the records from patient table", function (done){
        var schemaBuilder = lf.schema.create('BahmniTest', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.SchemaDefinitions.Patient);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var patientJson = JSON.parse(readFixtures('patient.json'));
        patientJson.patient.voided = true;
        schemaBuilder.connect().then(function(db){
            patientDbService.deleteAllPatientRecords(db).then(function(){
                patientDbService.getPatientsCount(db).then(function(result){
                    expect(result).toBe(0);
                    done();
                });
            });
        });
    });

});