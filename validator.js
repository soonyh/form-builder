/**
 * @class fish.desktop.widget.Validator
 * 校验控件,可单独校验元素,可针对form、带ui-validator样式的元素进行校验;注意,只针对当前为生效状态的元素起作用
 *
 * 使用组件
 *
 * 1. 通过JS传参，无需改变DOM。
 *
 * <pre>
 * $('form[name="register"]').validator({
 *    stopOnError: false,
 *    timely: false,
 *    fields: {
 *        'email': 'required;email;'
 *    }
 * });
 * </pre>
 *
 * 2. 通过在DOM上绑定属性，无需js调用。
 *
 * 在字段上绑定规则，参见公共定义-规则
 *
 * 如果要改变默认参数，可以在form上以json字符串形式绑定参数data-validator-option，参见公共定义-表单
 *
 * 如果参数全部在DOM元素上面传递，那么js就不需要初始化了
 *
 *
 * 内置规则（rules）
 *
 * 公共定义：
 *
 * 1. 数值范围使用波浪线（~）表示，例如：6~（大于等于6）、~6（小于等于6）、6~16（6到16）
 *
 * 2. 大小比较使用 lt（小于）、lte（小于等于）、gt（大于）、gte（大于等于）、eq（等于）表示
 *
 * 3. 如果某个规则可以带参数，参数要使用方括号（[]）或者圆括号（()）括起来，取决于你的习惯
 *
 * |规则|参数|描述|例子
 * |:-----|:------|:------|:------|
 * |required||必填项|required        //不能为空<br>required(xxx)   //满足xxx规则，才验证required<br>required(not, xxx) //如果值为空，或者xxx也认为是空
 * |integer|可选，标识|整数|integer         //请输入整数<br>integer[*]      //请输入整数<br>integer[+]      //请输入正整数<br>integer[+0]     //请输入正整数或0<br>integer[-]      //请输入负整数<br>integer[-0]     //请输入负整数或0<br>
 * |match|可选，标识<br>必选, 另一字段名|与另一字段匹配<br>match[name]; 用于验证两个字段的值必须相同<br>match[condition, name]; 用于比较两个字段大小<br/>match[condition, name, date]; 第三个参数设置为date，表示使用日期值比较，默认是进行数值比较<br> **当name包含有中括号[]时，可以采用 `match(condition, name)` 风格，使用括号()来替代中括号** |match[password]  //与password字段的值匹配<br>match[lt, money]  //小于money字段的值<br>match[lte, money] //小于等于money字段的值<br>match[eq, money]  //等于money字段的值匹配<br>match[neq, money]  //不能等于money字段的值<br>match[gte, money] //大于等于money字段的值<br>match[gt, money]  //大于money字段的值
 * |range|必选，范围值|数值范围|range[0~99]      //0到99的整数<br>range[~99]       //小于或等于99的整数<br>range[0~]        //大于或等于0的整数
 * |length|必选，范围值<br>可选，是否计算真实长度|验证字符长度|length[6~16]       //6-16个字符<br>length[6]          //6个字符<br>length[~6]         //小于6个字符<br>length[6~]         //大于6个字符<br>length[~6, true]   //小于6个字符,全角字符计算双字符
 * |checked|可选，范围值|对于checkbox或radio<br>必须要选中多少项|checked             //必填，相当于required<br>checked[3~5]        //请选择3到5项<br>checked[3]          //请选择3项<br>checked[~5]         //请选择少于5项<br>checked[3~]         //请选择大于3项
 */

!function () {
    "use strict";

    // bootstrap错误样式
    var errorClass = 'has-error';

    // Rule class
    function Rules(obj, context) {
        var that = context ? context === true ? this : context : Rules.prototype;

        if (!_.isObject(obj)) {
            return;
        }

        for (var k in obj) {
            that[k] = getRule(obj[k]);
        }
    }

    // Rule converted factory
    function getRule(fn) {
        switch ($.type(fn)) {
            case 'function':
                return fn;
            case 'array':
                return function (el) {
                    return fn[0].test(el.value) || fn[1] || false;
                };
            case 'regexp':
                return function (el) {
                    return fn.test(el.value);
                };
        }
    }

    // Message class
    function Messages(obj, context) {
        var that = context ? context === true ? this : context : Messages.prototype;

        if (!_.isObject(obj)) {
            return;
        }

        for (var k in obj) {
            if (!obj[k]) {
                return;
            }
            that[k] = obj[k];
        }
    }

    // Built-in rules (global)
    new Rules({
        required: function (element, params) {
            var val = $.trim(element.value),
                isValid = true;

            if (params) {
                if (params.length === 1) {
                    if (!val && !this.test(element, params[0])) {
                        $(element).attr('aria-required', null);
                        return null;
                    } else {
                        $(element).attr('aria-required', true);
                    }
                } else if (params[0] === 'not') {
                    $.map(params.slice(1), function (v) {
                        if (val === $.trim(v)) {
                            isValid = false;
                        }
                    });
                }
            }
            return isValid && !!val;
        },
        digits: function (element) {
            var val = $.trim(element.value);
            return !isNaN(val) || this.messages.digits;
        },
        integer: function (element, params) {
            var re, z = '0|',
                p = '[1-9]\\d*',
                key = params ? params[0] : '*';

            switch (key) {
                case '+':
                    re = p;
                    break;
                case '-':
                    re = '-' + p;
                    break;
                case '+0':
                    re = z + p;
                    break;
                case '-0':
                    re = z + '-' + p;
                    break;
                default:
                    re = z + '-?' + p;
            }
            re = '^(?:' + re + ')$';
            return new RegExp(re).test(element.value) || this.messages.integer[key];
        },

        'float': function (element, params) {
            var reg, key = params ? params[0] : '*';
            switch (key) {
                case '+':
                    reg = /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$/;
                    break;
                case '+0':
                    reg = /^\d+(\.\d+)?$/;
                    break;
                case '-':
                    reg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/;
                    break;
                case '-0':
                    reg = /^((-\d+(\.\d+)?)|(0+(\.0+)?))$/;
                    break;
                default:
                    reg = /^(-?\d+)(\.\d+)?$/;
                    break;
            }

            return reg.test(element.value) || this.messages['float'][key];
        },

        match: function (element, params, field) {
            if (!params) {
                return;
            }
            var me = this,
                a, b,
                key, msg, type = 'eq',
                selector2, elem2, field2, dateType = false;
            if (params.length === 1) {
                key = params[0];
            } else {
                type = params[0];
                key = params[1];
            }
            selector2 = key.charAt(0) === '#' ? key : ':input[name="' + key + '"]';
            elem2 = me.element.find(selector2)[0];
            // If the compared field is not exist
            if (!elem2) {
                return;
            }
            field2 = me.getField(elem2);

            if (params[2] === 'date') {
                a = $(element).datetimepicker('value');
                b = $(elem2).datetimepicker('value');
                dateType = true;
            } else {
                a = element.value;
                b = elem2.value;
            }

            if (!field._match) {
                me.element.on('valid.field', selector2, function () {
                    $(element).trigger('validate');
                });
                field._match = field2._match = 1;
            }

            // If one field are blank
            if (a === "" || b === "") {
                return null;
            }

            if (isNaN(a) || isNaN(b)) {
                //只要有一个不是数值,或者第三个参数是date类型,都作为字符串比较
            } else {
                a = +a;
                b = +b;
            }
            msg = dateType ? (me.messages.match['date' + type] || me.messages.match[type]) : me.messages.match[type];
            msg = msg.replace('{1}', me._getDisplay(element, field2.display || key));

            switch (type) {
                case 'lt':
                    return (a < b) || msg;
                case 'lte':
                    return (a <= b) || msg;
                case 'gte':
                    return (a >= b) || msg;
                case 'gt':
                    return (a > b) || msg;
                case 'neq':
                    return (a !== b) || msg;
                default:
                    return (a === b) || msg;
            }
        },

        range: function (element, params) {
            return this.getRangeMsg(+element.value, params, 'range');
        },

        checked: function (element, params, field) {
            if (!checkable(element)) {
                return;
            }

            var me = this,
                elem, count;

            count = me.element.find('input[name="' + element.name + '"]').filter(function () {
                var el = this;
                if (!elem && checkable(el)) {
                    elem = el;
                }
                return !el.disabled && el.checked && $(el).is(':visible');
            }).length;

            if (params) {
                return me.getRangeMsg(count, params, 'checked');
            } else {
                return !!count || getDataMsg(elem, field, '') || me.messages.required;
            }
        },

        length: function (element, params) {
            var value = element.value,
                len = utf8Length(value);

            return this.getRangeMsg(len, params, 'length', (params[1] ? '_2' : ''));
        },

        filter: function (element, params) {
            element.value = element.value.replace(params ? (new RegExp("[" + params[0] + "]", "gm")) : /<|>/g, '');
        }
    });

    function utf8Length(str) {
        var m = encodeURIComponent(str).match(/%[89ABab]/g);
        return str.length + (m ? m.length : 0);
    }

    // Convert space-separated keys to jQuery selector
    function keys2selector(keys) {
        var selector = '';

        $.map(keys.split(' '), function (k) {
            selector += ',' + (k.charAt(0) === '#' ? k : '[name="' + k + '"]');
        });

        return selector.substring(1);
    }

    // Get instance by an element
    function getInstance(el) {
        var wrap;

        if (!el || !el.tagName) {
            return;
        }
        switch (el.tagName) {
            case 'INPUT':
            case 'SELECT':
            case 'TEXTAREA':
            case 'BUTTON':
            case 'FIELDSET':
                wrap = el.form || $(el).closest('.ui-validator');
                break;
            case 'FORM':
                wrap = el;
                break;
            default:
                wrap = $(el).closest('.ui-validator');
        }

        return $(wrap).data('ui-validator') || $(wrap)['validator']().data('ui-validator');
    }

    // Get custom rules on the node
    function getDataRule(el, method) {
        var fn = $.trim($(el).attr('data-rule-' + method));

        if (!fn) {
            return;
        }
        fn = (new Function("return " + fn))();
        if (fn) {
            return getRule(fn);
        }
    }

    // Get custom messages on the node
    function getDataMsg(el, field, ret, m) {
        var msg = field.msg,
            item = field._r,
            $el = $(el);

        if (_.isObject(msg)) {
            msg = msg[item];
        }
        if (!_.isString(msg)) {
            msg = $el.attr('data-msg-' + item) || $el.attr('data-msg') || ret || (m ? _.isString(m) ? m : m[item] : '');
        }

        return msg;
    }

    // Check whether the element is checkbox or radio
    function checkable(el) {
        return el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio');
    }

    // A faster selector than ":input:not(:submit,:button,:reset,:image)"
    $.expr[":"].verifiable = function (elem) {
        var name = elem.nodeName.toLowerCase(),
            ignore = !fish.isUndefined($(elem).attr('data-rule-ignore'));

        return ((name === 'input' && !({
            submit: 1,
            button: 1,
            reset: 1,
            image: 1
        })[elem.type] || name === 'select' || name === 'textarea')) && !ignore;
    };

    $.widget('ui.validator', {
        options: {
            /**
             * @cfg {Boolean} stopOnError
             * 是否在校验失败时候停止继续校验，默认是false
             */
            stopOnError: false,
            /**
             * @cfg {number} timely
             * 是否启用实时验证，可用值:
             * 0 || false: 关闭实时验证，将只在提交表单的时候进行验证
             * 1 || true: 启用实时验证，在字段失去焦点后验证该字段
             * 2: 启用实时验证，在输入的同时验证该字段
             */
            timely: 1,
            /**
             * @cfg {String} ignore
             * 指定需要忽略验证的元素的jQuery选择器。
             *
             * 因为它们会隐藏原本的元素，导致不进行校验<br/>
             * 如果忽略某些元素不校验，不要配置校验规则即可<br/>
             * 或者是在某种情况下需要校验，则通过设置 {@link #setField} 方法来处理
             *
             * 示例：
             * <pre>
             * //任何不可见的元素，都不作验证。  注意：如果表单里有combobox/multiselect时则不好使用
             * $('form').validator({
             *     ignore: ':hidden'
             * });
             * //id为tab2下的所有子元素都不作验证
             * $('form').validator({
             *     ignore: '#tab2'
             * });
             * //动态改变要忽略验证的元素
             * $('form').data('ui-validator').options.ignore = '#tab1';
             * </pre>
             */
            ignore: '',
            /**
             * @cfg {Boolean} focusCleanup
             * 是否在输入框获得焦点的时候清除消息，默认清除。
             */
            focusCleanup: true,
            /**
             * @cfg {Boolean} focusInvalid
             * 是否自动让第一个出错的输入框获得的焦点，默认不获得。
             */
            focusInvalid: false,
            /**
             * @cfg {String} placement="top-left"
             * 错误提示的位置,同tooltip,分为上下左右左上左下右上右下八个方向
             */
            placement: 'top-left',
            /**
             * @cfg {String|Function} display
             * 自定义消息中{0}的显示替换名称
             *
             * 示例：
             * <pre>
             * $('form').validator({
             *     messages: {
             *         required: "{0}不能为空"
             *     },
             *     fields: {
             *         username: "required"
             *     },
             *     display: function(element){
             *         return $(element).prev('label').text();
             *     }
             * });
             * </pre>
             */
            display: '',
            /**
             * @cfg {Object} messages
             * 自定义用于当前实例的规则消息
             *
             * 示例：
             * <pre>
             * $('form').validator({
             *     messages: {
             *         required: "请填写该字段",
             *         email: "请检查邮箱格式",
             *     },
             *     fields: {
             *         'email': 'required;email;'
             *     }
             * });
             * </pre>
             */
            messages: {},
            /**
             * @cfg {Object} rules
             * 自定义用于当前实例的规则，支持两种定义方式
             *
             * 示例：
             * <pre>
             * $('form').validator({
             *     rules: {
             *         //自定义验证函数，具有最大的灵活性，没有什么不能验证，需要注意的事，如果自定义规则需要验证非空，必须搭配使用required内置规则
             *         myRule: function(el, param, field){
             *            //do something...
             *         },
             *         //简单配置正则及错误消息，及其方便
             *         another: [/^\w*$/, '请输入字母或下划线']
             *     },
             *     fields: {
             *         //调用前面定义的两个规则
             *         foo: 'required; myRule[param]; another'
             *     }
             * });
             * </pre>
             */
            rules: {},
            /**
             * @cfg {Object} fields
             * 待验证的字段集合，键为字段的name值或者"#"+字段id。有两种用法：
             *
             * 1, 快捷字符串传参："name": "display: rule1;rule2;...rulen"，其中“display:”可选，用于替换错误消息的字段名字
             *
             * 2, 对象传参：
             * 3, field 支持invalid(校验失败)，valid(校验成功)回调函数，第一个参数是当前field的dom元素，第二个参数是校验结果
             * <pre>
             * fields: {
             *     //name字段使用了所有支持的参数
             *     name: {
             *          rule: "姓名: required; rule2; rule3",
             *          msg: {
             *              required: "请填写姓名",
             *              rule2: "xxxx",
             *              rule3: "xxxx"
             *          },
             *          timely: false,
             *          invalid: function(el,ret){
             *          },
             *          valid: function(el,ret){
             *          }     
             *     },
             *     //email和mobile字段用最简单的方式传递字段规则
             *     email: "required; email",
             *     mobile: "mobile"
             * }
             * </pre>
             */
            fields: {},
            /**
             * @cfg {Array} groups
             * 组合多个字段，验证其中的每一个字段都会首先触发callback回调<br/>
             * <b>fields</b><br/>
             * 待验证的字段的name值，多个字段用空格分隔<br/>
             * <b>callback</b><br/>
             * 回调函数，参数是待验证字段对象集合<br/>
             * <pre>
             * groups: [{
             *  fields: "tel mobile email",
             *  callback: function($elements){
             *  }
             * }]
             * </pre>
             */
            groups: [],
            /**
             * @cfg {Function} invalid
             * @param {Array} errors 错误消息数组
             * 表单所有字段验证完成后，验证失败的回调
             */
            invalid: null,
            /**
             * @cfg {Function} valid
             * @param {Element} form 表单DOM
             * 表单所有字段验证完成后，验证成功后的回调，有一个参数：当前表单对象(暂不可用)
             */
            valid: $.noop,
            /**
             * @cfg {Boolean} hideMessage
             * 是否隐藏tooltip提示信息，默认是不隐藏
             * @since V3.13.0
             */
            hideMessage: false
        },

        _create: function () {
            var me = this;

            if (this.element.is('form')) {
                this.element.attr('novalidate', 'novalidate');
            } else {
                this.element.addClass('ui-validator');
            }

            this.elements = {};
            this.errors = {};
            this.fields = {};
            this.deferred = {};
            this.allDeferred = {};

            me.msgOpt = {
                type: 'error',
                pos: 'bottom'
            };

            this._on({
                'focusin :verifiable': '_focusin',
                'click :verifiable': '_focusin',
                'focusout :verifiable': '_focusout',
                'validate :verifiable': '_focusout'
            });

            if (this.options.timely >= 2) {
                this._on({
                    'keyup :verifiable': '_focusout',
                    'paste :verifiable': '_focusout',
                    'click :radio,:checkbox': '_focusout',
                    'change select,input[type="file"]': '_focusout'
                });
            }
        },

        _init: function() {
            var me = this;
            this.rules = new Rules(this.options.rules, true);
            this.messages = new Messages(this.options.messages, true);
            this._initFields(this.options.fields);

            // Initialization group verification
            // 解析groups，把fcallback放到每个field的group里面
            if ($.isArray(this.options.groups)) {
                $.map(this.options.groups, function (obj) {
                    if (!_.isString(obj.fields) || !$.isFunction(obj.callback)) {
                        return null;
                    }
                    obj.$elems = me.element.find(keys2selector(obj.fields));
                    $.map(obj.fields.split(' '), function (k) {
                        me.fields[k] = me.fields[k] || {};
                        me.fields[k].group = obj;
                    });
                });
            }

        },

        _setOption: function (key, value) {
            var me = this;
            if (key === 'fields') {
                me.fields = [];
                me._initFields(value);
                $.each(me.elements, function (index, el) {
                    me._resetElement(el, true);
                })
            }
            this._super(key, value);
        },

        _initFields: function (fields) {
            var me = this;

            // Processing field information
            this._processFields(fields);

            // Parsing DOM rules
            me.element.find(':verifiable').each(function () {
                me._parse(this);
            });
        },

        _processFields: function (fields) {
            var me = this;
            me.element.off('valid.field').off('invalid.field');

            if (_.isObject(fields)) {
                $.each(fields, function (k, v) {
                    // delete the field from settings
                    if (v === null) {
                        var el = me.elements[k];
                        if (el) {
                            me._resetElement(el, true);
                        }
                        delete me.fields[k];
                    } else {
                        me.fields[k] = _.isString(v) ? {
                            rule: v
                        } : v;
                    }
                });
            }
        },

        // Parsing a field
        _parse: function (el) {
            var me = this,
                $el = $(el),
                field,
                key = el.name,
                dataRule = $el.attr('data-rule');

            dataRule && $el.attr('data-rule', null);

            // if the field has passed the key as id mode, or it doesn't has a name
            if (el.id && ('#' + el.id in me.fields) || !el.name) {
                key = '#' + el.id;
            }
            // doesn't verify a field that has neither id nor name
            if (!key) {
                return;
            }

            field = me.fields[key] || {};
            field.key = key;
            field.rule = field.rule || dataRule || '';
            if (!field.rule) {
                return;
            }

            if (field.rule.match(/checked/)) {//match
                field.must = true;
            }
            if (field.rule.indexOf('required') !== -1) {
                field.required = true;
                $el.attr('aria-required', true);
            }
            if ('timely' in field && !field.timely || !me.options.timely) {
                $el.attr('notimely', true);
            }
            if (_.isString(field.target)) {
                $el.attr('data-target', field.target);
            }
            if (_.isString(field.tip)) {
                $el.attr('data-tip', field.tip);
            }

            me.fields[key] = me._parseRule(field);
        },

        // Parsing field rules
        _parseRule: function (field) {
            var arr = /(?:([^:;]*):)?(.*)/.exec(field.rule),
                opt = this.options;

            if (!arr) {
                return;
            }
            // current rule index
            field._i = 0;
            if (arr[1]) {
                field.display = arr[1];
            }
            if (!field.display && opt.display) {
                field.display = opt.display;
            }
            if (arr[2]) {
                field.rules = [];
                arr[2].replace(/(!?)\s?(\w+)(?:\[\s*(.*?\]?)\s*\]|\(\s*(.*?\)?)\s*\))?\s*(;|\||&)?/g, function () {
                    var args = arguments;
                    args[3] = args[3] || args[4];
                    field.rules.push({
                        not: args[1] === "!",
                        method: args[2],
                        params: args[3] ? args[3].split(/,\s*/) : undefined,
                        or: args[5] === "|"
                    });
                });
            }

            return field;
        },

        // Verify a zone
        _multiValidate: function ($inputs, doneCallbacks) {
            var me = this,
                opt = me.options,
                isValid;

            // me.verifying = true;

            me.hasError = false;

            me.allDeferred = {};

            var dtd = $.Deferred();

            if (opt.ignore) {
                $inputs = $inputs.not(opt.ignore);
            }

            $inputs.each(function (i, el) {
                var field = me.getField(el);
                if (field) {
                    if (checkable(el)) { //如果是checkbox,使用第一个有rule的el
                        el = me.element.find('input[name="' + el.name + '"]')[0];
                    }
                    me._validate(el);
                    if (me.hasError && opt.stopOnError) {
                        // stop the verification
                        return false;
                    }
                }
            });

            isValid = !me.hasError;

            if (!$.isEmptyObject(me.allDeferred)) {
                if (isValid) {
                    dtd.resolve();
                } else {
                    dtd.reject();
                    return dtd;
                }
            }

            $.when.apply(
                null,
                $.map(me.deferred, function (v) {
                    return v;
                })
            ).done(function () {
                doneCallbacks.call(me, isValid);
            });


            return !$.isEmptyObject(me.allDeferred) ? $.when.apply(
                null,
                $.merge($.map(me.allDeferred, function (v) {
                    return v;
                }), [dtd])
            ) : isValid;
        },

        _reset: function (e) {
            var me = this;
            me.errors = {};
            if (e) {
                me.element.find(':verifiable').each(function (i, el) {
                    me._resetElement(el);
                });
            }
        },

        _resetElement: function (el, all) {
            var $el = $(el);

            $el.removeClass('n-valid').removeClass('n-invalid');

            if (checkable(el)) {
                var parent = $(el).parent().parent();
                if($(el).data('ui-icheck')){
                    parent = parent.parent();
                }
                parent.removeClass(errorClass);
            } else {
                $el.parent().removeClass(errorClass);
            }

            this.hideMsg(el);
            if (all) {
                $el.attr('aria-required', null);
            }
        },

        _focusin: function (e) {
            var me = this,
                opt = me.options,
                el = e.target,
                $el = $(el);

            //if (me.verifying) return;

            if ($el.attr('data-inputstatus') === 'error') {
                if (opt.focusCleanup) {
                    $el.removeClass('n-invalid');
                    //me.hideMsg(el);
                }
            }

            //msg = $el.attr('data-tip');
            //if (!msg) return;
            //
            //me.showMsg(el, {
            //    type: 'tip',
            //    msg: msg
            //});
        },

        // Handle focusout/validate/keyup/click/change/paste events
        _focusout: function (e) {
            var me = this,
                opt = me.options,
                field,
                must,
                el = e.target,
                $el = $(e.target),
                etype = e.type,
                ignoreType = {
                    click: 1,
                    change: 1,
                    paste: 1
                },
                timer = 0;

            if (!ignoreType[etype]) {
                // must be verified, if it is a manual trigger
                if (etype === 'validate') {
                    must = true;
                    //timer = 0;
                }
                // or doesn't require real-time verification, exit
                else if ($el.attr('notimely')) {
                    return;
                }// or it isn't a "keyup" event, exit
                else if (opt.timely >= 2 && etype !== 'keyup') {
                    return;
                }

                // if the current field is ignored, exit
                if (opt.ignore && $el.is(opt.ignore)) {
                    return;
                }

                if (etype === 'keyup') {
                    var key = e.keyCode,
                        specialKey = {
                            8: 1, // Backspace
                            9: 1, // Tab
                            16: 1, // Shift
                            32: 1, // Space
                            46: 1 // Delete
                        };

                    // only gets focus, no verification
                    if (key === 9 && !el.value) {
                        return;
                    }

                    // do not validate, if triggered by these keys
                    if (key < 48 && !specialKey[key]) {
                        return;
                    }

                    // keyboard events, reducing the frequency of verification
                    timer = opt.timely >= 100 ? opt.timely : 500;
                }
            }

            field = me.getField(el);
            if (!field) {
                return;
            }


            if (checkable(el)) {
                el = me.element.find('input[name="' + el.name + '"]')[0];
            }

            if (timer) {
                if (field._t) {
                    clearTimeout(field._t);
                }
                field._t = setTimeout(function () {
                    me._validate(el, field, must);
                }, timer);
            } else {
                me._validate(el, field, must);
            }
        },

        // Validated a field
        _validatedField: function (el, field, ret) {
            var me = this,
                isValid = ret.isValid = field.isValid = !!ret.isValid,
                callback = isValid ? 'valid' : 'invalid';

            ret.key = field.key;
            ret.rule = field._r;
            if (isValid) {
                ret.type = 'ok';
                delete me.errors[field.key];
            } else {
                me.errors[field.key] = ret.msg;
                me.isValid = false;
                me.hasError = true;
            }
            me.elements[field.key] = ret.element = el;
            //me.$el[0].isValid = isValid ? me.isFormValid() : isValid;

            // trigger callback and event
            $.isFunction(field[callback]) && field[callback].call(me, el, ret);
            $(el).attr('aria-invalid', isValid ? null : true)
                .removeClass(isValid ? 'n-invalid' : 'n-valid')
                .addClass(!ret.skip ? isValid ? 'n-valid' : 'n-invalid' : "")
                .trigger(callback + ".field", [ret, me]);

            if (checkable(el)) {
                var parent = $(el).parent().parent();
                if($(el).data('ui-icheck')){
                    parent = parent.parent();
                }
                parent.toggleClass(errorClass, !isValid);
            } else {
                $(el).parent().toggleClass(errorClass, !isValid);
            }

            me._trigger('validation', null, [ret, me]);
            //me.$el.triggerHandler('validation', [ret, me]);
            if (me.options.hideMessage) {
                return;
            }

            // show or hide the message
            me[ret.msg ? 'showMsg' : 'hideMsg'](el, ret, field);
        },

        // Validated a rule
        _validatedRule: function (el, field, ret, msgOpt) {
            var me = this,
                msg,
                rule,
                method = field._r,
                transfer,
                isValid = false;

            field = field || me.getField(el);
            msgOpt = msgOpt || {};

            // use null to break validation from a field
            if (ret === null) {
                me._validatedField(el, field, {
                    isValid: true,
                    skip: true
                });
                return;
            } else if (ret === true || ret === undefined || ret === '') {
                isValid = true;
            } else if (_.isString(ret)) {
                msg = ret;
            } else if (_.isObject(ret)) {
                if (ret.error) {
                    msg = ret.error;
                } else {
                    msg = ret.ok;
                    isValid = true;
                }
            }

            if (field.rules) {
                rule = field.rules[field._i];
                if (rule.not) {
                    msg = undefined;
                    isValid = method === "required" || !isValid;
                }
                if (rule.or) {
                    if (isValid) {
                        while (field._i < field.rules.length && field.rules[field._i].or) {
                            field._i++;
                        }
                    } else {
                        transfer = true;
                    }
                }
            }

            // message analysis, and throw rule level event
            if (!transfer) {
                if (isValid) {
                    msgOpt.isValid = isValid;
                    $(el).trigger('valid.rule', [method, msgOpt.msg]);
                } else {
                    /* rule message priority:
                     1. custom field message;
                     2. custom DOM message
                     3. global defined message;
                     4. rule returned message;
                     5. default message;
                     */
                    msgOpt.msg = (getDataMsg(el, field, msg, me.messages[method]) || me.messages.defaultMsg).replace('{0}', me._getDisplay(el, field.display || ''));
                    $(el).trigger('invalid.rule', [method, msgOpt.msg]);
                }
            }

            // output the debug message
            //if (opt.debug) {
            //    debug.log('   ' + field._i + ': ' + method + ' => ' + (isValid || msgOpt.msg || isValid));
            //}

            // the current rule has passed, continue to validate
            if (transfer || isValid && field._i < field.rules.length - 1) {
                field._i++;
                me._checkRule(el, field);
            }
            // field was invalid, or all fields was valid
            else {
                field._i = 0;
                me._validatedField(el, field, msgOpt);
            }
        },

        // Verify a rule form a field
        _checkRule: function (el, field) {
            var me = this,
                ret,
                key = field.key,
                rule = field.rules[field._i],
                method = rule.method,
                params = rule.params;

            // request has been sent, wait it
            // if (me.submiting && me.deferred[key]) return;
            field._r = method;
            // get result from current rule
            ret = (getDataRule(el, method) || me.rules[method] || $.noop).call(me, el, params, field);
            if (_.isObject(ret) && _.isFunction(ret.then)) {
                me.deferred[key] = ret;
                me.allDeferred[field._r + ':' + method] = ret;
                ret.always(function (result) {
                    me._validatedRule(el, field, result);
                    delete me.deferred[key];
                });
            } else {
                me._validatedRule(el, field, ret);
            }

        },

        // Processing the validation
        _validate: function (el, field) {
            // doesn't validate the element that has "disabled" attribute
            if (el.disabled) {
                return;
            }
            var me = this;

            field = field || me.getField(el);
            if (!field) {
              return;
            }
            if (field.ignore) {
              me._resetElement(el, true);
              return;
            }
            var msgOpt = {},
                group = field.group,
                ret,
                isValid = field.isValid = true;

            if (!field.rules) {
                me._parse(el);
            }

            // group validation
            if (group) {
                ret = group.callback.call(me, group.$elems);
                if (ret !== undefined) {
                    me.hideMsg(group.target, {}, field);
                    // 在callback函数返回true的时候，判断field是否还存在校验规则，如果不存在，则直接validatedField并且返回
                    if (ret === true) {
                        ret = undefined;
                        if (!field.rule) {
                            me._validatedField(el, field, { isValid: true });
                            return;
                        }
                    } else {
                        field._i = 0;
                        field._r = 'group';
                        isValid = false;
                        me.hideMsg(el, {}, field);
                        $.extend(msgOpt, group);
                    }
                }
            }

            // if the field is not required and it has a blank value
            if (isValid && !field.required && !field.must && !el.value) {
                if (!checkable(el)) {
                    me._validatedField(el, field, {
                        isValid: true
                    });
                    return;
                }
            }


            // if the results are out
            if (ret !== undefined) {
                me._validatedRule(el, field, ret, msgOpt);
            } else if (field.rule) {
                me._checkRule(el, field);
            }
        },

        getField: function (el) {
            var me = this,
                key;

            if (el.id && '#' + el.id in me.fields || !el.name) {
                key = '#' + el.id;
            } else {
                key = el.name;
            }
            if ($(el).attr('data-rule')) {
                me._parse(el);
            }

            return me.fields[key];
        },

        /* Detecting whether the value of an element that matches a rule
         *
         * @interface: test
         */
        test: function (el, rule) {
            var me = this,
                ret,
                parts = /(\w+)(?:\[\s*(.*?\]?)\s*\]|\(\s*(.*?\)?)\s*\))?/.exec(rule),
                method,
                params;

            if (parts) {
                method = parts[1];
                if (method in me.rules) {
                    params = parts[2] || parts[3];
                    params = params ? params.split(', ') : undefined;
                    ret = me.rules[method].call(me, el, params);
                }
            }

            return ret === true || ret === undefined || ret === null;
        },

        // Get a range of validation messages
        getRangeMsg: function (value, params, type, suffix) {
            if (!params) {
                return;
            }
            var me = this,
              msg = me.messages[type + "[" + params + "]"] || me.messages[type] || "",
              p = params[0].split("~"),
              a = p[0],
              b = p[1],
              c = "rg",
              args = [""],
              isNumber = +value === +value;

            if (p.length === 2) {
                if (a && b) {
                    if (isNumber && value >= +a && value <= +b) {
                        return true;
                    }
                    args = args.concat(p);
                } else if (a && !b) {
                    if (isNumber && value >= +a) {
                        return true;
                    }
                    args.push(a);
                    c = 'gte';
                } else if (!a && b) {
                    if (isNumber && value <= +b) {
                        return true;
                    }
                    args.push(b);
                    c = 'lte';
                }
            } else {
                if (value === +a) {
                    return true;
                }
                args.push(a);
                c = 'eq';
            }

            if (msg) {
                if (suffix && msg[c + suffix]) {
                    c += suffix;
                }
                args[0] = msg[c] || msg;
            }

            return me.renderMsg.apply(null, args);
        },

        /* @interface: renderMsg
         */
        renderMsg: function () {
            var args = arguments,
                tpl = args[0],
                i = args.length;

            if (!tpl) {
                return;
            }

            while (--i) {
                tpl = tpl.replace('{' + i + '}', args[i]);
            }

            return tpl;
        },

        _getDisplay: function (el, str) {
            return !_.isString(str) ? $.isFunction(str) ? str.call(this, el) : '' : str;
        },

        _getMsgOpt: function (obj) {
            return $.extend({}, this.msgOpt, _.isString(obj) ? {
                msg: obj
            } : obj);
        },

        showMsg: function (el, msgOpt, /*INTERNAL*/ field) {
            var me = this,
                $el = $(el),
                tooltipInstance;

            msgOpt = me._getMsgOpt(msgOpt);

            if (!msgOpt.msg) {
                return;
            }
            if ($el.is(':verifiable')) {
                // mark message status
                $el.attr('data-inputstatus', msgOpt.type);

                // if($(el).data("ui-multiselect") || $(el).data("ui-combobox") || $(el).data("ui-datetimepicker")){
                //     delay = true; //1)校验不同时,2)延迟的时候值改变了,需要清理延迟的函数
                // }
                if ($el.data("ui-multiselect")) {
                    $el = $($el.data("ui-multiselect").container[0]);
                } else if ($el.data("ui-combobox")) { //如果是combobox,使用新生成的input
                    $el = $($el.data("ui-combobox").$container[0]);
                } else if ($el.data("ui-currencybox")) { //如果是currency,使用新生成的input
                    $el = $($el.data("ui-currencybox").$container[0]);
                } else if ($el.data('ui-combotree')) {
                    $el = $($el.data('ui-combotree').comboTree.$container[0]);
                } else if ($el.data('ui-combogrid')) {
                    $el = $($el.data('ui-combogrid').comboGrid.$container[0]);
                }

                tooltipInstance = $el.data('ui-tooltip');
                if (tooltipInstance) {
                    tooltipInstance.enable();
                    tooltipInstance.options.title = msgOpt.msg;
                } else {
                    $el.tooltip({
                        placement: me.options.placement,
                        template: '<div class="tooltip invalid" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
                        title: msgOpt.msg
                    });
                }
            }
        },

        /* @interface: hideMsg
         */
        hideMsg: function (el) {
            var $el = $(el);

            if ($el.is(':verifiable')) {
                $el.attr('data-inputstatus', null);
                $el.attr('aria-invalid', null);

                if ($el.data("ui-multiselect")) {
                    $el = $($el.data("ui-multiselect").container[0]);
                } else if ($el.data("ui-combobox")) { //如果是combobox,使用新生成的input
                    $el = $($el.data("ui-combobox").$container[0]);
                } else if ($el.data("ui-currencybox")) {
                    $el = $($el.data("ui-currencybox").$container[0]);
                } else if ($el.data('ui-combotree')) {
                    $el = $($el.data('ui-combotree').comboTree.$container[0]);
                } else if ($el.data('ui-combogrid')) {
                    $el = $($el.data('ui-combogrid').comboGrid.$container[0]);
                }

                if ($el.data('ui-tooltip')) {
                    $el.tooltip('hide').tooltip('disable');
                }
            }
        },

        /**
         * @method setField
         * 更新一个字段信息<br/>
         * 如果是新字段key，则是添加一个字段规则<br/>
         * 如果field===null，并且实例中存在字段key，则会删除字段key（不验证key字段）
         *
         * @param {String|Object} key 字段名或者字段对象，
         * @param {String} obj 字段规则信息
         */
        setField: function (key, obj) {
            var fields = {};

            // update this field
            if (_.isString(key)) {
                fields[key] = obj;
            }
            // update fields
            else if (_.isObject(key)) {
                fields = key;
            }

            this._processFields(fields);
        },
        /**
         * 调用该方法后，会清除表单中已经显示的验证消息。
         * @method cleanUp
         */
        cleanUp: function () {
            this._reset(1);
        },
        /**
         * @method setIgnoreField
         * 设置是否忽略校验该字段
         * @param {String} key 字段名，多个字段用','分隔
         * @param {Boolean} ignore 设置是否忽略校验该字段，如果忽略校验则设置为true，参加校验则设置为false
         * @since V3.11.0
         */
        setIgnoreField: function (field, ignore) {
            var self = this,
                fields = field.split(',');
            if (!fish.isEmpty(fields)) {
                $.each(fields, function (i, field) {
                    if (!fish.isUndefined(self.fields[field])) {
                      self.fields[field].ignore = ignore;
                    }
                });
            }
        }
    });

    /**
     * @method
     * @param {Boolean} hideMsg 当hideMsg为true时，验证失败后不会显示tooltip
     * @return {Boolean | Object}
     * 判断表单是否验证通过<br>
     * 当只包含同步验证时, 返回一个boolean值<br>
     * 当fields包含Deferred对象(如$.ajax)时, 返回一个Deferred对象, 此时, 可以使用如下方式提交表单
     * <pre>
     * $('form').isValid().then(
     *   function(){ //resolve },
     *   function(){ //reject }
     * );
     * </pre>
     */
    $.fn.isValid = function (hideMsg) {
        var me = getInstance(this[0]),
            ret, opt;

        if (!me) {
            return true;
        }
        opt = me.options;
        if (hideMsg === true) {
            opt.hideMessage = hideMsg;
        }
        ret = me._multiValidate(
            this.is(':input:not([data-rule-ignore])') ? this : this.find(':verifiable'),
            function (isValid) {
                if (!isValid) {
                    if (opt.focusInvalid && !opt.hideMessage) {
                        me.element.find(':input[aria-invalid="true"]:first').focus();
                    }
                    $.isFunction(opt['invalid']) && opt['invalid'].call(me, me.errors);
                }
            }
        );
        return ret;
    };

    /**
     * @method
     * 重置整个表单的校验
     * 示例查看：
     *
     *     @example
     *     $('form').resetValid();
     */
    $.fn.resetValid = function () {
        var me = getInstance(this[0]);
        if (!me) {
            return true;
        }
        me._reset(true);
    };

    /**
     * @method
     * 重置某个元素的校验
     * 示例查看：
     *
     *     @example
     *     $('element').resetElement();
     */
    $.fn.resetElement = function () {
        var me = getInstance(this[0]);
        if (!me) {
            return true;
        }
        me._resetElement(this);
    };

    /**
     * 添加全局校验规则<br/>
     * 使用示例：$.ui.validator.addRule('mobileRule', 'Please input correct mobile', /^1[3458]\d{9}$/);
     * @static
     * @param {String} name 规则名称
     * @param {String} errorMessage 规则校验失败错误提示
     * @param {RegExp|Function} rule 规则函数
     * 当是函数时参数为element/param/field,分别为元素/参数/属性，返回为true表示校验通过，false校验失败
     */
    $.ui.validator.addRule = function (name, errorMessage, rule) {
        Rules.prototype[name] = getRule(rule);
        Messages.prototype[name] = errorMessage;
    };

    new Rules(fish.getResource("validator.rules"));
    new Messages(fish.getResource("validator.msg"));

    fish.addLangListener(function () {
        new Rules(fish.getResource("validator.rules"));
        new Messages(fish.getResource("validator.msg"));
    });
}();