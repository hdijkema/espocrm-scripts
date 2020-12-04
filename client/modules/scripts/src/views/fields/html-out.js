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
                //html = html.replace('.', '&#46;');
                if (html != '') {
                    var el = self.$el.find('> .htmlcontainer');
                    el.css("display", "block");
                    window.result_open = true;
                }
            };
        },

        data: function() {
           var d = Dep.prototype.data.call(this);
           console.log(d.value);
           //d.value = this.decodeHtmlEntities(d.value);
           //console.log(d);
           return d;
        },

        //decodeHtmlEntities(encoded_html) {
            //return $("<textarea/>").html(encoded_html).text();
        //},

        afterRender: function () {
	    Dep.prototype.afterRender.call(this);

            //var el = this.$el.find('> .rawhtml');
            //var h = el.html();
            //console.log(h);
	    //var h = this.decodeHtmlEntities(h);

            //var el1 = this.$el.find('> .htmlcontainer .htmlout');
            //console.log('html=' + h);
            //h = h.replace('.', '&#46;');
            //console.log('html=' + h);
	    //el1.html(h);

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
