const http = require('http');

function log() 
{
	return;
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}

exports.createClient = function (html, SocketHandle = (function(){}), port = 3000) {
	if(typeof SocketHandle != 'function') {
		SocketHandle = function() {};
	};
	if(typeof port != 'number') {	
		port = 3000;
	};
	const page = http.createServer();
	page.on('request', (request, res) => {
		if(request.url=='/') {
			log('requested html page');
			res.writeHead(200, { 'content-type': 'text/html' });
			res.end(html);
		} else if(request.url=='/127.0.0.1') {
			request.on('data', chunk => {
				log('requested socket handler');
				res.writeHead(200, { 'content-type': 'application/json' });
				let results = SocketHandle(chunk.toString());
				results.then((result) => { res.end(result); });
			});
		}
	});
	page.listen(port);
	log('server running at', '127.0.0.1:'+port);
};
//*/