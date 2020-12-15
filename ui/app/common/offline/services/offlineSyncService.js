'use strict';

angular.module('bahmni.common.offline')
    .service('offlineSyncService', ['eventLogService', 'offlineDbService', '$q', 'offlineService', 'androidDbService',
        '$rootScope', 'loggingService', '$http', '$timeout', 'dbNameService', 'messagingService',
        function (eventLogService, offlineDbService, $q, offlineService, androidDbService, $rootScope, loggingService,
            $http, $timeout, dbNameService, messagingService) {
            var stages, categories;

            var createRejectedPromise = function () {
                var deferrable = $q.defer();
                deferrable.reject();
                return deferrable.promise;
            };

            var initializeInitSyncInfo = function initializeCounters (categories) {
                $rootScope.initSyncInfo = {};
                $rootScope.showSyncInfo = true;
                _.map(categories, function (category) {
                    $rootScope.initSyncInfo[category] = {};
                    $rootScope.initSyncInfo[category].pendingEventsCount = 0;
                    $rootScope.initSyncInfo[category].savedEventsCount = 0;
                });
                $rootScope.initSyncInfo.savedEvents = 0;
            };

            var savePatients = function (patients, count) {
                if (count != patients.length) {
                    return saveData({ category: 'patient' }, { data: patients[count] }).then(function () {
                        updateSavedEventsCount('patient');
                        return (offlineService.isAndroidApp() && count % 10 == 0)
                            ? $timeout(savePatients, 100, true, patients, ++count) : savePatients(patients, ++count);
                    });
                }
                return $q.when();
            };

            var saveAddressHierarchy = function (addressHierarchies, count) {
                if (count != addressHierarchies.length) {
                    return saveData({ category: 'addressHierarchy' }, { data: addressHierarchies[count] }).then(function () {
                        updateSavedEventsCount('addressHierarchy');
                        return (offlineService.isAndroidApp() && count % 10 == 0)
                            ? $timeout(saveAddressHierarchy, 100, true, addressHierarchies, ++count) : saveAddressHierarchy(addressHierarchies, ++count);
                    });
                }
                return $q.when();
            };
            var saveMetaData = function (offlineConcepts, count) {
                if (count != offlineConcepts.length) {
                    return saveData({ category: 'offline-concepts' }, { data: offlineConcepts[count] }).then(function () {
                        updateSavedEventsCount('offline-concepts');
                        return (offlineService.isAndroidApp() && count % 10 == 0)
                            ? $timeout(saveMetaData, 100, true, offlineConcepts, ++count) : saveMetaData(offlineConcepts, ++count);
                    });
                }
                return $q.when();
            };

            var updateSyncedFileNames = function (fileName, dbName) {
                var syncedInfo = offlineService.getItem("synced") || {};
                syncedInfo[dbName] = syncedInfo[dbName] || [];
                syncedInfo[dbName].push(fileName);
                offlineService.setItem("synced", syncedInfo);
            };

            var getPatientDataForFiles = function (fileNames, count, eventLogUuid, dbName) {
                if (count !== fileNames.length) {
                    return $http.get(Bahmni.Common.Constants.preprocessedPatientUrl + fileNames[count]).then(function (response) {
                        updatePendingEventsCount("patient", response.data.patients.length);
                        var lastReadEventUuid = response.data.lastReadEventUuid;
                        return savePatients(response.data.patients, 0).then(function () {
                            updateSyncedFileNames(fileNames[count], dbName);
                            return getPatientDataForFiles(fileNames, ++count, lastReadEventUuid, dbName);
                        });
                    });
                }
                return $q.when(eventLogUuid);
            };

            var getDbName = function () {
                var loginInformation = offlineService.getItem('LoginInformation');
                var location = loginInformation ? loginInformation.currentLocation.display : null;
                var username = offlineService.getItem("userData").results[0].username;
                return dbNameService.getDbName(username, location);
            };

            var getRemainingFileNames = function (fileNames, synced) {
                var remaining = _.difference(fileNames, synced);
                return remaining.length ? remaining : fileNames.length ? [_.last(fileNames)] : fileNames;
            };

            var savePatientDataFromFile = function () {
                var defer = $q.defer();
                offlineDbService.getMarker('patient').then(function (marker) {
                    if (marker.lastReadEventUuid) {
                        return defer.resolve(marker.lastReadEventUuid);
                    }

                    return getDbName().then(function (dbName) {
                        var eventLogUuid;
                        var promises = marker.filters.map(function (filter) {
                            var syncedInfo = offlineService.getItem("synced") || {};
                            var synced = syncedInfo[dbName] || [];
                            return $http.get(Bahmni.Common.Constants.preprocessedPatientFilesUrl + filter).then(function (response) {
                                return getPatientDataForFiles(getRemainingFileNames(response.data, synced), 0, null, dbName).then(function (uuid) {
                                    eventLogUuid = uuid;
                                });
                            }).catch(function () {
                                endSync(-1);
                                return defer.reject();
                            });
                        });
                        return $q.all(promises).then(function () {
                            return defer.resolve(eventLogUuid);
                        });
                    });
                });
                return defer.promise;
            };

            var saveMetaDataFromFile = function () {
                var defer = $q.defer();
                return getDbName().then(function (dbName) {
                    var eventLogUuid;
                    var syncedInfo = offlineService.getItem("synced") || {};
                    var synced = syncedInfo[dbName] || [];
                    return $http.get(Bahmni.Common.Constants.preprocessedOfflineConceptsFilesUrl + "offline-concepts").then(function (response) {
                        return getOfflineConceptsDataForFiles(getRemainingFileNames(response.data, synced), 0, null, dbName).then(function (uuid) {
                            eventLogUuid = uuid;
                            return eventLogUuid;
                        });
                    }).catch(function () {
                        endSync(-1);
                        return defer.reject();
                    });
                });
            };
            var getOfflineConceptsDataForFiles = function (fileNames, count, eventLogUuid, dbName) {
                if (count !== fileNames.length) {
                    return $http.get(Bahmni.Common.Constants.preprocessedOfflineConceptsUrl + fileNames[count]).then(function (response) {
                        updatePendingEventsCount("offline-concepts", response.data.offlineconcepts.length);
                        var lastReadEventUuid = response.data.lastReadEventUuid;
                        return saveMetaData(response.data.offlineconcepts, 0).then(function () {
                            updateSyncedFileNames(fileNames[count], dbName);
                            return getOfflineConceptsDataForFiles(fileNames, ++count, lastReadEventUuid, dbName);
                        });
                    });
                }
                return $q.when(eventLogUuid);
            };

            var saveAddressHierarchyDataFromFile = function () {
                var defer = $q.defer();
                return getDbName().then(function (dbName) {
                    var eventLogUuid;
                    var syncedInfo = offlineService.getItem("synced") || {};
                    var synced = syncedInfo[dbName] || [];
                    return $http.get(Bahmni.Common.Constants.preprocessedAddressHierarchyFilesUrl + "AddressHierarchy").then(function (response) {
                        return getAddressHierarchyDataForFiles(getRemainingFileNames(response.data, synced), 0, null, dbName).then(function (uuid) {
                            eventLogUuid = uuid;
                            return eventLogUuid;
                        });
                    }).catch(function () {
                        endSync(-1);
                        return defer.reject();
                    });
                });
            };
            var getAddressHierarchyDataForFiles = function (fileNames, count, eventLogUuid, dbName) {
                if (count !== fileNames.length) {
                    return $http.get(Bahmni.Common.Constants.preprocessedAddressHierarchyUrl + fileNames[count]).then(function (response) {
                        updatePendingEventsCount("addressHierarchy", response.data.addressHierarchy.length);
                        var lastReadEventUuid = response.data.lastReadEventUuid;
                        return saveAddressHierarchy(response.data.addressHierarchy, 0).then(function () {
                            updateSyncedFileNames(fileNames[count], dbName);
                            return getAddressHierarchyDataForFiles(fileNames, ++count, lastReadEventUuid, dbName);
                        });
                    });
                }
                return $q.when(eventLogUuid);
            };

            var getDbNameCondition = function () {
                var appName = "dbNameCondition";
                var requestUrl = Bahmni.Common.Constants.baseUrl + appName + "/" + appName + ".json";
                return $http.get(requestUrl).then(function (result) {
                    return offlineDbService.insertConfig(appName, result.data, result.headers().etag);
                }).catch(function (response) {
                    messagingService.showMessage("error", Bahmni.Common.Constants.offlineErrorMessages.dbNameConditionNotPresent);
                    logSyncError(response);
                });
            };

            var migrate = function (isInitSync) {
                var categoryPromise = eventLogService.getEventCategoriesToBeSynced().then(function (results) {
                    offlineService.setItem("eventLogCategories", results.data);
                });
                var url = Bahmni.Common.Constants.globalPropertyUrl + "?property=allowMultipleLoginLocation";
                var multiDbConfigPromise = $http.get(url).then(function (res) {
                    offlineService.setItem("allowMultipleLoginLocation", res.data);
                    if (res.data) {
                        return getDbNameCondition();
                    }
                });
                return $q.all([categoryPromise, multiDbConfigPromise]).then(function () {
                    return syncData(isInitSync);
                });
            };

            var sync = function (isInitSync) {
                stages = 0;
                if (offlineService.isAndroidApp()) {
                    offlineDbService = androidDbService;
                }
                if (_.includes(offlineService.getItem("eventLogCategories"), "transactionalData")) {
                    return migrate(isInitSync);
                }
                return syncData(isInitSync);
            };

            var syncData = function (isInitSync) {
                var promises = [];
                categories = offlineService.getItem("eventLogCategories");
                initializeInitSyncInfo(categories);
                if (isInitSync) {
                    _.forEach(categories, function (category) {
                        if (category === "forms") {
                            promises.push(syncForCategory(category, isInitSync));
                        }
                    });

                    if (isInitSync && _.indexOf(categories, 'offline-concepts') !== -1) {
                        $rootScope.initSyncInfo.message = "Metadata";
                        var offlineConceptsPromise = saveMetaDataFromFile().then(function (uuid) {
                            return updateMarker({ uuid: uuid }, "offline-concepts");
                        });
                        promises.push(offlineConceptsPromise);
                    }
                    if (isInitSync && _.indexOf(categories, 'addressHierarchy') !== -1) {
                        $rootScope.initSyncInfo.message = "Metadata";
                        var addressHierarchyPromise = saveAddressHierarchyDataFromFile().then(function (uuid) {
                            return updateMarker({ uuid: uuid }, "addressHierarchy");
                        });
                        promises.push(addressHierarchyPromise);
                    }
                } else {
                    offlineDbService.getPatientsCount().then(
                        function (patientsCount) {
                            if (patientsCount === 0) {
                                var patientPromise = savePatientDataFromFile().then(function (uuid) {
                                    return updateMarker({ uuid: uuid }, "patient");
                                });
                                promises.push(patientPromise);

                                categories = ["encounter"];
                                promises.push(syncForCategory(categories[0], isInitSync));
                            } else {
                                _.forEach(categories, function (category) {
                                    promises.push(syncForCategory(category, isInitSync));
                                });
                            }
                        }
                    );
                }

                return $q.all(promises);
            };

            var syncForCategory = function (category, isInitSync) {
                return offlineDbService.getMarker(category).then(function (marker) {
                    if (category === "encounter" && isInitSync) {
                        marker = angular.copy(marker);
                        marker.filters = offlineService.getItem("initSyncFilter");
                    }
                    return syncForMarker(category, marker, isInitSync);
                });
            };

            var updatePendingEventsCount = function (category, pendingEventsCount) {
                if (category === 'patient') {
                    $rootScope.initSyncInfo[category].pendingEventsCount += pendingEventsCount;
                } else {
                    $rootScope.initSyncInfo[category].pendingEventsCount = pendingEventsCount;
                }
                $rootScope.initSyncInfo.totalEvents = categories.reduce(function (count, category) {
                    return count + $rootScope.initSyncInfo[category].savedEventsCount + $rootScope.initSyncInfo[category].pendingEventsCount;
                }, 0);
            };

            var syncForMarker = function (category, marker, isInitSync) {
                return eventLogService.getEventsFor(category, marker).then(function (response) {
                    var events = response.data ? response.data["events"] : undefined;
                    if (events == undefined || events.length == 0) {
                        endSync(stages++);
                        return;
                    }
                    updatePendingEventsCount(category, response.data.pendingEventsCount);
                    return readEvent(events, 0, category, isInitSync);
                }, function () {
                    endSync(-1);
                    return createRejectedPromise();
                });
            };

            var readEvent = function (events, index, category, isInitSync) {
                if (events.length == index && events.length > 0) {
                    return syncForCategory(category, isInitSync);
                }
                if (events.length == index) {
                    return;
                }
                var event = events[index];
                if (event.category == "SHREncounter") {
                    var uuid = event.object.match(Bahmni.Common.Constants.uuidRegex)[0];
                    event.object = Bahmni.Common.Constants.offlineBahmniEncounterUrl + uuid + "?includeAll=true";
                }
                return eventLogService.getDataForUrl(Bahmni.Common.Constants.hostURL + event.object)
                    .then(function (response) {
                        return saveData(event, response)
                            .then(function () {
                                updateSavedEventsCount(category);
                                return updateMarker(event, category);
                            }, createRejectedPromise)
                            .then(
                                function (lastEvent) {
                                    offlineService.setItem("lastSyncTime", lastEvent.lastReadTime);
                                    return readEvent(events, ++index, category, isInitSync);
                                });
                    }).catch(function (response) {
                        logSyncError(response);
                        $rootScope.$broadcast("schedulerStage", null, true);
                        endSync(-1);
                        return createRejectedPromise();
                    });
            };

            var logSyncError = function (response) {
                if (response && (parseInt(response.status / 100) == 4 || parseInt(response.status / 100) == 5)) {
                    loggingService.logSyncError(response.config.url, response.status, response.data);
                }
            };

            var isPrimary = function (identifier, identifierTypes) {
                return identifier.identifierType.retired ? false : !!(_.find(identifierTypes, { 'uuid': identifier.identifierType.uuid })).primary;
            };

            var mapIdentifiers = function (identifiers) {
                var deferred = $q.defer();
                return offlineDbService.getReferenceData("IdentifierTypes").then(function (identifierTypesData) {
                    var identifierTypes = identifierTypesData.data;
                    angular.forEach(identifiers, function (identifier) {
                        identifier.identifierType.primary = isPrimary(identifier, identifierTypes);
                    });
                    var extraIdentifiersForSearch = {};
                    var extraIdentifiers = _.filter(identifiers, { 'identifierType': { 'primary': false } });
                    var primaryIdentifier = _.filter(identifiers, { 'identifierType': { 'primary': true } })[0];
                    angular.forEach(extraIdentifiers, function (extraIdentifier) {
                        var name = extraIdentifier.identifierType.display || extraIdentifier.identifierType.name;
                        extraIdentifiersForSearch[name] = extraIdentifier.identifier;
                    });
                    angular.forEach(identifiers, function (identifier) {
                        identifier.primaryIdentifier = primaryIdentifier.identifier;
                        identifier.extraIdentifiers = !_.isEmpty(extraIdentifiersForSearch) ? extraIdentifiersForSearch : undefined;
                    });
                    deferred.resolve({ data: identifiers });
                    return deferred.promise;
                });
            };

            var saveData = function (event, response) {
                var deferrable = $q.defer();
                switch (event.category) {
                case 'patient':
                    offlineDbService.getAttributeTypes().then(function (attributeTypes) {
                        mapAttributesToPostFormat(response.data.person.attributes, attributeTypes);
                        mapIdentifiers(response.data.identifiers).then(function () {
                            offlineDbService.createPatient({ patient: response.data }).then(function () {
                                deferrable.resolve();
                            }, function (response) {
                                deferrable.reject(response);
                            });
                        });
                    });
                    break;
                case 'Encounter':
                case 'SHREncounter':
                    offlineDbService.createEncounter(response.data).then(function () {
                        deferrable.resolve();
                    });
                    break;
                case 'LabOrderResults':
                    var patientUuid = event.object.match(Bahmni.Common.Constants.uuidRegex)[0];
                    offlineDbService.insertLabOrderResults(patientUuid, response.data).then(function () {
                        deferrable.resolve();
                    });
                    break;

                case 'offline-concepts':
                    offlineDbService.insertConceptAndUpdateHierarchy({ "results": [response.data] }).then(function () {
                        deferrable.resolve();
                    });
                    break;
                case 'addressHierarchy':
                case 'parentAddressHierarchy':
                    offlineDbService.insertAddressHierarchy(response.data).then(function () {
                        deferrable.resolve();
                    });
                    break;
                case 'forms':
                    offlineDbService.insertForm(response.data).then(function () {
                        deferrable.resolve();
                    });
                    break;
                default:
                    deferrable.resolve();
                    break;
                }
                return deferrable.promise;
            };

            var mapAttributesToPostFormat = function (attributes, attributeTypes) {
                angular.forEach(attributes, function (attribute) {
                    if (!attribute.voided && !attribute.attributeType.retired) {
                        var foundAttribute = _.find(attributeTypes, function (attributeType) {
                            return attributeType.uuid === attribute.attributeType.uuid;
                        });
                        if (foundAttribute.format === "org.openmrs.Concept") {
                            var value = attribute.value;
                            attribute.value = value.display;
                            attribute.hydratedObject = value.uuid;
                        }
                    }
                });
            };

            var updateMarker = function (event, category) {
                return offlineDbService.getMarker(category).then(function (marker) {
                    if (event.uuid == undefined) {
                        if (marker.lastReadEventUuid != undefined) {
                            throw new Error("Event identifier is null or undefined. Can not override last read event for category - " + category);
                        }
                    }
                    return offlineDbService.insertMarker(marker.markerName, event.uuid, marker.filters);
                });
            };

            var updateSavedEventsCount = function (category) {
                $rootScope.initSyncInfo[category].savedEventsCount++;
                $rootScope.initSyncInfo[category].pendingEventsCount--;
                $rootScope.initSyncInfo.savedEvents++;
            };

            var endSync = function (status) {
                if (stages == categories.length || status == -1) {
                    $rootScope.$broadcast("schedulerStage", null);
                }
            };

            return {
                sync: sync
            };
        }
    ]);
