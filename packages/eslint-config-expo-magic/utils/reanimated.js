const { createRestrictedSyntaxConfigs } = require('./restricted-syntax.js');

const typeScriptFiles = ['**/*.ts', '**/*.tsx'];
const DEFAULT_GESTURE_HOOKS = ['usePanGesture'];
const WRAPPER_EXPRESSION_TYPES = new Set([
	'ChainExpression',
	'TSAsExpression',
	'TSNonNullExpression',
	'TSSatisfiesExpression',
	'TSInstantiationExpression',
	'TSTypeAssertion',
]);
const SHARED_VALUE_MEMBER_PROPERTIES = new Set(['get', 'value']);
const ANIMATED_HOOKS = new Set([
	'useAnimatedStyle',
	'useAnimatedReaction',
	'useDerivedValue',
	'useAnimatedProps',
]);
const SHARED_VALUE_FACTORIES = new Set([
	'useDerivedValue',
	'useSharedValue',
]);
const SHARED_VALUE_INITIALIZER_HOOKS = new Set(['useSharedValue']);
const SHARED_VALUE_TYPES = new Set(['SharedValue', 'DerivedValue']);
const REANIMATED_MODULE = 'react-native-reanimated';
const PLUGIN_NAME = 'expo-magic-reanimated';
const RULE_NAME = 'no-shared-value-misuse';

function getStaticPropertyName(node) {
	if (
		node?.type !== 'MemberExpression' ||
		(node.computed && node.property.type !== 'Literal')
	) {
		return '';
	}

	if (node.property.type === 'Identifier') {
		return node.property.name;
	}

	return String(node.property.value);
}

function unwrapExpression(node) {
	let expression = node;
	while (expression && WRAPPER_EXPRESSION_TYPES.has(expression.type)) {
		expression = expression.expression;
	}

	return expression;
}

function buildBindingMaps(scopeManager) {
	const definitions = new Map();
	const references = new Map();

	for (const scope of scopeManager.scopes) {
		for (const variable of scope.variables) {
			for (const definition of variable.defs) {
				if (definition.name?.type === 'Identifier') {
					definitions.set(definition.name, variable);
				}
			}

			for (const reference of variable.references) {
				references.set(reference.identifier, variable);
			}
		}

		for (const reference of scope.references) {
			if (reference.resolved) {
				references.set(reference.identifier, reference.resolved);
			}
		}
	}

	return { definitions, references };
}

function getImportBindings(program, definitions) {
	const importedNames = new Map();
	const namespaces = new Set();

	for (const statement of program.body) {
		if (
			statement.type !== 'ImportDeclaration' ||
			statement.source.value !== REANIMATED_MODULE
		) {
			continue;
		}

		for (const specifier of statement.specifiers) {
			const variable = definitions.get(specifier.local);
			if (!variable) {
				continue;
			}

			if (specifier.type === 'ImportNamespaceSpecifier') {
				namespaces.add(variable);
				continue;
			}

			if (specifier.type === 'ImportSpecifier') {
				importedNames.set(
					variable,
					String(specifier.imported.name ?? specifier.imported.value),
				);
			}
		}
	}

	return { importedNames, namespaces };
}

function getImportedName(expression, references, importedNames, namespaces) {
	const callee = unwrapExpression(expression);
	if (!callee) {
		return '';
	}

	if (callee.type === 'Identifier') {
		return importedNames.get(references.get(callee)) ?? '';
	}

	if (callee.type === 'MemberExpression') {
		const object = unwrapExpression(callee.object);
		if (
			object?.type === 'Identifier' &&
			namespaces.has(references.get(object))
		) {
			return getStaticPropertyName(callee);
		}
	}

	return '';
}

function typeIsSharedValue(typeNode, references, importedNames, namespaces) {
	if (!typeNode) {
		return false;
	}

	if (typeNode.type === 'TSTypeAnnotation') {
		return typeIsSharedValue(
			typeNode.typeAnnotation,
			references,
			importedNames,
			namespaces,
		);
	}

	if (typeNode.type === 'TSUnionType' || typeNode.type === 'TSIntersectionType') {
		return typeNode.types.some((member) =>
			typeIsSharedValue(member, references, importedNames, namespaces),
		);
	}

	if (typeNode.type === 'TSParenthesizedType') {
		return typeIsSharedValue(
			typeNode.typeAnnotation,
			references,
			importedNames,
			namespaces,
		);
	}

	if (typeNode.type !== 'TSTypeReference') {
		return false;
	}

	const typeName = typeNode.typeName;
	if (typeName.type === 'Identifier') {
		return SHARED_VALUE_TYPES.has(
			importedNames.get(references.get(typeName)) ?? '',
		);
	}

	if (typeName.type === 'TSQualifiedName') {
		const namespace = typeName.left;
		return (
			namespace.type === 'Identifier' &&
			namespaces.has(references.get(namespace)) &&
			SHARED_VALUE_TYPES.has(typeName.right.name)
		);
	}

	return false;
}

function collectSharedValueBindings({
	identifiers,
	variableDeclarators,
	definitions,
	references,
	importedNames,
	namespaces,
}) {
	const sharedValues = new Set();

	for (const identifier of identifiers) {
		const variable = definitions.get(identifier);
		if (
			variable &&
			typeIsSharedValue(
				identifier.typeAnnotation,
				references,
				importedNames,
				namespaces,
			)
		) {
			sharedValues.add(variable);
		}
	}

	let changed = true;
	while (changed) {
		changed = false;

		for (const declarator of variableDeclarators) {
			if (declarator.id.type !== 'Identifier') {
				continue;
			}

			const variable = definitions.get(declarator.id);
			if (!variable || sharedValues.has(variable)) {
				continue;
			}

			const init = unwrapExpression(declarator.init);
			if (!init) {
				continue;
			}

			const initsSharedValue =
				(init.type === 'CallExpression' &&
					SHARED_VALUE_FACTORIES.has(
						getImportedName(
							init.callee,
							references,
							importedNames,
							namespaces,
						),
					)) ||
				(init.type === 'Identifier' &&
					sharedValues.has(references.get(init)));

			if (initsSharedValue) {
				sharedValues.add(variable);
				changed = true;
			}
		}
	}

	return sharedValues;
}

function isWithinImportedHook(
	node,
	expectedNames,
	references,
	importedNames,
	namespaces,
) {
	let current = node;

	while (current.parent) {
		const parent = current.parent;
		if (
			parent.type === 'CallExpression' &&
			parent.arguments.includes(current) &&
			expectedNames.has(
				getImportedName(
					parent.callee,
					references,
					importedNames,
					namespaces,
				),
			)
		) {
			return true;
		}

		current = parent;
	}

	return false;
}

function isSharedValueMember(node, references, sharedValues) {
	const object = unwrapExpression(node.object);
	return (
		object?.type === 'Identifier' && sharedValues.has(references.get(object))
	);
}

const sharedValueUsageRule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Prevent render-time SharedValue initialization and worklet `.get()` reads.',
		},
		schema: [],
		messages: {
			initializeFromSharedValue:
				'Do not initialize `useSharedValue(...)` from another SharedValue. Initialize from a plain value and sync later.',
			getInWorklet:
				'Use `.value`, not `.get()`, when reading SharedValues inside Reanimated worklet hooks.',
		},
	},
	create(context) {
		const identifiers = [];
		const memberExpressions = [];
		const variableDeclarators = [];

		return {
			Identifier(node) {
				if (node.typeAnnotation) {
					identifiers.push(node);
				}
			},
			MemberExpression(node) {
				memberExpressions.push(node);
			},
			VariableDeclarator(node) {
				variableDeclarators.push(node);
			},
			'Program:exit'(program) {
				const { definitions, references } = buildBindingMaps(
					context.sourceCode.scopeManager,
				);
				const { importedNames, namespaces } = getImportBindings(
					program,
					definitions,
				);
				const sharedValues = collectSharedValueBindings({
					identifiers,
					variableDeclarators,
					definitions,
					references,
					importedNames,
					namespaces,
				});

				for (const member of memberExpressions) {
					const propertyName = getStaticPropertyName(member);
					if (
						!SHARED_VALUE_MEMBER_PROPERTIES.has(propertyName) ||
						(propertyName === 'get' &&
							(member.parent?.type !== 'CallExpression' ||
								member.parent.callee !== member)) ||
						!isSharedValueMember(member, references, sharedValues)
					) {
						continue;
					}

					if (
						isWithinImportedHook(
							member,
							SHARED_VALUE_INITIALIZER_HOOKS,
							references,
							importedNames,
							namespaces,
						)
					) {
						context.report({
							node: member,
							messageId: 'initializeFromSharedValue',
						});
						continue;
					}

					if (
						propertyName === 'get' &&
						isWithinImportedHook(
							member,
							ANIMATED_HOOKS,
							references,
							importedNames,
							namespaces,
						)
					) {
						context.report({ node: member, messageId: 'getInWorklet' });
					}
					}
			},
		};
		},
	};

const sharedValueUsagePlugin = {
	rules: {
		[RULE_NAME]: sharedValueUsageRule,
	},
};

function createSharedValueUsageConfig() {
	return [
		{
			files: typeScriptFiles,
			plugins: {
				[PLUGIN_NAME]: sharedValueUsagePlugin,
			},
			rules: {
				[`${PLUGIN_NAME}/${RULE_NAME}`]: 'error',
			},
		},
	];
}

function createRestrictedSyntaxGroups(options = {}) {
	const gestureHooks = [
		...(options.gestureHooks ?? DEFAULT_GESTURE_HOOKS),
		...(options.additionalGestureHooks ?? []),
	];

	if (gestureHooks.length === 0) {
		return [];
	}

	return [
		{
			files: typeScriptFiles,
			selectors: [
				{
					selector: `CallExpression[callee.name=/^(${gestureHooks.join('|')})$/] > ObjectExpression`,
					message:
						'Memoize gesture config before passing it to RNGH gesture hooks so Reanimated does not rebuild worklet closures on every render.',
				},
			],
		},
	];
}

function createReanimatedConfig(options = {}) {
	return [
		...createSharedValueUsageConfig(),
		...createRestrictedSyntaxConfigs(createRestrictedSyntaxGroups(options)),
	];
}

const restrictedSyntaxGroups = createRestrictedSyntaxGroups();
const config = createReanimatedConfig();

module.exports = config;
module.exports.createReanimatedConfig = createReanimatedConfig;
module.exports.createRestrictedSyntaxGroups = createRestrictedSyntaxGroups;
module.exports.createSharedValueUsageConfig = createSharedValueUsageConfig;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
module.exports.sharedValueUsageRule = sharedValueUsageRule;
