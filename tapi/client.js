var url = 'http://127.0.0.1:3000';
var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
require('child_process').exec(start + ' ' + url);

function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}


const tapi = require('./tapi');
const tapiserver = require('./tapi/tapiserver');
log('Main script');

