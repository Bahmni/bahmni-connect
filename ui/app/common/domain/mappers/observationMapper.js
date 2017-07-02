'use strict';

Bahmni.Common.Domain.ObservationMapper = function () {
    this.map = function (openMrsObs) {
        var conceptMapper = new Bahmni.Common.Domain.ConceptMapper();
        var groupMembers = openMrsObs.groupMembers || [];
        return {
            uuid: openMrsObs.uuid,
            concept: conceptMapper.map(openMrsObs.concept),
            value: openMrsObs.value,
            voided: openMrsObs.voided,
            voidedReason: openMrsObs.voidedReason,
            observationDateTime: openMrsObs.obsDatetime,
            orderUuid: openMrsObs.orderUuid,
            groupMembers: groupMembers.map(this.map)
        };
    };

    this.preProcessObs = function (obs) {
        if (!obs || !obs.groupMembers) {
            return obs;
        }

        return updateConceptDetailObs(obs);
    };

    var updateConceptDetailObs = function (obs) {
        if (!obs.groupMembers) {
            return;
        }

        _.each(obs.groupMembers, function (childObs) {
            if (childObs.concept && childObs.concept.conceptClass === 'Concept Details') {
                var durationObs = handleDurationObsInConceptDetail(childObs);
                var numericObs = handleNumericObsInConceptDetail(childObs);

                if (numericObs && !durationObs) {
                    childObs.hiNormal = numericObs.hiNormal || numericObs.concept.hiNormal;
                    childObs.lowNormal = numericObs.lowNormal || numericObs.concept.lowNormal;
                    childObs.isAbnormal = numericObs.isAbnormal;
                    childObs.concept.name = numericObs.concept.name;
                    childObs.units = numericObs.units || numericObs.concept.units;
                    childObs.concept.units = numericObs.concept.units;
                    childObs.value = numericObs.value;
                    childObs.type = numericObs.concept.dataType;
                    childObs.abnormal = numericObs.isAbnormal;
                }
                if (durationObs) {
                    childObs.duration = durationObs.value;
                    childObs.value = durationObs.name;
                    childObs.concept.name = childObs.label;
                }
                childObs.groupMembers = [];
            } else updateConceptDetailObs(childObs);
        });

        return obs;
    };

    var handleNumericObsInConceptDetail = function (conceptDetailsObs) {
        var numericObs = _.find(conceptDetailsObs.groupMembers, function (conceptDetailsNumericGroupObs) {
            return conceptDetailsNumericGroupObs.concept.dataType === 'Numeric';
        });

        var abnormalObs = _.find(conceptDetailsObs.groupMembers, function (conceptDetailsAbnormalGroupObs) {
            return conceptDetailsAbnormalGroupObs.concept.conceptClass === 'Abnormal';
        });

        if (abnormalObs) {
            numericObs.isAbnormal = abnormalObs.value;
        }

        return numericObs;
    };

    var handleDurationObsInConceptDetail = function (conceptDetailsObs) {
        var durationObs = _.find(conceptDetailsObs.groupMembers, function (conceptDetailsDurationGroupObs) {
            return conceptDetailsDurationGroupObs.concept.conceptClass === 'Duration';
        });

        var codedObs = _.find(conceptDetailsObs.groupMembers, function (conceptDetailsDurationGroupObs) {
            if (conceptDetailsDurationGroupObs.concept.dataType === 'Coded' && durationObs) {
                durationObs.name = conceptDetailsDurationGroupObs.value.name;
                return conceptDetailsDurationGroupObs;
            }
        });
        if (durationObs) { return durationObs; }
    };
};
