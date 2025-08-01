import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import ExportPreview from './ExportPreview'

const ExportModal = ({ isOpen, onClose, tiers, sourceCards }) => {
  const [exportFormat, setExportFormat] = useState('pdf')
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    includeSourceArea: true,
    includeComments: true,
    includeHiddenCards: false,
    pageOrientation: 'landscape',
    imageQuality: 'high'
  })
  
  const boardRef = useRef(null)

  const createExportElement = () => {
    const exportDiv = document.createElement('div')
    exportDiv.className = 'export-tier-board bg-white p-6 rounded-lg shadow-lg'
    exportDiv.style.position = 'absolute'
    exportDiv.style.left = '-9999px'
    exportDiv.style.top = '-9999px'
    exportDiv.style.width = '1200px' // Fixed width for consistent exports
    exportDiv.style.backgroundColor = '#ffffff'
    
    // Create the tier board content without interactive elements
    const tierBoardContent = document.createElement('div')
    tierBoardContent.className = 'space-y-2'
    
    tiers.forEach(tier => {
      const tierRow = document.createElement('div')
      tierRow.className = 'border border-gray-300 rounded-lg overflow-hidden'
      
      const tierContent = document.createElement('div')
      tierContent.className = 'flex items-stretch min-h-[80px]'
      
      // Tier label (no controls, no buttons)
      const tierLabel = document.createElement('div')
      tierLabel.className = `flex items-center justify-center w-16 ${tier.color} border-r border-gray-300`
      tierLabel.innerHTML = `<span class="text-xl font-bold text-gray-800">${tier.name}</span>`
      
      // Cards area (no add button, no controls)
      const cardsArea = document.createElement('div')
      cardsArea.className = 'flex-1 flex items-center p-4 bg-gray-50 min-h-[80px]'
      
      const cardsContainer = document.createElement('div')
      cardsContainer.className = 'flex items-center gap-3 flex-wrap w-full'
      
      // Add cards (static only)
      tier.cards
        .filter(card => !card.hidden || exportOptions.includeHiddenCards)
        .forEach(card => {
          const cardElement = document.createElement('div')
          cardElement.className = 'bg-white border border-gray-300 rounded-lg p-3 shadow-sm min-w-[120px] max-w-[200px]'
          
          let cardContent = `<div class="font-medium text-gray-800 mb-1">${card.text}</div>`
          
          if (exportOptions.includeComments && card.comments && card.comments.length > 0) {
            cardContent += `<div class="text-xs text-gray-500">${card.comments.length} comment${card.comments.length > 1 ? 's' : ''}</div>`
          }
          
          cardElement.innerHTML = cardContent
          cardsContainer.appendChild(cardElement)
        })
      
      cardsArea.appendChild(cardsContainer)
      tierContent.appendChild(tierLabel)
      tierContent.appendChild(cardsArea)
      tierRow.appendChild(tierContent)
      tierBoardContent.appendChild(tierRow)
    })
    
    // Add source area if enabled
    if (exportOptions.includeSourceArea) {
      const sourceArea = document.createElement('div')
      sourceArea.className = 'mb-6'
      sourceArea.innerHTML = '<h3 class="text-lg font-semibold mb-2">Source Cards</h3>'
      
      const sourceGrid = document.createElement('div')
      sourceGrid.className = 'grid grid-cols-1 md:grid-cols-3 gap-4'
      
      Object.entries(sourceCards).forEach(([category, cards]) => {
        const categoryDiv = document.createElement('div')
        categoryDiv.className = 'border rounded p-3'
        categoryDiv.innerHTML = `
          <h4 class="font-medium capitalize mb-2">${category}</h4>
          <div class="space-y-1">
            ${cards.slice(0, 3).map(card => 
              `<div class="text-sm bg-gray-100 p-1 rounded">${card.text}</div>`
            ).join('')}
            ${cards.length > 3 ? `<div class="text-xs text-gray-500">+${cards.length - 3} more...</div>` : ''}
          </div>
        `
        sourceGrid.appendChild(categoryDiv)
      })
      
      sourceArea.appendChild(sourceGrid)
      exportDiv.insertBefore(sourceArea, tierBoardContent)
    }
    
    exportDiv.appendChild(tierBoardContent)
    document.body.appendChild(exportDiv)
    
    return exportDiv
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Create a clean export version without interactive elements
      const exportElement = createExportElement()
      
      // Wait a bit for the element to be rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(exportElement)
          break
        case 'doc':
          await exportToDOC()
          break
        case 'ppt':
          await exportToPPT(exportElement)
          break
        case 'jpeg':
          await exportToImage('jpeg', exportElement)
          break
        case 'png':
          await exportToImage('png', exportElement)
          break
        default:
          console.error('Unsupported export format:', exportFormat)
      }
      
      // Clean up the temporary element
      if (exportElement && exportElement.parentNode) {
        exportElement.parentNode.removeChild(exportElement)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async (element) => {
    try {
      console.log('Starting PDF export...')
      console.log('Element:', element)
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: true
      })

      console.log('Canvas created:', canvas)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: exportOptions.pageOrientation,
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save('tier-board.pdf')
      console.log('PDF export completed successfully')
    } catch (error) {
      console.error('PDF export error:', error)
      throw error
    }
  }

  const exportToDOC = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Tier Board Export",
                bold: true,
                size: 32
              })
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })]
          }),
          ...generateTierTableRows()
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    saveAs(new Blob([buffer]), 'tier-board.docx')
  }

  const generateTierTableRows = () => {
    const rows = []
    
    // Header row
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Tier", bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Cards", bold: true })] })],
            width: { size: 80, type: WidthType.PERCENTAGE }
          })
        ]
      })
    )

    // Data rows
    tiers.forEach(tier => {
      const cardTexts = tier.cards
        .filter(card => !card.hidden || exportOptions.includeHiddenCards)
        .map(card => {
          let text = card.text
          if (exportOptions.includeComments && card.comments && card.comments.length > 0) {
            text += ` (${card.comments.length} comments)`
          }
          return text
        })
        .join(', ')

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: tier.name, bold: true })] })]
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cardTexts || 'No cards' })] })]
            })
          ]
        })
      )
    })

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows
      })
    ]
  }

  const exportToPPT = async (element) => {
    // For PPT, we'll create a simple HTML representation and convert to image
    // Then create a PDF that can be opened in PowerPoint
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 297 // A4 landscape width
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    pdf.save('tier-board-presentation.pdf')
  }

  const exportToImage = async (format, element) => {
    try {
      console.log(`Starting ${format.toUpperCase()} export...`)
      console.log('Element:', element)
      
      const canvas = await html2canvas(element, {
        scale: exportOptions.imageQuality === 'high' ? 2 : 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true
      })

      console.log('Canvas created:', canvas)

      canvas.toBlob((blob) => {
        saveAs(blob, `tier-board.${format}`)
        console.log(`${format.toUpperCase()} export completed successfully`)
      }, `image/${format}`)
    } catch (error) {
      console.error(`${format.toUpperCase()} export error:`, error)
      throw error
    }
  }

  const renderBoardPreview = () => {
    return (
      <div ref={boardRef}>
        <ExportPreview 
          tiers={tiers}
          sourceCards={sourceCards}
          exportOptions={exportOptions}
        />
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999999999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto z-[999999999999]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Export Tier Board</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Export Format</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'pdf', label: 'PDF', icon: '📄' },
                    { value: 'doc', label: 'Word Doc', icon: '📝' },
                    { value: 'ppt', label: 'PowerPoint', icon: '📊' },
                    { value: 'jpeg', label: 'JPEG Image', icon: '🖼️' },
                    { value: 'png', label: 'PNG Image', icon: '🖼️' }
                  ].map(format => (
                    <button
                      key={format.value}
                      onClick={() => setExportFormat(format.value)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        exportFormat === format.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{format.icon}</div>
                      <div className="font-medium">{format.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Export Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSourceArea}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeSourceArea: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    Include Source Area
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeComments}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeComments: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    Include Comments
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeHiddenCards}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeHiddenCards: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    Include Hidden Cards
                  </label>
                </div>

                {['jpeg', 'png'].includes(exportFormat) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Image Quality</label>
                    <select
                      value={exportOptions.imageQuality}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        imageQuality: e.target.value
                      }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="high">High Quality</option>
                      <option value="medium">Medium Quality</option>
                      <option value="low">Low Quality</option>
                    </select>
                  </div>
                )}

                {exportFormat === 'pdf' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Page Orientation</label>
                    <select
                      value={exportOptions.pageOrientation}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        pageOrientation: e.target.value
                      }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {isExporting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </div>
                  ) : (
                    `Export as ${exportFormat.toUpperCase()}`
                  )}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Preview</h3>
              {renderBoardPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportModal 