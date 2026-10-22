/*
 * Dependency-free port of `unused-imports/no-unused-imports` from
 * eslint-plugin-unused-imports 4.4.1 (https://github.com/sweepline/eslint-plugin-unused-imports).
 *
 * The MIT License (MIT)
 * Copyright (c) 2022 Mikkel Holmer Pedersen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * The original filters the reports of @typescript-eslint's `no-unused-vars` to
 * import specifiers. This port decides usage itself from scope analysis plus
 * the AST positions the scope manager may not expose (JSX names, type
 * references), mirroring `react/jsx-uses-vars` and `react/jsx-uses-react`.
 */
'use strict';

const commaFilter = { filter: (token) => token.value === ',' };
const includeCommentsFilter = { includeComments: true };
const closeBraceFilter = { filter: (token) => token.value === '}' };
const specifierPattern = /^Import(|Default|Namespace)Specifier$/;
const jsxAnnotationPattern = /@jsx\s+([^\s]+)/;
const identifierPattern = /^[_$a-zA-Z][_$a-zA-Z0-9]*$/;

function isUsedInJSDoc(identifierName, sourceCode) {
	const jsdocPattern = new RegExp(
		`(?:@(?:link|linkcode|linkplain|see)\\s+${identifierName}\\b)|(?:\\{@(?:link|linkcode|linkplain)\\s+${identifierName}\\b\\})|(?:[@{](?:type|typedef|param|returns?|template|augments|extends|implements)\\s+[^}]*\\b${identifierName}\\b)`,
	);

	return sourceCode
		.getAllComments()
		.some(
			(comment) => comment.type === 'Block' && jsdocPattern.test(comment.value),
		);
}

function createFix(sourceCode, parent) {
	return (fixer) => {
		const grandParent = parent.parent;

		if (!grandParent) {
			return null;
		}

		if (grandParent.specifiers.length === 1) {
			const nextToken = sourceCode.getTokenAfter(
				grandParent,
				includeCommentsFilter,
			);
			const newLinesBetween = nextToken
				? nextToken.loc.start.line - grandParent.loc.start.line
				: 0;
			const endOfReplaceRange = nextToken
				? nextToken.range[0]
				: grandParent.range[1];
			const count = Math.max(0, newLinesBetween - 1);

			return [
				fixer.remove(grandParent),
				fixer.replaceTextRange(
					[grandParent.range[1], endOfReplaceRange],
					'\n'.repeat(count),
				),
			];
		}

		if (parent !== grandParent.specifiers[grandParent.specifiers.length - 1]) {
			const comma = sourceCode.getTokenAfter(parent, commaFilter);
			const prevNode = sourceCode.getTokenBefore(parent);

			return [
				fixer.removeRange([prevNode.range[1], parent.range[0]]),
				fixer.remove(parent),
				fixer.remove(comma),
			];
		}

		if (
			grandParent.specifiers.filter(
				(specifier) => specifier.type === 'ImportSpecifier',
			).length === 1
		) {
			const start = sourceCode.getTokenBefore(parent, commaFilter);
			const end = sourceCode.getTokenAfter(parent, closeBraceFilter);

			return fixer.removeRange([start.range[0], end.range[1]]);
		}

		return fixer.removeRange([
			sourceCode.getTokenBefore(parent, commaFilter).range[0],
			parent.range[1],
		]);
	};
}

function findVariable(sourceCode, name, node) {
	for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
		const variable = scope.set && scope.set.get(name);

		if (variable) {
			return variable;
		}
	}

	return null;
}

function getDeclaredVariable(sourceCode, specifier) {
	const declared = sourceCode.getDeclaredVariables
		? sourceCode.getDeclaredVariables(specifier)
		: [];

	return (
		declared.find((variable) => variable.name === specifier.local.name) ??
		findVariable(sourceCode, specifier.local.name, specifier)
	);
}

function rootOfQualifiedName(node) {
	let current = node;

	while (current) {
		if (current.type === 'TSQualifiedName') {
			current = current.left;
		} else if (current.type === 'MemberExpression') {
			current = current.object;
		} else {
			break;
		}
	}

	return current && current.type === 'Identifier' ? current : null;
}

function isTypeQueryReference(identifier) {
	let current = identifier.parent;

	while (current && current.type === 'TSQualifiedName') {
		current = current.parent;
	}

	return Boolean(current) && current.type === 'TSTypeQuery';
}

function isTypePredicateReference(identifier) {
	return (
		Boolean(identifier.parent) && identifier.parent.type === 'TSTypePredicate'
	);
}

function isTypeImport(variable) {
	return variable.defs.every(
		(def) =>
			def.type === 'ImportBinding' &&
			(def.parent?.importKind === 'type' || def.node?.importKind === 'type'),
	);
}

function readsOf(variable) {
	return variable.references.filter(
		(reference) => typeof reference.isRead !== 'function' || reference.isRead(),
	);
}

const rule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow unused imports',
			url: 'https://github.com/sweepline/eslint-plugin-unused-imports/blob/master/docs/rules/no-unused-imports.md',
		},
		fixable: 'code',
		schema: [],
		messages: {
			unusedVar: "'{{varName}}' is {{action}} but never used{{additional}}.",
		},
	},
	create(context) {
		const sourceCode = context.sourceCode || context.getSourceCode();
		const settings = (context.settings && context.settings.react) || {};
		const specifiers = [];
		const jsxUses = [];
		const typeUses = [];
		const typeQueryUses = [];
		let pragma = 'React';
		let fragment = 'Fragment';

		function addUse(list, identifier, node) {
			if (identifier) {
				list.push({ name: identifier.name, node: node ?? identifier });
			}
		}

		function jsxElementName(node) {
			if (node.name.namespace) {
				return null;
			}

			if (node.name.name) {
				return /^[a-z]/.test(node.name.name) ? null : node.name.name;
			}

			if (node.name.object) {
				let object = node.name.object;

				while (object.object) {
					object = object.object;
				}

				return object.name;
			}

			return null;
		}

		function visitJsxOpening(node) {
			const name = jsxElementName(node);

			if (name) {
				jsxUses.push({ name, node });
			}

			jsxUses.push({ name: pragma, node });
		}

		function visitHeritage(node) {
			addUse(typeUses, rootOfQualifiedName(node.expression), node);
		}

		return {
			Program() {
				const pragmaComment = sourceCode
					.getAllComments()
					.find((comment) => jsxAnnotationPattern.test(comment.value));

				if (pragmaComment) {
					pragma = jsxAnnotationPattern
						.exec(pragmaComment.value)[1]
						.split('.')[0];
				} else if (settings.pragma) {
					pragma = settings.pragma;
				}

				if (!identifierPattern.test(pragma)) {
					pragma = 'React';
				}

				if (settings.fragment && identifierPattern.test(settings.fragment)) {
					fragment = settings.fragment;
				}
			},
			ImportDeclaration(node) {
				for (const specifier of node.specifiers) {
					specifiers.push(specifier);
				}
			},
			JSXOpeningElement: visitJsxOpening,
			JSXOpeningFragment(node) {
				jsxUses.push({ name: pragma, node });
			},
			JSXFragment(node) {
				jsxUses.push({ name: fragment, node });
			},
			TSTypeReference(node) {
				addUse(typeUses, rootOfQualifiedName(node.typeName), node);
			},
			TSTypeQuery(node) {
				addUse(typeQueryUses, rootOfQualifiedName(node.exprName), node);
			},
			TSClassImplements: visitHeritage,
			TSInterfaceHeritage: visitHeritage,
			ExportSpecifier(node) {
				if (node.parent && !node.parent.source) {
					addUse(
						typeUses,
						node.local.type === 'Identifier' ? node.local : null,
					);
				}
			},
			'Program:exit'() {
				function resolve(list, target) {
					for (const use of list) {
						if (use.name === target.name) {
							const variable = findVariable(sourceCode, use.name, use.node);

							if (variable === target) {
								return true;
							}
						}
					}

					return false;
				}

				for (const specifier of specifiers) {
					const variable = getDeclaredVariable(sourceCode, specifier);

					if (!variable || !specifierPattern.test(specifier.type)) {
						continue;
					}

					const typeImport = isTypeImport(variable);
					const reads = readsOf(variable);
					const queriedByScope = reads.some(
						(reference) =>
							isTypeQueryReference(reference.identifier) ||
							isTypePredicateReference(reference.identifier),
					);
					const queried = queriedByScope || resolve(typeQueryUses, variable);
					const usedByScope = reads.some(
						(reference) =>
							typeImport ||
							!(
								isTypeQueryReference(reference.identifier) ||
								isTypePredicateReference(reference.identifier)
							),
					);
					const used =
						variable.eslintUsed ||
						usedByScope ||
						resolve(jsxUses, variable) ||
						resolve(typeUses, variable) ||
						(typeImport && resolve(typeQueryUses, variable));

					if (used || queried) {
						continue;
					}

					if (isUsedInJSDoc(specifier.local.name, sourceCode)) {
						continue;
					}

					const { start } = specifier.local.loc;

					context.report({
						node: specifier.local,
						loc: {
							start,
							end: {
								line: start.line,
								column: start.column + specifier.local.name.length,
							},
						},
						messageId: 'unusedVar',
						data: {
							action: 'defined',
							additional: '',
							varName: variable.name,
						},
						fix: createFix(sourceCode, specifier),
					});
				}
			},
		};
	},
};

module.exports = {
	meta: { name: 'unused-imports' },
	rules: { 'no-unused-imports': rule },
};
