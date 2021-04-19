
'use strict';

angular.module('syncdatarules')
    .service('selectiveSchedulerService', ['offlineService', 'selectiveSyncService',
        function (offlineService, selectiveSyncService) {
            this.jobs = [];
            this.sync = function (config, deletePatientAndEncounters) {
                if (offlineService.isChromeApp() || offlineService.isAndroidApp() || offlineService.isOfflineApp()) {
                    var job = selectiveSyncService(config, deletePatientAndEncounters);
                    this.jobs.push(job);
                }
            };
            this.stopSync = function () {
                if (offlineService.isChromeApp() || offlineService.isAndroidApp()) {
                    _.each(this.jobs, function (job) {
                        job.stop();
                    });
                }
            };
        }
    ]);
