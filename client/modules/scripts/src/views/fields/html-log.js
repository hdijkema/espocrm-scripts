define('scripts:views/fields/html-log', 'views/fields/base', function (Dep) {

    return Dep.extend({

        detailTemplate: 'scripts:fields/htmllog/detail',
        editTemplate: 'scripts:fields/htmllog/edit',

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        afterRender: function () {
	    Dep.prototype.afterRender.call(this);
        },
    });
});
