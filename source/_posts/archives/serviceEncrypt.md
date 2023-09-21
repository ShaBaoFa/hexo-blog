---
layout: butt
title: 服务通信加解密之SM3+SM4
date: 2023-09-20 16:51:45
tags:
categories:
    - PHP
    - ThreeParty
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
服务间通信是现代分布式系统中非常重要的一部分，在应用过于庞大的时候，拆分成多个服务是必然的趋势。而微服务的出现，使得服务间通信变得更加频繁。服务间通信的安全性也是非常重要的一部分。本文将介绍如何使用SM3、SM4算法对服务间通信进行加解密。
{% endnote %}

# SM3
## 介绍
SM3密码杂凑算法是中国国家密码管理局2010年公布的中国商用密码杂凑算法标准。具体算法标准原始文本参见参考文献[1]。该算法于2012年发布为密码行业标准(GM/T 0004-2012)，2016年发布为国家密码杂凑算法标准(GB/T 32905-2016)。

SM3适用于商用密码应用中的数字签名和验证，是在SHA-256基础上改进实现的一种算法，其安全性和SHA-256相当。SM3和MD5的迭代过程类似，也采用Merkle-Damgard结构。消息分组长度为512位，摘要值长度为256位。

整个算法的执行过程可以概括成四个步骤：消息填充、消息扩展、迭代压缩、输出结果。

既然是存在压缩，则该加密算法不可逆。

## PHP代码实现
### 加密
```php
    public static function SM3($str): string
    {
        return openssl_digest($str, "sm3", true);
    }
```

# SM4
## 介绍
> 密码算法中常用的一些数据单位：
位/比特/bit:指一个**二进制位**。
字节/byte:1字节=8位
字/word:1字=4字节=32位

SM4 是一种分组密码算法，其分组长度为128位（即16字节，4字），密钥长度也为128位（即16字节，4字）。其加解密过程采用了32轮迭代机制（与DES、AES类似），每一轮需要一个轮密钥（与DES、AES类似）。

SM4 是一种可逆的算法，常用于加密传输数据，之后通过解密获取具体数据。

## PHP代码实现
### 加密
```php
    /**
     * @param $str
     * @return string
     */
    public static function SM4($str): string
    {
        $key = config('irs.contract.key');
        // 把$key按16进制转换成2进制
        $key = hex2bin($key);
        $encrypt = openssl_encrypt($str, 'sm4-ecb', $key);
        \Log::info('加密后：' . $encrypt);
        $decrypt = openssl_decrypt($encrypt, 'sm4-ecb', $key);
        \Log::info('解密后：' . print_r($decrypt, true));
        return $encrypt;
    }
```
### 解密
```php
    /**
     * @param $str
     * @return string
     */
    public static function SM4decode($str): string
    {
        $key = config('irs.contract.key');
        // 把$key按16进制转换成2进制
        $key = hex2bin($key);
        $decrypt = openssl_decrypt($str, 'sm4-ecb', $key);
        \Log::info('解密后：' . print_r($decrypt, true));
        return $decrypt;
    }
```

# 实际用例
比如有 A、B、C、D 4个 微服务需要互相通信（默认不在同一个内网中）
先为每一个服务分配一个接入码（`appid`）
为了能复用代码逻辑
这里建议请求参数统一为 `json` 格式
```json
{
    "appid": "appid",
    "data": "data",
    "sign": "sign",
    "time": "time"
}
```

| 参数名   | 说明                                                      |
|-------|---------------------------------------------------------|
| appid | 分配的`接入码`                                                  |
| data  | 请求结构体 `SM4` 加密字符串 `Base64`                  |
| sign  | SM3(`appid`+`time`+`secret`)，<br/>将资源接入代码、发送时间、业务密钥按顺序连接并进行 sm3 加密。<br/>注:1、参数 secret 由平台提供;<br/>2、sm3 加密结果格式为 `base64` |
| time  | 请求时间 **13** 位时间戳<br/>`1622613901983`                                       |

# 总结
## 优势：

- 数据完整性：使用SM3进行签名生成可以验证数据的完整性，确保数据在传输过程中没有被篡改。

- 数据机密性：使用SM4进行加密可以保护数据的机密性，确保只有授权的用户可以解密和访问数据。

- 安全性：SM3和SM4都是中国国家密码管理局发布的密码算法标准，经过广泛的安全审查和测试。它们在满足一定的安全要求方面表现良好。

- 符合法规要求：在一些国家或行业中，对数据安全性有严格的法规和标准要求。使用符合标准的密码算法可以帮助遵守这些法规。

## 劣势：

- 复杂性：使用SM3和SM4需要实现和维护相应的密码库，这可能会增加开发和维护的复杂性。

- 性能：加密和签名操作通常会引入一些计算开销，可能会对系统性能产生一定的影响。因此，需要在安全性和性能之间进行权衡。

- 配置和管理：需要适当地配置和管理加密和签名的密钥，以确保安全性。不正确的密钥管理可能导致安全漏洞。

- 互操作性：如果与其他系统或服务进行通信，需要确保它们也支持相同的加密和签名算法，以确保互操作性。