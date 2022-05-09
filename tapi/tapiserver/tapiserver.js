const server = require('./server');
const tapi = require('../tapi');
const fs = require('fs');

function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}


var pool = {size:0};

function constructPool()
{
	
	let args = '';
	for(let i = 0; i < pool.size; i++)
	{
		args += pool[i];
	}
	log('constructing network request from', pool.size, 'packets')
	args = JSON.parse(args);
	pool = {size:0};
	return args;
}

function SocketHandler(incoming) {
	incoming = JSON.parse(incoming); 
	let outgoing = '';
	pool[incoming.poolNumber] = incoming.args;
	pool.size++;
	if(pool.size == incoming.poolSize) {
		if(incoming.func) {
			let args = constructPool();
			
			let funcCall = tapi;
			incoming.func.split('.').forEach(
				function(func){  
					funcCall = funcCall[func];
				}
			);
			log('calling', funcCall, `(${incoming.func})`, 'with', args.length, 'arguments');
			outgoing = funcCall(...args);
		}
		outgoing = JSON.stringify(outgoing);
		if(!outgoing) outgoing = '';
		log('finished request, total reply size', outgoing.length);
		return outgoing;
	}
	return '';
}

html = fs.readFileSync(__dirname + '\\html\\client.html', 'utf8');
html = html.replace(`<!-###SCRIPT###!->`, fs.readFileSync(__dirname + '\\html\\client.js', 'utf8'));
server.createClient(html, SocketHandler, port = 3000);
