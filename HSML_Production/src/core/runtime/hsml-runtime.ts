/**
 * HSML Runtime Harness
 * Minimal runtime that connects all modules into a cohesive system
 */

import { SphericalCoordinateProcessor } from './spherical-coordinate-processor';
import { SphericalPhysicsEngine } from './spherical-physics-engine';
import { WebGLSphericalRenderer } from './webgl-spherical-renderer';
import { RuntimeOptimizationEngine } from './runtime-optimization-engine';
import { SolidAngleDOMProcessor } from './solid-angle-dom-processor';

export interface HSMLRuntimeConfig {
    enableSphericalOptimization: boolean;
    enablePhysicsOptimization: boolean;
    enableParallelization: boolean;
    enableCaching: boolean;
    targetFPS: number;
    maxObjects: number;
    debugMode: boolean;
}

export class HSMLRuntime {
    private coordinateProcessor!: SphericalCoordinateProcessor;
    private physicsEngine!: SphericalPhysicsEngine;
    private renderer: WebGLSphericalRenderer | null = null;
    private optimizer!: RuntimeOptimizationEngine;
    private domProcessor!: SolidAngleDOMProcessor;
    private config: HSMLRuntimeConfig;
    private isInitialized: boolean = false;
    private errorHandler: ((error: Error) => void) | null = null;

    constructor(config: HSMLRuntimeConfig) {
        this.config = config;
        this.initializeModules();
    }

    // === MODULE INITIALIZATION ===

    private initializeModules(): void {
        try {
            console.log('🔧 Initializing HSML Runtime...');

            // Initialize spherical coordinate processor
            this.coordinateProcessor = SphericalCoordinateProcessor.getInstance();
            console.log('✅ Spherical Coordinate Processor initialized');

            // Initialize physics engine
            this.physicsEngine = SphericalPhysicsEngine.getInstance();
            console.log('✅ Physics Engine initialized');

            // Initialize optimization engine
            this.optimizer = RuntimeOptimizationEngine.getInstance();
            console.log('✅ Optimization Engine initialized');

            // Initialize DOM processor
            this.domProcessor = SolidAngleDOMProcessor.getInstance();
            console.log('✅ DOM Processor initialized');

            this.isInitialized = true;
            console.log('🎉 HSML Runtime initialization complete');

        } catch (error) {
            console.error('❌ HSML Runtime initialization failed:', error);
            this.handleError(error as Error);
        }
    }

    // === RUNTIME LIFECYCLE ===

    public initializeRendering(canvas: HTMLCanvasElement): boolean {
        try {
            if (!this.isInitialized) {
                throw new Error('Runtime not initialized');
            }

            console.log('🎨 Initializing WebGL rendering...');
            
            this.renderer = new WebGLSphericalRenderer(canvas, {
                viewerDistance: 650,
                monitorWidth: 531,
                monitorHeight: 299,
                fieldOfView: {
                    omega: 0.5,
                    theta_min: -0.3,
                    theta_max: 0.3,
                    phi_min: -0.5,
                    phi_max: 0.5
                }
            });

            // Initialize DOM processor with canvas
            this.domProcessor.initializeViewport(canvas);

            console.log('✅ WebGL rendering initialized');
            return true;

        } catch (error) {
            console.error('❌ Rendering initialization failed:', error);
            this.handleError(error as Error);
            return false;
        }
    }

    public start(): boolean {
        try {
            if (!this.isInitialized) {
                throw new Error('Runtime not initialized');
            }

            console.log('🚀 Starting HSML Runtime...');

            // Start optimization engine
            this.optimizer.startFrame();

            // Initialize physics simulation
            this.physicsEngine.startSimulation();

            console.log('✅ HSML Runtime started');
            return true;

        } catch (error) {
            console.error('❌ Runtime start failed:', error);
            this.handleError(error as Error);
            return false;
        }
    }

    public stop(): void {
        try {
            console.log('🛑 Stopping HSML Runtime...');

            if (this.physicsEngine) {
                this.physicsEngine.stopSimulation();
            }

            if (this.optimizer) {
                this.optimizer.endFrame();
            }

            console.log('✅ HSML Runtime stopped');

        } catch (error) {
            console.error('❌ Runtime stop failed:', error);
            this.handleError(error as Error);
        }
    }

    // === RENDERING PIPELINE ===

    public renderFrame(): boolean {
        try {
            if (!this.isInitialized || !this.renderer) {
                throw new Error('Runtime or renderer not initialized');
            }

            // Start frame optimization
            this.optimizer.startFrame();

            // Update physics simulation
            this.physicsEngine.simulatePhysicsStep(1/60);

            // Process DOM updates
            this.domProcessor.processFrame();

            // Render frame
            this.renderer.render();

            // End frame optimization
            this.optimizer.endFrame();

            return true;

        } catch (error) {
            console.error('❌ Frame rendering failed:', error);
            this.handleError(error as Error);
            return false;
        }
    }

    // === OBJECT MANAGEMENT ===

    public addObject(id: string, object: any): boolean {
        try {
            if (!this.isInitialized) {
                throw new Error('Runtime not initialized');
            }

            // Add to physics engine
            this.physicsEngine.addPhysicsObject(id, object);

            // Add to DOM processor
            this.domProcessor.addElement(id, object);

            console.log(`✅ Object '${id}' added to runtime`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to add object '${id}':`, error);
            this.handleError(error as Error);
            return false;
        }
    }

    public removeObject(id: string): boolean {
        try {
            // Remove from physics engine
            this.physicsEngine.removePhysicsObject(id);

            // Remove from DOM processor
            this.domProcessor.removeElement(id);

            console.log(`✅ Object '${id}' removed from runtime`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to remove object '${id}':`, error);
            this.handleError(error as Error);
            return false;
        }
    }

    public updateObject(id: string, updates: any): boolean {
        try {
            // Update in physics engine
            this.physicsEngine.updatePhysicsObject(id, updates);

            // Update in DOM processor
            this.domProcessor.updateElement(id, updates);

            return true;

        } catch (error) {
            console.error(`❌ Failed to update object '${id}':`, error);
            this.handleError(error as Error);
            return false;
        }
    }

    // === SPHERICAL CALCULATIONS ===

    public calculateSphericalDistance(point1: any, point2: any): number {
        try {
            return this.coordinateProcessor.sphericalDistance(point1, point2);
        } catch (error) {
            console.error('❌ Spherical distance calculation failed:', error);
            this.handleError(error as Error);
            return 0;
        }
    }

    // CARTESIAN COORDINATES BANNED FROM HSML!
    // ONLY PURE SPHERICAL MATHEMATICS ALLOWED!
    // NO convertSphericalToCartesian() FUNCTION!
    // NO convertCartesianToSpherical() FUNCTION!
    
    public calculateSolidAngle(theta_min: number, theta_max: number, phi_min: number, phi_max: number): number {
        try {
            return this.coordinateProcessor.calculateSolidAngle(theta_min, theta_max, phi_min, phi_max);
        } catch (error) {
            console.error('❌ Solid angle calculation failed:', error);
            this.handleError(error as Error);
            return 0;
        }
    }

    // === PERFORMANCE MONITORING ===

    public getPerformanceMetrics(): any {
        try {
            const metrics = this.optimizer.getPerformanceMetrics();
            return {
                fps: metrics.fps,
                frameTime: metrics.frameTime,
                memoryUsage: metrics.memoryUsage,
                sphericalCalculations: metrics.solidAngleCalculations || 0,
                physicsObjects: this.physicsEngine.getObjectCount(),
                renderObjects: this.renderer?.getObjectCount() || 0
            };
        } catch (error) {
            console.error('❌ Failed to get performance metrics:', error);
            this.handleError(error as Error);
            return {
                fps: 0,
                frameTime: 0,
                memoryUsage: 0,
                sphericalCalculations: 0,
                physicsObjects: 0,
                renderObjects: 0
            };
        }
    }

    // === ERROR HANDLING ===

    public setErrorHandler(handler: (error: Error) => void): void {
        this.errorHandler = handler;
    }

    private handleError(error: Error): void {
        console.error('🚨 HSML Runtime Error:', error);
        
        if (this.errorHandler) {
            this.errorHandler(error);
        }
    }

    // === STATUS QUERIES ===

    public isReady(): boolean {
        // In Node.js environment, we don't require a renderer to be ready
        return this.isInitialized;
    }

    public getObjectCount(): number {
        return this.physicsEngine.getObjectCount();
    }

    public getConfig(): HSMLRuntimeConfig {
        return { ...this.config };
    }
}

// Export runtime instance factory
export function createHSMLRuntime(config: HSMLRuntimeConfig): HSMLRuntime {
    return new HSMLRuntime(config);
}

// Default configuration
export const DEFAULT_HSML_CONFIG: HSMLRuntimeConfig = {
    enableSphericalOptimization: true,
    enablePhysicsOptimization: true,
    enableParallelization: true,
    enableCaching: true,
    targetFPS: 60,
    maxObjects: 1000,
    debugMode: false
}; 