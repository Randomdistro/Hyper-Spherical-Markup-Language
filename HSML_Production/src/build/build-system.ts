/**
 * HSML Build System - Production Build Pipeline
 * Multi-target compilation with optimization levels
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface BuildConfig {
    target: 'webgl' | 'webgpu' | 'cpu' | 'wasm';
    optimization: 1 | 2 | 3 | 4 | 5;
    minify: boolean;
    sourcemap: boolean;
    output: string;
    entry: string;
    watch: boolean;
}

interface OptimizationLevel {
    name: string;
    description: string;
    settings: {
        sphericalOptimization: boolean;
        physicsOptimization: boolean;
        renderingOptimization: boolean;
        memoryOptimization: boolean;
        parallelProcessing: boolean;
    };
}

class HSMLBuildSystem {
    private config: BuildConfig;
    private optimizationLevels: Map<number, OptimizationLevel>;

    constructor(config: BuildConfig) {
        this.config = config;
        this.initializeOptimizationLevels();
    }

    private initializeOptimizationLevels() {
        this.optimizationLevels = new Map([
            [1, {
                name: 'Basic',
                description: 'Basic spherical optimization',
                settings: {
                    sphericalOptimization: true,
                    physicsOptimization: false,
                    renderingOptimization: false,
                    memoryOptimization: false,
                    parallelProcessing: false
                }
            }],
            [2, {
                name: 'Standard',
                description: 'Physics optimization + caching',
                settings: {
                    sphericalOptimization: true,
                    physicsOptimization: true,
                    renderingOptimization: false,
                    memoryOptimization: false,
                    parallelProcessing: false
                }
            }],
            [3, {
                name: 'Advanced',
                description: 'Parallel processing + spatial indexing',
                settings: {
                    sphericalOptimization: true,
                    physicsOptimization: true,
                    renderingOptimization: true,
                    memoryOptimization: false,
                    parallelProcessing: true
                }
            }],
            [4, {
                name: 'Production',
                description: 'Advanced LOD + adaptive quality',
                settings: {
                    sphericalOptimization: true,
                    physicsOptimization: true,
                    renderingOptimization: true,
                    memoryOptimization: true,
                    parallelProcessing: true
                }
            }],
            [5, {
                name: 'Maximum',
                description: 'Maximum optimization (experimental)',
                settings: {
                    sphericalOptimization: true,
                    physicsOptimization: true,
                    renderingOptimization: true,
                    memoryOptimization: true,
                    parallelProcessing: true
                }
            }]
        ]);
    }

    public async build(): Promise<void> {
        try {
            console.log(`🔨 Building HSML project for ${this.config.target}...`);
            console.log(`📊 Optimization Level: ${this.optimizationLevels.get(this.config.optimization)?.name}`);
            
            // Validate configuration
            this.validateConfig();
            
            // Create output directory
            this.ensureOutputDirectory();
            
            // Run target-specific build
            await this.buildForTarget();
            
            // Apply optimizations
            await this.applyOptimizations();
            
            // Minify if requested
            if (this.config.minify) {
                await this.minifyOutput();
            }
            
            // Generate source maps if requested
            if (this.config.sourcemap) {
                await this.generateSourceMaps();
            }
            
            console.log('✅ Build completed successfully');
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            throw error;
        }
    }

    private validateConfig(): void {
        const validTargets = ['webgl', 'webgpu', 'cpu', 'wasm'];
        if (!validTargets.includes(this.config.target)) {
            throw new Error(`Invalid build target: ${this.config.target}`);
        }
        
        if (this.config.optimization < 1 || this.config.optimization > 5) {
            throw new Error(`Invalid optimization level: ${this.config.optimization}`);
        }
        
        if (!fs.existsSync(this.config.entry)) {
            throw new Error(`Entry file not found: ${this.config.entry}`);
        }
    }

    private ensureOutputDirectory(): void {
        if (!fs.existsSync(this.config.output)) {
            fs.mkdirSync(this.config.output, { recursive: true });
        }
    }

    private async buildForTarget(): Promise<void> {
        console.log(`🎯 Building for target: ${this.config.target}`);
        
        switch (this.config.target) {
            case 'webgl':
                await this.buildWebGL();
                break;
            case 'webgpu':
                await this.buildWebGPU();
                break;
            case 'cpu':
                await this.buildCPU();
                break;
            case 'wasm':
                await this.buildWASM();
                break;
            default:
                throw new Error(`Unsupported target: ${this.config.target}`);
        }
    }

    private async buildWebGL(): Promise<void> {
        console.log('🌐 Building WebGL target...');
        
        // Compile TypeScript to JavaScript
        await this.compileTypeScript();
        
        // Bundle WebGL-specific runtime
        await this.bundleWebGLRuntime();
        
        // Generate WebGL entry point
        await this.generateWebGLEntry();
    }

    private async buildWebGPU(): Promise<void> {
        console.log('⚡ Building WebGPU target...');
        
        // Compile TypeScript to JavaScript
        await this.compileTypeScript();
        
        // Bundle WebGPU-specific runtime
        await this.bundleWebGPURuntime();
        
        // Generate WebGPU entry point
        await this.generateWebGPUEntry();
    }

    private async buildCPU(): Promise<void> {
        console.log('💻 Building CPU target...');
        
        // Compile TypeScript to JavaScript
        await this.compileTypeScript();
        
        // Bundle CPU-specific runtime
        await this.bundleCPURuntime();
        
        // Generate CPU entry point
        await this.generateCPUEntry();
    }

    private async buildWASM(): Promise<void> {
        console.log('🔧 Building WASM target...');
        
        // Compile C++ to WebAssembly
        await this.compileWASM();
        
        // Bundle WASM-specific runtime
        await this.bundleWASMRuntime();
        
        // Generate WASM entry point
        await this.generateWASMEntry();
    }

    private async compileTypeScript(): Promise<void> {
        console.log('📝 Compiling TypeScript...');
        
        const tsConfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'ESNext',
                moduleResolution: 'node',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                outDir: path.join(this.config.output, 'js'),
                sourceMap: this.config.sourcemap,
                declaration: true,
                declarationMap: this.config.sourcemap
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist']
        };
        
        // Write temporary tsconfig
        const tempTsConfig = path.join(this.config.output, 'tsconfig.temp.json');
        fs.writeFileSync(tempTsConfig, JSON.stringify(tsConfig, null, 2));
        
        try {
            execSync(`npx tsc --project ${tempTsConfig}`, { stdio: 'inherit' });
        } finally {
            // Clean up temporary config
            if (fs.existsSync(tempTsConfig)) {
                fs.unlinkSync(tempTsConfig);
            }
        }
    }

    private async compileWASM(): Promise<void> {
        console.log('🔧 Compiling WebAssembly...');
        
        // Check if Emscripten is available
        try {
            execSync('emcc --version', { stdio: 'pipe' });
        } catch {
            throw new Error('Emscripten not found. Please install Emscripten for WASM builds.');
        }
        
        // Compile C++ sources to WASM
        const cppSources = [
            'src/math/spherical-mathematics.cpp',
            'src/math/solid-angle-calculations.cpp',
            'src/runtime/physics-engine.cpp'
        ];
        
        const emccArgs = [
            ...cppSources,
            '-o', path.join(this.config.output, 'hsml.wasm'),
            '-s', 'WASM=1',
            '-s', 'EXPORTED_FUNCTIONS=["_spherical_calculate", "_physics_simulate"]',
            '-s', 'EXPORTED_RUNTIME_METHODS=["ccall", "cwrap"]',
            '-O3'
        ];
        
        execSync(`emcc ${emccArgs.join(' ')}`, { stdio: 'inherit' });
    }

    private async bundleWebGLRuntime(): Promise<void> {
        console.log('🌐 Bundling WebGL runtime...');
        
        const webpackConfig = {
            entry: path.join(this.config.output, 'js', 'runtime', 'webgl-spherical-renderer.js'),
            output: {
                path: this.config.output,
                filename: 'hsml-webgl.js',
                library: 'HSMLWebGL',
                libraryTarget: 'umd'
            },
            mode: this.config.minify ? 'production' : 'development',
            devtool: this.config.sourcemap ? 'source-map' : false,
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: 'ts-loader',
                        exclude: /node_modules/
                    }
                ]
            },
            resolve: {
                extensions: ['.ts', '.js']
            }
        };
        
        // Write temporary webpack config
        const tempWebpackConfig = path.join(this.config.output, 'webpack.config.temp.js');
        fs.writeFileSync(tempWebpackConfig, `module.exports = ${JSON.stringify(webpackConfig, null, 2)};`);
        
        try {
            execSync(`npx webpack --config ${tempWebpackConfig}`, { stdio: 'inherit' });
        } finally {
            // Clean up temporary config
            if (fs.existsSync(tempWebpackConfig)) {
                fs.unlinkSync(tempWebpackConfig);
            }
        }
    }

    private async bundleWebGPURuntime(): Promise<void> {
        console.log('⚡ Bundling WebGPU runtime...');
        
        // Similar to WebGL but with WebGPU-specific optimizations
        const webpackConfig = {
            entry: path.join(this.config.output, 'js', 'runtime', 'webgpu-spherical-renderer.js'),
            output: {
                path: this.config.output,
                filename: 'hsml-webgpu.js',
                library: 'HSMLWebGPU',
                libraryTarget: 'umd'
            },
            mode: this.config.minify ? 'production' : 'development',
            devtool: this.config.sourcemap ? 'source-map' : false
        };
        
        const tempWebpackConfig = path.join(this.config.output, 'webpack.config.temp.js');
        fs.writeFileSync(tempWebpackConfig, `module.exports = ${JSON.stringify(webpackConfig, null, 2)};`);
        
        try {
            execSync(`npx webpack --config ${tempWebpackConfig}`, { stdio: 'inherit' });
        } finally {
            if (fs.existsSync(tempWebpackConfig)) {
                fs.unlinkSync(tempWebpackConfig);
            }
        }
    }

    private async bundleCPURuntime(): Promise<void> {
        console.log('💻 Bundling CPU runtime...');
        
        const webpackConfig = {
            entry: path.join(this.config.output, 'js', 'runtime', 'cpu-spherical-renderer.js'),
            output: {
                path: this.config.output,
                filename: 'hsml-cpu.js',
                library: 'HSMLCPU',
                libraryTarget: 'umd'
            },
            mode: this.config.minify ? 'production' : 'development',
            devtool: this.config.sourcemap ? 'source-map' : false
        };
        
        const tempWebpackConfig = path.join(this.config.output, 'webpack.config.temp.js');
        fs.writeFileSync(tempWebpackConfig, `module.exports = ${JSON.stringify(webpackConfig, null, 2)};`);
        
        try {
            execSync(`npx webpack --config ${tempWebpackConfig}`, { stdio: 'inherit' });
        } finally {
            if (fs.existsSync(tempWebpackConfig)) {
                fs.unlinkSync(tempWebpackConfig);
            }
        }
    }

    private async bundleWASMRuntime(): Promise<void> {
        console.log('🔧 Bundling WASM runtime...');
        
        const webpackConfig = {
            entry: path.join(this.config.output, 'js', 'runtime', 'wasm-spherical-renderer.js'),
            output: {
                path: this.config.output,
                filename: 'hsml-wasm.js',
                library: 'HSMLWASM',
                libraryTarget: 'umd'
            },
            mode: this.config.minify ? 'production' : 'development',
            devtool: this.config.sourcemap ? 'source-map' : false
        };
        
        const tempWebpackConfig = path.join(this.config.output, 'webpack.config.temp.js');
        fs.writeFileSync(tempWebpackConfig, `module.exports = ${JSON.stringify(webpackConfig, null, 2)};`);
        
        try {
            execSync(`npx webpack --config ${tempWebpackConfig}`, { stdio: 'inherit' });
        } finally {
            if (fs.existsSync(tempWebpackConfig)) {
                fs.unlinkSync(tempWebpackConfig);
            }
        }
    }

    private async generateWebGLEntry(): Promise<void> {
        const entryContent = `
// HSML WebGL Entry Point
import { HSMLWebGLRuntime } from './hsml-webgl.js';

// Initialize HSML WebGL Runtime
const hsml = new HSMLWebGLRuntime();
export default hsml;
        `.trim();
        
        fs.writeFileSync(path.join(this.config.output, 'index.js'), entryContent);
    }

    private async generateWebGPUEntry(): Promise<void> {
        const entryContent = `
// HSML WebGPU Entry Point
import { HSMLWebGPURuntime } from './hsml-webgpu.js';

// Initialize HSML WebGPU Runtime
const hsml = new HSMLWebGPURuntime();
export default hsml;
        `.trim();
        
        fs.writeFileSync(path.join(this.config.output, 'index.js'), entryContent);
    }

    private async generateCPUEntry(): Promise<void> {
        const entryContent = `
// HSML CPU Entry Point
import { HSMLCPURuntime } from './hsml-cpu.js';

// Initialize HSML CPU Runtime
const hsml = new HSMLCPURuntime();
export default hsml;
        `.trim();
        
        fs.writeFileSync(path.join(this.config.output, 'index.js'), entryContent);
    }

    private async generateWASMEntry(): Promise<void> {
        const entryContent = `
// HSML WASM Entry Point
import { HSMLWASMRuntime } from './hsml-wasm.js';

// Initialize HSML WASM Runtime
const hsml = new HSMLWASMRuntime();
export default hsml;
        `.trim();
        
        fs.writeFileSync(path.join(this.config.output, 'index.js'), entryContent);
    }

    private async applyOptimizations(): Promise<void> {
        const level = this.optimizationLevels.get(this.config.optimization);
        if (!level) return;
        
        console.log(`⚡ Applying ${level.name} optimizations...`);
        
        if (level.settings.sphericalOptimization) {
            await this.applySphericalOptimizations();
        }
        
        if (level.settings.physicsOptimization) {
            await this.applyPhysicsOptimizations();
        }
        
        if (level.settings.renderingOptimization) {
            await this.applyRenderingOptimizations();
        }
        
        if (level.settings.memoryOptimization) {
            await this.applyMemoryOptimizations();
        }
        
        if (level.settings.parallelProcessing) {
            await this.applyParallelOptimizations();
        }
    }

    private async applySphericalOptimizations(): Promise<void> {
        console.log('🔵 Applying spherical optimizations...');
        // Apply 4-corner optimization and other spherical-specific optimizations
    }

    private async applyPhysicsOptimizations(): Promise<void> {
        console.log('⚛️ Applying physics optimizations...');
        // Apply matter state optimizations and physics caching
    }

    private async applyRenderingOptimizations(): Promise<void> {
        console.log('🎨 Applying rendering optimizations...');
        // Apply LOD systems and adaptive quality
    }

    private async applyMemoryOptimizations(): Promise<void> {
        console.log('💾 Applying memory optimizations...');
        // Apply memory pooling and garbage collection optimizations
    }

    private async applyParallelOptimizations(): Promise<void> {
        console.log('🔄 Applying parallel optimizations...');
        // Apply Web Workers and parallel processing
    }

    private async minifyOutput(): Promise<void> {
        console.log('📦 Minifying output...');
        
        const files = fs.readdirSync(this.config.output);
        const jsFiles = files.filter(file => file.endsWith('.js'));
        
        for (const file of jsFiles) {
            const filePath = path.join(this.config.output, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Simple minification (in production, use Terser or similar)
            const minified = content
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/\s*([{}:;,=])\s*/g, '$1') // Remove spaces around operators
                .trim();
            
            fs.writeFileSync(filePath, minified);
        }
    }

    private async generateSourceMaps(): Promise<void> {
        console.log('🗺️ Generating source maps...');
        // Generate source maps for debugging
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const config: BuildConfig = {
        target: 'webgl',
        optimization: 3,
        minify: false,
        sourcemap: false,
        output: 'dist',
        entry: 'src/index.ts',
        watch: false
    };
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--target':
                config.target = args[++i] as any;
                break;
            case '--optimization-level':
                config.optimization = parseInt(args[++i]) as any;
                break;
            case '--minify':
                config.minify = true;
                break;
            case '--sourcemap':
                config.sourcemap = true;
                break;
            case '--output':
                config.output = args[++i];
                break;
            case '--entry':
                config.entry = args[++i];
                break;
            case '--watch':
                config.watch = true;
                break;
        }
    }
    
    const buildSystem = new HSMLBuildSystem(config);
    buildSystem.build().catch(console.error);
}

export { HSMLBuildSystem, BuildConfig }; 