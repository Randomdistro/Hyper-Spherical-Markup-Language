/**
 * HSML Native Spherical Physics Engine
 * Pure spherical coordinate physics with matter state transitions
 */

import { 
    SphericalCoordinate, 
    SphericalVelocity, 
    SphericalAcceleration,
    SDTStateVector,
    SphericalCoordinateProcessor 
} from './spherical-coordinate-processor';

// Matter states in spherical coordinates
export enum MatterState {
    SOLID = 'solid',
    LIQUID = 'liquid',
    GAS = 'gas',
    PLASMA = 'plasma'
}

// Material properties in spherical physics
export interface SphericalMaterial {
    density: number;                    // kg/m³
    bulk_modulus: number;              // Pa (spherical compression)
    thermal_conductivity: number;       // W/m·K (radial heat flow)
    thermal_expansion: number;          // 1/K (radial expansion)
    viscosity?: number;                // Pa·s (for fluids)
    electrical_conductivity?: number;   // S/m (for plasma)
    magnetic_permeability: number;      // H/m
    dielectric_constant: number;        // ε/ε₀
    matter_state: MatterState;
    phase_transition_temperature?: {
        melting_point?: number;         // K
        boiling_point?: number;         // K
        ionization_energy?: number;     // eV
    };
}

// Spherical force field
export interface SphericalForceField {
    radial_component: (r: number, theta: number, phi: number) => number;
    theta_component: (r: number, theta: number, phi: number) => number;
    phi_component: (r: number, theta: number, phi: number) => number;
    potential_energy: (r: number, theta: number, phi: number) => number;
}

// Spherical constraint for physics simulation
export interface SphericalConstraint {
    type: 'spherical_surface' | 'radial_range' | 'angular_cone';
    parameters: {
        radius?: number;
        min_radius?: number;
        max_radius?: number;
        cone_angle?: number;
        cone_axis?: SphericalCoordinate;
    };
    restitution: number; // Bounce coefficient
}

export class SphericalPhysicsEngine {
    private static instance: SphericalPhysicsEngine;
    private coordinateProcessor: SphericalCoordinateProcessor;
    
    // Physics simulation state
    private physicsObjects = new Map<string, PhysicsObject>();
    private forceFields = new Map<string, SphericalForceField>();
    private constraints = new Map<string, SphericalConstraint>();
    
    // Simulation parameters
    private timeStep = 1/60; // 60 FPS
    private gravity = { r: -9.81, theta: 0, phi: 0 }; // Radial gravity
    private universalConstants = {
        G: 6.67430e-11,    // Gravitational constant
        k_e: 8.9875517923e9, // Coulomb's constant
        c: 299792458,      // Speed of light
        h: 6.62607015e-34  // Planck's constant
    };
    
    // Performance tracking
    private simulationTime = 0;
    private frameCount = 0;
    private lastPerformanceReport = 0;
    
    static getInstance(): SphericalPhysicsEngine {
        if (!SphericalPhysicsEngine.instance) {
            SphericalPhysicsEngine.instance = new SphericalPhysicsEngine();
        }
        return SphericalPhysicsEngine.instance;
    }
    
    private constructor() {
        this.coordinateProcessor = SphericalCoordinateProcessor.getInstance();
    }
    
    // === PHYSICS OBJECT MANAGEMENT ===
    
    addPhysicsObject(id: string, object: PhysicsObject): void {
        this.physicsObjects.set(id, object);
    }
    
    removePhysicsObject(id: string): void {
        this.physicsObjects.delete(id);
    }
    
    getPhysicsObject(id: string): PhysicsObject | undefined {
        return this.physicsObjects.get(id);
    }
    
    // === MATTER STATE PHYSICS ===
    
    /**
     * Solid state physics in spherical coordinates
     */
    private calculateSolidPhysics(object: PhysicsObject, deltaTime: number): void {
        const material = object.material;
        
        // Spherical elastic deformation
        const strain = this.calculateSphericalStrain(object);
        const stress = this.calculateSphericalStress(strain, material);
        
        // Hooke's law in spherical coordinates
        const elastic_force = this.calculateElasticForce(stress, object.geometry);
        
        // Thermal expansion (radial)
        const thermal_expansion = material.thermal_expansion * 
                                 (object.state.material_properties.temperature - 293.15);
        object.geometry.radius *= (1 + thermal_expansion * deltaTime);
        
        // Apply elastic forces
        this.applyForce(object, elastic_force);
    }
    
    /**
     * Liquid state physics in spherical coordinates
     */
    private calculateLiquidPhysics(object: PhysicsObject, deltaTime: number): void {
        const material = object.material;
        
        // Spherical fluid dynamics
        const pressure_gradient = this.calculateSphericalPressureGradient(object);
        const viscous_force = this.calculateViscousForce(object, material.viscosity!);
        
        // Buoyancy in spherical coordinates
        const buoyancy_force = this.calculateSphericalBuoyancy(object);
        
        // Surface tension (spherical interface curvature)
        const surface_tension_force = this.calculateSphericalSurfaceTension(object);
        
        // Combine fluid forces
        const total_force: SphericalCoordinate = {
            r: -pressure_gradient.r + viscous_force.r + buoyancy_force.r + surface_tension_force.r,
            theta: -pressure_gradient.theta + viscous_force.theta + buoyancy_force.theta + surface_tension_force.theta,
            phi: -pressure_gradient.phi + viscous_force.phi + buoyancy_force.phi + surface_tension_force.phi
        };
        
        this.applyForce(object, total_force);
    }
    
    /**
     * Gas state physics in spherical coordinates
     */
    private calculateGasPhysics(object: PhysicsObject, deltaTime: number): void {
        const material = object.material;
        const state = object.state;
        
        // Ideal gas law in spherical coordinates: PV = nRT
        const volume = this.coordinateProcessor.sphericalVolume(object.geometry.radius);
        const pressure = (state.material_properties.density / material.density) * 
                        8.314 * state.material_properties.temperature / 0.029; // Approximate molecular weight
        
        // Pressure gradient force
        const pressure_force = this.calculatePressureGradientForce(object, pressure);
        
        // Random molecular motion (Brownian motion in spherical coordinates)
        const brownian_force = this.calculateBrownianMotion(object, state.material_properties.temperature);
        
        // Gas expansion/compression
        const expansion_rate = pressure / material.bulk_modulus;
        object.geometry.radius *= (1 + expansion_rate * deltaTime);
        
        // Apply gas forces
        const total_force: SphericalCoordinate = {
            r: pressure_force.r + brownian_force.r,
            theta: pressure_force.theta + brownian_force.theta,
            phi: pressure_force.phi + brownian_force.phi
        };
        
        this.applyForce(object, total_force);
    }
    
    /**
     * Plasma state physics in spherical coordinates
     */
    private calculatePlasmaPhysics(object: PhysicsObject, deltaTime: number): void {
        const material = object.material;
        const state = object.state;
        
        // Electromagnetic forces in spherical coordinates
        const E_field = state.electromagnetic_field;
        const B_field = { 
            r: state.electromagnetic_field.B_r, 
            theta: state.electromagnetic_field.B_theta, 
            phi: state.electromagnetic_field.B_phi 
        };
        
        // Lorentz force: F = q(E + v × B) in spherical coordinates
        const lorentz_force = this.calculateLorentzForce(object, E_field, B_field);
        
        // Plasma pressure (electron + ion pressure)
        const plasma_pressure = this.calculatePlasmaPresure(object);
        const pressure_force = this.calculatePressureGradientForce(object, plasma_pressure);
        
        // Electromagnetic wave propagation
        const wave_force = this.calculateElectromagneticWaveForce(object);
        
        // Apply plasma forces
        const total_force: SphericalCoordinate = {
            r: lorentz_force.r + pressure_force.r + wave_force.r,
            theta: lorentz_force.theta + pressure_force.theta + wave_force.theta,
            phi: lorentz_force.phi + pressure_force.phi + wave_force.phi
        };
        
        this.applyForce(object, total_force);
    }
    
    // === FORCE CALCULATIONS ===
    
    private calculateSphericalStrain(object: PhysicsObject): SphericalCoordinate {
        // Strain in spherical coordinates based on deformation
        const original_radius = object.geometry.original_radius || object.geometry.radius;
        const radial_strain = (object.geometry.radius - original_radius) / original_radius;
        
        return {
            r: radial_strain,
            theta: 0, // Angular strains would require more complex geometry
            phi: 0
        };
    }
    
    private calculateSphericalStress(strain: SphericalCoordinate, material: SphericalMaterial): SphericalCoordinate {
        // Hooke's law in spherical coordinates
        return {
            r: material.bulk_modulus * strain.r,
            theta: material.bulk_modulus * strain.theta,
            phi: material.bulk_modulus * strain.phi
        };
    }
    
    private calculateElasticForce(stress: SphericalCoordinate, geometry: any): SphericalCoordinate {
        const surface_area = this.coordinateProcessor.sphericalSurfaceArea(geometry.radius);
        
        return {
            r: stress.r * surface_area,
            theta: stress.theta * surface_area,
            phi: stress.phi * surface_area
        };
    }
    
    private calculateSphericalPressureGradient(object: PhysicsObject): SphericalCoordinate {
        // Pressure gradient in spherical coordinates using divergence
        const pressure_field = (coord: SphericalCoordinate) => {
            const distance = this.coordinateProcessor.sphericalDistance(coord, object.state.position);
            return object.state.material_properties.pressure * Math.exp(-distance / 10); // Exponential decay
        };
        
        return this.coordinateProcessor.sphericalGradient(pressure_field, object.state.position);
    }
    
    private calculateViscousForce(object: PhysicsObject, viscosity: number): SphericalCoordinate {
        // Viscous drag in spherical coordinates (Stokes law adapted)
        const velocity = object.state.velocity;
        const drag_coefficient = 6 * Math.PI * viscosity * object.geometry.radius;
        
        return {
            r: -drag_coefficient * velocity.v_r,
            theta: -drag_coefficient * velocity.v_theta,
            phi: -drag_coefficient * velocity.v_phi
        };
    }
    
    private calculateSphericalBuoyancy(object: PhysicsObject): SphericalCoordinate {
        // Buoyancy in spherical coordinates
        const volume = this.coordinateProcessor.sphericalVolume(object.geometry.radius);
        const fluid_density = 1000; // Water density as reference
        const buoyancy_magnitude = volume * fluid_density * 9.81;
        
        return {
            r: buoyancy_magnitude, // Upward (outward radial)
            theta: 0,
            phi: 0
        };
    }
    
    private calculateSphericalSurfaceTension(object: PhysicsObject): SphericalCoordinate {
        // Surface tension creates inward radial force
        const surface_tension_coefficient = 0.072; // Water surface tension
        const circumference = 2 * Math.PI * object.geometry.radius;
        const surface_tension_force = surface_tension_coefficient * circumference;
        
        return {
            r: -surface_tension_force, // Inward
            theta: 0,
            phi: 0
        };
    }
    
    private calculatePressureGradientForce(object: PhysicsObject, pressure: number): SphericalCoordinate {
        // Force from pressure gradient
        const volume = this.coordinateProcessor.sphericalVolume(object.geometry.radius);
        const pressure_gradient_magnitude = pressure / object.geometry.radius;
        
        return {
            r: -pressure_gradient_magnitude * volume,
            theta: 0,
            phi: 0
        };
    }
    
    private calculateBrownianMotion(object: PhysicsObject, temperature: number): SphericalCoordinate {
        // Random thermal motion in spherical coordinates
        const k_B = 1.380649e-23; // Boltzmann constant
        const thermal_energy = k_B * temperature;
        const random_magnitude = Math.sqrt(thermal_energy / object.state.material_properties.density);
        
        return {
            r: random_magnitude * (Math.random() - 0.5),
            theta: random_magnitude * (Math.random() - 0.5),
            phi: random_magnitude * (Math.random() - 0.5)
        };
    }
    
    private calculateLorentzForce(
        object: PhysicsObject, 
        E_field: any, 
        B_field: SphericalCoordinate
    ): SphericalCoordinate {
        // Lorentz force in spherical coordinates
        const charge = 1.602176634e-19; // Elementary charge
        const velocity = object.state.velocity;
        
        // F = q(E + v × B)
        // Cross product v × B in spherical coordinates
        const v_cross_B = {
            r: velocity.v_theta * B_field.phi - velocity.v_phi * B_field.theta,
            theta: velocity.v_phi * B_field.r - velocity.v_r * B_field.phi,
            phi: velocity.v_r * B_field.theta - velocity.v_theta * B_field.r
        };
        
        return {
            r: charge * (E_field.E_r + v_cross_B.r),
            theta: charge * (E_field.E_theta + v_cross_B.theta),
            phi: charge * (E_field.E_phi + v_cross_B.phi)
        };
    }
    
    private calculatePlasmaPresure(object: PhysicsObject): number {
        // Plasma pressure = n*k_B*T (electron) + n*k_B*T (ion)
        const k_B = 1.380649e-23;
        const number_density = object.state.material_properties.density / (1.67262192e-27); // Approximate
        return 2 * number_density * k_B * object.state.material_properties.temperature;
    }
    
    private calculateElectromagneticWaveForce(object: PhysicsObject): SphericalCoordinate {
        // Radiation pressure from electromagnetic waves
        const c = this.universalConstants.c;
        const energy_density = object.state.material_properties.temperature * 1.380649e-23;
        const radiation_pressure = energy_density / c;
        
        return {
            r: radiation_pressure * this.coordinateProcessor.sphericalSurfaceArea(object.geometry.radius),
            theta: 0,
            phi: 0
        };
    }
    
    // === PHYSICS SIMULATION STEP ===
    
    simulatePhysicsStep(deltaTime: number = this.timeStep): void {
        this.frameCount++;
        const stepStartTime = performance.now();
        
        // Update all physics objects
        for (const [id, object] of this.physicsObjects) {
            // Apply matter state specific physics
            switch (object.material.matter_state) {
                case MatterState.SOLID:
                    this.calculateSolidPhysics(object, deltaTime);
                    break;
                case MatterState.LIQUID:
                    this.calculateLiquidPhysics(object, deltaTime);
                    break;
                case MatterState.GAS:
                    this.calculateGasPhysics(object, deltaTime);
                    break;
                case MatterState.PLASMA:
                    this.calculatePlasmaPhysics(object, deltaTime);
                    break;
            }
            
            // Apply global forces (gravity, electromagnetic fields)
            this.applyGlobalForces(object);
            
            // Apply constraints
            this.applyConstraints(object);
            
            // Update state vector
            object.state = this.coordinateProcessor.updateSDTStateVector(
                object.state, 
                object.accumulated_force, 
                deltaTime
            );
            
            // Reset accumulated forces
            object.accumulated_force = { r: 0, theta: 0, phi: 0 };
            
            // Check for matter state transitions
            this.checkMatterStateTransitions(object);
        }
        
        // Update simulation time tracking
        const stepEndTime = performance.now();
        this.simulationTime += (stepEndTime - stepStartTime);
        
        // Performance reporting
        if (stepEndTime - this.lastPerformanceReport > 1000) {
            this.reportPerformance();
            this.lastPerformanceReport = stepEndTime;
        }
    }
    
    private applyForce(object: PhysicsObject, force: SphericalCoordinate): void {
        object.accumulated_force.r += force.r;
        object.accumulated_force.theta += force.theta;
        object.accumulated_force.phi += force.phi;
    }
    
    private applyGlobalForces(object: PhysicsObject): void {
        // Apply gravity
        this.applyForce(object, {
            r: this.gravity.r * object.state.material_properties.density,
            theta: this.gravity.theta,
            phi: this.gravity.phi
        });
        
        // Apply force fields
        for (const [id, field] of this.forceFields) {
            const pos = object.state.position;
            const field_force: SphericalCoordinate = {
                r: field.radial_component(pos.r, pos.theta, pos.phi),
                theta: field.theta_component(pos.r, pos.theta, pos.phi),
                phi: field.phi_component(pos.r, pos.theta, pos.phi)
            };
            this.applyForce(object, field_force);
        }
    }
    
    private applyConstraints(object: PhysicsObject): void {
        for (const [id, constraint] of this.constraints) {
            this.enforceConstraint(object, constraint);
        }
    }
    
    private enforceConstraint(object: PhysicsObject, constraint: SphericalConstraint): void {
        const pos = object.state.position;
        
        switch (constraint.type) {
            case 'spherical_surface':
                if (constraint.parameters.radius) {
                    const distance_to_surface = Math.abs(pos.r - constraint.parameters.radius);
                    if (distance_to_surface < 0.01) { // Collision threshold
                        // Reflect velocity
                        object.state.velocity.v_r *= -constraint.restitution;
                        // Move to surface
                        object.state.position.r = constraint.parameters.radius;
                    }
                }
                break;
                
            case 'radial_range':
                if (constraint.parameters.min_radius && pos.r < constraint.parameters.min_radius) {
                    object.state.velocity.v_r *= -constraint.restitution;
                    object.state.position.r = constraint.parameters.min_radius;
                }
                if (constraint.parameters.max_radius && pos.r > constraint.parameters.max_radius) {
                    object.state.velocity.v_r *= -constraint.restitution;
                    object.state.position.r = constraint.parameters.max_radius;
                }
                break;
        }
    }
    
    private checkMatterStateTransitions(object: PhysicsObject): void {
        const temperature = object.state.material_properties.temperature;
        const material = object.material;
        const transitions = material.phase_transition_temperature;
        
        if (!transitions) return;
        
        // Check for state transitions
        if (material.matter_state === MatterState.SOLID && 
            transitions.melting_point && temperature > transitions.melting_point) {
            material.matter_state = MatterState.LIQUID;
        }
        
        if (material.matter_state === MatterState.LIQUID && 
            transitions.boiling_point && temperature > transitions.boiling_point) {
            material.matter_state = MatterState.GAS;
        }
        
        if (material.matter_state === MatterState.GAS && 
            transitions.ionization_energy && temperature > transitions.ionization_energy! / 1.380649e-23) {
            material.matter_state = MatterState.PLASMA;
        }
    }
    
    // === PERFORMANCE MONITORING ===
    
    private reportPerformance(): void {
        const avgSimulationTime = this.simulationTime / this.frameCount;
        const physicsObjectCount = this.physicsObjects.size;
        const coordProcessorStats = this.coordinateProcessor.getPerformanceStats();
        
        console.log(`Physics Engine Performance:
            Average step time: ${avgSimulationTime.toFixed(2)}ms
            Physics objects: ${physicsObjectCount}
            Frame rate: ${(1000/avgSimulationTime).toFixed(1)} FPS
            Coordinate cache hit rate: ${(coordProcessorStats.cacheHitRate * 100).toFixed(1)}%
        `);
    }
    
    // === SIMULATION CONTROL ===
    
    startSimulation(): void {
        console.log('🎬 Starting spherical physics simulation...');
        this.frameCount = 0;
        this.simulationTime = 0;
        this.lastPerformanceReport = performance.now();
        console.log('✅ Spherical physics simulation started');
    }
    
    stopSimulation(): void {
        console.log('🛑 Stopping spherical physics simulation...');
        this.reportPerformance();
        console.log('✅ Spherical physics simulation stopped');
    }
    
    updatePhysicsObject(id: string, updates: Partial<PhysicsObject>): void {
        const object = this.physicsObjects.get(id);
        if (object) {
            // Update object properties
            if (updates.state) {
                Object.assign(object.state, updates.state);
            }
            if (updates.material) {
                Object.assign(object.material, updates.material);
            }
            if (updates.geometry) {
                Object.assign(object.geometry, updates.geometry);
            }
            if (updates.mass !== undefined) {
                object.mass = updates.mass;
            }
        }
    }
    
    getObjectCount(): number {
        return this.physicsObjects.size;
    }
    
    // === PUBLIC INTERFACE ===
    
    addForceField(id: string, field: SphericalForceField): void {
        this.forceFields.set(id, field);
    }
    
    addConstraint(id: string, constraint: SphericalConstraint): void {
        this.constraints.set(id, constraint);
    }
    
    setGravity(gravity: SphericalCoordinate): void {
        this.gravity = gravity;
    }
    
    getSimulationStats() {
        return {
            frameCount: this.frameCount,
            avgFrameTime: this.simulationTime / this.frameCount,
            objectCount: this.physicsObjects.size,
            forceFieldCount: this.forceFields.size,
            constraintCount: this.constraints.size
        };
    }
}

// Physics object interface
export interface PhysicsObject {
    state: SDTStateVector;
    material: SphericalMaterial;
    geometry: {
        radius: number;
        original_radius?: number;
        shape_type: 'sphere' | 'spherical_shell' | 'point';
    };
    accumulated_force: SphericalCoordinate;
    collision_enabled: boolean;
    mass: number;
}

export default SphericalPhysicsEngine;