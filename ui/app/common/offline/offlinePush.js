'use strict';

angular.module('bahmni.common.offline')
    .factory('offlinePush', ['offlineService', 'eventQueue', '$http', 'offlineDbService', 'androidDbService', '$q', 'loggingService', 'messagingService',
        function (offlineService, eventQueue, $http, offlineDbService, androidDbService, $q, loggingService, messagingService) {
            return function () {
                var releaseReservedEvents = function (reservedEvents) {
                    var promises = [];
                    _.each(reservedEvents, function (event) {
                        if (event.state === "reserved") {
                            promises.push(eventQueue.releaseFromQueue(event));
                        }
                    });
                    return promises;
                };

                var getAllDbPromises = function () {
                    var dbPromises = [];
                    var dbNames = offlineDbService.getDbNames();
                    _.each(dbNames, function (dbName) {
                        dbPromises.push(offlineDbService.initSchema(dbName));
                    });
                    return dbPromises;
                };

                var consumeFromEventQueue = function () {
                    return eventQueue.consumeFromEventQueue().then(function (event) {
                        if (!event) {
                            deferred.resolve();
                            return;
                        }
                        else {
                            return processEvent(event, dbs[event.data.dbName]);
                        }
                    });
                };

                var consumeFromErrorQueue = function () {
                    return eventQueue.consumeFromErrorQueue().then(function (event) {
                        if (!event) {
                            return;
                        }
                        else {
                            return processEvent(event, dbs[event.data.dbName]);
                        }
                    });
                };

                var postData = function (event, response) {
                    if (response == undefined) {
                        eventQueue.releaseFromQueue(event);
                        return consumeFromEventQueue();
                    }
                    var config = {
                        withCredentials: true,
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }
                    };

                    if (event.data.type && event.data.type == "encounter") {
                        return $http.post(Bahmni.Common.Constants.bahmniEncounterUrl, response.encounter, config);
                    } else if (event.data.type && event.data.type === "Error") {
                        return $http.post(Bahmni.Common.Constants.loggingUrl, angular.toJson(response));
                    } else {
                        response.relationships = [];
                        addToPatientEventsInProgress(event.id);
                        return $http.post(event.data.url, response, config);
                    }
                };

                var addToPatientEventsInProgress = function (id) {
                    var patientEvents = offlineService.getItem("patientEventsInProgress") || [];
                    patientEvents.push(id);
                    offlineService.setItem("patientEventsInProgress", patientEvents);
                };

                var getEventData = function (event, db) {
                    if (event.data.type && event.data.type == "encounter") {
                        return offlineDbService.getEncounterByEncounterUuid(event.data.encounterUuid, db);
                    } else if (event.data.type && event.data.type === "Error") {
                        return offlineDbService.getErrorLogByUuid(event.data.uuid, db);
                    } else {
                        return offlineDbService.getPatientByUuidForPost(event.data.patientUuid, db).then(function (response) {
                            if (event.data.url.indexOf(event.data.patientUuid) == -1) {
                                if (response && response.patient && response.patient.person) {
                                    delete response.patient.person.preferredName;
                                    delete response.patient.person.preferredAddress;
                                }
                            }
                            // mapIdentifiersToPostFormat(response.patient);
                            return response;
                        });
                    }
                };

                var mapIdentifiersToPostFormat = function (patient) {
                    patient.identifiers = _.map(patient.identifiers, function (identifier) {
                        return {
                            identifier: identifier.identifier,
                            identifierPrefix: identifier.identifierPrefix,
                            identifierSourceUuid: identifier.identifierSourceUuid,
                            identifierType: identifier.identifierType && identifier.identifierType.uuid || identifier.identifierType,
                            uuid: identifier.uuid,
                            preferred: identifier.preferred,
                            voided: identifier.voided
                        };
                    });
                };

                var handleHaltedEvent = function (event) {
                    messagingService.hideMessages("error");
                    eventQueue.removeFromQueue(event);
                    removeHaltedEvent(event.id);
                    return event.tube === "event_queue" ? consumeFromEventQueue() : consumeFromErrorQueue();
                };

                var isHaltedPatientEvent = function (event, response) {
                    var patientEvents = offlineService.getItem("patientEventsInProgress") || [];
                    var isPatientSyncHalted = (_.indexOf(patientEvents, event.id) < _.lastIndexOf(patientEvents, event.id));
                    var isPatientAlreadyPosted = response.status == 400 && response.data.error && (response.data.error.detail.indexOf("org.hibernate.NonUniqueObjectException") != -1);
                    return !!(isPatientSyncHalted && isPatientAlreadyPosted);
                };

                var processEvent = function (event, db) {
                    return getEventData(event, db)
                        .then(function (response) {
                            return postData(event, response)
                                .success(function (data) {
                                    if (event.data.type && event.data.type == "encounter") {
                                        return offlineDbService.deleteObsByEncounterUuid(data.encounterUuid).then(function () {
                                            return offlineDbService.createEncounter(data, db).then(function () {
                                                return successCallBack(event);
                                            });
                                        });
                                    }
                                    return successCallBack(event);
                                }).catch(function (response) {
                                    if (event.data.type !== "Error" && (parseInt(response.status / 100) === 5 || parseInt(response.status / 100) === 4)) {
                                        if (isHaltedPatientEvent(event, response)) {
                                            return handleHaltedEvent(event);
                                        }
                                        loggingService.logSyncError(response.config.url, response.status, response.data, response.config.data);
                                    }
                                    if (response.status != -1) {
                                        removeHaltedEvent(event.id);
                                    }
                                    if (parseInt(response.status / 100) === 5 ||
                                        (parseInt(response.status / 100) === 4 && _.indexOf([401, 403, 404], response.status) == -1)) {
                                        if (event.tube === "event_queue") {
                                            eventQueue.removeFromQueue(event);
                                            eventQueue.addToErrorQueue(event.data);
                                            return consumeFromEventQueue();
                                        } else {
                                            reservedEvents.push(event);
                                            return consumeFromErrorQueue();
                                        }
                                    } else {
                                        eventQueue.releaseFromQueue(event);
                                        deferred.resolve();
                                        return "4xx error " + response.status;
                                    }
                                });
                        });
                };

                var removeHaltedEvent = function (id) {
                    var patientEvents = offlineService.getItem("patientEventsInProgress");
                    offlineService.setItem("patientEventsInProgress", _.without(patientEvents, id));
                };

                var successCallBack = function (event) {
                    if (event.data.type === "Error") {
                        offlineDbService.deleteErrorFromErrorLog(event.data.uuid);
                    }
                    eventQueue.removeFromQueue(event).then(function () {
                        removeHaltedEvent(event.id);
                        if (event.tube === "event_queue") {
                            return consumeFromEventQueue();
                        } else {
                            return consumeFromErrorQueue();
                        }
                    });
                };

                var getReservedPatientEvents = function () {
                    var promises = [];
                    var patientEvents = offlineService.getItem("patientEventsInProgress");
                    _.each(_.uniq(patientEvents), function (id) {
                        promises.push(eventQueue.peekFromQueue(id));
                    });
                    return promises;
                };

                var reservedEvents = [];
                var deferred = $q.defer();
                if (!offlineService.isOfflineApp()) {
                    return $q.when();
                }
                if (offlineService.isAndroidApp()) {
                    offlineDbService = androidDbService;
                }

                var dbs = {};
                $q.all(getAllDbPromises()).then(function (allDbs) {
                    _.each(allDbs, function (db) {
                        offlineService.isAndroidApp() ? dbs[db] = db : dbs[db.getSchema().name()] = db;
                    });

                    consumeFromErrorQueue().then(function (response) {
                        $q.all(getReservedPatientEvents()).then(function (events) {
                            reservedEvents = _.union(reservedEvents, (_.without(events, null)));
                            $q.all(releaseReservedEvents(_.uniq(reservedEvents))).then(function () {
                                if (_.isArray(response) && response.indexOf("4xx error") != -1) {
                                    return;
                                }
                                return consumeFromEventQueue();
                            });
                        });
                    });
                });
                return deferred.promise;
            };
        }
    ]);
