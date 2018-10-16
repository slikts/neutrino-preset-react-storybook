const path = require('path');
const fs = require('fs');
const generateConfig = require('@storybook/react/dist/server/config/webpack.config').default;

module.exports = (neutrino) => {
	neutrino.config.when(neutrino.options.storybook, (config) => {
		const {
			entry: { preview: previewEntry, manager: managerEntry },
			plugins,
		} = generateConfig(path.resolve(path.resolve(process.cwd(), './.storybook')));

		const indexEntry = config.entryPoints.get('index');
		config.entryPoints.clear();
		previewEntry.forEach((e, index) => {
			// magic, magic - include only polyfills and globals entries from storybook config
			if (index < 2) {
				config.entry('preview').add(e);
			}
		});
		indexEntry.values().forEach((e) => {
			// magic, magic - exclude all app entries
			if (/node_modules/.test(e)) {
				config.entry('preview').add(e);
			}
		});
		config.entry('preview').add(require.resolve(path.resolve(process.cwd(), './.storybook/config.js')));
		managerEntry.forEach((e, index) => {
			// magic, magic - insert addons module right before last entrypoint
			if (index === managerEntry.length - 1) {
				try {
					config.entry('manager').add(require.resolve(path.resolve(process.cwd(), './.storybook/addons.js')));
				} catch (e) {
					console.log('Not loading addons');
				}
			}
			config.entry('manager').add(e);
		});

		neutrino.config.plugins.delete('html-index');
		plugins.map((plugin, index) => {
			// magic, magic - only include html interpolation plugin and two html plugins from storybook config
			if (index < 3) {
				config.plugin(`storybook-plugin-${index}`).use(plugin);
			}
		});

		neutrino.config.module.rule('compile').include.add(path.resolve(process.cwd(), 'stories'));
	});
};
