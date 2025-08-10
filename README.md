# Smart Mirror

A modular smart mirror interface built with React. Features draggable and resizable apps that can be customized through a settings page.

## Features

- **Modular Apps**: Clock, Date, Weather, and News apps
- **Draggable Interface**: Apps can be dragged around the mirror surface
- **Resizable Apps**: Resize apps by dragging the corner handle
- **Settings Page**: Enable/disable apps and configure their settings
- **Persistent Layout**: App positions and sizes are saved between sessions
- **Black Background**: Optimized for mirror display

## Apps

### Clock App
- Digital clock display
- 12/24 hour format toggle
- Show/hide seconds option
- Adjustable font size

### Date App
- Current date display
- Multiple date format options
- Show/hide year option

### Weather App
- Current weather conditions
- Location-based weather data
- Temperature units (Celsius/Fahrenheit)
- Weather details toggle

### News App
- Latest news headlines
- Multiple news sources
- Configurable refresh interval
- Adjustable number of items

## Installation

1. Clone or copy the SmartMirror folder
2. Navigate to the project directory:
   ```bash
   cd SmartMirror
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
5. Open [http://localhost:3000](http://localhost:3000) to view the smart mirror

## Spotify Setup

This project includes an optional Spotify widget that shows your currently playing track.

To enable it:

1. Create a Spotify developer app
   - Visit the Spotify Developer Dashboard: [developer.spotify.com](https://developer.spotify.com/)
   - Create an app and note your Client ID and Client Secret.
2. Add a Redirect URI
   - In your app’s settings, add a redirect URI that matches your environment, e.g.:
     - `http://localhost:3000/callback` (if running on port 3000)
     - `http://localhost:8888/callback` (if running on port 8888)
3. Configure in Settings
   - Open the Smart Mirror → Settings → Spotify
   - Paste Client ID and Client Secret
   - Ensure Redirect URI matches the one registered in the Spotify Dashboard
4. Sign in
   - Click “Sign in with Spotify” and complete the login. You’ll be redirected back and the widget will start showing your current track.

Scopes used: `user-read-currently-playing`, `user-read-playback-state` (see Spotify Web API docs at [developer.spotify.com](https://developer.spotify.com/)).

## Usage

### Main Mirror View
- Apps are displayed on a black background
- Drag apps by clicking and holding anywhere on the app
- Resize apps by dragging the corner handle (bottom-right)
- Click the settings gear icon to access the settings page

### Settings Page
- Toggle apps on/off using the switches
- Click on an app to view its specific settings
- Changes are saved automatically
- Return to the mirror view using the "Back to Mirror" button

## Customization

### Adding New Apps
1. Create a new app component in `src/apps/`
2. Add the app configuration to `src/data/apps.js`
3. Import and add the component to the component map in `src/pages/SmartMirror.jsx`
4. Add settings UI to `src/pages/Settings.jsx`

### Styling
- The project uses Tailwind CSS for styling
- Apps have a semi-transparent black background with white borders
- Modify `src/index.css` for global styles

## Dependencies

- React 18.2.0
- React Router DOM 6.8.1
- Tailwind CSS 3.3.2
- React Draggable 4.4.5
- React Resizable 3.0.5

## Architecture

The project follows a modular architecture similar to the HoloMat example:
- **Pages**: Main mirror view and settings page
- **Apps**: Individual app components
- **Components**: Reusable components like DraggableApp
- **Data**: App registry and configuration management

## Browser Support

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (touch support for dragging)

## License

This project is intended for personal use and learning purposes.
