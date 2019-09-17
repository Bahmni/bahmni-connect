'use strict';

angular.module('bahmni.common.conceptSet')
    .factory('formService', ['$q', 'offlineDbService', 'offlineService', 'androidDbService',
        function ($q, offlineDbService, offlineService, androidDbService) {
            if (offlineService.isAndroidApp()) {
                offlineDbService = androidDbService;
            }

            var _filterLatest = function (forms) {
                var allForms = _.groupBy(forms, "name");
                var latestForms = [];
                if (!_.isEmpty(allForms)) {
                    for (var formName in allForms) {
                        latestForms.push(allForms[formName].reduce(function (max, current) {
                            return parseInt(current.version) > parseInt(max.version) ? current : max;
                        }));
                    }
                }
                return latestForms;
            };

            var replace = function (replaceBy, latestForms) {
                _.each(latestForms, function (latestForm) {
                    if (latestForm.name === replaceBy.name) {
                        latestForm.uuid = replaceBy.uuid;
                        latestForm.version = replaceBy.version;
                    }
                });
            };

            var _mergeForms = function (formList, latestForms, formNameWithVersion) {
                _.each(formList, function (form) {
                    if (_.includes(formNameWithVersion, form.name + "." + form.version)) {
                        replace(form, latestForms);
                    }
                });
                return latestForms;
            };

            var getFormList = function (encounterUuid) {
                var deferred = $q.defer();
                offlineDbService.getAllForms().then(function (formList) {
                    var latestForms = _filterLatest(formList);
                    if (!encounterUuid) {
                        deferred.resolve({data: latestForms});
                    } else {
                        offlineDbService.getEncounterByEncounterUuid(encounterUuid).then(function (encounter) {
                            var formObs = _.filter(encounter.encounter.observations, function (observation) {
                                return observation.formFieldPath;
                            });
                            var groupedObsByFormName = _.groupBy(formObs, function (obs) {
                                return obs.formFieldPath.split('/')[0];
                            });
                            if (_.isEmpty(groupedObsByFormName)) {
                                deferred.resolve({data: latestForms});
                            }
                            deferred.resolve({data: _mergeForms(formList, latestForms, Object.keys(groupedObsByFormName))});
                        });
                    }
                });

                return deferred.promise;
            };

            var getFormDetail = function (formUuid) {
                var deferred = $q.defer();
                offlineDbService.getFormByUuid(formUuid).then(function (result) {
                    return deferred.resolve({data: result});
                });
                return deferred.promise;
            };

            var getAllForms = function () {
                return offlineDbService.getAllForms().then(function (forms) {
                    return {data: forms};
                });
            };

            var getFormTranslations = function () {
                return $q.when([]);
            };

            return {
                getFormList: getFormList,
                getFormDetail: getFormDetail,
                getAllForms: getAllForms,
                getFormTranslations: getFormTranslations
            };
        }]);
