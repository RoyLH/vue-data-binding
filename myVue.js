'use strict';

function myVue(options) {
    this._init(options);
}

//  为了初始化这个构造函数，给它添加一个 _init 属性：
myVue.prototype._init = function (options) {
    this.$options = options; // options 为上面使用时传入的结构体，包括el,data,methods
    this.$el = document.querySelector(options.el); // el是 #app, this.$el是id为app的Element元素
    this.$data = options.data; // this.$data = {number: 0}
    this.$method = options.method; // this.$methods = {increment: function(){}}
};

//  接下来实现 _obverse 函数，对data进行处理，重写data的set和get函数：
myVue.prototype._observe = function (obj) {
    var value;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            value = obj[key];
            if (typeof value === 'object') {
                this._observe(value);
            }
            Object.defineProperty(this.$data, key, {
                enumerable: true,
                configurable: true,
                get: function () {
                    console.log(`获取${value}`);
                    return value;
                },
                set: function (newVal) {
                    console.log(`更新${newVal}`);
                    if (value !== newVal) {
                        value = newVal;
                        binding._directive.forEach(function (item) {
                            item.update();
                        });
                    }
                }
            });
        }
    }
};

myVue.prototype._compile = function (root) {
    var _this = this;
    var nodes = root.children;

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.children.length) {
            this._compile(node);
        }

        if (node.hasAttribute('v-click')) {
            node.onclick = (function () {
                var attrVal = nodes[i].getAttribute('v-click');
                return _this.$methods[attrVal].bind(_this.$data);
            })();
        }

        if (node.hasAttribute('v-model') && (node.tagName == 'INPUT' || node.tagName == 'TEXTAREA')) {
            node.addEventListener('input', (function (key) {
                var attrVal = node.getAttribute('v-model');
                _this._binding[attrVal]._directive.push(new Watcher(
                    'input',
                    node,
                    _this,
                    attrVal,
                    'value'
                ));

                return function () {
                    this.$data[attrVal] = nodes[key].value;
                }
            })(i));
        }

        if (node.hasOwnProperty('v-bind')) {
            var attrVal = node.getAttribute('v-bind');
            _this._binding[attrVal]._directive.push(new Watcher(
                'text',
                node,
                _this,
                attrVal,
                'innerHTML'
            ));
        }
    }
};

function Watcher(name, el, vm, exp, attr) {
    this.name = name; // 指令名称，例如文本节点，该值设为"text"
    this.el = el; //指令对应的DOM元素
    this.vm = vm; //指令所属myVue实例
    this.exp = exp;//指令对应的值，本例如"number"
    this.attr = attr; //绑定的属性值，本例为"innerHTML"

    this.update();
}

Watcher.prototype.update = function () {
    this.el[this.attr] = this.vm.$data[this.exp];

    window.onload = function (params) {
        var app = new myVue({
            el: '#app',
            data: {
                number: 0
            },
            method: {
                increment: function () {
                    this, number++;
                },
            }
        });
    }
};