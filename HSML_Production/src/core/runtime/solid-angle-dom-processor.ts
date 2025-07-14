/**
 * HSML Solid Angle DOM Processor
 * Transforms traditional pixel-based DOM into spherical coordinate viewing system
 */

import { 
    SphericalCoordinate, 
    SolidAngle,
    SphericalCoordinateProcessor 
} from './spherical-coordinate-processor';
import { WebGLSphericalRenderer, SphericalRenderObject } from './webgl-spherical-renderer';
import { RuntimeOptimizationEngine } from './runtime-optimization-engine';

// DOM transformation interfaces
export interface PixelToSolidAngleMapping {
    pixelX: number;
    pixelY: number;
    solidAngle: SolidAngle;
    rayDirection: SphericalCoordinate;
    distanceToMonitor: number;
}

export interface HSMLViewport {
    canvasElement: HTMLCanvasElement;
    viewerDistance: number;        // mm from monitor
    monitorWidth: number;          // Physical width in mm
    monitorHeight: number;         // Physical height in mm
    totalSolidAngle: number;       // Total coverage in steradians
    pixelMappingLUT: PixelToSolidAngleMapping[];
    fieldOfView: {
        horizontal: number;        // Radians
        vertical: number;          // Radians
        diagonal: number;          // Radians
    };
}

export interface HSMLElement {
    id: string;
    tagName: string;
    sphericalPosition: SphericalCoordinate;
    solidAngleSize: SolidAngle;
    children: HSMLElement[];
    parent: HSMLElement | null;
    renderObject: SphericalRenderObject | null;
    eventHandlers: Map<string, EventListener>;
    visible: boolean;
    interactive: boolean;
    matter_state: 'solid' | 'liquid' | 'gas' | 'plasma';
    material_properties: any;
}

export interface SolidAngleEvent {
    type: string;
    target: HSMLElement;
    solidAngle: SolidAngle;
    rayDirection: SphericalCoordinate;
    pixelCoordinates: { x: number, y: number };
    viewerPosition: SphericalCoordinate;
    distance: number;
    timestamp: number;
}

// 4-Corner Optimization Data Structure
export interface CornerOptimization {
    topLeft: PixelToSolidAngleMapping;
    topRight: PixelToSolidAngleMapping;
    bottomLeft: PixelToSolidAngleMapping;
    bottomRight: PixelToSolidAngleMapping;
    interpolationCache: Map<string, PixelToSolidAngleMapping>;
}

export class SolidAngleDOMProcessor {
    private static instance: SolidAngleDOMProcessor;
    
    // Core systems
    private coordinateProcessor: SphericalCoordinateProcessor;
    private renderer: WebGLSphericalRenderer | null = null;
    private optimizer: RuntimeOptimizationEngine;
    
    // DOM state
    private viewport: HSMLViewport | null = null;
    private rootElement: HSMLElement | null = null;
    private elementRegistry = new Map<string, HSMLElement>();
    private renderQueue: Set<string> = new Set();
    
    // 4-Corner optimization system
    private cornerOptimization: CornerOptimization | null = null;
    private cornerCalculationCache = new Map<string, PixelToSolidAngleMapping>();
    
    // Event system
    private eventListeners = new Map<string, Set<(event: SolidAngleEvent) => void>>();
    private lastMousePosition = { x: 0, y: 0 };
    private hoveredElement: HSMLElement | null = null;
    
    // Performance tracking
    private frameCount = 0;
    private lastFrameTime = 0;
    private raycastingTime = 0;
    private domUpdateTime = 0;
    
    // Ray casting cache for optimization
    private raycastCache = new Map<string, HSMLElement | null>();
    private cacheValidationFrame = 0;
    
    static getInstance(): SolidAngleDOMProcessor {
        if (!SolidAngleDOMProcessor.instance) {
            SolidAngleDOMProcessor.instance = new SolidAngleDOMProcessor();
        }
        return SolidAngleDOMProcessor.instance;
    }
    
    private constructor() {
        this.coordinateProcessor = SphericalCoordinateProcessor.getInstance();
        this.optimizer = RuntimeOptimizationEngine.getInstance();
    }
    
    // === VIEWPORT INITIALIZATION ===
    
    initializeViewport(
        canvas: HTMLCanvasElement,
        viewerDistance: number = 650,
        monitorWidth?: number,
        monitorHeight?: number
    ): HSMLViewport {
        // Auto-detect monitor dimensions if not provided
        if (!monitorWidth || !monitorHeight) {
            const detected = this.detectMonitorDimensions(canvas);
            monitorWidth = detected.width;
            monitorHeight = detected.height;
        }
        
        // Create viewport
        this.viewport = {
            canvasElement: canvas,
            viewerDistance,
            monitorWidth,
            monitorHeight,
            totalSolidAngle: 0,
            pixelMappingLUT: [],
            fieldOfView: {
                horizontal: 0,
                vertical: 0,
                diagonal: 0
            }
        };
        
        // Calculate field of view
        this.calculateFieldOfView();
        
        // Generate pixel-to-solid-angle mapping
        this.generatePixelMappingLUT();
        
        // Initialize 4-corner optimization
        this.initialize4CornerOptimization();
        
        // Set up event listeners
        this.setupEventListeners();
        
        return this.viewport;
    }
    
    private detectMonitorDimensions(canvas: HTMLCanvasElement): { width: number, height: number } {
        // Attempt to detect physical monitor dimensions
        const dpi = window.devicePixelRatio * 96; // Approximate DPI
        const canvasRect = canvas.getBoundingClientRect();
        
        // Convert CSS pixels to physical millimeters
        const mmPerInch = 25.4;
        const width = (canvasRect.width / dpi) * mmPerInch;
        const height = (canvasRect.height / dpi) * mmPerInch;
        
        // Fallback to common monitor sizes if detection seems off
        if (width < 200 || width > 800 || height < 150 || height > 600) {
            // Assume 24" monitor with 16:9 aspect ratio
            return { width: 531, height: 299 }; // mm
        }
        
        return { width, height };
    }
    
    private calculateFieldOfView(): void {
        if (!this.viewport) return;
        
        const { viewerDistance, monitorWidth, monitorHeight } = this.viewport;
        
        // Calculate angular field of view
        this.viewport.fieldOfView.horizontal = 2 * Math.atan(monitorWidth / (2 * viewerDistance));
        this.viewport.fieldOfView.vertical = 2 * Math.atan(monitorHeight / (2 * viewerDistance));
        this.viewport.fieldOfView.diagonal = 2 * Math.atan(
            Math.sqrt(monitorWidth * monitorWidth + monitorHeight * monitorHeight) / (2 * viewerDistance)
        );
        
        // Calculate total solid angle coverage
        this.viewport.totalSolidAngle = this.coordinateProcessor.calculateSolidAngle(
            -this.viewport.fieldOfView.vertical / 2,
            this.viewport.fieldOfView.vertical / 2,
            -this.viewport.fieldOfView.horizontal / 2,
            this.viewport.fieldOfView.horizontal / 2
        );
    }
    
    private generatePixelMappingLUT(): void {
        if (!this.viewport) return;
        
        const canvas = this.viewport.canvasElement;
        const width = canvas.width;
        const height = canvas.height;
        const { viewerDistance, monitorWidth, monitorHeight } = this.viewport;
        
        this.viewport.pixelMappingLUT = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const mapping = this.calculatePixelToSolidAngle(x, y, width, height);
                this.viewport.pixelMappingLUT.push(mapping);
            }
        }
    }
    
    private calculatePixelToSolidAngle(
        pixelX: number, 
        pixelY: number, 
        canvasWidth: number, 
        canvasHeight: number
    ): PixelToSolidAngleMapping {
        if (!this.viewport) throw new Error('Viewport not initialized');
        
        const { viewerDistance, monitorWidth, monitorHeight } = this.viewport;
        
        // Convert pixel coordinates to physical monitor coordinates
        const physicalX = (pixelX / canvasWidth) * monitorWidth - (monitorWidth / 2);
        const physicalY = (pixelY / canvasHeight) * monitorHeight - (monitorHeight / 2);
        
        // Calculate angles from viewer position
        const theta = Math.atan2(physicalY, viewerDistance);
        const phi = Math.atan2(physicalX, viewerDistance);
        
        // Calculate solid angle for this pixel
        const pixelWidth = monitorWidth / canvasWidth;
        const pixelHeight = monitorHeight / canvasHeight;
        const solidAngleSize = (pixelWidth * pixelHeight) / (viewerDistance * viewerDistance);
        
        // Create solid angle window
        const solidAngle: SolidAngle = {
            omega: solidAngleSize,
            theta_min: theta - (pixelHeight / 2) / viewerDistance,
            theta_max: theta + (pixelHeight / 2) / viewerDistance,
            phi_min: phi - (pixelWidth / 2) / viewerDistance,
            phi_max: phi + (pixelWidth / 2) / viewerDistance
        };
        
        // Ray direction in spherical coordinates
        const rayDirection: SphericalCoordinate = {
            r: 1.0, // Unit vector
            theta: Math.PI/2 + theta, // Convert to spherical coordinate system
            phi: phi + Math.PI // Convert to spherical coordinate system
        };
        
        return {
            pixelX,
            pixelY,
            solidAngle,
            rayDirection,
            distanceToMonitor: viewerDistance
        };
    }
    
    // === 4-CORNER OPTIMIZATION ===
    
    private initialize4CornerOptimization(): void {
        if (!this.viewport) return;
        
        const canvas = this.viewport.canvasElement;
        const width = canvas.width;
        const height = canvas.height;
        
        this.cornerOptimization = {
            topLeft: this.calculatePixelToSolidAngle(0, 0, width, height),
            topRight: this.calculatePixelToSolidAngle(width - 1, 0, width, height),
            bottomLeft: this.calculatePixelToSolidAngle(0, height - 1, width, height),
            bottomRight: this.calculatePixelToSolidAngle(width - 1, height - 1, width, height),
            interpolationCache: new Map()
        };
    }
    
    /**
     * Optimized pixel-to-solid-angle calculation using 4-corner interpolation
     * Reduces millions of calculations to 4 pre-computed corners + interpolation
     */
    getPixelSolidAngleOptimized(pixelX: number, pixelY: number): PixelToSolidAngleMapping {
        if (!this.cornerOptimization || !this.viewport) {
            throw new Error('Corner optimization not initialized');
        }
        
        const cacheKey = `${pixelX}_${pixelY}`;
        
        // Check cache first
        if (this.cornerOptimization.interpolationCache.has(cacheKey)) {
            return this.cornerOptimization.interpolationCache.get(cacheKey)!;
        }
        
        const canvas = this.viewport.canvasElement;
        const width = canvas.width;
        const height = canvas.height;
        
        // Normalize coordinates to [0, 1]
        const u = pixelX / (width - 1);
        const v = pixelY / (height - 1);
        
        // Bilinear interpolation of the 4 corners
        const { topLeft, topRight, bottomLeft, bottomRight } = this.cornerOptimization;
        
        // Interpolate solid angle
        const omega_top = topLeft.solidAngle.omega * (1 - u) + topRight.solidAngle.omega * u;
        const omega_bottom = bottomLeft.solidAngle.omega * (1 - u) + bottomRight.solidAngle.omega * u;
        const omega = omega_top * (1 - v) + omega_bottom * v;
        
        // Interpolate theta bounds
        const theta_min_top = topLeft.solidAngle.theta_min * (1 - u) + topRight.solidAngle.theta_min * u;
        const theta_min_bottom = bottomLeft.solidAngle.theta_min * (1 - u) + bottomRight.solidAngle.theta_min * u;
        const theta_min = theta_min_top * (1 - v) + theta_min_bottom * v;
        
        const theta_max_top = topLeft.solidAngle.theta_max * (1 - u) + topRight.solidAngle.theta_max * u;
        const theta_max_bottom = bottomLeft.solidAngle.theta_max * (1 - u) + bottomRight.solidAngle.theta_max * u;
        const theta_max = theta_max_top * (1 - v) + theta_max_bottom * v;
        
        // Interpolate phi bounds
        const phi_min_top = topLeft.solidAngle.phi_min * (1 - u) + topRight.solidAngle.phi_min * u;
        const phi_min_bottom = bottomLeft.solidAngle.phi_min * (1 - u) + bottomRight.solidAngle.phi_min * u;
        const phi_min = phi_min_top * (1 - v) + phi_min_bottom * v;
        
        const phi_max_top = topLeft.solidAngle.phi_max * (1 - u) + topRight.solidAngle.phi_max * u;
        const phi_max_bottom = bottomLeft.solidAngle.phi_max * (1 - u) + bottomRight.solidAngle.phi_max * u;
        const phi_max = phi_max_top * (1 - v) + phi_max_bottom * v;
        
        // Interpolate ray direction
        const r_theta_top = topLeft.rayDirection.theta * (1 - u) + topRight.rayDirection.theta * u;
        const r_theta_bottom = bottomLeft.rayDirection.theta * (1 - u) + bottomRight.rayDirection.theta * u;
        const r_theta = r_theta_top * (1 - v) + r_theta_bottom * v;
        
        const r_phi_top = topLeft.rayDirection.phi * (1 - u) + topRight.rayDirection.phi * u;
        const r_phi_bottom = bottomLeft.rayDirection.phi * (1 - u) + bottomRight.rayDirection.phi * u;
        const r_phi = r_phi_top * (1 - v) + r_phi_bottom * v;
        
        const result: PixelToSolidAngleMapping = {
            pixelX,
            pixelY,
            solidAngle: { omega, theta_min, theta_max, phi_min, phi_max },
            rayDirection: { r: 1.0, theta: r_theta, phi: r_phi },
            distanceToMonitor: this.viewport.viewerDistance
        };
        
        // Cache the result
        this.cornerOptimization.interpolationCache.set(cacheKey, result);
        
        // Limit cache size
        if (this.cornerOptimization.interpolationCache.size > 10000) {
            const firstKey = this.cornerOptimization.interpolationCache.keys().next().value;
            if (firstKey) {
                this.cornerOptimization.interpolationCache.delete(firstKey);
            }
        }
        
        return result;
    }
    
    // === DOM ELEMENT MANAGEMENT ===
    
    createElement(tagName: string, properties: Partial<HSMLElement> = {}): HSMLElement {
        const element: HSMLElement = {
            id: properties.id || this.generateElementId(),
            tagName,
            sphericalPosition: properties.sphericalPosition || { r: 100, theta: Math.PI/2, phi: 0 },
            solidAngleSize: properties.solidAngleSize || { 
                omega: 0.01, 
                theta_min: 0, 
                theta_max: 0.1, 
                phi_min: 0, 
                phi_max: 0.1 
            },
            children: [],
            parent: null,
            renderObject: null,
            eventHandlers: new Map(),
            visible: properties.visible !== false,
            interactive: properties.interactive !== false,
            matter_state: properties.matter_state || 'solid',
            material_properties: properties.material_properties || {}
        };
        
        this.elementRegistry.set(element.id, element);
        this.renderQueue.add(element.id);
        
        return element;
    }
    
    private generateElementId(): string {
        return `hsml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    appendChild(parent: HSMLElement, child: HSMLElement): void {
        if (child.parent) {
            this.removeChild(child.parent, child);
        }
        
        parent.children.push(child);
        child.parent = parent;
        this.renderQueue.add(child.id);
    }
    
    removeChild(parent: HSMLElement, child: HSMLElement): void {
        const index = parent.children.indexOf(child);
        if (index !== -1) {
            parent.children.splice(index, 1);
            child.parent = null;
            this.renderQueue.add(parent.id);
        }
    }
    
    // === RAY CASTING AND INTERACTION ===
    
    performRaycast(pixelX: number, pixelY: number): HSMLElement | null {
        const startTime = performance.now();
        
        // Check cache first
        const cacheKey = `${pixelX}_${pixelY}_${this.cacheValidationFrame}`;
        if (this.raycastCache.has(cacheKey)) {
            return this.raycastCache.get(cacheKey)!;
        }
        
        // Get solid angle mapping for pixel
        const mapping = this.getPixelSolidAngleOptimized(pixelX, pixelY);
        
        // Find intersecting elements
        let closestElement: HSMLElement | null = null;
        let closestDistance = Infinity;
        
        for (const [id, element] of this.elementRegistry) {
            if (!element.visible || !element.interactive) continue;
            
            const intersection = this.testRayElementIntersection(mapping.rayDirection, element);
            if (intersection && intersection.distance < closestDistance) {
                closestElement = element;
                closestDistance = intersection.distance;
            }
        }
        
        // Cache result
        this.raycastCache.set(cacheKey, closestElement);
        
        // Limit cache size
        if (this.raycastCache.size > 1000) {
            const firstKey = this.raycastCache.keys().next().value;
            if (firstKey) {
                this.raycastCache.delete(firstKey);
            }
        }
        
        this.raycastingTime += performance.now() - startTime;
        return closestElement;
    }
    
    private testRayElementIntersection(
        ray: SphericalCoordinate, 
        element: HSMLElement
    ): { distance: number } | null {
        // PURE SPHERICAL RAY-SPHERE INTERSECTION - NO CARTESIAN FILTH!
        const elementPos = element.sphericalPosition;
        const sphereRadius = 10; // Default element size
        
        // Calculate spherical distance between ray and element center
        const sphericalDistance = this.coordinateProcessor.sphericalDistance(ray, elementPos);
        
        // Pure spherical intersection test
        if (sphericalDistance <= sphereRadius) {
            // Calculate intersection distance in spherical space
            const radialDistance = Math.abs(ray.r - elementPos.r);
            
            // Spherical intersection geometry
            const angularSeparation = Math.acos(
                Math.cos(ray.theta) * Math.cos(elementPos.theta) + 
                Math.sin(ray.theta) * Math.sin(elementPos.theta) * 
                Math.cos(ray.phi - elementPos.phi)
            );
            
            const arcDistance = ray.r * angularSeparation;
            const totalDistance = Math.sqrt(radialDistance * radialDistance + arcDistance * arcDistance);
            
            if (totalDistance <= sphereRadius) {
                return { distance: totalDistance };
            }
        }
        
        return null; // No intersection in pure spherical space
    }
    
    // === EVENT SYSTEM ===
    
    private setupEventListeners(): void {
        if (!this.viewport) return;
        
        const canvas = this.viewport.canvasElement;
        
        // Mouse events
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    private handleMouseMove(event: MouseEvent): void {
        const rect = this.viewport!.canvasElement.getBoundingClientRect();
        const pixelX = (event.clientX - rect.left) * (this.viewport!.canvasElement.width / rect.width);
        const pixelY = (event.clientY - rect.top) * (this.viewport!.canvasElement.height / rect.height);
        
        this.lastMousePosition = { x: pixelX, y: pixelY };
        
        // Perform raycast to find hovered element
        const hitElement = this.performRaycast(pixelX, pixelY);
        
        // Handle hover state changes
        if (hitElement !== this.hoveredElement) {
            if (this.hoveredElement) {
                this.dispatchSolidAngleEvent('mouseleave', this.hoveredElement, pixelX, pixelY);
            }
            
            this.hoveredElement = hitElement;
            
            if (this.hoveredElement) {
                this.dispatchSolidAngleEvent('mouseenter', this.hoveredElement, pixelX, pixelY);
            }
        }
        
        if (this.hoveredElement) {
            this.dispatchSolidAngleEvent('mousemove', this.hoveredElement, pixelX, pixelY);
        }
    }
    
    private handleMouseDown(event: MouseEvent): void {
        if (this.hoveredElement) {
            this.dispatchSolidAngleEvent('mousedown', this.hoveredElement, 
                this.lastMousePosition.x, this.lastMousePosition.y);
        }
    }
    
    private handleMouseUp(event: MouseEvent): void {
        if (this.hoveredElement) {
            this.dispatchSolidAngleEvent('mouseup', this.hoveredElement, 
                this.lastMousePosition.x, this.lastMousePosition.y);
        }
    }
    
    private handleClick(event: MouseEvent): void {
        if (this.hoveredElement) {
            this.dispatchSolidAngleEvent('click', this.hoveredElement, 
                this.lastMousePosition.x, this.lastMousePosition.y);
        }
    }
    
    private handleTouchStart(event: TouchEvent): void {
        // Handle touch events (similar to mouse events)
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.handleMouseMove(touch as any);
            this.handleMouseDown(touch as any);
        }
    }
    
    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.handleMouseMove(touch as any);
        }
    }
    
    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        this.handleMouseUp({} as MouseEvent);
    }
    
    private handleKeyDown(event: KeyboardEvent): void {
        // Dispatch keyboard events to focused element or global handlers
        if (this.hoveredElement) {
            const solidAngleEvent: SolidAngleEvent = {
                type: 'keydown',
                target: this.hoveredElement,
                solidAngle: this.hoveredElement.solidAngleSize,
                rayDirection: { r: 1, theta: 0, phi: 0 },
                pixelCoordinates: this.lastMousePosition,
                viewerPosition: { r: this.viewport!.viewerDistance, theta: Math.PI/2, phi: 0 },
                distance: this.hoveredElement.sphericalPosition.r,
                timestamp: Date.now()
            };
            
            this.dispatchEvent('keydown', solidAngleEvent);
        }
    }
    
    private handleKeyUp(event: KeyboardEvent): void {
        // Similar to keydown
        if (this.hoveredElement) {
            const solidAngleEvent: SolidAngleEvent = {
                type: 'keyup',
                target: this.hoveredElement,
                solidAngle: this.hoveredElement.solidAngleSize,
                rayDirection: { r: 1, theta: 0, phi: 0 },
                pixelCoordinates: this.lastMousePosition,
                viewerPosition: { r: this.viewport!.viewerDistance, theta: Math.PI/2, phi: 0 },
                distance: this.hoveredElement.sphericalPosition.r,
                timestamp: Date.now()
            };
            
            this.dispatchEvent('keyup', solidAngleEvent);
        }
    }
    
    private dispatchSolidAngleEvent(
        eventType: string, 
        target: HSMLElement, 
        pixelX: number, 
        pixelY: number
    ): void {
        const mapping = this.getPixelSolidAngleOptimized(pixelX, pixelY);
        
        const solidAngleEvent: SolidAngleEvent = {
            type: eventType,
            target,
            solidAngle: mapping.solidAngle,
            rayDirection: mapping.rayDirection,
            pixelCoordinates: { x: pixelX, y: pixelY },
            viewerPosition: { r: this.viewport!.viewerDistance, theta: Math.PI/2, phi: 0 },
            distance: target.sphericalPosition.r,
            timestamp: Date.now()
        };
        
        this.dispatchEvent(eventType, solidAngleEvent);
    }
    
    addEventListener(eventType: string, listener: (event: SolidAngleEvent) => void): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        this.eventListeners.get(eventType)!.add(listener);
    }
    
    removeEventListener(eventType: string, listener: (event: SolidAngleEvent) => void): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.delete(listener);
        }
    }
    
    private dispatchEvent(eventType: string, event: SolidAngleEvent): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(event);
                } catch (error) {
                    console.error(`Error in event listener for ${eventType}:`, error);
                }
            }
        }
    }
    
    // === RENDERING INTEGRATION ===
    
    setRenderer(renderer: WebGLSphericalRenderer): void {
        this.renderer = renderer;
    }
    
    updateFrame(): void {
        const frameStart = performance.now();
        this.optimizer.startFrame();
        
        // Process render queue
        this.processRenderQueue();
        
        // Invalidate cache periodically
        if (this.frameCount % 60 === 0) {
            this.cacheValidationFrame++;
            if (this.cacheValidationFrame > 1000) {
                this.raycastCache.clear();
                this.cacheValidationFrame = 0;
            }
        }
        
        // Update performance tracking
        this.domUpdateTime = performance.now() - frameStart;
        this.frameCount++;
        this.optimizer.endFrame();
    }
    
    private processRenderQueue(): void {
        for (const elementId of this.renderQueue) {
            const element = this.elementRegistry.get(elementId);
            if (element && element.visible) {
                this.updateElementRenderObject(element);
            }
        }
        this.renderQueue.clear();
    }
    
    private updateElementRenderObject(element: HSMLElement): void {
        if (!this.renderer) return;
        
        // Create or update render object
        if (!element.renderObject) {
            element.renderObject = {
                id: element.id,
                position: element.sphericalPosition,
                geometry: {
                    type: 'sphere',
                    radius: 10,
                    detail_level: 20,
                    vertex_count: 0
                },
                material: {
                    albedo: [1, 1, 1, 1],
                    metallic: 0,
                    roughness: 0.5,
                    emission: [0, 0, 0],
                    transparency: 0,
                    refraction_index: 1,
                    matter_state: element.matter_state
                },
                visible: element.visible,
                lodLevel: 1
            };
            
            this.renderer.addRenderObject(element.renderObject);
        } else {
            // Update existing render object
            element.renderObject.position = element.sphericalPosition;
            element.renderObject.visible = element.visible;
            element.renderObject.material.matter_state = element.matter_state;
        }
    }
    
    // === RUNTIME INTEGRATION METHODS ===
    
    processFrame(): void {
        this.updateFrame();
    }
    
    addElement(id: string, element: Partial<HSMLElement>): void {
        const hsmlElement = this.createElement(element.tagName || 'sphere', element);
        this.elementRegistry.set(id, hsmlElement);
        this.renderQueue.add(id);
    }
    
    removeElement(id: string): void {
        const element = this.elementRegistry.get(id);
        if (element && element.parent) {
            this.removeChild(element.parent, element);
        }
        this.elementRegistry.delete(id);
    }
    
    updateElement(id: string, updates: Partial<HSMLElement>): void {
        const element = this.elementRegistry.get(id);
        if (element) {
            // Update element properties
            if (updates.sphericalPosition) {
                element.sphericalPosition = updates.sphericalPosition;
            }
            if (updates.solidAngleSize) {
                element.solidAngleSize = updates.solidAngleSize;
            }
            if (updates.visible !== undefined) {
                element.visible = updates.visible;
            }
            if (updates.matter_state) {
                element.matter_state = updates.matter_state;
            }
            if (updates.material_properties) {
                element.material_properties = updates.material_properties;
            }
            this.renderQueue.add(id);
        }
    }
    
    // === PUBLIC INTERFACE ===
    
    getViewport(): HSMLViewport | null {
        return this.viewport;
    }
    
    getRootElement(): HSMLElement | null {
        return this.rootElement;
    }
    
    setRootElement(element: HSMLElement): void {
        this.rootElement = element;
    }
    
    getElementById(id: string): HSMLElement | undefined {
        return this.elementRegistry.get(id);
    }
    
    getPerformanceStats() {
        return {
            frameCount: this.frameCount,
            raycastingTime: this.raycastingTime,
            domUpdateTime: this.domUpdateTime,
            elementCount: this.elementRegistry.size,
            renderQueueSize: this.renderQueue.size,
            raycastCacheSize: this.raycastCache.size,
            cornerCacheSize: this.cornerOptimization?.interpolationCache.size || 0
        };
    }
    
    // === UTILITY METHODS ===
    
    pixelToSolidAngle(pixelX: number, pixelY: number): SolidAngle {
        return this.getPixelSolidAngleOptimized(pixelX, pixelY).solidAngle;
    }
    
    solidAngleToPixel(solidAngle: SolidAngle): { x: number, y: number } | null {
        // Inverse mapping (more expensive, used less frequently)
        if (!this.viewport) return null;
        
        const centerTheta = (solidAngle.theta_min + solidAngle.theta_max) / 2;
        const centerPhi = (solidAngle.phi_min + solidAngle.phi_max) / 2;
        
        // Convert back to pixel coordinates
        const physicalX = Math.tan(centerPhi) * this.viewport.viewerDistance;
        const physicalY = Math.tan(centerTheta) * this.viewport.viewerDistance;
        
        const pixelX = (physicalX + this.viewport.monitorWidth / 2) / this.viewport.monitorWidth * this.viewport.canvasElement.width;
        const pixelY = (physicalY + this.viewport.monitorHeight / 2) / this.viewport.monitorHeight * this.viewport.canvasElement.height;
        
        return { x: pixelX, y: pixelY };
    }
}

export default SolidAngleDOMProcessor;