var mcmetas = {};

var compileCallback = (e) => {
	e.model.mcmetas = mcmetas;
};

var parseCallback = (e) => {
	Object.assign(mcmetas, e.model.mcmetas);
};

(function() {
    let editButton;
    let importButton;

    Plugin.register('mcmeta', {
        title: 'Save MCMeta',
        author: 'Ticxo',
        description: 'Save MCMeta files to bbmodel because Jannis won\'t do it.',
        icon: 'save',
        version: '0.0.1',
        variant: 'both',
        onload() {

			Codecs.project.on('compile', compileCallback);
			Codecs.project.on('parse', parseCallback);

            editButton = new Action('edit_mcmeta', {
                name: 'Edit MCMeta',
                description: 'Edit a MCMeta file.',
                icon: 'edit',
                click() {
                    setBoneTypeMenu().show();
                }
            });

            importButton = new Action('import_mcmeta', {
                name: 'Import MCMeta',
                description: 'Import a MCMeta file.',
                icon: 'file_download',
                click() {
                    Blockbench.import({
                        extensions: ['mcmeta']
                    }, function(files) {
                        files.forEach(file => {
                            mcmetas[Texture.selected.uuid] = JSON.parse(file.content);
                        })
                    });
                }
            });
            
            Texture.prototype.menu.addAction('_');
            Texture.prototype.menu.addAction(editButton);
            Texture.prototype.menu.addAction(importButton);
        },
        onunload() {

            Codecs.project.events.compile.remove(compileCallback);
            Codecs.project.events.parse.remove(parseCallback);

            Texture.prototype.menu.structure.remove(editButton);
            Texture.prototype.menu.structure.remove(importButton);

            editButton.delete();
        }
    });

})();

function setBoneTypeMenu(){

	let op = mcmetas[Texture.selected.uuid];
	function getExtra() {
		return op ? JSON.stringify(op, null, 4) : '';
	}

	let mcmetaDialog = new Dialog({
		id: 'mcmeta_dialog',
		title: 'MCMeta',
		form: {
			mcmeta: {
				label: 'MCMeta',
				type: 'textarea',
				placeholder: 'mcmeta json...',
				value: getExtra()
			}
		},
		onConfirm: function(formData) {
			mcmetas[Texture.selected.uuid] = JSON.parse(formData.mcmeta);
			this.hide();
		},
		onCancel: function(formData) {
			this.hide();
		}
	});

	return mcmetaDialog;
}