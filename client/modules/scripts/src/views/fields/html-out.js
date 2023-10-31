// vim: ts=4 sw=4 sts=4 sr et:
define('scripts:views/fields/html-out', [ 'views/fields/base', 'lib!Datatables', 'lib!Xlsx'], function (Dep, Datatables, Xlsx) {
    return Dep.extend({

        detailTemplate: 'scripts:fields/htmlOut/detail',
        editTemplate: 'scripts:fields/htmlOut/edit',

        setup: function () {
            Dep.prototype.setup.call(this);

            window.espo_html_out_open = function() {
                var html = this.$htmlout.html();
                if (html != '') {
                    this.$htmlcontainer.css("display", "block");
                    window.result_open = true;
                }
            }.bind(this);

            console.log(this.$htmlclose);
            console.log(this.$htmlresult);

        },

        data: function() {
           var d = Dep.prototype.data.call(this);
           return d;
        },

        afterRender: function () {
	        Dep.prototype.afterRender.call(this);

            this.initHtmlElements();

            if (!this.$htmlclose.attr('has-onclick')) {
                this.$htmlclose.on('click', function() { this.closeHtml(); }.bind(this));
                this.$htmlclose.attr('has-onclick','yes');
            }
            if (!this.$htmlresult.attr('has-onclick')) {
                this.$htmlresult.on('click', function() { this.openHtml(); }.bind(this));
                this.$htmlresult.attr('has-onclick', 'yes');
            }

            if (window.result_open != undefined) {
                if (window.result_open) {
                    this.$htmlcontainer.css('display', 'block');
                }
            }
        },

        initHtmlElements: function() {
            this.$htmlcontainer = this.$el.find('> .htmlcontainer');
            this.$htmlout = this.$el.find('> .htmlcontainer .htmlout');
            this.$htmlclose = this.$el.find('> .htmlcontainer .htmltitle .htmlclose');
            this.$htmlresult = this.$el.find('> .htmlresult');
        },

        openHtml: function() {
            if (window.espo_script !== undefined) {
                window.espo_script.uitvoerenIfChanged(); 
            }
            this.$htmlcontainer.css('display', 'block');
            window.result_open = true;
        },

        closeHtml: function() {
            this.$htmlcontainer.css('display', 'none');
            window.result_open = false;
        },
    });
});
