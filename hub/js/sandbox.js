(function(dynCore) {
    dynCore.when(
        dynCore.require('hub.appHub'),
        dynCore.require('lib', [
            'bind'
        ])
    ).done(function(modules, appHub, bind) {
        appHub('sandbox', {
            model: {
                text: 'test',
                bool: true,
                singleArr: [
                    '-',
                    '|'
                ],
                arr: [
                    'a',
                    'b',
                    'c'
                ],
                onClick: function(e, app, section) {
                    console.log('click', e, app, section, this, $(this));
                },
                double: function(val) {
                    return val + val;
                },
                orderText: 'Order',
                itemText: 'Item',
                orders: [
                    {
                        number: 10,
                        items: [
                            {
                                number: 1
                            },
                            {
                                number: 2
                            },
                            {
                                number: 3
                            },
                            {
                                number: 4
                            }
                        ]
                    },
                    {
                        number: 20,
                        items: [
                            {
                                number: 1
                            }
                        ]
                    },
                    {
                        number: 30,
                        items: [
                            {
                                number: 1
                            },
                            {
                                number: 2
                            }
                        ]
                    }
                ]
            },

            onInit: function() {
                this.model.keyval = [
                    {
                        key: 'a',
                        val: 1
                    },
                    {
                        key: 'b',
                        val: 2
                    },
                    {
                        key: 'c',
                        val: 3
                    }
                ];

                var self = this;
                this.model.onKeyup = function(model, e) {
                    console.log($(this).val(), self.model.text, model.text);
                }
            }
        });
    });
})(window.dynCore);