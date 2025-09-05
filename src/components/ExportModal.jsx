import React, { useState, useRef } from 'react'
import { toast } from 'react-toastify'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import ExportPreview from './ExportPreview'
import apiClient from '../api/apiClient'

const ExportModal = ({ isOpen, onClose, tiers, sourceCards }) => {
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exportOptions, setExportOptions] = useState({
    includeSourceArea: false,
    includeComments: true,
    includeHiddenCards: false
  })
  const [isExporting, setIsExporting] = useState(false)
  const boardRef = useRef(null)

  // Define card styles based on type - same as Card.jsx
  const getCardStyle = (type) => {
    switch (type) {
      case 'image':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      case 'text':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      case 'page':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'personas':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'competitor':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      // Legacy support for old card types
      case 'sitemaps-page':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'competitor-text':
      case 'competitor-img':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'persona':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-white border-gray-300 text-gray-800'
    }
  }

  // Check if a card references a deleted source item
  const isCardFromDeletedSource = (card) => {
    // Only check cards that are from source areas (competitor, page, personas)
    if (!(card.type === 'competitor' || card.type === 'page' || card.type === 'personas')) {
      return false
    }

    // Get all current source cards
    const allSourceCards = [
      ...(sourceCards.competitors || []),
      ...(sourceCards.pages || []),
      ...(sourceCards.personas || [])
    ]
    
    // Check if there's a matching source card with the same text and type
    const matchingSourceCard = allSourceCards.find(sourceCard => 
      sourceCard.text === card.text && sourceCard.type === card.type
    )
    
    // If no matching source card is found, this card references a deleted source item
    return !matchingSourceCard
  }

  const createExportElement = () => {
    const exportDiv = document.createElement('div')
    exportDiv.className = 'bg-white p-4 rounded-lg shadow-sm border max-w-4xl mx-auto'
    exportDiv.innerHTML = '<h2 class="text-xl font-bold mb-4 text-center">Tier Board Export</h2>'
    
    const tierBoardContent = document.createElement('div')
    tierBoardContent.className = 'space-y-3'
    
    tiers.forEach(tier => {
      const tierRow = document.createElement('div')
      tierRow.className = 'border border-gray-300 rounded-lg overflow-hidden'
      
      const tierContent = document.createElement('div')
      tierContent.className = 'flex items-stretch min-h-[80px]'
      
      const tierLabel = document.createElement('div')
      tierLabel.className = `flex items-center justify-center w-16 ${tier.color} border-r border-gray-300`
      tierLabel.innerHTML = `<span class="text-xl font-bold text-gray-800">${tier.name}</span>`
      
      const cardsArea = document.createElement('div')
      cardsArea.className = 'flex-1 flex items-center p-4 bg-gray-50 min-h-[80px]'
      
      const cardsContainer = document.createElement('div')
      cardsContainer.className = 'flex items-center gap-3 flex-wrap w-full'
      
      const cards = tier.cards || []
      cards
        .filter(card => !card.hidden || exportOptions.includeHiddenCards)
        .forEach(card => {
          const cardElement = document.createElement('div')
          const isDeletedSource = isCardFromDeletedSource(card)
          
          // Apply proper card styling based on type
          const cardStyleClasses = card.hidden ? 'bg-gray-200 border-gray-400' : getCardStyle(card.type)
          cardElement.className = `${cardStyleClasses} border rounded-lg p-3 shadow-sm min-w-[120px] max-w-[200px] relative`
          
          // Check if card has an image
          const hasImage = (card.imageUrl && card.imageUrl !== null) || (card.image && card.image !== null)
          const isImageCard = card.subtype === 'image' && hasImage
          const rawImage = card.imageUrl || card.image
          const isBase64 = typeof rawImage === 'string' && rawImage.startsWith('data:image')
          
          let cardContent = ''
          
          if (isImageCard && hasImage) {
            // For external images that might have CORS issues, we'll render as text with image indicator
            // Only base64 images are guaranteed to work in html2canvas exports
            if (isBase64) {
              // Base64 image - safe to render
              cardContent = `
                <div class="flex flex-col items-center gap-1">
                  <img 
                    src="${rawImage}" 
                    alt="${card.text}"
                    class="w-12 h-12 object-cover rounded ${card.hidden ? 'opacity-50 grayscale' : ''}"
                    style="display: block;"
                  />
                  <span class="text-xs text-center leading-tight px-1 ${
                    card.hidden ? 'text-gray-500 italic' : ''
                  }">
                    ${card.hidden ? 'This item is hidden' : card.text}
                  </span>
                </div>
              `
            } else {
              // External image - use backend proxy to bypass CORS
              const baseApi = apiClient?.defaults?.baseURL || 'http://localhost:4000/api'
              const proxiedUrl = `${baseApi}/proxy/image?url=${encodeURIComponent(rawImage)}`
              cardContent = `
                <div class="flex flex-col items-center gap-1">
                  <img 
                    src="${proxiedUrl}" 
                    alt="${card.text}"
                    crossOrigin="anonymous"
                    class="w-12 h-12 object-cover rounded ${card.hidden ? 'opacity-50 grayscale' : ''}"
                    style="display: block;"
                    onerror="this.style.display='none'"
                  />
                  <span class="text-xs text-center leading-tight px-1 ${
                    card.hidden ? 'text-gray-500 italic' : ''
                  }">
                    ${card.hidden ? 'This item is hidden' : card.text}
                  </span>
                </div>
              `
            }
          } else {
            // Text card or image card without image
            cardContent = `<div class="font-medium text-gray-800 mb-1 ${
              card.hidden ? 'text-gray-500 italic line-through' : ''
            }">${card.hidden ? 'This item is hidden' : card.text}</div>`
          }
          
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
    toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async (element) => {
    try {
      console.log('Starting PDF export...')
      console.log('Element:', element)
      
      const canvas = await html2canvas(element, {
        scale: 3, // match high DPI used for PNG/JPEG
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        imageTimeout: 0, // avoid image timeout for external logos
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
    try {
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

      // Use toBlob in the browser for better compatibility
      const blob = await Packer.toBlob(doc)
      saveAs(blob, 'tier-board.docx')
      toast.success('Word document exported')
    } catch (err) {
      console.error('DOCX export error:', err)
      toast.error('Failed to export Word document. See console for details.')
      throw err
    }
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
      const cardTexts = (tier.cards || [])
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

  

  const exportToImage = async (format, element) => {
    try {
      console.log(`Starting ${format.toUpperCase()} export...`)
      console.log('Element:', element)
      
      const canvas = await html2canvas(element, {
        scale: 3, // High DPI for crisp exports
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        imageTimeout: 0, // Avoid timeout issues with images
        logging: true
      })

      console.log('Canvas created:', canvas)

      if (format === 'jpeg') {
        // For JPEG, use maximum quality (1.0)
        const dataURL = canvas.toDataURL('image/jpeg', 1.0)
        const blob = await fetch(dataURL).then(res => res.blob())
        saveAs(blob, `tier-board.${format}`)
      } else {
        // For PNG, use lossless compression
        canvas.toBlob((blob) => {
          saveAs(blob, `tier-board.${format}`)
        }, `image/${format}`)
      }
      
      console.log(`${format.toUpperCase()} export completed successfully`)
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

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:items-start">
            {/* Export Options */}
            <div className="space-y-6 lg:col-span-3 lg:flex lg:flex-col lg:justify-center lg:h-full lg:min-h-[400px]">
              <div>
                <h3 className="text-lg font-semibold mb-3">Export Format</h3>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="pdf"> PDF</option>
                  <option value="doc"> Word Document</option>
                  <option value="jpeg"> JPEG Image</option>
                  <option value="png"> PNG Image</option>
                </select>
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
            <div className="lg:col-span-7">
              <h3 className="text-lg font-semibold mb-3">Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[500px] overflow-auto">
                <div className="transform scale-75 origin-top-left w-[133%]">
                  {renderBoardPreview()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportModal 