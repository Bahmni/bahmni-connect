'use strict';

var $scope, offlineDbService, eventLogService, offlineSyncService, offlineService, configurationService, loggingService, dbNameService;

describe('OfflineSyncService', function () {
    var patient, encounter, concept, error_log, labOrderResults, mappedIdentifiers, q;
    describe('initial sync ', function () {
        var httpBackend, $http, $rootScope;
        beforeEach(function () {
            module('bahmni.common.offline');
            module('bahmni.common.domain');
            module(function ($provide) {
                mappedIdentifiers = [{
                    "display": "Bahmni Id = GAN200076",
                    "uuid": "9cc96aeb-2877-4340-b9fd-abba016a84a3",
                    "identifier": "GAN200076",
                    "identifierSourceUuid": "81f27b48-8792-11e5-ade6-005056b07f03",
                    "identifierType": {"uuid": "81433852-3f10-11e4-adec-0800271c1b75", "primary": true},
                    "voided": false,
                    "primaryIdentifier": "GAN200076",
                    "extraIdentifiers": {"Bahmni Sec Id": "SecodaryIdentifier"}
                }, {
                    "uuid": "99996aeb-2877-4340-b9fd-abba016a84a3",
                    "identifier": "SecodaryIdentifier",
                    "identifierSourceUuid": "99997b48-8792-11e5-ade6-005056b07f03",
                    "identifierType": {
                        "uuid": "99993852-3f10-11e4-adec-0800271c1b75",
                        "display": "Bahmni Sec Id",
                        "primary": false
                    },
                    "voided": false,
                    "primaryIdentifier": "GAN200076",
                    "extraIdentifiers": {"Bahmni Sec Id": "SecodaryIdentifier"}
                }];
                patient = {
                    uuid: 'dataUuid',
                    person: {
                        attributes: [{
                            attributeType: {
                                uuid: "attributeUuid"
                            },
                            voided: false,
                            value: {
                                display: "attributeName",
                                uuid: "attributeValueUuid"
                            }
                        }]
                    },
                    identifiers: [
                        {
                            "display": "Bahmni Id = GAN200076",
                            "uuid": "9cc96aeb-2877-4340-b9fd-abba016a84a3",
                            "identifier": "GAN200076",
                            "identifierSourceUuid": "81f27b48-8792-11e5-ade6-005056b07f03",
                            "identifierType": {
                                "uuid": "81433852-3f10-11e4-adec-0800271c1b75"
                            },
                            "voided": false
                        },
                        {
                            "uuid": "99996aeb-2877-4340-b9fd-abba016a84a3",
                            "identifier": "SecodaryIdentifier",
                            "identifierSourceUuid": "99997b48-8792-11e5-ade6-005056b07f03",
                            "identifierType": {
                                "uuid": "99993852-3f10-11e4-adec-0800271c1b75",
                                "display": "Bahmni Sec Id"
                            },
                            "voided": false
                        }
                    ]
                };
                concept = {
                    uuid: 'dataUuid',
                    data: {},
                    parents: {"parentUuids": []},
                    name: 'concept'
                };
                error_log = {
                    config: {"url": "this is the url"},
                    data: {}
                };
                encounter = {
                    uuid: 'encounterUuid',
                    observations: [],
                    patientUuid: "patientUuid",
                    visitUuid: "visitUuid"
                };
                labOrderResults = {
                    results: {
                        "results": [],
                        "tabularResult": {"dates": [], "orders": [], "values": []}
                    }
                };
                $provide.value('offlineDbService', {
                    insertAddressHierarchy: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    insertEncounterData: function () {
                        return {
                            then: function (callback) {
                                return callback({visitUuid: "someUuid"});
                            }
                        };
                    },
                    createEncounter: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    insertLabOrderResults: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    insertVisitData: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    createPatient: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    getReferenceData: function () {
                        return {
                            then: function (callback) {
                                return callback({
                                    data: [
                                        {
                                            uuid: "81433852-3f10-11e4-adec-0800271c1b75",
                                            primary: true
                                        },
                                        {
                                            uuid: "99993852-3f10-11e4-adec-0800271c1b75",
                                            primary: false
                                        }
                                    ]
                                });
                            }
                        };
                    },
                    insertConceptAndUpdateHierarchy: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    getMarker: function (category) {
                        return {
                            then: function (callback) {
                                return callback({markerName: category, filters: [202020]});
                            }
                        }
                    },
                    insertMarker: function () {
                        return {
                            then: function (callback) {
                                return callback({lastReadTime: new Date()});
                            }
                        };
                    },
                    insertLog: function () {
                        return {
                            then: function (callback) {
                                return callback;
                            }
                        };
                    },
                    getAttributeTypes: function () {
                        return {
                            then: function (callback) {
                                var attributeTypes = {
                                    uuid: 'attributeUuid',
                                    format: 'org.openmrs.Concept'
                                };
                                return callback({data: attributeTypes});
                            }
                        };
                    }
                });
                $provide.value('eventLogService', {
                    getEventsFor: function (category) {
                        return {
                            then: function (callback) {
                                var event = {
                                    object: 'url to get ' + category + ' object',
                                    category: category,
                                    uuid: 'eventuuid'
                                };
                                return callback({

                                    data: {events: [event], pendingEventsCount: 2}
                                });
                            }
                        };
                    },

                    getDataForUrl: function (url) {
                        return {
                            then: function (callback) {
                                if (_.includes(url, "concept")) {
                                    return callback({data: concept});
                                }
                                return callback({data: patient});
                            }
                        };
                    }
                });

                $provide.value('offlineService', {
                    isAndroidApp: function () {
                        return false;
                    },
                    getItem: function () {
                        return [202020];
                    },
                    setItem: function () {
                    }
                });

                $provide.value('dbNameService', {
                    getDbName: function () {}
                });

                $provide.value('loggingService', {
                    logSyncError: function (errorUrl, status, stackTrace, payload) {
                        return {};
                    }
                });
            });
        });

        beforeEach(inject(['offlineSyncService', 'eventLogService', 'offlineDbService', 'configurationService', '$httpBackend', '$http', '$rootScope', 'loggingService', 'offlineService', 'dbNameService', '$q',
            function (offlineSyncServiceInjected, eventLogServiceInjected, offlineDbServiceInjected, configurationServiceInjected, _$httpBackend_, http, rootScope, loggingServiceInjected, offlineServiceInjected, dbNameServiceInjected, $q) {
                offlineSyncService = offlineSyncServiceInjected;
                eventLogService = eventLogServiceInjected;
                offlineDbService = offlineDbServiceInjected;
                configurationService = configurationServiceInjected;
                loggingService = loggingServiceInjected;
                offlineService = offlineServiceInjected;
                dbNameService = dbNameServiceInjected;
                httpBackend = _$httpBackend_;
                $http = http;
                $rootScope = rootScope;
                q = $q;
            }]));

        it('should read the meta data events from the beginning for each category', function () {
            var categories = [
                'addressHierarchy',
                'parentAddressHierarchy',
                'offline-concepts'
            ];

            httpBackend.whenGET(Bahmni.Common.Constants.preprocessedPatientUrl + "202020").respond({
                lastReadEvaentUuid: "last",
                patients: []
            });

            spyOn(offlineService, 'getItem').and.returnValue(categories);
            spyOn(offlineDbService, 'getMarker').and.callThrough();
            spyOn(eventLogService, 'getEventsFor').and.callThrough();
            spyOn(eventLogService, 'getDataForUrl').and.callFake(function (url) {
                return {
                    then: function (callback) {
                        return callback({data: {uuid: url}});
                    }
                };
            });
            spyOn(offlineDbService, 'insertMarker').and.callFake(function () {
                return {
                    then: function (callback) {
                        return callback;
                    }
                }
            });
            spyOn(offlineDbService, 'insertAddressHierarchy').and.callThrough();
            spyOn(offlineDbService, 'insertConceptAndUpdateHierarchy').and.callThrough();

            offlineSyncService.sync(true);
            $rootScope.$digest();

            expect(offlineDbService.getMarker.calls.count()).toBe(categories.length * 2);

            categories.forEach(function (category) {
                expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
                expect(eventLogService.getEventsFor).toHaveBeenCalledWith(category, {
                    markerName: category,
                    filters: [202020]
                });
                var url = 'url to get ' + category + ' object';
                expect(eventLogService.getDataForUrl).toHaveBeenCalledWith(url);
                expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "eventuuid", [202020]);
                expect(offlineDbService.insertMarker.calls.count()).toBe(3);
                expect($rootScope.initSyncInfo[category].savedEventsCount).toBe(1);
            });

            expect(offlineDbService.insertAddressHierarchy).toHaveBeenCalledWith({uuid: 'url to get addressHierarchy object'});
            expect(offlineDbService.insertConceptAndUpdateHierarchy).toHaveBeenCalledWith({results: [{uuid: 'url to get offline-concepts object'}]});
            expect(offlineDbService.insertAddressHierarchy).toHaveBeenCalledWith({uuid: 'url to get parentAddressHierarchy object'});
            expect(offlineDbService.insertAddressHierarchy.calls.count()).toBe(2);
        });

        it('should read the patient event from zip file', function () {
            var localStorage = {};
            var category = 'patient';
            var patient1 = patient;
            var patient2 = patient;
            patient2.identifiers[0].identifier = "GAN2009";
            var response1 = {lastReadEventUuid: "lastEventUuid1", patients: [patient1]};
            var response2= {lastReadEventUuid: "lastEventUuid2", patients: [patient2]};
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientFilesUrl + "202020").respond(200, ["202020-1.json.gz", "202020-2.json.gz"]);
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientUrl + "202020-1.json.gz").respond(200, response1);
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientUrl + "202020-2.json.gz").respond(200, response2);

            var marker = {markerName: 'patient', filters: [202020]};

            spyOn(offlineService, 'getItem').and.callFake(function (key) {
                if(key == "LoginInformation")
                    return {currentLocation:{display:"dbName"}};
                if(key == "userData")
                    return {results: [{username:"username"}]};
                if(key == "synced")
                    return localStorage.synced;
                return [category];
            });
            spyOn(dbNameService, 'getDbName').and.returnValue(q.when("dbName"));
            spyOn(offlineService, 'setItem').and.callFake(function (key, value) {
                localStorage[key] = value;
            });
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callThrough();
            spyOn(eventLogService, 'getDataForUrl').and.callThrough();
            spyOn(offlineDbService, 'insertMarker').and.callFake(function (name, uuid, filters) {
                marker.lastReadEventUuid = uuid;
                return {lastReadTime: new Date()}
            });
            spyOn(offlineDbService, 'insertAddressHierarchy').and.callThrough();
            spyOn(offlineDbService, 'createPatient').and.callThrough();
            spyOn(offlineDbService, 'createEncounter').and.callThrough();
            spyOn(offlineDbService, 'insertLabOrderResults').and.callThrough();

            offlineSyncService.sync(true);
            $rootScope.$digest();
            httpBackend.flush();

            expect(offlineDbService.getMarker.calls.count()).toBe(2);
            expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
            expect(eventLogService.getEventsFor.calls.count()).toBe(0);

            expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "lastEventUuid2", [202020]);
            expect(offlineDbService.insertMarker.calls.count()).toBe(1);
            expect(offlineDbService.createPatient.calls.count()).toBe(2);
            expect(offlineDbService.createEncounter.calls.count()).toBe(0);
            expect(offlineDbService.insertLabOrderResults.calls.count()).toBe(0);
            expect(eventLogService.getDataForUrl.calls.count()).toBe(0);
            expect(dbNameService.getDbName.calls.count()).toBe(1);
            expect(offlineService.getItem).toHaveBeenCalledWith("synced");
            expect(offlineService.setItem.calls.count()).toBe(2);
            expect(offlineService.setItem).toHaveBeenCalledWith("synced", {dbName:["202020-1.json.gz", "202020-2.json.gz"]})
        });

        it('should read only remaining patient zip files', function () {
            var localStorage = {synced:{dbName:["202020-1.json.gz"]}};
            var category = 'patient';
            var patient1 = patient;
            var patient2 = patient;
            patient2.identifiers[0].identifier = "GAN2009";
            var response1 = {lastReadEventUuid: "lastEventUuid1", patients: [patient1]};
            var response2= {lastReadEventUuid: "lastEventUuid2", patients: [patient2]};
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientFilesUrl + "202020").respond(200, ["202020-1.json.gz", "202020-2.json.gz", "202020-3.json.gz"]);
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientUrl + "202020-2.json.gz").respond(200, response1);
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientUrl + "202020-3.json.gz").respond(200, response2);

            var marker = {markerName: 'patient', filters: [202020]};

            spyOn(offlineService, 'getItem').and.callFake(function (key) {
                if(key == "LoginInformation")
                    return {currentLocation:{display:"dbName"}};
                if(key == "userData")
                    return {results: [{username:"username"}]};
                if(key == "synced")
                    return localStorage.synced;
                return [category];
            });
            spyOn(dbNameService, 'getDbName').and.returnValue(q.when("dbName"));
            spyOn(offlineService, 'setItem').and.callFake(function (key, value) {
                localStorage[key] = value;
            });
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callThrough();
            spyOn(eventLogService, 'getDataForUrl').and.callThrough();
            spyOn(offlineDbService, 'insertMarker').and.callFake(function (name, uuid, filters) {
                marker.lastReadEventUuid = uuid;
                return {lastReadTime: new Date()}
            });
            spyOn(offlineDbService, 'insertAddressHierarchy').and.callThrough();
            spyOn(offlineDbService, 'createPatient').and.callThrough();
            spyOn(offlineDbService, 'createEncounter').and.callThrough();
            spyOn(offlineDbService, 'insertLabOrderResults').and.callThrough();

            offlineSyncService.sync(true);
            $rootScope.$digest();
            httpBackend.flush();

            expect(offlineDbService.getMarker.calls.count()).toBe(2);
            expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
            expect(eventLogService.getEventsFor.calls.count()).toBe(0);

            expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "lastEventUuid2", [202020]);
            expect(offlineDbService.insertMarker.calls.count()).toBe(1);
            expect(offlineDbService.createPatient.calls.count()).toBe(2);
            expect(offlineDbService.createEncounter.calls.count()).toBe(0);
            expect(offlineDbService.insertLabOrderResults.calls.count()).toBe(0);
            expect(eventLogService.getDataForUrl.calls.count()).toBe(0);
            expect(dbNameService.getDbName.calls.count()).toBe(1);
            expect(offlineService.getItem).toHaveBeenCalledWith("synced");
            expect(offlineService.setItem.calls.count()).toBe(2);
            expect(offlineService.setItem).toHaveBeenCalledWith("synced", {dbName:["202020-1.json.gz", "202020-2.json.gz", "202020-3.json.gz"]})
        });

        it('should stop the sync if patient zip file is not present', function () {
            var category = 'patient';
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientFilesUrl + "202020").respond(200, ["202020-1.json.gz"]);
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientUrl + "202020-1.json.gz").respond(500, "File not found");
            var marker = {markerName: 'patient', filters: [202020]};

            spyOn(offlineService, 'getItem').and.callFake(function (key) {
                if(key == "LoginInformation")
                    return {currentLocation:{display:"dbName"}};
                if(key == "userData")
                    return {results: [{username:"username"}]};
                return key == 'initSyncFilter' ? [202020] : [category];
            });
            spyOn(dbNameService, 'getDbName').and.returnValue(q.when("dbName"));
            spyOn(offlineService, 'setItem').and.callThrough();
            spyOn($rootScope, '$broadcast');
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callThrough();
            spyOn(eventLogService, 'getDataForUrl').and.callThrough();
            spyOn(offlineDbService, 'insertMarker').and.callThrough();
            spyOn(offlineDbService, 'insertAddressHierarchy').and.callThrough();
            spyOn(offlineDbService, 'createPatient').and.callThrough();
            spyOn(offlineDbService, 'createEncounter').and.callThrough();
            spyOn(offlineDbService, 'insertLabOrderResults').and.callThrough();

            offlineSyncService.sync(true);
            $rootScope.$digest();
            httpBackend.flush();

            expect(offlineDbService.getMarker.calls.count()).toBe(1);
            expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
            expect(eventLogService.getEventsFor.calls.count()).toBe(0);

            expect(offlineDbService.insertMarker.calls.count()).toBe(0);
            expect(offlineDbService.createPatient.calls.count()).toBe(0);
            expect(offlineDbService.createEncounter.calls.count()).toBe(0);
            expect(offlineDbService.insertLabOrderResults.calls.count()).toBe(0);
            expect(eventLogService.getDataForUrl.calls.count()).toBe(0);
            expect($rootScope.isSyncing).toBeFalsy();
            expect($rootScope.$broadcast).toHaveBeenCalledWith("schedulerStage", null);

        });

        it('should read the encounter events from the beginning for each category', function () {
            var categories = [
                'encounter'
            ];

            var encounterEvent = {
                object: 'encounterUrl',
                category: 'Encounter',
                uuid: 'uuid2'
            };

            var labOrderResultsEvent = {
                object: '/openmrs/ws/rest/v1/bahmnicore/labOrderResults?patientUuid=5e94e7cb-e9fe-4763-e9ea-217bdaa85029',
                category: 'LabOrderResults',
                uuid: 'uuid3'
            };

            var marker = {markerName: 'encounter', filters: [202020]};

            spyOn(offlineService, 'getItem').and.callFake(function (key) {
                return key == 'initSyncFilter' ? [202020] : categories;
            });
            spyOn(offlineService, 'setItem').and.callThrough();
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callFake(function (category) {
                return {
                    then: function (callback) {
                        if (!marker.lastReadEventUuid)
                            return callback({
                                data: {
                                    events: [encounterEvent, labOrderResultsEvent],
                                    pendingEventsCount: 2
                                }
                            });
                    }
                }
            });
            spyOn(eventLogService, 'getDataForUrl').and.callFake(function (url) {
                return {
                    then: function (callback) {
                        return callback({data: url === encounterEvent.object ? encounter : labOrderResults});
                    }
                };
            });
            spyOn(offlineDbService, 'insertMarker').and.callFake(function (name, uuid, filters) {
                marker.lastReadEventUuid = uuid;
                return {lastReadTime: new Date()}
            });
            spyOn(offlineDbService, 'createEncounter').and.callThrough();
            spyOn(offlineDbService, 'insertLabOrderResults').and.callThrough();

            offlineSyncService.sync(true);
            $rootScope.$digest();

            expect(offlineDbService.getMarker.calls.count()).toBe(4);

            categories.forEach(function (category) {
                expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
                expect(eventLogService.getEventsFor).toHaveBeenCalledWith(category, {
                    markerName: category,
                    filters: [202020]
                });

                expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "uuid2", [202020]);
                expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "uuid3", [202020]);
                expect(offlineDbService.insertMarker.calls.count()).toBe(2);
            });
            expect(eventLogService.getDataForUrl).toHaveBeenCalledWith(encounterEvent.object);
            expect(offlineDbService.createEncounter).toHaveBeenCalledWith(encounter);
            expect(offlineDbService.insertLabOrderResults).toHaveBeenCalledWith('5e94e7cb-e9fe-4763-e9ea-217bdaa85029', labOrderResults);
        });

        it('should update filters for category encounter', function () {
            var categories = [
                'encounter'
            ];

            var encounterEvent = {
                object: 'encounterUrl',
                category: 'Encounter',
                uuid: 'uuid2'
            };

            var labOrderResultsEvent = {
                object: '/openmrs/ws/rest/v1/bahmnicore/labOrderResults?patientUuid=5e94e7cb-e9fe-4763-e9ea-217bdaa85029',
                category: 'LabOrderResults',
                uuid: 'uuid3'
            };

            var marker = {markerName: 'encounter', filters: [202020]};

            spyOn(offlineService, 'getItem').and.callFake(function (key) {
                return key == 'initSyncFilter' ? [202020, 202010] : categories;
            });
            spyOn(offlineService, 'setItem').and.callThrough();
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callFake(function (category) {
                return {
                    then: function (callback) {
                        if (!marker.lastReadEventUuid)
                            return callback({
                                data: {
                                    events: [encounterEvent, labOrderResultsEvent],
                                    pendingEventsCount: 2
                                }
                            });
                    }
                }
            });
            spyOn(eventLogService, 'getDataForUrl').and.callFake(function (url) {
                return {
                    then: function (callback) {
                        return callback({data: url === encounterEvent.object ? encounter : labOrderResults});
                    }
                };
            });
            spyOn(offlineDbService, 'insertMarker').and.callFake(function (name, uuid, filters) {
                marker.lastReadEventUuid = uuid;
                return {lastReadTime: new Date()}
            });
            spyOn(offlineDbService, 'createEncounter').and.callThrough();
            spyOn(offlineDbService, 'insertLabOrderResults').and.callThrough();

            offlineSyncService.sync(true);
            $rootScope.$digest();

            expect(offlineDbService.getMarker.calls.count()).toBe(4);

            expect(offlineDbService.getMarker).toHaveBeenCalledWith(categories[0]);
            expect(eventLogService.getEventsFor).toHaveBeenCalledWith(categories[0], {
                markerName: categories[0],
                filters: [202020, 202010]
            });

            expect(offlineDbService.insertMarker).toHaveBeenCalledWith(categories[0], "uuid2", [202020]);
            expect(offlineDbService.insertMarker).toHaveBeenCalledWith(categories[0], "uuid3", [202020]);
            expect(offlineDbService.insertMarker.calls.count()).toBe(2);
            expect(eventLogService.getDataForUrl).toHaveBeenCalledWith(encounterEvent.object);
            expect(offlineDbService.createEncounter).toHaveBeenCalledWith(encounter);
            expect(offlineDbService.insertLabOrderResults).toHaveBeenCalledWith('5e94e7cb-e9fe-4763-e9ea-217bdaa85029', labOrderResults);
        });

        it("should skip attribute if it's attribute type is retired or attribute is voided", function () {
            var categories = [
                'patient'
            ];
            var responsePatient = angular.copy(patient);
            var attributeOne = {
                attributeType: {
                    uuid: "attributeUuidOne",
                    retired: true
                },
                voided: false,
                value: {
                    display: "attributeNameOne",
                    uuid: "attributeValueUuidTwo"
                }
            };
            var attributeTwo = {
                attributeType: {
                    uuid: "attributeUuidTwo",
                    retired: false
                },
                voided: true,
                value: {
                    display: "attributeNameOne",
                    uuid: "attributeValueUuidTwo"
                }
            };
            responsePatient.person.attributes.push(attributeOne);
            responsePatient.person.attributes.push(attributeTwo);
            var response = {lastReadEventUuid: "lastEventUuid", patients: [responsePatient]};
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientFilesUrl + "202020").respond(200, ["202020-1.json.gz"]);
            httpBackend.when('GET', Bahmni.Common.Constants.preprocessedPatientUrl + "202020-1.json.gz").respond(200, response);
            var marker = {markerName: 'transactionalData', filters: [202020]};

            spyOn(offlineService, 'getItem').and.callFake(function (key) {
                if(key == "LoginInformation")
                    return {currentLocation:{display:"dbName"}};
                if(key == "userData")
                    return {results: [{username:"username"}]};
                return key == 'initSyncFilter' ? [202020] : categories;
            });
            spyOn(dbNameService, 'getDbName').and.returnValue(q.when("dbName"));
            spyOn(offlineService, 'setItem').and.callThrough();
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callThrough();
            spyOn(eventLogService, 'getDataForUrl').and.callThrough();
            spyOn(offlineDbService, 'insertMarker').and.callFake(function (name, uuid, filters) {
                marker.lastReadEventUuid = uuid;
                return {lastReadTime: new Date()}
            });
            spyOn(offlineDbService, 'createPatient').and.callThrough();

            offlineSyncService.sync(true);
            $rootScope.$digest();
            httpBackend.flush();

            expect(offlineDbService.getMarker.calls.count()).toBe(2);
            categories.forEach(function (category) {
                expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
                expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "lastEventUuid", [202020]);
                expect(offlineDbService.insertMarker.calls.count()).toBe(1);
            });
            expect(eventLogService.getDataForUrl.calls.count()).toBe(0);
            expect(eventLogService.getEventsFor.calls.count()).toBe(0);
            responsePatient.person.attributes[0].value = "attributeName";
            responsePatient.person.attributes[0].hydratedObject = "attributeValueUuid";
            responsePatient.identifiers = mappedIdentifiers;

            expect(offlineDbService.createPatient).toHaveBeenCalledWith({patient: responsePatient});
        });


        it('should insert log in case of error in response and should stop syncing further', function () {
            var categories = [
                'offline-concepts'
            ];

            spyOn(offlineService, 'getItem').and.returnValue(categories);
            spyOn(offlineDbService, 'getMarker').and.callThrough();
            spyOn(eventLogService, 'getEventsFor').and.callThrough();

            spyOn($rootScope, '$broadcast');
            spyOn(eventLogService, 'getDataForUrl').and.callFake(function () {
                return $http.get("some url");
            });
            spyOn(loggingService, 'logSyncError').and.callThrough();
            httpBackend.expectGET("some url").respond(500, error_log.data);
            offlineSyncService.sync(true);
            httpBackend.flush();
            $rootScope.$digest();


            expect(offlineDbService.getMarker).toHaveBeenCalled();
            expect(offlineDbService.getMarker.calls.count()).toBe(1);
            expect(eventLogService.getEventsFor).toHaveBeenCalledWith('offline-concepts', {
                markerName: 'offline-concepts',
                filters: [202020]
            });
            expect(eventLogService.getEventsFor.calls.count()).toBe(1);

            expect(loggingService.logSyncError).toHaveBeenCalled();
            expect($rootScope.$broadcast).toHaveBeenCalledWith("schedulerStage", null, true);
        });
    });

    describe('subsequent sync ', function () {
        var $rootScope;
        beforeEach(function () {
            module('bahmni.common.offline');
            module('bahmni.common.domain');
            module(function ($provide) {
                patient = {
                    uuid: 'dataUuid',
                    person: {
                        attributes: [{
                            attributeType: {
                                uuid: "attributeUuid"
                            },
                            voided: false,
                            value: {
                                display: "attributeName",
                                uuid: "attributeValueUuid"
                            }
                        }]
                    },
                    identifiers: [
                        {
                            "display": "Bahmni Id = GAN200076",
                            "uuid": "9cc96aeb-2877-4340-b9fd-abba016a84a3",
                            "identifier": "GAN200076",
                            "identifierSourceUuid": "81f27b48-8792-11e5-ade6-005056b07f03",
                            "identifierType": {
                                "uuid": "81433852-3f10-11e4-adec-0800271c1b75"
                            },
                            "voided": false
                        },
                        {
                            "uuid": "99996aeb-2877-4340-b9fd-abba016a84a3",
                            "identifier": "SecodaryIdentifier",
                            "identifierSourceUuid": "99997b48-8792-11e5-ade6-005056b07f03",
                            "identifierType": {
                                "uuid": "99993852-3f10-11e4-adec-0800271c1b75",
                                "display": "Bahmni Sec Id"
                            },
                            "voided": false
                        }
                    ]
                };
                concept = {
                    uuid: 'dataUuid',
                    data: {},
                    parents: {"parentUuids": []},
                    name: 'concept'
                };
                $provide.value('offlineDbService', {
                    createPatient: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    getMarker: function (category) {
                        return {
                            then: function (callback) {
                                return callback({
                                    markerName: category,
                                    lastReadEventUuid: 'lastReadUuid',
                                    filters: [202020]
                                });
                            }
                        }
                    },
                    insertMarker: function () {
                        return {
                            then: function (callback) {
                                return;
                            }
                        };
                    },
                    getAttributeTypes: function () {
                        return {
                            then: function (callback) {
                                var attributeTypes = {
                                    uuid: 'attributeUuid',
                                    format: 'org.openmrs.Concept'
                                };
                                return callback({data: attributeTypes});
                            }
                        };
                    },
                    insertAddressHierarchy: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    insertConceptAndUpdateHierarchy: function () {
                        return {
                            then: function (callback) {
                                return callback({});
                            }
                        };
                    },
                    getReferenceData: function () {
                        return {
                            then: function (callback) {
                                return callback({
                                    data: [
                                        {
                                            uuid: "81433852-3f10-11e4-adec-0800271c1b75",
                                            primary: true
                                        }, {
                                            uuid: "99993852-3f10-11e4-adec-0800271c1b75",
                                            primary: false
                                        }
                                    ]
                                });
                            }
                        };
                    }
                });
                $provide.value('eventLogService', {
                    getEventsFor: function (category) {
                        return {
                            then: function (callback) {
                                var event = {
                                    object: 'url to get ' + category + ' object',
                                    category: category,
                                    uuid: 'eventuuid'
                                };
                                return callback({
                                    data: {events: [event], pendingEventsCount: 1}
                                });
                            }
                        };
                    }, getAddressEventsFor: function () {
                        return {
                            then: function (callback) {
                                var event = {
                                    object: 'url to get address object',
                                    category: 'addressHierarchy',
                                    uuid: 'eventuuid'
                                };
                                return callback({
                                    data: {events: [event], pendingEventsCount: 1}
                                });
                            }
                        };
                    },
                    getConceptEventsFor: function () {
                        return {
                            then: function (callback) {
                                var conceptEvent = {
                                    object: 'url to get concept object',
                                    category: 'offline-concepts',
                                    uuid: 'eventuuid'
                                };
                                return callback({
                                    data: {events: [conceptEvent], pendingEventsCount: 1}
                                });
                            }
                        };
                    },
                    getDataForUrl: function (url) {
                        return {
                            then: function (callback) {
                                if (_.includes(url, "concept")) {
                                    return callback({data: concept});
                                }
                                return callback({data: patient});
                            }
                        };
                    }
                });
                $provide.value('offlineService', {
                    isAndroidApp: function () {
                        return false;
                    },
                    getItem: function () {
                        return [202020];
                    },
                    setItem: function () {
                    }

                });

                $provide.value('loggingService', {
                    logSyncError: function (errorUrl, status, stackTrace, payload) {
                        return {};
                    }
                });
            });
        });

        beforeEach(inject(['offlineSyncService', 'eventLogService', 'offlineDbService', 'configurationService', '$rootScope', 'loggingService', 'offlineService',
            function (offlineSyncServiceInjected, eventLogServiceInjected, offlineDbServiceInjected, configurationServiceInjected, rootScope, loggingServiceInjected, offlineServiceInjected) {
                offlineSyncService = offlineSyncServiceInjected;
                eventLogService = eventLogServiceInjected;
                offlineDbService = offlineDbServiceInjected;
                configurationService = configurationServiceInjected;
                loggingService = loggingServiceInjected;
                offlineService = offlineServiceInjected;
                $rootScope = rootScope;
            }]));


        it('should read parent events from the last read uuid', function () {

            var categories = [
                'addressHierarchy',
                'parentAddressHierarchy',
                'offline-concepts'
            ];

            spyOn(offlineService, 'getItem').and.returnValue(categories);
            spyOn(offlineDbService, 'getMarker').and.callThrough();
            spyOn(eventLogService, 'getEventsFor').and.callThrough();
            spyOn(eventLogService, 'getDataForUrl').and.callFake(function (url) {
                return {
                    then: function (callback) {
                        return callback({data: {uuid: url}});
                    }
                };
            });
            spyOn(offlineDbService, 'insertMarker').and.callFake(function () {
                return {
                    then: function (callback) {
                        return callback;
                    }
                }
            });
            spyOn(offlineDbService, 'insertAddressHierarchy').and.callThrough();
            spyOn(offlineDbService, 'insertConceptAndUpdateHierarchy').and.callThrough();

            offlineSyncService.sync();
            $rootScope.$digest();

            categories.forEach(function (category) {
                expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
                expect(eventLogService.getEventsFor).toHaveBeenCalledWith(category, {
                    markerName: category,
                    lastReadEventUuid: 'lastReadUuid',
                    filters: [202020]
                });
                var url = 'url to get ' + category + ' object';
                expect(eventLogService.getDataForUrl).toHaveBeenCalledWith(url);
                expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "eventuuid", [202020]);
                expect(offlineDbService.insertMarker.calls.count()).toBe(3);
            });

            expect(offlineDbService.insertAddressHierarchy).toHaveBeenCalledWith({uuid: 'url to get addressHierarchy object'});
            expect(offlineDbService.insertConceptAndUpdateHierarchy).toHaveBeenCalledWith({results: [{uuid: 'url to get offline-concepts object'}]});
            expect(offlineDbService.insertAddressHierarchy).toHaveBeenCalledWith({uuid: 'url to get parentAddressHierarchy object'});
            expect(offlineDbService.insertAddressHierarchy.calls.count()).toBe(2);


            expect(offlineDbService.getMarker).toHaveBeenCalled();
            expect(offlineDbService.getMarker.calls.count()).toBe(6);
        });

        it('should read patient events from the last read uuid for the catchment', function () {
            var categories = [
                'transactionalData'
            ];
            var patientEvent = {
                object: 'patientUrl',
                category: 'patient',
                uuid: 'uuid1'
            };

            var encounterEvent = {
                object: 'encounterUrl',
                category: 'Encounter',
                uuid: 'uuid2'
            };

            var labOrderResultsEvent = {
                object: '/openmrs/ws/rest/v1/bahmnicore/labOrderResults?patientUuid=5e94e7cb-e9fe-4763-e9ea-217bdaa85029',
                category: 'LabOrderResults',
                uuid: 'uuid3'
            };

            var marker = {markerName: 'transactionalData', filters: [202020]};

            spyOn(offlineService, 'getItem').and.returnValue(categories);
            spyOn(offlineService, 'setItem').and.callThrough();
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callFake(function (category) {
                return {
                    then: function (callback) {
                        if (!marker.lastReadEventUuid)
                            return callback({
                                data: {events: [patientEvent], pendingEventsCount: 1}
                            });
                    }
                }
            });
            spyOn(eventLogService, 'getDataForUrl').and.callFake(function (url) {
                return {
                    then: function (callback) {
                        return callback({data: patient});
                    }
                };
            });
            spyOn(offlineDbService, 'insertMarker').and.callFake(function (name, uuid, filters) {
                marker.lastReadEventUuid = uuid;
                return {lastReadTime: new Date()}
            });
            spyOn(offlineDbService, 'insertAddressHierarchy').and.callThrough();
            spyOn(offlineDbService, 'createPatient').and.callThrough();

            offlineSyncService.sync();
            $rootScope.$digest();

            expect(offlineDbService.getMarker.calls.count()).toBe(3);

            categories.forEach(function (category) {
                expect(offlineDbService.getMarker).toHaveBeenCalledWith(category);
                expect(eventLogService.getEventsFor).toHaveBeenCalledWith(category, {
                    markerName: category,
                    lastReadEventUuid: 'lastReadUuid',
                    filters: [202020]
                });
                expect(eventLogService.getEventsFor.calls.count()).toBe(2);

                expect(offlineDbService.insertMarker).toHaveBeenCalledWith(category, "uuid1", [202020]);
                expect(offlineDbService.insertMarker.calls.count()).toBe(1);
            });
            expect(eventLogService.getDataForUrl).toHaveBeenCalledWith(patientEvent.object);
            expect(eventLogService.getDataForUrl.calls.count()).toBe(1);
            expect(offlineDbService.createPatient).toHaveBeenCalledWith({patient: patient});
            expect(offlineDbService.insertAddressHierarchy.calls.count()).toBe(0);
        });

        it('should map patient identifiers data to contain identifierType primary', function () {
            var categories = [
                'transactionalData'
            ];
            var patientEvent = {
                object: 'patientUrl',
                category: 'patient',
                uuid: 'uuid1'
            };

            var identifier = {
                "uuid": "identifer-uuid",
                "identifier": "SecodaryIdentifier",
                "identifierSourceUuid": "identifier-source-uuid",
                "identifierType": {
                    "uuid": "identifier-type-uuid",
                    "display": "Bahmni Sec Id",
                    "retired": true
                },
                "voided": false
            };
            patient.identifiers.push(identifier);

            var marker = {markerName: 'transactionalData', filters: [202020]};

            spyOn(offlineService, 'getItem').and.returnValue(categories);
            spyOn(offlineService, 'setItem').and.callThrough();
            spyOn(offlineDbService, 'getMarker').and.callThrough(function () {
                return {
                    then: function () {
                        return marker;
                    }
                }
            });
            spyOn(eventLogService, 'getEventsFor').and.callFake(function (category) {
                return {
                    then: function (callback) {
                        if (!marker.lastReadEventUuid)
                            return callback({
                                data: {events: [patientEvent], pendingEventsCount: 1}
                            });
                    }
                }
            });
            spyOn(offlineDbService, 'createPatient').and.callThrough();

            offlineSyncService.sync();
            $rootScope.$digest();

            expect(patient.identifiers[0].identifierType.primary).not.toBeUndefined();
            expect(patient.identifiers[0].identifierType.primary).toBeTruthy();
            expect(patient.identifiers[1].identifierType.primary).not.toBeUndefined();
            expect(patient.identifiers[1].identifierType.primary).toBeFalsy();
            expect(patient.identifiers[2].identifierType.primary).not.toBeUndefined();
            expect(patient.identifiers[2].identifierType.primary).toBeFalsy();
        });
    });
});
