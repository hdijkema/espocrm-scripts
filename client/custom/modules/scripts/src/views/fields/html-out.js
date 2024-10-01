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

            this.initTables();

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

	/***********************************************************************************
	* This function is needed to evaluate if we have any output of TableGroup\ToHtmlType.
        * TableGroup\ToHtmlType is part of 'espocrm-hookedformulas' (see GitHub). 
        * So this is a dependency between 'espocrm-scripts' and 'espocrm-hookedformulas'. 
        * This was needed, because as of version 7.2.7 of EspoCRM, the security restrictions
        * for inline scripts have been risen. 
	************************************************************************************/

        initTables: function() {
            let tables = this.$el.find("table");
            let l = tables.length;
            let i;

            for(i = 0; i < l; i++) {
                let table = tables[i];
                if (table.id.startsWith('data_table_id')) {
                   let el = $(table);
                   let _filename = el.attr('filename');
                   let _col_str = atob(el.attr('columns'));
                   let _columns = JSON.parse(_col_str);
                   let _orders_str = atob(el.attr('order'));
                   let _orders = JSON.parse(_orders_str);
                   let _has_widths = parseInt(el.attr('has_widths'));
                   let _page_length = parseInt(el.attr('pagelength'));

                   let _buttons = [ 'copy', 'excel', 'print' ];
                   if (_filename != '') {
                      _buttons = [ { name: 'copy', extend: 'copy' }, 
                                   { name: 'excel', extend: 'excel', filename: _filename, title: null },
                                   { name: 'print', extend: 'print' }
                                 ];
                   }

                   let _auto_width = (_has_widths) ? false : true;

                   let _table_orders = [];
                   _orders.forEach(function(order) {
                       let _to = [ order.index, order.sort ];
                       _table_orders.push(_to);
                   });

                   el.DataTable( {
                      dom: 'Bfrtip',
                      buttons: _buttons,
                      pageLength: _page_length,
                      columns: _columns,
                      autoWidth: _auto_width,
                      order: _table_orders
                   });
                }
            };
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
