// Dependency-free port of rules from eslint-plugin-testing-library@7.16.2
// (await-async-queries, no-await-sync-queries, no-debugging-utils, no-dom-import).
// Source: https://github.com/testing-library/eslint-plugin-testing-library
// License: MIT. Copyright (c) 2019 Mario Beltrán Alarcón
// The MIT permission notice of the original package applies to this port; the
// full text is in eslint-plugin-testing-library/LICENSE.
'use strict';

const LIBRARY_MODULES = [
	'@testing-library/dom',
	'@testing-library/angular',
	'@testing-library/react',
	'@testing-library/preact',
	'@testing-library/vue',
	'@testing-library/svelte',
	'@marko/testing-library',
];
const USER_EVENT_MODULE = '@testing-library/user-event';
const OLD_LIBRARY_MODULES = [
	'dom-testing-library',
	'vue-testing-library',
	'react-testing-library',
];
const SYNC_QUERIES_VARIANTS = ['getBy', 'getAllBy', 'queryBy', 'queryAllBy'];
const ASYNC_QUERIES_VARIANTS = ['findBy', 'findAllBy'];
const ALL_QUERIES_VARIANTS = [
	...SYNC_QUERIES_VARIANTS,
	...ASYNC_QUERIES_VARIANTS,
];
const ALL_QUERIES_METHODS = [
	'ByLabelText',
	'ByPlaceholderText',
	'ByText',
	'ByAltText',
	'ByTitle',
	'ByDisplayValue',
	'ByRole',
	'ByTestId',
];
const combineQueries = (variants, methods) => {
	const combined = [];
	variants.forEach((variant) => {
		const prefix = variant.replace('By', '');
		methods.forEach((method) => {
			combined.push(`${prefix}${method}`);
		});
	});
	return combined;
};
const ALL_QUERIES_COMBINATIONS = combineQueries(
	ALL_QUERIES_VARIANTS,
	ALL_QUERIES_METHODS,
);
const DEBUG_UTILS = [
	'debug',
	'logTestingPlaygroundURL',
	'prettyDOM',
	'logRoles',
	'logDOM',
	'prettyFormat',
];
const SETTING_OPTION_OFF = 'off';
const RENDER_NAME = 'render';

const getDocsUrl = (ruleName) =>
	`https://github.com/testing-library/eslint-plugin-testing-library/tree/main/docs/rules/${ruleName}.md`;

const isObjectNotArray = (value) =>
	typeof value === 'object' && value != null && !Array.isArray(value);

function deepMerge(first = {}, second = {}) {
	const keys = new Set(Object.keys(first).concat(Object.keys(second)));
	return Array.from(keys).reduce((acc, key) => {
		const firstHasKey = key in first;
		const secondHasKey = key in second;
		const firstValue = first[key];
		const secondValue = second[key];
		if (firstHasKey && secondHasKey) {
			if (isObjectNotArray(firstValue) && isObjectNotArray(secondValue)) {
				acc[key] = deepMerge(firstValue, secondValue);
			} else {
				acc[key] = secondValue;
			}
		} else if (firstHasKey) {
			acc[key] = firstValue;
		} else {
			acc[key] = secondValue;
		}
		return acc;
	}, {});
}

function applyDefault(defaultOptions, userOptions) {
	const options = structuredClone(defaultOptions);
	if (userOptions == null) return options;
	options.forEach((opt, i) => {
		if (userOptions[i] !== undefined) {
			const userOpt = userOptions[i];
			if (isObjectNotArray(userOpt) && isObjectNotArray(opt)) {
				options[i] = deepMerge(opt, userOpt);
			} else {
				options[i] = userOpt;
			}
		}
	});
	return options;
}

const isOfType = (node, type) => node?.type === type;
const isIdentifier = (node) => isOfType(node, 'Identifier');
const isCallExpression = (node) => isOfType(node, 'CallExpression');
const isMemberExpression = (node) => isOfType(node, 'MemberExpression');
const isArrayExpression = (node) => isOfType(node, 'ArrayExpression');
const isArrowFunctionExpression = (node) =>
	isOfType(node, 'ArrowFunctionExpression');
const isFunctionExpression = (node) => isOfType(node, 'FunctionExpression');
const isFunctionDeclaration = (node) => isOfType(node, 'FunctionDeclaration');
const isBlockStatement = (node) => isOfType(node, 'BlockStatement');
const isReturnStatement = (node) => isOfType(node, 'ReturnStatement');
const isChainExpression = (node) => isOfType(node, 'ChainExpression');
const isExpressionStatement = (node) => isOfType(node, 'ExpressionStatement');
const isImportDeclaration = (node) => isOfType(node, 'ImportDeclaration');
const isImportSpecifier = (node) => isOfType(node, 'ImportSpecifier');
const isImportNamespaceSpecifier = (node) =>
	isOfType(node, 'ImportNamespaceSpecifier');
const isLiteral = (node) => isOfType(node, 'Literal');
const isObjectPattern = (node) => isOfType(node, 'ObjectPattern');
const isProperty = (node) => isOfType(node, 'Property');
const isAwaitExpression = (node) => isOfType(node, 'AwaitExpression');
const isVariableDeclarator = (node) => isOfType(node, 'VariableDeclarator');
const isFunction = (node) =>
	isArrowFunctionExpression(node) ||
	isFunctionDeclaration(node) ||
	isFunctionExpression(node);

const ValidLeftHandSideExpressions = [
	'CallExpression',
	'ClassExpression',
	'ClassDeclaration',
	'FunctionExpression',
	'Literal',
	'TemplateLiteral',
	'MemberExpression',
	'ArrayExpression',
	'ArrayPattern',
	'Identifier',
	'JSXElement',
	'JSXFragment',
	'JSXOpeningElement',
	'MetaProperty',
	'ObjectExpression',
	'ObjectPattern',
	'Super',
	'ThisExpression',
	'TSNullKeyword',
	'TaggedTemplateExpression',
	'TSNonNullExpression',
	'TSAsExpression',
	'ArrowFunctionExpression',
];

function findClosestCallExpressionNode(node, shouldRestrictInnerScope = false) {
	if (isCallExpression(node)) return node;
	if (!node?.parent) return null;
	if (
		shouldRestrictInnerScope &&
		!ValidLeftHandSideExpressions.includes(node.parent.type)
	) {
		return null;
	}
	return findClosestCallExpressionNode(node.parent, shouldRestrictInnerScope);
}

function findClosestFunctionExpressionNode(node) {
	if (!node) return null;
	if (
		isArrowFunctionExpression(node) ||
		isFunctionExpression(node) ||
		isFunctionDeclaration(node)
	) {
		return node;
	}
	return findClosestFunctionExpressionNode(node.parent);
}

function hasPromiseHandlerProperty(node) {
	return (
		isMemberExpression(node) &&
		isIdentifier(node.property) &&
		['then', 'catch', 'finally'].includes(node.property.name)
	);
}

function hasChainedPromiseHandler(node) {
	const parent = node.parent;
	if (isCallExpression(parent) && parent.parent) {
		return hasPromiseHandlerProperty(parent.parent);
	}
	return !!parent && hasPromiseHandlerProperty(parent);
}

function isPromiseIdentifier(node) {
	return isIdentifier(node) && node.name === 'Promise';
}

function isPromiseAll(node) {
	return (
		isMemberExpression(node.callee) &&
		isPromiseIdentifier(node.callee.object) &&
		isIdentifier(node.callee.property) &&
		node.callee.property.name === 'all'
	);
}

function isPromiseAllSettled(node) {
	return (
		isMemberExpression(node.callee) &&
		isPromiseIdentifier(node.callee.object) &&
		isIdentifier(node.callee.property) &&
		node.callee.property.name === 'allSettled'
	);
}

function isPromisesArrayResolved(node) {
	const closestCallExpression = findClosestCallExpressionNode(node, true);
	if (!closestCallExpression) return false;
	return (
		!!closestCallExpression.parent &&
		isArrayExpression(closestCallExpression.parent) &&
		isCallExpression(closestCallExpression.parent.parent) &&
		(isPromiseAll(closestCallExpression.parent.parent) ||
			isPromiseAllSettled(closestCallExpression.parent.parent))
	);
}

const matcherNamesHandlePromise = [
	'resolves',
	'rejects',
	'toResolve',
	'toReject',
	'toBeRejected',
	'toBeRejectedWith',
	'toBeRejectedWithError',
	'toBePending',
	'toBeResolved',
	'toBeResolvedTo',
];

function hasClosestExpectHandlesPromise(node) {
	if (
		isCallExpression(node) &&
		isIdentifier(node.callee) &&
		node.parent &&
		isMemberExpression(node.parent) &&
		['expect', 'expectAsync'].includes(node.callee.name)
	) {
		const expectMatcher = node.parent.property;
		return (
			isIdentifier(expectMatcher) &&
			matcherNamesHandlePromise.includes(expectMatcher.name)
		);
	}
	if (!node.parent) return false;
	return hasClosestExpectHandlesPromise(node.parent);
}

function getRootExpression(expression) {
	const { parent } = expression;
	if (parent == null) return expression;
	switch (parent.type) {
		case 'ConditionalExpression':
			return getRootExpression(parent);
		case 'LogicalExpression': {
			let rootExpression;
			switch (parent.operator) {
				case '??':
				case '||':
					rootExpression = getRootExpression(parent);
					break;
				case '&&':
					rootExpression =
						parent.right === expression
							? getRootExpression(parent)
							: expression;
					break;
			}
			return rootExpression ?? expression;
		}
		case 'SequenceExpression':
			return parent.expressions[parent.expressions.length - 1] === expression
				? getRootExpression(parent)
				: expression;
		case 'ChainExpression':
			return getRootExpression(parent);
		default:
			return expression;
	}
}

function isPromiseHandled(nodeIdentifier) {
	const closestCallExpressionNode = findClosestCallExpressionNode(
		nodeIdentifier,
		true,
	);
	return [
		nodeIdentifier,
		closestCallExpressionNode == null
			? null
			: getRootExpression(closestCallExpressionNode),
	]
		.filter((node) => node != null)
		.some((node) => {
			if (!node.parent) return false;
			if (isAwaitExpression(node.parent)) return true;
			if (
				isArrowFunctionExpression(node.parent) ||
				isReturnStatement(node.parent)
			) {
				return true;
			}
			if (hasClosestExpectHandlesPromise(node.parent)) return true;
			if (hasChainedPromiseHandler(node)) return true;
			if (isPromisesArrayResolved(node)) return true;
			return undefined;
		});
}

function getVariableReferences(context, node) {
	if (isVariableDeclarator(node)) {
		return (
			context.sourceCode.getDeclaredVariables(node)[0]?.references?.slice(1) ??
			[]
		);
	}
	return [];
}

function getInnermostScope(initialScope, node) {
	const location = node.range[0];
	let scope = initialScope;
	let found = false;
	do {
		found = false;
		for (const childScope of scope.childScopes) {
			const range = childScope.block.range;
			if (range[0] <= location && location < range[1]) {
				scope = childScope;
				found = true;
				break;
			}
		}
	} while (found);
	return scope;
}

function getInnermostFunctionScope(context, asyncQueryNode) {
	const innermostScope = getInnermostScope(
		context.sourceCode.getScope(asyncQueryNode),
		asyncQueryNode,
	);
	if (innermostScope.type === 'function' && isFunction(innermostScope.block)) {
		return innermostScope;
	}
	return null;
}

function getFunctionReturnStatementNode(functionNode) {
	if (isBlockStatement(functionNode.body)) {
		const returnStatementNode = functionNode.body.body.find((statement) =>
			isReturnStatement(statement),
		);
		if (!returnStatementNode) return null;
		return returnStatementNode.argument;
	} else if (functionNode.expression) {
		return functionNode.body;
	}
	return null;
}

function getDeepestIdentifierNode(node) {
	if (isIdentifier(node)) return node;
	if (isChainExpression(node)) return getDeepestIdentifierNode(node.expression);
	if (isMemberExpression(node) && isIdentifier(node.property)) {
		return node.property;
	}
	if (isCallExpression(node)) return getDeepestIdentifierNode(node.callee);
	if (isAwaitExpression(node)) return getDeepestIdentifierNode(node.argument);
	return null;
}

function getPropertyIdentifierNode(node) {
	if (isIdentifier(node)) return node;
	if (isMemberExpression(node)) return getPropertyIdentifierNode(node.object);
	if (isCallExpression(node)) return getPropertyIdentifierNode(node.callee);
	if (isExpressionStatement(node) || isChainExpression(node)) {
		return getPropertyIdentifierNode(node.expression);
	}
	if (isAwaitExpression(node)) return getPropertyIdentifierNode(node.argument);
	return null;
}

function getReferenceNode(node) {
	if (
		node.parent &&
		(isMemberExpression(node.parent) || isCallExpression(node.parent))
	) {
		return getReferenceNode(node.parent);
	}
	return node;
}

function getStaticKeyName(parent) {
	if (parent.computed) {
		const key = parent.key;
		if (key.type === 'Literal') {
			if (key.value === null) {
				if (key.regex) return `/${key.regex.pattern}/${key.regex.flags}`;
				if (key.bigint) return key.bigint;
			}
			return String(key.value);
		}
		if (
			key.type === 'TemplateLiteral' &&
			key.expressions.length === 0 &&
			key.quasis.length === 1
		) {
			return key.quasis[0].value.cooked;
		}
		return null;
	}
	if (parent.key.type === 'Literal') return String(parent.key.value);
	if (parent.key.type === 'PrivateIdentifier') return null;
	return parent.key.name;
}

function getFunctionNameWithKind(node) {
	const parent = node.parent;
	if (!parent) return '';
	const tokens = [];
	const isObjectMethod = parent.type === 'Property' && parent.value === node;
	const isClassMethod =
		parent.type === 'MethodDefinition' && parent.value === node;
	const isClassFieldMethod =
		parent.type === 'PropertyDefinition' && parent.value === node;

	if (isClassMethod || isClassFieldMethod) {
		if (parent.static) tokens.push('static');
		if (parent.key.type === 'PrivateIdentifier') tokens.push('private');
	}
	if (node.async) tokens.push('async');
	if (node.generator) tokens.push('generator');

	if (isObjectMethod || isClassMethod) {
		if (parent.kind === 'constructor') return 'constructor';
		if (parent.kind === 'get') tokens.push('getter');
		else if (parent.kind === 'set') tokens.push('setter');
		else tokens.push('method');
	} else if (isClassFieldMethod) {
		tokens.push('method');
	} else {
		if (node.type === 'ArrowFunctionExpression') tokens.push('arrow');
		tokens.push('function');
	}

	if (isObjectMethod || isClassMethod || isClassFieldMethod) {
		if (parent.key.type === 'PrivateIdentifier') {
			tokens.push(`#${parent.key.name}`);
		} else {
			const name = getStaticKeyName(parent);
			if (name) tokens.push(`'${name}'`);
		}
	} else if (node.id) {
		tokens.push(`'${node.id.name}'`);
	} else if (
		parent.type === 'VariableDeclarator' &&
		parent.id &&
		parent.id.type === 'Identifier'
	) {
		tokens.push(`'${parent.id.name}'`);
	} else if (
		(parent.type === 'AssignmentExpression' ||
			parent.type === 'AssignmentPattern') &&
		parent.left &&
		parent.left.type === 'Identifier'
	) {
		tokens.push(`'${parent.left.name}'`);
	} else if (
		parent.type === 'ExportDefaultDeclaration' &&
		parent.declaration === node
	) {
		tokens.push("'default'");
	}

	return tokens.join(' ');
}

function getFunctionName(node) {
	return (
		getFunctionNameWithKind(node)
			.match(/('\w+')/g)?.[0]
			.replace(/'/g, '') ?? ''
	);
}

function getImportModuleName(node) {
	if (isImportDeclaration(node) && typeof node.source.value === 'string') {
		return node.source.value;
	}
	if (
		isCallExpression(node) &&
		isLiteral(node.arguments[0]) &&
		typeof node.arguments[0].value === 'string'
	) {
		return node.arguments[0].value;
	}
	return undefined;
}

function hasImportMatch(importNode, identifierName) {
	if (isIdentifier(importNode)) return importNode.name === identifierName;
	return importNode.local.name === identifierName;
}

function findClosestVariableDeclaratorNode(node) {
	if (!node) return null;
	if (isVariableDeclarator(node)) return node;
	return findClosestVariableDeclaratorNode(node.parent);
}

function findImportSpecifier(specifierName, node) {
	if (isImportDeclaration(node)) {
		const namedExport = node.specifiers.find((n) => {
			return (
				isImportSpecifier(n) &&
				isIdentifier(n.imported) &&
				[n.imported.name, n.local.name].includes(specifierName)
			);
		});
		if (namedExport) return namedExport;
		return node.specifiers.find((n) => isImportNamespaceSpecifier(n));
	}
	if (!isVariableDeclarator(node.parent)) return undefined;
	const requireNode = node.parent;
	if (isIdentifier(requireNode.id)) return requireNode.id;
	if (!isObjectPattern(requireNode.id)) return undefined;
	const property = requireNode.id.properties.find(
		(n) => isProperty(n) && isIdentifier(n.key) && n.key.name === specifierName,
	);
	if (!property) return undefined;
	return property.key;
}

const isOfficialTestingLibraryModule = (importSourceName) =>
	[...OLD_LIBRARY_MODULES, ...LIBRARY_MODULES, USER_EVENT_MODULE].includes(
		importSourceName,
	);
const isCustomTestingLibraryModule = (importSourceName, customModuleSetting) =>
	typeof customModuleSetting === 'string' &&
	importSourceName.endsWith(customModuleSetting);
const isTestingLibraryModule = (importSourceName, customModuleSetting) =>
	isOfficialTestingLibraryModule(importSourceName) ||
	isCustomTestingLibraryModule(importSourceName, customModuleSetting);

function detectTestingLibraryUtils(ruleCreate) {
	return (context, optionsWithDefault) => {
		const importedTestingLibraryNodes = [];
		let importedCustomModuleNode = null;
		let importedUserEventLibraryNode = null;
		const settings = context.settings || {};
		const customModuleSetting = settings['testing-library/utils-module'];
		const customRendersSetting = settings['testing-library/custom-renders'];
		const customQueriesSetting = settings['testing-library/custom-queries'];

		const isAggressiveModuleReportingEnabled = () => !customModuleSetting;
		const isAggressiveRenderReportingEnabled = () => {
			const isSwitchedOff = customRendersSetting === SETTING_OPTION_OFF;
			const hasCustomOptions =
				Array.isArray(customRendersSetting) && customRendersSetting.length > 0;
			return !isSwitchedOff && !hasCustomOptions;
		};
		const isAggressiveQueryReportingEnabled = () => {
			const isSwitchedOff = customQueriesSetting === SETTING_OPTION_OFF;
			const hasCustomOptions =
				Array.isArray(customQueriesSetting) && customQueriesSetting.length > 0;
			return !isSwitchedOff && !hasCustomOptions;
		};
		const getCustomModule = () => {
			if (
				!isAggressiveModuleReportingEnabled() &&
				customModuleSetting !== SETTING_OPTION_OFF
			) {
				return customModuleSetting;
			}
			return undefined;
		};
		const getCustomRenders = () => {
			if (
				!isAggressiveRenderReportingEnabled() &&
				customRendersSetting !== SETTING_OPTION_OFF
			) {
				return customRendersSetting;
			}
			return [];
		};
		const getCustomQueries = () => {
			if (
				!isAggressiveQueryReportingEnabled() &&
				customQueriesSetting !== SETTING_OPTION_OFF
			) {
				return customQueriesSetting;
			}
			return [];
		};
		const getTestingLibraryImportNode = () =>
			importedTestingLibraryNodes[0] ?? null;
		const getAllTestingLibraryImportNodes = () => importedTestingLibraryNodes;
		const getCustomModuleImportNode = () => importedCustomModuleNode;

		const isTestingLibraryImported = (isStrict = false) => {
			const isSomeModuleImported =
				importedTestingLibraryNodes.length !== 0 || !!importedCustomModuleNode;
			return (
				(!isStrict && isAggressiveModuleReportingEnabled()) ||
				isSomeModuleImported
			);
		};

		const isQuery = (node) => {
			if (!/^(get|query|find)(All)?By.+$/.test(node.name)) return false;
			if (isAggressiveQueryReportingEnabled()) return true;
			const customQueries = getCustomQueries();
			const isBuiltInQuery = ALL_QUERIES_COMBINATIONS.includes(node.name);
			const isReportableCustomQuery = customQueries.some((pattern) =>
				new RegExp(pattern).test(node.name),
			);
			return isBuiltInQuery || isReportableCustomQuery;
		};
		const isGetQueryVariant = (node) =>
			isQuery(node) && node.name.startsWith('get');
		const isQueryQueryVariant = (node) =>
			isQuery(node) && node.name.startsWith('query');
		const isFindQueryVariant = (node) =>
			isQuery(node) && node.name.startsWith('find');
		const isSyncQuery = (node) =>
			isGetQueryVariant(node) || isQueryQueryVariant(node);
		const isAsyncQuery = (node) => isFindQueryVariant(node);

		const findImportedTestingLibraryUtilSpecifier = (specifierName) => {
			const node = getCustomModuleImportNode() ?? getTestingLibraryImportNode();
			if (!node) return undefined;
			return findImportSpecifier(specifierName, node);
		};
		const getTestingLibraryImportedUtilSpecifier = (node) => {
			const identifierName = getPropertyIdentifierNode(node)?.name;
			if (!identifierName) return undefined;
			return findImportedTestingLibraryUtilSpecifier(identifierName);
		};
		const isNodeComingFromTestingLibrary = (node) => {
			const importNode = getTestingLibraryImportedUtilSpecifier(node);
			if (!importNode) return false;
			if (!getPropertyIdentifierNode(getReferenceNode(node))) return false;
			const importDeclaration = (() => {
				if (isImportDeclaration(importNode.parent)) return importNode.parent;
				const variableDeclarator =
					findClosestVariableDeclaratorNode(importNode);
				if (isCallExpression(variableDeclarator?.init)) {
					return variableDeclarator?.init;
				}
				return undefined;
			})();
			if (!importDeclaration) return false;
			const importDeclarationName = getImportModuleName(importDeclaration);
			if (!importDeclarationName) return false;
			const identifierName = getPropertyIdentifierNode(node)?.name;
			if (!identifierName) return false;
			return (
				hasImportMatch(importNode, identifierName) &&
				isTestingLibraryModule(importDeclarationName, customModuleSetting)
			);
		};
		const isPotentialTestingLibraryFunction = (
			node,
			isPotentialFunctionCallback,
		) => {
			if (!node) return false;
			const referenceNodeIdentifier = getPropertyIdentifierNode(
				getReferenceNode(node),
			);
			if (!referenceNodeIdentifier) return false;
			const importedUtilSpecifier = getTestingLibraryImportedUtilSpecifier(
				referenceNodeIdentifier,
			);
			const originalNodeName =
				isImportSpecifier(importedUtilSpecifier) &&
				isIdentifier(importedUtilSpecifier.imported) &&
				importedUtilSpecifier.local.name !== importedUtilSpecifier.imported.name
					? importedUtilSpecifier.imported.name
					: undefined;
			if (!isPotentialFunctionCallback(node.name, originalNodeName)) {
				return false;
			}
			if (isAggressiveModuleReportingEnabled()) return true;
			return isNodeComingFromTestingLibrary(referenceNodeIdentifier);
		};
		const isRenderUtil = (node) =>
			isPotentialTestingLibraryFunction(
				node,
				(identifierNodeName, originalNodeName) => {
					if (isAggressiveRenderReportingEnabled()) {
						return identifierNodeName.toLowerCase().includes(RENDER_NAME);
					}
					return [RENDER_NAME, ...getCustomRenders()].some(
						(validRenderName) =>
							validRenderName === identifierNodeName ||
							(Boolean(originalNodeName) &&
								validRenderName === originalNodeName),
					);
				},
			);
		const isRenderVariableDeclarator = (node) => {
			if (!node.init) return false;
			const initIdentifierNode = getDeepestIdentifierNode(node.init);
			if (!initIdentifierNode) return false;
			return isRenderUtil(initIdentifierNode);
		};
		const isDebugUtil = (identifierNode, validNames = DEBUG_UTILS) => {
			return (
				!(
					isMemberExpression(identifierNode.parent) &&
					isIdentifier(identifierNode.parent.object) &&
					identifierNode.parent.object.name === 'console'
				) &&
				isPotentialTestingLibraryFunction(
					identifierNode,
					(identifierNodeName, originalNodeName) => {
						return (
							validNames.includes(identifierNodeName) ||
							(!!originalNodeName && validNames.includes(originalNodeName))
						);
					},
				)
			);
		};
		const canReportErrors = () => isTestingLibraryImported();

		const helpers = {
			getAllTestingLibraryImportNodes,
			isSyncQuery,
			isAsyncQuery,
			isRenderVariableDeclarator,
			isRenderUtil,
			isDebugUtil,
		};

		const detectionInstructions = {
			ImportDeclaration(node) {
				if (typeof node.source.value !== 'string') return;
				if (isOfficialTestingLibraryModule(node.source.value)) {
					importedTestingLibraryNodes.push(node);
				}
				const customModule = getCustomModule();
				if (
					!importedCustomModuleNode &&
					isCustomTestingLibraryModule(node.source.value, customModule)
				) {
					importedCustomModuleNode = node;
				}
				if (
					!importedUserEventLibraryNode &&
					node.source.value === '@testing-library/user-event'
				) {
					importedUserEventLibraryNode = node;
				}
			},
			'CallExpression > Identifier[name="require"]'(node) {
				const callExpression = node.parent;
				const { arguments: args } = callExpression;
				if (
					args.some(
						(arg) =>
							isLiteral(arg) &&
							typeof arg.value === 'string' &&
							isOfficialTestingLibraryModule(arg.value),
					)
				) {
					importedTestingLibraryNodes.push(callExpression);
				}
				const customModule = getCustomModule();
				if (
					!importedCustomModuleNode &&
					args.some(
						(arg) =>
							isLiteral(arg) &&
							typeof arg.value === 'string' &&
							isCustomTestingLibraryModule(arg.value, customModule),
					)
				) {
					importedCustomModuleNode = callExpression;
				}
			},
		};

		const ruleInstructions = ruleCreate(context, optionsWithDefault, helpers);
		const enhancedRuleInstructions = {};
		new Set(
			Object.keys(detectionInstructions).concat(Object.keys(ruleInstructions)),
		).forEach((instruction) => {
			enhancedRuleInstructions[instruction] = (node) => {
				if (instruction in detectionInstructions) {
					detectionInstructions[instruction](node);
				}
				if (canReportErrors() && ruleInstructions[instruction]) {
					return ruleInstructions[instruction](node);
				}
				return undefined;
			};
		});
		return enhancedRuleInstructions;
	};
}

function createTestingLibraryRule({ name, meta, defaultOptions, create }) {
	const wrapped = detectTestingLibraryUtils(create);
	return {
		meta: { ...meta, docs: { ...meta.docs, url: getDocsUrl(name) } },
		create(context) {
			return wrapped(context, applyDefault(defaultOptions, context.options));
		},
	};
}

const addAsyncToFunctionFix = (fixer, ruleFix, functionExpression) => {
	if (functionExpression && !functionExpression.async) {
		functionExpression.async = true;
		return [ruleFix, fixer.insertTextBefore(functionExpression, 'async ')];
	}
	return ruleFix;
};

const awaitAsyncQueries = createTestingLibraryRule({
	name: 'await-async-queries',
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce promises from async queries to be handled',
			recommendedConfig: {
				dom: 'error',
				angular: 'error',
				react: 'error',
				vue: 'error',
				svelte: 'error',
				marko: 'error',
			},
		},
		messages: {
			awaitAsyncQuery:
				'promise returned from `{{ name }}` query must be handled',
			asyncQueryWrapper:
				'promise returned from `{{ name }}` wrapper over async query must be handled',
		},
		fixable: 'code',
		schema: [],
	},
	defaultOptions: [],
	create(context, _, helpers) {
		const functionWrappersNames = [];

		function detectAsyncQueryWrapper(node) {
			const innerFunction = getInnermostReturningFunction(context, node);
			if (innerFunction) {
				functionWrappersNames.push(getFunctionName(innerFunction));
			}
		}

		return {
			CallExpression(node) {
				const identifierNode = getDeepestIdentifierNode(node);
				if (!identifierNode) return;

				if (helpers.isAsyncQuery(identifierNode)) {
					detectAsyncQueryWrapper(identifierNode);

					const closestCallExpressionNode = findClosestCallExpressionNode(
						node,
						true,
					);
					if (!closestCallExpressionNode?.parent) return;

					const references = getVariableReferences(
						context,
						closestCallExpressionNode.parent,
					);

					if (references.length === 0) {
						if (!isPromiseHandled(identifierNode)) {
							context.report({
								node: identifierNode,
								messageId: 'awaitAsyncQuery',
								data: { name: identifierNode.name },
								fix: (fixer) => {
									if (
										isMemberExpression(identifierNode.parent) &&
										isIdentifier(identifierNode.parent.object)
									) {
										return fixer.insertTextBefore(
											identifierNode.parent,
											'await ',
										);
									}
									return fixer.insertTextBefore(identifierNode, 'await ');
								},
							});
							return;
						}
					}

					for (const reference of references) {
						if (
							isIdentifier(reference.identifier) &&
							!isPromiseHandled(reference.identifier)
						) {
							context.report({
								node: identifierNode,
								messageId: 'awaitAsyncQuery',
								data: { name: identifierNode.name },
								fix: (fixer) =>
									references.map((ref) =>
										fixer.insertTextBefore(ref.identifier, 'await '),
									),
							});
							return;
						}
					}
				} else if (
					functionWrappersNames.includes(identifierNode.name) &&
					!isPromiseHandled(identifierNode)
				) {
					context.report({
						node: identifierNode,
						messageId: 'asyncQueryWrapper',
						data: { name: identifierNode.name },
						fix: (fixer) => {
							const functionExpression =
								findClosestFunctionExpressionNode(node);
							if (!functionExpression) return null;

							let IdentifierNodeFixer;
							if (isMemberExpression(identifierNode.parent)) {
								IdentifierNodeFixer = fixer.insertTextBefore(
									identifierNode.parent,
									'await ',
								);
							} else {
								IdentifierNodeFixer = fixer.insertTextBefore(
									identifierNode,
									'await ',
								);
							}

							return addAsyncToFunctionFix(
								fixer,
								IdentifierNodeFixer,
								functionExpression,
							);
						},
					});
				}
			},
		};
	},
});

function getInnermostReturningFunction(context, node) {
	const functionScope = getInnermostFunctionScope(context, node);
	if (!functionScope) return undefined;
	const returnStatementNode = getFunctionReturnStatementNode(
		functionScope.block,
	);
	if (!returnStatementNode) return undefined;
	if (getDeepestIdentifierNode(returnStatementNode)?.name !== node.name) {
		return undefined;
	}
	return functionScope.block;
}

const noAwaitSyncQueries = createTestingLibraryRule({
	name: 'no-await-sync-queries',
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow unnecessary `await` for sync queries',
			recommendedConfig: {
				dom: 'error',
				angular: 'error',
				react: 'error',
				vue: 'error',
				svelte: 'error',
				marko: 'error',
			},
		},
		messages: {
			noAwaitSyncQuery:
				'`{{ name }}` query is sync so it does not need to be awaited',
		},
		schema: [],
		fixable: 'code',
	},
	defaultOptions: [],
	create(context, _, helpers) {
		return {
			'AwaitExpression > CallExpression'(node) {
				const awaitExpression = node.parent;
				const deepestIdentifierNode = getDeepestIdentifierNode(node);
				if (!deepestIdentifierNode) return;

				if (helpers.isSyncQuery(deepestIdentifierNode)) {
					context.report({
						node: deepestIdentifierNode,
						messageId: 'noAwaitSyncQuery',
						data: { name: deepestIdentifierNode.name },
						fix: (fixer) => {
							const awaitToken =
								context.sourceCode.getFirstToken(awaitExpression);
							return awaitToken ? fixer.remove(awaitToken) : null;
						},
					});
				}
			},
		};
	},
});

const noDebuggingUtils = createTestingLibraryRule({
	name: 'no-debugging-utils',
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow the use of debugging utilities like `debug`',
			recommendedConfig: {
				dom: false,
				angular: 'warn',
				react: 'warn',
				vue: 'warn',
				svelte: 'warn',
				marko: 'warn',
			},
		},
		messages: { noDebug: 'Unexpected debug statement' },
		schema: [
			{
				type: 'object',
				properties: {
					utilsToCheckFor: {
						type: 'object',
						properties: DEBUG_UTILS.reduce(
							(obj, name) => ({
								[name]: { type: 'boolean' },
								...obj,
							}),
							{},
						),
						additionalProperties: false,
					},
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [
		{
			utilsToCheckFor: {
				debug: true,
				logTestingPlaygroundURL: true,
				prettyDOM: true,
				logRoles: true,
				logDOM: true,
				prettyFormat: true,
			},
		},
	],
	create(context, [{ utilsToCheckFor = {} }], helpers) {
		const suspiciousDebugVariableNames = [];
		const suspiciousReferenceNodes = [];
		const renderWrapperNames = [];
		const builtInConsoleNodes = [];

		const utilsToReport = Object.entries(utilsToCheckFor)
			.filter(([, shouldCheckFor]) => shouldCheckFor)
			.map(([name]) => name);

		function detectRenderWrapper(node) {
			const innerFunction = getInnermostReturningFunction(context, node);
			if (innerFunction) {
				renderWrapperNames.push(getFunctionName(innerFunction));
			}
		}

		return {
			VariableDeclarator(node) {
				if (!node.init) return;

				const initIdentifierNode = getDeepestIdentifierNode(node.init);
				if (!initIdentifierNode) return;

				if (initIdentifierNode.name === 'console') {
					builtInConsoleNodes.push(node);
					return;
				}

				const isRenderWrapperVariableDeclarator = renderWrapperNames.includes(
					initIdentifierNode.name,
				);

				if (
					!helpers.isRenderVariableDeclarator(node) &&
					!isRenderWrapperVariableDeclarator
				) {
					return;
				}

				if (isObjectPattern(node.id)) {
					for (const property of node.id.properties) {
						if (
							isProperty(property) &&
							isIdentifier(property.key) &&
							utilsToReport.includes(property.key.name)
						) {
							const identifierNode = getDeepestIdentifierNode(property.value);
							if (identifierNode) {
								suspiciousDebugVariableNames.push(identifierNode.name);
							}
						}
					}
				}

				if (isIdentifier(node.id)) {
					suspiciousReferenceNodes.push(node.id);
				}
			},
			CallExpression(node) {
				const callExpressionIdentifier = getDeepestIdentifierNode(node);
				if (!callExpressionIdentifier) return;

				if (helpers.isRenderUtil(callExpressionIdentifier)) {
					detectRenderWrapper(callExpressionIdentifier);
				}

				const referenceIdentifier = getPropertyIdentifierNode(
					getReferenceNode(node),
				);
				if (!referenceIdentifier) return;

				const isDebugUtil = helpers.isDebugUtil(
					callExpressionIdentifier,
					utilsToReport,
				);
				const isDeclaredDebugVariable = suspiciousDebugVariableNames.includes(
					callExpressionIdentifier.name,
				);
				const isChainedReferenceDebug = suspiciousReferenceNodes.some(
					(suspiciousReferenceIdentifier) => {
						return (
							utilsToReport.includes(callExpressionIdentifier.name) &&
							suspiciousReferenceIdentifier.name === referenceIdentifier.name
						);
					},
				);

				if (
					!builtInConsoleNodes.some((variableDeclarator) => {
						return context.sourceCode
							.getDeclaredVariables(variableDeclarator)
							.some(
								({ name }) =>
									name === callExpressionIdentifier.name &&
									isCallExpression(callExpressionIdentifier.parent),
							);
					}) &&
					(isDebugUtil || isDeclaredDebugVariable || isChainedReferenceDebug)
				) {
					context.report({
						node: callExpressionIdentifier,
						messageId: 'noDebug',
					});
				}
			},
		};
	},
});

const DOM_TESTING_LIBRARY_MODULES = [
	'dom-testing-library',
	'@testing-library/dom',
];
const CORRECT_MODULE_NAME_BY_FRAMEWORK = {
	angular: '@testing-library/angular',
	marko: '@marko/testing-library',
};
const getCorrectModuleName = (moduleName, framework) => {
	return (
		CORRECT_MODULE_NAME_BY_FRAMEWORK[framework] ??
		moduleName.replace('dom', framework)
	);
};

const noDomImport = createTestingLibraryRule({
	name: 'no-dom-import',
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow importing from DOM Testing Library',
			recommendedConfig: {
				dom: false,
				angular: ['error', 'angular'],
				react: ['error', 'react'],
				vue: ['error', 'vue'],
				svelte: ['error', 'svelte'],
				marko: ['error', 'marko'],
			},
		},
		messages: {
			noDomImport:
				'import from DOM Testing Library is restricted, import from corresponding Testing Library framework instead',
			noDomImportFramework:
				'import from DOM Testing Library is restricted, import from {{module}} instead',
		},
		fixable: 'code',
		schema: [{ type: 'string' }],
	},
	defaultOptions: [''],
	create(context, [framework], helpers) {
		function report(node, moduleName) {
			if (!framework) {
				return context.report({
					node,
					messageId: 'noDomImport',
				});
			}

			const correctModuleName = getCorrectModuleName(moduleName, framework);

			context.report({
				data: { module: correctModuleName },
				fix(fixer) {
					if (isCallExpression(node)) {
						const name = node.arguments[0];
						return fixer.replaceText(
							name,
							name.raw.replace(moduleName, correctModuleName),
						);
					}
					const name = node.source;
					return fixer.replaceText(
						name,
						name.raw.replace(moduleName, correctModuleName),
					);
				},
				messageId: 'noDomImportFramework',
				node,
			});
		}

		return {
			'Program:exit'() {
				let importName;

				helpers.getAllTestingLibraryImportNodes().forEach((importNode) => {
					importName = getImportModuleName(importNode);

					const domModuleName = DOM_TESTING_LIBRARY_MODULES.find(
						(module) => module === importName,
					);

					if (!domModuleName) return;

					report(importNode, domModuleName);
				});
			},
		};
	},
});

module.exports = {
	meta: { name: 'testing-library' },
	rules: {
		'await-async-queries': awaitAsyncQueries,
		'no-await-sync-queries': noAwaitSyncQueries,
		'no-debugging-utils': noDebuggingUtils,
		'no-dom-import': noDomImport,
	},
};
