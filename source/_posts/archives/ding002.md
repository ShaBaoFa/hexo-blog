---
layout: butt
title: 浙政钉-扫码登录对接
date: 2023-12-05 16:54:49
tags:
category: ThreeParty
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
单位需要对接浙政钉，实现扫码登录，这里记录一下对接过程。
{% endnote %}

# 浙政钉扫码登录

## 登录入口
[开发者登录](https://www.ding.zj.gov.cn/pc/index.html#/)

## 扫码流程图
{% mermaid %}
sequenceDiagram
participant 用户 as 用户
participant 三方应用 as 三方应用
participant 浙政钉登录服务 as 浙政钉登录服务
participant 浙政钉开放平台 as 浙政钉开放平台

    用户->>三方应用: 访问
    三方应用->>浙政钉登录服务: 跳转到: oauth2/auth.htm
    浙政钉登录服务-->>用户: 展示二维码登录页面
    用户->>浙政钉登录服务: 使用浙政钉扫码登录
    浙政钉登录服务-->>三方应用: 授权成功 颁发临时code（重定向到回调地址）
    三方应用->>浙政钉开放平台: 请求应用access_token: gettoken.json
    浙政钉开放平台-->>三方应用: 返回access_token
    三方应用->>浙政钉开放平台: 请求用户信息: getuserinfo_bycode.json
    浙政钉开放平台-->>三方应用: 返回用户信息
    三方应用-->>用户: 业务会话建立
{% endmermaid %}

# 扫码登录准备工作

## 创建轻应用
![创建轻应用](/images/ding/img.png "创建轻应用")

## 获取appKey和appSecret
![获取](/images/ding/img_1.png "获取appKey和appSecret")

## 配置回调地址
![配置回调地址](/images/ding/img_2.png "配置回调地址")

# 扫码登录对接

## 各环境域名/登录域名
| 环境	   |开放平台域名（调接口使用）	|登录域名（构造登录页面）|
|-------| --- | --- |
| Saas	 |openplatform.dg-work.cn	|login.dg-work.cn|
|  浙政钉	 |openplatform-pro.ding.zj.gov.cn（域名对应政务外网IP：59.202.52.1）|	login-pro.ding.zj.gov.cn|




## 构造扫码登录页面

### 使用专有钉钉提供的扫码登录页面
  **在企业Web系统里，用户点击使用钉钉扫码登录，第三方Web系统跳转到如下地址：**
```html
https://login.dg-work.cn/oauth2/auth.htm?response_type=code&client_id=应用标识&redirect_uri=回调地址&scope=get_user_info&authType=QRCODE
```
URL中的`client_id`和`redirect_uri`两个参数的值填入第三方web系统的应用标识和回调地址。专有钉钉用户扫码登录并确认后，会302到你指定的`redirect_uri`，并向`url`参数中追加临时授权码`code`
{% note blue 'fa-solid fa-lightbulb' flat %}
此`code`非`authcode`及`state`两个参数。
`authcode` 是 **web端**使用`jsapi`获取的临时code
参数`redirect_uri`=回调地址"涉及的域名，需和创建扫码登录应用授权时填写的**回调域名一致**，否则会提示**无权限访问**。
{% endnote %}



### 支持网站将专有钉钉登录二维码内嵌到自己页面中
通过方式一构造的地址增加`embedMode=true`的参数
```html
https://login.dg-work.cn/oauth2/auth.htm?response_type=code&client_id=应用标识&redirect_uri=回调地址&scope=get_user_info&authType=QRCODE&embedMode=true
```
扫码成功后需要在页面中监听结果
```javascript
<script type="application/javascript">
    window.addEventListener('message', function(event) {
                    // 这里的event.data 就是登录成功的信息
                          // 数据格式：{ "code": "aaaa", "state": "bbbb" }
        alert(JSON.stringify(event.data));
    });
</script>
```
{% note blue 'fa-solid fa-lightbulb' flat %}
生成的二维码size固定为 200*200px,不支持修改
{% endnote %}

## 获取应用access_token
{% note blue 'fa-solid fa-lightbulb' flat %}
获取access_token，请参考[获取access_token](https://openplatform-portal.dg-work.cn/portal/#/helpdoc?apiType=DEV_GUIDE&docKey=3355045)。注意请使用扫码应用的ak/sk获取access_token
{% endnote %}

### 请求方式

**GET(HTTPS)**

### 接口名

**/gettoken.json**

### 请求参数

| 参数名	| 类型	| 是否必须	| 说明	|
| --- | --- | --- | --- |
| appkey	|string	|是	|应用唯一标识，创建应用后获得|
| appsecret	|string	|是	|应用密钥，创建应用后获得|

### 例子(PHP)
```php
<?php

namespace App\Handlers;

use App\Services\Zwdd\ExecutableClient;
use Exception;
use Illuminate\Support\Facades\Log;

class DingHandler
{
    private static string $getAccessTokenApi = "/gettoken.json";

    private static function getAccessToken():string{
        $form_params = array('appkey' : config('isv.login_ak'), 'appsecret' : config('isv.login_sk'));
        $ret = self::get(self::$getAccessTokenApi, $form_params);
        return $ret['data']['accessToken'];
    }
    private static function get($api,$form_params = []) {
        $domain = config('isv.domain');
        $ak = config('isv.login_ak');
        $sk = config('isv.login_sk');

        try {
            $executableClient = new ExecutableClient();
            $executableClient->setDomain($domain);
            $executableClient->setAccessKey($ak);
            $executableClient->setSecretKey($sk);
            $executableClient->setApiName($api);
            foreach ($form_params as $key : $value) {
                $executableClient->addParameter($key,$value);
            }
            $ret = $executableClient->epaasCurlGet(3);
            return $ret;
        } catch (Exception $e) {
            $msg = "getFilterWords|err, code: ". $e->getCode() . "|message: ". $e->getMessage();
            error_log($msg);
        }
    }

}
```

### 返回结果

```json
{
  "data": {
    "expiresIn": 7200,
    "accessToken": "app_xxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "success": true,
  "requestId": "ac111111111111111111111111111",
  "responseMessage": "OK",
  "responseCode": "0",
  "bizErrorCode": "0"
}
```
| 参数名	| 类型	| 说明	|
| --- | --- | --- |
| access_token	|string	|应用的access_token|
| expires_in	|int	|access_token的过期时间，单位为秒|

## 获取授权用户的个人信息
{% note blue 'fa-solid fa-lightbulb' flat %}
服务端通过临时授权码获取授权用户的个人信息
{% endnote %}

### 请求方式

**POST(HTTPS)**

### 接口名

**/rpc/oauth2/getuserinfo_bycode.json**
> 注意：请使用接口域名调用接口，不能使用登录域名调接口。

### 请求参数

| 参数名	| 类型	| 是否必须	| 说明	|
| --- | --- | --- | --- |
| access_token	|string	|是	|应用的access_token|
| code	|string	|是	|用户授权的临时授权码code，只能使用一次；在前面步骤中跳转到redirect_uri时会追加code参数|

### 例子(PHP)
```php
<?php

namespace App\Handlers;

use App\Services\Zwdd\ExecutableClient;
use Exception;
use Illuminate\Support\Facades\Log;

class DingHandler
{
    private static string $getUserInfoByCodeApi = "/rpc/oauth2/getuserinfo_bycode.json";

    private static function getUserInfoByCode():string{
        $form_params = array('code' : $code,'access_token' : self::getAccessToken());
        $ret = self::post(self::$getUserInfoByCodeApi, $form_params);
    }
    private static function post($api,$form_params = []) {
        $domain = config('isv.domain');
        $ak = config('isv.login_ak');
        $sk = config('isv.login_sk');

        try {
            $executableClient = new ExecutableClient();
            $executableClient->setDomain($domain);
            $executableClient->setAccessKey($ak);
            $executableClient->setSecretKey($sk);
            $executableClient->setApiName($api);
            foreach ($form_params as $key : $value) {
                $executableClient->addParameter($key,$value);
            }
            $ret = $executableClient->epaasCurlPost(3);
            return $ret;
        } catch (Exception $e) {
            $msg = "getFilterWords|err, code: ". $e->getCode() . "|message: ". $e->getMessage();
            error_log($msg);
        }
    }

}
```

### 返回结果

```json
{
  "data": {
    "lastName": "测试",
    "accountId": 1,
    "realmId": 1,
    "clientId": "client_id",
    "tenantName": "xx",
    "realmName": "xx",
    "namespace": "local",
    "tenantId": 1,
    "nickNameCn": "测试",
    "tenantUserId": "1",
    "account": "cs-xxx",
    "employeeCode": "GE_0bd0c7e84baa4dxxxxxxxf334e6f"
  },
  "success": true,
  "responseMessage": "成功",
  "responseCode": "0"
}
```

| 参数名	| 类型	| 说明	|
| --- | --- | --- |
| accountId	|int	|账号id|
| realmId	|int	|租户id|
| clientId	|string	|应用id|
| tenantName	|string	|租户名称|
| realmName	|string	|租户名称|
| namespace	|string	|租户命名空间|
| tenantId	|int	|租户id|
| tenantUserId	|string	|租户用户id|
| account	|string	|账号|
| employeeCode	|string	|员工编码|






