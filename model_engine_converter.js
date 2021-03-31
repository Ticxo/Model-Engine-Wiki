(function() {
	
	var batch_convert = new Action('batch_convert', {
		name: 'Batch Convert',
		description: 'Convert all Bedrock Entities to bbmodels.',
		icon: 'mediation',
		click: function() {
			convert();
		}
	});
			
	var help = new Action('help_dialog', {
		name: 'Help',
		description: 'Guide on using this tool.',
		icon: 'help',
		click: function() {
			help_dialog.show();
		}
	});
	
	var help_dialog = new Dialog({
		id: 'model_engine_help_dialog',
		title: 'Help',
		width: 800,
		lines : [
			'<div style = "height: 640px;overflow:auto;"><h3>What is this plugin?</h3><p>This plugin can convert multiple Bedrock Entity models into Blockbench project. It is primarily used for updating models from Model Engine 1.0 to 2.0.</p><h3>How to use?</h3><p>First, create a folder structure like this.</p><img src="https://raw.githubusercontent.com/Ticxo/Model-Engine-Wiki/master/wiki/blockbench/file_structure.png" width=600 height="auto" /><p>Then, copy the models, textures and animations to their respective folders, as shown below.</p><img src="https://raw.githubusercontent.com/Ticxo/Model-Engine-Wiki/master/wiki/blockbench/input_model.png" width=600 height="auto" /> <img src="https://raw.githubusercontent.com/Ticxo/Model-Engine-Wiki/master/wiki/blockbench/input_texture.png" width=600 height="auto" /> <img src="https://raw.githubusercontent.com/Ticxo/Model-Engine-Wiki/master/wiki/blockbench/input_animation.png" width=600 height="auto" /> <p>In Blockbench, go to Model Engine tab, and select Batch Convert. Blockbench would request some file inputs. Select all models you have copied over, and click Open.</p><img src="https://raw.githubusercontent.com/Ticxo/Model-Engine-Wiki/master/wiki/blockbench/bb_input.png" width=600 height="auto" /> <p>You can now see all the converted project files under output folder.</p><img src="https://raw.githubusercontent.com/Ticxo/Model-Engine-Wiki/master/wiki/blockbench/output.png" width=600 height="auto" /></div>'
		],
		singleButton: true
	});

	Plugin.register('model_engine_converter', {
		title: 'Model Engine Batch Converter',
		author: 'Ticxo',
		description: 'Batch converts all bedrock entities to bbmodels.',
		icon: 'mediation',
		version: '0.0.1',
		variant: 'desktop',
		
		onload() {
			// Create bar
			new BarMenu('model_engine', [], {
				name: "Model Engine"
			});
			
			MenuBar.update();
			MenuBar.addAction(batch_convert, 'model_engine');
			MenuBar.addAction(help, 'model_engine');
		},
		
		onunload() {
			batch_convert.delete();
			help.delete();
		}
	});

})();

function convert() {
	Blockbench.import({
		extensions: ['json'],
		type: 'Bedrock Entity Model',
		readtype: 'text',
		resource_id: 'model',
		multiple: true
	}, files => {
		files.forEach(file => {
			// Get the files
			var output = getPath(file.path, 'output\\' + file.name, 'bbmodel');
			var texture = new Texture({keep_size: true}).fromPath(getPath(file.path, 'texture\\' + file.name, 'png')).add();
			var animation = getPath(file.path, 'animation\\' + file.name, 'animation.json');
			
			// Parse the file using bedrock codec
			Codecs.bedrock.parse(autoParseJSON(file.content));
			// Load animation
			Blockbench.read([animation], {
					readtype: 'text'
				}, files => {
					autoImportFile(files[0]);
				}
			);
			
			// Convert to free type
			Formats['free'].convertTo();
			
			// Save the file using bbmodel codec
			Blockbench.writeFile(output, {
				content: Codecs.project.compile()
			});
			// Remove the old texture file
			texture.remove();
			
			// Reset the workspace
			resetProject();
			Modes.options.start.select();
			Modes.vue.$forceUpdate();
		});
	});
}

function getPath(path, name, extention) {
	var ar = path.split("\\");
	ar.pop();
	
	var name = name.split(".");
	name.pop();
	name.push(extention);
	name = name.join(".");
	
	ar.push(name);
	return ar.join("\\");
}

function autoImportFile(file) {
	let json = autoParseJSON(file.content)
	let keys = [];
	
	for (var key in json.animations) {
		keys.push(key);
	}
	
	file.json = json;
	if (keys.length > 0) {
		Animator.loadFile(file, keys);
	}
}