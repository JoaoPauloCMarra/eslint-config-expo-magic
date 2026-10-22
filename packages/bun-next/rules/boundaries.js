/*
 * Dependency-free port of the `boundaries/dependencies` rule of eslint-plugin-boundaries 7.2.0
 * (with the matching parts of @boundaries/elements 3.1.1). It covers the settings and
 * rule options that this package generates (feature-boundaries and mobile-app presets).
 * Source: https://github.com/javierbrea/eslint-plugin-boundaries
 *
 * The MIT License (MIT)
 * Copyright (c) 2020 Javier Brea
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
 */
'use strict';

const fs = require('node:fs');
const nodeModule = require('node:module');
const path = require('node:path');

const hasOwn = (value, key) =>
	value !== null &&
	value !== undefined &&
	Object.prototype.hasOwnProperty.call(value, key);
const isString = (value) => typeof value === 'string';
const isArray = Array.isArray;
const isBoolean = (value) => typeof value === 'boolean';
const isObject = (value) =>
	value !== null && typeof value === 'object' && !isArray(value);
const isNull = (value) => value === null;
const isUndefined = (value) => value === undefined;

function fail(message) {
	throw new Error(`boundaries/dependencies: ${message}`);
}

function checkKeys(value, allowed, where) {
	for (const key of Object.keys(value)) {
		if (!allowed.includes(key)) {
			fail(`unsupported property "${key}" in ${where}.`);
		}
	}
}

const GLOBSTAR = '((?:(?!(?:^|\\/)\\.).)*?)';
const globCache = new Map();

function escapeLiteral(text) {
	return text.replace(/[|\\{}()[\]^$+*?.\-/]/g, '\\$&');
}

function tokenizeSegment(segment, pattern) {
	const tokens = [];
	let literal = '';
	const flush = () => {
		if (literal) tokens.push({ type: 'text', value: literal });
		literal = '';
	};
	let index = 0;
	while (index < segment.length) {
		const char = segment[index];
		if (char === '*') {
			let end = index;
			while (segment[end] === '*') end += 1;
			if (end - index > 1) {
				fail(
					`unsupported glob "${pattern}": "**" must be a whole path segment.`,
				);
			}
			flush();
			tokens.push({ type: 'star' });
			index = end;
		} else if (char === '?') {
			if (tokens.length === 0 && !literal) {
				fail(`unsupported glob "${pattern}": "?" at the start of a segment.`);
			}
			flush();
			tokens.push({ type: 'qmark' });
			index += 1;
		} else if (char === '{') {
			const close = segment.indexOf('}', index);
			const body = close < 0 ? '' : segment.slice(index + 1, close);
			const alternatives = body.split(',');
			if (close < 0 || alternatives.length < 2 || /[{*?]/.test(body)) {
				fail(
					`unsupported glob "${pattern}": only simple {a,b} braces are supported.`,
				);
			}
			flush();
			tokens.push({ type: 'brace', alternatives });
			index = close + 1;
		} else if (char === '}') {
			fail(`unsupported glob "${pattern}": unbalanced "}".`);
		} else {
			literal += char;
			index += 1;
		}
	}
	flush();
	return tokens;
}

function emitSegment(tokens) {
	let out = '';
	tokens.forEach((token, index) => {
		if (token.type === 'text') out += escapeLiteral(token.value);
		else if (token.type === 'star') {
			out += `${index === 0 ? '(?!\\.)(?=.)' : ''}([^/]*?)`;
		} else if (token.type === 'qmark') out += '[^/]';
		else out += `(${token.alternatives.map(escapeLiteral).join('|')})`;
	});
	return out;
}

function compileGlob(pattern) {
	const cached = globCache.get(pattern);
	if (cached) return cached;
	if (!isString(pattern) || pattern === '') {
		fail('glob patterns must be non-empty strings.');
	}
	if (/^[!/]|^\.\//.test(pattern)) {
		fail(
			`unsupported glob "${pattern}": negation, absolute and "./" patterns.`,
		);
	}
	if (/[[\]()\\]/.test(pattern)) {
		fail(`unsupported glob "${pattern}": brackets, parentheses and escapes.`);
	}
	const rawSegments = pattern.split('/');
	if (rawSegments.some((segment) => segment === '')) {
		fail(`unsupported glob "${pattern}": empty path segments.`);
	}
	const segments = rawSegments.filter(
		(segment, index) => !(segment === '**' && rawSegments[index - 1] === '**'),
	);
	const total = segments.length;
	let out = '';
	let skipSeparator = false;
	segments.forEach((segment, index) => {
		if (segment === '**') {
			if (total === 1) out += `(?!\\.)${GLOBSTAR}`;
			else if (index === 0) {
				out += `(?:^|\\/|${GLOBSTAR}\\/)`;
				skipSeparator = true;
			} else if (index === total - 1) {
				const afterStar = segments[index - 1].endsWith('*');
				out += afterStar
					? `\\/(?!\\.)${GLOBSTAR}`
					: `(?:\\/(?!\\.)${GLOBSTAR}|$)`;
			} else {
				out += `(?:\\/(?!\\.)${GLOBSTAR}\\/|\\/|$)`;
				skipSeparator = true;
			}
			if (index === total - 1) skipSeparator = false;
			return;
		}
		if (index > 0 && !skipSeparator && segments[index - 1] !== '**') {
			out += '\\/';
		}
		skipSeparator = false;
		out += emitSegment(tokenizeSegment(segment, pattern));
	});
	const compiled = { regex: new RegExp(`^(?:${out})$`), pattern };
	globCache.set(pattern, compiled);
	return compiled;
}

function globTest(value, pattern) {
	if (value === '') return false;
	if (value === pattern) return true;
	return compileGlob(pattern).regex.test(value);
}

function globMatch(value, patterns) {
	if (isArray(patterns))
		return patterns.some((pattern) => globTest(value, pattern));
	return globTest(value, patterns);
}

function globCapture(pattern, value) {
	const match = compileGlob(pattern).regex.exec(value);
	if (!match) return null;
	return match.slice(1).map((entry) => (entry === undefined ? '' : entry));
}

const LEGACY_TEMPLATE = /\$\{([^}]+)\}/g;
const HANDLEBARS_DETECT = /{{\s*[^{}\s][^{}]*}}/;
const PATH_EXPRESSION = /^[A-Za-z_$][\w$-]*(?:\.[\w$-]+)*$/;
const HTML_ESCAPES = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'`': '&#x60;',
	'=': '&#x3D;',
};

function lookupPath(data, expression) {
	let current = data;
	for (const segment of expression.split('.')) {
		if (current === null || current === undefined) return undefined;
		if (!Object.prototype.hasOwnProperty.call(Object(current), segment)) {
			return undefined;
		}
		current = current[segment];
	}
	return current;
}

function compileHandlebars(template, data, escape) {
	if (template.includes('{{{')) {
		fail(`unsupported template "${template}": triple-stash expressions.`);
	}
	return template.replace(/{{([^{}]*)}}/g, (_match, raw) => {
		const expression = raw.trim();
		if (!PATH_EXPRESSION.test(expression)) {
			fail(
				`unsupported template expression "{{${raw}}}": only simple property paths are supported.`,
			);
		}
		const value = lookupPath(data, expression);
		if (value === null || value === undefined) return '';
		const text = String(value);
		return escape
			? text.replace(/[&<>"'`=]/g, (char) => HTML_ESCAPES[char])
			: text;
	});
}

function renderTemplate(template, data, legacy) {
	if (!template) return template;
	const source = legacy
		? template.replaceAll(LEGACY_TEMPLATE, '{{ $1 }}')
		: template;
	if (!HANDLEBARS_DETECT.test(source)) return template;
	return compileHandlebars(source, data, true);
}

const UNKNOWN_ELEMENT = {
	path: null,
	fileInternalPath: null,
	filePath: null,
	parents: [],
	types: null,
	category: null,
	captured: null,
	isIgnored: false,
	isUnknown: true,
};
const UNKNOWN_FILE = {
	path: null,
	categories: null,
	isIgnored: false,
	isUnknown: true,
	captured: null,
};
const SCOPED_PACKAGE = /^@[^/]*\/?[^/]+/;
const EXTERNAL_SOURCE = /^\w/;

function capturedValues(captured, names) {
	if (!names) return null;
	return captured.reduce((values, value, index) => {
		if (names[index]) values[names[index]] = value;
		return values;
	}, {});
}

function createDescriber(settings) {
	const root = settings.rootPath;
	const rootWithSlash = root
		? `${root.replaceAll('\\', '/').replace(/\/?$/, '/')}`
		: undefined;
	const caches = {
		element: new Map(),
		folder: new Map(),
		file: new Map(),
		module: new Map(),
		entity: new Map(),
		dependency: new Map(),
	};

	const isOutsideRoot = (file) => !file.startsWith(rootWithSlash);
	const toRelative = (file) =>
		isOutsideRoot(file) ? file : file.replace(rootWithSlash, '');
	const normalize = (file) => (file ? file.replaceAll('\\', '/') : file);
	const relativeOf = (file) => (file ? toRelative(normalize(file)) : file);

	function pathIsIncluded(relative) {
		const included = settings.includePaths
			? globMatch(relative, settings.includePaths)
			: true;
		const ignored = settings.ignorePaths
			? globMatch(relative, settings.ignorePaths)
			: false;
		return included && !ignored;
	}

	function folderElementPath(pattern, relative) {
		const { regex } = compileGlob(pattern);
		const segments = relative.split('/');
		const accumulated = [];
		for (const segment of segments) {
			accumulated.push(segment);
			if (regex.test(accumulated.join('/'))) return accumulated.join('/');
		}
		return relative;
	}

	function matchElementDescriptors(relative) {
		let main = null;
		for (const descriptor of settings.elementDescriptors) {
			const patterns = isArray(descriptor.pattern)
				? descriptor.pattern
				: [descriptor.pattern];
			for (const pattern of patterns) {
				const capture = globCapture(`${pattern}/**/*`, relative);
				if (!capture) continue;
				const values = capturedValues(capture, descriptor.capture);
				if (!main) {
					const elementPath = folderElementPath(pattern, relative);
					main = {
						filePath: relative,
						path: elementPath,
						fileInternalPath: relative.replace(`${elementPath}/`, ''),
						types: [descriptor.type],
						category: null,
						captured: values,
						isIgnored: false,
						isUnknown: false,
						parents: [],
					};
				} else {
					main.types = [...main.types, descriptor.type];
					if (isObject(values)) main.captured = { ...main.captured, ...values };
				}
				break;
			}
			if (main && settings.elementsSingleMatch) break;
		}
		return main ?? { ...UNKNOWN_ELEMENT, path: null };
	}

	function describeElementUncached(relative) {
		if (!relative) return { ...UNKNOWN_ELEMENT };
		if (!pathIsIncluded(relative)) {
			return {
				...UNKNOWN_ELEMENT,
				filePath: relative,
				path: relative,
				isIgnored: true,
			};
		}
		return matchElementDescriptors(relative);
	}

	function describeElementByFolder(relative) {
		if (!pathIsIncluded(relative)) {
			return {
				...UNKNOWN_ELEMENT,
				filePath: relative,
				path: relative,
				isIgnored: true,
			};
		}
		const slash = relative.lastIndexOf('/');
		const folder = slash === -1 ? '' : relative.slice(0, slash);
		let base = caches.folder.get(folder);
		if (base === undefined) {
			base = describeElementUncached(relative);
			caches.folder.set(folder, base);
		}
		if (base.isUnknown) return base;
		return {
			...base,
			filePath: relative,
			fileInternalPath: relative.replace(`${base.path}/`, ''),
		};
	}

	function describeElement(file) {
		const relative = relativeOf(file);
		const key = `${relative}`;
		if (caches.element.has(key)) return caches.element.get(key);
		const result =
			settings.cache && relative
				? describeElementByFolder(relative)
				: describeElementUncached(relative);
		caches.element.set(key, result);
		return result;
	}

	function describeFile(file) {
		const relative = relativeOf(file);
		const key = `${relative}`;
		if (caches.file.has(key)) return caches.file.get(key);
		let result;
		if (!relative) result = UNKNOWN_FILE;
		else if (!pathIsIncluded(relative)) {
			result = {
				...UNKNOWN_FILE,
				path: relative,
				categories: null,
				isIgnored: true,
			};
		} else {
			const found = { ...UNKNOWN_FILE, path: relative, isIgnored: false };
			for (const descriptor of settings.fileDescriptors) {
				const patterns = isArray(descriptor.pattern)
					? descriptor.pattern
					: [descriptor.pattern];
				let matched = false;
				for (const pattern of patterns) {
					const capture = globCapture(pattern, relative);
					if (!capture) continue;
					const values = capturedValues(capture, descriptor.capture);
					found.categories = isArray(found.categories)
						? [...found.categories, descriptor.category]
						: [descriptor.category];
					if (isObject(values))
						found.captured = { ...found.captured, ...values };
					found.isUnknown = false;
					matched = true;
					break;
				}
				if (matched && settings.filesSingleMatch) break;
			}
			result = found.isUnknown
				? { ...found, categories: null, captured: null }
				: found;
		}
		caches.file.set(key, result);
		return result;
	}

	const flag = settings.flagAsExternal;

	function isExternal(relative, outside, source) {
		if (flag.outsideRootPath && outside) return true;
		if (flag.inNodeModules && relative?.includes('node_modules')) return true;
		if (
			flag.unresolvableAlias &&
			!relative &&
			source &&
			(EXTERNAL_SOURCE.test(source) || SCOPED_PACKAGE.test(source))
		) {
			return true;
		}
		return Boolean(
			source &&
			flag.customSourcePatterns.length > 0 &&
			globMatch(source, flag.customSourcePatterns),
		);
	}

	function describeModule(file, source) {
		const key = `${file}::${source}`;
		if (caches.module.has(key)) return caches.module.get(key);
		const normalized = normalize(file);
		const outside = normalized ? isOutsideRoot(normalized) : true;
		const relative = normalized ? toRelative(normalized) : normalized;
		let result;
		if (source) {
			const [scope, packageName] = source.split('/');
			const base = SCOPED_PACKAGE.test(source)
				? `${scope}/${packageName}`
				: scope;
			const internalPath = source.startsWith(`${base}/`)
				? source.slice(base.length + 1)
				: null;
			const bare = base.startsWith('node:') ? base.slice(5) : base;
			if (nodeModule.builtinModules.includes(bare)) {
				result = { origin: 'core', source: base, internalPath };
			} else if (isExternal(relative || null, outside, source)) {
				result = { origin: 'external', source: base, internalPath };
			} else result = { origin: 'local', source: null, internalPath: null };
		} else if (isExternal(relative || null, outside)) {
			result = { origin: 'external', source: null, internalPath: null };
		} else result = { origin: 'local', source: null, internalPath: null };
		caches.module.set(key, result);
		return result;
	}

	function describeEntity(file, source) {
		const key = `${file}::${source}`;
		if (caches.entity.has(key)) return caches.entity.get(key);
		const result = {
			element: describeElement(file),
			file: describeFile(file),
			module: describeModule(file, source),
		};
		caches.entity.set(key, result);
		return result;
	}

	function relationship(from, to) {
		if (!to) return { from: null, to: null };
		const known = (element) => !element.isIgnored && !element.isUnknown;
		const internal =
			known(to.element) &&
			known(from.element) &&
			to.element.path === from.element.path;
		return internal
			? { from: 'internal', to: 'internal' }
			: { from: null, to: null };
	}

	function describeDependency({
		from,
		to,
		source,
		kind,
		nodeKind,
		specifiers,
	}) {
		const fromEntity = describeEntity(from);
		const toEntity = describeEntity(to, source);
		return {
			from: fromEntity,
			to: toEntity,
			dependency: {
				source,
				kind,
				nodeKind: nodeKind || null,
				relationship: relationship(fromEntity, toEntity),
				specifiers: specifiers || null,
			},
		};
	}

	return { describeEntity, describeDependency };
}

const ARRAY_QUERY_KEYS = [
	'anyOf',
	'allOf',
	'noneOf',
	'equalsTo',
	'atIndex',
	'hasLength',
];
const ELEMENT_KEYS = [
	'type',
	'types',
	'category',
	'path',
	'filePath',
	'fileInternalPath',
	'captured',
	'isIgnored',
	'isUnknown',
];
const FILE_KEYS = ['categories', 'path', 'captured', 'isIgnored', 'isUnknown'];
const MODULE_KEYS = ['origin', 'source', 'internalPath'];
const INFO_KEYS = ['kind', 'nodeKind', 'source', 'specifiers'];

const toArray = (value) => (isArray(value) ? value : [value]);

function checkPatternValue(value, where, allowNull = true) {
	const entries = isArray(value) ? value : [value];
	if (
		!entries.every((entry) => isString(entry) || (allowNull && isNull(entry)))
	) {
		fail(`${where} must be a string or an array of strings.`);
	}
}

function checkArrayQuery(value, where) {
	checkKeys(value, ARRAY_QUERY_KEYS, where);
	for (const key of ['anyOf', 'allOf', 'noneOf', 'equalsTo']) {
		if (hasOwn(value, key) && !isArray(value[key])) {
			fail(`${where}.${key} must be an array.`);
		}
	}
}

function checkCaptured(value, where) {
	for (const entry of toArray(value)) {
		if (!isObject(entry))
			fail(`${where} must be an object or an array of objects.`);
		for (const pattern of Object.values(entry))
			checkPatternValue(pattern, where, false);
	}
}

function checkBooleanKeys(selector, where) {
	for (const key of ['isIgnored', 'isUnknown']) {
		if (
			hasOwn(selector, key) &&
			!isUndefined(selector[key]) &&
			!isBoolean(selector[key])
		) {
			fail(`${where}.${key} must be a boolean.`);
		}
	}
}

function normalizeElementSelectors(value) {
	const selectors = toArray(value);
	if (selectors.length === 0) fail('element selectors cannot be empty.');
	return selectors.map((selector) => {
		if (!isObject(selector)) {
			fail(
				'legacy string element selectors are not supported; use object selectors.',
			);
		}
		if (hasOwn(selector, 'parent') || hasOwn(selector, 'parents')) {
			fail('element selectors with "parent" or "parents" are not supported.');
		}
		checkKeys(selector, ELEMENT_KEYS, 'an element selector');
		if (Object.keys(selector).length === 0)
			fail('element selectors cannot be empty.');
		for (const key of [
			'type',
			'category',
			'path',
			'filePath',
			'fileInternalPath',
		]) {
			if (hasOwn(selector, key) && !isUndefined(selector[key])) {
				checkPatternValue(selector[key], `element selector "${key}"`);
			}
		}
		if (hasOwn(selector, 'types') && !isUndefined(selector.types)) {
			if (
				isObject(selector.types) &&
				ARRAY_QUERY_KEYS.some((key) => key in selector.types)
			) {
				checkArrayQuery(selector.types, 'element selector "types"');
			} else checkPatternValue(selector.types, 'element selector "types"');
		}
		if (hasOwn(selector, 'captured'))
			checkCaptured(selector.captured, 'element selector "captured"');
		checkBooleanKeys(selector, 'element selector');
		return selector;
	});
}

function normalizeFileSelectors(value) {
	return toArray(value).map((selector) => {
		if (!isObject(selector)) fail('file selectors must be objects.');
		checkKeys(selector, FILE_KEYS, 'a file selector');
		if (Object.keys(selector).length === 0)
			fail('file selectors cannot be empty.');
		for (const key of ['path']) {
			if (hasOwn(selector, key) && !isUndefined(selector[key])) {
				checkPatternValue(selector[key], `file selector "${key}"`);
			}
		}
		if (hasOwn(selector, 'categories') && !isUndefined(selector.categories)) {
			const { categories } = selector;
			if (
				isObject(categories) &&
				ARRAY_QUERY_KEYS.some((key) => key in categories)
			) {
				checkArrayQuery(categories, 'file selector "categories"');
			} else checkPatternValue(categories, 'file selector "categories"');
		}
		if (hasOwn(selector, 'captured'))
			checkCaptured(selector.captured, 'file selector "captured"');
		checkBooleanKeys(selector, 'file selector');
		return selector;
	});
}

function normalizeModuleSelectors(value) {
	return toArray(value).map((selector) => {
		if (!isObject(selector)) fail('module selectors must be objects.');
		checkKeys(selector, MODULE_KEYS, 'a module selector');
		if (Object.keys(selector).length === 0)
			fail('module selectors cannot be empty.');
		for (const key of MODULE_KEYS) {
			if (hasOwn(selector, key) && !isUndefined(selector[key])) {
				checkPatternValue(selector[key], `module selector "${key}"`);
			}
		}
		return selector;
	});
}

function normalizeEntitySelectors(value) {
	const selectors = toArray(value);
	if (selectors.length === 0) fail('entity selectors cannot be empty.');
	return selectors.map((selector) => {
		if (!isObject(selector)) {
			fail(
				'legacy string or array entity selectors are not supported; use object selectors.',
			);
		}
		const isEntity = ['element', 'file', 'module'].some((key) =>
			hasOwn(selector, key),
		);
		if (!isEntity) return { element: normalizeElementSelectors(selector) };
		checkKeys(selector, ['element', 'file', 'module'], 'an entity selector');
		const normalized = {};
		if (!isUndefined(selector.element))
			normalized.element = normalizeElementSelectors(selector.element);
		if (!isUndefined(selector.file))
			normalized.file = normalizeFileSelectors(selector.file);
		if (!isUndefined(selector.module))
			normalized.module = normalizeModuleSelectors(selector.module);
		return normalized;
	});
}

function normalizeInfoSelectors(value) {
	return toArray(value).map((selector) => {
		if (!isObject(selector)) fail('dependency selectors must be objects.');
		if (hasOwn(selector, 'relationship')) {
			fail('dependency selectors with "relationship" are not supported.');
		}
		checkKeys(selector, INFO_KEYS, 'a dependency selector');
		if (Object.keys(selector).length === 0)
			fail('dependency selectors cannot be empty.');
		for (const key of INFO_KEYS) {
			if (hasOwn(selector, key) && !isUndefined(selector[key])) {
				checkPatternValue(selector[key], `dependency selector "${key}"`, false);
			}
		}
		return selector;
	});
}

function mergeSingle(outer, entry) {
	const merged = { ...outer, ...entry };
	if (isObject(outer.captured) && isObject(entry.captured)) {
		merged.captured = { ...outer.captured, ...entry.captured };
	}
	return merged;
}

function mergeList(outer, entry) {
	if (!entry) return outer;
	if (!outer) return entry;
	return outer.flatMap((outerSelector) =>
		entry.map((entrySelector) => mergeSingle(outerSelector, entrySelector)),
	);
}

function mergeEntities(outer, entry) {
	if (!entry) return outer;
	if (!outer) return entry;
	return outer.flatMap((outerSelector) =>
		entry.map((entrySelector) => {
			const merged = {};
			for (const key of ['element', 'file', 'module']) {
				const value = mergeList(outerSelector[key], entrySelector[key]);
				if (value) merged[key] = value;
			}
			return merged;
		}),
	);
}

function mergeInfo(outer, entry) {
	if (!entry) return outer;
	if (!outer) return entry;
	return outer.flatMap((outerSelector) =>
		entry.map((entrySelector) => ({ ...outerSelector, ...entrySelector })),
	);
}

function normalizeEffect(effect, where) {
	const entries = toArray(effect);
	return entries.flatMap((entry) => {
		if (!isObject(entry)) {
			fail(
				`${where} entries must be dependency selector objects; legacy string selectors are not supported.`,
			);
		}
		checkKeys(entry, ['from', 'to', 'dependency'], `a ${where} entry`);
		if (!['from', 'to', 'dependency'].some((key) => hasOwn(entry, key))) {
			fail(`${where} entries need "from", "to" or "dependency".`);
		}
		const from = isUndefined(entry.from)
			? undefined
			: normalizeEntitySelectors(entry.from);
		const to = isUndefined(entry.to)
			? undefined
			: normalizeEntitySelectors(entry.to);
		const items = isArray(entry.dependency)
			? entry.dependency
			: [entry.dependency];
		return items.map((item) => {
			const selector = {};
			if (from) selector.from = from;
			if (to) selector.to = to;
			if (!isUndefined(item))
				selector.dependency = normalizeInfoSelectors(item);
			return selector;
		});
	});
}

function buildEntrySelector(outer, entry) {
	const selector = {};
	const from = mergeEntities(outer.from, entry.from);
	const to = mergeEntities(outer.to, entry.to);
	const dependency = mergeInfo(outer.dependency, entry.dependency);
	if (from) selector.from = from;
	if (to) selector.to = to;
	if (dependency) selector.dependency = dependency;
	return selector;
}

const POLICY_KEYS = [
	'from',
	'to',
	'dependency',
	'allow',
	'disallow',
	'message',
];
const OPTION_KEYS = [
	'default',
	'message',
	'policies',
	'rules',
	'checkAllOrigins',
	'checkUnknownLocals',
	'checkInternals',
];

function checkMessage(message, where) {
	if (isUndefined(message)) return;
	if (!isString(message)) fail(`${where} must be a string.`);
	if (/parent/i.test(message)) {
		fail(
			`${where} cannot reference parent elements; parents are not supported.`,
		);
	}
}

const normalizedOptionsCache = new WeakMap();

function normalizeOptions(options) {
	if (normalizedOptionsCache.has(options))
		return normalizedOptionsCache.get(options);
	if (!isObject(options)) fail('rule options must be an object.');
	checkKeys(options, OPTION_KEYS, 'the rule options');
	if (
		!isUndefined(options.default) &&
		!['allow', 'disallow'].includes(options.default)
	) {
		fail('option "default" must be "allow" or "disallow".');
	}
	for (const key of [
		'checkAllOrigins',
		'checkUnknownLocals',
		'checkInternals',
	]) {
		if (!isUndefined(options[key]) && !isBoolean(options[key])) {
			fail(`option "${key}" must be a boolean.`);
		}
	}
	checkMessage(options.message, 'option "message"');
	const policies = options.policies ?? options.rules ?? [];
	if (!isArray(policies)) fail('option "policies" must be an array.');
	const normalized = policies.map((policy, index) => {
		if (!isObject(policy)) fail(`policy ${index} must be an object.`);
		checkKeys(policy, POLICY_KEYS, `policy ${index}`);
		checkMessage(policy.message, `policy ${index} "message"`);
		const outer = {};
		if (!isUndefined(policy.from))
			outer.from = normalizeEntitySelectors(policy.from);
		if (!isUndefined(policy.to)) outer.to = normalizeEntitySelectors(policy.to);
		if (!isUndefined(policy.dependency))
			outer.dependency = normalizeInfoSelectors(policy.dependency);
		const build = (effect, where) =>
			isUndefined(effect)
				? undefined
				: normalizeEffect(effect, where).map((entry) =>
						buildEntrySelector(outer, entry),
					);
		return {
			hasFrom: Boolean(policy.from),
			message: policy.message,
			allow: build(policy.allow, `policy ${index} "allow"`),
			disallow: build(policy.disallow, `policy ${index} "disallow"`),
		};
	});
	const result = {
		default: options.default,
		message: options.message,
		checkAllOrigins: options.checkAllOrigins ?? false,
		checkUnknownLocals: options.checkUnknownLocals ?? false,
		checkInternals: options.checkInternals ?? false,
		policies: normalized,
	};
	normalizedOptionsCache.set(options, result);
	return result;
}

function createMatcher(settings) {
	const legacy = settings.legacyTemplates;

	const render = (pattern, data) =>
		isArray(pattern)
			? pattern.map((entry) => renderTemplate(entry, data, legacy))
			: renderTemplate(pattern, data, legacy);

	function microMatch(value, pattern) {
		if (isNull(pattern)) return isNull(value);
		if (isNull(value)) return isArray(pattern) && pattern.some(isNull);
		const patterns = isArray(pattern) ? pattern.filter(Boolean) : pattern;
		if (!patterns?.length) return false;
		return globMatch(
			!value || !isString(value) ? String(value) : value,
			patterns,
		);
	}

	function templateMatch(pattern, data, value) {
		if (isUndefined(value)) return false;
		const rendered = render(pattern, data);
		if (!isNull(rendered) && !rendered) return false;
		if (isArray(value))
			return value.some((entry) => microMatch(entry, rendered));
		return microMatch(value, rendered);
	}

	function booleanMatch(object, selector, key) {
		if (!(key in selector) || isUndefined(selector[key])) return true;
		if (!(key in object)) return false;
		if (!isBoolean(selector[key]) || !isBoolean(object[key])) return false;
		return selector[key] === object[key];
	}

	function keyMatch(object, selector, key, data) {
		if (!(key in selector) || isUndefined(selector[key])) return true;
		if (!hasOwn(object, key)) return false;
		return templateMatch(selector[key], data, object[key]);
	}

	function expandItems(items, data) {
		return items.flatMap((item) => {
			if (isObject(item) && isString(item.expand)) {
				const single = /^\s*\{\{([^{}]+)\}\}\s*$/.exec(item.expand);
				if (!single) return [];
				const value = lookupPath(data, single[1].trim());
				if (isArray(value)) {
					return value
						.filter(
							(entry) =>
								entry !== null && entry !== undefined && !isObject(entry),
						)
						.map(String);
				}
				if (isString(value) || typeof value === 'number' || isBoolean(value))
					return [String(value)];
				return [];
			}
			return [item];
		});
	}

	function arrayQueryMatch(array, query, data) {
		if (isNull(array)) return false;
		const expanded = { ...query };
		for (const key of ['anyOf', 'allOf', 'noneOf', 'equalsTo']) {
			if (query[key]) expanded[key] = expandItems(query[key], data);
		}
		const matches = (element, pattern) => templateMatch(pattern, data, element);
		if (!isUndefined(expanded.hasLength) && array.length !== expanded.hasLength)
			return false;
		if (!isUndefined(expanded.equalsTo)) {
			if (array.length !== expanded.equalsTo.length) return false;
			if (
				!expanded.equalsTo.every((pattern, index) =>
					matches(array[index], pattern),
				)
			)
				return false;
		}
		if (!isUndefined(expanded.atIndex)) {
			const { index, matches: atMatches } = expanded.atIndex;
			const resolved = index < 0 ? array.length + index : index;
			if (resolved < 0 || resolved >= array.length) return false;
			if (
				!toArray(atMatches).some((pattern) => matches(array[resolved], pattern))
			)
				return false;
		}
		if (
			!isUndefined(expanded.anyOf) &&
			!array.some((element) =>
				expanded.anyOf.some((pattern) => matches(element, pattern)),
			)
		)
			return false;
		if (
			!isUndefined(expanded.allOf) &&
			!expanded.allOf.every((pattern) =>
				array.some((element) => matches(element, pattern)),
			)
		)
			return false;
		if (
			!isUndefined(expanded.noneOf) &&
			expanded.noneOf.some((pattern) =>
				array.some((element) => matches(element, pattern)),
			)
		)
			return false;
		return true;
	}

	const isQuery = (value) =>
		isObject(value) && ARRAY_QUERY_KEYS.some((key) => key in value);

	function capturedMatch(captured, selector, data) {
		if (!selector.captured) return true;
		const selectors = isArray(selector.captured)
			? selector.captured
			: [selector.captured];
		if (
			!isArray(selector.captured) &&
			Object.keys(selector.captured).length === 0
		)
			return true;
		if (selectors.length === 0) return false;
		return selectors.some((entry) => {
			if (!captured) return false;
			for (const [key, pattern] of Object.entries(entry)) {
				const value = captured[key];
				if (!value) return false;
				const rendered = render(pattern, data);
				const filtered = isArray(rendered)
					? rendered.filter(Boolean)
					: rendered;
				if (!filtered) return false;
				if (isArray(filtered) && filtered.length === 0) return false;
				if (!globMatch(value, filtered)) return false;
			}
			return true;
		});
	}

	function matchElement(element, selectors, data) {
		for (const selector of selectors) {
			const typeOk =
				isUndefined(selector.type) ||
				templateMatch(selector.type, data, element.types?.[0] ?? null);
			if (!typeOk) continue;
			if (!isUndefined(selector.types)) {
				const ok = isQuery(selector.types)
					? arrayQueryMatch(element.types, selector.types, data)
					: keyMatch(element, selector, 'types', data);
				if (!ok) continue;
			}
			if (
				!keyMatch(element, selector, 'category', data) ||
				!booleanMatch(element, selector, 'isIgnored') ||
				!booleanMatch(element, selector, 'isUnknown') ||
				!keyMatch(element, selector, 'path', data) ||
				!keyMatch(element, selector, 'filePath', data) ||
				!keyMatch(element, selector, 'fileInternalPath', data) ||
				!capturedMatch(element.captured, selector, data)
			) {
				continue;
			}
			return selector;
		}
		return null;
	}

	function matchFile(file, selectors, data) {
		for (const selector of selectors) {
			if (
				!booleanMatch(file, selector, 'isIgnored') ||
				!booleanMatch(file, selector, 'isUnknown') ||
				!keyMatch(file, selector, 'path', data)
			) {
				continue;
			}
			if (!isUndefined(selector.categories) && !isNull(selector.categories)) {
				const ok = isQuery(selector.categories)
					? arrayQueryMatch(file.categories, selector.categories, data)
					: templateMatch(selector.categories, data, file.categories);
				if (!ok) continue;
			}
			if (!capturedMatch(file.captured, selector, data)) continue;
			return selector;
		}
		return null;
	}

	function matchModule(module, selectors, extra) {
		const data = { origin: module, ...extra };
		for (const selector of selectors) {
			if (
				keyMatch(module, selector, 'origin', data) &&
				keyMatch(module, selector, 'source', data) &&
				keyMatch(module, selector, 'internalPath', data)
			) {
				return selector;
			}
		}
		return null;
	}

	function matchEntity(entity, selectors, extra) {
		const data = {
			...extra,
			element: { ...entity.element, ...(extra.element || {}) },
			file: { ...entity.file, ...(extra.file || {}) },
			module: { ...entity.module, ...(extra.module || {}) },
		};
		for (const selector of selectors) {
			const element = selector.element
				? matchElement(entity.element, selector.element, data)
				: undefined;
			const file = selector.file
				? matchFile(entity.file, selector.file, data)
				: undefined;
			const module = selector.module
				? matchModule(entity.module, selector.module, data)
				: undefined;
			const matched =
				(selector.element ? element : true) &&
				(selector.file ? file : true) &&
				(selector.module ? module : true);
			if (matched) {
				const result = {};
				if (element) result.element = element;
				if (file) result.file = file;
				if (module) result.module = module;
				return result;
			}
		}
		return null;
	}

	function matchInfo(dependency, selectors, data) {
		const info = dependency.dependency;
		for (const selector of selectors) {
			const ok =
				(!selector.kind || templateMatch(selector.kind, data, info.kind)) &&
				(!selector.nodeKind ||
					templateMatch(selector.nodeKind, data, info.nodeKind)) &&
				(!selector.source ||
					templateMatch(selector.source, data, info.source)) &&
				(!selector.specifiers ||
					templateMatch(selector.specifiers, data, info.specifiers));
			if (ok) return selector;
		}
		return null;
	}

	function legacyElement(element, module) {
		return {
			...element,
			type: element.types?.[0] ?? null,
			elementPath: element.path,
			internalPath: module?.internalPath || element.fileInternalPath,
			parents: element.parents,
			...(isUndefined(module?.origin) ? {} : { origin: module.origin }),
		};
	}

	function dependencyTemplateData(dependency, pluginData) {
		const pluginFrom = isObject(pluginData.from) ? pluginData.from : {};
		const pluginTo = isObject(pluginData.to) ? pluginData.to : {};
		const pluginDependency = isObject(pluginData.dependency)
			? pluginData.dependency
			: {};
		const fromElement = legacyElement(
			dependency.from.element,
			dependency.from.module,
		);
		const toElement = legacyElement(
			dependency.to.element,
			dependency.to.module,
		);
		const extra = {
			...pluginData,
			from: {
				...fromElement,
				...dependency.from,
				element: fromElement,
				file: dependency.from.file,
				...pluginFrom,
			},
			to: {
				...toElement,
				...dependency.to,
				element: toElement,
				file: dependency.to.file,
				...pluginTo,
			},
			dependency: {
				...dependency.dependency,
				origin: dependency.to.module.origin,
				...pluginDependency,
			},
		};
		return {
			...extra,
			from: { ...dependency.from, ...extra.from },
			to: { ...dependency.to, ...extra.to },
			dependency: dependency.dependency,
		};
	}

	function matchDependency(dependency, selector, pluginData) {
		const data = dependencyTemplateData(dependency, pluginData);
		const from = selector.from
			? matchEntity(dependency.from, selector.from, data)
			: undefined;
		const to = selector.to
			? matchEntity(dependency.to, selector.to, data)
			: undefined;
		const info = selector.dependency
			? matchInfo(dependency, selector.dependency, data)
			: undefined;
		const matched =
			(selector.from ? from : true) &&
			(selector.to ? to : true) &&
			(selector.dependency ? info : true);
		if (!matched) return null;
		const result = {};
		if (from) result.from = from;
		if (to) result.to = to;
		if (info) result.dependency = info;
		return result;
	}

	return { matchDependency };
}

function capturedTemplateData(policy, dependency, legacyTemplates) {
	if (!legacyTemplates) return {};
	const fromCaptured = dependency.from.element.captured;
	const toCaptured = dependency.to.element.captured;
	const base = policy.hasFrom ? fromCaptured : toCaptured;
	return { ...base, from: fromCaptured, to: toCaptured };
}

function evaluatePolicies(policies, dependency, matcher, settings) {
	let allowed = null;
	let ruleIndex = null;
	let matchResult = null;
	const firstMatch = (selectors, pluginData) => {
		for (const selector of selectors) {
			const result = matcher.matchDependency(dependency, selector, pluginData);
			if (result) return result;
		}
		return null;
	};
	policies.forEach((policy, index) => {
		const pluginData = capturedTemplateData(
			policy,
			dependency,
			settings.legacyTemplates,
		);
		let denied = false;
		if (policy.disallow) {
			const result = firstMatch(policy.disallow, pluginData);
			if (result) {
				allowed = false;
				ruleIndex = index;
				matchResult = result;
				denied = true;
			}
		}
		if (!denied && policy.allow) {
			const result = firstMatch(policy.allow, pluginData);
			if (result) {
				allowed = true;
				ruleIndex = index;
				matchResult = result;
			}
		}
	});
	if (allowed === true) return { allowed: true };
	return { allowed: false, ruleIndex, matchResult };
}

const NO_RULE_MESSAGE = 'There is no policy allowing dependencies';
const MESSAGE_ERROR =
	'Not able to create a message for this violation. Please report this at: https://github.com/javierbrea/eslint-plugin-boundaries/issues';

const quote = (value) => `"${String(value)}"`;
const formatValue = (value) =>
	isArray(value) ? value.map((entry) => quote(entry)).join(', ') : quote(value);
const capitalize = (text) =>
	text.length ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text;

function joinParts(parts) {
	if (parts.length === 0) return '';
	if (parts.length === 1) return parts[0];
	if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
	return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

const skipValue = (value, includeNull) =>
	isUndefined(value) || (isNull(value) && !includeNull);

function capturedFragments(value, keys, includeNull) {
	if (!isObject(value) || Object.keys(value).length === 0) {
		return includeNull ? [`captured ${quote(null)}`] : [];
	}
	const entries = [];
	for (const key of keys ?? Object.keys(value)) {
		if (isUndefined(value[key])) continue;
		entries.push(`${key}=${formatValue(value[key])}`);
	}
	return entries.length ? [`captured values: ${entries.join(', ')}`] : [];
}

function elementFragments(element, properties, { capturedKeys, includeNull }) {
	const fragments = [];
	for (const name of properties) {
		const value = name === 'type' ? element.types : element[name];
		if (name === 'captured') {
			fragments.push(...capturedFragments(value, capturedKeys, includeNull));
			continue;
		}
		if (skipValue(value, includeNull)) continue;
		if (name === 'type' || name === 'types') {
			const label = isArray(value) && value.length > 1 ? 'types' : 'type';
			fragments.push(`${label} ${formatValue(value)}`);
		} else fragments.push(`${name} ${formatValue(value)}`);
	}
	return fragments;
}

function elementMessageNoRule(element) {
	const fragments = elementFragments(
		element,
		['type', 'category', 'captured'],
		{
			includeNull: false,
		},
	);
	return fragments.length ? `elements of ${joinParts(fragments)}` : '';
}

function fileFragments(file, properties, { capturedKeys, includeNull }) {
	const fragments = [];
	for (const name of properties) {
		const value = file[name];
		if (name === 'captured') {
			fragments.push(...capturedFragments(value, capturedKeys, includeNull));
			continue;
		}
		if (skipValue(value, includeNull)) continue;
		if (name === 'categories') {
			const label =
				isArray(value) && value.length > 1 ? 'categories' : 'category';
			fragments.push(`${label} ${formatValue(value)}`);
		} else fragments.push(`${name} ${formatValue(value)}`);
	}
	return fragments;
}

function fileMessageNoRule(file) {
	const fragments = fileFragments(file, ['categories', 'captured'], {
		includeNull: false,
	});
	return fragments.length ? `file of ${joinParts(fragments)}` : '';
}

function entityMessageNoRule(entity) {
	const elementPart = elementMessageNoRule(entity.element);
	const filePart = fileMessageNoRule(entity.file);
	if (filePart && elementPart) return `${filePart} belonging to ${elementPart}`;
	return filePart || elementPart;
}

function noRuleMessage(dependency) {
	const fromDescription = entityMessageNoRule(dependency.from);
	const toEntity = entityMessageNoRule(dependency.to);
	const origin = dependency.to.module.origin;
	const source = dependency.to.module.source;
	const sourceSuffix = !skipValue(source, false)
		? ` and module source ${formatValue(source)}`
		: '';
	const moduleDescription = !skipValue(origin, false)
		? `module with origin ${formatValue(origin)}${sourceSuffix}`
		: '';
	let toDescription =
		toEntity || (moduleDescription ? `entities of ${moduleDescription}` : '');
	if (toEntity && moduleDescription && origin === 'external') {
		toDescription = `entities of ${moduleDescription} being ${toEntity}`;
	}
	const info = dependency.dependency;
	const dependencyDescription =
		!skipValue(source, false) || skipValue(info.source, false)
			? ''
			: `source ${formatValue(info.source)}`;
	if (fromDescription && toDescription)
		return `${NO_RULE_MESSAGE} from ${fromDescription} to ${toDescription}`;
	if (fromDescription && dependencyDescription)
		return `${NO_RULE_MESSAGE} from ${fromDescription} with ${dependencyDescription}`;
	if (toDescription && dependencyDescription)
		return `${NO_RULE_MESSAGE} to ${toDescription} with ${dependencyDescription}`;
	if (fromDescription) return `${NO_RULE_MESSAGE} from ${fromDescription}`;
	if (toDescription) return `${NO_RULE_MESSAGE} to ${toDescription}`;
	if (dependencyDescription)
		return `${NO_RULE_MESSAGE} with ${dependencyDescription}`;
	return MESSAGE_ERROR;
}

function selectorElementPart(element, selector) {
	if (!selector) return null;
	const properties = Object.keys(selector);
	if (!properties.length) return null;
	const capturedKeys = isObject(selector.captured)
		? Object.keys(selector.captured)
		: undefined;
	const fragments = elementFragments(element, properties, {
		capturedKeys,
		includeNull: true,
	});
	return fragments.length ? `elements of ${joinParts(fragments)}` : null;
}

function selectorFilePart(file, selector) {
	if (!selector) return null;
	const properties = Object.keys(selector);
	if (!properties.length) return null;
	const capturedKeys = isObject(selector.captured)
		? Object.keys(selector.captured)
		: undefined;
	const fragments = fileFragments(file, properties, {
		capturedKeys,
		includeNull: true,
	});
	return fragments.length ? `file of ${joinParts(fragments)}` : null;
}

function selectorModulePart(module, selector) {
	if (!selector) return null;
	const properties = Object.keys(selector);
	if (!properties.length) return null;
	const fragments = [];
	for (const name of properties) {
		const value = module[name];
		if (skipValue(value, true)) continue;
		fragments.push(`${name} ${formatValue(value)}`);
	}
	return fragments.length ? `module with ${joinParts(fragments)}` : null;
}

function selectorEntityPart(entity, selector, includeModule = true) {
	const elementPart = selectorElementPart(
		entity.element,
		selector.element ?? null,
	);
	const filePart = selectorFilePart(entity.file, selector.file);
	const modulePart = includeModule
		? selectorModulePart(entity.module, selector.module)
		: null;
	if (!elementPart && !filePart && !modulePart) return null;
	const main =
		filePart && elementPart
			? `${filePart} belonging to ${elementPart}`
			: (filePart ?? elementPart);
	if (main && modulePart) return `${main} and ${modulePart}`;
	return main ?? modulePart;
}

function selectorDependencyFragments(info, selector) {
	const fragments = [];
	for (const name of Object.keys(selector)) {
		const value = info[name];
		if (isUndefined(value)) continue;
		fragments.push(`${name} ${formatValue(value)}`);
	}
	return fragments;
}

function matchedMessage(matchResult, ruleIndex, dependency) {
	const fromPart = Object.keys(matchResult?.from ?? {}).length
		? selectorEntityPart(dependency.from, matchResult.from)
		: null;
	const toEntityPart = Object.keys(matchResult?.to ?? {}).length
		? selectorEntityPart(dependency.to, matchResult.to, false)
		: null;
	const toModulePart = !isUndefined(matchResult?.to?.module?.origin)
		? `entities of module with origin ${formatValue(dependency.to.module.origin)}`
		: null;
	const toPart = toEntityPart ?? toModulePart;
	const fragments = Object.keys(matchResult?.dependency ?? {}).length
		? selectorDependencyFragments(dependency.dependency, matchResult.dependency)
		: [];
	const toSelector = matchResult?.to?.module;
	if (toSelector) {
		const extra = [];
		if (
			!isUndefined(toSelector.source) &&
			!skipValue(dependency.to.module.source, true)
		) {
			extra.push(`module source ${formatValue(dependency.to.module.source)}`);
		}
		if (
			!isUndefined(toSelector.internalPath) &&
			!skipValue(dependency.to.module.internalPath, true)
		) {
			extra.push(
				`module internalPath ${formatValue(dependency.to.module.internalPath)}`,
			);
		}
		if (extra.length) {
			const specifiersIndex = fragments.findIndex((fragment) =>
				fragment.startsWith('specifiers '),
			);
			if (specifiersIndex === -1) fragments.push(...extra);
			else fragments.splice(specifiersIndex, 0, ...extra);
		}
	}
	const dependencyPart = joinParts(fragments);
	let message;
	if (dependencyPart && toPart && fromPart)
		message = `Dependencies with ${dependencyPart} to ${toPart} are not allowed in ${fromPart}`;
	else if (dependencyPart && toPart)
		message = `Dependencies with ${dependencyPart} to ${toPart} are not allowed`;
	else if (dependencyPart && fromPart)
		message = `Dependencies with ${dependencyPart} are not allowed in ${fromPart}`;
	else if (toPart && fromPart)
		message = `Dependencies to ${toPart} are not allowed in ${fromPart}`;
	else if (toPart) message = `Dependencies to ${toPart} are not allowed`;
	else if (fromPart) message = `Dependencies are not allowed in ${fromPart}`;
	else if (dependencyPart)
		message = `Dependencies with ${dependencyPart} are not allowed`;
	else message = MESSAGE_ERROR;
	return `${capitalize(message)}. Denied by policy at index ${ruleIndex}`;
}

function legacyMessageProperties(entity, info) {
	return {
		...entity.element.captured,
		type: entity.element.types?.[0] || '',
		internalPath: entity.element.fileInternalPath || '',
		source: info?.source || '',
		module: entity.module?.source || '',
		importKind: info?.kind || '',
	};
}

function replaceLegacyValues(template, object, namespace) {
	return Object.keys(object).reduce((result, key) => {
		const regexp = new RegExp(String.raw`\$\{${namespace}.${key}\}`, 'g');
		return result.replace(regexp, () => String(object[key]));
	}, template);
}

function customMessage(template, dependency, ruleIndex, matchResult) {
	const fromProperties = legacyMessageProperties(dependency.from);
	const toProperties = legacyMessageProperties(
		dependency.to,
		dependency.dependency,
	);
	let message = replaceLegacyValues(
		replaceLegacyValues(template, fromProperties, 'file'),
		toProperties,
		'dependency',
	);
	message = replaceLegacyValues(
		replaceLegacyValues(message, fromProperties, 'from'),
		toProperties,
		'target',
	);
	message = replaceLegacyValues(
		message,
		{
			path:
				dependency.to.module.internalPath ||
				dependency.to.element.fileInternalPath ||
				'',
			specifiers: dependency.dependency.specifiers?.join(', ') || '',
		},
		'report',
	);
	if (!HANDLEBARS_DETECT.test(message)) return message;
	const entityContext = (entity) => ({
		...entity.element,
		type: entity.element.types?.[0],
		elementPath: entity.element.path,
		internalPath: entity.element.fileInternalPath,
		parents: entity.element.parents,
		...(isUndefined(entity.module.origin)
			? {}
			: { origin: entity.module.origin }),
		...entity,
		element: { ...entity.element, type: entity.element.types?.[0] },
	});
	const policyEntity = (selector) => ({
		...selector.element,
		...(isUndefined(selector.element?.filePath)
			? {}
			: { elementPath: selector.element.filePath }),
		...(isUndefined(selector.element?.fileInternalPath)
			? {}
			: { internalPath: selector.element.fileInternalPath }),
		...selector,
	});
	const policy =
		!isNull(ruleIndex) && matchResult
			? {
					index: ruleIndex,
					selector: {
						...matchResult,
						from: matchResult.from ? policyEntity(matchResult.from) : undefined,
						to: matchResult.to ? policyEntity(matchResult.to) : undefined,
					},
				}
			: null;
	return compileHandlebars(
		message,
		{
			from: entityContext(dependency.from),
			to: entityContext(dependency.to),
			dependency: dependency.dependency,
			policy,
			rule: policy,
		},
		false,
	);
}

const SETTING_KEYS = [
	'boundaries/elements',
	'boundaries/files',
	'boundaries/ignore',
	'boundaries/include',
	'boundaries/root-path',
	'boundaries/elements-single-match',
	'boundaries/files-single-match',
	'boundaries/legacy-templates',
	'boundaries/legacy-warnings',
	'boundaries/cache',
	'boundaries/additional-dependency-nodes',
	'boundaries/dependency-nodes',
	'boundaries/flag-as-external',
	'boundaries/debug',
];
const ENV_ROOT_PATH = 'ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH';

const DEFAULT_DEPENDENCY_NODES = {
	require: [
		{
			selector: 'CallExpression[callee.name=require] > Literal',
			kind: 'value',
			name: 'require',
		},
	],
	import: [
		{
			selector: 'ImportDeclaration:not([importKind=type]) > Literal',
			kind: 'value',
			name: 'import',
		},
		{
			selector: 'ImportDeclaration[importKind=type] > Literal',
			kind: 'type',
			name: 'import',
		},
	],
	'dynamic-import': [
		{
			selector: 'ImportExpression > Literal',
			kind: 'value',
			name: 'dynamic-import',
		},
	],
	export: [
		{
			selector: 'ExportAllDeclaration:not([exportKind=type]) > Literal',
			kind: 'value',
			name: 'export',
		},
		{
			selector: 'ExportAllDeclaration[exportKind=type] > Literal',
			kind: 'type',
			name: 'export',
		},
		{
			selector: 'ExportNamedDeclaration:not([exportKind=type]) > Literal',
			kind: 'value',
			name: 'export',
		},
		{
			selector: 'ExportNamedDeclaration[exportKind=type] > Literal',
			kind: 'type',
			name: 'export',
		},
	],
};

function booleanSetting(settings, key, fallback) {
	const value = settings[key];
	if (isUndefined(value)) return fallback;
	if (!isBoolean(value)) fail(`setting "${key}" must be a boolean.`);
	return value;
}

function pathListSetting(settings, key) {
	const value = settings[key];
	if (!value) return undefined;
	if (isString(value)) return [value];
	if (isArray(value) && value.every(isString)) return value;
	fail(`setting "${key}" must be a string or an array of strings.`);
	return undefined;
}

function descriptorPatterns(descriptor, where) {
	const { pattern } = descriptor;
	if (
		isString(pattern) ||
		(isArray(pattern) && pattern.length > 0 && pattern.every(isString))
	) {
		for (const entry of toArray(pattern)) compileGlob(entry);
		return;
	}
	fail(`${where} needs a string or non-empty string array "pattern".`);
}

function checkCaptureNames(descriptor, where) {
	if (isUndefined(descriptor.capture)) return;
	if (!isArray(descriptor.capture) || !descriptor.capture.every(isString)) {
		fail(`${where} "capture" must be an array of strings.`);
	}
}

function normalizeElementDescriptors(value) {
	if (isUndefined(value)) return [];
	if (!isArray(value)) fail('setting "boundaries/elements" must be an array.');
	return value.map((descriptor, index) => {
		const where = `boundaries/elements[${index}]`;
		if (!isObject(descriptor)) {
			fail(
				`${where} must be an object; legacy string element types are not supported.`,
			);
		}
		checkKeys(
			descriptor,
			['type', 'pattern', 'partialMatch', 'capture'],
			where,
		);
		if (!isString(descriptor.type) || !descriptor.type)
			fail(`${where} needs a "type" string.`);
		if (descriptor.partialMatch !== false) {
			fail(
				`${where} must set "partialMatch: false"; partial folder matching is not supported.`,
			);
		}
		descriptorPatterns(descriptor, where);
		checkCaptureNames(descriptor, where);
		return descriptor;
	});
}

function normalizeFileDescriptors(value) {
	if (isUndefined(value)) return [];
	if (!isArray(value)) fail('setting "boundaries/files" must be an array.');
	return value.map((descriptor, index) => {
		const where = `boundaries/files[${index}]`;
		if (!isObject(descriptor)) fail(`${where} must be an object.`);
		checkKeys(descriptor, ['category', 'pattern', 'capture'], where);
		if (!isString(descriptor.category))
			fail(`${where} needs a "category" string.`);
		descriptorPatterns(descriptor, where);
		checkCaptureNames(descriptor, where);
		return descriptor;
	});
}

function normalizeDependencyNodes(settings) {
	const keys = settings['boundaries/dependency-nodes'];
	let selected = ['import', 'export', 'require', 'dynamic-import'];
	if (!isUndefined(keys)) {
		if (
			!isArray(keys) ||
			!keys.every((key) => hasOwn(DEFAULT_DEPENDENCY_NODES, key))
		) {
			fail(
				'setting "boundaries/dependency-nodes" must list import, export, require or dynamic-import.',
			);
		}
		selected = keys;
	}
	const nodes = selected.flatMap((key) => DEFAULT_DEPENDENCY_NODES[key]);
	const additional = settings['boundaries/additional-dependency-nodes'];
	if (!isUndefined(additional)) {
		if (!isArray(additional))
			fail(
				'setting "boundaries/additional-dependency-nodes" must be an array.',
			);
		additional.forEach((node, index) => {
			if (
				!isObject(node) ||
				!isString(node.selector) ||
				(node.kind && !['value', 'type', 'typeof'].includes(node.kind)) ||
				(node.name && !isString(node.name))
			) {
				fail(
					`boundaries/additional-dependency-nodes[${index}] must be { selector, kind?, name? }.`,
				);
			}
			nodes.push(node);
		});
	}
	return nodes;
}

function normalizeFlagAsExternal(value) {
	const flags = {
		unresolvableAlias: true,
		inNodeModules: true,
		outsideRootPath: false,
		customSourcePatterns: [],
	};
	if (!value) return flags;
	if (!isObject(value))
		fail('setting "boundaries/flag-as-external" must be an object.');
	checkKeys(value, Object.keys(flags), 'setting "boundaries/flag-as-external"');
	for (const key of ['unresolvableAlias', 'inNodeModules', 'outsideRootPath']) {
		if (!isUndefined(value[key])) {
			if (!isBoolean(value[key]))
				fail(`flag-as-external "${key}" must be a boolean.`);
			flags[key] = value[key];
		}
	}
	if (!isUndefined(value.customSourcePatterns)) {
		if (
			!isArray(value.customSourcePatterns) ||
			!value.customSourcePatterns.every(isString)
		) {
			fail(
				'flag-as-external "customSourcePatterns" must be an array of strings.',
			);
		}
		flags.customSourcePatterns = value.customSourcePatterns;
	}
	return flags;
}

function normalizeRootPath(settings, cwd) {
	const fromEnv = process.env[ENV_ROOT_PATH];
	const fromSetting = settings['boundaries/root-path'];
	if (!isUndefined(fromSetting) && !isString(fromSetting)) {
		fail('setting "boundaries/root-path" must be a string.');
	}
	const effective = fromEnv || fromSetting;
	if (!effective) return cwd;
	return path.isAbsolute(effective) ? effective : path.resolve(cwd, effective);
}

const settingsCache = new WeakMap();

function getSettings(context) {
	const raw = context.settings;
	const cwd = context.cwd ?? process.cwd();
	const cached = settingsCache.get(raw);
	if (cached && cached.cwd === cwd) return cached.settings;
	for (const key of Object.keys(raw)) {
		if (key.startsWith('boundaries/') && !SETTING_KEYS.includes(key)) {
			fail(`unsupported setting "${key}".`);
		}
	}
	const debug = raw['boundaries/debug'];
	if (!isUndefined(debug) && !(isObject(debug) && !debug.enabled)) {
		fail('setting "boundaries/debug" is not supported.');
	}
	booleanSetting(raw, 'boundaries/legacy-warnings', true);
	const settings = {
		cache: booleanSetting(raw, 'boundaries/cache', true),
		elementDescriptors: normalizeElementDescriptors(raw['boundaries/elements']),
		fileDescriptors: normalizeFileDescriptors(raw['boundaries/files']),
		elementsSingleMatch: booleanSetting(
			raw,
			'boundaries/elements-single-match',
			true,
		),
		filesSingleMatch: booleanSetting(
			raw,
			'boundaries/files-single-match',
			false,
		),
		ignorePaths: pathListSetting(raw, 'boundaries/ignore'),
		includePaths: pathListSetting(raw, 'boundaries/include'),
		legacyTemplates: booleanSetting(raw, 'boundaries/legacy-templates', true),
		rootPath: normalizeRootPath(raw, cwd),
		dependencyNodes: normalizeDependencyNodes(raw),
		flagAsExternal: normalizeFlagAsExternal(raw['boundaries/flag-as-external']),
		resolver: normalizeResolverSettings(raw['import/resolver']),
		cwd,
	};
	for (const list of [settings.ignorePaths, settings.includePaths]) {
		for (const pattern of list ?? []) compileGlob(pattern);
	}
	for (const pattern of settings.flagAsExternal.customSourcePatterns)
		compileGlob(pattern);
	settings.describer = createDescriber(settings);
	settings.matcher = createMatcher(settings);
	settingsCache.set(raw, { cwd, settings });
	return settings;
}

const NODE_DEFAULT_EXTENSIONS = ['.mjs', '.js', '.json', '.node'];
const TS_DEFAULT_EXTENSIONS = [
	'.ts',
	'.tsx',
	'.d.ts',
	'.js',
	'.jsx',
	'.json',
	'.node',
];
const TS_EXTENSION_ALIAS = {
	'.js': ['.ts', '.tsx', '.d.ts', '.js'],
	'.ts': ['.ts', '.d.ts', '.js'],
	'.jsx': ['.tsx', '.d.ts', '.jsx'],
	'.tsx': ['.tsx', '.d.ts', '.jsx', '.js'],
	'.cjs': ['.cts', '.d.cts', '.cjs'],
	'.cts': ['.cts', '.d.cts', '.cjs'],
	'.mjs': ['.mts', '.d.mts', '.mjs'],
	'.mts': ['.mts', '.d.mts', '.mjs'],
};
const TS_OPTION_KEYS = [
	'alwaysTryTypes',
	'bun',
	'noWarnOnMultipleProjects',
	'project',
	'tsconfigRootDir',
	'extensions',
];

function normalizeResolverSettings(value) {
	const entries = [];
	const add = (name, options) => {
		if (name === 'node') {
			if (options === true || isUndefined(options)) options = {};
			if (!isObject(options))
				fail('resolver "node" options must be an object.');
			checkKeys(
				options,
				['extensions', 'moduleDirectory'],
				'the "node" resolver options',
			);
			entries.push({
				name,
				extensions: options.extensions ?? NODE_DEFAULT_EXTENSIONS,
				moduleDirectory: options.moduleDirectory ?? ['node_modules'],
			});
		} else if (name === 'typescript') {
			if (options === true || isUndefined(options)) options = {};
			if (!isObject(options))
				fail('resolver "typescript" options must be an object.');
			checkKeys(options, TS_OPTION_KEYS, 'the "typescript" resolver options');
			entries.push({
				name,
				project: options.project,
				tsconfigRootDir: options.tsconfigRootDir,
				extensions: options.extensions ?? TS_DEFAULT_EXTENSIONS,
			});
		} else {
			fail(
				`unsupported import resolver "${name}"; only "node" and "typescript" are supported.`,
			);
		}
	};
	if (isUndefined(value)) add('node', {});
	else if (isString(value)) add(value, {});
	else if (isArray(value)) {
		for (const item of value) {
			if (isString(item)) add(item, {});
			else if (isObject(item) && Object.keys(item).length === 1) {
				const [name] = Object.keys(item);
				add(name, item[name]);
			} else fail('unsupported "import/resolver" array entry.');
		}
	} else if (isObject(value)) {
		for (const [name, options] of Object.entries(value)) add(name, options);
	} else fail('unsupported "import/resolver" setting.');
	return entries;
}

function isFile(file) {
	try {
		return fs.statSync(file).isFile();
	} catch {
		return false;
	}
}

function isDirectory(file) {
	try {
		return fs.statSync(file).isDirectory();
	} catch {
		return false;
	}
}

function realOrSame(file) {
	try {
		return fs.realpathSync(file);
	} catch {
		return file;
	}
}

function loadAsFile(base, extensions) {
	if (isFile(base)) return base;
	for (const extension of extensions) {
		if (isFile(base + extension)) return base + extension;
	}
	return undefined;
}

function loadAsDirectory(directory, extensions, mainFields = ['main']) {
	const manifest = path.join(directory, 'package.json');
	if (isFile(manifest)) {
		try {
			const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
			for (const field of mainFields) {
				const main = parsed[field];
				if (isString(main) && main) {
					const target = path.resolve(directory, main);
					const found =
						loadAsFile(target, extensions) ?? loadIndex(target, extensions);
					if (found) return found;
				}
			}
		} catch {
			return loadIndex(directory, extensions);
		}
	}
	return loadIndex(directory, extensions);
}

function loadIndex(directory, extensions) {
	for (const extension of extensions) {
		const candidate = path.join(directory, `index${extension}`);
		if (isFile(candidate)) return candidate;
	}
	return undefined;
}

function resolvePathLike(target, extensions, mainFields) {
	if (target.endsWith('/') || target.endsWith(path.sep)) {
		return loadAsDirectory(target, extensions, mainFields);
	}
	return (
		loadAsFile(target, extensions) ??
		(isDirectory(target)
			? loadAsDirectory(target, extensions, mainFields)
			: undefined)
	);
}

const isRelativeSource = (source) =>
	source === '.' ||
	source === '..' ||
	source.startsWith('./') ||
	source.startsWith('../');

function ancestors(directory) {
	const result = [];
	let current = directory;
	for (;;) {
		result.push(current);
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return result;
}

function resolveBare(source, directory, extensions, moduleDirectories) {
	for (const base of ancestors(directory)) {
		for (const moduleDirectory of moduleDirectories) {
			const root = path.isAbsolute(moduleDirectory)
				? moduleDirectory
				: path.join(base, moduleDirectory);
			const found = resolvePathLike(path.join(root, source), extensions);
			if (found) return found;
		}
	}
	return undefined;
}

function isCoreSource(source) {
	return nodeModule.builtinModules.includes(
		source.startsWith('node:') ? source.slice(5) : source,
	);
}

function resolveWithNode(entry, source, directory) {
	if (isCoreSource(source)) return { found: true, path: null };
	let found;
	if (path.isAbsolute(source) || isRelativeSource(source)) {
		found = resolvePathLike(path.resolve(directory, source), entry.extensions);
	} else {
		found = resolveBare(
			source,
			directory,
			entry.extensions,
			entry.moduleDirectory,
		);
	}
	return found ? { found: true, path: realOrSame(found) } : { found: false };
}

function stripJsonComments(text) {
	let out = '';
	let index = 0;
	let inString = false;
	while (index < text.length) {
		const char = text[index];
		const next = text[index + 1];
		if (inString) {
			out += char;
			if (char === '\\') {
				out += next ?? '';
				index += 2;
				continue;
			}
			if (char === '"') inString = false;
			index += 1;
		} else if (char === '"') {
			inString = true;
			out += char;
			index += 1;
		} else if (char === '/' && next === '/') {
			while (index < text.length && text[index] !== '\n') index += 1;
		} else if (char === '/' && next === '*') {
			index += 2;
			while (
				index < text.length &&
				!(text[index] === '*' && text[index + 1] === '/')
			)
				index += 1;
			index += 2;
		} else {
			out += char;
			index += 1;
		}
	}
	return out.replace(/,(\s*[}\]])/g, '$1');
}

const tsconfigCache = new Map();
const succeededTsconfigs = new Set();
const TS_MAIN_FIELDS = [
	'types',
	'typings',
	'fesm2020',
	'fesm2015',
	'esm2020',
	'es2020',
	'module',
	'jsnext:main',
	'main',
];
const TS_FILE_EXTENSIONS = [
	'.ts',
	'.tsx',
	'.d.ts',
	'.cts',
	'.d.cts',
	'.mts',
	'.d.mts',
];
const TS_JS_FILE_EXTENSIONS = ['.js', '.jsx', '.cjs', '.mjs'];

function resolveExtends(spec, directory) {
	const candidates = (base) => [
		base,
		`${base}.json`,
		path.join(base, 'tsconfig.json'),
	];
	if (spec.startsWith('.') || path.isAbsolute(spec)) {
		return candidates(path.resolve(directory, spec)).find(isFile);
	}
	for (const base of ancestors(directory)) {
		const found = candidates(path.join(base, 'node_modules', spec)).find(
			isFile,
		);
		if (found) return found;
	}
	return undefined;
}

const toPosix = (file) => file.split(path.sep).join('/');

function parseTsconfig(file, seen = new Set()) {
	let stat;
	try {
		stat = fs.statSync(file);
	} catch {
		return undefined;
	}
	const cacheKey = `${file}:${stat.mtimeMs}`;
	if (seen.size === 0 && tsconfigCache.has(cacheKey))
		return tsconfigCache.get(cacheKey);
	if (seen.has(file)) return undefined;
	seen.add(file);
	let raw;
	try {
		raw = JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8')));
	} catch {
		return undefined;
	}
	if (!isObject(raw)) return undefined;
	const directory = path.dirname(file);
	let merged = {
		compilerOptions: {},
		files: undefined,
		include: undefined,
		exclude: undefined,
	};
	for (const spec of toArray(raw.extends ?? [])) {
		if (!isString(spec)) continue;
		const parentFile = resolveExtends(spec, directory);
		const parent = parentFile
			? parseTsconfig(parentFile, new Set(seen))
			: undefined;
		if (!parent) continue;
		merged = {
			compilerOptions: { ...merged.compilerOptions, ...parent.compilerOptions },
			files: parent.files ?? merged.files,
			include: parent.include ?? merged.include,
			exclude: parent.exclude ?? merged.exclude,
		};
	}
	const own = isObject(raw.compilerOptions) ? raw.compilerOptions : {};
	const compilerOptions = { ...merged.compilerOptions };
	for (const key of ['baseUrl', 'outDir', 'declarationDir']) {
		if (isString(own[key]))
			compilerOptions[key] = toPosix(path.resolve(directory, own[key]));
	}
	if (isBoolean(own.allowJs)) compilerOptions.allowJs = own.allowJs;
	if (own.checkJs === true && !isBoolean(own.allowJs))
		compilerOptions.allowJs = true;
	if (isObject(own.paths)) {
		compilerOptions.paths = own.paths;
		compilerOptions.pathsDirectory = directory;
	}
	const patterns = (list) =>
		isArray(list)
			? list
					.filter(isString)
					.map((entry) =>
						toPosix(
							path.isAbsolute(entry) ? entry : path.join(directory, entry),
						),
					)
			: undefined;
	const result = {
		file,
		directory,
		compilerOptions,
		files: patterns(raw.files) ?? merged.files,
		include: patterns(raw.include) ?? merged.include,
		exclude: patterns(raw.exclude) ?? merged.exclude,
	};
	if (seen.size === 1) tsconfigCache.set(cacheKey, result);
	return result;
}

const escapeForRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function createFilesMatcher(config) {
	const notExcluded = '(?!(node_modules|bower_components|jspm_packages)(/|$))';
	const notDotted = '[^./]';
	const anyChar = '[^/]';
	const { compilerOptions } = config;
	const supported = compilerOptions.allowJs
		? [...TS_FILE_EXTENSIONS, ...TS_JS_FILE_EXTENSIONS]
		: TS_FILE_EXTENSIONS;
	const excludeSpec =
		config.exclude ??
		[compilerOptions.outDir, compilerOptions.declarationDir].filter(Boolean);
	const excludes = excludeSpec.map((entry) => {
		const body = escapeForRegExp(entry)
			.replaceAll('\\*\\*/', '(.+/)?')
			.replaceAll('\\*', `${anyChar}*`)
			.replaceAll('\\?', anyChar);
		return new RegExp(`^${body}($|/)`);
	});
	const includeSpec =
		config.files || config.include ? config.include : ['**/*'];
	const includes = includeSpec
		? includeSpec.map((entry) => {
				const absolute = path.isAbsolute(entry)
					? entry
					: `${toPosix(config.directory)}/${entry}`;
				const target = /(?:^|\/)[^.*?]+$/.test(absolute)
					? `${absolute}/**/*`
					: absolute;
				const star = `(${notDotted}|(\\.(?!min\\.js$))?)*`;
				const body = escapeForRegExp(target)
					.replaceAll('/\\*\\*', `(/${notExcluded}${notDotted}${anyChar}*)*?`)
					.replaceAll(/(\/)?\\\*/g, (_match, slash) =>
						slash ? `/${notExcluded}${notDotted}${star}` : star,
					)
					.replaceAll(/(\/)?\\\?/g, (_match, slash) =>
						slash ? `/${notExcluded}${anyChar}` : anyChar,
					);
				return new RegExp(`^${body}$`);
			})
		: undefined;
	return (file) => {
		const posix = toPosix(file);
		if (config.files?.includes(posix)) return true;
		return Boolean(
			supported.some((extension) => posix.endsWith(extension)) &&
			!excludes.some((regex) => regex.test(posix)) &&
			includes?.some((regex) => regex.test(posix)),
		);
	};
}

const segmentRegexCache = new Map();

function projectSegmentRegex(segment) {
	let regex = segmentRegexCache.get(segment);
	if (!regex) {
		let source = '';
		for (let index = 0; index < segment.length; index += 1) {
			const char = segment[index];
			if (char === '*') source += '[^/]*';
			else if (char === '?') source += '[^/]';
			else if (char === '{') {
				const close = segment.indexOf('}', index);
				if (close < 0)
					fail(`unsupported tsconfig project glob segment "${segment}".`);
				source += `(?:${segment
					.slice(index + 1, close)
					.split(',')
					.map(escapeForRegExp)
					.join('|')})`;
				index = close;
			} else if (
				char === '[' ||
				char === '(' ||
				char === '!' ||
				char === '\\'
			) {
				fail(`unsupported tsconfig project glob segment "${segment}".`);
			} else source += escapeForRegExp(char);
		}
		regex = new RegExp(`^${source}$`);
		segmentRegexCache.set(segment, regex);
	}
	return regex;
}

function expandProjectGlob(cwd, pattern) {
	const absolute = path.resolve(cwd, pattern);
	const { root: filesystemRoot } = path.parse(absolute);
	const segments = absolute.slice(filesystemRoot.length).split(path.sep);
	let bases = [filesystemRoot];
	for (const segment of segments) {
		if (segment === '**')
			fail(`unsupported tsconfig project glob "${pattern}": "**".`);
		const next = [];
		for (const base of bases) {
			if (!/[*?{]/.test(segment)) {
				next.push(path.join(base, segment));
				continue;
			}
			let names = [];
			try {
				names = fs.readdirSync(base);
			} catch {
				names = [];
			}
			const regex = projectSegmentRegex(segment);
			for (const name of names.sort()) {
				if (name !== 'node_modules' && regex.test(name))
					next.push(path.join(base, name));
			}
		}
		bases = next;
	}
	return bases;
}

function tryTsconfigFile(candidate) {
	for (const name of ['', 'tsconfig.json', 'jsconfig.json']) {
		const target = path.resolve(candidate, name);
		if (isFile(target)) return target;
	}
	return undefined;
}

function tsconfigProjects(entry, cwd) {
	if (entry.projects?.cwd === cwd) return entry.projects.list;
	const list = expandTsconfigProjects(entry, cwd);
	entry.projects = { cwd, list };
	return list;
}

function expandTsconfigProjects(entry, cwd) {
	const { project } = entry;
	if (
		!isUndefined(project) &&
		!isString(project) &&
		!(isArray(project) && project.every(isString))
	) {
		fail(
			'typescript resolver "project" must be a string or an array of strings.',
		);
	}
	let candidates = [];
	if (!isUndefined(project)) {
		const patterns = toArray(project).map((entryPattern) =>
			entryPattern.replaceAll('\\', '/'),
		);
		candidates = patterns.some((entryPattern) =>
			/[*?{}[\]()!]/.test(entryPattern),
		)
			? patterns.flatMap((entryPattern) => expandProjectGlob(cwd, entryPattern))
			: patterns.map((entryPattern) => path.resolve(cwd, entryPattern));
	}
	const projects = candidates.flatMap(
		(candidate) => tryTsconfigFile(candidate) ?? [],
	);
	if (projects.length === 0) {
		const fallback = ['tsconfig.json', 'jsconfig.json']
			.map((name) => path.join(cwd, name))
			.find(isFile);
		return fallback ? [fallback] : [];
	}
	return projects;
}

function affinity(projectDirectory, fileDirectory) {
	const a = projectDirectory.split(path.sep);
	const b = fileDirectory.split(path.sep);
	let common = 0;
	while (common < a.length && common < b.length && a[common] === b[common])
		common += 1;
	return a.length - common + (b.length - common);
}

function sortProjectsByAffinity(projects, file) {
	const fileDirectory = path.dirname(file);
	return projects
		.map((project) => ({
			project,
			score: affinity(path.dirname(project), fileDirectory),
		}))
		.sort((left, right) => left.score - right.score)
		.map((item) => item.project);
}

function mappedTargets(config, source) {
	const { baseUrl, paths, pathsDirectory } = config.compilerOptions;
	if (!baseUrl && !paths) return [];
	const base = baseUrl ?? pathsDirectory ?? config.directory;
	const entries = paths
		? Object.entries(paths).filter(
				([key, value]) => isArray(value) && key.split('*').length <= 2,
			)
		: [];
	for (const [key, substitutions] of entries) {
		if (key === source) {
			return substitutions
				.filter(isString)
				.map((target) => path.resolve(base, target));
		}
	}
	let best;
	for (const [key, substitutions] of entries) {
		const star = key.indexOf('*');
		if (star < 0) continue;
		const prefix = key.slice(0, star);
		const suffix = key.slice(star + 1);
		if (
			source.startsWith(prefix) &&
			source.endsWith(suffix) &&
			source.length >= prefix.length + suffix.length &&
			(!best || prefix.length > best.prefix.length)
		) {
			best = { prefix, suffix, substitutions };
		}
	}
	if (!best) return baseUrl ? [path.join(base, source)] : [];
	const matched = source.slice(
		best.prefix.length,
		source.length - best.suffix.length,
	);
	return best.substitutions
		.filter(isString)
		.map((target) => path.resolve(base, target.replace('*', matched)));
}

function resolveTsFile(target, extensions) {
	const extension = path.extname(target);
	const aliases = TS_EXTENSION_ALIAS[extension];
	if (aliases) {
		const stem = target.slice(0, -extension.length);
		for (const alias of aliases) {
			if (isFile(stem + alias)) return stem + alias;
		}
	}
	return resolvePathLike(target, extensions, TS_MAIN_FIELDS);
}

function resolveInTsconfig(config, entry, source, sourceFile) {
	const directory = path.dirname(sourceFile);
	if (path.isAbsolute(source) || isRelativeSource(source)) {
		return resolveTsFile(path.resolve(directory, source), entry.extensions);
	}
	if (config) {
		for (const target of mappedTargets(config, source)) {
			const found = resolveTsFile(target, entry.extensions);
			if (found) return found;
		}
	}
	for (const base of ancestors(directory)) {
		const found = resolveTsFile(
			path.join(base, 'node_modules', source),
			entry.extensions,
		);
		if (found) return found;
	}
	return undefined;
}

function resolveWithTypescript(entry, rawSource, sourceFile, cwd) {
	if (
		isCoreSource(rawSource) ||
		rawSource === 'bun' ||
		rawSource.startsWith('bun:')
	) {
		return { found: true, path: null };
	}
	const queryIndex = rawSource.lastIndexOf('?');
	const source = queryIndex === -1 ? rawSource : rawSource.slice(0, queryIndex);
	const projects = tsconfigProjects(entry, cwd);
	const attempt = (project) => {
		const config = project ? parseTsconfig(project) : undefined;
		const found = resolveInTsconfig(config, entry, source, sourceFile);
		return found ? { found: true, path: realOrSame(found) } : { found: false };
	};
	if (projects.length <= 1) return attempt(projects[0]);
	const sorted = sortProjectsByAffinity(projects, sourceFile);
	let matched = false;
	for (const project of sorted) {
		const config = parseTsconfig(project);
		if (!config) continue;
		config.matches ??= createFilesMatcher(config);
		if (!config.matches(sourceFile)) continue;
		matched = true;
		if (succeededTsconfigs.has(project)) return attempt(project);
		const result = attempt(project);
		if (result.found) {
			succeededTsconfigs.add(project);
			return result;
		}
	}
	if (matched) return { found: false };
	for (const project of sorted) {
		const result = attempt(project);
		if (result.found) return result;
	}
	return { found: false };
}

function resolveSource(source, sourceFile, settings) {
	const directory = path.dirname(sourceFile);
	for (const entry of settings.resolver) {
		const result =
			entry.name === 'node'
				? resolveWithNode(entry, source, directory)
				: resolveWithTypescript(entry, source, sourceFile, settings.cwd);
		if (result.found) return result.path ?? undefined;
	}
	return undefined;
}

function getSpecifiers(node) {
	const { parent } = node;
	if (parent?.type === 'ImportDeclaration') {
		return parent.specifiers
			.filter(
				(specifier) =>
					specifier.type === 'ImportSpecifier' && specifier.imported?.name,
			)
			.map((specifier) => specifier.imported.name);
	}
	if (parent?.type === 'ExportNamedDeclaration') {
		return parent.specifiers
			.filter(
				(specifier) =>
					specifier.type === 'ExportSpecifier' && specifier.exported.name,
			)
			.map((specifier) => specifier.exported.name);
	}
	return [];
}

function dependencyVisitors(context, requireOptions, handle) {
	const rawOptions = context.options[0];
	const settings = getSettings(context);
	const filename = context.filename ?? context.physicalFilename;
	const fromEntity = settings.describer.describeEntity(filename);
	if (requireOptions && !rawOptions) return {};
	if (
		fromEntity.file.isIgnored ||
		(fromEntity.file.isUnknown && fromEntity.element.isUnknown)
	) {
		return {};
	}
	const physicalFilename = context.physicalFilename ?? filename;
	return settings.dependencyNodes.reduce(
		(visitors, { selector, kind, name }) => {
			visitors[selector] = (node) => {
				if (!isString(node.value)) return;
				const source = String(node.value);
				const resolved = resolveSource(source, physicalFilename, settings);
				const dependency = settings.describer.describeDependency({
					from: filename,
					to: resolved || undefined,
					source,
					kind: kind || 'value',
					nodeKind: name,
					specifiers: getSpecifiers(node),
				});
				handle(dependency, node, settings);
			};
			return visitors;
		},
		{},
	);
}

const dependencies = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Check dependencies between elements',
			url: 'https://www.jsboundaries.dev/docs/rules/dependencies/',
		},
		schema: [{ type: 'object', additionalProperties: true }],
	},
	create(context) {
		const rawOptions = context.options[0];
		const options = rawOptions ? normalizeOptions(rawOptions) : undefined;
		return dependencyVisitors(context, true, (dependency, node, settings) => {
			const isLocal = dependency.to.module.origin === 'local';
			const isUnknownLocal =
				isLocal &&
				dependency.to.file.isUnknown &&
				dependency.to.element.isUnknown;
			const isInternal = dependency.dependency.relationship.to === 'internal';
			if (
				(!dependency.to.file.isIgnored || !isLocal) &&
				!dependency.from.file.isIgnored &&
				(options.checkAllOrigins || isLocal) &&
				(options.checkUnknownLocals || !isUnknownLocal) &&
				(options.checkInternals || !isInternal)
			) {
				const result = evaluatePolicies(
					options.policies,
					dependency,
					settings.matcher,
					settings,
				);
				const defaultAllowed = options.default === 'allow';
				let finalAllowed = false;
				if (result.allowed === true) finalAllowed = true;
				else if (isNull(result.ruleIndex)) finalAllowed = defaultAllowed;
				if (!finalAllowed && result.allowed === false) {
					const template =
						options.policies[result.ruleIndex]?.message ?? options.message;
					const message = template
						? customMessage(
								template,
								dependency,
								result.ruleIndex,
								result.matchResult,
							)
						: isNull(result.ruleIndex)
							? noRuleMessage(dependency)
							: matchedMessage(
									result.matchResult,
									result.ruleIndex,
									dependency,
								);
					context.report({ message, node });
				}
			}
		});
	},
};

const REQUIRE_MODES = ['all', 'element', 'file', 'any'];

function reportedAxes(mode, elementUnknown, fileUnknown) {
	switch (mode) {
		case 'all':
			return elementUnknown || fileUnknown
				? { element: elementUnknown, file: fileUnknown }
				: null;
		case 'element':
			return elementUnknown ? { element: true, file: false } : null;
		case 'file':
			return fileUnknown ? { element: false, file: true } : null;
		default:
			return elementUnknown && fileUnknown
				? { element: true, file: true }
				: null;
	}
}

function unknownDependencyMessage(axes) {
	if (axes.element && axes.file)
		return 'Dependencies to unknown elements and files are not allowed';
	if (axes.element) return 'Dependencies to unknown elements are not allowed';
	return 'Dependencies to unknown files are not allowed';
}

const noUnknownDependencies = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Prevent dependencies to unknown elements and files',
			url: 'https://www.jsboundaries.dev/docs/rules/no-unknown-dependencies/',
		},
		schema: [
			{
				type: 'object',
				properties: { require: { type: 'string', enum: REQUIRE_MODES } },
				additionalProperties: false,
			},
		],
	},
	create(context) {
		const mode = context.options[0]?.require ?? 'any';
		return dependencyVisitors(context, false, (dependency, node) => {
			const axes = reportedAxes(
				mode,
				dependency.to.element.isUnknown,
				dependency.to.file.isUnknown,
			);
			if (
				axes &&
				!dependency.to.element.isIgnored &&
				!dependency.to.file.isIgnored &&
				dependency.to.module.origin === 'local'
			) {
				context.report({ message: unknownDependencyMessage(axes), node });
			}
		});
	},
};

const noUnknownFiles = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Prevent creating files not recognized by any element or file patterns',
			url: 'https://www.jsboundaries.dev/docs/rules/no-unknown-files/',
		},
		schema: [],
	},
	create(context) {
		const settings = getSettings(context);
		const entity = settings.describer.describeEntity(
			context.filename ?? context.physicalFilename,
		);
		if (
			entity.file.isIgnored ||
			!entity.file.isUnknown ||
			!entity.element.isUnknown
		)
			return {};
		return {
			Program: (node) => {
				context.report({
					message:
						'File does not match any file pattern and does not belong to any known element',
					node,
				});
			},
		};
	},
};

module.exports = {
	meta: { name: 'boundaries' },
	rules: {
		dependencies,
		'no-unknown-dependencies': noUnknownDependencies,
		'no-unknown-files': noUnknownFiles,
	},
};
