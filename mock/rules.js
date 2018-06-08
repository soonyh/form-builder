  $.ajaxSetup({
      data: Math.random().toString()
  });
  $(document).ajaxSuccess(function(event, jqXHR, ajaxOptions) {
      var data = ajaxOptions.data == undefined ? null : ajaxOptions.data
          // 只能打印出get类型的传参
      console.group('#####################')
      console.info('请求地址：%s', ajaxOptions.url);
      console.log('  提交数据: %o', decodeURIComponent(data));
      if (jqXHR.responseJSON) {
          console.log('  返回数据: %o', jqXHR.responseJSON)
      };
      console.groupEnd();
  });
  var Random = Mock.Random;
  Mock.setup({
      timeout: '300'
  });
  
  Mock.mock(/list.json/, {
      "result": "1",
      "msg": "登录成功",
      "list|266": [{
          "id|+1": 1,
          "title": "@cword(5,15)",
          "type": 1,
          "tips":"",
          "newLine":"0",
          "display":"1",
          "readOnly":"0"
      }]
  });
