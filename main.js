function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}


const tapi = require('./tapi');
const tapiserver = require('./tapi/tapiserver');
log('Main script');

