---
layout: butt
title: 浙里办-IRS用户接入手册
date: 2023-09-19 17:15:40
tags:
category: ThreeParty
cover: /images/zlb.png
---

# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
这是一篇关于浙里办-IRS用户接入手册的文章，目前浙里办经历了`IDasS`,`ESSO`,`IRSV1`,终于终于，来到了`IRSV2`，我不确定会不会有V3，V4。
先将原始文档进行通熟易懂化再说吧。
在阅读文档前，请先确定你正确获取了 浙里办 的 `AK` 和 `SK`
{% endnote %}

# 公共应用组件调用
## 调用说明
组件超市页面展示的调用地址类似：`https://bcdsg.zj.gov.cn:8443/restapi/prod/*` 地址，采用下面的方式进行调用。
## 网关说明
业务协同网关对上游接口只增加网关层面的鉴权校验，不对返回结果做任何包装
## API鉴权参数说明
请求业务协同和数据共享网关的每个HTTP请求都必须在请求头（HTTP Header）中设置如下4个参数：

| 参数名 | 说明 | 类型 | 是否必填 |
| --- | --- | --- | --- |
| X-BG-HMAC-SIGNATURE | API输入参数签名结果 | String | 是 |
| X-BG-HMAC-ALGORITHM | 签名的摘要算法，当前仅支持hmac-sha256。 | String | 是 |
| X-BG-HMAC-ACCESS-KEY | 分配给应用的accessKey，例如：12345678。 | String | 是 |
| X-BG-DATE-TIME | 时间戳，时区为GMT+8，格式为：Tue, 09 Nov 2021 08:49:20 GMT。API服务端允许客户端请求最大时间误差为90秒。 | String | 是 |

**JAVA 代码**
```java
signature = HMAC-SHA256-HEX(secret_key,signing_string)
```
**PHP 代码**
```php
// HMAC-SHA256-HEX
$hash = hash_hmac('sha256', $signing_string, $secret);
$sign_string = base64_encode(hex2bin($hash));
```

**各字段解释如下：**

1. `secret_key`为接口申请完成后获取到的`secret_key`
2. `signing_string`由`请求方法`、`URI`、`请求参数`等拼接获得，具体如下：

> HTTP_METHOD+\n+HTTP_URI+\n+QUERY_STREAM+\n+X-BG-HMAC-ACCESS-KEY+\n+X-BG-DATE

**参数解释如下图**

| 参数名 | 说明 |
| --- | --- |
| HTTP Method | 指 HTTP 协议中定义的 GET、PUT、POST 等请求方法，必须使用全大写的形式。 |
| HTTP URI | 请求路径，要求必须以“/”开头，不以“/”开头的需要补充上，空路径为“/” |
| X-BG-DATE | 请求头中的 Date （ GMT 格式 ）格式为：“Tue, 09 Nov 2021 08:49:20 GMT” |
| QUERY_STREAM | 是对于 URL 中的 query（ query 即 URL 中?后面的 key1=valve1&key2=valve2 字符串）进行编码后的结果。以 key 按照字典顺序（ ASCII 码由小到大）排序，并使用 & 符号连接起来，生成相应的query_string。 |

**PHP具体加密代码如下**
```php
public static function encryptHeaders($path = '', $ak = null, $sk = null): array
    {
        $signing_string = '';
        $access_key = is_null($ak) ? config('irs.contract.appid') : $ak;
        $secret = is_null($sk) ? config('irs.contract.key') : $sk;
        $method = "POST";
        // carbon to GMTString
        $time = Carbon::now()->toRfc7231String(); //"Mon, 17 Jul 2023 06:12:47 GMT";
        $queryArray = array();
        sort($queryArray);
        $queryString = implode("&", $queryArray);

        $signing_string .= $method . "\n";
        $signing_string .= $path . "\n";
        $signing_string .= $queryString . "\n";
        $signing_string .= $access_key . "\n";
        $signing_string .= $time . "\n";
        // HMAC-SHA256-HEX
        $hash = hash_hmac('sha256', $signing_string, $secret);
        $sign_string = base64_encode(hex2bin($hash));
        $headers = [
            'X-BG-HMAC-SIGNATURE' => $sign_string,
            'X-BG-HMAC-ALGORITHM' => 'hmac-sha256',
            'X-BG-HMAC-ACCESS-KEY' => $access_key,
            'X-BG-DATE-TIME' => $time,
        ];
        return $headers;
    }
```

**使用PostMan工具测试**
1.  设置Per-request-Script
```javascript
var accessKey = "xxxx";  //这里替换为自己申请的accessKey
var secret="xxxx";  //这里替换为自己申请的secretKey
var path = pm.request.url.getPath();
var query=pm.request.url.query;
var queryArray=[];
for(index in query.members){
    var member= query.members[index];
    var value = member["value"];
    if(member["value"]==null){
        value = ""
    }
    var queryKeyValue = encodeURI(member["key"])+"="+encodeURI(value);
    queryArray.push(queryKeyValue);
}
queryArray.sort();
var queryString = queryArray.join("&");
var date = (new Date()).toGMTString();
//var date='Wed, 09 Mar 2022 01:58:54 GMT';
var singString = pm.request.method+"\n"+path+"\n"+queryString+"\n"+accessKey+"\n"+date+"\n";
var hash = CryptoJS.HmacSHA256(singString, secret);
var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
pm.environment.set("X-BG-HMAC-ACCESS-KEY",accessKey);
pm.environment.set("X-BG-HMAC-SIGNATURE",hashInBase64);
pm.environment.set("X-BG-HMAC-ALGORITHM","hmac-sha256");
pm.environment.set("X-BG-DATE-TIME",date);
```
2.  设置请求头 
```shell
X-BG-HMAC-ACCESS-KEY : {{X-BG-HMAC-ACCESS-KEY}}
X-BG-HMAC-SIGNATURE : {{X-BG-HMAC-SIGNATURE}}
X-BG-HMAC-ALGORITHM : {{X-BG-HMAC-ALGORITHM}}
X-BG-DATE-TIME : {{X-BG-DATE-TIME}}
```

**网关返回异常说明：**
- **签名计算错误**
      - 返回体为：`{"message":"Invalid signature"}`，http状态码为 {% label 401 blue %}
- **accessKey不存在**
      - 返回体为：`{"message":"Invalid access key"}`，http状态码为 {% label 401 blue %}
- **签名超时**（默认一次签名90秒有效，建议调用一次实时计算）
      - 返回体为：`{"message":"Clock skew exceeded"}`，http状态码为 {% label 401 blue %}
- **接口未授权**
      - 返回体为：`{"message":"The route_id is forbidden."}`，http状态码为 {% label 401 blue %}

---

# 接入IRS登录业务

## 接入流程
1. IRS应用管理员通过“浙里办”单点登录组件详情页面提交申请审核。 `https://csss.zj.gov.cn/comDetail?comId=958289093569708032`
2. 组件申请通过后，IRS应用管理员通过IRS系统工作台获取AK&SK。 `https://irs.zj.gov.cn/workbench/myresource/appcomponent`
3. IRS应用管理员通过IRS应用发布注册获取应用发布ID(appid) `https://irs.zj.gov.cn/workbench/myresource/applicationsystem`
4. 非IRS应用发布部署应用系统，应用管理员携带AK&SK联系“浙里办”技术支持对 接分配 appid。

## 接入示例
{% mermaid %}
sequenceDiagram
participant 业务系统
participant “浙里办”用户体系
“浙里办”用户体系->>业务系统: 1. 获取“浙里办” 统一单点登录 密钥（AK/SK）
activate “浙里办”用户体系
“浙里办”用户体系->>业务系统: 2. 获取“浙里办” 移动端、PC端 票据信息（ticketID）
deactivate “浙里办”用户体系
activate 业务系统
业务系统->>“浙里办”用户体系: 3.1 根据票据换取“浙里办”用户令牌（token）
deactivate 业务系统
activate “浙里办”用户体系
“浙里办”用户体系-->>业务系统: 3.2 返回“浙里办”令牌（token）
deactivate “浙里办”用户体系
activate 业务系统
业务系统->>“浙里办”用户体系: 4.1 根据令牌换取“浙里办”用户信息
deactivate 业务系统
activate “浙里办”用户体系
“浙里办”用户体系-->>业务系统: 4.2 返回“浙里办”用户信息
deactivate “浙里办”用户体系
activate 业务系统
loop
业务系统->>业务系统: 5.完成测试环境联调，切换正式环境
end
deactivate 业务系统
{% endmermaid %}

## 移动端接入
移动端接入“浙里办”APP、“浙里办”微信小程序、“浙里办”支付宝小程序，单点 登录可通过使用 ZWJSBridge 参考下述代码块
```javascript
if (ZWJSBridge.ssoTicket) {
      const ssoFlag = await ZWJSBridge.ssoTicket({});
      if (ssoFlag && ssoFlag.result === true) {
//使用 IRS“浙里办”统一单点登录组件 
            if (ssoFlag.ticketId) {
// TODO 应用方服务端单点登录接口 
            } else {
//异常情况:当前环境不支持 “浙里办”统一单点登录
            }
      } else {
//异常情况:ZWJSBridge 加载异常 
      }
}
```
1. 移动端票据(`ticketId`)由用户进入服务时携带，H5 微应用可通过 `ZWJSBridge.ssoTicket` 获取相关参数:`result` 指容器环境是否支持“浙里办”统一单 点登录，`ticketId` 指“浙里办”统一单点登录票据。
2. IRS应用发布注册未审核上架“浙里办”的H5微应用，通过单点登录获取为测试 用户数据。发布上架后，可获取正式用户数据。

## PC端接入
PC 端接入浙江政务服务网单点登录，通过请求统一单点登录入口 **`url`** 地址返回票据 (`ticketId`)至应用系统配置的回调地址进行业务处理获取用户信息。

### PC接入流程图

{% mermaid %}
sequenceDiagram
participant 应用系统
participant 单点登录
alt 已登录
activate 应用系统
loop
应用系统->>应用系统: 业务应用操作
end
else 未登录
应用系统->>-单点登录: 跳转统一登录地址
activate 单点登录
单点登录->>单点登录: 用户登录
单点登录->>应用系统: 携带票据跳转回调地址
deactivate 单点登录
activate 应用系统
应用系统->>单点登录: 票据认证
activate 单点登录
单点登录-->>应用系统: 返回令牌token
deactivate 单点登录
应用系统->>单点登录: 根据令牌获取用户信息
activate 单点登录
单点登录-->>应用系统: 返回用户信息
deactivate 单点登录
应用系统->>应用系统: 生成登录状态
deactivate 应用系统
end

{% endmermaid %}

1. 提交IRS工单(分类:“浙里办”应用发布) `https://irsform.zj.gov.cn/flowable-web/zhejiangOrder/startOrder` 附 `组件AK`、`PC端回调地址`、`IRS应用编码`、`IRS应用发布appid信息`，`配置PC端回调地址`。 
2. PC端统一登录地址 `https://portal.zjzwfw.gov.cn/uc/sso/login?appId=${appId}&sp=${sp}`
3. PC端统一登出地址 `https://portal.zjzwfw.gov.cn/uc/unifiedLogout`
4. 跳转统一登录地址时`appId`传入在IRS应用发布注册的应用发布ID，`sp`会作为返回参数，传给回调地址。
> 注意:sp 地址中如需要带参数和符号如?、&、#等，需进行 url 编码处理。
5. 通过统一登录地址登录成功后，浙里办用户中心会将票据ticket(参数名为 `ticketId`)以及重定向地址(参数名为 `redirectUrl`)以 `GET` 方式回调应用系统PC端`回调地址`，接入系统收到票据之后调用票据认证接口进行票据认证。

# 总结
具体获取`token`接口和获取`用户信息`接口请以实际对接的文档为准。