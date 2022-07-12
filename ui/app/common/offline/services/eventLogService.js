'use strict';

angular.module('bahmni.common.offline')
    .factory('eventLogService', ['$http', '$q', function ($http, $q) {
        var getEvents = function (url, marker) {
            return $http.get(url, { params: {filterBy: marker.filters, uuid: marker.lastReadEventUuid}});
        };

        var getDataForUrl = function (url) {
            return $http.get(url);
        };

        var getAddressForLoginLocation = function (params) {
            var url = Bahmni.Common.Constants.openmrsUrl +
                "/module/addresshierarchy/ajax/getPossibleAddressHierarchyEntriesWithParents.form";
            return $http.get(url, { method: "GET", params: params, withCredentials: true});
        };

        var getFilterForCategoryAndLoginLocation = function (providerUuid, addressUuid, loginlocationUuid) {
            var url = Bahmni.Common.Constants.eventlogFilterUrl + "/markers/" + providerUuid + "/" + addressUuid + "/" + loginlocationUuid;
            return $http.get(url, {method: "GET", withCredentials: true});
        };

        var getEventCategoriesToBeSynced = function () {
            var url = Bahmni.Common.Constants.eventlogFilterUrl + "/category";
            return $http.get(url, { method: "GET", withCredentials: true});
        };

        var getEventsFor = function (category, marker) {
            switch (category) {
            case 'patient':
                return getEvents(Bahmni.Common.Constants.eventLogServicePatientUrl, marker);
            case 'encounter':
                return getEvents(Bahmni.Common.Constants.eventLogServiceEncounterUrl, marker);
            case 'offline-concepts':
                return getEvents(Bahmni.Common.Constants.eventLogServiceConceptUrl, marker);
            // case 'parentAddressHierarchy':
            case 'addressHierarchy':
                return getEvents(Bahmni.Common.Constants.addressEventLogServiceUrl, marker);
            case 'forms':
                return getEvents(Bahmni.Common.Constants.eventLogServiceFormUrl, marker);
            default:
                return $q.when({});
            }
        };

        return {
            getEventsFor: getEventsFor,
            getDataForUrl: getDataForUrl,
            getAddressForLoginLocation: getAddressForLoginLocation,
            getFilterForCategoryAndLoginLocation: getFilterForCategoryAndLoginLocation,
            getEventCategoriesToBeSynced: getEventCategoriesToBeSynced
        };
    }]);
