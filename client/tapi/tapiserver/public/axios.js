function createNetwork(){
	
	if(typeof axios == 'undefined') {
		console.error('createNetwork: Axios not present')
		return
	}
	
	let tNet = {}

	tNet.nid = Math.floor(Math.random() * 10**16)
	
	tNet.errorHandler = (function(e){
		tNet.ready = true
		console.warn('Network Error', e)
	}) 
	
	tNet.pool = {}
	tNet.ready = true
	
	tNet.syncon = function(){
	}
	
	tNet.syncoff = function(){
	}
	
	tNet.paused = false
	
	tNet.send = function(call, args = [], handler = (function(){}) ) {	
		if(typeof args == 'function') {
			handler = args
			args = []
		}
		if(Object.keys(tNet.pool).includes(call)) return
		tNet.pool[call] = {
			'args':args, 
			'handler': (function(res){tNet.ready = true;handler(res.data)}),
			'sync' : false
		}
	}
	
	tNet.sendsync = function(call, args = [], handler = (function(){}) ) {	
		if(tNet.paused) return
		tNet.paused = true
		tNet.syncon()
		if(typeof args == 'function') {
			handler = args
			args = []
		}
		if(Object.keys(tNet.pool).includes(call)) return
		tNet.pool[call] = {
			'args':args, 
			'handler': (function(res){tNet.syncoff();tNet.ready = true;tNet.paused = false;handler(res.data)}),
			'sync' : true
		}
	}
	
	tNet.complete = function() {
		if(!tNet.ready) return
		let call = Object.keys(tNet.pool)[0]
		if(!call) return
		let args = tNet.pool[call].args
		let handler = tNet.pool[call].handler
		let sync = tNet.pool[call].sync
		tNet.ready = false
		axios.post('', {'call' : call, 'args' : args}, 
			{'headers': { 'content-type': 'application/json' } }
			)
		.then(handler)
		.catch(function(e){tNet.ready = true;if(sync)tNet.paused = false;tNet.syncoff();tNet.errorHandler(e)})
		delete tNet.pool[call]
	}
	
	function bigSend(dest, args){
		let json = JSON.stringify(args)
		
	}
	
	setInterval(tNet.complete, 1000)
	
	tNet.goodping = function(){}
	tNet.badping = function(){}

	tNet.ping = function() {
		axios.get('ping/'+tNet.nid).then(
			function(res) {
				if(res.data.status == 'GOOD') return tNet.goodping(res)
				return tNet.badping(res)
			}, tNet.errorHandler
		)
	}
	
	return tNet
}