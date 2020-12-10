"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
  "$scope",
  "offlineDbService",
  "offlineService",
  "selectiveSchedulerService",
  "eventQueue",
  "spinner",
  "$q",
  "ngDialog",
  "$window",
  function (
    $scope,
    offlineDbService,
    offlineService,
    selectiveSchedulerService,
    eventQueue,
    spinner,
    $q,
    ngDialog,
    $window
  ) {
    $scope.isOfflineApp = offlineService.isOfflineApp();

    var init = function () {
      if ($scope.isOfflineApp) {
        setWatchersForErrorStatus();
      }
    };

    $scope.state = {
      sync_stratergy: "selective",
      showValidationError: false,
      isDataAvailable: false,
    };

    $scope.validationError = function (levelKey) {
      return `** Please Select Atleast One Filter**`;
    };

    $scope.selecteLevelNames = function (level) {
      if ($scope.addressesToFilter.hasOwnProperty(level)) {
        return $scope.addressesToFilter[level]
          .filter((address) => address.selected)
          .map((prov) => prov.name);
      }
    };

    $scope.getLevel = function (levelKey) {
      let levelKeysSplitArray = levelKey.split("_");
      return levelKeysSplitArray[levelKeysSplitArray.length - 1];
    };

    $scope.getLevelName = function (levelKey) {
      return levelKey.slice(0, -2);
    };

    $scope.filterLevels = function (level) {
      let levelIndex = $scope.getLevel(level);
      let targetId = getTargetID(levelIndex, true);
      $scope.verifyLevelHasSelected(level, targetId);
      var selectedParentIds = $scope.addressesToFilter[level]
        .filter((level) => level.selected)
        .map((level) => level.id);
      var indexToMatch = parseInt(levelIndex) + 1;
      for (let key in $scope.addressesToFilter) {
        if ($scope.getLevel(key) == indexToMatch) {
          let tempAddresses = angular.copy($scope.addresses);
          $scope.addressesToFilter[key] = tempAddresses[
            key
          ].filter((levelToFilter) =>
            selectedParentIds.includes(levelToFilter.parentId)
          );
          indexToMatch = indexToMatch + 1;
        }
      }
    };

    $scope.verifyLevelHasSelected = function (level, targetId) {
      let levelIndex = $scope.getLevel(level); // 0,1,2...
      let selectedLevelLength = $scope.addressesToFilter[level].filter(
        (hierarchyLevel) => hierarchyLevel.selected
      ).length;
      if (levelIndex == 0 && selectedLevelLength == 0) {
        $scope.idsToShow = [];
        $scope.idsToShow.push(getTargetID(levelIndex, false));
      } else if (levelIndex != 0 && selectedLevelLength == 0) {
        let indexToMatch = parseInt(levelIndex) + 1;
        for (let key in $scope.addressesToFilter) {
          if (key.includes(indexToMatch)) {
            $scope.idsToShow = $scope.removeLevelToBeHidden(
              getTargetID(levelIndex, true)
            );
            indexToMatch = indexToMatch + 1;
          }
        }
      } else {
        $scope.idsToShow.push(targetId);
      }
    };

    let getTargetID = function (levelIndex, next) {
      let targetToToggle = next ? parseInt(levelIndex) + 1 : levelIndex;
      targetToToggle += "-block";
      let targetId = "#" + targetToToggle;
      return targetId;
    };

    $scope.removeLevelToBeHidden = function (value) {
      return $scope.idsToShow.filter(function (ele) {
        return ele != value;
      });
    };

    $scope.openDropDown = function (dropDownId) {
      let targetClass =
        "." +
        $scope
          .getLevelName(dropDownId)
          .replace(/[^\w\s]/gi, "-")
          .replaceAll(" ", "-") +
        "-list";
      $(targetClass).slideToggle("fast");
    };

    $scope.replaceSpecialCharacters = function (key) {
      return $scope
        .getLevelName(key)
        .replace(/[^\w\s]/gi, "-")
        .replaceAll(" ", "-");
    };

    $scope.loadState = function () {
      $scope.state;
      $scope.addresses;
      $scope.addressesToFilter;
      for (let key in $scope.addressesToFilter) {
        let levelIndex = $scope.getLevel(key);
        let levelId = "#" + levelIndex + "-block";
        if (
          $scope.addressesToFilter[key].filter((x) => x.selected).length > 0 ||
          levelIndex === "0"
        ) {
          $scope.idsToShow.push(levelId);
          $scope.filterLevels(key);
        }
      }
    };

    $scope.display = function (idOfBlock) {
      let temp = "#" + idOfBlock + "-block";
      if ($scope.idsToShow.indexOf(temp) == -1) {
        return false;
      } else {
        return true;
      }
    };

    $scope.isParentSelected = function (key) {
      let parentLevelId = parseInt($scope.getLevel(key)) - 1;
      parentLevelId = parentLevelId >= 0 ? parentLevelId : -1;
      let addressCopy = angular.copy($scope.addressesToFilter);
      if (parentLevelId == -1) {
        return true;
      } else {
        for (key in addressCopy) {
          if (key.includes(parentLevelId)) {
            let selectedLevelLength = addressCopy[key].filter(
              (hierarchyLevel) => hierarchyLevel.selected
            ).length;
            return selectedLevelLength != 0;
          }
        }
      }
    };

    $scope.addresses = {};
    $scope.addressesToFilter = {};
    $scope.idsToShow = [];

    $scope.removeFromSelectedList = function (name, level) {
      let levelDetails = $scope.addressesToFilter[level];
      for (let key in levelDetails) {
        if (levelDetails[key].name === name) {
          levelDetails[key].selected = false;
        }
      }
      $scope.filterLevels(level);
    };
    var cleanUpListenerSchedulerStage = $scope.$on(
      "schedulerStage",
      function (event, stage, restartSync) {
        $scope.isSyncing = stage !== null;
        if (restartSync) {
          selectiveSchedulerService.stopSync();
          selectiveSchedulerService.sync();
        }
      }
    );

    $scope.$on("$destroy", cleanUpListenerSchedulerStage);

    $scope.getStatusStyleCode = function () {
      return (
        $scope.syncStatusMessage &&
        ($scope.syncStatusMessage.match(/.*Success.*/i)
          ? "success"
          : $scope.syncStatusMessage.match(/.*Pending.*/i)
          ? "pending"
          : $scope.syncStatusMessage.match(/.*Failed.*/i)
          ? "fail"
          : "inProgress")
      );
    };

    var getLastSyncTime = function () {
      var date = offlineService.getItem("lastSyncTime");
      var localeDate = Bahmni.Common.Util.DateUtil.parseServerDateToDate(date);
      $scope.lastSyncTime = Bahmni.Common.Util.DateUtil.getDateTimeInSpecifiedFormat(
        localeDate,
        "dddd, MMMM Do YYYY, HH:mm:ss"
      );
    };

    var getErrorCount = function () {
      return eventQueue.getErrorCount().then(function (errorCount) {
        return errorCount;
      });
    };

    var getEventCount = function () {
      return eventQueue.getCount().then(function (eventCount) {
        return eventCount;
      });
    };

    var updateSyncStatusMessageBasedOnQueuesCount = function () {
      getErrorCount().then(function (errorCount) {
        if (errorCount) {
          $scope.syncStatusMessage =
            Bahmni.Common.Constants.syncStatusMessages.syncFailed;
        } else {
          getEventCount().then(function (eventCount) {
            $scope.syncStatusMessage = eventCount
              ? Bahmni.Common.Constants.syncStatusMessages.syncPending
              : updateLastSyncTimeOnSuccessfullSyncAnReturnSuccessMessage();
          });
        }
      });
    };

    var updateLastSyncTimeOnSuccessfullSyncAnReturnSuccessMessage = function () {
      if ($scope.isSyncing !== undefined) {
        offlineService.setItem("lastSyncTime", new Date());
        getLastSyncTime();
      }
      return Bahmni.Common.Constants.syncStatusMessages.syncSuccess;
    };

    var getSyncStatusInfo = function () {
      getLastSyncTime();
      $scope.isSyncing
        ? ($scope.syncStatusMessage = "Sync in Progress...")
        : updateSyncStatusMessageBasedOnQueuesCount();
    };
    getSyncStatusInfo();

    var setErrorStatusOnErrorsInSync = function () {
      offlineDbService.getAllLogs().then(function (errors) {
        $scope.errorsInSync = !!errors.length;
      });
    };

    var setWatchersForErrorStatus = function () {
      $scope.$watch("isSyncing", function () {
        getSyncStatusInfo();
        setErrorStatusOnErrorsInSync();
      });
    };

    var getParentName = function (parentObject, names) {
      if (parentObject != null) {
        names.push(parentObject.userGeneratedId);
        getParentName(parentObject.parent, names);
      }
    };

    $scope.cancelDialog = function () {
      ngDialog.close();
    };

    var setSyncFilterConfigObject = function () {
      let selectedAddresses = angular.copy($scope.addressesToFilter);
      let syncFilterConfigObject = {};
      for (const property in selectedAddresses) {
        syncFilterConfigObject[property] = selectedAddresses[property]
          .filter((address) => address.selected)
          .map((address) => address.userGeneratedId);
      }
      if (Object.values(syncFilterConfigObject).flat().length == 0){
        $scope.state.showValidationError = true;
      }else{
        $scope.state.showValidationError = false;
      }
      $window.localStorage.setItem(
        "syncFilterConfigObject",
        JSON.stringify(syncFilterConfigObject)
      );
      
     
    };

    var setFilterConfig = function () {
      setSyncFilterConfigObject();
      if(!$window.localStorage.getItem("SyncFilterConfig")) {
        $window.localStorage.setItem("SyncFilterConfig", JSON.stringify($scope.apiFilters));
      }
      
      let selectedFilters = Object.values(
        JSON.parse($window.localStorage.getItem('syncFilterConfigObject'))
      );

      let apiFilters = [];

      for (let i = selectedFilters.length - 1; i >= 0; i--) {
        if (apiFilters.length == 0) {
          selectedFilters[i].map((filter) => apiFilters.push(filter));
        }

        for (let j = 0; j < selectedFilters[i].length; j++) {
          if (
            apiFilters.filter((filter) => filter.includes(selectedFilters[i][j])).length == 0
          ) {
            apiFilters.push(selectedFilters[i][j]);
          }
        }
      }

      $scope.apiFilters = apiFilters;

    };

    $scope.showDialog = function () {
      setFilterConfig();
      if($scope.state.showValidationError){
        return;
      }
      
      let categories = offlineService.getItem("eventLogCategories");

      _.forEach(categories, function (category) {
        if (category === "patient" || category === "encounter") {
          offlineDbService.getMarker(category).then(function (marker) {
            offlineDbService.insertMarker(
              marker.markerName,
              marker.lastReadEventUuid,
              $scope.apiFilters
            );
          });
        }
      });
      
      if( $window.localStorage.getItem("SyncFilterConfig") && $window.localStorage.getItem("SyncFilterConfig") != "undefined"){

        $scope.changeSyncFilter =
        JSON.parse($window.localStorage.getItem("SyncFilterConfig")).toString() !== $scope.apiFilters.toString();
      }else{
        $scope.changeSyncFilter = false;
      }
      

      $scope.changeSyncFilter
        ? ngDialog.open({
            template: "views/deleteSyncDataConfirm.html",
            class: "ngdialog-theme-default",
            closeByEscape: true,
            closeByDocument: false,
            showClose: true,
            scope: $scope,
          })
        : $scope.startSync();
    };

    $scope.startSync = function () {
      ngDialog.close();
      
      $window.localStorage.setItem('SyncFilterConfig', JSON.stringify($scope.apiFilters));
      selectiveSchedulerService.sync(
        Bahmni.Common.Constants.syncButtonConfiguration,
        $scope.changeSyncFilter
      );
    };

    $scope.populateList = function () {
      offlineDbService.getAddressesHeirarchyLevels().then(function (levels) {
        levels.forEach(function (level, index) {
          offlineDbService
            .getAllAddressesByLevelId(level.addressHierarchyLevelId)
            .then(function (address) {
              // $scope.addresses[`level_${index}`] = address;
              $scope.addresses[`${level.name}_${index}`] = address.sort(
                function (a, b) {
                  return a.name.localeCompare(b.name);
                }
              );
              $scope.addressesToFilter[`${level.name}_${index}`] = address;
              $scope.updateSelectedItems(`${level.name}_${index}`);
              $scope.loadState();
            });
        });
      });
    };

    $scope.updateSelectedItems = function (level) {
      let syncFilterConfigObject = JSON.parse(
        $window.localStorage.getItem("syncFilterConfigObject")
      );
      if (syncFilterConfigObject !== null) {
          $scope.addressesToFilter[level].forEach((element) => {
            if (syncFilterConfigObject[level].includes(element.userGeneratedId)) {
              element.selected = true;
            }
          });
      }
    };

    return spinner.forPromise($q.all(init()));
  },
]);
