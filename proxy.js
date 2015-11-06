var redis = require('redis');
var http = require("http");
var httpProxy = require('http-proxy');
var url = require("url");

var port_list = process.argv.splice(2);

var redisClient = redis.createClient(6379, '127.0.0.1', {});

port_list.forEach(function(port){
    var address = 'http://localhost:'+port;
    redisClient.rpush('node_list', address);
});

var proxy = httpProxy.createProxyServer({});

http.createServer(function(req, res) {
    redisClient.lpop('node_list', function(err, address){
        var pathname = url.parse(req.url).pathname;
        var node = {target:address};
        node.path = pathname;
        proxy.web(req, res, node);
        redisClient.rpush('node_list', address);
    });
}).listen(8000);