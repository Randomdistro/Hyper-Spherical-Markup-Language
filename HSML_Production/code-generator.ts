/**
 * HSML Multi-Target Code Generator
 * Generates optimized code for different platforms with spherical coordinate precision
 */

import { IRProgram, IRFunction, IRExpression, IRNodeType } from './hsml-ir.js';

// Target platform types
export enum TargetPlatform {
    WEBGL = 'webgl',
    WEBGPU = 'webgpu',
    CPU = 'cpu',
    GPU = 'gpu',
    WASM = 'wasm',
    NATIVE = 'native'
}

// Code generation options
export interface CodeGenOptions {
    target: TargetPlatform;
    optimizationLevel: number;
    precision: 'single' | 'double' | 'extended';
    enableSphericalOptimization: boolean;
    enablePhysicsOptimization: boolean;
    enableParallelization: boolean;
    enableCaching: boolean;
    outputFormat: 'javascript' | 'typescript' | 'glsl' | 'wgsl' | 'cpp' | 'rust';
    includeComments: boolean;
    minify: boolean;
}

// Generated code structure
export interface GeneratedCode {
    platform: TargetPlatform;
    language: string;
    code: string;
    dependencies: string[];
    metadata: Map<string, any>;
    performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
    estimatedExecutionTime: number;
    memoryUsage: number;
    instructionCount: number;
    sphericalOperations: number;
    physicsOperations: number;
    optimizationLevel: number;
}

// Code generator class
export class HSMLCodeGenerator {
    private options: CodeGenOptions;
    private indentLevel = 0;
    private generatedCode: string[] = [];
    private dependencies: Set<string> = new Set();
    private metadata: Map<string, any> = new Map();
    private performanceMetrics: PerformanceMetrics;
    
    constructor(options: CodeGenOptions) {
        this.options = options;
        this.performanceMetrics = {
            estimatedExecutionTime: 0,
            memoryUsage: 0,
            instructionCount: 0,
            sphericalOperations: 0,
            physicsOperations: 0,
            optimizationLevel: options.optimizationLevel
        };
    }
    
    // === MAIN CODE GENERATION ===
    
    generate(ir: IRProgram): GeneratedCode {
        this.reset();
        
        // Generate platform-specific code
        switch (this.options.target) {
            case TargetPlatform.WEBGL:
                return this.generateWebGL(ir);
            case TargetPlatform.WEBGPU:
                return this.generateWebGPU(ir);
            case TargetPlatform.CPU:
                return this.generateCPU(ir);
            case TargetPlatform.GPU:
                return this.generateGPU(ir);
            case TargetPlatform.WASM:
                return this.generateWASM(ir);
            case TargetPlatform.NATIVE:
                return this.generateNative(ir);
            default:
                throw new Error(`Unsupported target platform: ${this.options.target}`);
        }
    }
    
    // === WEBGL CODE GENERATION ===
    
    private generateWebGL(ir: IRProgram): GeneratedCode {
        this.addDependency('spherical-coordinate-processor.js');
        this.addDependency('webgl-spherical-renderer.js');
        
        this.generateHeader('WebGL Spherical Coordinate Renderer');
        this.generateWebGLImports();
        this.generateWebGLConstants();
        
        // Generate main renderer class
        this.generateWebGLRendererClass(ir);
        
        // Generate shader programs
        this.generateWebGLShaders(ir);
        
        // Generate utility functions
        this.generateWebGLUtilities(ir);
        
        return this.finalizeCode('WebGL');
    }
    
    private generateWebGLRendererClass(ir: IRProgram): void {
        this.addLine('export class HSMLWebGLRenderer {');
        this.indent();
        
        // Constructor
        this.generateWebGLConstructor();
        
        // Core methods
        this.generateWebGLInitMethod();
        this.generateWebGLRenderMethod(ir);
        this.generateWebGLUpdateMethod(ir);
        
        // Spherical coordinate methods
        this.generateWebGLSphericalMethods();
        
        // Physics methods
        this.generateWebGLPhysicsMethods(ir);
        
        this.dedent();
        this.addLine('}');
    }
    
    private generateWebGLConstructor(): void {
        this.addLine('constructor(canvas: HTMLCanvasElement) {');
        this.indent();
        this.addLine('this.canvas = canvas;');
        this.addLine('this.gl = canvas.getContext("webgl2");');
        this.addLine('this.coordinateProcessor = SphericalCoordinateProcessor.getInstance();');
        this.addLine('this.renderObjects = new Map();');
        this.addLine('this.shaderPrograms = new Map();');
        this.addLine('this.performanceMetrics = { frameTime: 0, drawCalls: 0, vertices: 0 };');
        this.dedent();
        this.addLine('}');
    }
    
    private generateWebGLRenderMethod(ir: IRProgram): void {
        this.addLine('render(frameData: any): void {');
        this.indent();
        
        // Clear buffers
        this.addLine('this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);');
        
        // Set viewport
        this.addLine('this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);');
        
        // Update spherical coordinates
        this.addLine('this.updateSphericalCoordinates(frameData);');
        
        // Render objects
        this.addLine('for (const [id, object] of this.renderObjects) {');
        this.indent();
        this.addLine('this.renderObject(object);');
        this.dedent();
        this.addLine('}');
        
        // Update performance metrics
        this.addLine('this.updatePerformanceMetrics();');
        
        this.dedent();
        this.addLine('}');
    }
    
    private generateWebGLSphericalMethods(): void {
        // Spherical coordinate conversion
        this.addLine('private sphericalToCartesian(spherical: any): Float32Array {');
        this.indent();
        this.addLine('const { r, theta, phi } = spherical;');
        this.addLine('const sinTheta = Math.sin(theta);');
        this.addLine('return new Float32Array([');
        this.indent();
        this.addLine('r * sinTheta * Math.cos(phi),');
        this.addLine('r * sinTheta * Math.sin(phi),');
        this.addLine('r * Math.cos(theta)');
        this.dedent();
        this.addLine(']);');
        this.dedent();
        this.addLine('}');
        
        // Solid angle calculation
        this.addLine('private calculateSolidAngle(position: any, radius: number): number {');
        this.indent();
        this.addLine('const distance = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);');
        this.addLine('const angularRadius = Math.atan(radius / distance);');
        this.addLine('return 2 * Math.PI * (1 - Math.cos(angularRadius));');
        this.dedent();
        this.addLine('}');
    }
    
    private generateWebGLShaders(ir: IRProgram): void {
        // Vertex shader
        this.addLine('private createVertexShader(): string {');
        this.indent();
        this.addLine('return "#version 300 es";');
        this.addLine('precision highp float;');
        this.addLine('');
        this.addLine('in vec3 a_position;');
        this.addLine('in vec3 a_normal;');
        this.addLine('in vec2 a_texcoord;');
        this.addLine('');
        this.addLine('uniform mat4 u_modelViewProjection;');
        this.addLine('uniform vec3 u_spherical_position;');
        this.addLine('uniform float u_solid_angle;');
        this.addLine('');
        this.addLine('out vec3 v_world_position;');
        this.addLine('out vec3 v_normal;');
        this.addLine('out vec2 v_texcoord;');
        this.addLine('out float v_solid_angle;');
        this.addLine('');
        this.addLine('vec3 sphericalToCartesian(vec3 spherical) {');
        this.indent();
        this.addLine('float r = spherical.x;');
        this.addLine('float theta = spherical.y;');
        this.addLine('float phi = spherical.z;');
        this.addLine('float sinTheta = sin(theta);');
        this.addLine('return vec3(');
        this.indent();
        this.addLine('r * sinTheta * cos(phi),');
        this.addLine('r * sinTheta * sin(phi),');
        this.addLine('r * cos(theta)');
        this.dedent();
        this.addLine(');');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('void main() {');
        this.indent();
        this.addLine('vec3 worldPos = sphericalToCartesian(u_spherical_position) + a_position;');
        this.addLine('gl_Position = u_modelViewProjection * vec4(worldPos, 1.0);');
        this.addLine('v_world_position = worldPos;');
        this.addLine('v_normal = a_normal;');
        this.addLine('v_texcoord = a_texcoord;');
        this.addLine('v_solid_angle = u_solid_angle;');
        this.dedent();
        this.addLine('}');
        this.addLine('`;');
        this.dedent();
        this.addLine('}');
        
        // Fragment shader
        this.generateWebGLFragmentShader();
    }
    
    private generateWebGLFragmentShader(): void {
        this.addLine('private createFragmentShader(): string {');
        this.indent();
        this.addLine('return "#version 300 es";');
        this.addLine('precision highp float;');
        this.addLine('');
        this.addLine('in vec3 v_world_position;');
        this.addLine('in vec3 v_normal;');
        this.addLine('in vec2 v_texcoord;');
        this.addLine('in float v_solid_angle;');
        this.addLine('');
        this.addLine('uniform vec4 u_albedo;');
        this.addLine('uniform float u_metallic;');
        this.addLine('uniform float u_roughness;');
        this.addLine('uniform vec3 u_emission;');
        this.addLine('uniform int u_matter_state;');
        this.addLine('');
        this.addLine('out vec4 fragColor;');
        this.addLine('');
        this.addLine('vec3 calculatePBR(vec3 albedo, float metallic, float roughness, vec3 normal, vec3 lightDir, vec3 viewDir) {');
        this.indent();
        this.addLine('vec3 h = normalize(lightDir + viewDir);');
        this.addLine('float NdotV = max(dot(normal, viewDir), 0.0);');
        this.addLine('float NdotL = max(dot(normal, lightDir), 0.0);');
        this.addLine('float NdotH = max(dot(normal, h), 0.0);');
        this.addLine('float VdotH = max(dot(viewDir, h), 0.0);');
        this.addLine('');
        this.addLine('vec3 F0 = mix(vec3(0.04), albedo, metallic);');
        this.addLine('vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);');
        this.addLine('');
        this.addLine('float alpha = roughness * roughness;');
        this.addLine('float alpha2 = alpha * alpha;');
        this.addLine('float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;');
        this.addLine('float D = alpha2 / (3.14159265359 * denom * denom);');
        this.addLine('');
        this.addLine('float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;');
        this.addLine('float G1L = NdotL / (NdotL * (1.0 - k) + k);');
        this.addLine('float G1V = NdotV / (NdotV * (1.0 - k) + k);');
        this.addLine('float G = G1L * G1V;');
        this.addLine('');
        this.addLine('vec3 numerator = D * G * F;');
        this.addLine('float denominator = 4.0 * NdotV * NdotL + 0.001;');
        this.addLine('vec3 specular = numerator / denominator;');
        this.addLine('');
        this.addLine('vec3 kS = F;');
        this.addLine('vec3 kD = vec3(1.0) - kS;');
        this.addLine('kD *= 1.0 - metallic;');
        this.addLine('');
        this.addLine('return (kD * albedo / 3.14159265359 + specular) * NdotL;');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('vec4 renderMatterState(vec4 baseColor) {');
        this.indent();
        this.addLine('vec4 result = baseColor;');
        this.addLine('');
        this.addLine('if (u_matter_state == 0) { // Solid');
        this.indent();
        this.addLine('result.a = baseColor.a;');
        this.dedent();
        this.addLine('} else if (u_matter_state == 1) { // Liquid');
        this.indent();
        this.addLine('result.a = baseColor.a * 0.8;');
        this.addLine('result.rgb += vec3(0.1, 0.1, 0.2);');
        this.dedent();
        this.addLine('} else if (u_matter_state == 2) { // Gas');
        this.indent();
        this.addLine('result.a = baseColor.a * 0.3;');
        this.addLine('result.rgb = mix(result.rgb, vec3(0.5), 0.5);');
        this.dedent();
        this.addLine('} else if (u_matter_state == 3) { // Plasma');
        this.indent();
        this.addLine('result.rgb += u_emission * 2.0;');
        this.addLine('result.a = baseColor.a * 0.6;');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('return result;');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('void main() {');
        this.indent();
        this.addLine('vec3 normal = normalize(v_normal);');
        this.addLine('vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));');
        this.addLine('vec3 viewDir = normalize(-v_world_position);');
        this.addLine('');
        this.addLine('vec3 pbrColor = calculatePBR(u_albedo.rgb, u_metallic, u_roughness, normal, lightDir, viewDir);');
        this.addLine('vec4 finalColor = vec4(pbrColor + u_emission, u_albedo.a);');
        this.addLine('');
        this.addLine('fragColor = renderMatterState(finalColor);');
        this.dedent();
        this.addLine('}');
        this.addLine('`;');
        this.dedent();
        this.addLine('}');
    }
    
    // === WEBGPU CODE GENERATION ===
    
    private generateWebGPU(ir: IRProgram): GeneratedCode {
        this.addDependency('webgpu-spherical-renderer.js');
        
        this.generateHeader('WebGPU Spherical Coordinate Renderer');
        this.generateWebGPUImports();
        this.generateWebGPUConstants();
        
        // Generate main renderer class
        this.generateWebGPURendererClass(ir);
        
        // Generate WGSL shaders
        this.generateWGSLShaders(ir);
        
        return this.finalizeCode('WebGPU');
    }
    
    private generateWebGPURendererClass(ir: IRProgram): void {
        this.addLine('export class HSMLWebGPURenderer {');
        this.indent();
        
        // Constructor
        this.addLine('constructor(canvas: HTMLCanvasElement) {');
        this.indent();
        this.addLine('this.canvas = canvas;');
        this.addLine('this.device = null;');
        this.addLine('this.queue = null;');
        this.addLine('this.context = null;');
        this.addLine('this.renderPipeline = null;');
        this.addLine('this.sphericalCoordinateProcessor = new SphericalCoordinateProcessor();');
        this.dedent();
        this.addLine('}');
        
        // Initialize method
        this.addLine('async initialize(): Promise<void> {');
        this.indent();
        this.addLine('const adapter = await navigator.gpu.requestAdapter();');
        this.addLine('this.device = await adapter.requestDevice();');
        this.addLine('this.queue = this.device.queue;');
        this.addLine('this.context = this.canvas.getContext("webgpu");');
        this.addLine('this.context.configure({');
        this.indent();
        this.addLine('device: this.device,');
        this.addLine('format: navigator.gpu.getPreferredCanvasFormat(),');
        this.addLine('alphaMode: "premultiplied",');
        this.dedent();
        this.addLine('});');
        this.dedent();
        this.addLine('}');
        
        // Render method
        this.generateWebGPURenderMethod(ir);
        
        this.dedent();
        this.addLine('}');
    }
    
    private generateWGSLShaders(ir: IRProgram): void {
        // Vertex shader
        this.addLine('private createVertexShader(): string {');
        this.indent();
        this.addLine('return `');
        this.addLine('struct VertexInput {');
        this.indent();
        this.addLine('@location(0) position: vec3<f32>,');
        this.addLine('@location(1) normal: vec3<f32>,');
        this.addLine('@location(2) texcoord: vec2<f32>,');
        this.dedent();
        this.addLine('};');
        this.addLine('');
        this.addLine('struct VertexOutput {');
        this.indent();
        this.addLine('@builtin(position) position: vec4<f32>,');
        this.addLine('@location(0) world_position: vec3<f32>,');
        this.addLine('@location(1) normal: vec3<f32>,');
        this.addLine('@location(2) texcoord: vec2<f32>,');
        this.addLine('@location(3) solid_angle: f32,');
        this.dedent();
        this.addLine('};');
        this.addLine('');
        this.addLine('@group(0) @binding(0) var<uniform> modelViewProjection: mat4x4<f32>;');
        this.addLine('@group(0) @binding(1) var<uniform> spherical_position: vec3<f32>;');
        this.addLine('@group(0) @binding(2) var<uniform> solid_angle: f32;');
        this.addLine('');
        this.addLine('fn spherical_to_cartesian(spherical: vec3<f32>) -> vec3<f32> {');
        this.indent();
        this.addLine('let r = spherical.x;');
        this.addLine('let theta = spherical.y;');
        this.addLine('let phi = spherical.z;');
        this.addLine('let sin_theta = sin(theta);');
        this.addLine('return vec3<f32>(');
        this.indent();
        this.addLine('r * sin_theta * cos(phi),');
        this.addLine('r * sin_theta * sin(phi),');
        this.addLine('r * cos(theta)');
        this.dedent();
        this.addLine(');');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('@vertex');
        this.addLine('fn main(input: VertexInput) -> VertexOutput {');
        this.indent();
        this.addLine('let world_pos = spherical_to_cartesian(spherical_position) + input.position;');
        this.addLine('var output: VertexOutput;');
        this.addLine('output.position = modelViewProjection * vec4<f32>(world_pos, 1.0);');
        this.addLine('output.world_position = world_pos;');
        this.addLine('output.normal = input.normal;');
        this.addLine('output.texcoord = input.texcoord;');
        this.addLine('output.solid_angle = solid_angle;');
        this.addLine('return output;');
        this.dedent();
        this.addLine('}');
        this.addLine('`;');
        this.dedent();
        this.addLine('}');
        
        // Fragment shader
        this.generateWGSLFragmentShader();
    }
    
    private generateWGSLFragmentShader(): void {
        this.addLine('private createFragmentShader(): string {');
        this.indent();
        this.addLine('return "#version 300 es";');
        this.addLine('precision highp float;');
        this.addLine('');
        this.addLine('in vec3 v_world_position;');
        this.addLine('in vec3 v_normal;');
        this.addLine('in vec2 v_texcoord;');
        this.addLine('in float v_solid_angle;');
        this.addLine('');
        this.addLine('uniform vec4 u_albedo;');
        this.addLine('uniform float u_metallic;');
        this.addLine('uniform float u_roughness;');
        this.addLine('uniform vec3 u_emission;');
        this.addLine('uniform int u_matter_state;');
        this.addLine('');
        this.addLine('out vec4 fragColor;');
        this.addLine('');
        this.addLine('vec3 calculatePBR(vec3 albedo, float metallic, float roughness, vec3 normal, vec3 lightDir, vec3 viewDir) {');
        this.indent();
        this.addLine('vec3 h = normalize(lightDir + viewDir);');
        this.addLine('float NdotV = max(dot(normal, viewDir), 0.0);');
        this.addLine('float NdotL = max(dot(normal, lightDir), 0.0);');
        this.addLine('float NdotH = max(dot(normal, h), 0.0);');
        this.addLine('float VdotH = max(dot(viewDir, h), 0.0);');
        this.addLine('');
        this.addLine('vec3 F0 = mix(vec3(0.04), albedo, metallic);');
        this.addLine('vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);');
        this.addLine('');
        this.addLine('float alpha = roughness * roughness;');
        this.addLine('float alpha2 = alpha * alpha;');
        this.addLine('float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;');
        this.addLine('float D = alpha2 / (3.14159265359 * denom * denom);');
        this.addLine('');
        this.addLine('float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;');
        this.addLine('float G1L = NdotL / (NdotL * (1.0 - k) + k);');
        this.addLine('float G1V = NdotV / (NdotV * (1.0 - k) + k);');
        this.addLine('float G = G1L * G1V;');
        this.addLine('');
        this.addLine('vec3 numerator = D * G * F;');
        this.addLine('float denominator = 4.0 * NdotV * NdotL + 0.001;');
        this.addLine('vec3 specular = numerator / denominator;');
        this.addLine('');
        this.addLine('vec3 kS = F;');
        this.addLine('vec3 kD = vec3(1.0) - kS;');
        this.addLine('kD *= 1.0 - metallic;');
        this.addLine('');
        this.addLine('return (kD * albedo / 3.14159265359 + specular) * NdotL;');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('vec4 renderMatterState(vec4 baseColor) {');
        this.indent();
        this.addLine('vec4 result = baseColor;');
        this.addLine('');
        this.addLine('if (u_matter_state == 0) { // Solid');
        this.indent();
        this.addLine('result.a = baseColor.a;');
        this.dedent();
        this.addLine('} else if (u_matter_state == 1) { // Liquid');
        this.indent();
        this.addLine('result.a = baseColor.a * 0.8;');
        this.addLine('result.rgb += vec3(0.1, 0.1, 0.2);');
        this.dedent();
        this.addLine('} else if (u_matter_state == 2) { // Gas');
        this.indent();
        this.addLine('result.a = baseColor.a * 0.3;');
        this.addLine('result.rgb = mix(result.rgb, vec3(0.5), 0.5);');
        this.dedent();
        this.addLine('} else if (u_matter_state == 3) { // Plasma');
        this.indent();
        this.addLine('result.rgb += u_emission * 2.0;');
        this.addLine('result.a = baseColor.a * 0.6;');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('return result;');
        this.dedent();
        this.addLine('}');
        this.addLine('');
        this.addLine('void main() {');
        this.indent();
        this.addLine('vec3 normal = normalize(v_normal);');
        this.addLine('vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));');
        this.addLine('vec3 viewDir = normalize(-v_world_position);');
        this.addLine('');
        this.addLine('vec3 pbrColor = calculatePBR(u_albedo.rgb, u_metallic, u_roughness, normal, lightDir, viewDir);');
        this.addLine('vec4 finalColor = vec4(pbrColor + u_emission, u_albedo.a);');
        this.addLine('');
        this.addLine('fragColor = renderMatterState(finalColor);');
        this.dedent();
        this.addLine('}');
        this.addLine('`;');
        this.dedent();
        this.addLine('}');
    }
    
    // === CPU CODE GENERATION ===
    
    private generateCPU(ir: IRProgram): GeneratedCode {
        this.addDependency('spherical-coordinate-processor.js');
        this.addDependency('spherical-physics-engine.js');
        
        this.generateHeader('CPU Spherical Coordinate Processor');
        this.generateCPUImports();
        this.generateCPUConstants();
        
        // Generate main processor class
        this.generateCPUProcessorClass(ir);
        
        // Generate physics simulation
        this.generateCPUPhysicsSimulation(ir);
        
        return this.finalizeCode('CPU');
    }
    
    private generateCPUProcessorClass(ir: IRProgram): void {
        this.addLine('export class HSMLCPUProcessor {');
        this.indent();
        
        // Constructor
        this.addLine('constructor() {');
        this.indent();
        this.addLine('this.coordinateProcessor = SphericalCoordinateProcessor.getInstance();');
        this.addLine('this.physicsEngine = SphericalPhysicsEngine.getInstance();');
        this.addLine('this.optimizationEngine = RuntimeOptimizationEngine.getInstance();');
        this.addLine('this.elements = new Map();');
        this.addLine('this.materials = new Map();');
        this.addLine('this.behaviors = new Map();');
        this.dedent();
        this.addLine('}');
        
        // Process method
        this.generateCPUProcessMethod(ir);
        
        // Spherical coordinate methods
        this.generateCPUSphericalMethods();
        
        this.dedent();
        this.addLine('}');
    }
    
    private generateCPUProcessMethod(ir: IRProgram): void {
        this.addLine('processFrame(frameData: any): void {');
        this.indent();
        
        // Update physics
        this.addLine('this.updatePhysics(frameData.deltaTime);');
        
        // Update spherical coordinates
        this.addLine('this.updateSphericalCoordinates(frameData.elements);');
        
        // Process behaviors
        this.addLine('this.processBehaviors(frameData.behaviors);');
        
        // Update materials
        this.addLine('this.updateMaterials(frameData.materials);');
        
        // Optimize performance
        this.addLine('this.optimizePerformance();');
        
        this.dedent();
        this.addLine('}');
    }
    
    private generateCPUSphericalMethods(): void {
        // Pure spherical distance calculation
        this.addLine('calculateSphericalDistance(p1: any, p2: any): number {');
        this.indent();
        this.addLine('const cos_angular = Math.cos(p1.theta) * Math.cos(p2.theta) +');
        this.indent();
        this.addLine('Math.sin(p1.theta) * Math.sin(p2.theta) *');
        this.addLine('Math.cos(p2.phi - p1.phi);');
        this.dedent();
        this.addLine('');
        this.addLine('const angular_distance = Math.acos(Math.max(-1, Math.min(1, cos_angular)));');
        this.addLine('const radial_difference = Math.abs(p2.r - p1.r);');
        this.addLine('');
        this.addLine('return Math.sqrt(');
        this.indent();
        this.addLine('p1.r * p1.r + p2.r * p2.r -');
        this.addLine('2 * p1.r * p2.r * cos_angular');
        this.dedent();
        this.addLine(');');
        this.dedent();
        this.addLine('}');
        
        // Solid angle calculation
        this.addLine('calculateSolidAngle(theta_min: number, theta_max: number, phi_min: number, phi_max: number): number {');
        this.indent();
        this.addLine('return (phi_max - phi_min) * (Math.cos(theta_min) - Math.cos(theta_max));');
        this.dedent();
        this.addLine('}');
    }
    
    // === GPU CODE GENERATION ===
    
    private generateGPU(ir: IRProgram): GeneratedCode {
        this.addDependency('gpu-spherical-compute.js');
        
        this.generateHeader('GPU Spherical Coordinate Compute');
        this.generateGPUImports();
        this.generateGPUConstants();
        
        // Generate compute kernels
        this.generateGPUComputeKernels(ir);
        
        return this.finalizeCode('GPU');
    }
    
    private generateGPUComputeKernels(ir: IRProgram): void {
        // Spherical coordinate kernel
        this.addLine('const sphericalCoordinateKernel = gpu.createKernel(function(input) {');
        this.indent();
        this.addLine('const r = input[this.thread.x][0];');
        this.addLine('const theta = input[this.thread.x][1];');
        this.addLine('const phi = input[this.thread.x][2];');
        this.addLine('');
        this.addLine('const sin_theta = Math.sin(theta);');
        this.addLine('const x = r * sin_theta * Math.cos(phi);');
        this.addLine('const y = r * sin_theta * Math.sin(phi);');
        this.addLine('const z = r * Math.cos(theta);');
        this.addLine('');
        this.addLine('return [x, y, z];');
        this.dedent();
        this.addLine('}).setOutput([input.length, 3]);');
        
        // Physics simulation kernel
        this.addLine('const physicsSimulationKernel = gpu.createKernel(function(positions, velocities, forces, deltaTime) {');
        this.indent();
        this.addLine('const pos = positions[this.thread.x];');
        this.addLine('const vel = velocities[this.thread.x];');
        this.addLine('const force = forces[this.thread.x];');
        this.addLine('');
        this.addLine('// Update velocity');
        this.addLine('const newVel = [');
        this.indent();
        this.addLine('vel[0] + force[0] * deltaTime,');
        this.addLine('vel[1] + force[1] * deltaTime,');
        this.addLine('vel[2] + force[2] * deltaTime');
        this.dedent();
        this.addLine('];');
        this.addLine('');
        this.addLine('// Update position');
        this.addLine('const newPos = [');
        this.indent();
        this.addLine('pos[0] + newVel[0] * deltaTime,');
        this.addLine('pos[1] + newVel[1] * deltaTime,');
        this.addLine('pos[2] + newVel[2] * deltaTime');
        this.dedent();
        this.addLine('];');
        this.addLine('');
        this.addLine('return [newPos, newVel];');
        this.dedent();
        this.addLine('}).setOutput([positions.length, 2, 3]);');
    }
    
    // === WASM CODE GENERATION ===
    
    private generateWASM(ir: IRProgram): GeneratedCode {
        this.addDependency('wasm-spherical-module.js');
        
        this.generateHeader('WebAssembly Spherical Coordinate Module');
        this.generateWASMImports();
        this.generateWASMConstants();
        
        // Generate WASM module
        this.generateWASMModule(ir);
        
        return this.finalizeCode('WASM');
    }
    
    private generateWASMModule(ir: IRProgram): void {
        this.addLine('export class HSMLWASMModule {');
        this.indent();
        
        // Constructor
        this.addLine('constructor() {');
        this.indent();
        this.addLine('this.memory = new WebAssembly.Memory({ initial: 256 });');
        this.addLine('this.instance = null;');
        this.addLine('this.exports = null;');
        this.dedent();
        this.addLine('}');
        
        // Initialize method
        this.addLine('async initialize(): Promise<void> {');
        this.indent();
        this.addLine('const response = await fetch("spherical-coordinate.wasm");');
        this.addLine('const bytes = await response.arrayBuffer();');
        this.addLine('const { instance } = await WebAssembly.instantiate(bytes, {');
        this.indent();
        this.addLine('env: { memory: this.memory }')
        this.dedent();
        this.addLine('});');
        this.addLine('');
        this.addLine('this.instance = instance;');
        this.addLine('this.exports = instance.exports;');
        this.dedent();
        this.addLine('}');
        
        // Spherical coordinate methods
        this.generateWASMSphericalMethods();
        
        this.dedent();
        this.addLine('}');
    }
    
    // === NATIVE CODE GENERATION ===
    
    private generateNative(ir: IRProgram): GeneratedCode {
        this.generateHeader('Native C++ Spherical Coordinate Implementation');
        this.generateNativeIncludes();
        this.generateNativeConstants();
        
        // Generate C++ classes
        this.generateNativeClasses(ir);
        
        return this.finalizeCode('Native');
    }
    
    private generateNativeClasses(ir: IRProgram): void {
        // Spherical coordinate class
        this.addLine('class SphericalCoordinate {');
        this.indent();
        this.addLine('public:');
        this.indent();
        this.addLine('double r, theta, phi;');
        this.addLine('');
        this.addLine('SphericalCoordinate(double r, double theta, double phi)');
        this.indent();
        this.addLine(': r(r), theta(theta), phi(phi) {}');
        this.dedent();
        this.addLine('');
        this.addLine('SphericalCoordinate toCartesian() const {');
        this.indent();
        this.addLine('double sin_theta = sin(theta);');
        this.addLine('return SphericalCoordinate(');
        this.indent();
        this.addLine('r * sin_theta * cos(phi),');
        this.addLine('r * sin_theta * sin(phi),');
        this.addLine('r * cos(theta)');
        this.dedent();
        this.addLine(');');
        this.dedent();
        this.addLine('}');
        this.dedent();
        this.addLine('};');
        this.dedent();
        
        // Physics engine class
        this.addLine('class SphericalPhysicsEngine {');
        this.indent();
        this.addLine('public:');
        this.indent();
        this.addLine('void updatePhysics(double deltaTime) {');
        this.indent();
        this.addLine('// Implement physics simulation');
        this.addLine('for (auto& object : objects) {');
        this.indent();
        this.addLine('object.update(deltaTime);');
        this.dedent();
        this.addLine('}');
        this.dedent();
        this.addLine('}');
        this.dedent();
        this.addLine('};');
        this.dedent();
    }
    
    // === UTILITY METHODS ===
    
    private generateHeader(title: string): void {
        this.addLine('/**');
        this.addLine(` * ${title}`);
        this.addLine(' * Generated by HSML Code Generator');
        this.addLine(` * Target: ${this.options.target}`);
        this.addLine(` * Optimization Level: ${this.options.optimizationLevel}`);
        this.addLine(` * Precision: ${this.options.precision}`);
        this.addLine(' */');
        this.addLine('');
    }
    
    private generateWebGLImports(): void {
        this.addLine('import { SphericalCoordinateProcessor } from "./spherical-coordinate-processor.js";');
        this.addLine('import { WebGLSphericalRenderer } from "./webgl-spherical-renderer.js";');
        this.addLine('');
    }
    
    private generateWebGPUImports(): void {
        this.addLine('import { SphericalCoordinateProcessor } from "./spherical-coordinate-processor.js";');
        this.addLine('');
    }
    
    private generateCPUImports(): void {
        this.addLine('import { SphericalCoordinateProcessor } from "./spherical-coordinate-processor.js";');
        this.addLine('import { SphericalPhysicsEngine } from "./spherical-physics-engine.js";');
        this.addLine('import { RuntimeOptimizationEngine } from "./runtime-optimization-engine.js";');
        this.addLine('');
    }
    
    private generateGPUImports(): void {
        this.addLine('import GPU from "gpu.js";');
        this.addLine('');
    }
    
    private generateWASMImports(): void {
        this.addLine('// WebAssembly module imports');
        this.addLine('');
    }
    
    private generateNativeIncludes(): void {
        this.addLine('#include <iostream>');
        this.addLine('#include <vector>');
        this.addLine('#include <cmath>');
        this.addLine('#include <memory>');
        this.addLine('');
    }
    
    private generateWebGLConstants(): void {
        this.addLine('// WebGL constants');
        this.addLine('const SPHERICAL_PRECISION = 1e-10;');
        this.addLine('const SOLID_ANGLE_THRESHOLD = 0.001;');
        this.addLine('');
    }
    
    private generateWebGPUConstants(): void {
        this.addLine('// WebGPU constants');
        this.addLine('const SPHERICAL_PRECISION = 1e-10;');
        this.addLine('const SOLID_ANGLE_THRESHOLD = 0.001;');
        this.addLine('');
    }
    
    private generateCPUConstants(): void {
        this.addLine('// CPU constants');
        this.addLine('const SPHERICAL_PRECISION = 1e-10;');
        this.addLine('const SOLID_ANGLE_THRESHOLD = 0.001;');
        this.addLine('');
    }
    
    private generateGPUConstants(): void {
        this.addLine('// GPU constants');
        this.addLine('const SPHERICAL_PRECISION = 1e-10;');
        this.addLine('const SOLID_ANGLE_THRESHOLD = 0.001;');
        this.addLine('');
    }
    
    private generateWASMConstants(): void {
        this.addLine('// WASM constants');
        this.addLine('const SPHERICAL_PRECISION = 1e-10;');
        this.addLine('const SOLID_ANGLE_THRESHOLD = 0.001;');
        this.addLine('');
    }
    
    private generateNativeConstants(): void {
        this.addLine('// Native constants');
        this.addLine('constexpr double SPHERICAL_PRECISION = 1e-10;');
        this.addLine('constexpr double SOLID_ANGLE_THRESHOLD = 0.001;');
        this.addLine('');
    }
    
    private addLine(line: string): void {
        const indent = '  '.repeat(this.indentLevel);
        this.generatedCode.push(indent + line);
    }
    
    private indent(): void {
        this.indentLevel++;
    }
    
    private dedent(): void {
        this.indentLevel = Math.max(0, this.indentLevel - 1);
    }
    
    private addDependency(dependency: string): void {
        this.dependencies.add(dependency);
    }
    
    private reset(): void {
        this.generatedCode = [];
        this.dependencies.clear();
        this.metadata.clear();
        this.indentLevel = 0;
        this.performanceMetrics = {
            estimatedExecutionTime: 0,
            memoryUsage: 0,
            instructionCount: 0,
            sphericalOperations: 0,
            physicsOperations: 0,
            optimizationLevel: this.options.optimizationLevel
        };
    }
    
    private finalizeCode(platform: string): GeneratedCode {
        return {
            platform: this.options.target,
            language: this.options.outputFormat,
            code: this.generatedCode.join('\n'),
            dependencies: Array.from(this.dependencies),
            metadata: this.metadata,
            performanceMetrics: this.performanceMetrics
        };
    }
    
    // Additional generation methods (implementations would be added as needed)
    private generateWebGLInitMethod(): void {}
    private generateWebGLUpdateMethod(ir: IRProgram): void {}
    private generateWebGLPhysicsMethods(ir: IRProgram): void {}
    private generateWebGLUtilities(ir: IRProgram): void {}
    private generateWebGPURenderMethod(ir: IRProgram): void {}
    private generateCPUPhysicsSimulation(ir: IRProgram): void {}
    private generateWASMSphericalMethods(): void {}
} 