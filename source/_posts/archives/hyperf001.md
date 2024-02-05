---
layout: butt
title: hyperf微服务实战
date: 2024-01-30 16:53:12
category: Hyperf
cover: /images/hyperf.jpeg
---
# 前言

{% note purple 'fa-solid fa-lightbulb' flat %}
最近在学习 `hyperf` 框架，公司有个项目需要用到 微服务(基于RPC多路复用)，所以就学习了一下。
[李铭昕老师的微服务实战视频](https://www.bilibili.com/video/BV1wN4y1q7kQ)
我这里为了巩固自己的知识，所以把视频中的代码敲了一遍，顺便记录一下。
{% endnote %}

# 基础平台-用户服务
## 安装rpc多路复用
```shell
## 多路复用RPC
composer require hyperf/rpc-multiplex -W
## rpc日志监听
composer require hyperf/rpc-log-listener
```
### 添加监听器
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
use Hyperf\Command\Listener\FailToHandleListener;
use Hyperf\ExceptionHandler\Listener\ErrorExceptionHandler;

return [
    ErrorExceptionHandler::class,
    FailToHandleListener::class,
    // RPC Event Listener
    Hyperf\RPCLogListener\RPCEventListener::class,
];
```


> 下面这个写法是为了让 `composer` 使用指定的 `php` 版本
> `which composer` 只会指定到 `PATH` 最左边的的路径, 如果想用最新的需要调整 `PATH` 位置（请注意）
## 安装common（私用）
```shell
## 安装common（私用）
php81 $(which composer) require wlfpanda1012/plt-common
```

## 安装常用组件
```shell
## 安装常用组件
composer require limingxinleo/hyperf-utiles -W
## 验证工具
composer require hyperf/validation -W
## swagger
composer require hyperf/swagger -W
## 加解密组件
composer require limingxinleo/i-encryption -W
```

## 安装微信组件
```shell
## 安装微信组件（实现map代理类）
composer require limingxinleo/easywechat-classmap -W
## 安装微信组件(注意: 作者已停止维护阿里云的composer,用国内镜像请调整至腾讯源)
composer require w7corp/easywechat -W
```
> [腾讯软件源](https://mirrors.tencent.com/help/composer.html)
## composer 镜像使用帮助
### 切换镜像指向
```shell
composer config repo.packagist composer https://mirrors.tencent.com/composer/
```
###composer 安装教程
```shell
## 安装composer
php -r "copy('https://install.phpcomposer.com/installer', 'composer-setup.php');"
## 验证安装文件
php -r "if (hash_file('sha384', 'composer-setup.php') === 'e0012edf3e80b6978849f5eff0d4b4e4c79ff1609dd1e613307e16318854d24ae64f26d17af3ef0bf7cfb710ca74755a') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
## 安装
php composer-setup.php
## 删除安装文件
php -r "unlink('composer-setup.php');"
```


## 创建RPC服务
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\RPC;

use Hyperf\RpcMultiplex\Constant;
use Hyperf\RpcServer\Annotation\RpcService;
use Wlfpanda1012\PltCommon\RPC\User\UserInterface;

#[RpcService(name: UserInterface::NAME, server: 'rpc', protocol: Constant::PROTOCOL_DEFAULT)]
class UserService implements UserInterface
{
    public function ping(): bool
    {
        return true;
    }
}
```

## 安装数据库
```shell
```php
## 创建migration
php81 bin/hyperf.php gen:migration create_some_table
## 运行migration
php81 bin/hyperf.php migrate
## 生成模型
php81 bin/hyperf.php gen:model
```
## user id 非自增
```shell
## 安装 id 生成器
php81 $(which composer) require "hyperf/snowflake:3.1.*" -W
```

## 微信小程序登录（可扩展）
> 配置文件 `config/autoload/wechat.php`（需修改）
> 因为可能会需要对应多个appid所以在配置文件中 appid作为key,方便扩展。
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
use function Hyperf\Support\env;

return [
    env('WECHAT_APP_ID') => [
        /**
         * 账号基本信息，请从微信公众平台/开放平台获取.
         */
        'app_id' => env('WECHAT_APP_ID'),         // AppID
        'secret' => env('WECHAT_APP_SECRET'),     // AppSecret
        'token' => 'your-token',          // Token
        'aes_key' => '',                    // EncodingAESKey，兼容与安全模式下请一定要填写！！！
        'use_stable_access_token' => false,
        'http' => [
            'throw' => true, // 状态码非 200、300 时是否抛出异常，默认为开启
            'timeout' => 5.0,
            // 'base_uri' => 'https://api.weixin.qq.com/', // 如果你在国外想要覆盖默认的 url 的时候才使用，根据不同的模块配置不同的 uri

            'retry' => true, // 使用默认重试配置
            //  'retry' => [
            //      // 仅以下状态码重试
            //      'status_codes' => [429, 500]
            //       // 最大重试次数
            //      'max_retries' => 3,
            //      // 请求间隔 (毫秒)
            //      'delay' => 1000,
            //      // 如果设置，每次重试的等待时间都会增加这个系数
            //      // (例如. 首次:1000ms; 第二次: 3 * 1000ms; etc.)
            //      'multiplier' => 3
            //  ],
        ],
    ],
];
```
## WechatService
> 将上一个项目的` WechatService.php` 复制到当前项目的 `app/Service` 目录下
> 将 wechat 配置文件 注入进来。
> 再写一个 `init` 方法进行 **configs** 的初始化 因为使用了代理模式所以不会出现重复初始化的问题。
> 为了初始化,我们需要写一个监听类
```shell
php bin/hyperf.php gen:listener MainCoroutineServerStartListener
```

通过阅读`easywechat`源码
```php
<?php

declare(strict_types=1);

namespace EasyWeChat\Kernel\Traits;

use EasyWeChat\Kernel\Config;
use EasyWeChat\Kernel\Contracts\Config as ConfigInterface;
use EasyWeChat\Kernel\Exceptions\InvalidArgumentException;

use function is_array;

trait InteractWithConfig
{
    protected ConfigInterface $config;

    /**
     * @param  array<string,mixed>|ConfigInterface  $config
     *
     * @throws InvalidArgumentException
     */
    public function __construct(array|ConfigInterface $config)
    {
        $this->config = is_array($config) ? new Config($config) : $config;
    }

    public function getConfig(): ConfigInterface
    {
        return $this->config;
    }

    public function setConfig(ConfigInterface $config): static
    {
        $this->config = $config;

        return $this;
    }
}
```
在 `config` 的构造函数中并没有任何IO,所以不会出现非协程化的IO,使用协程导致的一系列问题。
所以我们可以在 `MainCoroutineServerStartListener` 中进行初始化
```php
<?php

declare(strict_types=1);

namespace App\Listener;

use App\Service\SubService\WeChatService;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Framework\Event\BootApplication;
use Psr\Container\ContainerInterface;
use Hyperf\Event\Contract\ListenerInterface;

#[Listener]
class MainCoroutineServerStartListener implements ListenerInterface
{
    public function __construct(protected ContainerInterface $container)
    {
    }

    public function listen(): array
    {
        return [
            BootApplication::class
        ];
    }

    public function process(object $event): void
    {
        di()->get(WeChatService::class)->init();
    }
}
```
最终实现的 `WeChatService` 如下
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Service\SubService;

use App\Constants\ErrorCode;
use App\Exception\BusinessException;
use EasyWeChat\Kernel\Exceptions\HttpException;
use EasyWeChat\Kernel\Exceptions\InvalidArgumentException;
use EasyWeChat\MiniApp\Application;
use Han\Utils\Service;
use Hyperf\Config\Annotation\Value;
use JetBrains\PhpStorm\ArrayShape;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\DecodingExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

class WeChatService extends Service
{
    #[Value(key: 'wechat')]
    protected array $configs;

    /**
     * @var array<string,Application>
     */
    protected array $apps = [];

    /**
     * 实例化所有配置的微信小程序
     * @throws InvalidArgumentException
     */
    public function init(): void
    {
        foreach ($this->configs as $key => $config) {
            $this->apps[$key] = new Application($config);
        }
    }

    /**
     * 获取到对应的小程序实例
     * @throws BusinessException
     */
    public function get(string $appid): Application
    {
        if (! isset($this->apps[$appid])) {
            throw new BusinessException(ErrorCode::WECHAT_MINI_APP_ID_NOT_EXIST);
        }
        return $this->apps[$appid];
    }

    /**
     * 获取用户登录之后的openid和session_key
     * @param string $code
     * @param string $appid
     * @return array<string,string>
     * @throws TransportExceptionInterface
     * @throws HttpException
     * @throws ServerExceptionInterface
     * @throws RedirectionExceptionInterface
     * @throws DecodingExceptionInterface
     * @throws ClientExceptionInterface
     */
    #[ArrayShape(['openid' => 'string', 'session_key' => 'string'])]
    public function login(string $code, string $appid): array
    {
        $utils = $this->get($appid)->getUtils();
        return $utils->codeToSession($code);
    }
}

```

## 实现common中的 `UserInterface` 接口
> 目前只实现了 `firstByCode` 方法 目的只是实现微服务的调用
> 通过 `code` 获取到 `openid` 再通过 `openid` 获取到用户信息
> 如果用户不存在则创建用户
> 返回用户id
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\RPC;

use App\Constants\ErrorCode;
use App\Exception\BusinessException;
use App\Service\Dao\UserDao;
use App\Service\SubService\WeChatService;
use EasyWeChat\Kernel\Exceptions\HttpException;
use Hyperf\RpcMultiplex\Constant;
use Hyperf\RpcServer\Annotation\RpcService;
use JetBrains\PhpStorm\ArrayShape;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\DecodingExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Wlfpanda1012\PltCommon\Constant\OAuthType;
use Wlfpanda1012\PltCommon\RPC\User\UserInterface;

#[RpcService(name: UserInterface::NAME, server: 'rpc', protocol: Constant::PROTOCOL_DEFAULT)]
class UserService implements UserInterface
{
    public function ping(): bool
    {
        return true;
    }

    /**
     * @throws TransportExceptionInterface
     * @throws HttpException
     * @throws ServerExceptionInterface
     * @throws RedirectionExceptionInterface
     * @throws DecodingExceptionInterface
     * @throws ClientExceptionInterface
     */
    #[ArrayShape(['id' => 'int'])]
    public function firstByCode(string $code, string $appId, int|OAuthType $type = OAuthType::WECHAT_MINI_APP): array
    {
        if (is_int($type)) {
            $type = OAuthType::from($type);
        }
        $res = di()->get(WeChatService::class)->login($code, $appId);
        if (! isset($res['openid'])) {
            throw new BusinessException(ErrorCode::WECHAT_MINI_CODE_INVALID);
        }
        $user = di()->get(UserDao::class)->firstOrCreate($res['openid'], $appId, $type);
        return [
            'id' => $user->id,
        ];
    }
}
```

## 用户登录测试用例
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace HyperfTest\Cases;

use App\RPC\UserService;
use HyperfTest\HttpTestCase;

/**
 * @internal
 * @coversNothing
 */
class UserTest extends HttpTestCase
{
    public function testFirstByCode()
    {
        $user = di()->get(UserService::class)->firstByCode('123', 'xxx', 0);
        $this->assertTrue(isset($user['id']));
    }
}
```
因为实际上我们测试的时候并不会用到 `code` 所以我们需要对 `WeChatService` 进行mock
具体实现写在了 `HttpTestCase` 中
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace HyperfTest;

use App\Service\SubService\WeChatService;
use Hyperf\Testing;
use Mockery;
use PHPUnit\Framework\TestCase;

use function Hyperf\Support\make;

/**
 * Class HttpTestCase.
 * @method get($uri, $data = [], $headers = [])
 * @method post($uri, $data = [], $headers = [])
 * @method json($uri, $data = [], $headers = [])
 * @method file($uri, $data = [], $headers = [])
 */
abstract class HttpTestCase extends TestCase
{
    /**
     * @var Testing\Client
     */
    protected $client;

    protected static bool $init = false;

    public function __construct(string $name)
    {
        parent::__construct($name);
        $this->client = make(Testing\Client::class);
        // $this->client = make(Testing\HttpClient::class, ['baseUri' => 'http://127.0.0.1:9501']);
    }

    public function __call($name, $arguments)
    {
        return $this->client->{$name}(...$arguments);
    }

    protected function setUp(): void
    {
        if (! static::$init) {
            static::$init = true;
            di()->set(WeChatService::class, $wx = Mockery::mock(WeChatService::class . '[login]', [di()]));
            $wx->shouldReceive('login')->withAnyArgs()->andReturn([
                'openid' => 'ce123',
                'session_key' => 'ce456',
            ]);
        }
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }
}
```
当调用 `WeChatService` 的 `login` 方法时,会返回一个固定的 `openid` 和 `session_key`

## 修改 wechat-content-api
因为我们的 `common` 项目中已经定义了 `UserInterface` 接口
并且在 `plt-user` 实现了该接口
我们 `wechat-content-api` 对应的用户接口都由 `plt-user` 提供和实现
所以我们需要修改 `wechat-content-api` 项目

### 安装 common
```shell
## 安装common（私用）
php81 $(which composer) require wlfpanda1012/plt-common
```
### 修改 `composer.json`
```json
{
  "repositories": {
    "common": {
      "type": "path",
      "url": "../plt-common"
    }
  }
}
```
### 安装 rpc-log 监听器
```shell
## rpc日志监听
composer require hyperf/rpc-log-listener
```

### 配置 USER-RPC 服务器地址(生产环境一般用k8s,host用的是容器名)
```php
RPC_PLT_USER=127.0.0.1:9502
```

## LoginService
> 由于 `wechat-content-api` 是rpc的消费方,所以我们需要在 `LoginService` 中注入 `UserInterface` 服务
> 并调用 `firstByCode` 方法
```php
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Service;

use App\Schema\LoginSchema;
use App\Service\Dao\UserDao;
use App\Service\SubService\UserAuth;
use Han\Utils\Service;
use Hyperf\Di\Annotation\Inject;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Wlfpanda1012\PltCommon\Constant\OAuthType;
use Wlfpanda1012\PltCommon\RPC\User\UserInterface;

use function Hyperf\Support\env;

class LoginService extends Service
{
    #[Inject]
    protected UserDao $userDao;
    #[Inject]
    protected UserInterface $userRpc;

    /**
     * @throws TransportExceptionInterface
     */
    public function login(string $code): LoginSchema
    {
        $result = $this->userRpc->firstByCode($code, env('WECHAT_APP_ID'), OAuthType::WECHAT_MINI_APP);

        $user = $this->userDao->firstOrCreate($result['id']);
        // create token token -> user_id
        $userAuth = UserAuth::instance()->init($user);

        return new LoginSchema($userAuth->getToken());
    }
}
```
