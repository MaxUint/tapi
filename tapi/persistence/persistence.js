const fs = require('fs');

function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}

exports.save = function(location, object) {
	log('saving', typeof object, 'at', location);
	let file_data = JSON.stringify(object);
	makeExist();
	fs.writeFileSync(__dirname + '\\data\\' + location + '.dat', file_data, 'utf8');
}

exports.load = function(location) {
	log('loading from', location);
	makeExist();
	if(fs.existsSync(__dirname + '\\data\\' + location + '.dat')) {
		let file_data = fs.readFileSync(__dirname + '\\data\\' + location + '.dat', 'utf8');
		return JSON.parse(file_data);
	} else return false;
}

exports.deleteCache = function() {
	fs.rmSync(__dirname + '\\data', { recursive: true, force: true });
	fs.mkdirSync(__dirname + '\\data');
}

function makeExist() {
	if(!fs.existsSync(__dirname + '\\data')) {
		fs.mkdirSync(__dirname + '\\data');
	}
}