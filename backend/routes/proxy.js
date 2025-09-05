import express from 'express'
import axios from 'axios'

const router = express.Router()

// GET /api/proxy/image?url=<remote-image-url>
router.get('/image', async (req, res) => {
  try {
    const { url } = req.query
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing required query parameter: url' })
    }

    // Basic validation: allow only http/https
    const isHttp = /^https?:\/\//i.test(url)
    if (!isHttp) {
      return res.status(400).json({ error: 'Only http/https URLs are allowed' })
    }

    let contentType = 'application/octet-stream'
    let dataBuffer = null

    // Try Axios first
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': url,
        },
        maxRedirects: 5,
        timeout: 12000,
        validateStatus: () => true,
      })

      if (response.status >= 200 && response.status < 300) {
        contentType = response.headers['content-type'] || contentType
        dataBuffer = Buffer.from(response.data)
      } else {
        throw new Error(`Axios upstream status ${response.status}`)
      }
    } catch (axiosErr) {
      // Fall back to native fetch
      try {
        const fetchRes = await fetch(url, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': url,
          },
        })
        if (!fetchRes.ok) {
          return res.status(502).json({ error: `Upstream returned ${fetchRes.status}` })
        }
        contentType = fetchRes.headers.get('content-type') || contentType
        const arrayBuf = await fetchRes.arrayBuffer()
        dataBuffer = Buffer.from(arrayBuf)
      } catch (fetchErr) {
        console.error('Image proxy error:', axiosErr?.message || axiosErr, fetchErr?.message || fetchErr)
        return res.status(500).json({ error: 'Failed to fetch image' })
      }
    }

    // Security: only allow image content-types
    if (!/^image\//i.test(contentType)) {
      return res.status(415).json({ error: 'Upstream resource is not an image' })
    }

    res.set('Cache-Control', 'public, max-age=3600')
    res.set('Content-Type', contentType)
    return res.send(dataBuffer)
  } catch (err) {
    console.error('Image proxy error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch image' })
  }
})

export default router
