const tapi = require('../tapi');

const express = require('express')
const app = express()

const path = __dirname + '/';

app.set('view engine', 'ejs')

app.use(logger)

app.use(express.static(path + "public"))

app.use('/127.0.0.1', (req, res) => {
	req.on('data', chunk => {
		log('requested socket handler');
		res.writeHead(200, { 'content-type': 'application/json' });
		let results = SocketHandler(chunk.toString());
		results.then((result) => { res.end(result); });
	});
})

app.listen(3000)

log('server at http://127.0.0.1:3000/')

function logger(req, res, next) {
	log('requested destination', req.originalUrl)
	next()
}

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
		log('unlocking keepAlive id', lockedTo);
		locked = false;
	}
}

setInterval(keeper, 2000);

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
		if(incoming.func && incoming.id == lockedTo || !locked) {
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
