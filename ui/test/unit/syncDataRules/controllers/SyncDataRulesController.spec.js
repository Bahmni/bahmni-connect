"use strict";

describe("SyncDataRulesController", function () {
  var $aController, scopeMock, offlineDbServiceMock, offlineServiceMock;
  beforeEach(module("syncdatarules"));

  let addresses = {
    Level_1_0: [
      {
        id: 5608,
        levelId: 3,
        name: "Maharastra",
        parentId: null,
        userGeneratedId: null,
        uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
      },
      {
        id: 5609,
        levelId: 3,
        name: "Telangana",
        parentId: null,
        userGeneratedId: null,
        selected: true,
        uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c4",
      },
      {
        id: 5610,
        levelId: 3,
        name: "Karnataka",
        parentId: null,
        userGeneratedId: null,
        selected: false,
        uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c5",
      },
    ],
    Level_1: [
      {
        id: 7149,
        levelId: 4,
        name: "Bangalore",
        parentId: 5610,
        userGeneratedId: null,
        uuid: "8d79c82c-d6b4-45eb-84df-4b188d981b18",
      },
      {
        id: 7149,
        levelId: 4,
        name: "Hyderabad",
        parentId: 5609,
        userGeneratedId: null,
        uuid: "8d79c82c-d6b4-45eb-84df-4b188d981b18",
      },
      {
        id: 7149,
        levelId: 4,
        name: "Pune",
        parentId: 5608,
        userGeneratedId: null,
        uuid: "8d79c82c-d6b4-45eb-84df-4b188d981b18",
      },
    ],
  };

  beforeEach(function () {
    offlineDbServiceMock = jasmine.createSpyObj("offlineDbService", [
      "getAddressesHeirarchyLevels",
      "getAllAddressesByLevelId",
    ]);
    offlineServiceMock = jasmine.createSpyObj("offlineService", [
      "getItem",
      "isOfflineApp",
    ]);
  });

  beforeEach(inject(function (_$controller_, $rootScope, $q) {
    $aController = _$controller_;
    scopeMock = $rootScope.$new();
    //q = $q;
  }));

  beforeEach(inject([
    "offlineService",
    function (offlineServiceInjected) {
      offlineService = offlineServiceInjected;
    },
  ]));

  beforeEach(function () {
    $aController("SyncDataRulesController", {
      $scope: scopeMock,
      offlineDbService: offlineDbServiceMock,
      offlineService: offlineServiceMock,
    });
  });

  describe("$scope.selecteLevelNames", function () {
    it("should return list of selected level names", function () {
      scopeMock.addressesToFilter = addresses;
      expect(scopeMock.selecteLevelNames("Level_1_0").length).toBe(1);
    });
  });

  // describe("updateSelectedItems", function () {
  //   it("should return list of selected level names", function () {
  //     scopeMock.selectedFilters = "Maharastra";
  //     expect(scopeMock.updateSelectedItems("Level_1_0")[0].selected).toBe(true);
  //   });
  // });

  describe("$scope.filterLevels", function () {
    it("should add items to level data based on selected items in the previous level", function () {
      // spyOn( scopeMock, 'getLevel').and.returnValue(0);
      scopeMock.addressesToFilter = {
        Level_1_0: [
          {
            id: 5608,
            levelId: 3,
            name: "Maharastra",
            parentId: null,
            userGeneratedId: null,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
          },
          {
            id: 5609,
            levelId: 3,
            name: "Telangana_1",
            parentId: null,
            userGeneratedId: null,
            selected: true,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c4",
          },
          {
            id: 5610,
            levelId: 3,
            name: "Karnataka",
            parentId: null,
            userGeneratedId: null,
            selected: false,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c5",
          },
        ],
        Level_1: [],
      };
      scopeMock.addresses = addresses;
      scopeMock.filterLevels("Level_1_0");
      expect(scopeMock.addressesToFilter["Level_1"][0].name).toBe("Hyderabad");
    });
  });
});
