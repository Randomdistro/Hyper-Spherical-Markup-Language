# 🏗️ HSML Production Project Structure

## 📁 Directory Organization

```
HSML_Production/
├── 📁 src/                                # Source code
│   ├── 📁 core/                           # Core HSML framework
│   │   ├── 📁 runtime/                    # Runtime system (Pure Spherical)
│   │   │   ├── hsml-runtime.ts            # Main runtime orchestrator
│   │   │   ├── spherical-coordinate-processor.ts  # Pure spherical mathematics
│   │   │   ├── spherical-physics-engine.ts        # Physics simulation
│   │   │   ├── solid-angle-dom-processor.ts       # DOM with solid angles
│   │   │   ├── webgl-spherical-renderer.ts        # GPU rendering
│   │   │   └── runtime-optimization-engine.ts     # Performance optimization
│   │   ├── 📁 language/                   # Language processing pipeline
│   │   │   ├── hsml-lexer.ts              # Multi-language lexer
│   │   │   ├── hsml-parser.ts             # AST parser
│   │   │   ├── semantic-analyzer.ts       # Semantic validation
│   │   │   ├── hsml-ir.ts                 # Intermediate representation
│   │   │   ├── code-generator.ts          # Code generation
│   │   │   └── compilation-orchestrator.ts # Compilation pipeline
│   │   └── 📁 math/                       # Mathematical foundations
│   │       ├── spherical-mathematics.ts   # Core spherical math
│   │       ├── solid-angle-calculations.ts # Solid angle operations
│   │       └── sdt-framework.ts           # Spherical Divergence Theory
│   ├── 📁 demos/                          # Example applications
│   │   ├── 📁 hello-sphere/               # Basic demo
│   │   │   ├── hello-sphere.hsml          # HSML markup
│   │   │   ├── hello-sphere.csss          # CSSS styling
│   │   │   ├── hello-sphere.shape         # ShapeScript behaviors
│   │   │   ├── hello-sphere.styb          # StyleBot rendering
│   │   │   ├── sphere-demo.hsml           # Additional demo
│   │   │   └── sphere-demo.csss           # Additional styling
│   │   └── 📁 advanced-demos/             # Complex examples
│   ├── 📁 tests/                          # Test suites
│   │   ├── 📁 unit/                       # Unit tests
│   │   ├── 📁 integration/                # Integration tests
│   │   │   └── integration-test.ts        # Main integration test
│   │   └── 📁 performance/                # Performance benchmarks
│   ├── 📁 tools/                          # Development tools
│   │   ├── 📁 cli/                        # Command line interface
│   │   │   └── hsml-cli.ts                # HSML CLI tool
│   │   └── 📁 build/                      # Build utilities
│   └── 📁 types/                          # TypeScript definitions
│       ├── hsml.d.ts                      # HSML type definitions
│       ├── csss.d.ts                      # CSSS type definitions
│       ├── shape.d.ts                     # ShapeScript type definitions
│       └── styb.d.ts                      # StyleBot type definitions
├── 📁 docs/                               # Documentation
│   ├── 📁 api/                            # API documentation
│   ├── 📁 guides/                         # User guides
│   └── 📁 architecture/                   # Architecture documentation
├── 📁 config/                             # Configuration files
│   ├── jest.config.js                     # Test configuration
│   └── webpack.config.js                  # Build configuration
├── 📁 scripts/                            # Build/deploy scripts
│   ├── simple-test.ts                     # Simple test script
│   ├── final-test.js                      # Final test script
│   └── run-tests.js                       # Test runner
├── 📁 dist/                               # Build output
├── 📁 build/                              # Temporary build files
├── 📄 tsconfig.json                       # TypeScript configuration
├── 📄 package.json                        # NPM configuration
├── 📄 README.md                           # Project overview
└── 📄 PROJECT_STRUCTURE.md               # This file
```

## 🚀 Key Design Principles

### 1. **Pure Spherical Architecture**
- **NO CARTESIAN COORDINATES** - All calculations use (r, θ, φ)
- **Solid Angle Mathematics** - Every pixel is a steradian window
- **4π Space Coverage** - Complete spherical coordinate system

### 2. **Modular Component Design**
- **Core Runtime** - Independent runtime system
- **Language Pipeline** - Complete compilation toolchain
- **Mathematical Foundation** - Pure spherical mathematics

### 3. **Enterprise File Organization**
- **Separation of Concerns** - Clear module boundaries
- **TypeScript Paths** - Clean import aliases
- **Scalable Structure** - Ready for production deployment

## 📋 Import Path Aliases

Use these TypeScript path aliases for clean imports:

```typescript
// Core imports
import { HSMLRuntime } from '@runtime/hsml-runtime';
import { SphericalCoordinateProcessor } from '@runtime/spherical-coordinate-processor';
import { HSMLLexer } from '@language/hsml-lexer';

// Math imports  
import { SolidAngleCalculator } from '@math/solid-angle-calculations';

// Test imports
import { IntegrationTest } from '@tests/integration/integration-test';

// Demo imports
import { HelloSphereDemo } from '@demos/hello-sphere';
```

## 🏭 Build Process

1. **Development**: `npm run dev`
2. **Testing**: `npm test`
3. **Building**: `npm run build`
4. **Production**: `npm run start`

## 🔧 Configuration

- **TypeScript**: Configured for ES2020 with strict mode
- **Testing**: Jest with comprehensive test coverage
- **Building**: Webpack with optimized production builds
- **Linting**: ESLint with HSML-specific rules

---

**🌐 HSML Framework - Revolutionizing 3D Web Development with Pure Spherical Mathematics**