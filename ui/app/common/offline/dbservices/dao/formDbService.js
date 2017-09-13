'use strict';

angular.module('bahmni.common.offline')
    .service('formDbService', ['$q',
        function ($q) {
            var db;
            var init = function (_db) {
                db = _db;
            };
            var insertForm = function (data) {
                var form = db.getSchema().table('form');
                var row = form.createRow({
                    resources: data.resources,
                    name: data.name,
                    uuid: data.uuid,
                    version: data.version
                });
                return db.insertOrReplace().into(form).values([row]).exec();
            };

            return {
                init: init,
                insertForm: insertForm
            };
        }]);
