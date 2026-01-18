# STATT - Emergency Room Wait Time Tracker

A modern web application for tracking emergency room and urgent care wait times, helping users find the nearest and fastest healthcare facilities.

## Features

- 🗺️ **Interactive Map View** - Visualize hospitals and urgent care centers on an interactive Google Maps interface
- 📋 **List View** - Browse hospitals in a detailed list format with wait times and key information
- 🔍 **Advanced Search** - Quick search with keyboard shortcuts (⌘K / Ctrl+K) and filtering options
- ⏱️ **Real-time Wait Times** - View current wait times and estimated drive times for each facility
- 🏥 **Hospital Details** - Comprehensive information including trauma levels, services, and contact info
- 🎨 **Dark Theme** - Beautiful dark theme with smooth transitions
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🚨 **Triage Assistant** - Interactive triage page to help determine if urgent care is appropriate

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Google Maps API** - Interactive maps and directions
- **Lucide React** - Beautiful icon library
- **Supabase** - Database backend (optional)

## Prerequisites

- Node.js 18+ and npm
- Google Maps API key ([Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key))

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/statt.git
cd statt
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Important:** Make sure to enable the following APIs in your Google Cloud Console:
- Maps JavaScript API
- Routes API (for directions)

### 4. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
statt/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts (Theme)
│   ├── data/           # Static data files
│   ├── lib/            # Type definitions and utilities
│   └── main.tsx        # Application entry point
├── supabase/
│   └── migrations/     # Database migrations
├── dist/               # Production build output
└── public/             # Static assets
```

## Key Components

- **MapView** - Interactive Google Maps with hospital markers
- **ListView** - Scrollable list of hospitals with details
- **SearchOverlay** - Search and filter interface
- **HospitalDetail** - Detailed hospital information modal
- **TriagePage** - Interactive triage questionnaire
- **SettingsView** - Application settings

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Maps powered by [Google Maps Platform](https://mapsplatform.google.com/)
- Icons from [Lucide](https://lucide.dev/)
