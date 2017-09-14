'use strict';

angular.module('bahmni.common.offline')
    .service('formDbService', function () {
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

        var getAllForms = function () {
            var form = db.getSchema().table('form');
            return db.select(form.name, form.uuid, form.version)
                .from(form).exec();
        };

        var getFormByUuid = function (uuid) {
            var form = db.getSchema().table('form');
            return db.select().from(form)
                .where(form.uuid.eq(uuid)).exec().then(function (results) {
                    return results[0];
                });
        };

        return {
            init: init,
            insertForm: insertForm,
            getAllForms: getAllForms,
            getFormByUuid: getFormByUuid
        };
    });
