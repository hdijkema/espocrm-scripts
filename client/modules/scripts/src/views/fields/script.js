// vim: ts=4 sw=4 sts=4 sr et:
define('scripts:views/fields/script', 'views/fields/formula', function (Dep) {

    return Dep.extend({

        detailTemplate: 'scripts:fields/script/detail',
        editTemplate: 'scripts:fields/script/edit',

		run_mode: false, 

		isRunMode: function() {
			return this.run_mode;
		},

		setRunning: function(yes) {
			this.run_mode = yes;
		},

        onChooseFile: function(evt, id, msg_id) {
           let input = event.target;
           if (!input.files[0]) return undefined;
           let file = input.files[0];
           let fr = new FileReader();
           fr.onload = function(evt) { 
              console.log('setting contents of id:' + id);
			  var csv = evt.target.result;
              $('#' + id).text(csv); 
			  // Determine separator
              var res = csv.match(/[,;]/g);
              if (res.length == 0) {
                 $('#'+msg_id).html('<span style="color:red;">No separator \',\' or \';\' found, is this a .CSV file?</span>');
              }
           };
           fr.readAsText(file);
        },

        setup: function () {
            Dep.prototype.setup.call(this);

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
                par_value = "'" + el_par.text().replaceAll('\n', '\\n').replaceAll('\r', '').replaceAll('\'', '\\\'') + "'";
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
			this.setRunning(true);	

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
				this.setRunning(false);
                return;
            }

            if (this.validate()) {
                this.notify('Not valid', 'error');
                model.set(prev, {silent: true});
				this.setRunning(false);
                return;
            }

            this.notify('Bezig uit te voeren...');
            model.save(attrs, {
                success: function () {
					self.setRunning(false);
                    self.trigger('after:save');
                    model.trigger('after:save');
                    self.notify('Klaar, bekijk resultaat', 'success');
                    if (window.espo_html_out_open != undefined) {
                       window.espo_html_out_open();
                    }  
                },
                error: function () {
					self.setRunning(false);
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
			if (this.isEditMode()) {
				return Dep.prototype.fetch.call(this);
			} else if (this.isRunMode()) {
				var data = {};
				data[this.name] = this.$element.val();
				return data;
            } else {
				var data = {};
				data[this.name] = Dep.prototype.getValueForDisplay.call(this);
				return data;
            }
        },

        afterRender: function () {
			Dep.prototype.afterRender.call(this);

			if (this.isEditMode()) {
				this.editor.setOption('maxLines', 40); 
			}

			this.initElement();

			var element = this.$el.find('> .execformula');
			var form_txt = this.getFormula();

			var parameters = [];
   
			var form_lines = form_txt.split(/\r?\n/);
			var matches = [];
			var re_par = this.re_par;
			form_lines.forEach(function(line) {
				var match = line.match(re_par);
				if (match) {
					var obj = {
						all: match[0],
						key: match[2],
						type: match[1],
						value: match[3]
					};
                   	matches.push(obj); 
				}
			}); 

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
                } else {
                   console.log('UNKNOWN TYPE: ' + type + ', key=' + key + ', value=' + value);
                }
                
				var par = { type: type, key: key, value: value };
				parameters.push(par);
			});
			this.parameters = parameters;

			var el_pars = element.find('.pars');
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
                            'onchange="window.espo_script.onChooseFile(event, \'' + par.key + '\', \'script-msg\');" />';
                    html += '<textarea style="display:none" id=' + par.key + '></textarea>';
			    } else {
					html += '<input class="main-element form-control" type="text" name="' + par.key + '" value="' + par.value + '"/>';
				}
				html += '</td>';
				html += '</tr>';
			});
			html += '</table>';
			el_pars.html(html);

			var el_button = element.find('.formula');
			var me = this;
			el_button.click(function() { me.uitvoeren(); });
		},
	});
});

