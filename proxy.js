var redis = require('redis');
var http = require("http");
var httpProxy = require('http-proxy');
var url = require("url");
var port_list = process.argv.splice(2);
var client = redis.createClient(6379, '127.0.0.1', {});
var proxy = httpProxy.createProxyServer({});

port_list.forEach(function(port){
    var address = 'http://localhost:'+port;
    client.rpush('node_list', address);
});

http.createServer(function(req, res) {
    client.lpop('node_list', function(err, address){
        var node = {target:address, path: url.parse(req.url).pathname};
        proxy.web(req, res, node);
        client.rpush('node_list', address);
    });
}).listen(8000);