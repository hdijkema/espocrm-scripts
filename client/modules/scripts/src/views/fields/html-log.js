define('scripts:views/fields/html-log', 'views/fields/base', function (Dep) {

    return Dep.extend({

        detailTemplate: 'scripts:fields/htmllog/detail',
        editTemplate: 'scripts:fields/htmllog/edit',

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        decodeHtmlEntities(encoded_html) {
            return $("<textarea/>").html(encoded_html).text();
        },

        afterRender: function () {
	    Dep.prototype.afterRender.call(this);

            var el = this.$el.find('> .rawhtml');
            h = el.html();
	    var h = this.decodeHtmlEntities(el.html());
            h = "<table><tr><th class=\"time\">Tijd</th><th class=\"log\">Log</th></tr>" + h + "</table>";

            var el1 = this.$el.find('> .htmllog');
	    el1.html(h);

        },
    });
});
