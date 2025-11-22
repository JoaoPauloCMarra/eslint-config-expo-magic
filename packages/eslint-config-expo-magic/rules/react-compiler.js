const { transformFromAstSync } = require('@babel/core');
const BabelParser = require('@babel/parser');

function importBabelPluginReactCompiler() {
    try {
        return require('babel-plugin-react-compiler');
    } catch (error) {
        throw new Error(
            `Failed to load babel-plugin-react-compiler. Please install it: bun add babel-plugin-react-compiler`,
        );
    }
}

function runReactCompilerAnalysis(sourceCode, filename) {
    const BabelPluginReactCompiler = importBabelPluginReactCompiler();

    const successfulCompilations = [];
    const failedCompilations = [];

    const logger = {
        logEvent(filename, rawEvent) {
            const event = { ...rawEvent, filename };
            switch (event.kind) {
                case 'CompileSuccess':
                    successfulCompilations.push(event);
                    break;
                case 'CompileError':
                case 'CompileDiagnostic':
                case 'PipelineError':
                    failedCompilations.push(event);
                    break;
            }
        },
    };

    const COMPILER_OPTIONS = {
        noEmit: true,
        compilationMode: 'infer',
        panicThreshold: 'none',
        environment: {
            enableTreatRefLikeIdentifiersAsRefs: true,
        },
        logger,
    };

    try {
        const ast = BabelParser.parse(sourceCode, {
            sourceFilename: filename,
            plugins: ['typescript', 'jsx'],
            sourceType: 'module',
        });

        transformFromAstSync(ast, sourceCode, {
            filename,
            highlightCode: false,
            retainLines: true,
            plugins: [[BabelPluginReactCompiler, COMPILER_OPTIONS]],
            sourceType: 'module',
            configFile: false,
            babelrc: false,
        });
    } catch (error) {
        // If parsing fails, skip analysis (file has syntax errors)
        return { successfulCompilations: [], failedCompilations: [] };
    }

    return { successfulCompilations, failedCompilations };
}

const reactCompilerRule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce React Compiler optimization compatibility by reporting components that fail to optimize',
            category: 'Best Practices',
            recommended: true,
        },
        messages: {
            reactCompilerFailure: '🚫 React Compiler failed to optimize this component: {{reason}}',
        },
        schema: [],
    },
    create(context) {
        return {
            Program(node) {
                const sourceCode = context.sourceCode.text;
                const filename = context.filename || 'unknown.tsx';

                const { successfulCompilations, failedCompilations } =
                    runReactCompilerAnalysis(sourceCode, filename);

                // Report each optimization failure individually, even if other components
                // in the same file were successfully optimized
                if (failedCompilations.length > 0) {
                    failedCompilations.forEach((failure) => {
                        // Prefer the specific error location (detail.options.loc) over the
                        // component location (fnLoc) to provide more precise feedback.
                        // This matches the behavior of the react-compiler-marker extension.
                        const loc = failure.detail?.options?.loc ?? failure.fnLoc;
                        const reason =
                            failure.detail?.reason || 'Unknown optimization failure';

                        context.report({
                            loc: {
                                start: { line: loc.start.line, column: loc.start.column },
                                end: { line: loc.end.line, column: loc.end.column },
                            },
                            messageId: 'reactCompilerFailure',
                            data: { reason },
                        });
                    });
                }
            },
        };
    },
};

// Export for use in ESLint config
module.exports = reactCompilerRule;

// Export functions for testing
module.exports.runReactCompilerAnalysis = runReactCompilerAnalysis;
module.exports.reactCompilerRule = reactCompilerRule;
