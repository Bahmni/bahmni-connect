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

  let idsToShow = [];

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

  describe("$scope.isParentSelected", function () {
    it("should return true if we pass first level to isParentSelected", function () {
      scopeMock.addressesToFilter = {};
      scopeMock.addresses = addresses;
      scopeMock.idsToShow = idsToShow;
      
      expect(scopeMock.isParentSelected("Level_1_0")).toBe(true);
    });
  });

  describe("$scope.isParentSelected", function () {
    it("should return false if we pass second level to isParentSelected and it's parent is not selected", function () {
      scopeMock.addressesToFilter = {
        Level_1_0: [
          {
            id: 5608,
            levelId: 3,
            name: "AndhraPradesh",
            parentId: null,
            userGeneratedId: null,
            selected: false,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
          }
        ],
        Level_1: [
          {
            id: 5609,
            levelId: 4,
            name: "Guntur",
            parentId: 5608,
            userGeneratedId: null,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c4",
          }
        ]
      };
      scopeMock.addresses = addresses;
      expect(scopeMock.isParentSelected("Level_1_1")).toBe(false);
    });
  });

  describe("$scope.isParentSelected", function () {
    it("should return true if we pass second level to isParentSelected and it's parent is not selected", function () {
      scopeMock.addressesToFilter = {
        Level_1_0: [
          {
            id: 5608,
            levelId: 3,
            name: "AndhraPradesh",
            parentId: null,
            userGeneratedId: null,
            selected: true,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
          }
        ],
        Level_1: [
          {
            id: 5609,
            levelId: 4,
            name: "Guntur",
            parentId: 5608,
            userGeneratedId: null,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c4",
          }
        ]
      };
      scopeMock.addresses = addresses;
      expect(scopeMock.isParentSelected("Level_1_1")).toBe(true);
    });
  });

  describe("$scope.removeLevelToBeHidden", function () {
    it("should not remove if pased level not available in idsToShow Array", function () {
      scopeMock.addressesToFilter = {};
      scopeMock.addresses = addresses;
      scopeMock.idsToShow = ["1_block","0_block"];
      scopeMock.removeLevelToBeHidden("2_block");
      expect(scopeMock.idsToShow.length).toBe(2);
    });
  });

  describe("$scope.getLevelName", function () {
    it("should send levelName for passed key", function () {
      expect(scopeMock.getLevelName("Level_0")).toBe("Level");
    });
  });

  describe("$scope.display", function () {
    it("should return false if passed div block in not in idsToShow method", function () {
      scopeMock.idsToShow = idsToShow;
      expect(scopeMock.display("#1-block")).toBe(false);
    });
  });

  describe("$scope.display", function () {
    it("should return true if passed div block in present in idsToShow method", function () {
      scopeMock.idsToShow = idsToShow;
      expect(scopeMock.display("#1-block")).toBe(false);
    });
  });

  describe("$scope.verifyLevelHasSelected", function () {
    it("should remove childrens from idsToShow when parent level not selected", function () {
      scopeMock.addressesToFilter = {
        Level_0: [
          {
            id: 5608,
            levelId: 3,
            name: "AndhraPradesh",
            parentId: null,
            userGeneratedId: null,
            selected: true,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
          }
        ],
        Level_1: [
          {
            id: 5609,
            levelId: 4,
            name: "Guntur",
            parentId: 5608,
            userGeneratedId: null,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c4",
          }
        ],
        Level_2: [
          {
            id: 5610,
            levelId: 5,
            name: "Etukuru",
            parentId: 5608,
            userGeneratedId: null,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c5",
          }
        ]
      };
      scopeMock.addresses = scopeMock.addressesToFilter;
      scopeMock.idsToShow = idsToShow;
      scopeMock.verifyLevelHasSelected("Level_1","#1-block");
    });
  });

  describe("$scope.removeFromSelectedList", function () {
    it("should remove unselected location from addressToFilter", function () {
      scopeMock.addressesToFilter = {
        Level_0: [
          {
            id: 5608,
            levelId: 3,
            name: "AndhraPradesh",
            parentId: null,
            userGeneratedId: null,
            selected: true,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
          }
        ]
      };
      scopeMock.addresses = addresses;
      scopeMock.removeFromSelectedList("AndhraPradesh","Level_0")
      expect(scopeMock.addressesToFilter["Level_0"][0].selected).toBe(false);
    });
  });

  describe("$scope.setSyncFilterConfigObject", function () {
    it("should set syncFilterConfigObject", function () {
      scopeMock.addressesToFilter = {
        Level_0: [
          {
            id: 5608,
            levelId: 3,
            name: "AndhraPradesh[2]",
            parentId: null,
            userGeneratedId: "02",
            selected: true,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
          }
        ]
      };
      scopeMock.addresses = addresses;
      scopeMock.showDialog();
      expect(window.localStorage.getItem("syncFilterConfigObject")).toBe('{"Level_0":["02"]}');
    });
  });

  describe("$scope.filterSelectedItems", function () {
    it("should filter selectedItems", function () {
      scopeMock.addressesToFilter = {
        Level_0: [
          {
            id: 5608,
            levelId: 3,
            name: "AndhraPradesh[2]",
            parentId: null,
            userGeneratedId: "02",
            selected: true,
            uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3",
          }
        ]
      };
      scopeMock.addresses = addresses;
      window.localStorage.setItem("syncFilterConfigObject",'{"Level_0":["02"]}');
      scopeMock.idsToShow = idsToShow;
      scopeMock.filterSelectedItems();
    });
  });

});
