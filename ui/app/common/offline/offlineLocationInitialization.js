'use strict';

angular.module('bahmni.common.offline')
    .factory('offlineLocationInitialization', ['offlineService', 'offlineDbService', 'androidDbService', 'eventLogService', '$q',
        function (offlineService, offlineDbService, androidDbService, eventLogService, $q) {
            return function () {
                var addressLevels;
                if (offlineService.isAndroidApp()) {
                    offlineDbService = androidDbService;
                }
                var loginLocation = offlineService.getItem('LoginInformation').currentLocation;
                var provider = offlineService.getItem('providerData').results[0];
                var deferred = $q.defer();

                var insertMarkers = function (categoryFilterMap) {
                    return Object.keys(categoryFilterMap).map(function (category) {
                        return offlineDbService.getMarker(category).then(function (marker) {
                            if (category === "encounter") {
                                offlineService.setItem("initSyncFilter", categoryFilterMap[category]);
                            }
                            var filters = (marker && marker.filters) || [];
                            var lastReadEventUuid = (marker && marker.lastReadEventUuid) || null;
                            filters = filters.concat(categoryFilterMap[category]);
                            return offlineDbService.insertMarker(category, lastReadEventUuid, _.uniq(filters));
                        });
                    });
                };

                var getLoginLocationAddress = function () {
                    for (var addressLevel = 0; addressLevel < addressLevels.length; addressLevel++) {
                        if (loginLocation[addressLevels[addressLevel].addressField] != null) {
                            return addressLevels[addressLevel].addressField;
                        }
                    }
                };

                var checkParents = function (result, addressLevel) {
                    if (!result.parent) {
                        return true;
                    }
                    if (result.parent.name !== loginLocation[addressLevel.addressField]) {
                        return false;
                    }
                    if (result.parent.name === loginLocation[addressLevel.addressField]) {
                        return checkParents(result.parent, getParentAddressLevel(addressLevel.addressField));
                    }
                };

                var getParentAddressLevel = function (addressField) {
                    var parent = null;
                    for (var addrLevel = 0; addrLevel < addressLevels.length; addrLevel++) {
                        if (addressLevels[addrLevel].addressField === addressField) {
                            return parent;
                        }
                        parent = addressLevels[addrLevel];
                    }
                };

                var getAddressField = function () {
                    return offlineDbService.getReferenceData('AddressHierarchyLevels').then(function (addressHierarchyLevel) {
                        if (!(addressHierarchyLevel && addressHierarchyLevel.data)) {
                            return null;
                        }
                        addressLevels = _.reverse(addressHierarchyLevel.data);
                        var addressField = getLoginLocationAddress();
                        _.reverse(addressLevels);
                        if (addressField && loginLocation[addressField]) {
                            var params = {
                                searchString: loginLocation[addressField],
                                addressField: addressField,
                                limit: 5000
                            };
                            return eventLogService.getAddressForLoginLocation(params).then(function (results) {
                                for (var addressResults = 0; addressResults < results.data.length; addressResults++) {
                                    var loginAddress = results.data[addressResults];
                                    if (checkParents(loginAddress, getParentAddressLevel(addressField))) {
                                        return loginAddress.uuid;
                                    }
                                }
                                return null;
                            });
                        }
                    });
                };

                getAddressField().then(function (result) {
                    return eventLogService.getEventCategoriesToBeSynced().then(function (results) {
                        var categories = results.data;
                        offlineService.setItem("eventLogCategories", categories);
                        return eventLogService.getFilterForCategoryAndLoginLocation(provider.uuid, result || null, loginLocation.uuid).then(function (results) {
                            return $q.all(insertMarkers(angular.copy(results.data))).then(deferred.resolve);
                        }, function (response) {
                            deferred.reject(response);
                        });
                    }, function (response) {
                        return deferred.reject(response);
                    });
                });
                return deferred.promise;
            };
        }
    ]);
