define('scripts:views/fields/html-out', [ 'views/fields/base', 'lib!Datatables'], function (Dep, Datatables) {

    return Dep.extend({

        detailTemplate: 'scripts:fields/htmlOut/detail',
        editTemplate: 'scripts:fields/htmlOut/edit',

        setup: function () {
            Dep.prototype.setup.call(this);

            var self = this;
            window.espo_html_out_open = function() {
                var el1 = self.$el.find('> .htmlcontainer .htmlout');
                var html = el1.html();
                if (html != '') {
                    var el = self.$el.find('> .htmlcontainer');
                    el.css("display", "block");
                    window.result_open = true;
                }
            };
        },

        decodeHtmlEntities(encoded_html) {
            return $("<textarea/>").html(encoded_html).text();
        },

        afterRender: function () {
	    Dep.prototype.afterRender.call(this);

            var el = this.$el.find('> .rawhtml');
	    var h = this.decodeHtmlEntities(el.html());

            var el1 = this.$el.find('> .htmlcontainer .htmlout');
	    el1.html(h);

            console.log('window.result_open = ' + window.result_open);

            var el2 = this.$el.find('> .htmlcontainer');
            if (window.result_open != undefined) {
               if (window.result_open) {
                  el2.css("display", "block");
               }
            }

        },
    });
});
