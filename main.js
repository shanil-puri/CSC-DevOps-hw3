var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

var last_key = "";

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);

	// ... INSERT HERE.
	client.lpush('recent_queue', req.url);
    client.ltrim('recent_queue', 0, 4);

	next(); // Passing the request to the next handler in the stack.
});

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		console.log(img);
	  		client.lpush('image_queue', img);
		});
	}

   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
	// 	// if (err) throw err
	res.writeHead(200, {'content-type':'text/html'});

	client.lpop('image_queue', function(err, imgData){
        res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imgData+"'/>");
        res.end();
    })
})


app.post("/set", function(req, res){
	console.log("writing key!!");
	var key = 'key'+Math.round(Math.random()*(1000));
    client.set(key, "this message will self-destruct in 10 seconds");
    last_key = key;
    client.expire(key, 10);
    res.send("Key Set!");
});

app.get("/get", function(req, res) {
	console.log("retrieving key!!");
	client.get(last_key, function(err,value){
		res.send(value);
    })
});

app.get("/recent", function(req, res) {
	var responseText = '';
    client.lrange('recent_queue', 0, 4, function(err,list){
        for(i in list){
             responseText +=list[i] + '\n';
        }
        res.send(responseText);
    })
});

var port = process.argv.splice(2)[0];

// HTTP SERVER
var server = app.listen(port, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})

// app.get('/', function(req, res) {
//   res.send('hello world')
// })


