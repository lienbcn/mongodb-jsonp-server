This node server replies to jsonp requests. It listens port 3010.
This means that the server returns a string that is evaluated (executed) by the browser.
It gets/writes/updates/backups/restores database stored in mongodb port 3002.
The options of the application:
	--host DBHOST: the host where the database is stored. By default is localhost
	--port DBPORT: the port to access the database. By default is 3002
	--db DBNAME: the database name. By default is meteor
	--listen PORT: the port that the server is listening. By default is 3010

The paths of the url:
	/dump: backup the database. params: callback
	/restore: restore the db. params: callback
	/read: get a whole collection from the db. params: callback, collection
	/write: insert a document in a collection in the db. params: callback, collection, document
	/update: update (replace) a document in the db. params: callback, collection, document, selector
	/remove: remove a document from the db. params: callback, collection, selector

The parameters of the url (GET method):
	callback: {string} browser executes it with json data as a parameter. When using ajax of jQuery, callback argument is sent by default if jsonp is specified in dataType.
	collection: {string} the collection of the meteor database.
	document: {JSON} document to insert / replace. The server will only use $set operator ({$set: doc}).
	selector: {JSON} query selector of the document to drop/change

