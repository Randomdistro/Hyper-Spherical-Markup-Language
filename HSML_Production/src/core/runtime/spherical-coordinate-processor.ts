/**
 * HSML Spherical Coordinate Processor
 * Real-time spherical mathematics engine for native 3D calculations
 */

// Core spherical coordinate types
export interface SphericalCoordinate {
    r: number;      // Radial distance
    theta: number;  // Polar angle (0 to π)
    phi: number;    // Azimuthal angle (0 to 2π)
}

// CARTESIAN COORDINATES BANNED FROM HSML!
// ONLY PURE SPHERICAL MATHEMATICS ALLOWED!

export interface SolidAngle {
    omega: number;  // Solid angle in steradians
    theta_min: number;
    theta_max: number;
    phi_min: number;
    phi_max: number;
}

// Spherical velocity and acceleration
export interface SphericalVelocity {
    v_r: number;     // Radial velocity
    v_theta: number; // Polar angular velocity
    v_phi: number;   // Azimuthal angular velocity
}

export interface SphericalAcceleration {
    a_r: number;      // Radial acceleration
    a_theta: number;  // Polar angular acceleration
    a_phi: number;    // Azimuthal angular acceleration
}

// 21-dimensional state vector for SDT integration
export interface SDTStateVector {
    position: SphericalCoordinate;
    velocity: SphericalVelocity;
    acceleration: SphericalAcceleration;
    angular_momentum: SphericalCoordinate;
    electromagnetic_field: {
        E_r: number; E_theta: number; E_phi: number;
        B_r: number; B_theta: number; B_phi: number;
    };
    material_properties: {
        density: number;
        pressure: number;
        temperature: number;
        permeability: number;
        permittivity: number;
        conductivity: number;
    };
}

export class SphericalCoordinateProcessor {
    private static instance: SphericalCoordinateProcessor;
    
    // Spherical differential operators cache
    private gradientCache = new Map<string, SphericalCoordinate>();
    private divergenceCache = new Map<string, number>();
    private laplacianCache = new Map<string, number>();
    
    // Performance optimization
    private computationCache = new Map<string, any>();
    private cacheHits = 0;
    private cacheMisses = 0;
    
    static getInstance(): SphericalCoordinateProcessor {
        if (!SphericalCoordinateProcessor.instance) {
            SphericalCoordinateProcessor.instance = new SphericalCoordinateProcessor();
        }
        return SphericalCoordinateProcessor.instance;
    }
    
    // === CORE SPHERICAL MATHEMATICS ===
    
    /**
     * Pure spherical distance calculation (no Cartesian conversion)
     */
    sphericalDistance(p1: SphericalCoordinate, p2: SphericalCoordinate): number {
        const cacheKey = `dist_${p1.r}_${p1.theta}_${p1.phi}_${p2.r}_${p2.theta}_${p2.phi}`;
        
        if (this.computationCache.has(cacheKey)) {
            this.cacheHits++;
            return this.computationCache.get(cacheKey);
        }
        
        // Great circle distance on sphere + radial difference
        const cos_angular = Math.cos(p1.theta) * Math.cos(p2.theta) + 
                           Math.sin(p1.theta) * Math.sin(p2.theta) * 
                           Math.cos(p2.phi - p1.phi);
        
        const angular_distance = Math.acos(Math.max(-1, Math.min(1, cos_angular)));
        const radial_difference = Math.abs(p2.r - p1.r);
        
        // 3D spherical distance
        const distance = Math.sqrt(
            p1.r * p1.r + p2.r * p2.r - 
            2 * p1.r * p2.r * cos_angular
        );
        
        this.computationCache.set(cacheKey, distance);
        this.cacheMisses++;
        return distance;
    }
    
    /**
     * Spherical surface area calculation
     */
    sphericalSurfaceArea(r: number): number {
        return 4 * Math.PI * r * r;
    }
    
    /**
     * Spherical volume calculation
     */
    sphericalVolume(r: number): number {
        return (4 / 3) * Math.PI * r * r * r;
    }
    
    /**
     * Solid angle calculation for viewport
     */
    calculateSolidAngle(
        theta_min: number, theta_max: number,
        phi_min: number, phi_max: number
    ): number {
        // Omega = integral of sin(theta) dtheta dphi
        return (phi_max - phi_min) * (Math.cos(theta_min) - Math.cos(theta_max));
    }
    
    // === SPHERICAL DIFFERENTIAL OPERATORS ===
    
    /**
     * Spherical gradient: ∇f = (∂f/∂r, 1/r ∂f/∂θ, 1/(r sin θ) ∂f/∂φ)
     */
    sphericalGradient(
        scalarField: (coord: SphericalCoordinate) => number,
        point: SphericalCoordinate,
        deltaR = 0.001
    ): SphericalCoordinate {
        const cacheKey = `grad_${point.r}_${point.theta}_${point.phi}`;
        
        if (this.gradientCache.has(cacheKey)) {
            return this.gradientCache.get(cacheKey)!;
        }
        
        // Partial derivatives using finite differences
        const df_dr = (scalarField({...point, r: point.r + deltaR}) - 
                      scalarField({...point, r: point.r - deltaR})) / (2 * deltaR);
        
        const deltaTheta = deltaR / point.r;
        const df_dtheta = (scalarField({...point, theta: point.theta + deltaTheta}) - 
                          scalarField({...point, theta: point.theta - deltaTheta})) / (2 * deltaTheta);
        
        const deltaPhi = deltaR / (point.r * Math.sin(point.theta));
        const df_dphi = (scalarField({...point, phi: point.phi + deltaPhi}) - 
                        scalarField({...point, phi: point.phi - deltaPhi})) / (2 * deltaPhi);
        
        const gradient: SphericalCoordinate = {
            r: df_dr,
            theta: df_dtheta / point.r,
            phi: df_dphi / (point.r * Math.sin(point.theta))
        };
        
        this.gradientCache.set(cacheKey, gradient);
        return gradient;
    }
    
    /**
     * Spherical divergence: ∇·A = 1/r² ∂(r²Ar)/∂r + 1/(r sin θ) ∂(sin θ Aθ)/∂θ + 1/(r sin θ) ∂Aφ/∂φ
     */
    sphericalDivergence(
        vectorField: (coord: SphericalCoordinate) => SphericalCoordinate,
        point: SphericalCoordinate,
        deltaR = 0.001
    ): number {
        const r = point.r;
        const theta = point.theta;
        const sin_theta = Math.sin(theta);
        
        // ∂(r²Ar)/∂r term
        const Ar_plus = vectorField({...point, r: r + deltaR}).r;
        const Ar_minus = vectorField({...point, r: r - deltaR}).r;
        const term1 = ((r + deltaR) * (r + deltaR) * Ar_plus - 
                      (r - deltaR) * (r - deltaR) * Ar_minus) / 
                      (2 * deltaR * r * r);
        
        // ∂(sin θ Aθ)/∂θ term
        const deltaTheta = deltaR / r;
        const Atheta_plus = vectorField({...point, theta: theta + deltaTheta}).theta;
        const Atheta_minus = vectorField({...point, theta: theta - deltaTheta}).theta;
        const term2 = (Math.sin(theta + deltaTheta) * Atheta_plus - 
                      Math.sin(theta - deltaTheta) * Atheta_minus) / 
                      (2 * deltaTheta * r * sin_theta);
        
        // ∂Aφ/∂φ term
        const deltaPhi = deltaR / (r * sin_theta);
        const Aphi_plus = vectorField({...point, phi: point.phi + deltaPhi}).phi;
        const Aphi_minus = vectorField({...point, phi: point.phi - deltaPhi}).phi;
        const term3 = (Aphi_plus - Aphi_minus) / (2 * deltaPhi * r * sin_theta);
        
        return term1 + term2 + term3;
    }
    
    /**
     * Spherical Laplacian: ∇²f = 1/r² ∂/∂r(r² ∂f/∂r) + 1/(r² sin θ) ∂/∂θ(sin θ ∂f/∂θ) + 1/(r² sin² θ) ∂²f/∂φ²
     */
    sphericalLaplacian(
        scalarField: (coord: SphericalCoordinate) => number,
        point: SphericalCoordinate,
        deltaR = 0.001
    ): number {
        const r = point.r;
        const theta = point.theta;
        const sin_theta = Math.sin(theta);
        
        // Radial term: 1/r² ∂/∂r(r² ∂f/∂r)
        const f_center = scalarField(point);
        const f_r_plus = scalarField({...point, r: r + deltaR});
        const f_r_minus = scalarField({...point, r: r - deltaR});
        
        const df_dr_plus = (f_r_plus - f_center) / deltaR;
        const df_dr_minus = (f_center - f_r_minus) / deltaR;
        
        const term1 = ((r + deltaR/2) * (r + deltaR/2) * df_dr_plus - 
                      (r - deltaR/2) * (r - deltaR/2) * df_dr_minus) / 
                      (deltaR * r * r);
        
        // Angular theta term
        const deltaTheta = deltaR / r;
        const f_theta_plus = scalarField({...point, theta: theta + deltaTheta});
        const f_theta_minus = scalarField({...point, theta: theta - deltaTheta});
        
        const df_dtheta_plus = (f_theta_plus - f_center) / deltaTheta;
        const df_dtheta_minus = (f_center - f_theta_minus) / deltaTheta;
        
        const term2 = (Math.sin(theta + deltaTheta/2) * df_dtheta_plus - 
                      Math.sin(theta - deltaTheta/2) * df_dtheta_minus) / 
                      (deltaTheta * r * r * sin_theta);
        
        // Angular phi term
        const deltaPhi = deltaR / (r * sin_theta);
        const f_phi_plus = scalarField({...point, phi: point.phi + deltaPhi});
        const f_phi_minus = scalarField({...point, phi: point.phi - deltaPhi});
        
        const term3 = (f_phi_plus - 2 * f_center + f_phi_minus) / 
                      (deltaPhi * deltaPhi * r * r * sin_theta * sin_theta);
        
        return term1 + term2 + term3;
    }
    
    // === NATIVE SPHERICAL CALCULATIONS ONLY ===
    // NO CARTESIAN CONVERSIONS EVER! HSML IS PURE SPHERICAL!
    
    // === SPHERICAL PHYSICS CALCULATIONS ===
    
    /**
     * Calculate spherical acceleration including centripetal and Coriolis terms
     */
    calculateSphericalAcceleration(
        position: SphericalCoordinate,
        velocity: SphericalVelocity
    ): SphericalAcceleration {
        const r = position.r;
        const theta = position.theta;
        const sin_theta = Math.sin(theta);
        const cos_theta = Math.cos(theta);
        
        // Centripetal accelerations
        const a_r_centripetal = r * velocity.v_theta * velocity.v_theta + 
                               r * sin_theta * sin_theta * velocity.v_phi * velocity.v_phi;
        
        const a_theta_centripetal = -2 * velocity.v_r * velocity.v_theta / r + 
                                   r * sin_theta * cos_theta * velocity.v_phi * velocity.v_phi;
        
        const a_phi_centripetal = -2 * velocity.v_r * velocity.v_phi / r - 
                                 2 * cos_theta * velocity.v_theta * velocity.v_phi / sin_theta;
        
        return {
            a_r: -a_r_centripetal,
            a_theta: a_theta_centripetal,
            a_phi: a_phi_centripetal
        };
    }
    
    /**
     * Calculate force interactions in spherical coordinates
     */
    calculateSphericalForce(
        source: SphericalCoordinate,
        target: SphericalCoordinate,
        forceStrength: number
    ): SphericalCoordinate {
        const distance = this.sphericalDistance(source, target);
        const forceMagnitude = forceStrength / (distance * distance);
        
        // Direction vector in spherical coordinates
        const deltaR = target.r - source.r;
        const deltaTheta = target.theta - source.theta;
        const deltaPhi = target.phi - source.phi;
        
        // Normalize direction
        const directionMagnitude = Math.sqrt(
            deltaR * deltaR + 
            (source.r * deltaTheta) * (source.r * deltaTheta) + 
            (source.r * Math.sin(source.theta) * deltaPhi) * 
            (source.r * Math.sin(source.theta) * deltaPhi)
        );
        
        return {
            r: forceMagnitude * deltaR / directionMagnitude,
            theta: forceMagnitude * deltaTheta / directionMagnitude,
            phi: forceMagnitude * deltaPhi / directionMagnitude
        };
    }
    
    // === SDT STATE VECTOR OPERATIONS ===
    
    /**
     * Update 21-dimensional state vector
     */
    updateSDTStateVector(
        state: SDTStateVector,
        forces: SphericalCoordinate,
        deltaTime: number
    ): SDTStateVector {
        // Update acceleration from forces
        const acceleration = this.calculateSphericalAcceleration(state.position, state.velocity);
        
        // Apply external forces
        acceleration.a_r += forces.r;
        acceleration.a_theta += forces.theta;
        acceleration.a_phi += forces.phi;
        
        // Update velocity
        const newVelocity: SphericalVelocity = {
            v_r: state.velocity.v_r + acceleration.a_r * deltaTime,
            v_theta: state.velocity.v_theta + acceleration.a_theta * deltaTime,
            v_phi: state.velocity.v_phi + acceleration.a_phi * deltaTime
        };
        
        // Update position
        const newPosition: SphericalCoordinate = {
            r: state.position.r + newVelocity.v_r * deltaTime,
            theta: state.position.theta + newVelocity.v_theta * deltaTime,
            phi: state.position.phi + newVelocity.v_phi * deltaTime
        };
        
        // Clamp theta to [0, π] and normalize phi to [0, 2π]
        newPosition.theta = Math.max(0, Math.min(Math.PI, newPosition.theta));
        newPosition.phi = ((newPosition.phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        
        return {
            ...state,
            position: newPosition,
            velocity: newVelocity,
            acceleration
        };
    }
    
    // === PERFORMANCE MONITORING ===
    
    getPerformanceStats() {
        const totalCacheAccess = this.cacheHits + this.cacheMisses;
        return {
            cacheHitRate: totalCacheAccess > 0 ? this.cacheHits / totalCacheAccess : 0,
            totalComputations: totalCacheAccess,
            cacheSize: this.computationCache.size
        };
    }
    
    clearCache() {
        this.computationCache.clear();
        this.gradientCache.clear();
        this.divergenceCache.clear();
        this.laplacianCache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
}

export default SphericalCoordinateProcessor;