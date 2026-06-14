const defaultExportPlacement = require('./rules/default-export-placement.js');
const noInlineProps = require('./rules/no-inline-props.js');
const propsTypeOrder = require('./rules/props-type-order.js');
const requireChildrenUsage = require('./rules/require-children-usage.js');

const plugin = {
	meta: {
		name: 'eslint-plugin-expo-magic',
	},
	rules: {
		'default-export-placement': defaultExportPlacement,
		'no-inline-props': noInlineProps,
		'props-type-order': propsTypeOrder,
		'require-children-usage': requireChildrenUsage,
	},
};

module.exports = plugin;
