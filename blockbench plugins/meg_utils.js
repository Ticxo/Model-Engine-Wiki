(function() {
    
    Plugin.register('meg_utils', {
        title: 'Model Engine Utils',
        author: 'Ticxo',
        description: 'Make your life easier.',
        icon: 'icon',
        version: '0.0.1',
        variant: 'both',
        onload() {
			setFormat();
			setPositionScaler();
        }
    });

})();

function setFormat() {
	let format = new ModelFormat({
		id: 'free',
		icon: 'icon-format_free',
		meshes: true,
		rotate_cubes: true,
		bone_rig: true,
		centered_grid: true,
		rotation_limit: false,
		optional_box_uv: true,
		uv_rotation: true,
		animated_textures: true,
		animation_mode: true,
		locators: true,
		codec: Formats.free.codec
		});
	Formats.free.codec.format = format;
	
	Blockbench.on('update_selection', () => {
		Formats.free.codec.format.rotation_limit = !Group.selected;
	});
}

function setPositionScaler() {
	pos_scale_action = new Action({
		id:"scale_animations",
		name: 'Scale Animations',
		icon: 'settings_overscan',
		category: 'edit',
		click: function(ev) {
			
			new Dialog({
				id: 'scale_animations_dialog',
				title: 'Scale Position Keyframes',
				form: {
					origin: {
						label: 'Origin',
						type: 'vector'
					},
					scale: {
						label: 'Scale',
						type: 'vector',
						value: [1, 1, 1]
					}
				},
				onConfirm: function(formData) {
					
					let ox = formData.origin[0];
					let oy = formData.origin[1];
					let oz = formData.origin[2];
					
					let sx = formData.scale[0];
					let sy = formData.scale[1];
					let sz = formData.scale[2];
					
					Undo.initEdit({animations: Animator.animations});
					Animator.animations.forEach(a => {
						for (let key in a.animators) {
							a.animators[key].position.forEach(p => {
								p.data_points.forEach(points => {
									points.x = (points.x - ox) * sx + ox;
									points.y = (points.y - oy) * sy + oy;
									points.z = (points.z - oz) * sz + oz;
								});
							});
						}
					});
					Undo.finishEdit('scale keyframes')
					
					this.hide()
				}
			}).show();
			
		}
	});
	MenuBar.addAction(pos_scale_action, 'filter');
}