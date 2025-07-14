/**
 * HSML WebGL/WebGPU Spherical Renderer
 * High-performance GPU-accelerated spherical coordinate rendering
 */

import { 
    SphericalCoordinate, 
    SolidAngle,
    SphericalCoordinateProcessor 
} from './spherical-coordinate-processor.js';

// Rendering pipeline interfaces
export interface RenderTarget {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    devicePixelRatio: number;
}

export interface ViewingParameters {
    viewerDistance: number;        // Distance from monitor in mm
    monitorWidth: number;          // Physical monitor width in mm
    monitorHeight: number;         // Physical monitor height in mm
    fieldOfView: SolidAngle;       // Total solid angle coverage
}

export interface SphericalRenderObject {
    id: string;
    position: SphericalCoordinate;
    geometry: SphericalGeometry;
    material: SphericalMaterial;
    visible: boolean;
    lodLevel: number;
}

export interface SphericalGeometry {
    type: 'sphere' | 'spherical_shell' | 'point_cloud' | 'spherical_mesh';
    radius: number;
    detail_level: number;
    vertex_buffer?: WebGLBuffer;
    index_buffer?: WebGLBuffer;
    vertex_count: number;
}

export interface SphericalMaterial {
    albedo: [number, number, number, number];  // RGBA
    metallic: number;
    roughness: number;
    emission: [number, number, number];
    transparency: number;
    refraction_index: number;
    matter_state: 'solid' | 'liquid' | 'gas' | 'plasma';
}

// Shader programs for spherical rendering
const VERTEX_SHADER_SOURCE = `#version 300 es
    precision highp float;
    
    // Spherical coordinate attributes
    in vec3 a_spherical_position;  // (r, theta, phi)
    in vec3 a_normal;
    in vec2 a_texcoord;
    
    // Viewing transformation uniforms
    uniform mat4 u_view_matrix;
    uniform mat4 u_projection_matrix;
    uniform vec3 u_viewer_position;
    uniform float u_viewer_distance;
    uniform vec2 u_monitor_size;
    
    // Solid angle calculation uniforms
    uniform float u_pixel_solid_angle;
    uniform vec2 u_screen_resolution;
    
    // Output to fragment shader
    out vec3 v_spherical_position;
    out vec3 v_world_normal;
    out vec2 v_texcoord;
    out float v_distance_to_viewer;
    out float v_solid_angle_coverage;
    
    // PURE SPHERICAL COORDINATES ONLY - NO CARTESIAN CONVERSIONS!
    // GPU processes spherical coordinates natively in HSML
    
    // Calculate solid angle subtended by object at viewer
    float calculateSolidAngle(vec3 object_pos, float object_radius, vec3 viewer_pos) {
        float distance = length(object_pos - viewer_pos);
        float angular_radius = atan(object_radius / distance);
        return 2.0 * 3.14159265359 * (1.0 - cos(angular_radius));
    }
    
    void main() {
        v_spherical_position = a_spherical_position;
        v_texcoord = a_texcoord;
        
        // PURE SPHERICAL CALCULATIONS - NO CARTESIAN!
        float r = a_spherical_position.x;
        float theta = a_spherical_position.y;
        float phi = a_spherical_position.z;
        
        // Calculate spherical distance to viewer (pure spherical)
        float viewer_r = u_viewer_distance;
        float viewer_theta = 1.5708; // π/2 (viewer at equator)
        float viewer_phi = 0.0;
        
        // Spherical distance formula (great circle + radial)
        float cos_angular = cos(theta) * cos(viewer_theta) + 
                           sin(theta) * sin(viewer_theta) * cos(phi - viewer_phi);
        float angular_distance = acos(clamp(cos_angular, -1.0, 1.0));
        v_distance_to_viewer = sqrt(r*r + viewer_r*viewer_r - 2.0*r*viewer_r*cos_angular);
        
        // Calculate solid angle coverage (pure spherical)
        float angular_radius = atan(1.0 / v_distance_to_viewer); // Object angular size
        v_solid_angle_coverage = 2.0 * 3.14159265359 * (1.0 - cos(angular_radius));
        
        // Transform normal in spherical space
        v_world_normal = normalize(a_normal);
        
        // SPHERICAL PROJECTION - Map spherical coordinates to screen
        // Convert spherical position to screen coordinates
        float screen_x = (phi / 6.28318530718) * 2.0 - 1.0; // Normalize phi to [-1,1]
        float screen_y = (theta / 3.14159265359) * 2.0 - 1.0; // Normalize theta to [-1,1]
        float screen_z = (r - u_viewer_distance) / u_viewer_distance; // Normalized depth
        
        gl_Position = vec4(screen_x, screen_y, screen_z, 1.0);
    }
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
    precision highp float;
    
    // Input from vertex shader
    in vec3 v_spherical_position;
    in vec3 v_world_normal;
    in vec2 v_texcoord;
    in float v_distance_to_viewer;
    in float v_solid_angle_coverage;
    
    // Material uniforms
    uniform vec4 u_albedo;
    uniform float u_metallic;
    uniform float u_roughness;
    uniform vec3 u_emission;
    uniform float u_transparency;
    uniform float u_refraction_index;
    
    // Lighting uniforms
    uniform vec3 u_light_position;
    uniform vec3 u_light_color;
    uniform vec3 u_ambient_light;
    
    // Vision-driven rendering uniforms
    uniform float u_vision_wedge_angle;
    uniform vec3 u_vision_direction;
    uniform float u_lod_distance_threshold;
    
    // Matter state uniforms
    uniform int u_matter_state; // 0=solid, 1=liquid, 2=gas, 3=plasma
    
    out vec4 fragColor;
    
    // PBR shading calculation
    vec3 calculatePBR(vec3 albedo, float metallic, float roughness, vec3 normal, vec3 light_dir, vec3 view_dir) {
        vec3 h = normalize(light_dir + view_dir);
        float NdotV = max(dot(normal, view_dir), 0.0);
        float NdotL = max(dot(normal, light_dir), 0.0);
        float NdotH = max(dot(normal, h), 0.0);
        float VdotH = max(dot(view_dir, h), 0.0);
        
        // Fresnel
        vec3 F0 = mix(vec3(0.04), albedo, metallic);
        vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
        
        // Distribution
        float alpha = roughness * roughness;
        float alpha2 = alpha * alpha;
        float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
        float D = alpha2 / (3.14159265359 * denom * denom);
        
        // Geometry
        float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
        float G1L = NdotL / (NdotL * (1.0 - k) + k);
        float G1V = NdotV / (NdotV * (1.0 - k) + k);
        float G = G1L * G1V;
        
        // BRDF
        vec3 numerator = D * G * F;
        float denominator = 4.0 * NdotV * NdotL + 0.001;
        vec3 specular = numerator / denominator;
        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;
        
        return (kD * albedo / 3.14159265359 + specular) * NdotL;
    }
    
    // Matter state specific rendering
    vec4 renderMatterState(vec4 base_color) {
        vec4 result = base_color;
        
        if (u_matter_state == 0) { // Solid
            // Sharp, defined edges
            result.a = base_color.a;
        } else if (u_matter_state == 1) { // Liquid
            // Fluid-like transparency and reflection
            result.a = base_color.a * 0.8;
            result.rgb += vec3(0.1, 0.1, 0.2); // Slight blue tint
        } else if (u_matter_state == 2) { // Gas
            // Volumetric, diffuse appearance
            result.a = base_color.a * 0.3;
            result.rgb = mix(result.rgb, u_ambient_light, 0.5);
        } else if (u_matter_state == 3) { // Plasma
            // Glowing, electromagnetic appearance
            result.rgb += u_emission * 2.0;
            result.a = base_color.a * 0.6;
        }
        
        return result;
    }
    
    // Level of detail based on solid angle
    float calculateLODFactor() {
        if (v_solid_angle_coverage < 0.001) return 0.1; // Very low detail
        if (v_solid_angle_coverage < 0.01) return 0.3;
        if (v_solid_angle_coverage < 0.1) return 0.6;
        return 1.0; // Full detail
    }
    
    void main() {
        // LOD calculation
        float lod_factor = calculateLODFactor();
        
        // Early exit for very low LOD
        if (lod_factor < 0.2 && v_distance_to_viewer > u_lod_distance_threshold) {
            fragColor = vec4(u_albedo.rgb, u_albedo.a * lod_factor);
            return;
        }
        
        // Normal lighting calculations
        vec3 normal = normalize(v_world_normal);
        vec3 light_dir = normalize(u_light_position - v_spherical_position);
        vec3 view_dir = normalize(-v_spherical_position); // View direction in world space
        
        // PBR shading
        vec3 pbr_color = calculatePBR(
            u_albedo.rgb, 
            u_metallic, 
            u_roughness, 
            normal, 
            light_dir, 
            view_dir
        );
        
        // Add ambient lighting
        vec3 ambient = u_ambient_light * u_albedo.rgb;
        vec3 final_color = ambient + pbr_color * u_light_color + u_emission;
        
        // Apply matter state effects
        vec4 matter_color = renderMatterState(vec4(final_color, u_albedo.a));
        
        // Apply transparency
        matter_color.a *= (1.0 - u_transparency);
        
        // Distance-based fog/atmospheric effects
        float fog_factor = exp(-v_distance_to_viewer * 0.001);
        matter_color.rgb = mix(u_ambient_light, matter_color.rgb, fog_factor);
        
        // Final LOD application
        matter_color.a *= lod_factor;
        
        fragColor = matter_color;
    }
`;

export class WebGLSphericalRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private coordinateProcessor: SphericalCoordinateProcessor;
    
    // WebGL resources
    private shaderProgram: WebGLProgram | null = null;
    private uniformLocations = new Map<string, WebGLUniformLocation>();
    private attributeLocations = new Map<string, number>();
    
    // Rendering state
    private renderObjects = new Map<string, SphericalRenderObject>();
    private viewingParams: ViewingParameters;
    private frameCount = 0;
    private renderTime = 0;
    
    // Performance tracking
    private drawCalls = 0;
    private verticesRendered = 0;
    private culledObjects = 0;
    
    // Solid angle optimization
    private solidAngleLUT: Float32Array | null = null;
    private pixelToAngleCache = new Map<string, SolidAngle>();
    
    constructor(canvas: HTMLCanvasElement, viewingParams: ViewingParameters) {
        this.canvas = canvas;
        this.viewingParams = viewingParams;
        this.coordinateProcessor = SphericalCoordinateProcessor.getInstance();
        
        // Initialize WebGL context
        const gl = canvas.getContext('webgl2', {
            alpha: true,
            depth: true,
            stencil: false,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });
        
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        
        this.gl = gl;
        this.initializeRenderer();
    }
    
    private initializeRenderer(): void {
        const gl = this.gl;
        
        // Enable necessary features
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        
        // Create and compile shaders
        this.shaderProgram = this.createShaderProgram();
        if (!this.shaderProgram) {
            throw new Error('Failed to create shader program');
        }
        
        // Get uniform and attribute locations
        this.cacheUniformLocations();
        this.cacheAttributeLocations();
        
        // Initialize solid angle lookup table
        this.initializeSolidAngleLUT();
        
        // Set initial viewport
        this.updateViewport();
    }
    
    private createShaderProgram(): WebGLProgram | null {
        const gl = this.gl;
        
        // Create vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) return null;
        
        gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
            return null;
        }
        
        // Create fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) return null;
        
        gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
            return null;
        }
        
        // Create and link program
        const program = gl.createProgram();
        if (!program) return null;
        
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program linking error:', gl.getProgramInfoLog(program));
            return null;
        }
        
        // Clean up shaders
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        
        return program;
    }
    
    private cacheUniformLocations(): void {
        if (!this.shaderProgram) return;
        
        const gl = this.gl;
        const uniformNames = [
            'u_view_matrix', 'u_projection_matrix', 'u_viewer_position',
            'u_viewer_distance', 'u_monitor_size', 'u_pixel_solid_angle',
            'u_screen_resolution', 'u_albedo', 'u_metallic', 'u_roughness',
            'u_emission', 'u_transparency', 'u_refraction_index',
            'u_light_position', 'u_light_color', 'u_ambient_light',
            'u_vision_wedge_angle', 'u_vision_direction', 'u_lod_distance_threshold',
            'u_matter_state'
        ];
        
        for (const name of uniformNames) {
            const location = gl.getUniformLocation(this.shaderProgram, name);
            if (location) {
                this.uniformLocations.set(name, location);
            }
        }
    }
    
    private cacheAttributeLocations(): void {
        if (!this.shaderProgram) return;
        
        const gl = this.gl;
        const attributeNames = ['a_spherical_position', 'a_normal', 'a_texcoord'];
        
        for (const name of attributeNames) {
            const location = gl.getAttribLocation(this.shaderProgram, name);
            if (location >= 0) {
                this.attributeLocations.set(name, location);
            }
        }
    }
    
    private initializeSolidAngleLUT(): void {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Create lookup table for pixel-to-solid-angle mapping
        this.solidAngleLUT = new Float32Array(width * height * 2); // [theta, phi] per pixel
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 2;
                
                // Convert pixel to physical monitor coordinates
                const physicalX = (x / width) * this.viewingParams.monitorWidth - 
                                 (this.viewingParams.monitorWidth / 2);
                const physicalY = (y / height) * this.viewingParams.monitorHeight - 
                                 (this.viewingParams.monitorHeight / 2);
                
                // Calculate angles from viewer position
                const theta = Math.atan2(physicalY, this.viewingParams.viewerDistance);
                const phi = Math.atan2(physicalX, this.viewingParams.viewerDistance);
                
                this.solidAngleLUT[index] = theta;
                this.solidAngleLUT[index + 1] = phi;
            }
        }
    }
    
    // === RENDER OBJECT MANAGEMENT ===
    
    addRenderObject(object: SphericalRenderObject): void {
        // Create geometry buffers
        this.createGeometryBuffers(object);
        this.renderObjects.set(object.id, object);
    }
    
    removeRenderObject(id: string): void {
        const object = this.renderObjects.get(id);
        if (object) {
            // Clean up WebGL buffers
            if (object.geometry.vertex_buffer) {
                this.gl.deleteBuffer(object.geometry.vertex_buffer);
            }
            if (object.geometry.index_buffer) {
                this.gl.deleteBuffer(object.geometry.index_buffer);
            }
        }
        this.renderObjects.delete(id);
    }
    
    private createGeometryBuffers(object: SphericalRenderObject): void {
        const gl = this.gl;
        const geometry = object.geometry;
        
        if (geometry.type === 'sphere') {
            // Generate sphere vertices in spherical coordinates
            const { vertices, indices } = this.generateSphereGeometry(
                geometry.radius, 
                geometry.detail_level
            );
            
            // Create vertex buffer
            geometry.vertex_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            
            // Create index buffer
            geometry.index_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            
            geometry.vertex_count = indices.length;
        }
    }
    
    private generateSphereGeometry(radius: number, detail: number): {
        vertices: Float32Array,
        indices: Uint16Array
    } {
        const vertices: number[] = [];
        const indices: number[] = [];
        
        const phiSteps = detail * 2;
        const thetaSteps = detail;
        
        // Generate vertices in spherical coordinates
        for (let i = 0; i <= thetaSteps; i++) {
            const theta = (i / thetaSteps) * Math.PI;
            
            for (let j = 0; j <= phiSteps; j++) {
                const phi = (j / phiSteps) * 2 * Math.PI;
                
                // Spherical position
                vertices.push(radius, theta, phi);
                
                // Normal (same as normalized position for sphere)
                const sin_theta = Math.sin(theta);
                vertices.push(
                    sin_theta * Math.cos(phi),
                    sin_theta * Math.sin(phi),
                    Math.cos(theta)
                );
                
                // Texture coordinates
                vertices.push(j / phiSteps, i / thetaSteps);
            }
        }
        
        // Generate indices
        for (let i = 0; i < thetaSteps; i++) {
            for (let j = 0; j < phiSteps; j++) {
                const first = i * (phiSteps + 1) + j;
                const second = first + phiSteps + 1;
                
                // First triangle
                indices.push(first, second, first + 1);
                // Second triangle
                indices.push(second, second + 1, first + 1);
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }
    
    // === RENDERING PIPELINE ===
    
    render(): void {
        const gl = this.gl;
        const startTime = performance.now();
        
        // Clear buffers
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if (!this.shaderProgram) return;
        
        // Use shader program
        gl.useProgram(this.shaderProgram);
        
        // Set global uniforms
        this.setGlobalUniforms();
        
        // Reset performance counters
        this.drawCalls = 0;
        this.verticesRendered = 0;
        this.culledObjects = 0;
        
        // Render all objects
        for (const [id, object] of Array.from(this.renderObjects)) {
            if (object.visible) {
                this.renderObject(object);
            } else {
                this.culledObjects++;
            }
        }
        
        // Update performance tracking
        const endTime = performance.now();
        this.renderTime = endTime - startTime;
        this.frameCount++;
    }
    
    private setGlobalUniforms(): void {
        const gl = this.gl;
        
        // Viewer parameters
        this.setUniform('u_viewer_distance', this.viewingParams.viewerDistance);
        this.setUniform('u_monitor_size', [this.viewingParams.monitorWidth, this.viewingParams.monitorHeight]);
        this.setUniform('u_screen_resolution', [this.canvas.width, this.canvas.height]);
        
        // Calculate pixel solid angle
        const pixelWidth = this.viewingParams.monitorWidth / this.canvas.width;
        const pixelHeight = this.viewingParams.monitorHeight / this.canvas.height;
        const pixelSolidAngle = (pixelWidth * pixelHeight) / 
                               (this.viewingParams.viewerDistance * this.viewingParams.viewerDistance);
        this.setUniform('u_pixel_solid_angle', pixelSolidAngle);
        
        // Lighting
        this.setUniform('u_light_position', [100.0, 100.0, 100.0]);
        this.setUniform('u_light_color', [1.0, 1.0, 1.0]);
        this.setUniform('u_ambient_light', [0.1, 0.1, 0.1]);
        
        // LOD parameters
        this.setUniform('u_lod_distance_threshold', 1000.0);
    }
    
    private renderObject(object: SphericalRenderObject): void {
        const gl = this.gl;
        const geometry = object.geometry;
        
        if (!geometry.vertex_buffer || !geometry.index_buffer) return;
        
        // Set object-specific uniforms
        this.setObjectUniforms(object);
        
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertex_buffer);
        
        // Set up vertex attributes
        this.setupVertexAttributes();
        
        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.index_buffer);
        
        // Draw
        gl.drawElements(gl.TRIANGLES, geometry.vertex_count, gl.UNSIGNED_SHORT, 0);
        
        // Update performance counters
        this.drawCalls++;
        this.verticesRendered += geometry.vertex_count;
    }
    
    private setObjectUniforms(object: SphericalRenderObject): void {
        const material = object.material;
        
        // Material properties
        this.setUniform('u_albedo', material.albedo);
        this.setUniform('u_metallic', material.metallic);
        this.setUniform('u_roughness', material.roughness);
        this.setUniform('u_emission', material.emission);
        this.setUniform('u_transparency', material.transparency);
        this.setUniform('u_refraction_index', material.refraction_index);
        
        // Matter state
        const matterStateMap = { 'solid': 0, 'liquid': 1, 'gas': 2, 'plasma': 3 };
        this.setUniform('u_matter_state', matterStateMap[material.matter_state] || 0);
    }
    
    private setupVertexAttributes(): void {
        const gl = this.gl;
        const stride = 8 * 4; // 8 floats per vertex * 4 bytes per float
        
        // Position attribute (spherical coordinates)
        const positionLocation = this.attributeLocations.get('a_spherical_position');
        if (positionLocation !== undefined) {
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, stride, 0);
        }
        
        // Normal attribute
        const normalLocation = this.attributeLocations.get('a_normal');
        if (normalLocation !== undefined) {
            gl.enableVertexAttribArray(normalLocation);
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, stride, 3 * 4);
        }
        
        // Texture coordinate attribute
        const texcoordLocation = this.attributeLocations.get('a_texcoord');
        if (texcoordLocation !== undefined) {
            gl.enableVertexAttribArray(texcoordLocation);
            gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, stride, 6 * 4);
        }
    }
    
    private setUniform(name: string, value: any): void {
        const location = this.uniformLocations.get(name);
        if (!location) return;
        
        const gl = this.gl;
        
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (Array.isArray(value)) {
            switch (value.length) {
                case 2:
                    gl.uniform2fv(location, value);
                    break;
                case 3:
                    gl.uniform3fv(location, value);
                    break;
                case 4:
                    gl.uniform4fv(location, value);
                    break;
            }
        }
    }
    
    // === PUBLIC INTERFACE ===
    
    updateViewport(): void {
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Reinitialize solid angle LUT if canvas size changed
        this.initializeSolidAngleLUT();
    }
    
    setViewingParameters(params: Partial<ViewingParameters>): void {
        Object.assign(this.viewingParams, params);
        this.initializeSolidAngleLUT();
    }
    
    getPerformanceStats() {
        return {
            frameCount: this.frameCount,
            lastRenderTime: this.renderTime,
            averageRenderTime: this.renderTime / this.frameCount,
            drawCalls: this.drawCalls,
            verticesRendered: this.verticesRendered,
            culledObjects: this.culledObjects,
            totalObjects: this.renderObjects.size
        };
    }
    
    // === CLEANUP ===
    
    dispose(): void {
        const gl = this.gl;
        
        // Delete shader program
        if (this.shaderProgram) {
            gl.deleteProgram(this.shaderProgram);
        }
        
        // Delete all object buffers
        for (const [id, object] of Array.from(this.renderObjects)) {
            if (object.geometry.vertex_buffer) {
                gl.deleteBuffer(object.geometry.vertex_buffer);
            }
            if (object.geometry.index_buffer) {
                gl.deleteBuffer(object.geometry.index_buffer);
            }
        }
        
        this.renderObjects.clear();
    }
}

export default WebGLSphericalRenderer;