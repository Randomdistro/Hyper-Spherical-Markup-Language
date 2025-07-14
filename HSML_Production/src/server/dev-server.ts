/**
 * HSML Development Server
 * Hot reloading, live preview, and development tools
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as chokidar from 'chokidar';
import { WebSocketServer } from 'ws';

interface ServerConfig {
    port: number;
    host: string;
    open: boolean;
    watch: boolean;
    root: string;
}

interface FileChange {
    type: 'added' | 'changed' | 'removed';
    path: string;
    timestamp: number;
}

class HSMLDevServer {
    private config: ServerConfig;
    private server: http.Server;
    private wss: WebSocketServer;
    private watcher: chokidar.FSWatcher | null = null;
    private clients: Set<WebSocket> = new Set();

    constructor(config: ServerConfig) {
        this.config = config;
        this.server = http.createServer(this.handleRequest.bind(this));
        this.wss = new WebSocketServer({ server: this.server });
        this.setupWebSocket();
    }

    public async start(): Promise<void> {
        try {
            console.log(`🌐 Starting HSML development server...`);
            console.log(`📍 Server: http://${this.config.host}:${this.config.port}`);
            console.log(`📁 Root: ${this.config.root}`);
            
            // Start file watching if enabled
            if (this.config.watch) {
                await this.startFileWatching();
            }
            
            // Start HTTP server
            await new Promise<void>((resolve, reject) => {
                this.server.listen(this.config.port, this.config.host, () => {
                    console.log(`✅ Development server started successfully`);
                    resolve();
                });
                
                this.server.on('error', (error) => {
                    console.error('❌ Failed to start server:', error);
                    reject(error);
                });
            });
            
            // Open browser if requested
            if (this.config.open) {
                await this.openBrowser();
            }
            
            console.log(`🚀 HSML development server ready!`);
            console.log(`📊 Live reload: ${this.config.watch ? 'enabled' : 'disabled'}`);
            
        } catch (error) {
            console.error('❌ Failed to start development server:', error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        console.log('🛑 Stopping development server...');
        
        // Stop file watching
        if (this.watcher) {
            await this.watcher.close();
        }
        
        // Close WebSocket connections
        this.clients.forEach(client => {
            client.close();
        });
        this.clients.clear();
        
        // Close HTTP server
        await new Promise<void>((resolve) => {
            this.server.close(() => resolve());
        });
        
        console.log('✅ Development server stopped');
    }

    private setupWebSocket(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('🔌 Client connected');
            this.clients.add(ws);
            
            ws.on('close', () => {
                console.log('🔌 Client disconnected');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }

    private async startFileWatching(): Promise<void> {
        console.log('👀 Starting file watcher...');
        
        this.watcher = chokidar.watch([
            path.join(this.config.root, '**/*.hsml'),
            path.join(this.config.root, '**/*.csss'),
            path.join(this.config.root, '**/*.shape'),
            path.join(this.config.root, '**/*.styb'),
            path.join(this.config.root, '**/*.ts'),
            path.join(this.config.root, '**/*.js')
        ], {
            ignored: [
                '**/node_modules/**',
                '**/dist/**',
                '**/.git/**',
                '**/*.log'
            ],
            persistent: true
        });
        
        this.watcher.on('all', (event, filePath) => {
            const change: FileChange = {
                type: event as any,
                path: filePath,
                timestamp: Date.now()
            };
            
            console.log(`📝 File ${event}: ${path.relative(this.config.root, filePath)}`);
            this.notifyClients(change);
        });
        
        console.log('✅ File watcher started');
    }

    private notifyClients(change: FileChange): void {
        const message = JSON.stringify({
            type: 'file-change',
            data: change
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const parsedUrl = url.parse(req.url || '/');
        let filePath = parsedUrl.pathname || '/';
        
        // Default to index.html for root
        if (filePath === '/') {
            filePath = '/index.html';
        }
        
        // Resolve file path
        const fullPath = path.join(this.config.root, filePath);
        
        try {
            // Check if file exists
            if (!fs.existsSync(fullPath)) {
                // Try with .hsml extension
                const hsmlPath = fullPath.replace(/\.html$/, '.hsml');
                if (fs.existsSync(hsmlPath)) {
                    await this.serveHSMLFile(hsmlPath, res);
                    return;
                }
                
                // Return 404
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            
            // Get file stats
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                // Serve directory listing or index file
                await this.serveDirectory(fullPath, res);
                return;
            }
            
            // Determine content type
            const ext = path.extname(fullPath).toLowerCase();
            const contentType = this.getContentType(ext);
            
            // Read and serve file
            const content = fs.readFileSync(fullPath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            
        } catch (error) {
            console.error('Error serving file:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
        }
    }

    private async serveHSMLFile(filePath: string, res: http.ServerResponse): Promise<void> {
        try {
            console.log(`🎨 Serving HSML file: ${path.relative(this.config.root, filePath)}`);
            
            // Read HSML content
            const hsmlContent = fs.readFileSync(filePath, 'utf8');
            
            // Generate HTML wrapper
            const htmlContent = this.generateHSMLWrapper(hsmlContent, filePath);
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
            
        } catch (error) {
            console.error('Error serving HSML file:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error processing HSML file');
        }
    }

    private generateHSMLWrapper(hsmlContent: string, filePath: string): string {
        const fileName = path.basename(filePath, '.hsml');
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HSML - ${fileName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: 'Courier New', monospace;
            color: #fff;
            overflow: hidden;
        }
        
        #hsml-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        
        #hsml-devtools {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #333;
            border-radius: 5px;
            padding: 10px;
            font-size: 12px;
            z-index: 1000;
        }
        
        .devtool-item {
            margin: 5px 0;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 5px;
        }
        
        .status-connected { background: #00ff00; }
        .status-disconnected { background: #ff0000; }
        
        #reload-button {
            background: #333;
            color: #fff;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }
        
        #reload-button:hover {
            background: #555;
        }
    </style>
</head>
<body>
    <div id="hsml-container">
        <!-- HSML content will be rendered here -->
    </div>
    
    <div id="hsml-devtools">
        <div class="devtool-item">
            <span class="status-indicator status-disconnected" id="connection-status"></span>
            <span id="connection-text">Disconnected</span>
        </div>
        <div class="devtool-item">
            <button id="reload-button">Reload</button>
        </div>
        <div class="devtool-item">
            <span id="file-info">${fileName}.hsml</span>
        </div>
    </div>
    
    <!-- HSML Runtime -->
    <script type="module">
        import HSMLRuntime from '/dist/index.js';
        
        // Initialize HSML Runtime
        const hsml = new HSMLRuntime();
        
        // HSML Content
        const hsmlContent = \`${hsmlContent.replace(/`/g, '\\`')}\`;
        
        // Render HSML content
        hsml.render(hsmlContent, document.getElementById('hsml-container'));
        
        // Development tools
        const ws = new WebSocket('ws://${this.config.host}:${this.config.port}');
        const connectionStatus = document.getElementById('connection-status');
        const connectionText = document.getElementById('connection-text');
        const reloadButton = document.getElementById('reload-button');
        
        ws.onopen = () => {
            connectionStatus.className = 'status-indicator status-connected';
            connectionText.textContent = 'Connected';
        };
        
        ws.onclose = () => {
            connectionStatus.className = 'status-indicator status-disconnected';
            connectionText.textContent = 'Disconnected';
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'file-change') {
                console.log('File changed:', message.data);
                // Auto-reload on file changes
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        };
        
        reloadButton.onclick = () => {
            window.location.reload();
        };
        
        // Error handling
        window.addEventListener('error', (event) => {
            console.error('HSML Runtime Error:', event.error);
        });
    </script>
</body>
</html>`;
    }

    private async serveDirectory(dirPath: string, res: http.ServerResponse): Promise<void> {
        try {
            const files = fs.readdirSync(dirPath);
            const fileList = files
                .filter(file => !file.startsWith('.'))
                .map(file => {
                    const fullPath = path.join(dirPath, file);
                    const stats = fs.statSync(fullPath);
                    return {
                        name: file,
                        isDirectory: stats.isDirectory(),
                        size: stats.size,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => {
                    // Directories first, then files
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                });
            
            const html = this.generateDirectoryListing(fileList, dirPath);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            
        } catch (error) {
            console.error('Error serving directory:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading directory');
        }
    }

    private generateDirectoryListing(files: any[], dirPath: string): string {
        const relativePath = path.relative(this.config.root, dirPath);
        const title = relativePath || 'Root';
        
        const fileRows = files.map(file => {
            const icon = file.isDirectory ? '📁' : '📄';
            const size = file.isDirectory ? '-' : this.formatFileSize(file.size);
            const modified = file.modified.toLocaleDateString();
            const link = file.isDirectory ? `${file.name}/` : file.name;
            
            return `
                <tr>
                    <td>${icon} <a href="${link}">${file.name}</a></td>
                    <td>${size}</td>
                    <td>${modified}</td>
                </tr>
            `;
        }).join('');
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HSML Dev Server - ${title}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #1a1a1a;
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            background: #333;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            color: #00ff00;
        }
        
        .header p {
            margin: 10px 0 0 0;
            color: #ccc;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: #2a2a2a;
            border-radius: 5px;
            overflow: hidden;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #444;
        }
        
        th {
            background: #444;
            font-weight: bold;
        }
        
        a {
            color: #00ff00;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .file-size {
            color: #888;
            font-size: 0.9em;
        }
        
        .file-date {
            color: #888;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 HSML Development Server</h1>
        <p>Directory: ${title}</p>
        <p>Server: http://${this.config.host}:${this.config.port}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Modified</th>
            </tr>
        </thead>
        <tbody>
            ${fileRows}
        </tbody>
    </table>
</body>
</html>`;
    }

    private getContentType(ext: string): string {
        const contentTypes: { [key: string]: string } = {
            '.html': 'text/html',
            '.htm': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.ts': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.hsml': 'text/html',
            '.csss': 'text/css',
            '.shape': 'application/javascript',
            '.styb': 'application/javascript'
        };
        
        return contentTypes[ext] || 'text/plain';
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    private async openBrowser(): Promise<void> {
        const url = `http://${this.config.host}:${this.config.port}`;
        
        try {
            // Try to open browser (platform-specific)
            const { exec } = require('child_process');
            const platform = process.platform;
            
            let command: string;
            switch (platform) {
                case 'darwin':
                    command = `open "${url}"`;
                    break;
                case 'win32':
                    command = `start "${url}"`;
                    break;
                default:
                    command = `xdg-open "${url}"`;
                    break;
            }
            
            exec(command, (error: any) => {
                if (error) {
                    console.log(`🌐 Please open your browser and navigate to: ${url}`);
                } else {
                    console.log(`🌐 Opened browser to: ${url}`);
                }
            });
            
        } catch (error) {
            console.log(`🌐 Please open your browser and navigate to: ${url}`);
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const config: ServerConfig = {
        port: 3000,
        host: 'localhost',
        open: false,
        watch: true,
        root: process.cwd()
    };
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
                config.port = parseInt(args[++i]);
                break;
            case '--host':
                config.host = args[++i];
                break;
            case '--open':
                config.open = true;
                break;
            case '--no-watch':
                config.watch = false;
                break;
            case '--root':
                config.root = args[++i];
                break;
        }
    }
    
    const server = new HSMLDevServer(config);
    server.start().catch(console.error);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await server.stop();
        process.exit(0);
    });
}

export { HSMLDevServer, ServerConfig }; 