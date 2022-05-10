const server = require('./server');
const tapi = require('../tapi');
const fs = require('fs');

function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}

var lockedTo = false;
var locked = false;
var dontLock = false;

function keeper() {
	if(!locked) return;
	if(dontLock) {
		dontLock = false;
	} else {
		log('unlocking');
		locked = false;
	}
}

setInterval(keeper, 5000);

var pool = {};


function constructPool(packet)
{
	let args = '';
	for(let i = 0; i < pool[packet].size; i++)
	{
		args += pool[packet][i];
	}
	args = JSON.parse(args);
	delete pool[packet];
	return args;
}

async function SocketHandler(incoming) { 
	incoming = JSON.parse(incoming); 
	if(!(typeof pool[incoming.packet] == 'object')) {
		pool[incoming.packet] = {size:0};
	}
	let outgoing = '';
	pool[incoming.packet][incoming.poolNumber] = incoming.args;
	pool[incoming.packet].size++;
	if(pool[incoming.packet].size == incoming.poolSize) {
		let args = constructPool([incoming.packet]);
		if(incoming.func == 'keepAlive')  {
			if(incoming.id == lockedTo) dontLock = true;
			if(!locked) {
				lockedTo = incoming.id;
			}
			locked = true;
			if(lockedTo != incoming.id) {
				return JSON.stringify('BAD');
			}
			return JSON.stringify('GOOD');
		} else 
		if(incoming.func && incoming.id == lockedTo) {
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
