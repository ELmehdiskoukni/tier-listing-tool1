# Export Features for Tier Listing Tool

## Overview
The Tier Listing Tool now includes comprehensive export functionality that allows users to export their tier boards in multiple formats for sharing, presentation, and documentation purposes.

## Supported Export Formats

### 1. PDF Export
- **High-quality vector-based export**
- **Page orientation options**: Landscape or Portrait
- **Multi-page support**: Automatically splits content across pages if needed
- **Perfect for**: Reports, documentation, and professional presentations

### 2. Microsoft Word Document (.docx)
- **Structured table format**
- **Clean, editable text**
- **Professional formatting**
- **Perfect for**: Reports, documentation, and collaborative editing

### 3. PowerPoint Presentation (.pdf)
- **Landscape orientation optimized for presentations**
- **High-resolution image export**
- **Can be imported into PowerPoint**
- **Perfect for**: Presentations and slideshows

### 4. JPEG Image
- **Raster image format**
- **Quality options**: High, Medium, Low
- **Universal compatibility**
- **Perfect for**: Web sharing, social media, and quick previews

### 5. PNG Image
- **Lossless image format**
- **Transparency support**
- **Quality options**: High, Medium, Low
- **Perfect for**: Web graphics, logos, and high-quality images

## Export Options

### Content Selection
- **Include Source Area**: Export the source cards section above the tier board
- **Include Comments**: Show comment counts on cards in the export
- **Include Hidden Cards**: Include cards marked as hidden in the export

### Quality Settings
- **Image Quality**: Adjust quality for image exports (High/Medium/Low)
- **Page Orientation**: Choose between Landscape and Portrait for PDF exports

## How to Use

1. **Access Export**: Click the "Export Board" button in the top-right corner of the tier board
2. **Choose Format**: Select your desired export format from the available options
3. **Configure Options**: Adjust export settings based on your needs
4. **Preview**: Review the preview to ensure the export will look as expected
5. **Export**: Click the export button to download your file

## Technical Implementation

### Dependencies Used
- **html2canvas**: For converting HTML to canvas for image/PDF generation
- **jsPDF**: For PDF generation and manipulation
- **docx**: For Microsoft Word document creation
- **file-saver**: For handling file downloads

### Features
- **Real-time preview**: See exactly what will be exported
- **Responsive design**: Works on all screen sizes
- **Error handling**: Graceful error handling with user feedback
- **Loading states**: Visual feedback during export process
- **Cross-browser compatibility**: Works in all modern browsers

## File Naming
Exported files are automatically named:
- `tier-board.pdf` for PDF exports
- `tier-board.docx` for Word documents
- `tier-board-presentation.pdf` for PowerPoint exports
- `tier-board.jpeg` for JPEG images
- `tier-board.png` for PNG images

## Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Performance Notes
- **Large boards**: Exporting boards with many cards may take longer
- **Image quality**: Higher quality settings result in larger file sizes
- **Memory usage**: Export process uses temporary memory for canvas operations

## Troubleshooting

### Common Issues
1. **Export fails**: Try refreshing the page and attempting again
2. **Large file sizes**: Reduce image quality settings
3. **Missing content**: Ensure all desired content is visible on screen
4. **Format issues**: Try a different export format

### Best Practices
1. **Preview first**: Always check the preview before exporting
2. **Optimize content**: Hide unnecessary cards before exporting
3. **Choose appropriate format**: Use PDF for documents, images for web sharing
4. **Check file size**: Large exports may take time to download 