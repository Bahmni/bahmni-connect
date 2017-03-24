'use strict';

angular.module('bahmni.common.offline')
    .service('referenceDataDbService', ['patientAttributeDbService', 'locationDbService', 'offlineService',
        function (patientAttributeDbService, locationDbService, offlineService) {
            var db, metaDataDb;

            var getReferenceData = function (referenceDataKey) {
                var referenceData = metaDataDb.getSchema().table('reference_data');
                return metaDataDb.select()
                .from(referenceData)
                .where(referenceData.key.eq(referenceDataKey)).exec()
                .then(function (result) {
                    return referenceDataKey === 'LoginLocations' ? setSyncInfo(result[0]) : result[0];
                });
            };

            var setSyncInfo = function (loginLocations) {
                var initialSyncStatus = _.values(offlineService.getItem("initialSyncStatus"));
                if (loginLocations && loginLocations.data.results) {
                    _.each(loginLocations.data.results, function (loginLocation) {
                        var x = _.find(initialSyncStatus, function (syncLocation) {
                            return syncLocation[loginLocation.uuid];
                        });
                        loginLocation.isSynced = x ? x[loginLocation.uuid] === 'complete' : false;
                    });
                }
                return loginLocations;
            };

            var insertReferenceData = function (referenceDataKey, data, eTag) {
                var referenceData = metaDataDb.getSchema().table('reference_data');

                var row = referenceData.createRow({
                    key: referenceDataKey,
                    data: data,
                    etag: eTag
                });

                return metaDataDb.insertOrReplace().into(referenceData).values([row]).exec().then(function () {
                    switch (referenceDataKey) {
                    case 'PersonAttributeType':
                        return patientAttributeDbService.insertAttributeTypes(db, data.results);
                    case 'LoginLocations':
                        return locationDbService.insertLocations(metaDataDb, data.results);
                    default :
                        return;
                    }
                });
            };

            var init = function (_metadatadb, _db) {
                metaDataDb = _metadatadb;
                db = _db;
            };

            return {
                init: init,
                getReferenceData: getReferenceData,
                insertReferenceData: insertReferenceData
            };
        }]);
