'use strict';

function myVue(options) {
    this._init(options);
}

//  为了初始化这个构造函数，给它添加一个 _init 属性：
myVue.prototype._init = function (options) {
    this.$options = options; // options 为上面使用时传入的结构体，包括el,data,methods
    this.$el = document.querySelector(options.el); // el是 #app, this.$el是id为app的Element元素
    this.$data = options.data; // this.$data = {number: 0}
    this.$methods = options.methods; // this.$methods = {increment: function(){}}

    this._binding = {}; // _binding保存着model与view的映射关系，也就是Watcher的实例。当model改变时，我们会触发其中的指令类更新，保证view也能实时更新
    this._observe(this.$data);
    this._compile(this.$el);

};

//  接下来实现 _obverse 函数，对data进行处理，重写data的set和get函数：
myVue.prototype._observe = function (obj) {
    var value;

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            // 按照前面的数据 this._binding = {number: _directives: []}
            this._binding[key] = {
                _directives: []
            };

            value = obj[key];
            if (typeof value === 'object') {
                this._observe(value);
            }

            var binding = this._binding[key];
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

                        // 当number改变时，触发_binding[number]._directives 中的绑定的Watcher类的更新
                        binding._directives.forEach(function (item) {
                            item.update();
                        });
                    }
                }
            });
        }
    }
};
// 定义一个 _compile 函数，用来解析指令（v-bind,v-model,v-click）等，并在这个过程中对view与model进行绑定
myVue.prototype._compile = function (root) {
    // root 为id 为app 的Element元素 也就是根元素
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
                _this._binding[attrVal]._directives.push(new Watcher(
                    'input',
                    node,
                    _this,
                    attrVal,
                    'value'
                ));

                return function () {
                    _this.$data[attrVal] = nodes[key].value;
                }
            })(i));
        }

        if (node.hasAttribute('v-bind')) {
            var attrVal = node.getAttribute('v-bind');
            _this._binding[attrVal]._directives.push(new Watcher(
                'text',
                node,
                _this,
                attrVal,
                'innerHTML'
            ));
        }
    }
};

// 实现一个指令类Watcher，用来绑定更新函数，实现对DOM元素的更新：
function Watcher(name, el, vm, exp, attr) {
    this.name = name;   // 指令名称，例如文本节点，该值设为"text"
    this.el = el;       //指令对应的DOM元素
    this.vm = vm;       //指令所属myVue实例
    this.exp = exp;     //指令对应的值，本例如"number"
    this.attr = attr;   //绑定的属性值，本例为"innerHTML"

    this.update();
}

Watcher.prototype.update = function () {
    this.el[this.attr] = this.vm.$data[this.exp];
    //比如 H3.innerHTML = this.data.number; 当number改变时，会触发这个update函数，保证对应的DOM内容进行了更新。
};