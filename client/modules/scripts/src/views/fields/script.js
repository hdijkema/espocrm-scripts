// vim: ts=4 sw=4 sts=4 sr noet
define('scripts:views/fields/script', 'views/fields/base', function (Dep) {

    return Dep.extend({

        detailTemplate: 'scripts:fields/script/detail',
        editTemplate: 'scripts:fields/script/edit',

        onChooseFile: function(evt, id) {
           let input = event.target;
           if (!input.files[0]) return undefined;
           let file = input.files[0];
           let fr = new FileReader();
           fr.onload = function(evt) { 
              console.log('setting contents of id:' + id);
              $('#' + id).text(evt.target.result); 
           };
           fr.readAsText(file);
        },

        setup: function () {
            Dep.prototype.setup.call(this);

            this.containerId = 'editor-' + Math.floor((Math.random() * 10000) + 1).toString();

            var dt_format = this.getDateTime().dateFormat;
            var dt_week_start = this.getDateTime().weekStart;
			window.espo_script_dt_picker = function(id) {
                var options = {
                    format: dt_format.toLowerCase(),
                    weekStart: dt_week_start,
                    autoclose: true,
                    todayHighlight: true,
                    keyboardNavigation: true,
                    todayBtn: true
                };
			    $('#' + id).datepicker(options);
            };

            window.espo_script_dt_show_picker = function(id) {
                $('#' + id).datepicker('show');
            };

            window.espo_script = this;

            if (this.mode == 'edit' || this.mode == 'detail') {
                this.wait(true);
                Promise.all([
                    new Promise(function (resolve) {
                        Espo.loader.load('lib!client/lib/ace/ace.js', function () {
                            Espo.loader.load('lib!client/lib/ace/mode-javascript.js', function () {
                                resolve();
                            }.bind(this));
                        }.bind(this));
                    }.bind(this))
                ]).then(function () {
                    ace.config.set("basePath", this.getBasePath() + 'client/lib/ace');
                    this.wait(false);
                }.bind(this));
            }

            this.on('remove', function () {
                if (this.editor) {
                    this.editor.destroy();
                }
            }, this);

        },

        decodeHtmlEntities(encoded_html) {
            return $("<textarea/>").html(encoded_html).text();
        },

        getFormula: function() { 
            var data = this.fetch();
            return data[this.name];
        },

        re_par: /^\s*[$]([A-Za-z]+[_])?par_([^=]+)[=](.*)[;]\s*$/,
        parameters: [],

        getInputVal: function(key, type) {
            var element = this.$el;
			var el_par;
			
			if (type == 'enum') {
			    el_par = element.find('select[name="' + key + '"]');
			} else {
			    el_par = element.find('input[name="' + key + '"]');
			}
			//console.log(el_par);
			
            var par_value = el_par.val();
            if (type  == 'bool') {
				if (el_par.is(":checked")) { 
					par_value = true;
				} else {
					par_value = false;
                }
            } else if (type == 'date') {
                par_value = this.getDateTime().fromDisplayDate(par_value);
            } else if (type == 'num') {
                par_value = Number(par_value);
            } else if (type == 'enum') {
                var children = el_par.children();
                var choosen = el_par.children("option:selected").val();
                par_value = [];
                par_value.push(choosen);
                children.each(function(i) {
                    var val = $(this).val();
                    if (val != choosen) {
                        par_value.push(val);
                    }
                });
            } else if (type == 'csvfile') {
                console.log('getting value for csvfile');
                el_par = $('#' + key);
                par_value = "'" + el_par.text().replaceAll('\n', '\\n').replaceAll('\'', '\\\'') + "'";
            }
            return par_value;
        },

        isChanged: function() {
            var parameters = this.parameters;
            var chg = false;
            var self = this;
            parameters.forEach(function(par) {
                var v = self.getInputVal(par.key, par.type);
                if (v != par.value) {
                   chg = true;
                }
            });
            return chg;
        },

		uitvoerenSave: function () {
            var data = this.fetch();

            var self = this;
            var model = this.model;
            var prev = this.initialAttributes;

            model.set(data, {silent: true});
            data = model.attributes;

            var attrs = false;
            for (var attr in data) {
                if (_.isEqual(prev[attr], data[attr])) {
                    continue;
                }
                (attrs || (attrs = {}))[attr] =    data[attr];
            }

            if (!attrs) {
                this.inlineEditClose();
                return;
            }

            if (this.validate()) {
                this.notify('Not valid', 'error');
                model.set(prev, {silent: true});
                return;
            }

            this.notify('Bezig uit te voeren...');
            model.save(attrs, {
                success: function () {
                    self.trigger('after:save');
                    model.trigger('after:save');
                    self.notify('Klaar, bekijk resultaat', 'success');
                    if (window.espo_html_out_open != undefined) {
                       window.espo_html_out_open();
                    }  
                },
                error: function () {
                    self.notify('Error occured', 'error');
                    model.set(prev, {silent: true});
                    self.render()
                },
                patch: true
            });
            this.inlineEditClose(true);
        },


        uitvoeren: function() {
            this.initialAttributes = this.model.getClonedAttributes();

            var parameters = this.parameters;
            var formula = this.getFormula();

            var element = this.$el;
  
            var self = this;

            parameters.forEach(function(par) {
                par.value = self.getInputVal(par.key, par.type);

                var par_re = "\\s*par_" + par.key + "\\s*=.*[;]";
                var re = new RegExp(par_re);
                var expr = 'par_' + par.key + '=';

                if (par.type == 'string') { 
                   expr += "'" + par.value.replace("'", "\\'") + "'";
                } else if (par.type == 'bool') {
                   expr += (par.value) ? 'true' : 'false';
                } else if (par.type == 'date') {
                   expr += "'" + par.value + "'";
				} else if (par.type == 'enum') {
				   var e = "list(";
				   var comma = "";
				   par.value.forEach(function(elem) {
				       e = e + comma + "'" + elem.replace("'", "\\'") + "'";
				       comma = ", ";
				   });
				   e += ')';
				   expr += e;
				} else {
                   expr += par.value;
                }
                expr += ';';

                formula = formula.replace(re, expr);
            });

            var exec_date_time = new Date();
            var re = new RegExp('[/][/](exec)?[ ]+last execution:.*');
            formula = formula.replace(re, '');
            while (formula.startsWith('\n')) { formula = formula.substr(1); }
            formula = '//exec  last execution: ' + exec_date_time + '\n\n' + formula;

            this.$element.val(formula);
            this.uitvoerenSave();
        },

        uitvoerenIfChanged: function() {
            if (this.isChanged()) {
               this.uitvoeren();
            }
        },

        data: function() {
            var data = Dep.prototype.data.call(this);
            data.containerId = this.containerId;
            return data;
        },

        fetch: function() {
            if (this.mode == 'edit') {
            	var data = {};
            	data[this.name] = this.editor.getValue()
            	return data;
            } else {
                return Dep.prototype.fetch.call(this);
            }
        },

        afterRenderEdit: function() {
            this.$editor = this.$el.find('#' + this.containerId);
            this.$editor.css("min-height", "400px");
            var editor = this.editor = ace.edit(this.containerId);

            if (this.isEditMode()) {
                editor.getSession().on('change', function () {
                    this.trigger('change', {ui: true});
                }.bind(this));
            }

            editor.setShowPrintMargin(false);
            editor.getSession().setUseWorker(false);

            var JavaScriptMode = ace.require("ace/mode/javascript").Mode;
            editor.session.setMode(new JavaScriptMode());
        },

        afterRender: function () {
			Dep.prototype.afterRender.call(this);

			if (this.mode == 'edit') { 
				this.afterRenderEdit();
				return; 
			}

			this.initElement();

			var element = this.$el.find('> .execformula');
			//console.log(element);

			var form_txt = this.getFormula();
			//console.log(form_txt);

			var parameters = [];
   
			var form_lines = form_txt.split(/\r?\n/);
			var matches = [];
			var re_par = this.re_par;
			form_lines.forEach(function(line) {
				//console.log("line:"+line);
				var match = line.match(re_par);
				if (match) {
					var obj = {
						all: match[0],
						key: match[2],
						type: match[1],
						value: match[3]
					};
                   	matches.push(obj); // [match[0], match[1], match[2]]);
				}
			}); 
			//console.log(matches);
			matches.forEach(function(m) { 
				var key = m.key.trim();
				var value = m.value.trim();
				var type = (m.type === undefined) ? '' : m.type.trim();
                if (type.length > 0) { type = type.slice(0, -1); }

				if (type == '') {
					type = 'num';
					if (value.substr(0, 1) == '"' || value.substr(0, 1) == "'") {
						type = 'string';
						value = value.substr(1);
						if (value.substr(-1, 1) == '"' || value.substr(-1, 1) == "'") {
							value = value.substr(0, value.length - 1);
						}
					} else if (value == 'true' || value == 'false') {
						type = 'bool';
						value = (value == 'true') ? true : false;
					} else if (value.substr(0, 4) == 'list') {
					    type = 'enum';
					    value = value.substr(4);
					    value = value.replace(/^\s*[(]/, '');
					    if (value.substr(-1, 1) == ')') { value = value.substr(0, value.length - 1); }
					    value = value.trim();
					    var elems = value.split(/[ ,]+/);
					    value = [];
					    elems.forEach(function(elem) {
					        elem = elem.trim().replace(/^["']/, '').replace(/['"]$/, '');
					        value.push(elem);
					    });
					    //console.log(value);
					}
				} else if (type == 'date') {
                    value = value.substr(1);
					if (value.substr(-1, 1) == '"' || value.substr(-1, 1) == "'") {
						value = value.substr(0, value.length - 1);
					}
				} else if (type == 'csvfile') {
                    value = value.substr(1);
					if (value.substr(-1, 1) == '"' || value.substr(-1, 1) == "'") {
						value = value.substr(0, value.length - 1);
					}
                    //console.log('Type file detected: key=' + key + ', value=' + value);
                } else {
                   console.log('UNKNOWN TYPE: ' + type + ', key=' + key + ', value=' + value);
                }
                
				var par = { type: type, key: key, value: value };
				parameters.push(par);
			});
			this.parameters = parameters;
			//console.log(parameters);

			var el_pars = element.find('.pars');
			//console.log(el_pars);
            var dt_id = 0;

			var html = '<table style="width:100%;">';
            var me = this;
			parameters.forEach(function(par) {
				html += '<tr>';
				html += '<td style="padding-right: 5px;">' + par.key.replace(/_/g, ' ') + ':' + '</td>';
				html += '<td style="padding-right: 5px;">';
				if (par.type == 'num') {
					html += '<input class="main-element form-control" type="number" name="' + par.key + '" value="' + par.value + '"/>';
				} else if (par.type == 'bool') {
					var checked = (par.value) ? 'checked' : '';
					html += '<input class="main-element" type="checkbox" name="' + par.key + '" ' + checked + ' />';
				} else if (par.type == 'date') {
                    dt_id += 1;
					var dt = me.getDateTime().toDisplayDate(par.value);
                    html += '<div class="field">';
                    html += '<div class="input-group">';
					html += '<input class="main-element form-control" id="dt_' + dt_id + '" type="text" name="' + par.key + '" value="' + dt + '"/>';
                    html += '<span class="input-group-btn">';
					html += '<button type="button" class="btn btn-default btn-icon date-picker-btn" tabindex="-1" onclick="window.espo_script_dt_show_picker(\'dt_' + dt_id + '\');" >';
                    html += '<i class="far fa-calendar"></i>'
                    html += '</button>';
                    html += '</span>';
                    html += '</div>';
                    html += '</div>';
                    html += '<script>window.espo_script_dt_picker("dt_' + dt_id + '");</script>';
				} else if (par.type == 'enum') { 
				    var def_value = '';
				    if (par.value.length > 0) { def_value = par.value[0]; }
				    par.value = par.value.sort();
				    html += '<div class="field">';
				    html += '<select name="' + par.key + '" class="form-control main-element" >';
				    par.value.forEach(function(elem) {
				        var selected = '';
				        if (elem == def_value) { selected = 'selected="selected"'; }
				        html += '<option value="' + elem + '" ' + selected + '>' + elem + '</option>';
				    });
				    html += '</select>';
				    html += '</div>';
                } else if (par.type == 'csvfile') {
                    html += '<input class="main-element form-control" type="file" name=file_"' + par.key + '" accept=".csv" ' +
                            'onchange="window.espo_script.onChooseFile(event, \'' + par.key + '\');" />';
                    html += '<textarea style="display:none" id=' + par.key + '></textarea>';
			    } else {
					html += '<input class="main-element form-control" type="text" name="' + par.key + '" value="' + par.value + '"/>';
				}
				html += '</td>';
				html += '</tr>';
			});
			html += '</table>';
			el_pars.html(html);
			//console.log(el_pars.html());

			var el_button = element.find('.formula');
			var me = this;
			el_button.click(function() { me.uitvoeren(); });
		},
	});
});

