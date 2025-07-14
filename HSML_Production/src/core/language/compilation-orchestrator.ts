/**
 * HSML Compilation Orchestrator
 * Connects lexer → parser → semantic analyzer → IR → code generator pipeline
 */

import { HSMLMultiLexer } from './hsml-lexer';
import { HSMLMultiParser } from './hsml-parser';
import { HSMLSemanticAnalyzer } from './semantic-analyzer';
import { HSMLIRBuilder } from './hsml-ir';
import { HSMLCodeGenerator } from './code-generator';

export interface CompilationConfig {
    target: 'webgl' | 'webgpu' | 'cpu' | 'gpu' | 'wasm' | 'native';
    optimizationLevel: number;
    precision: 'single' | 'double' | 'extended';
    enableSphericalOptimization: boolean;
    enablePhysicsOptimization: boolean;
    enableParallelization: boolean;
    enableCaching: boolean;
    generateSourceMaps: boolean;
    includeComments: boolean;
    minify: boolean;
}

export interface CompilationResult {
    success: boolean;
    code?: string;
    sourceMap?: string;
    errors: CompilationError[];
    warnings: CompilationWarning[];
    performance: {
        lexerTime: number;
        parserTime: number;
        semanticTime: number;
        irTime: number;
        codeGenTime: number;
        totalTime: number;
    };
}

export interface CompilationError {
    type: 'lexer' | 'parser' | 'semantic' | 'ir' | 'codegen';
    message: string;
    line: number;
    column: number;
    source: string;
}

export interface CompilationWarning {
    type: 'performance' | 'deprecation' | 'style';
    message: string;
    line: number;
    column: number;
    source: string;
}

export class HSMLCompilationOrchestrator {
    private lexer: HSMLMultiLexer;
    private parser: HSMLMultiParser;
    private semanticAnalyzer: HSMLSemanticAnalyzer;
    private irBuilder: HSMLIRBuilder;
    private codeGenerator: HSMLCodeGenerator;
    private config: CompilationConfig;

    constructor(config: CompilationConfig) {
        this.config = config;
        this.initializeComponents();
    }

    // === COMPONENT INITIALIZATION ===

    private initializeComponents(): void {
        try {
            console.log('🔧 Initializing HSML Compilation Pipeline...');

            // Initialize lexer
            this.lexer = new HSMLMultiLexer('', 'hsml');
            console.log('✅ Lexer initialized');

            // Initialize parser
            this.parser = new HSMLMultiParser([], 'hsml');
            console.log('✅ Parser initialized');

            // Initialize semantic analyzer
            this.semanticAnalyzer = new HSMLSemanticAnalyzer();
            console.log('✅ Semantic Analyzer initialized');

            // Initialize IR builder
            this.irBuilder = new HSMLIRBuilder();
            console.log('✅ IR Builder initialized');

            // Initialize code generator
            this.codeGenerator = new HSMLCodeGenerator({
                target: this.config.target,
                optimizationLevel: this.config.optimizationLevel,
                precision: this.config.precision,
                enableSphericalOptimization: this.config.enableSphericalOptimization,
                enablePhysicsOptimization: this.config.enablePhysicsOptimization,
                enableParallelization: this.config.enableParallelization,
                enableCaching: this.config.enableCaching,
                outputFormat: 'javascript',
                includeComments: this.config.includeComments,
                minify: this.config.minify
            });
            console.log('✅ Code Generator initialized');

            console.log('🎉 HSML Compilation Pipeline initialized');

        } catch (error) {
            console.error('❌ Compilation pipeline initialization failed:', error);
            throw error;
        }
    }

    // === MAIN COMPILATION PIPELINE ===

    public compile(sourceCode: string, language: 'hsml' | 'csss' | 'shape' | 'styb'): CompilationResult {
        const startTime = performance.now();
        const result: CompilationResult = {
            success: false,
            errors: [],
            warnings: [],
            performance: {
                lexerTime: 0,
                parserTime: 0,
                semanticTime: 0,
                irTime: 0,
                codeGenTime: 0,
                totalTime: 0
            }
        };

        try {
            console.log(`🔨 Compiling ${language.toUpperCase()} source code...`);

            // Step 1: Lexical Analysis
            const lexerStart = performance.now();
            const tokens = this.performLexicalAnalysis(sourceCode, language);
            result.performance.lexerTime = performance.now() - lexerStart;

            if (result.errors.length > 0) {
                throw new Error('Lexical analysis failed');
            }

            // Step 2: Parsing
            const parserStart = performance.now();
            const ast = this.performParsing(tokens, language);
            result.performance.parserTime = performance.now() - parserStart;

            if (result.errors.length > 0) {
                throw new Error('Parsing failed');
            }

            // Step 3: Semantic Analysis
            const semanticStart = performance.now();
            const semanticResult = this.performSemanticAnalysis(ast, language);
            result.performance.semanticTime = performance.now() - semanticStart;

            // Add semantic errors and warnings
            result.errors.push(...semanticResult.errors);
            result.warnings.push(...semanticResult.warnings);

            if (result.errors.length > 0) {
                throw new Error('Semantic analysis failed');
            }

            // Step 4: IR Generation
            const irStart = performance.now();
            const ir = this.performIRGeneration(ast, language);
            result.performance.irTime = performance.now() - irStart;

            if (result.errors.length > 0) {
                throw new Error('IR generation failed');
            }

            // Step 5: Code Generation
            const codeGenStart = performance.now();
            const generatedCode = this.performCodeGeneration(ir, language);
            result.performance.codeGenTime = performance.now() - codeGenStart;

            if (result.errors.length > 0) {
                throw new Error('Code generation failed');
            }

            // Set final result
            result.success = true;
            result.code = generatedCode.code;
            result.sourceMap = generatedCode.sourceMap;

            result.performance.totalTime = performance.now() - startTime;

            console.log(`✅ ${language.toUpperCase()} compilation successful`);
            console.log(`📊 Performance: ${result.performance.totalTime.toFixed(2)}ms`);

            return result;

        } catch (error) {
            console.error(`❌ ${language.toUpperCase()} compilation failed:`, error);
            result.success = false;
            result.performance.totalTime = performance.now() - startTime;
            return result;
        }
    }

    // === PIPELINE STEPS ===

    private performLexicalAnalysis(sourceCode: string, language: string): any[] {
        try {
            console.log('🔍 Performing lexical analysis...');

            // Create lexer for the specific language
            const lexer = new HSMLMultiLexer(sourceCode, language);
            const tokens = lexer.tokenize();

            // Validate tokens
            if (!tokens || tokens.length === 0) {
                throw new Error('No tokens generated');
            }

            // Check for spherical coordinate tokens
            const sphericalTokens = tokens.filter(t => t.type === 'SPHERICAL_COORD');
            if (sphericalTokens.length === 0) {
                console.warn('⚠️ No spherical coordinate tokens found');
            }

            console.log(`✅ Lexical analysis complete: ${tokens.length} tokens`);
            return tokens;

        } catch (error) {
            console.error('❌ Lexical analysis failed:', error);
            throw error;
        }
    }

    private performParsing(tokens: any[], language: string): any {
        try {
            console.log('🌳 Performing parsing...');

            // Create parser for the specific language
            const parser = new HSMLMultiParser(tokens, language);
            const ast = parser.parse();

            // Validate AST
            if (!ast) {
                throw new Error('No AST generated');
            }

            // Check for spherical coordinate nodes
            const hasSphericalNodes = this.checkForSphericalNodes(ast);
            if (!hasSphericalNodes) {
                console.warn('⚠️ No spherical coordinate nodes in AST');
            }

            console.log('✅ Parsing complete');
            return ast;

        } catch (error) {
            console.error('❌ Parsing failed:', error);
            throw error;
        }
    }

    private performSemanticAnalysis(ast: any, language: string): { errors: CompilationError[], warnings: CompilationWarning[] } {
        try {
            console.log('🔬 Performing semantic analysis...');

            const analyzer = new HSMLSemanticAnalyzer();
            const result = analyzer.analyze(ast);

            // Convert to compilation format
            const errors: CompilationError[] = result.errors.map(e => ({
                type: 'semantic',
                message: e.message,
                line: e.line || 0,
                column: e.column || 0,
                source: language
            }));

            const warnings: CompilationWarning[] = result.warnings.map(w => ({
                type: 'style',
                message: w.message,
                line: w.line || 0,
                column: w.column || 0,
                source: language
            }));

            console.log(`✅ Semantic analysis complete: ${errors.length} errors, ${warnings.length} warnings`);
            return { errors, warnings };

        } catch (error) {
            console.error('❌ Semantic analysis failed:', error);
            throw error;
        }
    }

    private performIRGeneration(ast: any, language: string): any {
        try {
            console.log('🏗️ Performing IR generation...');

            const irBuilder = new HSMLIRBuilder();
            const ir = irBuilder.buildIR(ast);

            // Validate IR
            if (!ir || !ir.functions || !ir.globalVariables) {
                throw new Error('Invalid IR structure');
            }

            // Check for spherical optimization hints
            const hasSphericalOptimization = ir.optimizationHints.some(h => h.type === 'spherical');
            if (!hasSphericalOptimization) {
                console.warn('⚠️ No spherical optimization hints in IR');
            }

            console.log('✅ IR generation complete');
            return ir;

        } catch (error) {
            console.error('❌ IR generation failed:', error);
            throw error;
        }
    }

    private performCodeGeneration(ir: any, language: string): { code: string, sourceMap?: string } {
        try {
            console.log('⚙️ Performing code generation...');

            const codeGenerator = new HSMLCodeGenerator({
                target: this.config.target,
                optimizationLevel: this.config.optimizationLevel,
                precision: this.config.precision,
                enableSphericalOptimization: this.config.enableSphericalOptimization,
                enablePhysicsOptimization: this.config.enablePhysicsOptimization,
                enableParallelization: this.config.enableParallelization,
                enableCaching: this.config.enableCaching,
                outputFormat: 'javascript',
                includeComments: this.config.includeComments,
                minify: this.config.minify
            });

            const result = codeGenerator.generate(ir);

            // Validate generated code
            if (!result.code || result.code.length === 0) {
                throw new Error('Empty generated code');
            }

            // Check for spherical coordinate code
            if (!result.code.includes('spherical') && !result.code.includes('Spherical')) {
                console.warn('⚠️ No spherical coordinate code in output');
            }

            console.log('✅ Code generation complete');
            return {
                code: result.code,
                sourceMap: this.config.generateSourceMaps ? result.sourceMap : undefined
            };

        } catch (error) {
            console.error('❌ Code generation failed:', error);
            throw error;
        }
    }

    // === UTILITY METHODS ===

    private checkForSphericalNodes(ast: any): boolean {
        if (!ast) return false;

        if (ast.type === 'SPHERICAL_COORDINATE' || 
            ast.type === 'SOLID_ANGLE' || 
            ast.type === 'MATTER_STATE') {
            return true;
        }

        if (ast.children) {
            for (const child of ast.children) {
                if (this.checkForSphericalNodes(child)) {
                    return true;
                }
            }
        }

        return false;
    }

    // === BATCH COMPILATION ===

    public compileMultiple(sources: { code: string, language: string, name: string }[]): CompilationResult[] {
        console.log(`🔨 Compiling ${sources.length} source files...`);

        const results: CompilationResult[] = [];

        for (const source of sources) {
            try {
                console.log(`📄 Compiling ${source.name} (${source.language})...`);
                const result = this.compile(source.code, source.language as any);
                results.push(result);
            } catch (error) {
                console.error(`❌ Failed to compile ${source.name}:`, error);
                results.push({
                    success: false,
                    errors: [{
                        type: 'codegen',
                        message: error.message,
                        line: 0,
                        column: 0,
                        source: source.name
                    }],
                    warnings: [],
                    performance: {
                        lexerTime: 0,
                        parserTime: 0,
                        semanticTime: 0,
                        irTime: 0,
                        codeGenTime: 0,
                        totalTime: 0
                    }
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Batch compilation complete: ${successCount}/${sources.length} successful`);

        return results;
    }
}

// Export orchestrator factory
export function createCompilationOrchestrator(config: CompilationConfig): HSMLCompilationOrchestrator {
    return new HSMLCompilationOrchestrator(config);
}

// Default compilation configuration
export const DEFAULT_COMPILATION_CONFIG: CompilationConfig = {
    target: 'webgl',
    optimizationLevel: 2,
    precision: 'double',
    enableSphericalOptimization: true,
    enablePhysicsOptimization: true,
    enableParallelization: true,
    enableCaching: true,
    generateSourceMaps: true,
    includeComments: true,
    minify: false
}; 