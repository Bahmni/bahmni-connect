describe("Observation Mapper", function () {
    var mapper = new Bahmni.Common.Domain.ObservationMapper;
    var conceptDetailObs = {
        concept: {
            name: "Vitals",
            dataType: "N/A",
            set: true,
            shortName: "Vitals",
            uuid: "vitalsUuid"
        },
        abnormal: null,
        groupMembers: [
            {
                uuid: "pulseDataUuid",
                concept: {
                    conceptClass: "Concept Details",
                    dataType: "N/A",
                    name: "Pulse Data",
                    shortName: "Pulse Data",
                    set: true
                },
                abnormal: null,
                groupMembers: [
                    {
                        concept: {
                            conceptClass: "Misc",
                            dataType: "Numeric",
                            name: "Pulse",
                            lowNormal: 72,
                            hiNormal: 72,
                            shortName: "Pulse",
                            set: false,
                            units: "min"
                        },
                        set: true,
                        groupMembers: [],
                        type: "Numeric",
                        value: 73
                    },
                    {
                        concept: {
                            conceptClass: "Abnormal",
                            dataType: "Boolean",
                            name: "Pulse Abnormal",
                            shortName: "Pulse Abnormal",
                            set: false
                        },
                        groupMembers: [],
                        type: "Boolean",
                        value: true
                    }
                ]

            }
        ]
    };

    it("should return flattened concept details obs", function () {

        var expectedConceptDetailsObs = {
            concept: {
                name : "Vitals",
                dataType : "N/A",
                set : true,
                shortName : "Vitals",
                uuid : "vitalsUuid"
            },
            abnormal: null,
            groupMembers: [
                {
                        uuid: "pulseDataUuid",
                    concept: {
                        conceptClass : "Concept Details",
                        dataType : "N/A",
                        name : "Pulse",
                        shortName : "Pulse Data",
                        set : true,
                        units : "min"
                    },
                    abnormal : true,
                    groupMembers : [],
                    hiNormal : 72,
                    lowNormal : 72,
                    isAbnormal : true,
                    units : "min",
                    value : 73,
                    type : "Numeric"
                }
            ]
        };

        var actual = mapper.preProcessObs(conceptDetailObs);
        expect(JSON.stringify(actual)).toBe(JSON.stringify(expectedConceptDetailsObs));
    });


});