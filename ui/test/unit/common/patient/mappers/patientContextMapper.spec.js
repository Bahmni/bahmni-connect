'use strict';

describe('patient context mapper', function () {
    var patientContextMapper = new Bahmni.PatientContextMapper();
    var patient = {
        "uuid": "8a76aad9-9a2a-4686-de9c-caf0c89bc89c",
        "person": {
            "names": [
                {
                    "givenName": "Test",
                    "middleName": null,
                    "familyName": "Patient"
                }
            ],
            "birthdateEstimated": false,
            "gender": "M",
            "attributes": []
        },
        "identifiers": [{
            "identifierType": {
                "name": "OpenMRS Identification Number",
                "required": false,
                "primary": false
            },
            "preferred": false,
            "identifier": "OS1234",
            "primaryIdentifier": undefined,
            "extraIdentifiers": {"OpenMRS Identification Number": "OS1234"}
        }, {
            "identifierType": {
                "name": "Patient Identifier",
                "required": true,
                "primary": true
            },
            "preferred": true,
            "voided": false,
            "identifier": undefined,
            "primaryIdentifier": undefined,
            "extraIdentifiers": {"OpenMRS Identification Number": "OS1234"}
        }]
    };
    var allAttributeTypes = [
        {
            attributeName: "education",
            attributeTypeId: 0,
            format: "java.lang.String",
            uuid: "attribute-type-uuid"
        },
        {
            attributeName: "class",
            attributeTypeId: 0,
            format: "java.lang.String",
            uuid: "attribute-type-uuid-two"
        }
    ];


    it("should assign identifier if primary identifier is undefined", function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'OS1234'
        };
        expect(patientContextMapper.map(patient)).toEqual(mappedPatient);
    });

    it("should assign primary identifier if it is defined", function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'BDH202048'
        };
        patient.identifiers[0].primaryIdentifier = "BDH202048";
        expect(patientContextMapper.map(patient)).toEqual(mappedPatient);
        patient.identifiers[0].primaryIdentifier = undefined;
    });


    it('should not assign attributes if patient does not have any attributes and attributeTypes are specified in config', function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'OS1234'
        };
        expect(patientContextMapper.map(patient, ["education"], allAttributeTypes)).toEqual(mappedPatient);
    });

    it('should assign attribute value in patient Context if personAttributeTypes are specified in config', function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'OS1234',
            personAttributes : { education : { description : 'education', value : '10' } }
        };
        patient.person.attributes = [{
            attributeType: {
                uuid: "attribute-type-uuid",
                display: "education"
            },
            uuid: "attribute-uuid",
            value: "10",
            voided: false
        }];
        expect(patientContextMapper.map(patient, ["education"], allAttributeTypes)).toEqual(mappedPatient);
    });

    it('should not assign attribute value in patient Context if attribute name is misspelled in config', function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'OS1234'
        };
        patient.person.attributes = [{
            attributeType: {
                uuid: "attribute-type-uuid",
                display: "education"
            },
            uuid: "attribute-uuid",
            value: "10",
            voided: false
        }];
        expect(patientContextMapper.map(patient, ["educatio"], allAttributeTypes)).toEqual(mappedPatient);
    });


    it('should assign extra Identifiers in patient Context if extraIdentifierTypes are specified in config', function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'OS1234',
            additionalPatientIdentifiers : { "OpenMRS Identification Number": "OS1234" }
        };
        expect(patientContextMapper.map(patient, undefined, allAttributeTypes, ["OpenMRS Identification Number"])).toEqual(mappedPatient);
    });

    it('should not assign additionalIdentifiers if patient does not have any extraIdentifiers but extraIdentifierTypes are specified in config', function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'OS1234'
        };
        var patientOne = patient;
        patientOne.identifiers[0].extraIdentifiers = undefined;
        expect(patientContextMapper.map(patientOne, undefined, allAttributeTypes, ["OpenMRS Identification Number"])).toEqual(mappedPatient);
    });

    it('should not assign additionalIdentifiers if patient have extraIdentifiers and identifier type is misspelled in config', function () {
        var mappedPatient = {
            uuid: '8a76aad9-9a2a-4686-de9c-caf0c89bc89c',
            givenName: 'Test',
            familyName: 'Patient',
            middleName: null,
            gender: 'M',
            identifier: 'OS1234'
        };
        var patientOne = patient;
        patientOne.identifiers[0].extraIdentifiers = undefined;
        expect(patientContextMapper.map(patientOne, undefined, allAttributeTypes, ["OpenMRS Identification "])).toEqual(mappedPatient);
    });
});