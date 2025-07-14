# 🌐 HSML Framework

**Revolutionary 3D Web Development with Pure Spherical Mathematics**

[![Version](https://img.shields.io/npm/v/@hsml/framework)](https://www.npmjs.com/package/@hsml/framework)
[![License](https://img.shields.io/npm/l/@hsml/framework)](https://github.com/hsml-framework/hsml/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 🚀 **Revolutionary Features**

HSML introduces **four revolutionary languages** that transform web development from flat 2D interfaces to native 3D spherical coordinate systems:

### **1. .hsml - Hyper-Spherical Markup Language**
Native 3D markup with spherical coordinates (r, θ, φ) instead of Cartesian (x, y, z)

### **2. .csss - Cascading Spherical Style Sheets**  
Material definitions, matter state physics, and spherical animations

### **3. .shape - ShapeScript Behavior Language**
Physics programming with real-time matter state transitions (solid→liquid→gas→plasma)

### **4. .styb - StyleBot Parallel Processing**
Parallel rendering agents and optimization systems

## 🎯 **Core Innovation**

### **Pure Spherical Mathematics**
- **Zero Cartesian Conversion** - Every calculation uses (r, θ, φ)
- **4π Steradian Coverage** - Complete spherical coordinate system
- **Solid Angle DOM** - Every pixel is a steradian window into 3D space
- **4-Corner Optimization** - 99.9% calculation reduction

### **Matter State Physics**
- **Real-time Transitions** - solid → liquid → gas → plasma
- **Physics-accurate Simulation** - temperature, pressure, density
- **Electromagnetic Fields** - Complete field representation

## 📦 **Installation**

```bash
# Install HSML Framework
npm install @hsml/framework

# Install CLI globally
npm install -g @hsml/framework

# Create new project
hsml init my-3d-project
cd my-3d-project
hsml dev
```

## 🎨 **Quick Start**

### **1. Create Your First HSML Project**

```bash
hsml init my-first-hsml
cd my-first-hsml
```

### **2. Write HSML Markup**

```hsml
<!DOCTYPE hsml>
<hsml-document 
    viewer-distance="650mm" 
    coordinate-system="spherical"
    physics-engine="enabled">

    <hsml-viewport 
        id="main-viewport"
        r="1000" 
        theta="0" 
        phi="0"
        background="radial-gradient(#000033, #000000)">

        <hsml-sphere 
            id="my-sphere"
            r="200" 
            theta="1.57" 
            phi="0"
            radius="50"
            material="glowing"
            matter-state="plasma"
            color="#00ffff"
            behavior="interactive">
        </hsml-sphere>

    </hsml-viewport>
</hsml-document>
```

### **3. Add CSSS Styling**

```csss
/* Material definition */
.glowing {
    material-type: plasma;
    density: 1000;
    color: #00ffff;
    glow-intensity: 1.0;
    glow-radius: 100deg;
    behavior: plasma-physics;
}

/* Interactive sphere */
#my-sphere {
    r: 200;
    theta: 1.57rad;
    phi: 0;
    radius: 50;
    material: glowing;
    hover-scale: 1.2;
    click-explosion: enabled;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0% { scale: 1.0; glow-intensity: 1.0; }
    50% { scale: 1.1; glow-intensity: 1.5; }
    100% { scale: 1.0; glow-intensity: 1.0; }
}
```

### **4. Add ShapeScript Physics**

```shape
// Physics behavior
behavior interactive-sphere {
    on-hover {
        scale: 1.2;
        color: #ffffff;
        glow-intensity: 1.5;
    }
    
    on-click {
        explode {
            force: 1000;
            particles: 100;
            color: #ff00ff;
        }
    }
    
    physics {
        matter-state: plasma;
        temperature: 5000K;
        magnetic-field: enabled;
        electric-field: enabled;
    }
}
```

### **5. Run Development Server**

```bash
hsml dev --open
```

## 🛠️ **CLI Commands**

```bash
# Initialize new project
hsml init my-project

# Start development server
hsml dev --port 3000 --open

# Build for production
hsml build --target webgl --optimization 5 --minify

# Run tests
hsml test --coverage

# Deploy to production
hsml deploy --target production

# Performance benchmarking
hsml benchmark --iterations 1000

# Generate documentation
hsml docs --serve
```

## 🎯 **Build Targets**

HSML supports multiple build targets for different environments:

### **WebGL (Default)**
```bash
hsml build --target webgl
```
- GPU-accelerated rendering
- Real-time 3D graphics
- Cross-platform compatibility

### **WebGPU (Experimental)**
```bash
hsml build --target webgpu
```
- Next-generation GPU API
- Advanced compute shaders
- Enhanced performance

### **CPU**
```bash
hsml build --target cpu
```
- Software rendering
- Fallback compatibility
- Universal support

### **WebAssembly**
```bash
hsml build --target wasm
```
- Near-native performance
- C++ compiled to WASM
- Advanced physics simulation

## 📊 **Optimization Levels**

```bash
# Level 1: Basic spherical optimization
hsml build --optimization 1

# Level 2: Physics optimization + caching
hsml build --optimization 2

# Level 3: Parallel processing + spatial indexing
hsml build --optimization 3

# Level 4: Advanced LOD + adaptive quality
hsml build --optimization 4

# Level 5: Maximum optimization (experimental)
hsml build --optimization 5
```

## 🌟 **Advanced Features**

### **Matter State Physics**
```hsml
<hsml-sphere 
    matter-state="plasma"
    temperature="5000K"
    pressure="1e5Pa"
    density="1000kg/m³"
    magnetic-field="enabled"
    electric-field="enabled">
</hsml-sphere>
```

### **Spherical Animations**
```csss
@keyframes orbital-motion {
    0% { 
        phi: 0; 
        transform: rotate(0deg);
    }
    100% { 
        phi: 6.28rad; 
        transform: rotate(360deg);
    }
}
```

### **Responsive Design**
```csss
@media (viewer-distance: < 500mm) {
    hsml-text {
        font-size: calc(var(--base-size) * 0.8);
    }
}

@media (steradian-density: < 0.001) {
    hsml-element {
        detail-level: low;
        lod-bias: -1;
    }
}
```

### **Parallel Processing**
```styb
// StyleBot parallel rendering
parallel-render {
    agents: 4;
    target: "main-viewport";
    quality: adaptive;
    optimization: level-3;
}
```

## 🔧 **Development Tools**

### **Hot Reloading**
```bash
hsml dev --watch
```
- Live file watching
- Instant browser updates
- WebSocket communication

### **Performance Monitoring**
```bash
hsml benchmark --detailed
```
- Frame rate analysis
- Memory usage tracking
- Spherical calculation metrics

### **Type Safety**
```bash
hsml type-check
```
- Full TypeScript support
- IntelliSense integration
- Compile-time error checking

## 📚 **Documentation**

- **[Language Specification](docs/LANGUAGE_SPECIFICATION.md)** - Complete language reference
- **[API Documentation](docs/api/)** - Framework API reference
- **[Examples](examples/)** - Sample projects and demos
- **[Architecture Guide](docs/architecture/)** - System architecture overview

## 🧪 **Testing**

```bash
# Run all tests
hsml test

# Run with coverage
hsml test --coverage

# Run specific test suite
hsml test --suite integration

# Watch mode
hsml test --watch
```

## 🚀 **Deployment**

### **Static Hosting**
```bash
hsml build --target webgl --minify
# Upload dist/ folder to your hosting provider
```

### **CDN Integration**
```html
<script src="https://cdn.hsml.dev/latest/hsml-webgl.js"></script>
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
git clone https://github.com/hsml-framework/hsml.git
cd hsml
npm install
npm run dev
```

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🌟 **Acknowledgments**

- **Spherical Divergence Theory** - Mathematical foundation
- **WebGL/WebGPU** - Graphics APIs
- **TypeScript** - Type safety
- **Node.js** - Runtime environment

## 📞 **Support**

- **Documentation**: [docs.hsml.dev](https://docs.hsml.dev)
- **Issues**: [GitHub Issues](https://github.com/hsml-framework/hsml/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hsml-framework/hsml/discussions)
- **Discord**: [HSML Community](https://discord.gg/hsml)

---

**🌐 HSML Framework - Revolutionizing 3D Web Development with Pure Spherical Mathematics** 