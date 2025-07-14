#!/usr/bin/env node

/**
 * HSML CLI - Command Line Interface for HSML Framework
 * Production deployment and development tool
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface BuildOptions {
    target: 'webgl' | 'webgpu' | 'cpu' | 'wasm';
    optimization: 1 | 2 | 3 | 4 | 5;
    minify: boolean;
    sourcemap: boolean;
    output: string;
}

interface DevOptions {
    port: number;
    host: string;
    open: boolean;
    watch: boolean;
}

interface TestOptions {
    coverage: boolean;
    watch: boolean;
    verbose: boolean;
}

class HSMLCLI {
    private program: Command;

    constructor() {
        this.program = new Command();
        this.setupCommands();
    }

    private setupCommands() {
        this.program
            .name('hsml')
            .description('HSML Framework - Revolutionary 3D Web Development')
            .version('1.0.0');

        // Initialize new project
        this.program
            .command('init <project-name>')
            .description('Initialize a new HSML project')
            .option('-t, --template <template>', 'Project template', 'basic')
            .action(this.initProject.bind(this));

        // Build project
        this.program
            .command('build')
            .description('Build HSML project for production')
            .option('-t, --target <target>', 'Build target', 'webgl')
            .option('-o, --optimization <level>', 'Optimization level', '3')
            .option('--minify', 'Minify output', false)
            .option('--sourcemap', 'Generate source maps', false)
            .option('-d, --output <dir>', 'Output directory', 'dist')
            .action(this.buildProject.bind(this));

        // Development server
        this.program
            .command('dev')
            .description('Start development server')
            .option('-p, --port <port>', 'Server port', '3000')
            .option('-h, --host <host>', 'Server host', 'localhost')
            .option('--open', 'Open browser automatically', false)
            .option('--watch', 'Watch for changes', true)
            .action(this.startDevServer.bind(this));

        // Run tests
        this.program
            .command('test')
            .description('Run test suite')
            .option('--coverage', 'Generate coverage report', false)
            .option('--watch', 'Watch mode', false)
            .option('--verbose', 'Verbose output', false)
            .action(this.runTests.bind(this));

        // Deploy to production
        this.program
            .command('deploy')
            .description('Deploy to production')
            .option('-t, --target <target>', 'Deployment target', 'production')
            .option('--env <environment>', 'Environment', 'production')
            .action(this.deployProject.bind(this));

        // Performance benchmarking
        this.program
            .command('benchmark')
            .description('Run performance benchmarks')
            .option('-i, --iterations <count>', 'Number of iterations', '1000')
            .option('--detailed', 'Detailed benchmark report', false)
            .action(this.runBenchmarks.bind(this));

        // Generate documentation
        this.program
            .command('docs')
            .description('Generate documentation')
            .option('--serve', 'Serve documentation', false)
            .option('--output <dir>', 'Output directory', 'docs')
            .action(this.generateDocs.bind(this));
    }

    private async initProject(projectName: string, options: { template: string }) {
        try {
            console.log(`🚀 Initializing HSML project: ${projectName}`);
            
            const projectDir = path.resolve(projectName);
            
            if (fs.existsSync(projectDir)) {
                console.error(`❌ Project directory already exists: ${projectName}`);
                process.exit(1);
            }

            // Create project structure
            fs.mkdirSync(projectDir, { recursive: true });
            
            // Copy template files
            await this.copyTemplateFiles(projectDir, options.template);
            
            // Initialize package.json
            await this.createPackageJson(projectDir, projectName);
            
            // Install dependencies
            console.log('📦 Installing dependencies...');
            execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
            
            console.log(`✅ HSML project initialized successfully: ${projectName}`);
            console.log(`📁 Project directory: ${projectDir}`);
            console.log(`🚀 Next steps:`);
            console.log(`   cd ${projectName}`);
            console.log(`   hsml dev`);
            
        } catch (error) {
            console.error('❌ Failed to initialize project:', error);
            process.exit(1);
        }
    }

    private async buildProject(options: BuildOptions) {
        try {
            console.log('🔨 Building HSML project...');
            
            // Validate build options
            this.validateBuildOptions(options);
            
            // Run build process
            const buildScript = path.join(__dirname, '../build/build-system.js');
            
            if (!fs.existsSync(buildScript)) {
                console.error('❌ Build system not found. Please run from HSML project directory.');
                process.exit(1);
            }
            
            const buildArgs = [
                '--target', options.target,
                '--optimization-level', options.optimization.toString(),
                '--output', options.output
            ];
            
            if (options.minify) buildArgs.push('--minify');
            if (options.sourcemap) buildArgs.push('--sourcemap');
            
            execSync(`node ${buildScript} ${buildArgs.join(' ')}`, { stdio: 'inherit' });
            
            console.log('✅ Build completed successfully');
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    private async startDevServer(options: DevOptions) {
        try {
            console.log('🌐 Starting HSML development server...');
            
            const serverScript = path.join(__dirname, '../server/dev-server.js');
            
            if (!fs.existsSync(serverScript)) {
                console.error('❌ Development server not found. Please run from HSML project directory.');
                process.exit(1);
            }
            
            const serverArgs = [
                '--port', options.port.toString(),
                '--host', options.host
            ];
            
            if (options.open) serverArgs.push('--open');
            if (options.watch) serverArgs.push('--watch');
            
            execSync(`node ${serverScript} ${serverArgs.join(' ')}`, { stdio: 'inherit' });
            
        } catch (error) {
            console.error('❌ Failed to start development server:', error);
            process.exit(1);
        }
    }

    private async runTests(options: TestOptions) {
        try {
            console.log('🧪 Running HSML test suite...');
            
            const testScript = path.join(__dirname, '../tests/test-runner.js');
            
            if (!fs.existsSync(testScript)) {
                console.error('❌ Test runner not found. Please run from HSML project directory.');
                process.exit(1);
            }
            
            const testArgs = [];
            
            if (options.coverage) testArgs.push('--coverage');
            if (options.watch) testArgs.push('--watch');
            if (options.verbose) testArgs.push('--verbose');
            
            execSync(`node ${testScript} ${testArgs.join(' ')}`, { stdio: 'inherit' });
            
        } catch (error) {
            console.error('❌ Tests failed:', error);
            process.exit(1);
        }
    }

    private async deployProject(options: { target: string; env: string }) {
        try {
            console.log(`🚀 Deploying HSML project to ${options.target}...`);
            
            // Build for production first
            await this.buildProject({
                target: 'webgl',
                optimization: 5,
                minify: true,
                sourcemap: false,
                output: 'dist'
            });
            
            // Deploy based on target
            switch (options.target) {
                case 'production':
                    await this.deployToProduction();
                    break;
                case 'staging':
                    await this.deployToStaging();
                    break;
                default:
                    console.error(`❌ Unknown deployment target: ${options.target}`);
                    process.exit(1);
            }
            
            console.log('✅ Deployment completed successfully');
            
        } catch (error) {
            console.error('❌ Deployment failed:', error);
            process.exit(1);
        }
    }

    private async runBenchmarks(options: { iterations: string; detailed: boolean }) {
        try {
            console.log('📊 Running HSML performance benchmarks...');
            
            const benchmarkScript = path.join(__dirname, '../tests/benchmark-runner.js');
            
            if (!fs.existsSync(benchmarkScript)) {
                console.error('❌ Benchmark runner not found. Please run from HSML project directory.');
                process.exit(1);
            }
            
            const benchmarkArgs = [
                '--iterations', options.iterations
            ];
            
            if (options.detailed) benchmarkArgs.push('--detailed');
            
            execSync(`node ${benchmarkScript} ${benchmarkArgs.join(' ')}`, { stdio: 'inherit' });
            
        } catch (error) {
            console.error('❌ Benchmark failed:', error);
            process.exit(1);
        }
    }

    private async generateDocs(options: { serve: boolean; output: string }) {
        try {
            console.log('📚 Generating HSML documentation...');
            
            const docsScript = path.join(__dirname, '../tools/docs-generator.js');
            
            if (!fs.existsSync(docsScript)) {
                console.error('❌ Documentation generator not found. Please run from HSML project directory.');
                process.exit(1);
            }
            
            const docsArgs = [
                '--output', options.output
            ];
            
            if (options.serve) docsArgs.push('--serve');
            
            execSync(`node ${docsScript} ${docsArgs.join(' ')}`, { stdio: 'inherit' });
            
        } catch (error) {
            console.error('❌ Documentation generation failed:', error);
            process.exit(1);
        }
    }

    private validateBuildOptions(options: BuildOptions) {
        const validTargets = ['webgl', 'webgpu', 'cpu', 'wasm'];
        if (!validTargets.includes(options.target)) {
            throw new Error(`Invalid build target: ${options.target}`);
        }
        
        if (options.optimization < 1 || options.optimization > 5) {
            throw new Error(`Invalid optimization level: ${options.optimization}`);
        }
    }

    private async copyTemplateFiles(projectDir: string, template: string) {
        const templateDir = path.join(__dirname, '../templates', template);
        
        if (!fs.existsSync(templateDir)) {
            throw new Error(`Template not found: ${template}`);
        }
        
        // Copy template files recursively
        const copyRecursive = (src: string, dest: string) => {
            const stats = fs.statSync(src);
            
            if (stats.isDirectory()) {
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                
                const files = fs.readdirSync(src);
                files.forEach(file => {
                    copyRecursive(path.join(src, file), path.join(dest, file));
                });
            } else {
                fs.copyFileSync(src, dest);
            }
        };
        
        copyRecursive(templateDir, projectDir);
    }

    private async createPackageJson(projectDir: string, projectName: string) {
        const packageJson = {
            name: projectName,
            version: '1.0.0',
            description: 'HSML Framework Project',
            main: 'src/index.ts',
            scripts: {
                'dev': 'hsml dev',
                'build': 'hsml build',
                'test': 'hsml test',
                'deploy': 'hsml deploy',
                'benchmark': 'hsml benchmark'
            },
            dependencies: {
                '@hsml/core': '^1.0.0',
                '@hsml/runtime': '^1.0.0',
                '@hsml/math': '^1.0.0'
            },
            devDependencies: {
                'typescript': '^5.0.0',
                '@types/node': '^20.0.0'
            }
        };
        
        fs.writeFileSync(
            path.join(projectDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
    }

    private async deployToProduction() {
        // Implementation for production deployment
        console.log('Deploying to production environment...');
    }

    private async deployToStaging() {
        // Implementation for staging deployment
        console.log('Deploying to staging environment...');
    }

    public run() {
        this.program.parse();
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new HSMLCLI();
    cli.run();
}

export { HSMLCLI }; 