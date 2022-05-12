const fs = require('fs');

function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}

exports.save = function(location, object) {
	log('saving', typeof object, 'at', location+'.dat');
	let file_data = JSON.stringify(object);
	makeExist();
	fs.writeFileSync(__dirname + '\\data\\' + location + '.dat', file_data, 'utf8');
}

exports.load = function(location) {
	log('accessing', location+'.dat');
	makeExist();
	if(fs.existsSync(__dirname + '\\data\\' + location + '.dat')) {
		let file_data = fs.readFileSync(__dirname + '\\data\\' + location + '.dat', 'utf8');
		return JSON.parse(file_data);
	} else return false;
}

exports.deleteCache = function() {
	log('flushing .dats')
	fs.rmSync(__dirname + '\\data', { recursive: true, force: true });
	fs.mkdirSync(__dirname + '\\data');
}

exports.del = function(location) {
	log('deleting', location+'.dat')
	makeExist();
	location = __dirname + '\\data\\' + location + '.dat'
	if(fs.existsSync(location)) {
		fs.unlinkSync(location)
	}
}

function makeExist() {
	if(!fs.existsSync(__dirname + '\\data')) {
		fs.mkdirSync(__dirname + '\\data');
	}
}