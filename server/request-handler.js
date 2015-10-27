// import node module requirements 
var fs = require('fs');
var path = require('path');
var url = require('url');

var messages = [];

var filePath = path.join(__dirname + '/bin/messages.json');

// read file asynchronously
fs.readFile(filePath, 'utf8', function(err, data) {
if (err) { // handle error immediately 
  return;
}
messages = JSON.parse(data);
});

// save all our messages to our file system
var saveMessages = function() {
  var messagesToSave = JSON.stringify(messages);
  fs.writeFile(filePath, messagesToSave, 'utf8', function(err) {
    if (err) {
      return;
    }
  });
};

var GET = function(statusCode, headers, response) {
  statusCode = 200;
  headers['Content-Type'] = "application/json";
  var responseData = JSON.stringify({results: messages});
  response.writeHead(statusCode, headers);
  response.end(responseData);
};

var POST = function(statusCode, headers, request, response) {
  statusCode = 200;
  var lastId = messages[0].objectId || 0;
  headers['Content-Type'] = "application/json";
  response.writeHead(statusCode, headers);
  var body = '';
  request.on('data', function(chunk) {
    body += chunk;
  });

  request.on('end', function() {
    var newMessage = JSON.parse(body);
    newMessage.createdAt = new Date();
    newMessage.objectId = lastId + 1;
    messages.unshift(newMessage);
    lastId++;
    var postRes = JSON.stringify({
      'createdAt': newMessage.createdAt,
      'objectID': newMessage.objectId
    });
    saveMessages();
    response.end(postRes);
  });
};

function serveStaticPage(request, response) {
    //get the resource name specified in request.url
    var resource = url.parse(request.url).pathname;
    console.log(resource);
    //if request is root, serve index page
    if (resource === '/') {
        resource = '/client/2015-10-chatterbox-client/client/index.html';
    } else {
      resource = '/client/2015-10-chatterbox-client/client/' + resource;
    }
    // Read the file
    fs.readFile( __dirname + resource, function( err, content) {
        if (err) { // If there is an error, set the status code
            response.writeHead( 404,
                               {'Content-Type': 'text/plain; charset = UTF-8'});
            response.end(err.message);
        // determine correct header
        } else {
            var extension = {
              '.html': 'text/html',
              '.js' : 'application/javascript',
              '.css': 'text/css'
            };
            var resourceExtension = path.extname(resource);
            response.writeHead(200, {'Content-Type': extension[resourceExtension] });                      
            response.end(content);
        }
    });   
};

// define request handler
var requestHandler = function(request, response) {
  var statusCode;
  var headers = defaultCorsHeaders;
  // generate filepath for our directory with messages
  if (request.method === 'OPTIONS') {
    statusCode = 200;
    response.writeHead(statusCode, headers);
    response.end();

  } else if (request.method === 'GET' && request.url === '/classes/messages') { 
  // determine GET vs. POST response and handle appropriately 
    GET(statusCode, headers, response);
  } else if (request.method === 'POST') {
    POST(statusCode, headers, request, response);
  } else {
    console.log(request.method);
    console.log(request.url);
    serveStaticPage(request, response);
  }

};

var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};


module.exports = requestHandler;

  // Tell the client we are sending them plain text.
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
 // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  
  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
