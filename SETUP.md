# 🚀 Quick Setup Guide - Music Score Editor

This guide will help you get the Music Score Editor running on your local machine in just a few minutes.

## 📋 Prerequisites Check

Before starting, make sure you have:

### Required Software
- **Node.js** (version 18.0.0 or higher)
- **Package Manager**: pnpm (recommended), npm, or yarn

### Check Your Installation

Open your terminal/command prompt and run:

```bash
# Check Node.js version
node --version
# Should show v18.0.0 or higher

# Check if pnpm is installed
pnpm --version
# If not installed, run: npm install -g pnpm
```

## 🎯 Installation Steps

### Step 1: Extract Project Files
1. Extract the downloaded ZIP file to your desired location
2. Open terminal/command prompt
3. Navigate to the project directory:
   ```bash
   cd path/to/music-editor
   ```

### Step 2: Install Dependencies
Choose your preferred package manager:

#### Using pnpm (Recommended - Faster)
```bash
pnpm install
```

#### Using npm
```bash
npm install
```

#### Using yarn
```bash
yarn install
```

### Step 3: Start Development Server
```bash
# With pnpm
pnpm dev

# With npm
npm run dev

# With yarn
yarn dev
```

### Step 4: Open in Browser
1. Wait for the server to start (usually takes 10-30 seconds)
2. Open your browser
3. Navigate to: `http://localhost:5173`
4. You should see the Music Score Editor loading!

## ✅ Verification

If everything is working correctly, you should see:
- ✅ "React is working!"
- ✅ "Tailwind CSS is working!"
- ✅ "Application is loading!"

## 🛠️ Build for Production

When you're ready to create a production build:

```bash
# Build the application
pnpm build
# or: npm run build

# Preview the production build
pnpm preview
# or: npm run preview
```

The built files will be in the `dist/` directory.

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue: "Command not found: pnpm"
**Solution**: Install pnpm globally
```bash
npm install -g pnpm
```

#### Issue: "Node version too old"
**Solution**: Update Node.js
- Download latest LTS version from [nodejs.org](https://nodejs.org/)
- Or use a version manager like nvm

#### Issue: "Port 5173 already in use"
**Solution**: Use a different port
```bash
pnpm dev --port 3000
```

#### Issue: "Permission denied" (macOS/Linux)
**Solution**: Fix permissions
```bash
sudo chown -R $(whoami) ~/.npm
```

#### Issue: Dependencies installation fails
**Solution**: Clear cache and retry
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
pnpm install
```

### Browser Compatibility

The application works best with:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Performance Tips

1. **Close unnecessary browser tabs** for better performance
2. **Use Chrome DevTools** to monitor performance
3. **Disable browser extensions** if experiencing issues

## 📱 Mobile Development

To test on mobile devices:

1. Start the development server with host flag:
   ```bash
   pnpm dev --host
   ```

2. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

3. On your mobile device, navigate to:
   ```
   http://YOUR_IP_ADDRESS:5173
   ```

## 🎨 Customization Quick Start

### Change Theme Colors
Edit `src/App.css`:
```css
:root {
  --color-primary: #YOUR_COLOR;
  --color-background: #YOUR_BACKGROUND;
}
```

### Add New Widgets
1. Create component in `src/components/controls/`
2. Register in `src/lib/stores/widget-store.js`
3. Add to `src/components/layout/WidgetManager.jsx`

### Modify Snap Zones
Edit `src/lib/stores/widget-store.js`:
```javascript
const SNAP_ZONES = {
  CUSTOM_ZONE: { x: 100, y: 100, width: 200, height: 100, priority: 1 },
  // Add your custom zones...
};
```

## 📚 Next Steps

Once you have the application running:

1. **Explore the Interface**: Try dragging widgets around
2. **Test Keyboard Shortcuts**: Press F11 to toggle header
3. **Upload Music Files**: Drag & drop MusicXML files
4. **Customize**: Modify colors and layout to your preference
5. **Build Features**: Add your own music editing tools

## 🆘 Getting Help

If you're still having issues:

1. **Check the main README.md** for detailed documentation
2. **Look at browser console** for error messages
3. **Try the troubleshooting steps** above
4. **Search online** for specific error messages

## 🎉 Success!

If you see the Music Score Editor interface with the golden theme and working widgets, congratulations! You've successfully set up the development environment.

**Happy coding! 🎵**

---

**Estimated setup time**: 5-10 minutes  
**Difficulty**: Beginner-friendly  
**Support**: Check README.md for detailed documentation

