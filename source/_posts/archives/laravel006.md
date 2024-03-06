---
layout: butt
title: laravel框架的第三方账号解决方案
date: 2024-03-06 14:30:28
tags:
category: Laravel
cover: /images/laravel.webp
---

# 前言

{% note purple 'fa-solid fa-lightbulb' flat %}
其实第三方账号登陆已经是一个老生常谈的问题了，网上的解决方案也有很多，比如适配器模式，桥接模式等等。
个人`laravel`使用的`auth`包，是`passport`,里面可以自定义`auth`的`guard`，`provider`等等。
就可以为`passport`添加各种第三方登陆的功能。
{% endnote %}

> 相关文档：[laravel/passport](https://learnku.com/docs/laravel/10.x/passport)

# 实现

其实实现也非常简单，对应的 `guard` 和 `provider` 都是可以自定义的。
而且 对应的自定义 `provider` 只需要 实现对应的 `UserProviderInterface` 接口即可。
以 `IRS` 为例，我们可以自定义一个 `IrsUserProvider` 类，实现 `UserProviderInterface` 接口。

```php
<?php

namespace App\Passport;

use App\Handlers\IRSUserHandler;
use App\Handlers\IRSV2UserHandler;
use App\Models\User;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use Psr\Http\Message\ServerRequestInterface;
use Sk\Passport\UserProvider;

class IRSV2UserProvider extends UserProvider
{
    public function validate(ServerRequestInterface $request)
    {
        $this->validateRequest($request, [
            'token' => 'required|string',
        ]);
    }

    public function retrieve(ServerRequestInterface $request)
    {
        $inputs = $this->only($request, [
            'token',
        ]);
        try {
            [$user, $info] = IRSV2UserHandler::verify($inputs['token']);
        } catch (\Exception | GuzzleException $exception) {
            return yzz_response_error('IRS-V2 用户验证失败', 401);
        }
        return $user;
    }

}
```

然后在 `config/auth.php` 中添加对应的 `passport->clients->irs-v2` 配置。

```php
    'passport' => [
        'clients' => [
            'irs-v2' => [
                'id' => env('PASSPORT_IRS_CLIENT_ID'),
                'secret' => env('PASSPORT_IRS_CLIENT_SECRET')
            ],
        ]
    ]
```

然后在 `config/passportgrant.php` 中添加对应的 `grant` 配置。

```php
    'grant' => [
        'irs-v2-social' => \App\Passport\IRSV2UserProvider::class,
    ]
```

最后在控制器里面使用 `passport` 的 `auth` 方法即可。

```php
    public function storeByIRSV2(ServerRequestInterface $request): mixed
    {
        $parsedBody = $request->getParsedBody();
        $ticket = $parsedBody['ticketId'];
        $appId = $parsedBody['appId'];
        try {
            $accessToken = $this->getAccessToken($ticket, $appId);
        } catch (AuthenticationException $e) {
            throw $e;
        }
        try {
//            $accessToken = "0d53b4f6ece242f2b0be91352a124c71";
            $request = $request->withParsedBody(array(
                'token' => $accessToken,
                'grant_type' => 'irs-v2-social',
                'client_id' => config('auth.passport.clients.irs-v2.id'),
                'client_secret' => config('auth.passport.clients.irs-v2.secret'),
            ));
            $response = json_decode($this->issueToken($request)->content(), true);
            return response_success('OK',$response);


        } catch (\Exception $exception) {
            return $exception->getMessage();
        }
    }
```
