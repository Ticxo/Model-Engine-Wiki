(function() {
    
    Plugin.register('meg_utils', {
        title: 'Model Engine Utils',
        author: 'Ticxo',
        description: 'Make your life easier.',
        icon: 'icon',
        version: '0.0.1',
        variant: 'both',
        onload() {
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
                console.log(Formats.free.codec.format.rotation_limit);
            });
            
        }
    });

})();