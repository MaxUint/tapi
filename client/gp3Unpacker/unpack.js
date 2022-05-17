let output = `C:\Users\Zom\Documents\GitHub\tapi\client\tapi\hpi_in` //Edit this to be hpi_in where tapi is installed

const fs = require('fs')
function HPIDump(file) {
	
	fs.rmSync(output, {
        recursive: true,
        force: true
    });
	
	const { execFile } = require('child_process');

	const child = execFile('HPIDump.exe', [file, '-o', output], (error, stdout, stderr) => {
	  if (error) {
		throw error;
	  }
	  console.log(stdout);
	});
}


function get_gp3() {
	let ta_files = fs.readdirSync('../'), found
	ta_files.forEach(function(file){
		if(found) return
		file = file.toLowerCase()
		if(file.includes('.gp3') && file != 'rev31.gp3') {
			found = file
		}
	})
	return require('path').resolve(__dirname, '..')+'\\'+found
}
console.log('unpacking', get_gp3(), 'to', output, '...')
HPIDump(get_gp3())


