(function() {
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    var rp = {};

    rp.core = {
        controls: [],
        initialize: function(rows) {
            this.controls = [];
            rows = rows || [];
            if (typeof rows === "string") {
                rows = JSON.parse(rows);
            }
            for (var r = 0; r < rows.length; r++) {
                var row = [];
                for (var i = 0; i < rows[r].length; i++) {
                    row.push(rp.core.deserialize(rows[r][i]));
                }
                this.controls.push(row);
            }
        },
        getSerializable: function() {
            var serializable = [];
            for (var i = 0; i < this.controls.length; i++) {
                var row = [];
                for (var r = 0; r < this.controls[i].length; r++) {
                    row.push(this.controls[i][r].getSerializable());
                }
                serializable.push(row);
            }
            return serializable;
        },
        getSerialized: function() {
            return JSON.stringify(this.getSerializable());
        },
        deserialize: function(serialized) {
            return rp[serialized.control || "Input"].create(serialized.args || {});
        },
        render: function() {
            var $content = $("#rpContent");
            $content.empty();
            for (var r = 0; r < this.controls.length; r++) {
                var $row = $("<div/>", {
                    class: "rpRow"
                });
                for (var i = 0; i < this.controls[r].length; i++) {
                    $row.append(this.controls[r][i].render());
                }
                $content.append($row);
            }
            if (rp.equalize) {
                rp.equalize();
            }
        }
    };

    rp.Input = {
        create: function(args, metadata) {
            var element;
            if (!args) {
                args = {};
            }
            if (!metadata) {
                metadata = [];
            }
            metadata.unshift({
                name: "label",
                desc: "Label",
                type: "string",
                default: "Label"
            });
            metadata.push({
                name: "color",
                desc: "Label Color",
                type: "colorSelector",
                default: "rpBgGrey"
            });
            metadata.push({
                name: "span",
                desc: "Layout Information",
                type: "columnSelector",
                default: "rpS12"
            });
            for (var i = 0; i < metadata.length; i++) {
                if (!args[metadata[i].name]) {
                    args[metadata[i].name] = metadata[i].default;
                }
            };
            return this.extend("Input", {
                get: function(prop) {
                    var val = args[prop] || "";
                    if (typeof val === "string") {
                        val = decodeURIComponent(val);
                    }
                    return val;
                },
                set: function(prop, val) {
                    val = encodeURIComponent(val || "");
                    args[prop] = val;
                },
                getElement: function() {
                    return element;
                },
                setElement: function(val) {
                    element = val;
                },
                getData: function() {
                    return args;
                },
                getMetadata: function() {
                    return metadata;
                }
            });
        },
        getSerializable: function() {
            var serializable = {
                control: this.getClassName(),
                args: this.getData()
            }
            return serializable;
        },
        render: function() {
            return null;
        },
        renderCol: function() {
            var $col = $("<div/>", {
                class: "rpCol"
            });
            $col.addClass(this.get("span"));
            $col.addClass(this.get("color") || "rpBgGrey");
            var $div = $("<div/>", {
                class: "rpInput rp" + this.getClassName()
            }).appendTo($col);
            this.setElement($col);
            return $div;
        },
        // http://aaditmshah.github.io/why-prototypal-inheritance-matters/
        extend: function(name, extension) {
            var hasOwnProperty = Object.hasOwnProperty;
            var object = Object.create(this);
            if (!object.getClassName) {
                object.getClassName = function() {
                    return name;
                }
            }
            for (var property in extension) {
                if (hasOwnProperty.call(extension, property) ||
                    typeof object[property] === "undefined") {
                    object[property] = extension[property];
                }
            }
            return object;
        }
    };

    rp.Container = rp.Input.extend("Container", {
        create: function(args) {
            var self = rp.Input.create.call(this, args);
            self.getMetadata().splice(0, 2);
            args = args || {};
            self.controls = [];
            var controls = args.controls || [];
            for (var i = 0; i < controls.length; i++) {
                self.controls.push(rp.core.deserialize(controls[i]));
            }
            return self;
        },
        render: function() {
            var $div = this.renderCol();
            var $row = $("<div/>", {
                class: "rpRow"
            }).appendTo($div);
            for (var i = 0; i < this.controls.length; i++) {
                $row.append(this.controls[i].render());
            }
            return this.getElement();
        }
    });

    rp.Single = rp.Input.extend("Single", {
        create: function(args) {
            return rp.Input.create.call(this, args);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            var $input = $("<input/>").appendTo($label);
            $input.val(this.get("value"));
            $label.append(document.createTextNode(this.get("label")));
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
            });
            return this.getElement();
        }
    });

    rp.SingleSmall = rp.Input.extend("SingleSmall", {
        create: function(args) {
            return rp.Input.create.call(this, args);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            var $input = $("<input/>").appendTo($label);
            $input.val(this.get("value"));
            $label.append(document.createTextNode(this.get("label")));
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
            });
            return this.getElement();
        }
    });

    rp.InlineRight = rp.Input.extend("InlineRight", {
        create: function(args) {
            return rp.Input.create.call(this, args);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            $label.text(this.get("label"));
            var $input = $("<input/>").appendTo($label);
            $input.val(this.get("value"));
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
            });
            return this.getElement();
        }
    });

    rp.InlineLeft = rp.Input.extend("InlineLeft", {
        create: function(args) {
            return rp.Input.create.call(this, args);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            var $input = $("<input/>").appendTo($label);
            $input.val(this.get("value"));
            $label.append(document.createTextNode(this.get("label")));
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
            });
            return this.getElement();
        }
    });

    rp.Multiline = rp.Input.extend("Multiline", {
        create: function(args) {
            var meta = [
                {
                    name: "rows",
                    desc: "Lines of Text",
                    type: "number",
                    default: 4
                }
            ];
            return rp.Input.create.call(this, args, meta);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            var $input = $("<textarea/>").appendTo($label);
            $input.val(this.get("value"));
            $input.prop("rows", this.get("rows"));
            $label.append(document.createTextNode(this.get("label")));
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
            });
            return this.getElement();
        }
    });

    rp.SingleWithCalc = rp.Input.extend("SingleWithCalc", {
        create: function(args) {
            var meta = [
                {
                    name: "calculated",
                    desc: "Calculated Field",
                    type: "select",
                    default: "bot",
                    options: [
                        {
                            key: "bot",
                            val: "Bottom"
                        },
                        {
                            key: "top",
                            val: "Top"
                        }
                    ]
                },
                {
                    name: "expression",
                    desc: "Expression",
                    type: "string",
                    default: "x"
                }
            ];
            return rp.Input.create.call(this, args, meta);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            $label.text(this.get("label"));
            var $top = $("<input/>").appendTo($label);
            var $bot = $("<input/>").appendTo($label);
            var $input;
            var $calc;
            if (this.get("calculated") === "top") {
                $input = $bot;
                $calc = $top;
            } else {
                $input = $top;
                $calc = $bot;
            }
            $input.val(this.get("value"));
            $calc.prop("readonly", true);
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
                if ($input.val() === "") {
                    $calc.val("");
                } else {
                    var value = parseFloat($input.val());
                    if (!isNaN(value)) {
                        $calc.val(math.eval(that.get("expression").replace("x", value)));
                    }
                }
            });
            $input.trigger("keyup");
            return this.getElement();
        }
    });

    rp.CheckboxRight = rp.Input.extend("CheckboxRight", {
        create: function(args) {
            return rp.Input.create.call(this, args);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            $label.text(this.get("label"));
            var $input = $("<input/>", {
                type: "checkbox"
            }).appendTo($label);
            var value = this.get("value") === "true";
            $input.prop("checked", value);
            var that = this;
            $input.on("change", function() {
                that.set("value", $(this).prop("checked"));
            });
            return this.getElement();
        }
    });

    rp.CheckboxLeft = rp.Input.extend("CheckboxLeft", {
        create: function(args) {
            return rp.Input.create.call(this, args);
        },
        render: function() {
            var $div = this.renderCol();
            var $label = $("<label/>").appendTo($div);
            var $input = $("<input/>", {
                type: "checkbox"
            }).appendTo($label);
            var value = this.get("value") === "true";
            $input.prop("checked", value);
            $label.append(document.createTextNode(this.get("label")));
            var that = this;
            $input.on("change", function() {
                that.set("value", $(this).prop("checked"));
            });
            return this.getElement();
        }
    });

    rp.DualV = rp.Input.extend("DualV", {
        create: function(args) {
            var meta = [
                {
                    name: "label2",
                    desc: "Second Label",
                    type: "string",
                    default: "Label"
                }
            ];
            return rp.Input.create.call(this, args, meta);
        },
        render: function() {
            var $div = this.renderCol();

            var $label = $("<label/>", {
                text: this.get("label")
            }).appendTo($div);
            var $input = $("<input/>").appendTo($label);
            $input.val(this.get("value"));

            var $label2 = $("<label/>").appendTo($div);
            var $input2 = $("<input/>").appendTo($label2);
            $input2.val(this.get("value2"));
            $label2.append(document.createTextNode(this.get("label2")));
            
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
            });
            $input2.on("keyup", function() {
                that.set("value2", $(this).val());
            });
            return this.getElement();
        }
    });

    rp.DualH = rp.Input.extend("DualH", {
        create: function(args) {
            var meta = [
                {
                    name: "label2",
                    desc: "Second Label",
                    type: "string",
                    default: "Label"
                }
            ];
            return rp.Input.create.call(this, args, meta);
        },
        render: function() {
            var $div = this.renderCol();

            var $label = $("<label/>", {
                text: this.get("label")
            }).appendTo($div);
            var $input = $("<input/>").appendTo($label);
            $input.val(this.get("value"));

            var $label2 = $("<label/>").appendTo($div);
            var $input2 = $("<input/>").appendTo($label2);
            $input2.val(this.get("value2"));
            $label2.append(document.createTextNode(this.get("label2")));
            
            var that = this;
            $input.on("keyup", function() {
                that.set("value", $(this).val());
            });
            $input2.on("keyup", function() {
                that.set("value2", $(this).val());
            });
            return this.getElement();
        }
    });

    rp.SkillList = rp.Input.extend("SkillList", {
        create: function(args) {
            var meta = [
                {
                    name: "skills",
                    desc: "Skills",
                    type: "multiline",
                    default: "First,Second"
                }
            ];
            args = args || {};
            args.value = args.value || {};
            var self = rp.Input.create.call(this, args, meta);
            self.setValue = function(skill, val) {
                args.value[skill] = encodeURIComponent(val);
            };
            return self;
        },
        render: function() {
            var $div = this.renderCol();
            $("<label/>", {
                text: this.get("label")
            }).appendTo($div);
            var skills = this.get("skills").split(",");
            var that = this;
            var onChange = function(i) {
                that.setValue([skills[i].trim()], $(this).prop("checked"));
            };
            var values = this.get("value");
            for (var i = 0; i < skills.length; i++){
                var $skill = $("<input/>", {
                    type: "checkbox"
                });
                $("<label/>").append($skill).append(
                    document.createTextNode(skills[i].trim())
                ).appendTo($div);
                var value = values[skills[i].trim()] === "true";
                $skill.prop("checked", value);
                (function(i) {
                    $skill.on("change", function() {
                        onChange.call(this, i);
                    });
                })(i);
            }
            $("<label/>", {
                text: this.get("label")
            }).appendTo($div);
            return this.getElement();
        }
    });

    window.rp = rp;
})();