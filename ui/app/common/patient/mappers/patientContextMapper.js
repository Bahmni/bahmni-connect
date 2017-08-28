'use strict';

Bahmni.PatientContextMapper = function () {
    this.map = function (patient, personAttributeTypes, allAttributeTypes, extraIdentifierTypes) {
        var patientContext = {};
        patientContext.uuid = patient.uuid;
        patientContext.givenName = patient.person.names[0].givenName;
        var familyName = patient.person.names[0].familyName;
        patientContext.familyName = familyName ? familyName : "";
        patientContext.middleName = patient.person.names[0].middleName;
        patientContext.gender = patient.person.gender;
        if (patient.identifiers) {
            var primaryIdentifier = patient.identifiers[0].primaryIdentifier;
            patientContext.identifier = primaryIdentifier ? primaryIdentifier : patient.identifiers[0].identifier;
            var extraIdentifiers = mapExtraIdentifiers(extraIdentifierTypes, patient);
            if (!_.isEmpty(extraIdentifiers)) {
                patientContext.additionalPatientIdentifiers = extraIdentifiers;
            }
        }

        if (patient.person.birthdate) {
            patientContext.birthdate = parseDate(patient.person.birthdate);
        }

        var attributes = mapPatientAttributes(patient, personAttributeTypes, allAttributeTypes);
        if (!_.isEmpty(attributes)) {
            patientContext.personAttributes = attributes;
        }
        return patientContext;
    };

    var parseDate = function (dateStr) {
        if (dateStr) {
            return Bahmni.Common.Util.DateUtil.parse(dateStr.substr(0, 10));
        }
        return dateStr;
    };

    var mapExtraIdentifiers = function (extraIdentifierTypes, patient) {
        var additionalPatientIdentifiers = {};
        var extraIdentifiers = patient.identifiers[0].extraIdentifiers;
        if (!_.isEmpty(extraIdentifiers) && !_.isEmpty(extraIdentifierTypes)) {
            _.each(extraIdentifierTypes, function (extraIdentifierType) {
                if (extraIdentifiers[extraIdentifierType]) {
                    additionalPatientIdentifiers[extraIdentifierType] = extraIdentifiers[extraIdentifierType];
                }
            });
        }
        return additionalPatientIdentifiers;
    };

    var mapPatientAttributes = function (patient, personAttributeTypes, allAttributeTypes) {
        var attributes = {};
        if (!_.isEmpty(personAttributeTypes) && !_.isEmpty(patient.person.attributes)) {
            var attributeTypes = getUuidsOfPersonAttributeTypes(allAttributeTypes, personAttributeTypes);
            _.each(attributeTypes, function (attributeType) {
                _.each(patient.person.attributes, function (attribute) {
                    if (attributeType && attributeType.uuid == attribute.attributeType.uuid) {
                        attributes[attributeType.attributeName] = { "description": attributeType.attributeName, "value": attribute.value};
                        return true;
                    }
                });
            });
        }
        return attributes;
    };

    var getUuidsOfPersonAttributeTypes = function (allAttributeTypes, personAttributeTypes) {
        var attributeTypes = [];
        _.each(personAttributeTypes, function (attributeTypeName) {
            var attributeTypeList = _.filter(allAttributeTypes, { attributeName: attributeTypeName});
            if (!_.isEmpty(attributeTypeList)) {
                attributeTypes.push(attributeTypeList[0]);
            }
        });
        return attributeTypes;
    };
};
