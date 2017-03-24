'use strict';

describe('referenceDataDbService tests', function () {
    var referenceDataDbService;
    var offlineService;

    beforeEach(function () {
        module('bahmni.common.offline');
    });

    beforeEach(inject(['referenceDataDbService','offlineService', function (referenceDataDbServiceInjected, offlineServiceInjected) {
        referenceDataDbService = referenceDataDbServiceInjected;
        offlineService = offlineServiceInjected;
    }]));

    it("insert loginLocations and get from lovefield database", function(done){
        var schemaBuilder = lf.schema.create('BahmniReferenceData', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.ReferenceData);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.LoginLocations);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var locationsJson = JSON.parse(readFixtures('loginLocations.json'));
        var referenceDataKey = "LoginLocations";
        var eTag = "etag";
        var syncStatus = {"Registration":{"74703720-ea14-4caa-be74-0fa0e0f2fbe7":"complete"},"OT":{"6d9b190b-02f3-4d33-bb35-21cd71cbe62a":"complete"}};
        offlineService.setItem('initialSyncStatus', syncStatus);
        schemaBuilder.connect().then(function(db){
            referenceDataDbService.init(db);
            referenceDataDbService.insertReferenceData(referenceDataKey, locationsJson, eTag).then(function(){
                    referenceDataDbService.getReferenceData(referenceDataKey).then(function(result) {
                        expect(result.etag).toBe(eTag);
                        expect(result.key).toBe(referenceDataKey);
                        expect(result.data).toBe(locationsJson);
                        expect(result.data.results.length).toBe(6);
                        expect(result.data.results[0].isSynced).toBe(false);
                        expect(result.data.results[1].isSynced).toBe(false);
                        expect(result.data.results[4].isSynced).toBe(true);
                        expect(result.data.results[5].isSynced).toBe(true);
                        done();
                    });
            });
        });
    });


  it("insert referenceData and get from lovefield database", function(done){
    var schemaBuilder = lf.schema.create('BahmniReferenceData', 1);
    Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.ReferenceData);
    Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.LoginLocations);
    var referenceDataKey = "LocaleList";
    var eTag = "etag";
    var localeList = "en, es, fr, it, pt";
    schemaBuilder.connect().then(function(db){
      referenceDataDbService.init(db);
      referenceDataDbService.insertReferenceData(referenceDataKey, localeList, eTag).then(function(){
        referenceDataDbService.getReferenceData(referenceDataKey).then(function(result) {
          expect(result.etag).toBe(eTag);
          expect(result.key).toBe(referenceDataKey);
          expect(result.data).toBe(localeList);
          done();
        });
      });
    });
  });

});