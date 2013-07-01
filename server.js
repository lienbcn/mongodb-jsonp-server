var http = require('http');
var url  = require('url');
var spawn = require('child_process').spawn;
var MongoClient = require('mongodb').MongoClient;

var oMimeTypes = { //js for jsonp
	"txt": "text/plain",
	"html": "text/html",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"png": "image/png",
	"js": "text/javascript",
	"css": "text/css"
};
var conf = {
	port: '3002',
	db: 'meteor',
	host: 'localhost',
	listen: 3010
};

var dumpDb = function(){
	var rm = spawn('rm', ['-r', 'dump']);
	var mongodump = spawn('mongodump', ['--port', conf.port, '--db', conf.db]);
};
var restoreDb = function(){
	var mongodump = spawn(
		'mongorestore',
		[
			'--port',
			conf.port,
			'--db',
			conf.db,
			'--drop',
			'dump/'+conf.db+'/'
		]
	);
};
var readDb = function(col, callback){
	MongoClient.connect(
		"mongodb://"+conf.host+":"+conf.port+"/"+conf.db,
		function(err, db) {
			if(err) return console.dir(err);
			var collection = db.collection(col);
			collection.find().toArray(
				function(err, aDocs) {
					if(err) return console.dir(err);
					db.close();
					callback(aDocs);
				}
			);
		}
	);
};
var writeDb = function(col, doc, callback){
	MongoClient.connect(
		"mongodb://"+conf.host+":"+conf.port+"/"+conf.db,
		function(err, db) {
			if(err) return console.dir(err);
			var collection = db.collection(col);
			collection.insert(
				doc,
				function(err, result){
					if(err) return console.dir(err);
					db.close();
					callback();
				}
			);
		}
	);
};
var updateDb = function(col, sel, doc, callback){
	MongoClient.connect(
		"mongodb://"+conf.host+":"+conf.port+"/"+conf.db,
		function(err, db) {
			if(err) return console.dir(err);
			var collection = db.collection(col);
			collection.update(
				sel,
				{$set: doc},
				function(err, result){
					if(err) return console.dir(err);
					db.close();
					callback();
				}
			);
		}
	);
};
var removeDb = function(col, sel, callback){
	MongoClient.connect(
		"mongodb://"+conf.host+":"+conf.port+"/"+conf.db,
		function(err, db) {
			if(err) return console.dir(err);
			var collection = db.collection(col);
			collection.remove(
				sel,
				function(err, result){
					if(err) return console.dir(err);
					db.close();
					callback();
				}
			);
		}
	);
};

var behaviour = function(oRequest, oResponse) {
	var sendResponse = function(nStatusCode, sContentType, bufContent){
		oResponse.writeHead(nStatusCode, {'Content-Type': oMimeTypes[sContentType]});
		oResponse.end(bufContent);
	};
	var inputs = (function getInfoFromUrl(){
		var ret = {};
		var url_parts = url.parse(oRequest.url, true);
		ret.col = url_parts.query.collection;
		ret.path = url_parts.pathname;
		ret.call = url_parts.query.callback;
		ret.doc = JSON.parse(url_parts.query.document || '{}');
		ret.sel = JSON.parse(url_parts.query.selector || '{}');
		return ret;
	})();
	console.log('\nNew connection with inputs:');
	console.dir(inputs);

	if (inputs.path === '/dump'){
		dumpDb();
		sendResponse(
			200,
			'js',
			inputs.call+'();' //code executed in the browser
		);
	}
	else if (inputs.path === '/restore'){
		restoreDb();
		sendResponse(
			200,
			'js',
			inputs.call+'();' //code executed in the browser
		);
	}
	else if (inputs.path === '/read'){
		readDb(inputs.col, function(docs){
			sendResponse(
				200,
				'js',
				inputs.call+'('+JSON.stringify(docs)+');' //code executed in the browser
			);
		});
	}
	else if (inputs.path === '/write'){
		writeDb(inputs.col, inputs.doc, function(){
			sendResponse(
				200,
				'js',
				inputs.call+'();' //code executed in the browser
			);
		});
	}
	else if (inputs.path === '/update'){
		updateDb(inputs.col, inputs.sel, inputs.doc, function(){
			sendResponse(
				200,
				'js',
				inputs.call+'();' //code executed in the browser
			);
		});
	}
	else if (inputs.path === '/remove'){
		removeDb(inputs.col, inputs.sel, function(){
			sendResponse(
				200,
				'js',
				inputs.call+'();' //code executed in the browser
			);
		});
	}
	else {
		//console.log('Invalid pathname');
		sendResponse(
			500,
			'js',
			inputs.call+'();' //code executed in the browser
		);
	}
};
var startServer = function(){
	var server = http.createServer(behaviour);
	server.listen(conf.listen);
};


for (var i = 0; i < process.argv.length; i++) { //get options
	if (process.argv[i] === '--host') conf.host = argv[i+1];
	if (process.argv[i] === '--port') conf.port = argv[i+1];
	if (process.argv[i] === '--db') conf.db = argv[i+1];
	if (process.argv[i] === '--listen') conf.listen = parseInt(argv[i+1]);
}
startServer();