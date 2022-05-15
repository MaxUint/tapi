const tapi = require('../tapi')
const express = require('./node_modules/express')
const app = express()

app.get('/ping/:uid', (req, res) => {
	res.send(ping(req.params.uid))
})

app.use(express.static(__dirname + "/public"))


app.use('/', (req, res) => {
	let chunks = 0;
	let chunkData = '';
	req.on('data', chunk => {
		chunks++
		chunkData += chunk.toString()
	})
	req.on('end', () =>{
		try {
			res.send(SocketHandler(JSON.parse(chunkData), res))
		} catch {
			res.status(500)
			res.send({'status':'Error'})
		}
		chunkData = ''
	})
})

app.listen(3000)

//server set up to pipe JSON back and forth

function SocketHandler(request, res) { 			// This handles request logic
	if(status == 'BAD') return {'status' : status}
	try {
		console.log('tapiserver.js:', 'calling', request.call, 'with', request.args.length, 'args')
		let response = tapi[request.call](...request.args)
		return (typeof response == 'string') ? {'msg':response} : response
	}		
	catch (error) {
		console.error(error)
		res.status(500)
		return {'status' : 'ERROR', 'error' : error}
	}
}

let uids = [], status = 'GOOD', MAX_CLIENTS = 1

function ping(uid) {
	if(!uids.includes(uid) && uids.length <= MAX_CLIENTS) uids.push(uid)
	if(uids.includes(uid) && uids.length <= MAX_CLIENTS) {
		status = 'GOOD'
	} else {
		status = 'BAD'
	}
	return {'status':status}
}

setInterval(function(){uids.shift()}, 5000)

