template.helper('getClassByDisplay', function(value) {
    return value == '1' ? '' : 'opacity';
});
template.helper('getPropByReadOnly', function(value) {
    console.log(value)
    return value == '1' ? 'disabled' : '';
});
template.helper('getCssByNewLine', function(value) {
    return value == '1' ? 'width:100%;' : '';
});
template.helper('setCheckbox', function(value) {
    return value == '1' ? 'checked' : '';
});
template.helper('setSelected', function(type, value) {
    return value == type ? 'selected' : '';
});
var App = (function() {
    var globalSetting = function() {
        //提示弹窗
        toastr.options = {
            "closeButton": true,
            "preventDuplicates": true, //始终保持最后1个错误的提示
            "positionClass": "toast-bottom-right"
        }
    };
    return {
        drake: null, //存放dragula副本
        init: function() {
            globalSetting();
            App.handleLike();
            $('.js-tooltips').tooltip();
            App.loadBasicComponentList();
            $(window).resize(function() {
                App.debounce(App.handleResize, 300)();
            });
            App.handlerTopBar(); //监听工具栏
            App.activeConfigPanelOnclickComponent(); //监听画布中的组件：激活配置面板
            App.deleteComponentOnclickComponent(); //监听画布中的组件：删除组件
        },
        /** 
         * 点击组件时，激活配置面板
         */
        activeConfigPanelOnclickComponent: function() {
            $('body').on('click', '.dragula-cell,.dragula-group', function(e) {
                var id = $(this).closest('div[data-category]').prop('id');
                e.stopPropagation();
                var $currentComponent = $('#' + id);
                $('.dragula-cell,.dragula-group').removeClass('editing');
                $currentComponent.addClass('editing');
                $('#container-property').html(template('art-config-panel', $.extend({}, $('#' + id).data(), {
                    randomId: id
                })));
                App.handleSwitcher();
                App.handlePanelScroller('.property-group');
                App.showPropertyPanel(true);
            });
        },
        /** 
         * 点击删除按钮，删除组件
         */
        deleteComponentOnclickComponent: function() {
            $('body').on('click', '.delete', function(e) {
                e.stopPropagation();
                var id = $(this).closest('div[data-category]').prop('id');
                $('#' + id).remove();
                $('#container-property').empty();
            })
        },
        /** 
         * 加载对象组件列表
         * 1、异步获取数据
         * 2、初始化dragula
         * 3、渲染模拟scroller
         */
        loadBasicComponentList: function() {
            $.ajax({
                url: 'list.json',
                type: 'post',
                dataType: 'json'
            }).done(function(data) {
                if (data.result != 1) {
                    toastr.error('获取对象组件失败', '请求失败！');
                    return
                }
                if (data.list.length > 0) {
                    $('.js-basic').html(template('art-list', data));
                    App.initDrag();
                    //IE8 不支持快速过滤
                    if (App.IEVersion() == 8) {
                        $('.search-wrapper').remove();
                        $('.pagination-wrapper').remove();
                        $('.categories-wrapper').css({
                            top: 0,
                            bottom: 0
                        });
                        App.handleListScroller('[data-role="slimScroll-categories"]');
                        toastr.warning('IE8可正常使用，但不支持组件搜索。为了获得更好体验建议使用谷歌浏览器。', '友情提醒！')
                        return
                    }
                    $.getScript('./js/list.min.js', function() {
                        var list = new List('sidebar', {
                            valueNames: ['pageItem'], //item上绑定的样式
                            listClass: 'js-basic', //列表容器的样式
                            searchClass: 'search', //input样式
                            page: 20, //每页显示20条
                            pagination: [{
                                paginationClass: 'pagination', //分页容器的样式
                                innerWindow: 2, //当前页的左右2边，显示多少条，默认：2
                                // outerWindow:0,  //默认：0, 表示最左的…左侧，和最右的显示…右侧 均显示0个 如： … 3 4 5 6 7…
                                // left:0, //默认0，表示最左的…左侧留0个，可以与outerWindow搭配使用。比如left:1,outerWindow:2, 生成：1 … 4 5 6 7 8 … 11 12
                                // right:0 //和left一样
                            }]
                        });
                        App.handleListScroller('[data-role="slimScroll-categories"]');
                        list.on('filterComplete', function() {
                            console.info('filterComplete', arguments)
                            App.handleListScroller('[data-role="slimScroll-categories"]');
                        });
                    });
                }
            }).fail(function(error) {
                toastr.error('后台接口服务错误', '请求失败！');
            }).always(function(){                
                setTimeout(function(){App.removeLoader();},300);
            })
        },
        /** 
         * 页面初始化时，从cookies读取数据，执行用户偏好设置
         */
        handleLike: function() {
            //是否显示边框
            // if (App.getCookie('borderToggler') === true || App.getCookie('borderToggler') === undefined) {
            //     $('body').addClass('show-cell-border');
            // } else {
            //     $('body').removeClass('show-cell-border');
            // }
        },
        showPropertyPanel: function(flag) {
            if (!!flag) {
                $('.page-config-panel').show();
            } else {
                $('.page-config-panel').hide();
            }
        },
        /**
         * 返回一个对象，包含dom元素的data-*属性值
         * 与$(el).data()的区别是:用$(el).attr()更新属性值后，再通过$(el).data()获取，值还是旧的
         *
         * 比如：
         * <div data-tips="" data-read-only="1" data-display="1" id="test"></div>
         * $('#test').data()                     => {display: 1, readOnly: 1, tips: ""}
         * $('#test').attr("data-display","0")
         * $('#test').data()                     => {display: 1, readOnly: 1, tips: ""}
         * App.data('#test')                     => {display: 0, readOnly: 1, tips: ""}
         *
         * @param  {Selector} el [description]
         * @return {Object}
         */
        data: function(el) {
            return $(el)[0].dataset;
        },
        handlerTopBar: function() {
            //显示边框
            $('body').on('click', '[data-role="border-toggler"]', function() {
                $('body').toggleClass('show-cell-border');
            });
            $('body').on('click', '[data-role="fixed-property-panel-toggler"]', function() {
                if (App.getCookie('fixedPropertyPanel') == undefined || App.getCookie('fixedPropertyPanel') === false) {
                    // App.setCookie('fixedPropertyPanel', true);
                    $('body').addClass('fixed-property-panel');
                } else if (App.getCookie('fixedPropertyPanel') === true) {
                    // App.setCookie('fixedPropertyPanel', false);
                    $('body').removeClass('fixed-property-panel')
                }
            });
            //清空画布
            $('body').on('click', '[data-role="clear-toggler"]', function() {
                if ($('[data-role="canvas"]').find('[data-category]').size() == 0) {
                    toastr.error('画布是空的，你逗我呢。', '提醒！');
                    return
                }
                bootbox.confirm({
                    message: "确定要清空画布吗？",
                    buttons: {
                        confirm: {
                            label: '确定',
                            className: 'btn-danger'
                        },
                        cancel: {
                            label: '再想想',
                            className: 'btn-default'
                        }
                    },
                    callback: function(result) {
                        if (result) {
                            $('[data-role="canvas"]').empty();
                            $('#container-property').empty();
                        }
                    }
                });
            });
            //预览
            $('body').on('click', '[data-role="preview-toggler"]', function() {
                if ($('[data-role="canvas"]').find('[data-category]').size() == 0) {
                    toastr.error('画布是空的，你逗我呢。', '提醒！');
                    return
                }
                var $modal = $('#myModal');
                $modal.find('.modal-body').html(template('art-preview', App.parseData()));
                $('.js-tooltips').tooltip();
                $modal.modal('toggle');
                $modal.off('hidden.bs.modal').on('hidden.bs.modal', function(e) {
                    $modal.find('.modal-body').empty();
                })
            });
            $('body').on('click', '[data-role="save-toggler"]', function() {
                if ($('[data-role="canvas"]').find('[data-category]').size() == 0) {
                    toastr.error('画布是空的，你逗我呢。', '提醒！');
                    return
                }
                var nanobar = new Nanobar();
                nanobar.go(76);
                $.ajax({
                    url: 'list.json',
                    type: 'post',
                    dataType: 'json',
                    data: {
                        data: App.parseData()
                    },
                }).done(function() {
                    console.log(JSON.stringify(App.parseData(), null, '\t'))
                    toastr.success('提交成功', '恭喜！');
                }).fail(function() {
                    toastr.error('后台接口服务错误', '请求失败！');
                }).always(function() {
                    nanobar.go(100);
                });
            });
    },
    /**
     * 遍历画布上的组件，生成数据
     * @return {Array} 返回一个数组，格式如下：
         [{
             "category": "group",
             "title": "容器名称",
             "tips": "",
             "children": [{
                 "category": "basic",
                 "id": 2,
                 "title": "完图采划图省切温油别有议亲",
                 "type": 1,
                 "tips": "",
                 "readOnly": 0,
                 "display": 1,
                 "newLine": 0
             }]
         }, {
             "category": "basic",
             "id": 1,
             "title": "当军时情志",
             "type": 1,
             "tips": "",
             "readOnly": 0,
             "display": 1,
             "newLine": 0
         }]
     */
    parseData: function() {
            var records = [];
            $('[data-role="canvas"]').find('[data-category]').each(function(index, el) {
                // 开始遍历
                // 1、遇到不被容器组件包含的对象组件，直接push
                // 2、遇到容器组件，加一个children:[]，然后遍历里面的对象组件，挂载到children
                if ($(this).data('category') == 'basic' && $(this).closest('.dragula-group').size() == 0) {
                    records.push($(this).data());
                } else if ($(this).data('category') == 'group') {
                    var obj = $.extend({}, $(this).data(), {
                        children: []
                    });
                    $(this).find('[data-category]').each(function(index, el) {
                        obj.children.push($(this).data());
                    });
                    records.push(obj);
                }
            });
            return records;
        },
        /** 
         * 左侧对象组件列表 模拟滚动条
         */
        handleListScroller: function(selector) {
            if ($(selector).parent('.slimScrollDiv').size() > 0) {
                $(selector).slimScroll({
                    destroy: true
                });
            }
            $(selector).slimScroll({
                height: $('.categories-wrapper').innerHeight() - $('.category').eq(0).innerHeight() - $('.category').eq(1).find('.categories-header').innerHeight() - 5,
                allowPageScroll: false, // allow page scroll when the element scroll is ended
                alwaysVisible: false,
                wheelStep: 30
            });
        },
        /** 
         * 右侧属性面板 模拟滚动条
         */
        handlePanelScroller: function(selector) {
            if ($(selector).parent('.slimScrollDiv').size() > 0) {
                $(selector).slimScroll({
                    destroy: true
                });
            }
            $(selector).slimScroll({
                height: $('#container-property').innerHeight(),
                allowPageScroll: false, // allow page scroll when the element scroll is ended
                alwaysVisible: false,
                wheelStep: 30
            });
        },
        /** 
         * 组件拖拽能力初始化
         */
        initDrag: function() {
            App.drake = dragula({
                containers: [$('.categories-list')[0], $('.categories-list')[1], $('[data-role="canvas"]')[0]],
                // removeOnSpill: true,
                // direction: 'horizontal',
                /**
                 * 容器组件列表和对象组件列表内的元素，才可以被复制
                 */
                copy: function(el, source) {
                    return source === $('.js-basic')[0] || source === $('.js-group')[0]
                },
                /** 
                 * 左侧容器组件列表和对象组件列表，不接受被拖拽的元素；
                 * 以及不支持嵌套容器组件
                 * @el     当前拖动的dom元素
                 * @target 目标dom元素
                 * @source 被拖拽元素所在的dom容器，
                 *         当从左侧菜单拖到右侧画布时,source为ul.categories-list
                 *         当从画布中拖拽组件到画布中的容器组件时，source为div.page-canvas
                 *         总之source是动态的
                 */
                accepts: function(el, target, source, sibling) {
                    return target === $('.js-basic')[0] || target === $('.js-group')[0] || ($(el).data('category') == 'group' && $(target).hasClass('panel-body')) ? false : true;
                }
            }).on('drag', function(el) {
                // console.info('drag',arguments);
                el.className = el.className.replace('ex-moved', '');
            }).on('drop', function(el, target, source, sibling) {
                //根据target判断，是否drop进有效容器，
                //target === null 表示无效容器（IE8，无效容器 target 是返回一个特殊对象，只能根据target.attributes === null判断）
                if (target == null || App.IEVersion() == 8 && target.attributes === null) {
                    return
                }
                //drop进有效容器时，激活属性配置面板
                $(el).click();
                //如果是容器组件，往App.drake追加容器
                $(el).data('category') == 'group' && App.drake.containers.push($(el).find('.panel-body')[0]);
                $(el).addClass('ex-moved');
            }).on('over', function(el, container) {
                // console.info('over', arguments);
                container.className += ' ex-over';
            }).on('out', function(el, container) {
                // console.info('out',arguments);
                container.className = container.className.replace('ex-over', '');
            }).on('cloned', function() {
                // console.info('cloned',arguments);
            });
            // $('body').on('soon', function(event,context, drake) {
            //     var _copy;
            //     if (context.item.dataset.id == 'soon') {
            //         _copy = $('<div class="form-group"> <label class="control-label">111111</label> <input type="text" class="form-control" placeholder="dd/mm/yyyy"> </div>')[0];
            //     } else {
            //         _copy = context.item.cloneNode(true);
            //     }
            //     drake.emit('cloned', _copy, context.item, 'copy');
            // })
        },
        getCurrentEditingComponetId: function() {
            return $('.property-group').attr('data-editing-component-id');
        },
        checkPagePropertyPanel: function() {
            if (!App.getCurrentEditingComponetId()) {
                toastr.error('请先选择要设置的组件', '错误！');
                return false;
            } else {
                return true;
            }
        },
        handleType: function(el) {
            if (!App.checkPagePropertyPanel()) {
                return
            }
            var _value = $(el).val();
            var CurrentEditingComponetId = App.getCurrentEditingComponetId();
            var $slot = $('#' + CurrentEditingComponetId).find('[data-role="input-slot"]');
            var data = $.extend({}, $('#' + CurrentEditingComponetId).data(), {
                type: _value
            });
            $slot.empty();
            if (_value === '1') {
                $slot.html(template('art-input-text', data));
            } else if (_value === '2') {
                $slot.html(template('art-checkbox', data));
            } else if (_value === '3') {
                $slot.html(template('art-radio', data));
            } else if (_value === '4') {
                $slot.html(template('art-input-group', data));
            } else if (_value === '5') {
                $slot.html(template('art-input-group', data));
            }
            $('#' + CurrentEditingComponetId).data('type', _value);
        },
        handleTitle: function(el) {
            if (!App.checkPagePropertyPanel()) {
                return
            }
            var _value = $(el).val();
            var CurrentEditingComponetId = App.getCurrentEditingComponetId();
            var _oldTitle = $('.property-group').attr('data-editing-component-title');
            var $slot = $('#' + CurrentEditingComponetId).find('[data-role="title-slot"]').eq(0);
            if (!!_value) {
                $slot.html(_value);
                $('#' + CurrentEditingComponetId).data('title', _value);
            } else {
                $slot.html(_oldTitle);
                $('#' + CurrentEditingComponetId).data('title', _oldTitle);
            }
        },
        handleTips: function(el) {
            if (!App.checkPagePropertyPanel()) {
                return
            }
            var _value = $(el).val();
            var CurrentEditingComponetId = App.getCurrentEditingComponetId();
            var $slot = $('#' + CurrentEditingComponetId).find('[data-role="tips-slot"]').eq(0);
            if (!!_value) {
                $slot.html(template('art-tips', {
                    tips: _value
                }));
                $('#' + CurrentEditingComponetId).data('tips', _value);
                $('.js-tooltips').tooltip();
            } else {
                $slot.empty();
                $('#' + CurrentEditingComponetId).data('tips', '');
            }
        },
        handleDisplay: function(el) {
            if (!App.checkPagePropertyPanel()) {
                return
            }
            var CurrentEditingComponetId = App.getCurrentEditingComponetId();
            if ($(el)[0].checked) {
                $('#' + CurrentEditingComponetId).removeClass('opacity').data('display', '1');
            } else {
                $('#' + CurrentEditingComponetId).addClass('opacity').data('display', '0');
            }
        },
        handleNewLine: function(el) {
            if (!App.checkPagePropertyPanel()) {
                return
            }
            var CurrentEditingComponetId = App.getCurrentEditingComponetId();
            if ($(el)[0].checked) {
                $('#' + CurrentEditingComponetId).css('width', '100%').data('newLine', '1');
            } else {
                $('#' + CurrentEditingComponetId).css('width', '50%').data('newLine', '0');
            }
        },
        handleReadOnly: function(el) {
            if (!App.checkPagePropertyPanel()) {
                return
            }
            var CurrentEditingComponetId = App.getCurrentEditingComponetId();
            if ($(el)[0].checked) {
                $('#' + CurrentEditingComponetId).find(':input').prop('disabled', true);
                $('#' + CurrentEditingComponetId).data('readOnly', '1');
            } else {
                $('#' + CurrentEditingComponetId).find(':input').removeProp('disabled');
                $('#' + CurrentEditingComponetId).data('readOnly', '0');
            }
        },
        handleSwitcher: function() {
            var options = {};
            //修复IE8
            if (App.IEVersion() == 8) {
                options = {
                    jackColor: '#eee',
                    jackSecondaryColor: '#eee'
                };
            }
            $("[name='display']").size() && new Switchery($("[name='display']")[0], options);
            $("[name='newLine']").size() && new Switchery($("[name='newLine']")[0], options);
            $("[name='readOnly']").size() && new Switchery($("[name='readOnly']")[0], options);
        },
        /** 
         * 视窗改变时，重置模拟滚动条
         */
        handleResize: function() {
            App.handleListScroller('[data-role="slimScroll-categories"]');
            App.handlePanelScroller('.property-group');
        },
        loader:function(){
            if($('#page-preloader').size() > 0){
                return
            }
          $('body').append('<div id="page-preloader"><span class="ie9-visiable ie8-visiable spinner-label">Loading...</span><span class="spinner ie8-hide ie9-hide"></span></div>')
        },
        removeLoader:function(){   
           $('#page-preloader').remove();
        },
        /**   
         * @param func        {function}  请求关联函数，实际应用需要调用的函数
         * @param wait        {number}    空闲时间，单位毫秒
         * @param immediate   {Boolean}   可选项，不写默认是false; true表示立即执行，false表示在尾巴执行
         * @return {function}             返回客户调用函数
         *
         * //html
         * <button onclick="lazyAlert()">alert</button> *
         * //js
         * function alert(){console.log(1)}
         * var lazyAlert = debounce(alert,100,false)
         *
         * 比如：在100毫秒点击N下按钮，都只会执行一次，区别的是：
         * immediate为true时,在第一次点击时就会执行alert，后面的N-1下都不会再执行
         * immediate为false时,只会在最后一次点击停止后的100毫秒执行alert()。
         */
        debounce: function(func, wait, immediate) { //监听屏幕大小变化时，给点延迟，减少重新绘制canvas的频率
            var timeout;
            return function() {
                var context = this,
                    args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            }
        },
        /**
         * IE浏览器检测
         *
         * 返回值     值类型    值说明
         *    -1      Number    不是ie浏览器
         *    6       Number    ie版本<=6
         *    7       Number    ie7
         *    8       Number    ie8
         *    9       Number    ie9
         *   10       Number    ie10
         *   11       Number    ie11
         *  'edge'    String    ie的edge浏览器
         */
        IEVersion: function() {
            var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
            var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器  
            var isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //判断是否IE的Edge浏览器  
            var isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;
            if (isIE) {
                var fIEVersion = userAgent.match(/MSIE (\d+)/)[1];
                if (fIEVersion == 7) {
                    return 7;
                } else if (fIEVersion == 8) {
                    return 8;
                } else if (fIEVersion == 9) {
                    return 9;
                } else if (fIEVersion == 10) {
                    return 10;
                } else {
                    return 6; //IE版本<=7
                }
            } else if (isEdge) {
                return 'edge'; //edge
            } else if (isIE11) {
                return 11; //IE11  
            } else {
                return -1; //不是ie浏览器
            }
        },
        getUniqueID: function(prefix) {
            return prefix + '_' + Math.floor(Math.random() * (new Date()).getTime());
        },
        /**
         * 获取视窗宽高
         * 关于视窗的各种尺寸可参考：
         * https://www.w3cplus.com/sites/default/files/blogs/2017/1707/vw-layout-4.png
         * @includeScollbar   {Boolean}  true为包含滚动条的宽度，false反之
         * @return            {Object}   返回一个包含width和height2个属性的对象。
         *                    width：浏览器视窗的宽度，height为窗口的高度
         */
        getViewPort: function(includeScollbar) {
            var isInclude = includeScollbar || false;
            if (isInclude) {
                var e = window,
                    a = 'inner';
                if (!('innerWidth' in window)) {
                    a = 'client';
                    e = document.documentElement || document.body;
                }
                return {
                    width: e[a + 'Width'],
                    height: e[a + 'Height']
                }
            } else {
                var de = document.documentElement;
                var db = document.body;
                var viewW = de.clientWidth == 0 ? db.clientWidth : de.clientWidth;
                var viewH = de.clientHeight == 0 ? db.clientHeight : de.clientHeight;
                return {
                    width: viewW,
                    height: viewH
                }
            }
        },
        setCookie: function(key, value) {
            Cookies.set(key, value, {
                expires: 30, //30天失效
                path: '/'
            })
        },
        getCookie: function(key) {
            return Cookies.getJSON(name);
        },
}
})()
