---
title: Oss利用STS上传文件的全生命周期
date: 2023-11-21 21:40:44
cover: /images/OSS/cover.jpg
tags:
  - OSS
  - Cloud
category: Aliyun
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
`OSS`是阿里云提供的对象存储服务，可以用来存储各种文件。
上个月接到了一个需求，在一套原有的代码基础上，新增了Oss的文件上传功能。
想想这不是很轻松？然后我交给了新来的后端同事。
结果令我有点没想到，他居然是先文件穿到应用服务器，然后再上传到Oss。
这种操作方式对应用服务器的带宽压力很大，特别是大文件的时候，会需要修改php.ini的配置等等等等。并且还有内存溢出的问题。
最后不得不我自己来写了。
为此我写一份OSS的上传全流程，部分照搬了阿里的文档。
也是方便我自己以后查阅和流程巩固。
{% endnote %}

# 使用STS临时访问凭证访问OSS
STS（Security Token Service）临时访问凭证是一种安全机制，用于在云计算环境中提供短期的访问授权。它允许用户或服务以安全的方式获得有限的和临时的访问权限。以下是获取STS临时访问凭证的基本步骤：

1. **身份验证**：首先，用户或服务需要通过身份验证。这通常涉及提供用户名和密码，或使用现有的身份验证机制（如OAuth）。

2. **请求临时凭证**：一旦身份验证成功，用户或服务可以向STS请求临时访问凭证。这个请求通常需要包括身份验证信息和请求访问的资源或服务的详情。

3. **定义访问策略**：在请求临时凭证时，需要定义一个访问策略。这个策略规定了用户或服务可以访问哪些资源，以及可以执行哪些操作。

4. **STS处理请求**：STS收到请求后，会验证请求的合法性，并根据提供的访问策略生成一个临时访问凭证。

5. **颁发临时凭证**：一旦验证和生成完毕，STS会向请求者提供一个临时访问凭证。这个凭证通常包括访问密钥、秘密密钥和一个安全令牌。

6. **使用临时凭证**：用户或服务可以使用这个临时访问凭证来访问指定的云资源。凭证通常有时间限制，过期后将失效。

7. **凭证过期**：一旦临时访问凭证过期，用户或服务将无法再使用该凭证访问云资源。如果需要继续访问，必须重新进行身份验证并请求新的临时凭证。

通过这种方式，STS临时访问凭证提供了一种灵活且安全的方式来管理对云资源的访问，确保只有授权用户或服务才能在指定时间内访问敏感数据或功能。

{% mermaid %}
sequenceDiagram
participant 用户 as User (App)
participant 应用服务器 as Application Server
participant 身份验证系统 as Authentication System
participant STS as Security Token Service
participant 云资源 as Cloud Resources

    用户->>身份验证系统: 提供身份验证信息（用户名和密码/OAuth等）
    身份验证系统->>用户: 身份验证成功

    用户->>应用服务器: 请求访问云资源
    应用服务器->>STS: 请求临时访问凭证（包括身份信息和访问策略）
    STS->>应用服务器: 处理请求并验证合法性
    STS->>应用服务器: 颁发临时访问凭证（访问密钥、秘密密钥和安全令牌）

    应用服务器->>用户: 提供临时访问凭证
    用户->>云资源: 使用临时凭证访问/上传数据
    Note over 云资源: 凭证通常有时间限制

    Note over 用户,云资源: 凭证过期后无法访问<br>需要重新进行身份验证

{% endmermaid %}

# 创建RAM用户
1. 登录[RAM控制台](https://ram.console.aliyun.com/?spm=a2c4g.11186623.0.0.19f62289hsuJvD)。
2. 在左侧导航栏，选择**身份管理**>**用户**。
3. 单击**创建用户**。
4. 输入**登录名称**和**显示名称**。
5. 在`访问方式`区域下，选择**OpenAPI调用访问**，然后单击**确定**。
6. 单击**复制**，保存访问密钥（AccessKey ID 和 AccessKey Secret）。

# 为RAM用户授予请求AssumeRole的权限

1. 单击已创建RAM用户右侧对应的**添加权限**。
2. 在**添加权限**页面，选择**AliyunSTSAssumeRoleAccess**系统策略。
3. 单击**确定**。

# 创建用于获取临时访问凭证的角色

1. 在左侧导航栏，选择**身份管理>角色**。
2. 单击**创建角色**，选择可信实体类型为**阿里云账号**，单击**下一步**。
3. 在**创建角色**对话框，**角色名称**填写为`RamOssTest`（你想要的角色名称），**选择信任的云账号**为**当前云账号**。
4. 单击**完成**。角色创建完成后，单击**关闭**。
5. 在**角色**页面，搜索框输入角色名称`RamOssTest`，然后单击`RamOssTest`。
6. 单击ARN右侧的**复制**，保存角色的ARN。

# 为角色授予上传文件的权限

## 创建上传文件的自定义权限策略。

1. 在左侧导航栏，选择**权限管理>权限策略**。
2. 在**权限策略**页面，单击**创建权限策略**。
3. 在**创建权限策略**页面，单击**脚本编辑**，然后在策略文档输入框中赋予角色向目标存储空间`examplebucket`下的`src`以及`dest`目录上传文件的权限。具体配置示例如下。
```json
{
    "Version": "1",
    "Statement": [
     {
           "Effect": "Allow",
           "Action": [
             "oss:PutObject"
           ],
           "Resource": [
             "acs:oss:*:*:examplebucket/src/*",
             "acs:oss:*:*:examplebucket/dest/*"
           ]
     }
    ]
}
```
4. 策略配置完成后，单击**继续编辑基本信息**。
5. 在**基本信息**区域，填写**策略名称**`为RamTestPolicy`，然后单击**确定**。

## 为RAM角色RamOssTest授予自定义权限策略

1. 在左侧导航栏，选择**身份管理 > 角色**。

2. 在**角色**页面，找到目标RAM角色`RamOssTest`。

3. 单击RAM角色`RamOssTest`右侧的添加权限。

4. 在**添加权限**页面下的**自定义策略**页签，选择已创建的自定义权限策略`RamTestPolicy`。

5. 单击**确定**。

# 获取临时访问凭证

## 使用STS SDK

### 安装STS SDK for PHP

```shell
composer require alibabacloud/sts-20150401
```

### 获取 临时访问凭证

```php
        try {
            $config = new Config([
                'accessKeyId' => 'RAM账户的AK',
                'accessKeySecret' => 'RAM账户的SK'
            ]);
            // 杭州endpoint
            $config->endpoint = "sts.cn-hangzhou.aliyuncs.com";
            $client = new Sts($config);
            $assumeRoleRequest = new AssumeRoleRequest([
                // roleArn填写步骤2获取的角色ARN，例如acs:ram::175708322470****:role/ramtest。
                "roleArn" => "acs:ram::17534196--------:role/ramossuploader",
                // roleSessionName用于自定义角色会话名称，用来区分不同的令牌，例如填写为sessiontest。
                "roleSessionName" => "ossuploader",
                // durationSeconds用于设置临时访问凭证有效时间单位为秒，最小值为900，最大值以当前角色设定的最大会话时间为准。本示例指定有效时间为3000秒。
                "durationSeconds" => 3000,
                // policy填写自定义权限策略，用于进一步限制STS临时访问凭证的权限。如果不指定Policy，则返回的STS临时访问凭证默认拥有指定角色的所有权限。
                // 临时访问凭证最后获得的权限是步骤4设置的角色权限和该Policy设置权限的交集。
                // 可以根据业务需要，通过设置不同的Policy来获得不同的权限。
//              "policy" => ""
            ]);
            $runtime = new RuntimeOptions([]);
            $result = $client->assumeRoleWithOptions($assumeRoleRequest, $runtime);
            printf("AccessKeyId:" . $result->body->credentials->accessKeyId . PHP_EOL);
            printf("AccessKeySecret:" . $result->body->credentials->accessKeySecret . PHP_EOL);
            printf("Expiration:" . $result->body->credentials->expiration . PHP_EOL);
            // 格林尼治时间，需要转换为北京时间(使用carbon)
            printf("Expiration:" . Carbon::parse($result->body->credentials->expiration)->addHours(8) . PHP_EOL);
            printf("SecurityToken:" . $result->body->credentials->securityToken . PHP_EOL);
        } catch (\Exception $e) {
            \Log::error(['error mes : ' => $e->getMessage()]);
        }
```

- 返回结果

| Key              | Value                        | Explanation          |
|------------------|------------------------------|----------------------|
| AccessKeyId      | STS.****************        | 临时 Access Key ID     |
| AccessKeySecret  | ****************oyH6        | 临时 Secret Access Key |
| Expiration       | 2023-11-22 12:07:04         | Token 过期时间           |
| SecurityToken    | CAIS+****************oyH6   | Security Token       |

# 使用临时访问凭证上传文件并配置回调地址

## 流程图

{% mermaid %}
sequenceDiagram
participant 用户 as User/App
participant OSS as Aliyun OSS
participant 回调服务器 as Callback Server

    用户->>OSS: 使用STS token 上传文件并设置回调地址
    OSS->>回调服务器: 访问回调地址
    回调服务器->>OSS: 返回处理结果
    OSS->>用户: 将回调信息返回给前端
{% endmermaid %}


## 使用 OOS SDK

### 安装OOS SDK for PHP

```shell
composer require aliyuncs/oss-sdk-php
```

### 使用临时访问凭证上传文件+配置回调地址

```php
        // 从环境变量中获取访问凭证。运行本代码示例之前，请确保已通过环境变量设置临时访问密钥（OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET）以及安全令牌（OSS_SESSION_TOKEN）。
        $accessKeyId = 'AccessKeyId';
        $accessKeySecret = ‘AccessKeySecret’;
        $securityToken = ‘securityToken’;
        // yourEndpoint填写Bucket所在地域对应的Endpoint。以华东1（杭州）为例，Endpoint填写为https://oss-cn-hangzhou.aliyuncs.com。
        $endpoint = "https://oss-cn-hangzhou.aliyuncs.com";
        // 填写Bucket名称。
        $bucket = "BucketName";
        // 填写不包含Bucket名称在内的Object完整路径。
        $object = "exampleobject.txt";
        // 填写上传的字符串。
        $content = "Hello OSS";
        try {
            $client = new OssClient($accessKeyId, $accessKeySecret, $endpoint, false, $securityToken);
            // 上传文件时设置回调。
            // callbackUrl为回调服务器地址，例如https://oss-demo.aliyuncs.com:23450。
            //（可选）callbackHost为回调请求消息头中Host的值，即您的服务器配置Host的值。
            $url = '{
        "callbackUrl":"https://callbackHost/api/v1/oss/callback",
        "callbackBody":"bucket=${bucket}&object=${object}&etag=${etag}&size=${size}&mimeType=${mimeType}&imageInfo.height=${imageInfo.height}&imageInfo.width=${imageInfo.width}&imageInfo.format=${imageInfo.format}&my_var1=${x:var1}&my_var2=${x:var2}",
        "callbackBodyType":"application/x-www-form-urlencoded"
    }';

// 设置发起回调请求的自定义参数，由Key和Value组成，Key必须以x:开始。
            $var ='{
        "x:var1":"value1",
        "x:var2":"value2"
    }';
            $options = array(
                OssClient::OSS_CALLBACK => $url,
                OssClient::OSS_CALLBACK_VAR => $var
            );
            $result = $client->putObject($bucket, $object, $content,$options);
            print("put object success.\n");
            print_r($result['body']);
            print_r($result['info']);
        } catch (\Exception $e) {
            print("put object failed.\n");
            print($e->getMessage() . "\n");
        }
```

### 回调地址接收到的参数
1. 配置路由（OSS POST 进行回调）
```php
        Route::post('oss/callback', [\App\Http\Controllers\Api\V1\OssController::class, 'callback'])
            ->name('oss.callback');
```
2. 回调接收方法
```php
    /**
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function callback(Request $request)
    {
        \Log::info(['oss callback request' => $request->all()]);
        // 可以将回调信息存储到数据库中 并且 返回给前端（回调方法返回的信息 会通过OSS返回到前端）
        return response()->json(['code' => 200, 'message' => 'success']);
    }
```
