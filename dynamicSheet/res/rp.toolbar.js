(function() {
    var $toolbar = $("<section/>");
    var tools = [
        $("<div/>"),
        $("<div/>").hide(),
        $("<div/>").hide()
    ];
    var $status = $("<h4/>", {
        id: "rpStatus"
    });
    $toolbar.append(
        $("<div/>", {
            id: "rpToolbar",
            class: "rpRow"
        }).append(
            $("<div/>", {
                class: "rpS4 rpM2 rpCol"
            }).append(
                $("<select/>").on("change", function() {
                    var val = $(this).val();
                    tools[val].show();
                    tools[(val + 1) % 3].hide();
                    tools[(val + 2) % 3].hide();
                    removePlaceableIndicators();
                    makeNotSelectable();
                    $toolboxAddOptions.empty();
                    $toolboxModifyOptions.empty();
                }).append(
                    $("<option/>", {
                        value: "0",
                        text: "Add"
                    })
                ).append(
                    $("<option/>", {
                        value: "1",
                        text: "Modify"
                    })
                ).append(
                    $("<option/>", {
                        value: "2",
                        text: "Remove"
                    })
                )
            )
        ).append(
            $("<div/>", {
                id: "rpToolbox",
                class: "rpS8 rpM10 rpCol"
            }).append(tools)
        ).append(
            $("<div/>", {
                class: "rpS12 rpCol"
            }).append($status)
        )
    );
    $("body").prepend($toolbar).prepend($("<a/>", {
        id: "toggleToolbar",
        text: "Toolbar"
    }).on("click", function() {
        $toolbar.toggle();
    }));

    var removePlaceableIndicators = function () {
        $(".placeable").removeClass("placeable").off("click").find("input, textarea, label").off("click");
        $(".placeBefore, .placeAfter").remove();
        $status.text("");
    };

    var makeNotSelectable = function() {
        $(".selectable").removeClass("selectable").off("click").find("input, textarea, label").off("click");
        $(".selected").removeClass("selected").off("click").find("input, textarea, label").off("click");
        $status.text("");
    };

    var selectControl = function(event, element, controls, index) {
        event.preventDefault();
        $(this).toggleClass("selectable").toggleClass("selected");
        $selectForModify.removeClass("selected");
        $(".selectable").off("click");
        var control = controls[index];
        $toolboxModifyOptions.empty().append(
            createInputsFromMetadata(control.getClassName())
        );
        var $inputs = $("#rpToolboxModifyOptions input, #rpToolboxModifyOptions textarea");
        for (var i = 0; i < $inputs.length; i++) {
            $($inputs[i]).val(control.get([$($inputs[i]).attr("name")]));
        }
        var $selects = $("#rpToolboxModifyOptions select");
        for (var i = 0; i < $selects.length; i++) {
            $($selects[i]).val(control.get([$($selects[i]).attr("name")]));
        }
        $modifyControl.on("click", function() {
            for (var i = 0; i < $inputs.length; i++) {
                control.set($($inputs[i]).attr("name"), $($inputs[i]).val());
            }
            for (var i = 0; i < $selects.length; i++) {
                control.set($($selects[i]).attr("name"), $($selects[i]).val());
            }
            $toolboxModifyOptions.empty();
            makeNotSelectable();
            element.replaceWith(control.render());
        });
        $status.text("");
    };

    var removeControl = function(event, element, controls, i) {
        event.preventDefault();
        controls.splice(i, 1);
        $selectForRemoval.removeClass("selected");
        element.remove();
        makeNotSelectable();
    };

    var placeControl = function(element, controls, i, before, container) {
        $placeControl.removeClass("selected");
        var control = makeControl();
        controls.splice(i, 0, control);
        if (container) {
            element.children().children().first().append(control.render());
        } else if (before) {
            element.before(control.render());
        } else {
            element.after(control.render());
        }
        removePlaceableIndicators();
        if (rp.equalize) {
            rp.equalize();
        }
    };

    var makeControl = function() {
        var className = $("#controlTypeSelect").val();
        var args = {};
        var $inputs = $("#rpToolboxAddOptions input");
        for (var i = 0; i < $inputs.length; i++) {
            args[$($inputs[i]).attr("name")] = $($inputs[i]).val();
            $($inputs[i]).val("");
        }
        var $selects = $("#rpToolboxAddOptions select");
        for (var i = 0; i < $selects.length; i++) {
            args[$($selects[i]).attr("name")] = $($selects[i]).val();
            $($selects[i]).find('option:eq(0)').prop('selected', true);
        }
        return rp[className].create(args);
    };

    var addPlaceableIndicators = function(controls) {
        if (controls.length) {
            for (var i = 0; i < controls.length; i++) {
                var element = controls[i].getElement();
                var $before = $("<span/>", {
                    class: "placeBefore"
                }).appendTo(element);
                var $after = $("<span/>", {
                    class: "placeAfter"
                }).appendTo(element);
                if (controls[i].getClassName() === "Container") {
                    if (controls[i].controls.length) {
                        addPlaceableIndicators(controls[i].controls);
                    } else {
                        element.on("click", function() {
                            placeControl(element, controls, controls.length - 1, false, true);
                        });
                    }
                }
                element.addClass("placeable");
                element.find("input, textarea, label").on("click", function (event) {
                    event.preventDefault();
                    $(this).blur();
                });
                (function(element, controls, i) {
                    $before.on("click", function() {
                        placeControl(element, controls, i, true);
                    });
                    $after.on("click", function() {
                        placeControl(element, controls, i + 1, false);
                    });
                })(element, controls, i);
            }
        }
    };

    var makeModifiable = function(controls) {
        if (controls.length) {
            for (var i = 0; i < controls.length; i++) {
                var element = controls[i].getElement();
                if (controls[i].getClassName() === "Container") {
                    makeModifiable(controls[i].controls);
                }
                element.addClass("selectable");
                element.find("input, textarea, label").on("click", function (event) {
                    event.preventDefault();
                    $(this).blur();
                });
                (function(element, controls, i) {
                    element.on("click", function(event) {
                        selectControl.call(this, event, element, controls, i);
                    });
                })(element, controls, i);
            }
        }
    };

    var makeSelectable = function(controls) {
        if (controls.length) {
            for (var i = 0; i < controls.length; i++) {
                var element = controls[i].getElement();
                if (controls[i].getClassName() === "Container") {
                    makeSelectable(controls[i].controls);
                }
                element.addClass("selectable");
                element.find("input, textarea, label").on("click", function (event) {
                    event.preventDefault();
                    $(this).blur();
                });
                (function(element, controls, i) {
                    element.on("click", function(event) {
                        removeControl(event, element, controls, i);
                    });
                })(element, controls, i);
            }
        }
    };

    var $controlTypeSelectList = $("<select/>", {
        id: "controlTypeSelect"
    });

    var controlTypes = [
        { class: "Single",          display: "Single Cell" },
        { class: "SingleSmall",     display: "Single Cell (small)" },
        { class: "SingleWithCalc",  display: "Single Input with Calculated Second Cell" },
        { class: "InlineLeft",      display: "Single Cell (inline left)" },
        { class: "InlineRight",     display: "Single Cell (inline right)" },
        { class: "Multiline",       display: "Multiline Text" },
        { class: "DualV",           display: "Two Cells (vertical)" },
        { class: "DualH",           display: "Two Cells (horizontal)" },
        { class: "CheckboxLeft",    display: "Checkbox (left)" },
        { class: "InlineRight",     display: "Checkbox (right)" },
        { class: "SkillList",       display: "Skill List" },
        { class: "Container",       display: "Container" }
    ];
    
    for (var i = 0; i < controlTypes.length; i++) {
        $controlTypeSelectList.append(
            $("<option/>", {
                value: controlTypes[i].class,
                text: controlTypes[i].display
            })
        );
    }

    var $placeControl = $("<button/>", {
        text: "Place Control",
        style: "margin-top:1rem;"
    }).on("click", function() {
        $(this).toggleClass("selected");
        if ($(this).hasClass("selected")) {
            for (var i = 0; i < rp.core.controls.length; i++) {
                addPlaceableIndicators(rp.core.controls[i]);
            }
            $status.text("Click an arrow or container.");
        } else {
            removePlaceableIndicators();
        }
    });

    var $selectForModify = $("<button/>", {
        text: "Select Control"
    }).on("click", function() {
        if (!$(this).hasClass("selected")) {
            makeNotSelectable();
        }
        $modifyControl.off("click");
        $toolboxModifyOptions.empty();
        $(this).toggleClass("selected");
        if ($(this).hasClass("selected")) {
            for (var i = 0; i < rp.core.controls.length; i++) {
                makeModifiable(rp.core.controls[i]);
            }
            $status.text("Click a control to select it.");
        } else {
            makeNotSelectable();
        }
    });

    var $modifyControl = $("<button/>", {
        text: "Modify Selected Control",
        style: "margin-top:1rem;"
    });

    var $selectForRemoval = $("<button/>", {
        text: "Select Control"
    }).on("click", function() {
        $(this).toggleClass("selected");
        if ($(this).hasClass("selected")) {
            for (var i = 0; i < rp.core.controls.length; i++) {
                makeSelectable(rp.core.controls[i]);
            }
            $status.text("Click a control to remove it.");
        } else {
            makeNotSelectable();
        }
    });

    var $toolboxAddOptions = $("<div/>", {
        id: "rpToolboxAddOptions",
        class: "rpRow"
    });

    var $toolboxModifyOptions = $("<div/>", {
        id: "rpToolboxModifyOptions",
        class: "rpRow"
    });

    var narrowSpan = "rpS3 rpM2 rpL1 rpCol";
    var standardSpan = "rpS6 rpM4 rpL2 rpCol";
    var wideSpan = "rpS12 rpM6 rpL3 rpCol";
    var colorOptions = [
        {
            key: "rpBgGrey",
            val: "Grey"
        },
        {
            key: "rpBgBlue",
            val: "Blue"
        },
        {
            key: "rpBgRed",
            val: "Red"
        },
        {
            key: "rpBgGreen",
            val: "Green"
        }
    ];
    var createInput = {
        string: function(meta) {
            return $("<div/>", {
                class: standardSpan
            }).append(
                $("<label/>", {
                    text: meta.desc
                }).append(
                    $("<input/>", {
                        name: meta.name
                    })
                )
            );
        },
        multiline: function(meta) {
            return $("<div/>", {
                class: "rpS12 rpCol"
            }).append(
                $("<label/>", {
                    text: meta.desc
                }).append(
                    $("<textarea/>", {
                        name: meta.name,
                        rows: 4
                    })
                )
            );
        },
        number: function(meta) {
            return $("<div/>", {
                class: narrowSpan
            }).append(
                $("<label/>", {
                    text: meta.desc
                }).append(
                    $("<input/>", {
                        name: meta.name,
                        type: "number"
                    })
                )
            );
        },
        select: function(meta) {
            var $div = $("<div/>", {
                class: standardSpan
            });
            var $select = $("<select/>", {
                name: meta.name
            }).appendTo(
                $("<label/>", {
                    text: meta.desc
                }).appendTo($div)
            );
            for (var i = 0; i < meta.options.length; i++) {
                $select.append(
                    $("<option/>", {
                        value: meta.options[i].key,
                        text: meta.options[i].val
                    })
                );
            }
            return $div;
        },
        colorSelector: function(meta) {
            meta.options = colorOptions;
            return createInput.select(meta);
        },
        columnSelector: function(meta) {
            return createInput.string(meta);
        }
    };

    var createInputsFromMetadata = function(className) {
        var output = [];
        var meta = rp[className].create().getMetadata();
        for (var i = 0; i < meta.length; i++) {
            output.push(createInput[meta[i].type](meta[i]));
        }
        return output;
    };

    $controlTypeSelectList.on("change", function() {
        $toolboxAddOptions.empty().append(
            createInputsFromMetadata($(this).val())
        );
    }).trigger("change");

    tools[0].append(
        $("<div/>", {
            class: "rpRow"
        }).append(
            $("<div/>", {
                class: "rpS12 rpCol"
            }).append(
                $controlTypeSelectList
            )
        )
    ).append(
        $toolboxAddOptions
    ).append(
        $("<div/>", {
            class: "rpRow"
        }).append(
            $("<div/>", {
                class: "rpS12 rpCol"
            }).append(
                $placeControl
            )
        )
    );

    tools[1].append(
        $("<div/>", {
            class: "rpRow"
        }).append(
            $("<div/>", {
                class: "rpS12 rpCol"
            }).append(
                $selectForModify
            )
        )
    ).append(
        $toolboxModifyOptions
    ).append(
        $("<div/>", {
            class: "rpRow"
        }).append(
            $("<div/>", {
                class: "rpS12 rpCol"
            }).append(
                $modifyControl
            )
        )
    );;
    
    tools[2].append(
        $("<div/>", {
            class: "rpRow"
        }).append(
            $("<div/>", {
                class: "rpS12 rpCol"
            }).append(
                $selectForRemoval
            )
        )
    );
})();