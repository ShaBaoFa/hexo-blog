---
layout: butt
title: workerman-gateway 构建 websocket 服务
date: 2024-03-01 11:35:01
category: Laravel
cover: /images/laravel.webp
tags: 
  - websocket
  - workerman
  - laravel
---
# 前言
{% note purple 'fa-solid fa-lightbulb' flat %}
Workerman 是一个高性能的 PHP socket 服务器框架，支持 TCP、UDP、Unix 套接字、HTTP、Websocket 等多种协议。本文将介绍如何使用 workerman-gateway 构建一个 websocket 服务。并且在 Laravel 中使用。
{% endnote %}
# 与 Laravel 等 框架结合 逻辑
{% note blue 'fa-solid fa-lightbulb' flat %}
摘自 `workerman` 官方文档 传送门：[workerman-gateway](https://www.workerman.net/doc/gateway-worker/work-with-other-frameworks.html)
使用GatewayWorker时开发者最关心的是如何与现有mvc框架(ThinkPHP Yii laravel等)整合，以下是官方推荐的整合方式。见示意图：
![img.png](/images/workerman/img.png)
## 总体原则
- 现有`mvc`框架项目与`GatewayWorker`独立部署互不干扰

- 所有的业务逻辑都由网站页面`post`/`get`到`mvc`框架中完成

- `GatewayWorker`不接受客户端发来的数据，即`GatewayWorker`不处理任何业务逻辑，`GatewayWorker`仅仅当做一个单向的推送通道

- 仅当`mvc`框架需要向浏览器主动推送数据时才在`mvc`框架中调用`Gateway`的`API` `GatewayClient`完成推送。

{% endnote %}


# 安装
## 安装 workerman-gateway
```shell
composer require 'workerman/workerman' -W
composer require 'workerman/gateway-worker' -W
# 如果需要和 Laravel等框架结合 可以安装 gatewayclient
composer require 'workerman/gatewayclient' -W
```

# 创建 websocket 服务
在 Laravel 项目创建一个Command `WorkermanCommand.php` 文件，内容如下：
```php
<?php

namespace App\Console\Commands;

use GatewayWorker\BusinessWorker;
use GatewayWorker\Gateway;
use GatewayWorker\Register;
use Illuminate\Console\Command;
use Workerman\Worker;

class WorkermanCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wk {action} {--d}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Start a Workerman server.';


    private static int $businessWorkerPort = 2238;
    private static int $gatewayPort = 21579;
    /**
     * Execute the console command.
     *
     */
    public function handle()
    {
        global $argv;
        $action = $this->argument('action');

        $argv[0] = 'wk';
        $argv[1] = $action;
        $argv[2] = $this->option('d') ? '-d' : '';

        $this->start();
    }

    private function start()
    {
        $this->startGateWay();
        $this->startBusinessWorker();
        $this->startRegister();
        Worker::runAll();
    }

    private function startBusinessWorker()
    {
        $worker = new BusinessWorker();
        // worker名称
        $worker->name = 'BusinessWorker';
        // bussinessWorker进程数量
        $worker->count = 1;
        // 服务注册地址
        $worker->registerAddress = '127.0.0.1:' . self::$businessWorkerPort;
        // 设置处理业务的类,此处制定Events的命名空间
        $worker->eventHandler = \App\Workerman\Events::class;
    }

    private function startGateWay()
    {
        // gateway 进程，这里使用Text协议，可以用telnet测试
        $gateway = new Gateway("websocket://0.0.0.0:" . self::$gatewayPort);
        // gateway名称，status方便查看
        $gateway->name = 'Gateway';
        // gateway进程数
        $gateway->count = 1;
        // 本机ip，分布式部署时使用内网ip
        $gateway->lanIp = '127.0.0.1';
        // 内部通讯起始端口，假如$gateway->count=4，起始端口为4000
        $gateway->startPort = self::$gatewayPort - 1200;
        // ping间隔
        $gateway->pingInterval = 55;
        // 要求客户端在$pingInterval时间内必须发送数据来维持链接，否则客户端会被断开
        $gateway->pingNotResponseLimit = 1;
        // 心跳数据
        $gateway->pingData = '{"type":"Heart"}';
        // 服务注册地址
        $gateway->registerAddress = '127.0.0.1:' . self::$businessWorkerPort;
    }

    private function startRegister()
    {
        // register 进程
        new Register('text://0.0.0.0:' . self::$businessWorkerPort);
    }
}
```

## 启动命令
```shell
php artisan wk start
# 后台运行
php artisan wk start --d
# 其他命令
php artisan wk stop # 停止服务
php artisan wk restart # 重启服务
php artisan wk restart --d # 重启服务并后台运行
php artisan wk reload # 重载服务(worker进程平滑重启)
php artisan wk status # 查看服务状态
```

# 事件处理
在 `app/Workerman/Events.php` 文件中，内容如下：
{% note blue 'fa-solid fa-lightbulb' flat %}
这里的代码是一个示例，是以MVC和Workerman解耦的方式，websocket服务只作为单方向下发信息。
所有来自用户的信息都不直接发送到ws服务器，而是通过mvc服务器短链接的形式，然后通过`gatewayclient`下发信息。
需要注意的是，通过 `gatewayclient` 下发信息是不会经过 `onMessage` 而是直接通过 `gateway` 进行下发。
你可以根据自己的需求来修改。
{% endnote %}

```php
<?php
/**
 * This file is part of workerman.
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the MIT-LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @author walkor<walkor@workerman.net>
 * @copyright walkor<walkor@workerman.net>
 * @link http://www.workerman.net/
 * @license http://www.opensource.org/licenses/mit-license.php MIT License
 */

/**
 * 用于检测业务代码死循环或者长时间阻塞等问题
 * 如果发现业务卡死，可以将下面declare打开（去掉//注释），并执行php start.php reload
 * 然后观察一段时间workerman.log看是否有process_timeout异常
 */
//declare(ticks=1);

namespace App\Workerman;

use \GatewayWorker\Lib\Gateway;
use Illuminate\Support\Facades\Log;
use Workerman\Timer;

/**
 * 主逻辑
 * 主要是处理 onConnect onMessage onClose 三个方法
 * onConnect 和 onClose 如果不需要可以不用实现并删除
 */
class Events
{
    /**
     * 当客户端连接时触发
     * 如果业务不需此回调可以删除onConnect
     *
     * @param int $client_id 连接id
     */
    public static function onConnect($client_id)
    {
        Gateway::sendToClient($client_id, json_encode(array(
            'type' => 'init',
            'client_id' => $client_id
        )));
        Gateway::updateSession($client_id, ['registed' => false]);
        // 用户连接时，如果用户不在1分钟内进行注册，则断开链接
        Timer::add(30, function () use ($client_id) {
            $session = Gateway::getSession($client_id);
            if (!($session['registed'])) {
                Gateway::closeClient($client_id);
            }
        }, null, false);
    }

    /**
     * 当客户端发来消息时触发
     * @param int $client_id 连接id
     * @param mixed $message 具体消息
     */
    public static function onMessage($client_id, $message)
    {
        // 如果选择使用业务系统通过gatewayClient来发送消息，那么这里的代码可以删除(除了心跳检测)
        switch ($message) {
            case 'ping':
                break;
            default:
                // 不允许客户端直接发送消息,并断开链接
                Log::error('client_id:' . $client_id . ' send message:' . $message . ' and close');
                Gateway::closeClient($client_id);
                break;
        }
    }
}
```

# 后端控制器
在 `app/Http/Controllers/WebSocketController.php` 文件中，内容如下：
{% note blue 'fa-solid fa-lightbulb' flat %}
利用 `gatewayclient` 可以实现后端控制器，比如用户注册，用户验证，用户上线，用户下线，用户发送消息等等。
{% endnote %}
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Workerman\GatewayClient;
use Illuminate\Support\Facades\Redis;

class WebSocketController extends Controller
{
    public function init(Request $request){
        $client_id = $request->input('client_id');
        $user_id = 442; //Auth::id();
        GatewayClient::updateSession($client_id,['registed' => true]);
        GatewayClient::bindUid($client_id, $user_id);
    }

    public function onlineClients(int $uid)
    {
        return GatewayClient::getClientIdByUid($uid);
    }

    public function say(int $uid, string $message)
    {
        if (GatewayClient::isUidOnline($uid)){
            // 发送消息
            GatewayClient::sendToUid($uid, $message);
        }else{
            // 存储离线消息
            Redis::lpush('wss:user.' . $uid . ':offline.message', $message);
        }
    }
    public function joinGroup(int $uid,string $group)
    {
        GatewayClient::joinGroup($uid, $group);
    }
}
```

# 后记
`workerman` 的使用场景非常广泛，比如聊天室，直播间，游戏等等。
并且 `BusinessWorker` `Gateway` `Register` 三个进程可以分布式部署，可以实现高可用。

其实目前还有几个问题

### 问题1
通过mvc的业务系统通过gatewayclient进行数据下发的,所以所有来自web前端的请求都是通过短链接形式上报，再下发。
那当群（group）里有人掉线或者下线（没有通过接口，即 没有通过 leaveGroup）的方式来离开。那我就无法给群组下发 xxx 离开群聊 的信息。

另外同样的，我给某个人发信息的时候，我可以在业务接口里先判断此人是否在线
下面是伪代码
```php
    public function say(int $uid, string $message)
    {
        if (GatewayClient::isUidOnline($uid)){
            // 发送消息
            GatewayClient::sendToUid($uid, $message);
        }else{
            // 存储离线消息
            Redis::lpush('wss:user.' . $uid . ':offline.message', $message);
        }
    }
```
但这个依旧有问题，我为什么在发信息之前无法判断这人是否在线。

