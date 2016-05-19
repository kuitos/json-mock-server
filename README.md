# JSON Mock Server

## Goals

1. 解决前端使用mock方式开发过程中 PUT/POST/DELETE 等接口的数据无法被持久化的问题。例如对user资源做了rename操作，调用接口成功返回204，但是下次get user得到的依然是原始name。
2. 解决前后端接口联调成本问题，本地不用改一行代码就可以直接调用远程服务器接口。总不能接口联调出一次问题改一次然后测试发布一次到服务器吧，太傻太累效率太低。
3. 我TM只是想mock一个接口，我TM不想写一堆js代码啊！！！

## The Truth
1. 将文件作为数据库，提供数据持久化功能。每次对资源的修改记录都会保存在文件中。
2. 使用本地node服务器作http代理，通过接口命名规则拦截数据接口，将拦截到的请求转发到配置的远程服务器上，然后输出响应结果。
3. 基于restful规范配置数据，node会根据url规则找到对应的资源实体，从而达到只配数据源不写一行js代码的目的。

## Params
| param  | alias  | desc  | reqiured |default |
| -------------- | ---------------| ------------- | ---------- | ----|
| api-prefix | ap | rest数据接口前缀 | true| 空 |
| port | p | 本地服务器启动端口号 | false |3000 |
| host | h | 本地服务器启动host | false| 0.0.0.0 |
| static | s | 静态服务器根路径 | false | public |
| source | 无 | 本地mock数据源(若配置需在第一项) | | undefined |
| proxy-host | ph | 代理服务器地址（ip/域名，因为可能存在虚IP所以建议使用域名） ||
| proxy-port | pp | 代理服务器端口号 | |
| limit | l | 请求体大小限制 | |

## Specification
1. **如果api设计的不够restful，可能本工具并不适合你的项目。**但是作为一个合格的前端工程师，是有义务去协同后端设计出符合标准的接口的。当然前提是你得熟悉restful接口设计规范。
2. 如果上面一条没法做到，我相信**本地调用远程接口**这一特性你也是需要的，如果你的项目是前后端分离的开发模式的话。

## How To Use

#### Install

```bash
$ npm install json-mock-kuitos -g
```

#### 创建 `db.json` 文件

```javascript
{
  "users": [
    { "id": 1, "name": "kuitos", "location": "China"},
    { "id": 2, "name": "visiting-user", "location": "UK"}
  ],
  "posts": [
    { "id": 1, "title": "json-mock", "body":"The internet is cool!", "author": "therebelrobot", "userId": 1 }
  ],
  "comments": [
    { "id": 1, "body": "some comment from author", "votes": 20, "postId": 1, "userId": 1 },
    { "id": 2, "body": "some comment from visitor", "votes": 15, "postId": 1, "userId": 2 }
  ]
}
```

#### 启动服务器

```bash
# 本机mock
$ json-mock-kuitos db.json -s / --apiPrefix /rest/bi

# 如果后端接口已经开发好，使用代理直接连其他机器调用api作前后端联调
$ json-mock-kuitos -s / --proxy-host 10.200.187.10 --proxy-port 3000 --api-prefix /rest/bi
```

当你访问 [http://localhost:3000/posts/1](http://localhost:3000/posts/1), 返回值为

```json
{ "id": 1, "title": "json-mock", "author": "therebelrobot", "userId": 1 }
```
当你访问 [http://localhost:3000/users?name=kuitos](http://localhost:3000/users?name=kuitos), 返回值为

```json
{ "id": 1, "name": "kuitos", "location": "China" }
```

**同样的，所有的 PUT/POST/DELETE 操作都会被持久化到 `db.json` 中**

更多路由设计及调用方式，参见[json-mock](https://github.com/kuitos/json-mock)

## Design Mock Data
#### points
1. 从url的后面往前面思考，资源的主体永远是url中最后一个复数单词。  
	如```/users/1/comments```表示的是comments集合中所有userId=1的资源(数组)，```/users/1/comments/1```表示的roles集合中commentId=1而且userId=1的comment实体(对象)
2. 想象自己是后端开发者，```/users/1/comments/1``` 对应的sql应该是

	```sql
	 select * from tb_user_roles where userId=1 and roleId=1;
	```

#### examples
1. ```/users/1/comments```  return 
	
	```json
	[
    	{ "id": 1, "body": "some comment from author", "votes": 20, "postId": 1, "userId": 1 }
  ]
	```
2. ```/users/1/comments/2```
	return
	
	```json
	{ "id": 2, "body": "some comment from visitor", "votes": 15, "postId": 1, "userId": 1 }
	```


## Todo
1. 目前只支持mock单文件数据，后续需支持指定文件夹下所有json文件（通过concat文件夹下所有json文件生成单一db.json的方式）
2. hotloader：watch(dir)-->server.restart()
3. /users/1/name 不支持对单个属性的 get/put
4. 不支持资源ID映射配置。```/users/1/roles/2```必须是```{id:2,userId:1}```才能匹配到，	```{roleId:2,userId:1}```不会匹配。解决方案就是，多加一个名字不一样但是值一	样的属性。```{id:2,roleId:2,userId:2}```  
5. 只支持两级资源嵌套。但是依照规范restful应该只支持两级。目前当配置多级时也只有前两级生效。如 /users/1/posts/1/comments/ 表示postId == 1 的所有comment实体。要不要修复看心情吧😄

欢迎各路英雄提交PR帮助作者改善此工具

## Thanks To
1. [json-mock](https://github.com/kuitos/json-mock)
2. [json-server](https://github.com/typicode/json-server)

## License

MIT
