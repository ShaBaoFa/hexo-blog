---
layout: butt
title: laravel request 验证功能（失败马上返回）
date: 2024-04-03 14:08:00
category: Laravel
cover: /images/laravel.webp
---

# 前言

{% note purple 'fa-solid fa-lightbulb' flat %}
在使用`laravel`的时候，经常会用到`request`验证，但是有时候我们需要在验证失败的时候，马上返回错误信息，而不是继续执行后面的代码。
最近就有小伙伴问过我，`request`层验证，比如验证账号是否正确，那其实是需要访问数据库的，如何可以有效减少在验证期间的访问数据库的次数。
{% endnote %}

# 方案

## 思路
其实一开始我想在`request`层验证的失败之后回调里去主动抛出 `422` 的错误。
但后来我发现，喔唷，`laravel`已经为我们提供了这个功能。

## 方案

**原生解决方案**

[stopping-on-first-validation-failure](https://laravel.com/docs/11.x/validation#stopping-on-first-validation-failure)

有时候，您可能希望在属性的第一次验证失败后停止运行验证规则。要实现这一点，请将bail规则分配给该属性：

```php
$request->validate([
    'title' => 'bail|required|unique:posts|max:255',
    'body' => 'required',
]);
```
在这个例子中，如果 `title` 属性上的 `unique rule` 失败了，`max rule` 将不会被检查。规则将按照它们被分配的顺序进行验证。

## 补充

后来发现这只是限制了在同一个属性上的验证规则，如果是多个属性的验证，那么还是需要自己去处理。

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CustomRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'xx' => ['bail', 'required', 'integer'],
            // 注意这里不直接在rules定义中包含其他字段
        ];
    }

    protected function getValidatorInstance()
    {
        $validator = parent::getValidatorInstance();

        $validator->after(function ($validator) {
            if (!$validator->errors()->has('xx')) {
                // 如果xx字段验证通过，则继续添加其他字段的验证规则
                $validator->addRules([
                    'yy' => ['bail', 'required', 'string'],
                ]);
            }
        });

        return $validator;
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json($validator->errors(), 422));
    }
}

}
```

~~demo例子如上，但感觉有点蠢。~~

暂时就想到这么多了，以后再考虑怎么解决吧。
