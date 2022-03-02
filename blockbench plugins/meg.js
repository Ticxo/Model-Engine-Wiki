
var maxSize = 112
var coolRotations = [-45, -22.5, 0, 22.5, 45]

var text_noErrors = 'No errors found!'
var text_cubeButton = 'See cube'
var text_boneButton = 'See bone'
var text_quickFix = 'Quick fix [_]'

var codeViewDialog;

const mathDiff = (a, b) => {
    return Math.abs(a - b);
}

var errorListAction;

function generateErrorAction() {
	errorListAction = new Action('meg_error_list', {
		name: 'Show Error List',
		icon: 'report',
		category: 'edit',
		keybind: new Keybind({key: 'y'}), 
		click: function () {
			displayErrorList();
		}
	})
}

function displayErrorList() {

	let templateHTML = '';
	let quickFixableErrors = false;

	Outliner.elements.forEach(cube => {

		if(typeof cube.parent !== 'string' && cube.parent.name.toLowerCase() === 'hitbox')
			return;

		let cubeErrors = getCubeErrors(cube)
		if(cubeErrors.length > 0) {
			let parentName = typeof cube.parent === 'string' ? cube.parent : cube.parent.name
			let errorList = '';
			var entryButton = `<button @click="fixCube('${cube.uuid}', 'orientation', 'newVal')"style="height:10%;width=10%">${text_quickFix}</button>`;
			cubeErrors.forEach(error => {
				var button = '';
				var errorNumber = error.substring(error.indexOf('[') + 1, error.lastIndexOf(']'));
				if(error.includes('rotation')) {
				  var targetNumber = 0;
				  coolRotations.forEach(rotation => {
				    if(mathDiff(errorNumber, rotation)<2.5 && mathDiff(errorNumber, rotation)>0) {
					  quickFixableErrors = true;

					  targetNumber = rotation
					  let orientation = error.split(' ')[1]
					  button = entryButton;
				      button = button.replace('_', targetNumber).replace('orientation', orientation).replace('newVal', targetNumber);
					}
				  })
				}
				if(!coolRotations.includes(parseFloat(errorNumber))) // Don't ask me why this needs to be checked *here*, JS & BB weird
				  errorList += `<li>- ${error} ${button} </li>`
			})
			if(errorList.length!=0) {
				templateHTML += `
					<span style="font-size:18px"><span style="color:DodgerBlue">${parentName}</span>.<span style="color:Tomato">${cube.name}</span>:</span>
					<button @click="clickCube('${cube.uuid}')" style="float: right">${text_cubeButton}</button>
					<ul>${errorList}</ul>
					<hr>
				`
			}
		}
	})

	Group.all.forEach(bone => {
		if(bone.name === 'hitbox')
			return;

		let boneErrors = getBoneErrors(bone)
		if(boneErrors.length > 0) {
			let errorList = '';
			boneErrors.forEach(error => {
				errorList += `<li>- ${error}</li>`
			})
			templateHTML += `
				<span style="font-size:18px"><span style="color:DodgerBlue">${bone.name}</span>:</span>
				<button @click="clickBone('${bone.uuid}') "style="width: 10%; float: right;">${text_boneButton}</button>
				<ul>${errorList}</ul>
				<hr>
			`
		}
	})
    
	let result = templateHTML ? templateHTML : '<h3>'+text_noErrors+'</h3>'

	function quickFixCube(uuid, orientation, fix) {
		let cube = getCubeByUUID(uuid)
		if(cube!=null) {
			if(orientation==='X')
				cube.rotation[0] = fix;
			else if(orientation==='Y')
				cube.rotation[1] = fix;
			else
				cube.rotation[2] = fix;
			Blockbench.showQuickMessage("Fixed cube by ID "+uuid, 4000);	
		}
	}

	codeViewDialog = new Dialog({
		title: 'Errors',
		id: 'errors_menu',
		resizable: true,
		width: 650,
		singleButton: true,
		component: {
			methods: {

				fixCube(uuid, orientation, fix) {
					quickFixCube(uuid, orientation, fix);
				},
				clickCube(uuid) {
					let cube = getCubeByUUID(uuid)
					if(cube!=null) {
						Outliner.selected.forEach(element => {
							element.unselect()
						})
						cube.selectLow()
						TickUpdates.selection = true;
					}
					codeViewDialog.hide()
				},
				clickBone(uuid) {
					let bone = getBoneByUUID(uuid)
					if(bone!=null) { 
						Outliner.selected.forEach(element => {
							element.unselect()
						})
						bone.selectLow()
						TickUpdates.selection = true;
					}
					codeViewDialog.hide()
				}
			},
			template: `<div>${result}</div>`
		}
	}).show();

	if(quickFixableErrors) {
		button = $('<button class="confirm_btn cancel_btn" style="margin:5px;">Quick fix all errors</button>');

		button.click(function () {
			Outliner.elements.forEach(cube => {
				let cubeErrors = getCubeErrors(cube)
				if(cubeErrors.length > 0) {
					cubeErrors.forEach(error => {
						var errorNumber = error.substring(error.indexOf('[') + 1, error.lastIndexOf(']'));
						if(error.includes('rotation')) {
						  var targetNumber = 0;
						  coolRotations.forEach(rotation => {
							if(mathDiff(errorNumber, rotation)<2.5 && mathDiff(errorNumber, rotation)>0) {
							  targetNumber = rotation
							  let orientation = error.split(' ')[1]
							  quickFixCube(cube.uuid, orientation, targetNumber);
							}
						  })
						}
					})
				}
			}
		)})
	
		$('div.dialog_bar.button_bar').prepend(button);
	}
}

function getBoneErrors(bone) {
	let childrens = bone.children
	let errorList = []
	let minX, maxX, minY, maxY, minZ, maxZ

	for(let cube in childrens) {
		if(childrens.hasOwnProperty(cube)) {
			let childCube = childrens[cube]
			if(childCube.type !== 'cube')
				continue

			// Set the variables as ints if they don't exist
			if(minX == null) minX = childCube.from[0]
			if(maxX == null) maxX = childCube.to[0]
			if(minY == null) minY = childCube.from[1]
			if(maxY == null) maxY = childCube.to[1]
			if(minZ == null) minZ = childCube.from[2]
			if(maxZ == null) maxZ = childCube.to[2]


			if(minX>childCube.from[0]) minX = childCube.from[0]
			if(maxX<childCube.to[0])   maxX = childCube.to[0]

			if(minY>childCube.from[1]) minY = childCube.from[1]
			if(maxY<childCube.to[1])   maxY = childCube.to[1]

			if(minZ>childCube.from[2]) minZ = childCube.from[2]
			if(maxZ<childCube.to[2])   maxZ = childCube.to[2]

		}
	}
	if( (x = Math.abs(maxX - minX)) > maxSize ) errorList.push('X exceeds '+maxSize+' in size [' + x + ']')
	if( (y = Math.abs(maxY - minY)) > maxSize ) errorList.push('Y exceeds '+maxSize+' in size [' + y + ']')
	if( (z = Math.abs(maxZ - minZ)) > maxSize ) errorList.push('Z exceeds '+maxSize+' in size [' + z + ']')
	return errorList
}

function getCubeErrors(cube) {
	let errorList = []

	if(!coolRotations.includes(cube.rotation[0])) errorList.push('Illegal X rotation [' + cube.rotation[0] + ']')
	if(!coolRotations.includes(cube.rotation[1])) errorList.push('Illegal Y rotation [' + cube.rotation[1] + ']')
	if(!coolRotations.includes(cube.rotation[2])) errorList.push('Illegal Z rotation [' + cube.rotation[2] + ']')
	if( (x = cube.to[0]-cube.from[0]) > maxSize ) errorList.push('X size must be lower than '+maxSize + ' [' + x + ']')
	if( (y = cube.to[1]-cube.from[1]) > maxSize ) errorList.push('Y size must be lower than '+maxSize + ' [' + y + ']')
	if( (z = cube.to[2]-cube.from[2]) > maxSize ) errorList.push('Z size must be lower than '+maxSize + ' [' + z + ']')
	return errorList
}

function getCubeByUUID(uuid) {
	let result;
	Outliner.elements.forEach(currentCube => {
		if(uuid==currentCube.uuid) {
			result = currentCube;
		}
	})
	return result;
} 

function getBoneByUUID(uuid) {
	let result;
	Outliner.elements.forEach(currentCube => {
		if(currentCube.parent && uuid==currentCube.parent.uuid) {
			result = currentCube.parent;
		}
	})
	return result;
} 
var boneOptions = {};

var boneOptionAction;

function generateBoneAction() {
	boneOptionAction = new Action('meg_bone_options', {
		name: 'Bone Options',
		icon: 'fas.fa-cogs',
		category: 'edit',
		//keybind: new Keybind({key: 113}), // Do we want to have a keybind?
		click: function () {
			setBoneTypeMenu().show();
		}
	})
	Group.prototype.menu.structure.push('_');
	Group.prototype.menu.addAction(boneOptionAction)
}

function setBoneTypeMenu(){

	let op = boneOptions[Group.selected.uuid];
	function getHead() {
		if(op)
			return op.is_head;
		return false;
	}
	function getMount() {
		if(op)
			return op.is_mount;
		return false;
	}
	function getHand() {
		if(op)
			return op.hand;
		return 'none';
	}
	function getDuplicate() {
		if(op)
			return op.duplicate;
		return '';
	}
	function getVariant() {
		if(op)
			return op.is_variant;
		return 'none';
	}
	function getExtra() {
		if(op)
			return op.extra;
		return '';
	}

	let boneTypeDialog = new Dialog({
		id: 'bone_option_dialog',
		title: 'Bone Options',
		form: {
			isHead: {
				label: 'Head',
				type: 'checkbox',
				value: getHead()
			},
			isMount: {
				label: 'Mount',
				type: 'checkbox',
				value: getMount()
			},
			isHand: {
				label: 'Hand',
				type: 'select',
				options: {
					none: 'Not Hand',
					left: 'Left',
					right: 'Right'
				},
				value: getHand()
			},
			isDuplicate: {
				label: 'Duplicate',
				type: 'input',
				placeholder: 'not duplicate',
				value: getDuplicate()
			},
			isVariant: {
				label: 'Bone Variant',
				type: 'select',
				options: {
					none: 'Default',
					texture: 'Texture',
					model: 'Model'
				},
				value: getVariant()
			},
			extraOptions: {
				label: 'Extra',
				type: 'textarea',
				placeholder: 'option1=value1\noption2=value2\n...',
				value: getExtra()
			}
		},
		onConfirm: function(formData) {
			if(op) {
				op.is_head = formData.isHead;
				op.is_mount = formData.isMount;
				op.hand = formData.isHand;
				op.duplicate = formData.isDuplicate;
				op.is_variant = formData.isVariant;
				op.extra = formData.extraOptions;
			}else {
				boneOptions[Group.selected.uuid] = {
					is_head: formData.isHead,
					is_mount: formData.isMount,
					hand: formData.isHand,
					duplicate: formData.isDuplicate,
					is_variant: formData.isVariant,
					extra: formData.extraOptions
				};
			}
			this.hide();
		},
		onCancel: function(formData) {
			this.hide();
		}
	});

	return boneTypeDialog;
}
var selectVariant;
var createVariant;
var deleteVariant;
var viewVariant;
var setVariant;
var renameVariant;

var variantBones = {};

class VariantSelect extends BarSelect {
	constructor(id, data) {
		super(id, data)
	}
	addOption(key, name) {
		this.options[key] = name;
		this.values.push(key);
		if(key in variantBones)
			return;
		variantBones[key] = {
			name: name,
			bones: []
		};
	}
	removeOption(key) {
		let index = this.values.indexOf(key);
		if(index > -1) {
			delete this.options[key];
			this.values.splice(index, 1);
			delete variantBones[key];
		}
	}
	renameOption(key, newName) {
		let newKey = newName.toLowerCase().replace(' ', '_');
		variantBones[newKey] = {
			name: newName,
			bones: variantBones[key].bones
		};
		removeOption(key);
		addOptions(newKey, newName);
	}
	containsOption(key) {
		return (key in this.options);
	}
}

function generateVariantActions() {

	selectVariant = new VariantSelect('meg_variant_select', {
		name: 'Model Variant',
		description: 'Show other variants of this model.',
		condition: {modes: ['edit', 'paint', 'animate']},
		value: 'default',
		options: {
			all: 'All',
			default: 'Default'
		},
		onChange: function(option) {
			showVariant(option.get());
		}
	});

	createVariant = new Action('meg_variant_add', {
		name: 'Create Variant',
		icon: 'person_add',
		category: 'edit',
		click: function () {
			showCreateVariantWindow();
		}
	});

	deleteVariant = new Action('meg_variant_remove', {
		name: 'Remove Variant',
		icon: 'delete',
		category: 'edit',
		click: function () {
			deleteSelectedVariant();
		}
	});

	viewVariant = new Action('meg_variant_show', {
		name: 'View Current Variant',
		icon: 'visibility',
		category: 'edit',
		click: function () {
			showVariant(selectVariant.get());
		}
	});

	setVariant = new Action('meg_variant_set', {
		name: 'Set View as Variant',
		icon: 'save',
		category: 'edit',
		click: function () {
			let variantSettings = [];
			Group.all.forEach(element => {

				if(!isBoneDefault(element.uuid)) // Don't loop through variant bones.
					return;
				
				element.children.every(group => {
					if(group.type === 'group' && !isBoneDefault(group.uuid) && group.visibility) { // Isolate variant bones.
						variantSettings.push(group.uuid);
						return false; // Immediately break out of look so it only selects 1 variant bone.
					}
					return true;
				});
			});
			variantBones[selectVariant.get()].bones = variantSettings;
			Blockbench.showToastNotification({
				text: `Saved current view to ${variantBones[selectVariant.get()].name}.`,
				color: 'Azure',
				expire: 2000
			});
		}
	});

	renameVariant = new Action('meg_variant_rename', {
		name: 'Rename Current Variant',
		icon: 'text_format',
		category: 'edit',
		click: function () {
			showRenameVariantWindow();
		}
	});
}

function addOptions(key, name) {
	selectVariant.addOption(key, name);
	selectVariant.set(key);
}

function removeOption(key) {
	selectVariant.removeOption(key);
}

function showCreateVariantWindow() {
	Blockbench.textPrompt(
		'', 
		'New Variant', 
		function(text) {
			let key = text.toLowerCase().replace(' ', '_');
			if(selectVariant.containsOption(key)) {
				Blockbench.showToastNotification({
					text: `Variant ${text} already exists.`,
					color: 'Tomato',
					expire: 2000
				});
			}else {
				addOptions(key, text);
				selectVariant.set(key);
				Blockbench.showToastNotification({
					text: `Variant created - ${text}.`,
					color: 'Azure',
					expire: 2000
				});
			}
		}
	);
	$('#text_input div.dialog_handle').text('Create Variant');
}

function deleteSelectedVariant() {
	let id = selectVariant.get();
	if(id === 'all' || id === 'default') {
		Blockbench.showToastNotification({
			text: `You can't delete this variant.`,
			color: 'Tomato',
			expire: 2000
		});
		return;
	}
	Blockbench.showToastNotification({
		text: `Variant deleted - ${selectVariant.getNameFor(selectVariant.get())}.`,
		color: 'Azure',
		expire: 2000
	});
	removeOption(selectVariant.get());
	selectVariant.set('default');
	showVariant('default');
}

function showVariant(variant) {

	if(variant === 'all') {
		Group.all.forEach(element => {
			element.visibility = true;
			element.children.forEach(cube => {
				cube.visibility = true;
			});
		});
		Canvas.updateVisibility();
		return;
	}

	if(variant === 'default') {
		Group.all.forEach(element => {
			element.visibility = !(element.uuid in boneOptions) || boneOptions[element.uuid].is_variant === 'none';
			element.children.forEach(cube => {
				cube.visibility = element.visibility;
			});
		});
		Canvas.updateVisibility();
		return;
	}

	let variantSettings = variantBones[variant].bones;
	if(!variantSettings)
		return;
	Group.all.forEach(element => {

		if(!isBoneDefault(element.uuid)) // Skipping all bones that are variant bones.
			return;

		let variantVis;
		element.children.forEach(group => {
			if(group.type !== 'group' || isBoneDefault(group.uuid)) // Isolating children that are variant bones.
				return;
			let vis = variantSettings.includes(group.uuid);
			group.visibility = vis;
			group.children.forEach(cube => {
				if(cube.type === 'group') // Groups within variant bones are not allowed. Skipping.
					return;
				cube.visibility = vis;
			});
			
			variantVis |= vis; // variant bone exists trigger.
		});

		element.visibility = !variantVis; // If a variant bone is present, hiding default bone.
		element.children.forEach(cube => {
			if(cube.type === 'group') // Isolating children cubes that are directly under this bone.
				return;
			cube.visibility = !variantVis;
		});

	});
	Canvas.updateVisibility();
}

function isBoneDefault(uuid) {
	return !(uuid in boneOptions) || boneOptions[uuid].is_variant === 'none';
}

function showRenameVariantWindow() {

	if(selectVariant.get() === 'all' || selectVariant.get() === 'default') {
		Blockbench.showToastNotification({
			text: `You cannot rename this variant.`,
			color: 'Tomato',
			expire: 2000
		});
		return;
	}

	Blockbench.textPrompt(
		'', 
		'New Name', 
		function(text) {
			let key = text.toLowerCase().replace(' ', '_');
			if(selectVariant.containsOption(key)) {
				Blockbench.showToastNotification({
					text: `Variant ${text} already exists.`,
					color: 'Tomato',
					expire: 2000
				});
			}else {
				selectVariant.renameOption(selectVariant.get(), text);
				Blockbench.showToastNotification({
					text: `Variant Rename - ${text}.`,
					color: 'Azure',
					expire: 2000
				});
			}
		}
	);
	$('#text_input div.dialog_handle').text('Rename Variant');
}
var compileCallback = (e) => {
	e.model.bone_option = boneOptions;
	e.model.variant = variantBones;
};

var parseCallback = (e) => {
	Object.assign(boneOptions, e.model.bone_option);
	Object.assign(variantBones, e.model.variant);

	for (const key in variantBones) {
		if (variantBones.hasOwnProperty(key)) {
			selectVariant.addOption(key, variantBones[key].name);
		}
	}
};

(function() {

	let button = $(`<div><button onclick="displayErrorList()" style="width: 100%">Error</button></div>`)
	let modeSelectCallback = (e)=> {
		if(e.mode.id == 'edit')
			$('#left_bar').append(button)
		else
			button.detach();

	}

	Plugin.register('meg', {
		title: 'ModelEngine',
		author: 'Pande, Ticxo',
		icon: 'icon',
		description: 'A ModelEngine addon for Blockbench',
		version: '0.1.0',
		variant: 'both',
		onload() {
			// Events
			Blockbench.on('select_mode', modeSelectCallback);
			Codecs.project.on('compile', compileCallback);
			Codecs.project.on('parse', parseCallback);

			// Menus
			generateBoneAction();
			generateErrorAction();
			generateVariantActions();

			if(Mode.selected.id == 'edit')
				$('#left_bar').append(button);

			Blockbench.showToastNotification({
				text: 'Model Engine Plugin is loaded!',
				color: 'Azure',
				expire: 2000
			});
		},

		onunload() {
			this.onuninstall()
		}, 

		onuninstall() {

			button.detach();

			Codecs.project.events.compile.remove(compileCallback);
			errorListAction.delete();
			boneOptionAction.delete();
			selectVariant.delete();
		}
	})
})();