/**
 * HSML Runtime Optimization Engine
 * Dynamic performance optimization for spherical coordinate systems
 */

import { 
    SphericalCoordinate, 
    SolidAngle,
    SphericalCoordinateProcessor 
} from './spherical-coordinate-processor.js';
import { SphericalPhysicsEngine, PhysicsObject } from './spherical-physics-engine.js';
import { WebGLSphericalRenderer, SphericalRenderObject } from './webgl-spherical-renderer.js';

// Performance monitoring interfaces
export interface PerformanceMetrics {
    frameTime: number;
    renderTime: number;
    physicsTime: number;
    memoryUsage: number;
    objectCount: number;
    solidAngleCalculations: number;
    cacheHitRate: number;
    fps: number;
    bottleneckType: 'rendering' | 'physics' | 'memory' | 'calculation' | 'none';
}

export interface OptimizationProfile {
    lodDistanceThreshold: number;
    maxSimultaneousObjects: number;
    physicsTimeStep: number;
    cullingSolidAngleThreshold: number;
    cacheExpiryTime: number;
    adaptiveQualityEnabled: boolean;
    performanceTarget: number; // Target FPS
}

// Level of Detail management
export interface LODLevel {
    distance: number;
    vertexCount: number;
    materialComplexity: number;
    physicsAccuracy: number;
    renderPriority: number;
}

export interface AdaptiveSettings {
    currentQualityLevel: number;
    targetFrameTime: number;
    qualityAdjustmentRate: number;
    performanceBuffer: number;
    lastAdjustment: number;
}

export class RuntimeOptimizationEngine {
    private static instance: RuntimeOptimizationEngine;
    
    // Core systems
    private coordinateProcessor: SphericalCoordinateProcessor;
    private physicsEngine: SphericalPhysicsEngine;
    private renderer: WebGLSphericalRenderer | null = null;
    
    // Performance monitoring
    private performanceHistory: PerformanceMetrics[] = [];
    private currentMetrics: PerformanceMetrics;
    private frameTimeHistory: number[] = [];
    private adaptiveSettings: AdaptiveSettings;
    
    // Optimization state
    private optimizationProfile: OptimizationProfile;
    private lodLevels: LODLevel[] = [];
    private objectVisibilityCache = new Map<string, boolean>();
    private cullingCache = new Map<string, { visible: boolean, timestamp: number }>();
    
    // Memory management
    private memoryPool = new Map<string, any>();
    private garbageCollectionThreshold = 100 * 1024 * 1024; // 100MB
    private lastGCTime = 0;
    
    // Spatial optimization
    private spatialIndex = new Map<string, Set<string>>(); // Spatial sectors to object IDs
    private frustumCullingEnabled = true;
    private occlusionCullingEnabled = false; // Advanced feature
    
    // Adaptive quality system
    private qualityLevels = [
        { name: 'potato', multiplier: 0.25, description: 'Minimum quality for low-end devices' },
        { name: 'low', multiplier: 0.5, description: 'Reduced quality for better performance' },
        { name: 'medium', multiplier: 0.75, description: 'Balanced quality and performance' },
        { name: 'high', multiplier: 1.0, description: 'Full quality' },
        { name: 'ultra', multiplier: 1.25, description: 'Enhanced quality for high-end devices' }
    ];
    
    // Performance thresholds
    private readonly PERFORMANCE_THRESHOLDS = {
        CRITICAL_FRAME_TIME: 33.33, // 30 FPS
        TARGET_FRAME_TIME: 16.67,   // 60 FPS
        EXCELLENT_FRAME_TIME: 8.33, // 120 FPS
        MEMORY_WARNING: 150 * 1024 * 1024, // 150MB
        CACHE_SIZE_LIMIT: 10000,
        OPTIMIZATION_INTERVAL: 1000 // ms
    };
    
    static getInstance(): RuntimeOptimizationEngine {
        if (!RuntimeOptimizationEngine.instance) {
            RuntimeOptimizationEngine.instance = new RuntimeOptimizationEngine();
        }
        return RuntimeOptimizationEngine.instance;
    }
    
    private constructor() {
        this.coordinateProcessor = SphericalCoordinateProcessor.getInstance();
        this.physicsEngine = SphericalPhysicsEngine.getInstance();
        
        // Initialize default optimization profile
        this.optimizationProfile = {
            lodDistanceThreshold: 1000,
            maxSimultaneousObjects: 1000,
            physicsTimeStep: 1/60,
            cullingSolidAngleThreshold: 0.001,
            cacheExpiryTime: 5000,
            adaptiveQualityEnabled: true,
            performanceTarget: 60
        };
        
        // Initialize adaptive settings
        this.adaptiveSettings = {
            currentQualityLevel: 3, // Start at 'high'
            targetFrameTime: this.PERFORMANCE_THRESHOLDS.TARGET_FRAME_TIME,
            qualityAdjustmentRate: 0.1,
            performanceBuffer: 2.0,
            lastAdjustment: 0
        };
        
        // Initialize current metrics
        this.currentMetrics = this.createEmptyMetrics();
        
        // Initialize LOD levels
        this.initializeLODLevels();
        
        // Start optimization loop
        this.startOptimizationLoop();
    }
    
    // === INITIALIZATION ===
    
    private initializeLODLevels(): void {
        this.lodLevels = [
            { distance: 0,    vertexCount: 1000, materialComplexity: 1.0, physicsAccuracy: 1.0, renderPriority: 1 },
            { distance: 100,  vertexCount: 500,  materialComplexity: 0.8, physicsAccuracy: 0.9, renderPriority: 2 },
            { distance: 500,  vertexCount: 200,  materialComplexity: 0.6, physicsAccuracy: 0.7, renderPriority: 3 },
            { distance: 1000, vertexCount: 50,   materialComplexity: 0.4, physicsAccuracy: 0.5, renderPriority: 4 },
            { distance: 2000, vertexCount: 10,   materialComplexity: 0.2, physicsAccuracy: 0.2, renderPriority: 5 }
        ];
    }
    
    private createEmptyMetrics(): PerformanceMetrics {
        return {
            frameTime: 0,
            renderTime: 0,
            physicsTime: 0,
            memoryUsage: 0,
            objectCount: 0,
            solidAngleCalculations: 0,
            cacheHitRate: 0,
            fps: 0,
            bottleneckType: 'none'
        };
    }
    
    // === PERFORMANCE MONITORING ===
    
    startFrame(): void {
        this.currentMetrics.frameTime = performance.now();
    }
    
    endFrame(): void {
        const endTime = performance.now();
        const frameTime = endTime - this.currentMetrics.frameTime;
        
        // Update frame time history
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > 60) {
            this.frameTimeHistory.shift();
        }
        
        // Calculate FPS
        this.currentMetrics.fps = 1000 / frameTime;
        
        // Update metrics
        this.currentMetrics.frameTime = frameTime;
        this.updatePerformanceMetrics();
        
        // Add to history
        this.performanceHistory.push({...this.currentMetrics});
        if (this.performanceHistory.length > 300) {
            this.performanceHistory.shift();
        }
    }
    
    private updatePerformanceMetrics(): void {
        // Get system metrics
        if ('memory' in performance && (performance as any).memory) {
            this.currentMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
        
        // Get coordinate processor stats
        const coordStats = this.coordinateProcessor.getPerformanceStats();
        this.currentMetrics.cacheHitRate = coordStats.cacheHitRate;
        this.currentMetrics.solidAngleCalculations = coordStats.totalComputations;
        
        // Get renderer stats
        if (this.renderer) {
            const renderStats = this.renderer.getPerformanceStats();
            this.currentMetrics.renderTime = renderStats.lastRenderTime;
            this.currentMetrics.objectCount = renderStats.totalObjects;
        }
        
        // Get physics stats
        const physicsStats = this.physicsEngine.getSimulationStats();
        this.currentMetrics.physicsTime = physicsStats.avgFrameTime;
        
        // Determine bottleneck
        this.identifyBottleneck();
    }
    
    private identifyBottleneck(): void {
        const { frameTime, renderTime, physicsTime, memoryUsage } = this.currentMetrics;
        
        if (memoryUsage > this.PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
            this.currentMetrics.bottleneckType = 'memory';
        } else if (renderTime > frameTime * 0.6) {
            this.currentMetrics.bottleneckType = 'rendering';
        } else if (physicsTime > frameTime * 0.3) {
            this.currentMetrics.bottleneckType = 'physics';
        } else if (this.currentMetrics.solidAngleCalculations > 10000) {
            this.currentMetrics.bottleneckType = 'calculation';
        } else {
            this.currentMetrics.bottleneckType = 'none';
        }
    }
    
    // === ADAPTIVE QUALITY SYSTEM ===
    
    private adjustQualityLevel(): void {
        if (!this.optimizationProfile.adaptiveQualityEnabled) return;
        
        const now = performance.now();
        if (now - this.adaptiveSettings.lastAdjustment < 500) return; // Debounce
        
        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        const targetFrameTime = this.adaptiveSettings.targetFrameTime;
        const buffer = this.adaptiveSettings.performanceBuffer;
        
        if (avgFrameTime > targetFrameTime * buffer) {
            // Performance is poor, reduce quality
            if (this.adaptiveSettings.currentQualityLevel > 0) {
                this.adaptiveSettings.currentQualityLevel--;
                this.applyQualityLevel();
                this.adaptiveSettings.lastAdjustment = now;
            }
        } else if (avgFrameTime < targetFrameTime * 0.8) {
            // Performance is good, increase quality
            if (this.adaptiveSettings.currentQualityLevel < this.qualityLevels.length - 1) {
                this.adaptiveSettings.currentQualityLevel++;
                this.applyQualityLevel();
                this.adaptiveSettings.lastAdjustment = now;
            }
        }
    }
    
    private applyQualityLevel(): void {
        const qualityLevel = this.qualityLevels[this.adaptiveSettings.currentQualityLevel];
        const multiplier = qualityLevel.multiplier;
        
        // Adjust LOD distances
        for (const lod of this.lodLevels) {
            lod.distance *= multiplier;
            lod.vertexCount = Math.floor(lod.vertexCount * multiplier);
        }
        
        // Adjust optimization profile
        this.optimizationProfile.lodDistanceThreshold *= multiplier;
        this.optimizationProfile.maxSimultaneousObjects = Math.floor(
            this.optimizationProfile.maxSimultaneousObjects * multiplier
        );
        this.optimizationProfile.cullingSolidAngleThreshold /= multiplier;
    }
    
    // === LEVEL OF DETAIL OPTIMIZATION ===
    
    calculateLODLevel(object: SphericalRenderObject, viewerPosition: SphericalCoordinate): LODLevel {
        const distance = this.coordinateProcessor.sphericalDistance(object.position, viewerPosition);
        
        // Find appropriate LOD level
        let selectedLOD = this.lodLevels[this.lodLevels.length - 1]; // Default to lowest
        
        for (const lod of this.lodLevels) {
            if (distance <= lod.distance) {
                selectedLOD = lod;
                break;
            }
        }
        
        return selectedLOD;
    }
    
    optimizeObjectDetail(object: SphericalRenderObject, lodLevel: LODLevel): void {
        // Adjust geometry detail
        if (object.geometry.detail_level !== lodLevel.vertexCount) {
            object.geometry.detail_level = lodLevel.vertexCount;
            // Note: In a full implementation, this would trigger geometry regeneration
        }
        
        // Adjust material complexity
        object.material.roughness = Math.min(1.0, object.material.roughness / lodLevel.materialComplexity);
        
        // Set render priority
        object.lodLevel = lodLevel.renderPriority;
    }
    
    // === FRUSTUM CULLING ===
    
    performFrustumCulling(
        objects: Map<string, SphericalRenderObject>,
        viewerPosition: SphericalCoordinate,
        fieldOfView: SolidAngle
    ): Set<string> {
        const visibleObjects = new Set<string>();
        const now = performance.now();
        
        for (const [id, object] of Array.from(objects)) {
            // Check cache first
            const cached = this.cullingCache.get(id);
            if (cached && (now - cached.timestamp) < 100) { // 100ms cache
                if (cached.visible) {
                    visibleObjects.add(id);
                }
                continue;
            }
            
            // Calculate visibility
            const visible = this.isObjectVisible(object, viewerPosition, fieldOfView);
            
            // Cache result
            this.cullingCache.set(id, { visible, timestamp: now });
            
            if (visible) {
                visibleObjects.add(id);
            }
        }
        
        return visibleObjects;
    }
    
    private isObjectVisible(
        object: SphericalRenderObject,
        viewerPosition: SphericalCoordinate,
        fieldOfView: SolidAngle
    ): boolean {
        // Calculate solid angle subtended by object
        const distance = this.coordinateProcessor.sphericalDistance(object.position, viewerPosition);
        const angularRadius = Math.atan(object.geometry.radius / distance);
        const objectSolidAngle = 2 * Math.PI * (1 - Math.cos(angularRadius));
        
        // Cull objects that are too small
        if (objectSolidAngle < this.optimizationProfile.cullingSolidAngleThreshold) {
            return false;
        }
        
        // Check if object is within field of view
        const thetaDiff = Math.abs(object.position.theta - viewerPosition.theta);
        const phiDiff = Math.abs(object.position.phi - viewerPosition.phi);
        
        const withinFOV = thetaDiff < fieldOfView.theta_max && phiDiff < fieldOfView.phi_max;
        
        return withinFOV;
    }
    
    // === SPATIAL INDEXING ===
    
    updateSpatialIndex(objects: Map<string, SphericalRenderObject>): void {
        this.spatialIndex.clear();
        
        for (const [id, object] of Array.from(objects)) {
            const sector = this.calculateSpatialSector(object.position);
            
            if (!this.spatialIndex.has(sector)) {
                this.spatialIndex.set(sector, new Set());
            }
            
            this.spatialIndex.get(sector)!.add(id);
        }
    }
    
    private calculateSpatialSector(position: SphericalCoordinate): string {
        // Divide space into spherical sectors for spatial indexing
        const rSector = Math.floor(position.r / 100); // 100 unit radial sectors
        const thetaSector = Math.floor((position.theta / Math.PI) * 16); // 16 polar sectors
        const phiSector = Math.floor((position.phi / (2 * Math.PI)) * 32); // 32 azimuthal sectors
        
        return `${rSector}_${thetaSector}_${phiSector}`;
    }
    
    getObjectsInSector(center: SphericalCoordinate, radius: number): Set<string> {
        const centerSector = this.calculateSpatialSector(center);
        const nearbyObjects = new Set<string>();
        
        // Get objects from center sector and adjacent sectors
        const sectors = this.getNearbySectors(centerSector, radius);
        
        for (const sector of sectors) {
            const sectorObjects = this.spatialIndex.get(sector);
            if (sectorObjects) {
                for (const objectId of Array.from(sectorObjects)) {
                    nearbyObjects.add(objectId);
                }
            }
        }
        
        return nearbyObjects;
    }
    
    private getNearbySectors(centerSector: string, radius: number): string[] {
        // Simplified implementation - returns adjacent sectors
        // In a full implementation, this would calculate all sectors within radius
        return [centerSector];
    }
    
    // === MEMORY MANAGEMENT ===
    
    performGarbageCollection(): void {
        const now = performance.now();
        
        if (now - this.lastGCTime < 5000) return; // Don't GC too frequently
        
        // Clear expired cache entries
        this.cleanupCaches();
        
        // Clean up coordinate processor cache if it's getting large
        const coordStats = this.coordinateProcessor.getPerformanceStats();
        if (coordStats.cacheSize > this.PERFORMANCE_THRESHOLDS.CACHE_SIZE_LIMIT) {
            this.coordinateProcessor.clearCache();
        }
        
        // Clean up memory pool
        this.cleanupMemoryPool();
        
        this.lastGCTime = now;
    }
    
    private cleanupCaches(): void {
        const now = performance.now();
        const expiryTime = this.optimizationProfile.cacheExpiryTime;
        
        // Clean culling cache
        for (const [id, entry] of Array.from(this.cullingCache)) {
            if (now - entry.timestamp > expiryTime) {
                this.cullingCache.delete(id);
            }
        }
        
        // Clean visibility cache
        this.objectVisibilityCache.clear(); // Simple periodic cleanup
    }
    
    private cleanupMemoryPool(): void {
        // Clean up unused pooled objects
        // This is a simplified implementation
        if (this.memoryPool.size > 1000) {
            this.memoryPool.clear();
        }
    }
    
    // === OPTIMIZATION LOOP ===
    
    private startOptimizationLoop(): void {
        setInterval(() => {
            this.runOptimizations();
        }, this.PERFORMANCE_THRESHOLDS.OPTIMIZATION_INTERVAL);
    }
    
    private runOptimizations(): void {
        // Adjust quality based on performance
        this.adjustQualityLevel();
        
        // Perform garbage collection if needed
        if (this.currentMetrics.memoryUsage > this.garbageCollectionThreshold) {
            this.performGarbageCollection();
        }
        
        // Apply specific optimizations based on bottleneck
        this.applyBottleneckOptimizations();
    }
    
    private applyBottleneckOptimizations(): void {
        switch (this.currentMetrics.bottleneckType) {
            case 'rendering':
                // Reduce LOD distances, increase culling threshold
                this.optimizationProfile.lodDistanceThreshold *= 0.9;
                this.optimizationProfile.cullingSolidAngleThreshold *= 1.1;
                break;
                
            case 'physics':
                // Increase physics time step, reduce physics accuracy
                this.optimizationProfile.physicsTimeStep *= 1.1;
                break;
                
            case 'memory':
                // Perform aggressive garbage collection
                this.performGarbageCollection();
                this.optimizationProfile.cacheExpiryTime *= 0.8;
                break;
                
            case 'calculation':
                // Increase cache expiry time, reduce calculation frequency
                this.optimizationProfile.cacheExpiryTime *= 1.2;
                break;
        }
    }
    
    // === PUBLIC INTERFACE ===
    
    setRenderer(renderer: WebGLSphericalRenderer): void {
        this.renderer = renderer;
    }
    
    getPerformanceMetrics(): PerformanceMetrics {
        return {...this.currentMetrics};
    }
    
    getOptimizationProfile(): OptimizationProfile {
        return {...this.optimizationProfile};
    }
    
    updateOptimizationProfile(updates: Partial<OptimizationProfile>): void {
        Object.assign(this.optimizationProfile, updates);
    }
    
    getCurrentQualityLevel(): { level: number, name: string, description: string } {
        const quality = this.qualityLevels[this.adaptiveSettings.currentQualityLevel];
        return {
            level: this.adaptiveSettings.currentQualityLevel,
            name: quality.name,
            description: quality.description
        };
    }
    
    setQualityLevel(level: number): void {
        if (level >= 0 && level < this.qualityLevels.length) {
            this.adaptiveSettings.currentQualityLevel = level;
            this.applyQualityLevel();
        }
    }
    
    enableAdaptiveQuality(enabled: boolean): void {
        this.optimizationProfile.adaptiveQualityEnabled = enabled;
    }
    
    getPerformanceReport(): string {
        const recent = this.performanceHistory.slice(-10);
        const avgFPS = recent.reduce((sum, m) => sum + m.fps, 0) / recent.length;
        const avgFrameTime = recent.reduce((sum, m) => sum + m.frameTime, 0) / recent.length;
        
        return `
Performance Report:
  Average FPS: ${avgFPS.toFixed(1)}
  Average Frame Time: ${avgFrameTime.toFixed(2)}ms
  Quality Level: ${this.getCurrentQualityLevel().name}
  Objects Rendered: ${this.currentMetrics.objectCount}
  Cache Hit Rate: ${(this.currentMetrics.cacheHitRate * 100).toFixed(1)}%
  Memory Usage: ${(this.currentMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
  Current Bottleneck: ${this.currentMetrics.bottleneckType}
        `.trim();
    }
}

export default RuntimeOptimizationEngine;