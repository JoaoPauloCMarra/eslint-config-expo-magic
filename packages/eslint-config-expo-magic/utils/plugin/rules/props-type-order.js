const DEFAULT_PATTERN = /Props$/;

function getPropertyName(member) {
	const key = member.key;
	if (!key) {
		return null;
	}

	if (key.type === 'Identifier') {
		return key.name;
	}

	if (key.type === 'Literal' && typeof key.value === 'string') {
		return key.value;
	}

	return null;
}

function isFunctionType(typeNode) {
	if (!typeNode) {
		return false;
	}

	if (typeNode.type === 'TSFunctionType') {
		return true;
	}

	if (typeNode.type === 'TSUnionType') {
		return typeNode.types.some(isFunctionType);
	}

	if (typeNode.type === 'TSTypeReference') {
		const typeName = typeNode.typeName;
		const identifier =
			typeName?.type === 'Identifier'
				? typeName.name
				: typeName?.type === 'TSQualifiedName'
					? typeName.right.name
					: '';

		return identifier === 'VoidFunction' || /Handler$/.test(identifier);
	}

	return false;
}

function rankMember(member) {
	if (isFunctionType(member.typeAnnotation?.typeAnnotation)) {
		return 2;
	}

	return member.optional ? 1 : 0;
}

function getExpectedOrder(members) {
	const decorated = members.map((member, index) => ({
		index,
		member,
		name: (getPropertyName(member) ?? '').toLowerCase(),
		rank: rankMember(member),
	}));
	const sorted = [...decorated].sort((left, right) => {
		if (left.rank !== right.rank) {
			return left.rank - right.rank;
		}

		return left.name.localeCompare(right.name);
	});
	const alreadyOrdered = sorted.every((entry, index) => entry.index === index);

	return alreadyOrdered ? null : sorted.map((entry) => entry.member);
}

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Enforce required, optional, then function prop ordering in component prop type aliases, alphabetized within each group.',
		},
		schema: [
			{
				type: 'object',
				properties: {
					pattern: { type: 'string' },
				},
				additionalProperties: false,
			},
		],
		messages: {
			order:
				'`{{name}}` members should be ordered required, optional, then function props, alphabetized within each group. Expected: {{expected}}.',
		},
	},
	create(context) {
		const options = context.options[0] ?? {};
		const pattern = options.pattern
			? new RegExp(options.pattern)
			: DEFAULT_PATTERN;

		return {
			TSTypeAliasDeclaration(node) {
				if (!pattern.test(node.id.name)) {
					return;
				}

				const typeNode = node.typeAnnotation;
				if (!typeNode || typeNode.type !== 'TSTypeLiteral') {
					return;
				}

				const members = typeNode.members;
				if (
					members.length < 2 ||
					!members.every((member) => member.type === 'TSPropertySignature') ||
					members.some((member) => getPropertyName(member) === null)
				) {
					return;
				}

				const expectedOrder = getExpectedOrder(members);
				if (!expectedOrder) {
					return;
				}

				const expectedNames = expectedOrder
					.map((member) => getPropertyName(member))
					.join(', ');

				context.report({
					node: node.id,
					messageId: 'order',
					data: { name: node.id.name, expected: expectedNames },
				});
			},
		};
	},
};
