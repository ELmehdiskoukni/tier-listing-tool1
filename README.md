# Tier Listing Tool

A comprehensive React-based application for creating and managing tier lists with drag-and-drop functionality, card management, and export capabilities.

## Features

### Core Functionality
- **Drag & Drop Interface**: Intuitive drag-and-drop for organizing cards across tiers
- **Card Management**: Create, edit, delete, and duplicate cards with comments and images
- **Tier Management**: Add, remove, reorder, and customize tiers with colors
- **Source Cards**: Pre-populated source areas for competitors, personas, and pages

### Export & Sharing
- **Multiple Export Formats**: PDF, Word Document, PowerPoint, JPEG, and PNG
- **Customizable Options**: Include/exclude source area, comments, and hidden cards
- **Quality Settings**: Adjust image quality and page orientation
- **Real-time Preview**: See exactly what will be exported before downloading

### Advanced Features
- **Card Comments**: Add detailed comments to cards for better organization
- **Image Support**: Add and manage images for cards
- **Hidden Cards**: Hide cards without deleting them
- **Responsive Design**: Works seamlessly across all device sizes

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local development URL

## Usage

### Creating a Tier Board
1. Use the source cards at the top to drag items into your tiers
2. Create new cards using the "+" button in each tier
3. Organize cards by dragging them between tiers or within the same tier

### Managing Cards
- **Right-click** on any card to access context menu options
- **Edit** card text, add comments, or change images
- **Duplicate** cards to create copies
- **Hide** cards that you don't want to see but want to keep

### Exporting Your Board
1. Click the "Export Board" button in the top-right corner
2. Choose your desired format (PDF, Word, PowerPoint, JPEG, PNG)
3. Configure export options (include source area, comments, etc.)
4. Preview the export and click "Export" to download

## Export Features

For detailed information about the export functionality, see [EXPORT_FEATURES.md](./EXPORT_FEATURES.md).

## Technologies Used

- **React 19**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **html2canvas**: HTML to canvas conversion for exports
- **jsPDF**: PDF generation library
- **docx**: Microsoft Word document creation
- **file-saver**: File download handling

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/          # React components
│   ├── TierBoard.jsx   # Main tier board component
│   ├── TierRow.jsx     # Individual tier row component
│   ├── Card.jsx        # Card component
│   ├── ExportModal.jsx # Export functionality
│   └── ...            # Other components
├── App.jsx             # Main application component
└── main.jsx           # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
